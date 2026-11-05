---
title: "[CDC] Debezium을 활용한 RDB to Snowflake"
excerpt: "Debezium CDC의 개념과 동작 방식을 정리하고, AWS Aurora PostgreSQL의 변경 사항을 MSK Connect와 Debezium, Snowflake Kafka 커넥터를 거쳐 Snowflake까지 안정적으로 반영하는 과정을 기록한다."
date: 2026-11-04
tags:
  - CDC
  - Debezium
  - Snowflake
---

## 목표

Debezium CDC의 개념과 동작 방식을 이해하고, Debezium으로 AWS Aurora PostgreSQL의 데이터 변경 사항을 Snowflake까지 안정적으로 반영하는 방법을 정리한다.

예시의 DB·테이블·토픽 이름은 설명용으로 바꾼 것이다. 일반 테이블은 `orders`, 보존 기간이 지나면 운영 DB에서 지워지는 이력 테이블은 `order_history`로 부른다. 실제 환경에서는 각자의 이름으로 바꿔 읽으면 된다.

## 개념과 용어

### CDC

CDC(Change Data Capture)는 DB에서 일어나는 변경을 **실시간으로, 순서대로** 감지해 전달하는 개념이다. INSERT / UPDATE / DELETE처럼 데이터가 바뀌는 사건만 잡아내며, 플랫폼에 따라 기존 데이터 전체나 일부를 읽어 스트리밍하는 기능(스냅샷)을 함께 제공한다.

주로 쓰이는 곳:

- 데이터베이스 ↔ 데이터 웨어하우스 동기화
- 이벤트 기반 서비스 아키텍처
- 서비스 간 데이터 복제

### Debezium

Debezium은 DBMS가 제공하는 트랜잭션 로그(WAL)를 읽어 변경 사항을 실시간으로 캡처·스트리밍하는 **Kafka Source Connector**다. 이 글에서는 Debezium으로 Aurora PostgreSQL의 변경을 Kafka에 싣고, Snowflake Kafka 커넥터로 Snowflake에 적재한다.

| 특징 | 내용 |
|---|---|
| 다양한 DB 지원 | MySQL / MariaDB, PostgreSQL, Oracle, MongoDB 등 |
| At-least-once 전달, 트랜잭션 순서 보장 | 이벤트가 중복될 수는 있지만, 같은 테이블·같은 PK의 순서는 지켜진다 |
| 스냅샷 | 시작 시점의 기존 데이터나 일부 데이터를 청크 단위로 읽어 스트리밍 |
| 장애 복구·재시작 | 오프셋을 관리해, 프로세스가 죽었다 살아나도 마지막 처리 위치부터 재개 |
| Kafka 생태계 친화 | Kafka Connect 기반 — Single Message Transform, Schema Registry 등과 결합. 대규모 이벤트 스트리밍에 적합 |

### WAL

WAL(Write-Ahead Log)은 DBMS가 데이터 무결성과 장애 복구를 보장하기 위해 쓰는 트랜잭션 로그다. 데이터 페이지를 실제로 바꾸기 **전에** 변경 내용을 먼저 WAL에 기록하고, 장애가 나면 이 로그로 복구한다.

<div class="callout" markdown="1">

**Q. 변경을 디스크의 데이터 페이지에 바로 쓰지 않고 왜 WAL에 먼저 남기나?**

변경 내용을 디스크의 데이터 페이지에 곧바로 쓰려면 디스크 곳곳에 흩어진 위치에 접근해야 해서 random I/O가 생기고, I/O 비용과 commit 지연이 커진다. 반면 WAL은 파일 끝에 append만 하므로 sequential I/O라 쓰기 비용이 낮다.

그래서 DBMS는 데이터가 바뀌면 메모리 버퍼 풀의 페이지를 수정하고 그 내용을 WAL에 기록한다. commit 시점에는 로그만 디스크에 남기고, 데이터 접근은 버퍼 풀을 통해 한다. 실제 데이터 페이지는 이후 **checkpoint**(특정 시점까지의 변경을 버퍼 풀에서 디스크로 반영했음을 기록하는 지점)에 일괄 반영된다. 이렇게 쿼리 성능과 트랜잭션 안정성을 함께 얻는다.

</div>

<div class="callout" markdown="1">

**Q. WAL이 계속 쌓이면 디스크가 모자라지 않나?**

WAL은 복구에 필요한 변경 이력만 유지하므로 무한히 쌓이지 않는다. DBMS가 주기적으로 checkpoint를 수행해 버퍼 풀의 변경을 데이터 페이지에 반영하면, 그 이전의 WAL은 더 이상 복구에 필요 없으므로 삭제된다.

</div>

<div class="callout" markdown="1">

**Q. 운영 중 DB가 크래시되거나 재시작되면 변경 사항은 어떻게 복구되나?**

재시작 시 DBMS는 마지막 checkpoint 이후의 WAL을 순서대로 읽으며, commit 기록이 있는 트랜잭션의 변경을 데이터 페이지에 반영한다. 그래서 크래시가 나도 commit된 변경은 사라지지 않는다.

</div>

## 아키텍처

{% include figure popup=true image_path="/assets/img/lab/debezium-rdb-to-snowflake-architecture.png" alt="Aurora PostgreSQL → Debezium Source Connector → MSK Kafka → Snowflake Sink Connector → Snowflake 로그 테이블 → Stream → Task → Snowflake 타겟 테이블" caption="Aurora PostgreSQL에서 Snowflake까지의 CDC 파이프라인" %}

- Debezium이 WAL을 읽어 변경 이벤트를 Kafka 토픽에 싣는다.
- Snowflake Kafka 커넥터가 토픽을 구독해 로그 테이블(`*_DBZ_LOG`)에 **append only**로 적재한다.
- Snowflake STREAM이 로그 테이블의 변경분을 추적하고, TASK가 주기적으로 타겟 테이블에 MERGE해 PK 기준 최종 상태를 유지한다.

