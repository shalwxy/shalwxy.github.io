---
title: "[동시성·일관성] 락 목적의 구분"
excerpt: "중복과 순서 뒤바뀜이 겹치는 Kafka 컨슈머에서 이벤트 종류별로 다른 락을 적용하는 과정."
date: 2025-09-01
published: true
tags:
  - 동시성
  - Kafka
---

## 문제

크로스체인 거래 이벤트를 받아 저장하는 컨슈머가 있다. 이벤트는 여러 종류다 — 거래 체결, 자산 전송, 토큰 스왑, 체인 간 전송(**브리지**) 등. Kafka 특성상 두 가지 어려움이 겹쳐 있다.

**어려움 1 — 같은 이벤트가 여러 번 도착한다.** at-least-once 전달이라 컨슈머가 재시작하면 같은 메시지를 다시 받을 수 있다.

**어려움 2 — 요청과 결과가 순서 없이 도착한다.** 브리지는 **두 체인에 걸친 거래**라, 출발 체인에서 "요청" 이벤트가 오고 도착 체인에서 "결과" 이벤트가 온다. 두 이벤트는 **다른 파티션·다른 토픽**에 있어 **순서가 뒤집혀 올 수 있다.**

각 이벤트를 테이블에 저장할 때 두 문제를 동시에 풀어야 한다.

## 시도 1 — 한 가지 락으로 통일

### 접근

"동시에 들어오는 걸 막으려면 락을 잡으면 된다"는 생각에 모든 종류를 **Redis `SETNX`**로 통일했다. 메시지 키(예: 거래 해시)로 락을 잡고, 이미 잡혀 있으면 skip.

```go
func (c *Consumer) Handle(ctx, evt Event) error {
    key := "ingest:" + evt.ID
    ok, _ := redis.SetNX(ctx, key, "1", 10*time.Minute)
    if !ok {
        return nil   // 다른 소비자가 처리 중 → 건너뜀
    }
    return repo.Insert(ctx, evt)
}
```

### 결과

**부분 성공** — 중복 삽입은 막는다. 그런데 **브리지 이벤트**에서 **누락**이 생겼다.

브리지는 "요청 이벤트"와 "결과 이벤트"가 **같은 거래 ID**로 들어온다. 테이블은 두 이벤트 정보를 모두 담아야 하는데(요청에는 출발지·금액, 결과에는 도착지·상태), 시도 1은 **거래 ID로 락을 잡고 INSERT만** 한다. 그래서 둘 중 **먼저 온 쪽만** 저장된다.

- 요청이 먼저 오면: 요청을 INSERT하고 키를 잡는다 → 뒤이은 결과 이벤트는 **같은 키라 SETNX에서 통째로 건너뛰어진다** → 도착지·상태가 영영 안 들어온다.
- 결과가 먼저 오면: 결과를 INSERT하고 키를 잡는다 → 요청 이벤트가 건너뛰어진다 → 출발지·금액이 빠진다.

`SETNX`는 "이미 처리 중이면 건너뜀"이라, 같은 거래 ID를 쓰는 **두 번째 이벤트가 종류와 무관하게 조용히 사라진다.** 중복은 없어도 데이터가 빠진다.

### 분석

**중복과 순서 뒤바뀜은 다른 문제**다. 중복은 "같은 이벤트가 두 번 오는 것", 순서 뒤바뀜은 "다른 이벤트가 예상과 반대 순서로 오는 것". `SETNX`로 중복을 막으면서 **다른 이벤트까지 함께 막아 버리면** 진짜 처리돼야 할 이벤트가 사라진다.

이벤트 종류를 둘로 나눠서 봐야 했다.

| 종류 | 특징 | 필요한 보호 |
|---|---|---|
| 거래·자산·스왑 (한 번에 끝남) | 같은 ID로 한 이벤트만 옴 | 중복 처리 방지 — "먼저 잡은 쪽만" |
| 브리지 (요청·결과 쌍) | 같은 ID로 두 이벤트 옴, 순서 불명 | 동시 쓰기 방지 — "먼저 온 쪽은 INSERT, 나중은 UPDATE" |

같은 ID라도 **이벤트의 의미**가 달라서 보호 방식도 다르다.

## 시도 2 — 종류별로 다른 락 (채택)

### 접근

**한 번에 끝나는 이벤트**(거래·자산·스왑): Redis `SETNX`. 먼저 잡은 쪽만 처리, 중복은 건너뛴다.

