---
title: "[CQRS] 카운트는 요청 경로가 아니라 이벤트로"
excerpt: "조회수·북마크 수 집계를 요청 경로에서 떼어 Kafka 이벤트 + 전용 컨슈머로 옮기는 과정."
date: 2025-01-15
published: true
tags:
  - CQRS
  - Kafka
---

## 문제

거래소에 **조회수**와 **북마크 수**를 붙여야 했다. 아이템 상세 페이지를 열면 조회수 1 증가, 북마크를 추가하면 북마크 수 1 증가.

처음에는 가장 자연스러운 자리에 코드를 뒀다 — **요청을 받는 그 자리**.

```go
// 아이템 상세 조회
func (s *ItemService) GetItem(ctx, itemID) (*Item, error) {
    item := repo.Get(ctx, itemID)
    repo.IncrementViewCount(ctx, itemID)   // ← 조회할 때 조회수 증가
    return item, nil
}

// 북마크 추가
func (s *BookmarkService) Add(ctx, userID, itemID) error {
    if err := repo.Insert(ctx, userID, itemID); err != nil {
        return err
    }
    repo.IncrementBookmarkCount(ctx, itemID)   // ← 북마크 추가 시 카운트 증가
    return nil
}
```

이 코드가 **세 가지**로 밀렸다 — 성능, 정합성, 그리고 "틀어진 숫자를 어떻게 바로잡느냐".

## 시도 1 — 요청 경로에서 DB 카운트 증가

### 접근

위 코드 그대로. 요청마다 DB `UPDATE items SET view_count = view_count + 1`.

### 결과

**실패** — 세 가지가 차례로 걸렸다.

**① 응답이 느려진다.** 아이템 조회는 원래 "`SELECT` 한 번"이면 됐는데 `UPDATE` 하나가 추가됐다. 조회 트래픽이 많은 상품은 `UPDATE` 경쟁이 심해져 지연이 더 커졌다.

**② 같은 행에 대한 쓰기 경합.** 인기 아이템은 초당 수백~수천 조회가 몰리고, 그 수만큼 같은 행에 `UPDATE`가 들어온다. PostgreSQL의 MVCC에서는 같은 행 반복 갱신이 **dead tuple**을 쌓고, VACUUM이 따라가지 못하면 테이블이 부풀어 느려진다.

**③ 어뷰징·중복 집계 — 숫자의 의미가 애매.** F5를 누를 때마다 조회수가 1씩 오르면 숫자가 실제 관심도를 반영하지 못한다. "같은 IP·같은 사용자의 중복 조회를 제외"라는 요구가 추가되는데, 그 로직을 요청 경로에 넣으면 응답이 더 느려진다.

### 분석

**카운트 증가는 "조회라는 사건의 결과"이지 "조회 응답의 일부"가 아니다.** 사용자가 아이템을 봤으면 **빨리 보여 주는 것**이 응답의 책임이고, **그 사건을 집계하는 것**은 그 다음 일이다. 둘을 같은 요청 안에 묶으면 사용자는 집계 비용을 함께 기다린다.

## 시도 2 — Redis에 올려 두고 주기적으로 반영

### 접근

카운트를 **Redis**에 올린다. 요청 경로에서는 Redis `INCR` 하나만 하고, 24시간 같은 윈도우로 IP·사용자 기준 중복을 제외한다. DB에는 주기적 flush.

```go
func (s *ItemService) GetItem(ctx, itemID, clientIP, userID) (*Item, error) {
    item := repo.Get(ctx, itemID)
    go incrementViewCount(itemID, clientIP, userID)   // 비동기, Redis
    return item, nil
}

func incrementViewCount(itemID, clientIP, userID string) {
    key := fmt.Sprintf("view:%s:%s:%s", itemID, clientIP, userID)
    added, _ := redis.SetNX(ctx, key, "1", 24*time.Hour)
    if added {
        redis.Incr(ctx, "view_count:"+itemID)
    }
}
```

### 결과

**부분 성공** — 응답은 빨라지고, DB 쓰기 부담도 사라졌다. 24시간 중복 제외도 들어갔다.

하지만 **카운트가 흩어지는 문제**가 새로 생겼다.

- 조회수는 아이템 서비스에서, 북마크 수는 북마크 서비스에서 각자 Redis를 건드린다.
- 둘 다 **마켓플레이스 BFF**에서 보여 주는데, "`view_count`"는 어디서 꺼내 쓸지가 애매하다. 아이템 서비스가 소유하는가, 북마크 서비스가 소유하는가.
- **다른 서비스**(예: 통계, 추천)도 카운트를 보고 싶어 하면 Redis를 직접 들여다보거나 서비스에 RPC를 걸어야 한다. 서비스마다 Redis 키 규약이 달라 혼란스럽다.

### 분석