## 인프라 세팅 — DB

DB 쪽 준비는 세 가지다. Logical Replication을 켜고, Replication Slot과 Publication을 만들고, 증분 스냅샷용 시그널 테이블을 만든다. 모두 DBA 권한이 필요해 요청해서 진행한다.

### Logical Replication 활성화

Logical Replication은 DB의 변경을 논리적 이벤트로 해석해 외부로 복제하는 기능이다. PostgreSQL 10 이상에서 쓸 수 있고 CDC에 반드시 필요하다. Aurora PostgreSQL은 기본이 OFF라 DBA에게 활성화를 요청해야 한다.

Aurora 파라미터 그룹에서 `rds.logical_replication`을 `1`로 바꾸면 켜진다. 적용하려면 인스턴스 재구동이 필요하다.

Debezium이 접속할 DB 유저에게는 **REPLICATION 권한**(Aurora에서는 `rds_replication` 역할), CDC 대상 테이블의 **SELECT**, 시그널 테이블의 **INSERT/UPDATE/DELETE** 권한이 필요하다.

### Replication Slot과 Publication 생성

두 객체의 역할은 다르다.

- **Replication Slot** — 변경 데이터(WAL)를 소비자가 읽을 때까지 **안전하게 보존**한다
- **Publication** — **어떤 테이블의 변경**을 외부로 노출할지 정의한다. 모든 테이블이 아니라 비즈니스적으로 의미 있는 테이블만 골라 지정할 수 있다

둘이 함께 동작해야 변경 이벤트가 유실 없이 전달된다. Debezium이 자동 생성할 수도 있지만, 사내 정책상 생성·관리 권한이 DBA에게 있어 요청해서 만든다.

Publication은 데이터베이스 단위 객체이고, 시그널 테이블(아래)은 Debezium 커넥터와 1:1로 묶인다. 그래서 **CDC 대상 데이터베이스마다 Slot·Publication·시그널 테이블·커넥터가 한 세트씩** 필요하다. 이 글은 데이터베이스 하나를 기준으로 쓰지만, 실제로는 데이터베이스 수만큼 같은 세트를 반복한다.

```sql
-- Replication Slot 생성 / 조회
SELECT * FROM pg_create_logical_replication_slot('cdc_slot', 'pgoutput');
SELECT * FROM pg_replication_slots;

-- Publication 생성 / 조회
-- CDC 대상 테이블(orders, order_history)에 더해, 증분 스냅샷을 쓰려면 시그널 테이블(debezium_signal)도 포함해야 한다.
-- 이후 ALTER PUBLICATION ... ADD/DROP TABLE 로 추가/제거 가능
CREATE PUBLICATION cdc_pub FOR TABLE debezium_signal, orders, order_history;
SELECT * FROM pg_publication;
SELECT * FROM pg_publication_tables;
```

#### Replication Slot

PostgreSQL의 WAL을 외부 소비자(Debezium)가 안전하게 읽을 수 있도록 **WAL을 보존하는 메커니즘**이다. CDC 관점에서는 "어디까지 읽었는지"를 기억하는 체크포인트 역할을 한다. PostgreSQL은 Slot을 쓰는 소비자가 WAL을 모두 처리할 때까지 WAL을 유지하고, 처리된 WAL은 checkpoint 이후 자동으로 삭제한다.

<div class="callout" markdown="1">

**Q. PostgreSQL은 소비자가 WAL을 어디까지 처리했는지 어떻게 아나?**

Slot 내부에 LSN(Log Sequence Number) 기준으로 기록한다. Logical Replication Slot은 두 LSN을 관리한다.

| LSN | 뜻 |
|---|---|
| `confirmed_flush_lsn` | 소비자가 "여기까지 안전하게 처리했다"고 알린 마지막 WAL 위치 |
| `restart_lsn` | PostgreSQL이 WAL을 삭제해서는 안 되는 최소 기준점. 이 이후의 WAL은 반드시 보존 |

`restart_lsn`은 `confirmed_flush_lsn`을 따라 이동하며 항상 `restart_lsn <= confirmed_flush_lsn`이다.

Debezium은 WAL을 읽어 이벤트를 만들고 Kafka에 안전하게 전달한 뒤, 마지막으로 처리한 이벤트의 LSN을 PostgreSQL에 보낸다. PostgreSQL은 그 값으로 `confirmed_flush_lsn`을 갱신한다. 이 메커니즘 덕에 아직 소비되지 않은 WAL이 삭제되지 않고, Debezium이 장애 후 재시작해도 못 받은 변경을 다시 캡처할 수 있다.

</div>

<div class="callout" markdown="1">

**Q. Debezium이 중단되면 Slot은 어떻게 되나?**

PostgreSQL은 Slot을 유지한 채 `confirmed_flush_lsn`을 더 갱신하지 않는다. `restart_lsn`도 멈추므로 그 이후의 WAL은 삭제되지 않는다. 데이터 유실을 막기 위한 의도된 설계이고, Debezium이 재기동되면 마지막 confirmed LSN부터 다시 읽는다. 다만 중단이 길어지면 WAL이 계속 쌓이므로 **운영에서는 Slot 상태를 반드시 모니터링**해야 한다.

```sql
-- Replication Slot의 lag 확인
SELECT slot_name,
       pg_wal_lsn_diff(pg_current_wal_lsn(), confirmed_flush_lsn) AS lag_bytes
FROM pg_replication_slots;
```

</div>

<div class="callout" markdown="1">

**Q. Slot과 PostgreSQL checkpoint는 어떤 관계인가?**

checkpoint는 WAL의 변경을 디스크에 반영하고 불필요한 WAL을 정리하는 메커니즘인데, Slot이 있으면 checkpoint가 돌아도 `restart_lsn` 이전의 WAL은 삭제되지 않는다. 즉 Slot은 checkpoint 위에 얹힌 **WAL 보존 제한 장치**로, CDC를 위해 WAL 수명을 의도적으로 늘린다.