**요청·결과 쌍 이벤트**(브리지): **DB의 advisory lock** 안에서 "**먼저 조회해서 있으면 UPDATE, 없으면 INSERT**"를 한다. 두 이벤트가 동시에 들어와도 락 안에서는 순서가 생기고, 먼저 들어온 쪽이 INSERT, 나중 들어온 쪽이 UPDATE가 된다.

PostgreSQL의 `pg_advisory_xact_lock`은 트랜잭션 범위의 **애플리케이션 정의 락**이다. 트랜잭션이 끝나면 자동 해제된다.

```go
func (c *BridgeConsumer) Handle(ctx, evt BridgeEvent) error {
    return db.Transaction(ctx, func(tx) error {
        // 거래 ID를 int32 두 개로 변환해 advisory lock의 키로
        k1, k2 := hashToInt32Pair(evt.TransactionID)
        if _, err := tx.Exec("SELECT pg_advisory_xact_lock($1, $2)", k1, k2); err != nil {
            return err
        }

        // 락 안에서 조회 → 분기
        existing, err := tx.QueryBridge(ctx, evt.TransactionID)
        if err != nil { return err }

        if existing == nil {
            return tx.Insert(ctx, buildFromEvent(evt))   // 먼저 옴 → INSERT
        }
        return tx.Update(ctx, existing.ID, mergeFromEvent(existing, evt))  // 나중 옴 → UPDATE
    })
}
```

### 결과

**성공** — 중복과 순서 뒤바뀜이 모두 해결됐다.

- 거래·자산·스왑: Redis 락이 중복 처리를 막는다. 데이터가 빠지지 않는다 (같은 이벤트가 한 번만 저장되고, 다른 이벤트는 각자 처리).
- 브리지: advisory lock이 요청·결과의 **동시 쓰기**를 막는다. 어느 쪽이 먼저 와도 락 안에서 조회가 정확하고, 두 이벤트의 정보가 모두 테이블에 반영된다.

### 세부 — advisory lock 키의 형태와 메모리 관리

**int32 두 개**로 키를 만들었다. PostgreSQL의 `pg_advisory_xact_lock`은 **bigint 하나** 또는 **int32 두 개**를 키로 받는다. 거래 ID는 보통 긴 해시라, 해시 함수로 두 int32로 변환해 쓴다. 두 개짜리를 쓰면 "용도 범주 + ID" 같은 식으로 네임스페이스를 나눌 수 있다 — 서로 다른 종류의 락이 같은 키 공간을 공유하지 않도록.

**최대 5000개로 제한**했다. advisory lock은 **PostgreSQL 서버 메모리**에 보관된다. 트랜잭션이 길어지거나 커넥션이 잠기면 락이 누적되어 메모리가 부푼다. 애플리케이션 레벨에서 "동시 보유 락 수"를 세어 5000개를 넘으면 백프레셔(일시 중단)를 걸었다. PostgreSQL의 공유 락 테이블은 `max_locks_per_transaction × (max_connections + max_prepared_transactions)` 크기로 서버 시작 시 고정된다(기본 `max_locks_per_transaction`은 64). advisory lock도 일반 락과 **이 같은 공유 테이블**을 쓴다. advisory lock이 누적되면 이 공간을 함께 소모한다.

### 분석 — 락의 역할을 명확히 정의

이 작업을 하면서 깨달은 것은, **락의 역할이 뭔지 처음에 말로 정리하지 않으면** 종류에 맞는 락을 고를 수 없다는 점이었다.

| 락의 역할 | 적합한 도구 |
|---|---|
| **중복 처리 방지** (같은 이벤트가 두 번 와도 한 번만) | 중복 키로 `SETNX`, 또는 유니크 제약 |
| **동시 쓰기 방지** (다른 이벤트가 같은 행을 동시에 건드리는 걸 막음) | advisory lock, 행 잠금(`FOR UPDATE`), 트랜잭션 |
| **흐름 선점** (긴 흐름이 끝날 때까지 다른 요청이 못 들어오게) | 분산 락 (TTL 포함) |

"중복 처리 방지"를 쓰려고 생각했는데 사실은 "동시 쓰기 방지"가 필요했다면, `SETNX`는 진짜 처리되어야 할 이벤트를 잘못 막는다. 반대로 "동시 쓰기 방지"만으로는 같은 이벤트 중복 삽입을 못 막는다.