Redis로 옮긴 건 "쓰기 비용"을 해결했지만, **"카운트의 주인이 누구인가"**는 여전히 모호했다. 카운트가 **비즈니스 자산**이 되면(다른 서비스가 참조, 분석 적재, 리더보드 노출) 그 주인이 분명해야 한다.

더 중요한 건, 카운트 증가 트리거가 **요청 경로 안의 비동기 호출**이라는 점이다. 요청 처리 중에 Redis가 다운되거나 goroutine이 패닉으로 죽으면 **카운트가 소실**된다. 요청 쪽은 "호출했다"고 믿고 끝낸다.

## 시도 3 — Kafka 이벤트 발행 → 집계 전용 컨슈머 (채택)

### 접근

요청 경로는 **"사건을 Kafka에 발행"**하는 데서 끝난다. 집계는 **전용 컨슈머**가 받아서 한다.

```
요청 경로:
    GetItem(itemID) → DB SELECT → publish("item.viewed", {itemID, clientIP, userID, ts}) → 응답

집계 컨슈머 (별도 서비스):
    "item.viewed" / "item.bookmarked" / "item.unbookmarked" 구독
    ↓
    24시간 중복 제외 (Redis)
    ↓
    카운트 갱신 (Redis + DB)
```

```go
// 요청 경로 — 조회수 증가 코드가 아예 없음
func (s *ItemService) GetItem(ctx, itemID, clientIP, userID) (*Item, error) {
    item := repo.Get(ctx, itemID)
    // 동기 발행이지만 프로듀서가 내부 버퍼에 넣고 바로 반환한다
    publisher.Publish("item.viewed", ViewEvent{
        ItemID: itemID, ClientIP: clientIP, UserID: userID,
        At: time.Now(),
    })
    return item, nil
}

// 집계 컨슈머
func (c *CountConsumer) HandleViewed(ctx, evt ViewEvent) error {
    key := fmt.Sprintf("view:%s:%s:%s", evt.ItemID, evt.ClientIP, evt.UserID)
    added, _ := redis.SetNX(ctx, key, "1", 24*time.Hour)
    if !added {
        return nil   // 중복 조회, 집계 안 함
    }
    return countRepo.IncrementView(ctx, evt.ItemID)
}

func (c *CountConsumer) HandleBookmarked(ctx, evt BookmarkEvent) error {
    return countRepo.IncrementBookmark(ctx, evt.ItemID)
}
```

### 결과

**성공** — 세 가지가 동시에 좋아진다.

**① 요청 경로가 가볍다.** 아이템 조회 API는 `SELECT` 한 번 + Kafka 발행. 발행은 프로듀서 내부 버퍼에 넣고 바로 반환하므로(시도 2의 goroutine 방식과 달리 요청이 끝나도 유실되지 않는다) 응답 시간이 거의 "순수 조회"다.

**② 카운트의 주인이 분명하다.** 집계 전용 컨슈머와 **카운트 전용 테이블**이 이 집계의 단일 진실 소스. 다른 서비스가 카운트를 보고 싶으면 이 테이블(또는 이걸 노출하는 RPC)을 읽는다.

**③ 다른 소비자를 자유롭게 추가한다.** `item.viewed` 토픽을 다른 컨슈머가 구독하면 **같은 이벤트로 다른 집계**(통계, 리더보드, Snowflake 분석 적재)를 할 수 있다. 요청 경로를 건드리지 않는다.

### 분석 — CQRS의 작은 적용

이 패턴은 사실 **CQRS**(Command Query Responsibility Segregation)의 축소판이다. "쓰기 모델"과 "읽기 모델"을 분리하는 큰 패턴에서, 여기선 **"쓰기 경로"와 "집계 경로"**를 분리한 셈이다.

| 구조 | 쓰기(요청) | 집계 |
|---|---|---|
| 1. 같이 (요청 경로에서 UPDATE) | 요청 처리 + 카운트 증가 | — (같이 처리) |
| 2. 비동기 분리 (goroutine) | 요청 처리 + 이벤트 호출 (같은 프로세스) | 같은 프로세스에서 비동기 |
| **3. 토픽 분리 (CQRS, 채택)** | 요청 처리 + 이벤트 발행 | 별도 서비스가 소비 |

핵심은 **"쓰기 경로가 집계 결과에 의존하지 않는다"**는 점이다. 집계 컨슈머가 다운되어도 쓰기는 영향 없고, 집계가 느려져도 쓰기 응답은 빨라진다. 반대로 집계는 **배치·재처리**로 정합성을 맞출 시간이 있다.

### 숫자가 어긋나면 — 리셋

"이벤트 기반 집계"의 함정 하나 — **Kafka 재시도·중복·필터링 버그** 등으로 카운트가 **점점 어긋난다.** 처음 보고가 들어오면 "어디서부터 틀어졌지" 역추적이 어렵다.

해법은 간단했다 — **"리셋" RPC**를 두는 것.