</div>

<div class="callout" markdown="1">

**Q. Slot은 언제 제거해야 하나?**

CDC 파이프라인을 더 쓰지 않을 때 **반드시** 제거한다. 쓰지 않는 Slot이 남아 있으면 PostgreSQL은 그 Slot 기준으로 WAL을 계속 보존한다.

</div>

<div class="callout" markdown="1">

**Q. Debezium이 재시작되면 WAL의 어느 지점부터 이어 읽나?**

Debezium은 Kafka Connect 기반이라 마지막으로 처리한 LSN을 **Kafka Connect offset 토픽**에 기록하고, 재시작 시 Slot이 아니라 offset 토픽의 LSN을 기준으로 이어 읽는다.

MSK Connect에서 offset 토픽은 아래 이름으로 생성되고, LSN이 담긴 메시지를 볼 수 있다. 커넥터를 삭제했다 다시 만들면 UUID가 바뀐다. `offset.storage.topic`으로 토픽을 직접 지정할 수 있다고 하지만 테스트해 보니 적용되지 않는 듯했다.

```
__amazon_msk_connect_offsets_{커넥터이름}_{커넥터 UUID}
```

```json
{"lsn_proc":3672660576,"messageType":"COMMIT","lsn_commit":3672660576,"lsn":3672660576,"txId":51194817,"ts_usec":1768208762343578}
```

offset 토픽의 LSN을 WAL에서 찾을 수 없는 특수한 상황에서는, offset 토픽과 Slot 중 어느 LSN을 믿을지 고르는 옵션(`offset.mismatch.strategy`)이 있다.

</div>

<div class="callout" markdown="1">

**Q. Debezium을 띄우기 전에 Slot을 미리 만들어 두면, Slot 생성 시점 이후의 이벤트를 받을 수 있나?**

그렇다. Debezium 문서:

> If there is a previously stored LSN in the Kafka offsets topic, the connector continues streaming changes from that position. If no LSN has been stored, the connector starts streaming changes from the point in time when the PostgreSQL logical replication slot was created on the server.

</div>

<div class="callout" markdown="1">

**Q. Failover가 나면 새 Primary에서도 CDC가 이어지나?**

PostgreSQL 17부터 Failover Replication Slot이 제공되어 이어진다. 그 미만 버전에서는 Logical Replication Slot이 Secondary에 동기화되지 않아, Failover 후 새 Primary에 Slot을 다시 만들고 Debezium offset 토픽을 초기화해 재구동해야 한다.

다만 Aurora는 Primary와 Secondary가 복제 볼륨을 공유해 Failover 후에도 Slot이 유지된다고 한다(DBA 확인). 실제로 테스트해 보니 Failover 뒤 Debezium을 다시 만들지 않아도 새 Primary에서 CDC가 정상적으로 이어졌다.

</div>

<div class="callout" markdown="1">

**Q. heartbeat를 켰는데도 WAL이 계속 쌓인다?**

WAL은 인스턴스 전체가 공유한다. CDC 대상이 아닌 테이블이나 같은 인스턴스의 다른 데이터베이스가 바쁘면 WAL은 계속 쌓이는데, Debezium은 **자기가 실제로 받은 이벤트의 LSN까지만** `confirmed_flush_lsn`을 올릴 수 있다. heartbeat는 Debezium이 Kafka에 "살아 있다"는 이벤트를 보내는 것이지 **DB에 WAL을 만들어 주지는 않는다.** 대상 테이블에 변경이 없으면 확인할 LSN이 없어 Slot이 그 자리에 멈추고, `restart_lsn` 이전 WAL을 지우지 못해 디스크가 찬다.

해결은 둘 중 하나다.

1. `heartbeat.action.query` — heartbeat마다 Publication 안의 전용 테이블에 UPDATE를 날려 WAL을 만든다 (Debezium 공식 해법)
2. 외부 배치가 Publication 대상 테이블의 마지막 행을 **no-op UPDATE** 한다

우리는 2번을 쓴다. 스케줄러에서 아래 쿼리를 대상 테이블마다 주기적으로 실행한다.

```sql
UPDATE orders SET order_id = order_id WHERE order_id = (SELECT MAX(order_id) FROM orders);
```

PK를 같은 값으로 SET하므로 데이터는 그대로지만, PostgreSQL은 새 row 버전과 WAL 레코드를 만든다. Debezium이 이를 받아 `confirmed_flush_lsn`을 올리고, 그제야 PostgreSQL이 오래된 WAL을 지운다. **변경이 드문 테이블이 있는 데이터베이스**에 필요하고, 트래픽이 많아 늘 변경이 있는 데이터베이스에는 필요 없다.

</div>

### 증분 스냅샷용 시그널 테이블 생성

Debezium의 스냅샷은 세 가지다.

| 종류 | 언제 | 스냅샷 중 CDC 스트리밍 |
|---|---|---|
| 초기 스냅샷 (initial) | 커넥터 최초 시작 시 한 번, 전체 테이블 | 스냅샷이 끝나야 시작 |
| 블로킹 스냅샷 (blocking) | 운영 중 | 중단 |
| 증분 스냅샷 (incremental) | 운영 중 | 유지 |

초기 스냅샷은 데이터가 많으면 DB에 큰 부하를 주고 Kafka에 대량 이벤트를 쏟아내므로 운영에서는 쓰지 않을 계획이다. 대신 CDC 스트리밍을 유지한 채로, DB·Debezium 장애로 유실된 이벤트를 보정하거나 특정 테이블·일부 데이터만 골라 적재할 때 **증분 스냅샷**을 쓴다.

증분 스냅샷을 트리거하려면 시그널 테이블이 필요하다.