브리지의 경우 **정확히는 "동시 쓰기 방지 + 조회 후 분기"** 였다. 락 안에서 조회를 다시 하지 않고 바로 `UPSERT`를 쓰면 될 것 같지만, 두 이벤트의 **병합 로직이 복잡**하다(요청 데이터와 결과 데이터가 일부 겹치고 일부 다름). 그래서 코드 가독성을 위해 "조회 → 분기 → INSERT 또는 UPDATE" 패턴으로 짰다.

### 알림 이벤트 발행 시점

관련된 함정 하나 — **알림을 DB 커밋 전에 발행하면** 커밋이 롤백되는 상황에서 "데이터는 없는데 알림만 간" 상태가 된다. 처음엔 Handler 안쪽에서 바로 알림을 보냈다가, **DB 트랜잭션 커밋 이후**로 옮겼다.

```go
func (c *BridgeConsumer) Handle(ctx, evt BridgeEvent) error {
    saved, err := c.saveInTx(ctx, evt)   // ← DB 쓰기 + 커밋
    if err != nil { return err }
    return c.notify(ctx, saved)          // ← 커밋 성공 이후에만 알림
}
```

## 다른 방법 — 조건부 UPSERT로 락 없이

브리지처럼 "먼저 온 쪽은 INSERT, 나중 온 쪽은 UPDATE"가 필요할 때, 락을 쓰지 않고 **`INSERT … ON CONFLICT DO UPDATE WHERE 조건`**으로 처리하는 방법도 있다.

```sql
INSERT INTO bridges (transaction_id, from_addr, to_addr, status, updated_at)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (transaction_id) DO UPDATE
   SET to_addr    = COALESCE(EXCLUDED.to_addr, bridges.to_addr),
       status     = COALESCE(EXCLUDED.status, bridges.status),
       updated_at = EXCLUDED.updated_at
 WHERE bridges.updated_at < EXCLUDED.updated_at;   -- 늦게 도착한 오래된 데이터 거름
```

- 얻는 것: **락 없음.** PostgreSQL이 ON CONFLICT 분기를 원자적으로 처리하고, `WHERE` 조건으로 순서를 보장한다. 코드가 짧다.
- 치르는 것: **병합 로직이 SQL에** 들어간다. 복잡해지면 읽기 어렵고, ORM과도 안 맞는 경우가 많다. 애플리케이션 쪽에서 분기할 수 없는 로직(외부 호출 등)이 있으면 못 쓴다.
- 병합 로직이 **단순한 "둘 중 non-null 우선"** 류면 UPSERT가 가장 깔끔하다. 병합이 **애플리케이션 상태를 참고해야** 하면 advisory lock + 분기가 맞다.

## 정리

| 이벤트 성격 | 필요한 보호 | 도구 |
|---|---|---|
| 한 번에 끝나는 이벤트의 중복 수신 | 중복 처리 방지 | Redis `SETNX`, 유니크 제약 |
| **요청·결과 쌍이 순서 뒤바뀜 (채택)** | 동시 쓰기 방지 + 조회·분기 | **advisory lock + 조회 후 INSERT/UPDATE** |
| 다른 방법. 단순 병합 | 동시 쓰기 방지 | `INSERT … ON CONFLICT DO UPDATE WHERE 조건` |

**채택: 시도 2.** "중복을 막는 것"과 "동시 쓰기를 막는 것"은 다른 문제다. 한 가지 도구로 통일하면 한쪽에서 빠진다.

- 락을 걸기 전에 **"이 락이 무엇을 막는가"**를 한 문장으로 적어 본다. 중복 처리 방지인지, 동시 쓰기 방지인지, 긴 흐름 선점인지. 각자 적합한 도구가 다르다.
- Kafka는 **중복과 순서 뒤바뀜**이 모두 생길 수 있다. 둘을 혼동하지 말고, 이벤트 종류마다 어느 쪽이 문제인지 먼저 분류한다.
- advisory lock은 **PostgreSQL 메모리**에 올라가므로 **동시 보유 수에 상한**을 둔다. 커넥션 누수·장기 트랜잭션이 있으면 락이 누적된다.
- 알림·외부 호출은 **DB 커밋 이후**로 미룬다. 트랜잭션 안에서 보내면 롤백 시 "데이터 없는데 알림만 간" 상태가 된다.