```go
// 특정 아이템의 북마크 수를 실제 북마크 테이블 기반으로 다시 계산
rpc ResetBookmarkCount(ResetRequest) returns (ResetResponse);

func (s *CountService) Reset(ctx, itemID string) error {
    actual := db.CountBookmarksForItem(ctx, itemID)
    return countRepo.SetBookmarkCount(ctx, itemID, actual)
}
```

- "진실의 원천"(북마크 테이블의 실제 행 수)에서 다시 계산한다.
- 어긋난 원인을 다 찾아 고치기 전에 **일단 리셋**해서 숫자를 맞춘다.
- 이후 어긋나지 않게 **집계 코드를 고치고**, 또 어긋나면 **또 리셋한다.**

이 패턴의 가치는 **"원인을 찾기 전에 사용자에게 보이는 숫자를 바로잡을 수 있다"**는 점이다. 원인 추적은 코드 리뷰·로그 분석에 시간이 걸리지만, 리셋은 1분이면 끝난다. **운영은 "사용자에게 영향 없게" 먼저 하고 근본 원인은 다음에 고친다.**

### 쓰기와 집계의 분리가 자연히 해 주는 것

- **이벤트 로그가 생긴다** — Kafka 토픽에 남은 이벤트는 그 자체로 "어떤 조회·북마크가 있었는지"의 기록. 보존 기간 안에서는 재처리가 가능하다.
- **다른 집계도 같은 소스로 할 수 있다** — "시간대별 조회수 분포", "지역별 인기 아이템", "7일간 추세" 같은 분석이 추가되면 **새 컨슈머만 추가**하면 된다. 요청 경로도, 기존 집계도 안 건드린다.
- **배치와 실시간을 혼합할 수 있다** — 실시간 컨슈머가 "지금 당장 보여줄 숫자"를 집계하고, 야간 배치가 "정확한 숫자"로 보정한다. 둘 다 같은 Kafka 토픽을 소스로 쓴다.

## 다른 방법 — 쓰기 경로에서 바로 "최종 일관성 보장"

Kafka 없이 쓰기 경로에서 바로 처리하되, **Transactional Outbox**로 신뢰성을 보장하는 변형도 있다.

```sql
BEGIN;
INSERT INTO bookmarks (...);
INSERT INTO outbox (event_type, payload) VALUES ('item.bookmarked', ...);
COMMIT;
-- 별도 워커가 outbox를 읽어 카운트 갱신
```

- 얻는 것: Kafka 없이도 "쓰기 경로에서 '이벤트 발행 보장' + 집계 비동기 처리"를 얻는다. 인프라가 가볍다.
- 치르는 것: 다른 서비스가 같은 이벤트를 구독하려면 결국 Kafka 같은 메시지 브로커가 필요하다. Outbox는 "한 서비스 안에서의 신뢰성"에 적합.
- **집계가 같은 서비스에서만 쓰이고** 다른 소비자가 없다면 이 쪽이 가볍다. 분석·다중 서비스 노출이 필요하면 Kafka가 맞다.

## 정리

| 방식 | 쓰기 경로 | 집계의 주인 | 적합한 자리 |
|---|---|---|---|
| 1. 요청 경로에서 DB UPDATE | 느림 | 모호 | 트래픽 매우 낮은 프로토타입 |
| 2. 비동기 Redis | 빠름 | 모호 | 집계가 한 서비스 안에 머물 때 |
| **3. Kafka 이벤트 + 전용 컨슈머 (채택)** | 빠름 | 분명 | 다른 서비스도 쓸 수 있는 집계 |
| 다른 방법. Outbox | 빠름 | 분명 | 한 서비스 안의 신뢰성만 필요할 때 |

**채택: 시도 3.** 카운트는 **집계의 책임**이고, 집계는 **쓰기와 분리된 자기 자리**에 있어야 한다. 요청 경로는 사건을 알리기만 하고, 집계는 그 사건을 받아 처리한다. 숫자가 어긋나면 **리셋**으로 "진실의 원천"에서 다시 계산한다.

- 요청 응답에 **"집계 비용"이 묻어 있으면** 집계를 분리한다. 응답 시간이 짧아지고, 쓰기와 집계가 서로 다른 규모로 스케일할 수 있다.
- 집계 결과는 **단일 서비스가 소유**해야 한다. 여러 자리에서 각자 올리면 "같은 카운트인데 값이 다르다"가 생긴다.
- 이벤트 기반 집계는 어긋남이 생긴다 — **"리셋" 기능을 처음부터 넣어 둔다.** 원인 수정은 시간이 걸리지만 리셋은 즉시 된다.
- 같은 이벤트로 **다른 집계를 할 수 있다는 가능성**이 생긴다. 분석 적재, 리더보드, 추천 — 모두 **새 컨슈머 추가**로 끝난다.