```sql
-- 테이블 이름은 Debezium 설정 signal.data.collection에서 바꿀 수 있다
CREATE TABLE debezium_signal (
    id   VARCHAR(42)   PRIMARY KEY,
    type VARCHAR(32)   NOT NULL,
    data VARCHAR(2048) NULL
);
```

주의: 컬럼은 **VARCHAR 타입의 `id`, `type`, `data` 세 개만** 있어야 한다. 타입을 바꾸거나 컬럼을 추가하면 트리거되지 않고 Debezium이 에러를 낸다.

#### 스냅샷과 이벤트 순서 문제

CDC 스트리밍을 멈추지 않고 스냅샷을 하면, 스냅샷 대상과 같은 PK의 변경 이벤트가 동시에 생길 때 순서가 꼬일 수 있다.

1. Debezium이 스냅샷을 위해 테이블을 SELECT
2. 스냅샷 대상 중 PK=10 행에 UPDATE 발생
3. CDC 스트리밍으로 PK=10의 UPDATE 이벤트가 **먼저** 수신
4. 이후 스냅샷 결과로 PK=10의 스냅샷 이벤트가 수신

최신인 UPDATE보다 과거 상태인 스냅샷 이벤트가 나중에 도착해, 소비자 쪽 정합성이 깨진다.

증분 스냅샷은 이를 **청크 단위 + 워터마킹**으로 푼다. 각 청크는 스냅샷 SELECT 시작부터 청크 처리 완료까지를 하나의 구간으로 잡고, 그 구간에 같은 PK의 CDC 변경 이벤트가 있었는지 본다. 있었다면 그 PK의 스냅샷 레코드는 오래된 상태로 판단해 **발송을 폐기**한다. 이미 수신된 CDC 이벤트가 최종 상태로 남는다.

1. Debezium이 청크 하나를 SELECT
2. 스냅샷 대상 중 PK=10 행에 UPDATE 발생
3. CDC 스트리밍으로 PK=10의 UPDATE 이벤트가 먼저 수신
4. Debezium이 청크의 워터마킹 시작 이후 PK=10의 변경이 있었는지 확인하고, 있었으므로 PK=10의 스냅샷 이벤트를 폐기
5. 이미 수신된 UPDATE 이벤트가 최종 데이터로 유지

참고: [Incremental Snapshots in Debezium](https://debezium.io/blog/2021/10/07/incremental-snapshots)

#### 증분 스냅샷 트리거

```sql
-- 스냅샷 시작 (orders 테이블 중 status = 'PAID'인 행만. additional-conditions를 빼면 테이블 전체)
INSERT INTO public.debezium_signal (id, type, data)
VALUES ('ad-hoc-1', 'execute-snapshot',
        '{"data-collections": ["public.orders"], "type": "incremental",
          "additional-conditions": [{"data-collection": "public.orders", "filter": "status=''PAID''"}]}');

-- 스냅샷 중단
INSERT INTO public.debezium_signal (id, type, data)
VALUES ('ad-hoc-2', 'stop-snapshot',
        '{"data-collections": ["public.orders"], "type": "incremental"}');
```

`id`는 시그널을 구분하는 임의 문자열이고, `data` 안의 작은따옴표는 SQL 문자열 안이라 `''`로 두 번 쓴다.

참고: [PostgreSQL connector — incremental snapshots](https://debezium.io/documentation/reference/stable/connectors/postgresql.html#postgresql-incremental-snapshots)

## 인프라 세팅 — Debezium 커넥터

1. **플러그인 S3 업로드** — [Debezium 릴리스 페이지](https://debezium.io/releases/)에서 원하는 버전의 **PostgreSQL 커넥터 플러그인**(`debezium-connector-postgres-<버전>-plugin.tar.gz`)을 받는다. MSK Connect는 zip 또는 jar만 받으므로, tar.gz를 풀고 나온 `debezium-connector-postgres/` 폴더를 **zip으로 다시 묶어** S3에 올린다.
2. **MSK 사용자 지정 플러그인 등록** — S3의 zip을 MSK Connect 사용자 지정 플러그인으로 등록한다.
3. **IAM 역할 생성** — MSK, RDS, S3 접근 권한을 정책에 넣는다.
4. **CloudWatch 로그 그룹 생성**
5. **MSK 커넥터 생성** — 아래 설정으로 만든다.

### 커넥터 설정

```jsonc
{
  // MSK 커넥터 이름
  "name": "dev-debezium-postgres-source",
  // PostgreSQL용 Debezium 커넥터 클래스
  "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
  // PostgreSQL CDC는 단일 스트림이라 2 이상은 의미 없음
  "tasks.max": "1",
  // WAL 디코더 플러그인: 내장 pgoutput 사용
  "plugin.name": "pgoutput",
  // DBA가 만든 Replication Slot / Publication 이름
  "slot.name": "cdc_slot",
  "publication.name": "cdc_pub",
  // Publication 자동 생성 OFF (DBA가 직접 관리)
  "publication.autocreate.mode": "disabled",
  // DELETE 뒤 tombstone 메시지 추가 여부. 토픽 압축을 쓰지 않으므로 false
  "tombstones.on.delete": "false",
  // CDC 이벤트를 실을 Kafka 토픽 prefix → {prefix}.{schema}.{table}
  "topic.prefix": "appdb_dbz",
  // 재시작 가능한 오류 발생 시 대기 시간. Failover 시 새 Primary로 도메인이 바뀌는 시간까지
  // 고려해 60초. 더 짧으면 도메인이 바뀌기 전에 Secondary에 붙어 WAL을 못 읽고 커넥터가
  // 종료된다. MSK에서 커넥터가 종료 후 재실행되는 데 5~15분 이상 걸리므로 넉넉히 잡는다.
  "retriable.restart.connector.wait.ms": "60000",
  // DB 접속 정보 (Debezium 2.x부터 database.server.name은 사라지고 topic.prefix가 그 역할을 한다)
  "database.hostname": "<aurora-cluster-endpoint>",
  "database.port": "5432",
  "database.dbname": "appdb",
  "database.user": "<user>",
  "database.password": "<password>",
  // 메시지 키/값을 JSON으로. 메시지 크기 때문에 스키마 정보는 포함하지 않음
  "key.converter": "org.apache.kafka.connect.json.JsonConverter",
  "key.converter.schemas.enable": "false",
  "value.converter": "org.apache.kafka.connect.json.JsonConverter",
  "value.converter.schemas.enable": "false",
  // NUMERIC/DECIMAL을 문자열로. 스키마 없는 JSON에서는 기본값(precise)이 base64 바이트로 나와
  // 읽을 수 없다. Snowflake 쪽에서 TRY_TO_NUMBER로 되돌린다
  "decimal.handling.mode": "string",
  // Debezium이 주기적으로 heartbeat 이벤트를 보내 offset을 갱신한다. 단, heartbeat 자체는 DB에
  // WAL을 만들지 않으므로 대상 테이블에 변경이 없으면 Slot이 전진하지 않는다 → keepalive 배치와 함께 쓴다
  "heartbeat.interval.ms": "60000",
  // offset 토픽의 LSN과 Slot의 LSN이 다를 때 offset 토픽을 신뢰
  "offset.mismatch.strategy": "trust_offset",
  // 초기 스냅샷 없이 바로 스트리밍. 필요한 데이터는 증분 스냅샷으로
  "snapshot.mode": "no_data",
  // 증분 스냅샷 시그널 테이블. DB 유저에게 이 테이블의 RW 권한이 있어야 하고,
  // Publication에도 이 테이블을 포함시켜야 한다
  "signal.data.collection": "public.debezium_signal",
  "signal.enabled.channels": "source",
  // 증분 스냅샷 청크 크기와 워터마킹 방식
  "incremental.snapshot.chunk.size": "3000",
  "incremental.snapshot.watermarking.strategy": "insert_insert",
  // 에러가 나도 커넥터를 멈추지 않고 DLQ로 보냄. replication.factor는 브로커 수에 맞춘다 (운영은 3)
  "errors.tolerance": "all",
  "errors.deadletterqueue.topic.name": "appdb_dbz_dlq",
  "errors.deadletterqueue.context.headers.enable": "true",
  "errors.deadletterqueue.topic.replication.factor": "3",
  "errors.log.enable": "true",
  "errors.log.include.messages": "true",
  // Single Message Transform: Debezium 봉투를 벗기고 after 상태만 남김. 토픽 이름이 history로
  // 끝나는 이력 테이블과 나머지 테이블에 다른 DELETE 처리를 적용하기 위해 SMT를 둘로 나눴다.
  //  - add.fields: op, ts_ns를 메시지 값에 __op, __ts_ns 필드로 넣는다 (Snowflake 컬럼이 됨)
  //  - add.headers: source.lsn을 Kafka 헤더에 넣는다 (디버깅·순서 추적용, 컬럼은 안 됨)
  "transforms": "unwrapHistory,unwrapNormal",
  "transforms.unwrapHistory.type": "io.debezium.transforms.ExtractNewRecordState",
  "transforms.unwrapHistory.delete.tombstone.handling.mode": "drop",
  "transforms.unwrapHistory.add.headers": "source.lsn",
  "transforms.unwrapHistory.add.fields": "op,ts_ns",
  "transforms.unwrapHistory.predicate": "isHistoryTopic",
  "transforms.unwrapHistory.negate": "false",
  "transforms.unwrapNormal.type": "io.debezium.transforms.ExtractNewRecordState",
  "transforms.unwrapNormal.delete.tombstone.handling.mode": "rewrite",
  "transforms.unwrapNormal.add.headers": "source.lsn",
  "transforms.unwrapNormal.add.fields": "op,ts_ns",
  "transforms.unwrapNormal.predicate": "isHistoryTopic",
  "transforms.unwrapNormal.negate": "true",
  // predicate: 토픽 이름이 history로 끝나면 참
  "predicates": "isHistoryTopic",
  "predicates.isHistoryTopic.type": "org.apache.kafka.connect.transforms.predicates.TopicNameMatches",
  "predicates.isHistoryTopic.pattern": ".*history$"
}
```

### transforms — SMT 적용 전후

`transforms`는 Kafka로 들어가는 메시지를 가공하는 기능으로, Single Message Transform(SMT)이라고 부른다. `ExtractNewRecordState`를 적용하면 Debezium의 봉투(envelope)가 벗겨지고 `after` 상태만 남는다.

같은 SMT를 둘로 나눈 이유는 **이력 테이블의 DELETE를 Snowflake에 전파하지 않기 위해서**다. 운영 DB는 보존 기간이 지난 이력(예: 로그인 내역)을 배치로 지우지만 Snowflake에는 분석·감사용으로 남겨야 한다. 그래서 `.*history$` 토픽은 DELETE 이벤트를 `drop`하고, 나머지는 `rewrite`(삭제된 행을 `__op = 'd'`인 레코드로 바꿔 전달)한다. 뒤에서 보듯 Snowflake TASK에서도 이력 테이블은 DELETE 분기를 뺀다.

`orders` 테이블의 행 하나가 UPDATE됐을 때의 메시지로 비교하면 이렇다.

적용 전 — Debezium 봉투 그대로:

```json
{
  "before": null,
  "after": {"order_id": 1, "customer_id": 42, "amount": "1000", "status": "PAID",
            "created_at": "2026-11-04T09:00:00Z", "updated_at": "2026-11-04T09:05:00Z"},
  "source": {
    "version": "2.5.0.Final", "connector": "postgresql", "name": "appdb_dbz",
    "ts_ms": 1762246800000, "snapshot": "false", "db": "appdb", "schema": "public",
    "table": "orders", "lsn": 3672660576, "txId": 51194817
  },
  "op": "u",
  "ts_ms": 1762246800123
}
```

적용 후 — `after`만 남고 `__op`, `__ts_ns`가 붙는다:

```json
{"order_id": 1, "customer_id": 42, "amount": "1000", "status": "PAID",
 "created_at": "2026-11-04T09:00:00Z", "updated_at": "2026-11-04T09:05:00Z",
 "__op": "u", "__ts_ns": 1762246800123000000}
```

`amount`가 문자열인 것은 `decimal.handling.mode: string` 때문이고, 시각이 ISO 문자열인 것은 `timestamptz` 컬럼의 기본 표현이다. 둘 다 Snowflake TASK에서 `TRY_TO_NUMBER`, `TRY_TO_TIMESTAMP_TZ`로 되돌린다.

### 운영 Q&A

<div class="callout" markdown="1">

**Q. Debezium을 어떻게 중단하나?**

MSK Connect에서는 커넥터를 **삭제**해야 한다. Kafka Connect 자체에는 중단 기능이 있지만 MSK Connect는 제공하지 않는다. 삭제하면 LSN이 저장된 offset 토픽이 새로 생기니 주의한다.

</div>

<div class="callout" markdown="1">

**Q. Debezium을 어떻게 재시작하나?**

MSK Connect에서 커넥터 설정 JSON에 엔터를 한 번 치고 적용하면 재시작된다. 역시 MSK Connect에 재시작 기능이 따로 없어서 쓰는 방법이다.

</div>

## 인프라 세팅 — Snowflake 커넥터

1. **플러그인 S3 업로드** — [snowflake-kafka-connector 릴리스](https://github.com/snowflakedb/snowflake-kafka-connector/releases)(또는 Maven Central)에서 `snowflake-kafka-connector-<버전>.jar`를 받는다. jar 하나라 압축 없이 그대로 S3에 올리면 된다.
2. **MSK 사용자 지정 플러그인 등록** — S3의 jar를 MSK Connect 사용자 지정 플러그인으로 등록한다.
3. **IAM 역할 생성** — MSK, S3 접근 권한
4. **CloudWatch 로그 그룹 생성**
5. **MSK 커넥터 생성**

### 커넥터 설정

```jsonc
{
  "name": "dev-snowflake-sink",
  "connector.class": "com.snowflake.kafka.connector.SnowflakeSinkConnector",
  // 단일 파티션으로 쓸 예정이라 1
  "tasks.max": "1",
  // 구독할 토픽을 명시 나열. topics.regex도 되지만, 의도하지 않은 토픽이 끼어드는 걸 막으려고 명시한다.
  // 싱크 커넥터 하나가 여러 소스 커넥터(데이터베이스)의 토픽을 모아 받을 수 있다
  "topics": "appdb_dbz.public.orders,appdb_dbz.public.order_history",
  // Snowflake 인증·접속 정보
  "snowflake.private.key": "<private-key>",
  "snowflake.private.key.passphrase": "<passphrase>",
  "snowflake.url.name": "<account>.snowflakecomputing.com:443",
  "snowflake.user.name": "<user>",
  "snowflake.role.name": "<role>",
  "snowflake.database.name": "ANALYTICS",
  "snowflake.schema.name": "DEV",
  // 메시지의 JSON 필드를 컬럼으로 풀어 테이블을 자동 생성
  "snowflake.enable.schematization": "TRUE",
  // 실시간 CDC를 위해 Snowpipe Streaming 사용
  "snowflake.ingestion.method": "SNOWPIPE_STREAMING",
  // {kafka 토픽}:{snowflake 테이블}
  "snowflake.topic2table.map": "appdb_dbz.public.orders:ORDERS_DBZ_LOG,appdb_dbz.public.order_history:ORDER_HISTORY_DBZ_LOG",
  // 버퍼: 1000건 / 60초 / 1MB 중 먼저 도달하면 flush
  "buffer.count.records": "1000",
  "buffer.flush.time": "60",
  "buffer.size.bytes": "1048576",
  "key.converter": "org.apache.kafka.connect.json.JsonConverter",
  "key.converter.schemas.enable": "false",
  "value.converter": "org.apache.kafka.connect.json.JsonConverter",
  "value.converter.schemas.enable": "false",
  "errors.tolerance": "all",
  "errors.deadletterqueue.topic.name": "appdb_snowflake_dlq",
  "errors.deadletterqueue.context.headers.enable": "true",
  "errors.deadletterqueue.topic.replication.factor": "3",
  "errors.log.enable": "true",
  "errors.log.include.messages": "true"
}
```

### snowflake.enable.schematization

이 옵션을 켜면 Kafka 메시지의 JSON 구조에 따라 Snowflake 로그 테이블이 자동 생성된다. 우리 팀은 스키마 없는 JSON 메시지를 쓰고 있어서, 위의 "적용 후" 메시지(여기에 `note: null` 필드가 하나 더 있다고 하자)가 처음 들어오면 테이블이 이렇게 만들어진다.

```sql
CREATE TABLE ORDERS_DBZ_LOG (
    RECORD_METADATA VARIANT,            -- 토픽·파티션·오프셋·헤더 등 Kafka 메타데이터
    ORDER_ID    NUMBER(38,0),
    CUSTOMER_ID NUMBER(38,0),
    AMOUNT      VARCHAR(16777216),      -- decimal.handling.mode: string 이라 문자열
    STATUS      VARCHAR(16777216),
    CREATED_AT  VARCHAR(16777216),      -- ISO 문자열로 오므로 VARCHAR
    UPDATED_AT  VARCHAR(16777216),
    NOTE        VARCHAR(16777216),      -- 첫 메시지가 null이면 타입을 알 수 없어 VARCHAR
    __OP        VARCHAR(16777216),
    __TS_NS     NUMBER(38,0)
);
```

JSON 값의 타입에 맞춰 컬럼 타입을 고르므로, **첫 메시지의 값이 무엇이냐**에 따라 컬럼 타입이 달라진다. 이후 필드가 추가되면 컬럼도 자동으로 생기지만, 제거는 해 주지 않는 듯하다. 숫자·시각이 VARCHAR로 잡히는 문제는 뒤의 TASK에서 변환으로 흡수한다.

## 인프라 세팅 — Snowflake 테이블·STREAM·TASK

### 타겟 테이블

Snowflake 커넥터는 CDC 이벤트를 **append only**로 적재한다. INSERT, UPDATE, DELETE, SNAPSHOT 이벤트가 전부 새 레코드로 쌓여 같은 PK의 레코드가 여러 개 생긴다. 그래서 **2단계 테이블**을 쓴다 — 로그 테이블(`ORDERS_DBZ_LOG`)은 커넥터가 자동 생성하고, PK 기준 최종 상태를 담을 타겟 테이블은 직접 만든다.

```sql
CREATE OR REPLACE TABLE ANALYTICS.DEV.ORDERS (
    ORDER_ID    NUMBER(38,0),
    CUSTOMER_ID NUMBER(38,0),
    AMOUNT      NUMBER(38,0),
    STATUS      VARCHAR(16777216),
    CREATED_AT  TIMESTAMP_TZ(9),
    UPDATED_AT  TIMESTAMP_TZ(9)
);
```

### STREAM

STREAM은 테이블의 **변경분만** 추적하는 객체다. 로그 테이블에 새 레코드가 들어오면 STREAM에 기록되고, 타겟에 MERGE할 때 전체를 스캔하지 않고 변경분만 처리할 수 있다.

```sql
CREATE OR REPLACE STREAM ANALYTICS.DEV.STREAM_ORDERS_DBZ_LOG
  ON TABLE ANALYTICS.DEV.ORDERS_DBZ_LOG
  SHOW_INITIAL_ROWS = TRUE;
```

### TASK

STREAM에 쌓인 변경분을 주기적으로 타겟에 MERGE한다. 같은 PK가 STREAM에 여러 건 있으면 `__TS_NS`가 가장 최근인 것만 반영하고, `__OP = 'd'`면 삭제한다.

- `WHEN SYSTEM$STREAM_HAS_DATA(...)` — STREAM에 변경분이 없으면 TASK를 건너뛴다. 매분 웨어하우스를 깨우지 않아 비용이 준다.
- 로그 테이블의 숫자·시각 컬럼은 VARCHAR로 들어오므로(`decimal.handling.mode: string`, ISO 문자열 시각, 첫 메시지가 null인 경우) `TRY_TO_NUMBER`·`TRY_TO_TIMESTAMP_TZ`로 타겟 타입에 맞춰 변환한다. 변환에 실패하면 에러 대신 NULL이 되어 TASK가 멈추지 않는다. JSON 컬럼은 `PARSE_JSON`으로 VARIANT에 넣는다.

```sql
CREATE OR REPLACE TASK ANALYTICS.DEV.TASK_ORDERS_DBZ_LOG
  WAREHOUSE = DEFAULT_WAREHOUSE
  SCHEDULE  = '1 MINUTE'
  WHEN SYSTEM$STREAM_HAS_DATA('ANALYTICS.DEV.STREAM_ORDERS_DBZ_LOG')
AS
MERGE INTO ANALYTICS.DEV.ORDERS T
USING (
    SELECT ORDER_ID,
           CUSTOMER_ID,
           TRY_TO_NUMBER(AMOUNT)           AS AMOUNT,
           STATUS,
           TRY_TO_TIMESTAMP_TZ(CREATED_AT) AS CREATED_AT,
           TRY_TO_TIMESTAMP_TZ(UPDATED_AT) AS UPDATED_AT,
           __OP,
           __TS_NS
    FROM ANALYTICS.DEV.STREAM_ORDERS_DBZ_LOG
    -- 같은 PK가 여러 건이면 가장 최근 변경만 반영
    QUALIFY ROW_NUMBER() OVER (PARTITION BY ORDER_ID ORDER BY __TS_NS DESC) = 1
) S
ON T.ORDER_ID = S.ORDER_ID
WHEN MATCHED AND S.__OP = 'd' THEN DELETE
WHEN MATCHED AND S.__OP != 'd' THEN UPDATE SET
    CUSTOMER_ID = S.CUSTOMER_ID,
    AMOUNT      = S.AMOUNT,
    STATUS      = S.STATUS,
    CREATED_AT  = S.CREATED_AT,
    UPDATED_AT  = S.UPDATED_AT
WHEN NOT MATCHED AND S.__OP != 'd' THEN INSERT
    (ORDER_ID, CUSTOMER_ID, AMOUNT, STATUS, CREATED_AT, UPDATED_AT)
    VALUES (S.ORDER_ID, S.CUSTOMER_ID, S.AMOUNT, S.STATUS, S.CREATED_AT, S.UPDATED_AT);
```

TASK는 생성 직후 일시 정지 상태이므로 RESUME해 시작한다.

```sql
ALTER TASK ANALYTICS.DEV.TASK_ORDERS_DBZ_LOG RESUME;
```

이력 테이블(`ORDER_HISTORY`)의 TASK는 구조가 같지만 **`WHEN MATCHED AND S.__OP = 'd' THEN DELETE` 분기가 없다.** SMT에서 이미 DELETE 이벤트를 버리므로 도달하지도 않지만, 혹시 들어와도 지우지 않도록 TASK 쪽에서도 막아 둔다.

## 테스트

Aurora에서 변경을 일으키고, 로그 테이블(`ORDERS_DBZ_LOG`)과 타겟 테이블(`ORDERS`)에 순서대로 반영되는지 확인한다.

### INSERT

```sql
-- Aurora
INSERT INTO public.orders (customer_id, amount, status, created_at, updated_at)
VALUES (42, 1000, 'CREATED', NOW(), NOW());

-- Snowflake: 로그 테이블에 __op = 'c' 레코드가, 1분 내 타겟 테이블에 행이 생긴다
SELECT * FROM ANALYTICS.DEV.ORDERS_DBZ_LOG ORDER BY __TS_NS DESC;
SELECT * FROM ANALYTICS.DEV.ORDERS;
```

### UPDATE

```sql
-- Aurora
UPDATE public.orders SET status = 'PAID' WHERE order_id = 1;

-- Snowflake: 로그에는 __op = 'u' 레코드가 추가되고, 타겟은 같은 행이 갱신된다
SELECT order_id, status, __op, __ts_ns FROM ANALYTICS.DEV.ORDERS_DBZ_LOG ORDER BY __TS_NS DESC;
SELECT status FROM ANALYTICS.DEV.ORDERS WHERE ORDER_ID = 1;
```

### DELETE

```sql
-- Aurora
DELETE FROM public.orders WHERE order_id = 1;

-- Snowflake: 로그에는 __op = 'd' 레코드가 추가되고, 타겟에서는 행이 사라진다
SELECT order_id, status, __op, __ts_ns FROM ANALYTICS.DEV.ORDERS_DBZ_LOG ORDER BY __TS_NS DESC;
SELECT * FROM ANALYTICS.DEV.ORDERS WHERE ORDER_ID = 1;
```

### SNAPSHOT

```sql
-- Aurora: order_id < 10 인 행만 증분 스냅샷
INSERT INTO public.debezium_signal (id, type, data)
VALUES ('ad-hoc-1', 'execute-snapshot',
        '{"data-collections": ["public.orders"], "type": "incremental",
          "additional-conditions": [{"data-collection": "public.orders", "filter": "order_id<10"}]}');

-- Snowflake: 스냅샷 레코드(__op = 'r')가 로그에 쌓이고 타겟에 반영된다
SELECT * FROM ANALYTICS.DEV.ORDERS;
```

## 제약 사항

### Kafka 메시지 크기

Kafka는 기본 설정에서 단일 메시지 최대 크기를 약 1MB로 둔다. 브로커·프로듀서·컨슈머 설정으로 늘릴 수는 있지만, DB 레코드 하나가 이 크기를 넘지 않도록 주의한다. **LOB, JSON, TEXT 컬럼이 있는 테이블**은 CDC 대상에 넣을 때 특히 조심해야 한다.

### DB 메이저 버전 업그레이드

DB 메이저 버전 업그레이드는 Blue-Green 방식으로 진행되는데, 이 과정에서 **Replication Slot이 전부 사라진다.** 커넥터를 그대로 두면 Debezium이 새 Primary의 변경을 추적하지 못하므로 아래 순서로 진행한다.

| 순서 | 할 일 | 담당 |
|---|---|---|
| 1 | Debezium 커넥터 삭제 | 인프라 |
| 2 | DB 업그레이드, Slot 재생성 | DBA |
| 3 | Debezium 커넥터 재생성 | 인프라 |
| 4 | Snowflake에 최신 행이 반영되는지 확인 | 담당자 |

커넥터를 지웠다 다시 만드는 동안 Snowflake 반영이 지연되므로, 작업 시간을 사전에 합의한다. 마이너 버전 업그레이드는 Slot이 유지되어 이 절차가 필요 없는 것으로 보고 있다.

참고로 커넥터를 지우지 않고 두면 offset mismatch가 발생해 `offset.mismatch.strategy = trust_offset` 정책대로 에러가 나야 할 것 같은데, 에러 없이 멈춰 있는 걸 보면 이 옵션이 기대대로 동작하지 않는 듯하다.

### 대량 배치와 CDC 랙

보존 기간이 지난 이력을 지우는 배치처럼 **한 번에 많은 행을 바꾸는 작업은 WAL을 한꺼번에 만들어 CDC 랙을 키운다.** 실제로 로그인 내역 삭제 배치 때문에 컨슈머 랙이 치솟아, 삭제 속도를 분당 500건으로 제한했다가 랙이 해소된 뒤 원복한 적이 있다. DB에 부하를 주는 배치는 CDC 랙을 보면서 속도를 조절한다.

## 운영 체크리스트

위 내용 중 운영하면서 잊으면 안 되는 것만 모았다.

- **lag는 두 군데** — 소스 쪽 Replication Slot lag(`pg_replication_slots`, WAL 적체)와 싱크 쪽 Kafka consumer lag(Snowflake 반영 지연). 둘 다 알림에 건다.
- **heartbeat + keepalive** — heartbeat는 Kafka에 생존 신호를 보낼 뿐 DB에 변경을 만들지 않는다. 대상 테이블에 변경이 없으면 Slot이 멈춰 WAL이 쌓이므로, keepalive 배치가 대상 테이블에 주기적으로 no-op UPDATE를 넣어 Slot을 전진시킨다. 배치가 돌고 있는지, 실패 알림이 오는지 확인한다.
- **쓰지 않는 Slot은 즉시 제거** — 남겨 두면 그 Slot 기준으로 WAL이 보존된다.
- **커넥터 삭제 = offset 토픽 초기화** — MSK Connect에서 Debezium을 중단하려면 삭제뿐이고, 재생성 시 offset 토픽이 새로 생긴다. 재생성 동안 Snowflake 반영이 지연된다.
- **DB 메이저 업그레이드(Blue-Green) 전후** — Slot이 사라지므로 커넥터 삭제 → 업그레이드 → 커넥터 재생성 순서로 진행한다.
- **대량 배치는 CDC 랙을 보며** — 한 번에 많은 행을 바꾸는 작업은 속도를 제한한다.
- **레코드 크기** — Kafka 메시지 1MB 제한. LOB·JSON·TEXT 컬럼이 있는 테이블은 CDC 대상에 넣기 전에 크기를 확인한다.
- **시그널 테이블** — 증분 스냅샷을 쓰려면 Publication에 포함하고, DB 유저에게 RW 권한을 준다.
