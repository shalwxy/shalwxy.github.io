---
title: "[검증] 검증은 건마다가 아니라 목록 조회로 — N+1을 피하는 가장 소박한 방법"
excerpt: "아이템 수십 개를 검증하려고 외부 서비스를 수십 번 호출하던 코드를, '한 번에 다 받아 와서 메모리에서 비교'로 바꾼 과정. 흔한 N+1 문제이지만 '검증'이라는 맥락에서 보면 단순 조회 캐싱보다 더 자연스러운 해결이 있다."
date: 2024-02-13
published: false
tags:
  - 성능
  - gRPC
---

## 문제

NFT 아이템을 거래소에 등록·해제하는 흐름을 검증하는 코드가 있다. 사용자가 **여러 아이템을 한 번에** 등록할 수 있는데, 검증 로직은 아이템 하나마다 상태 서비스에 "이 아이템이 등록 가능한 상태인가?"를 물었다.

```go
func (v *Validator) Validate(ctx context.Context, items []Item) error {
    for _, item := range items {
        state, err := stateService.Get(ctx, item.ID)   // 아이템마다 1 RPC
        if err != nil { return err }
        if state.Owner != item.ExpectedOwner {
            return ErrOwnerMismatch
        }
        if !state.Transferable {
            return ErrNotTransferable
        }
    }
    return nil
}
```

아이템이 10개면 상태 서비스를 10번, 50개면 50번 호출한다. **N+1 쿼리**의 RPC 판본이다.

증상은 익숙하다. 네트워크 왕복이 쌓여 전체 지연이 커지고, 상태 서비스는 "한 요청에 포함된 일괄 검증" 때마다 트래픽을 수십 배로 받는다. 상태 서비스가 느려지면 거래소 전체가 같이 느려진다.

## 시도 1 — 각 호출에 캐시를 붙이기

### 접근

상태 서비스 응답을 Redis에 캐시한다. 같은 아이템이 짧은 시간 안에 다시 조회되면 캐시에서 돌려준다.

```go
func (v *Validator) Validate(ctx context.Context, items []Item) error {
    for _, item := range items {
        state, err := stateCache.GetOrFetch(ctx, item.ID, func() (*State, error) {
            return stateService.Get(ctx, item.ID)
        })
        if err != nil { return err }
        // ... 비교
    }
    return nil
}
```

### 결과

**부분 성공** — 같은 아이템이 **반복 조회**되는 경우에는 효과가 있다. 하지만 지금 상황은 다르다. 사용자가 보낸 요청의 아이템 목록은 **서로 다른 아이템 N개**다. 첫 번째 호출에서 캐시가 비어 있고, 두 번째도, N번째도 비어 있다. **한 요청 안에서는 캐시가 전혀 도움이 안 된다.**

### 분석

캐시는 **"같은 조회가 반복될 때"** 쓴다. 지금 문제는 조회 자체가 N개짜리 **배치**라는 점이고, 배치 안의 조회는 **서로 다른 키**다. 캐시의 조건이 애초에 맞지 않는다.

더 중요한 건, 이 코드가 "N개의 조회"로 적혀 있다는 사실이다. 상태 서비스가 N번 받는 호출은 **"아이템 N개의 상태"**라는 하나의 질문을 N조각으로 쪼개서 보낸 것이다. 질문 자체를 쪼개지 않으면 한 번에 받을 수 있다.

## 시도 2 — 상태 서비스에 "목록 조회" API를 더하고 한 번에 받기 (채택)

### 접근

상태 서비스에 **ID 여러 개를 한 번에 받는 RPC**를 추가한다. 검증 코드는 그 결과를 메모리에 담아 두고 각 아이템을 비교한다.

상태 서비스 proto:

```protobuf
service StateService {
    rpc Get(GetRequest) returns (State);           // 기존 단건 조회
    rpc List(ListRequest) returns (ListResponse);  // 추가: ID 목록 조회
}

message ListRequest  { repeated string ids = 1; }
message ListResponse { repeated State states = 1; }
```

검증 코드:

```go
func (v *Validator) Validate(ctx context.Context, items []Item) error {
    ids := lo.Map(items, func(i Item, _ int) string { return i.ID })

    // RPC 한 번
    res, err := stateService.List(ctx, &ListRequest{Ids: ids})
    if err != nil { return err }

    stateByID := lo.KeyBy(res.States, func(s *State) string { return s.ID })

    // 메모리에서 비교
    for _, item := range items {
        state, ok := stateByID[item.ID]
        if !ok {
            return ErrItemNotFound
        }
        if state.Owner != item.ExpectedOwner {
            return ErrValidationFailed
        }
        if !state.Transferable {
            return ErrValidationFailed
        }
    }
    return nil
}
```

### 결과

**성공** — 상태 서비스 호출이 **N회 → 1회**로 줄었다. 네트워크 왕복이 한 번이고, 상태 서비스 쪽도 "ID N개로 한 쿼리"가 들어오므로 DB 왕복도 효율적이다(한 번의 `IN (...)` 쿼리로 끝난다).

### 분석 — "메모리에서 비교"가 핵심

이 패턴의 두 단계가 각자 다른 의미를 갖는다.

| 단계 | 역할 |
|---|---|
| 한 번에 받기 | **네트워크 왕복을 1회로** 줄인다 |
| 메모리에서 비교 | **검증 로직을 데이터 조회와 분리**한다 |

두 번째가 종종 간과된다. 목록을 받아 와서 다시 `for` 루프 안에서 하나씩 상태 서비스를 호출하는 식이면 N+1은 그대로다. **검증은 메모리 자료구조(여기선 `stateByID` 맵)에 대해 하고, 외부 호출은 그 자료구조를 채우기 위해 딱 한 번만** 한다.

### 에러 타입을 통일하기

처음에는 "소유자 불일치", "전송 불가" 같은 **개별 에러**를 돌려줬다. 그런데 호출하는 쪽(민트 흐름의 트랜잭션 분석기)에서는 **"검증이 실패했나 아닌가"**만 알면 충분했고, 개별 사유는 로그에 남기면 그만이었다.

호출자가 에러 종류별로 분기하지 않아도 되도록, 검증 실패는 **하나의 에러 타입**(`ErrValidationFailed`)으로 통일하고 세부 사유는 로그에만 담았다.

```go
if state.Owner != item.ExpectedOwner {
    log.Warn("owner mismatch", "item", item.ID, "expected", item.ExpectedOwner, "actual", state.Owner)
    return ErrValidationFailed
}
```

이게 왜 더 낫나:

- 호출자는 `errors.Is(err, ErrValidationFailed)` 한 줄로 처리한다.
- 새 검증 조건이 추가되어도 호출자 코드를 바꿀 필요가 없다.
- 세부 사유는 디버깅할 때 로그에서 찾으면 된다 — 호출자의 **제어 흐름**에 섞일 필요가 없다.

이 구분은 "**호출자에게 전해야 할 것**"과 "**디버깅을 위해 남겨야 할 것**"을 분리한다. 전자는 에러 타입, 후자는 로그다. 섞으면 호출자 코드가 지저분해지고 로그에는 아무것도 안 남는다.

## 다른 방법 — DataLoader로 자동 배치

이 패턴을 조직 안에서 여러 번 반복하면, 매번 "목록 조회 RPC를 만들고 호출자가 수동으로 묶는" 일이 번거로워진다. **DataLoader** 패턴은 이걸 자동화한다.

```go
// 호출 쪽은 "하나씩" 요청하는 것처럼 보이지만,
// 내부에서 짧은 시간창(예: 10ms)의 요청을 모아 한 번에 보낸다
state := loader.Load(ctx, item.ID)
```

- 얻는 것: 호출자 코드가 "하나씩 조회"로 보여 읽기 쉽고, 배치는 뒤에서 자동으로. GraphQL 생태계에서 흔한 패턴이다.
- 치르는 것: 짧은 지연(배치 윈도우)이 추가되고, 실패 처리·타임아웃·순서 보장 등 제어가 복잡해진다. 라이브러리 의존성이 늘어난다.
- **같은 조회를 수십 자리에서 수십 번 반복**하는 상황(예: GraphQL 리졸버에서 매번 사용자 정보 조회)에 적합하다. 이 글의 경우처럼 **한 자리에서 명시적으로 N개를 검증**하는 상황이면 목록 조회 RPC 쪽이 더 직관적이다.

## 정리

| 방식 | 호출 횟수 | 적합한 자리 |
|---|---|---|
| 건마다 + 캐시 | N (캐시 적중 시 ↓) | **같은 조회가 시간 차로 반복**될 때 |
| **목록 조회 (채택)** | 1 | 검증·매핑 등 **한 자리에서 N개를 처리**할 때 |
| 다른 방법. DataLoader | 자동 배치 | GraphQL 등 **호출이 여러 자리에 흩어진** 아키텍처 |

**채택: 목록 조회.** "N개를 하나씩 N번"을 보면 외부 서비스에 **"N개짜리 하나의 질문"**을 어떻게 보낼지를 먼저 생각한다. RPC를 하나 더 추가하는 비용은 가장 소박한 N+1 해결책이다.

- `for` 루프 안에서 외부 호출이 보이면 **N+1**을 의심한다. 같은 요청 안에서 반복되는 호출인지, 다른 키로 N번 호출인지에 따라 해결이 다르다.
- **"한 번에 받기"와 "메모리에서 비교"는 세트**다. 목록을 받았는데 비교하면서 또 호출하면 N+1은 그대로다.
- 호출자가 **에러 종류별로 분기할 필요가 없다면** 하나의 에러 타입으로 통일한다. 세부 사유는 로그에. 에러 타입은 **제어 흐름을 위한 것**이고, 로그는 **디버깅을 위한 것**이다.
- 조회가 여러 자리에 흩어져 있어 **호출자 코드를 깨끗이 유지하는 게 더 중요**하면 DataLoader가 낫다. 한 자리에서 명시적으로 N개를 처리하는 상황이면 목록 조회 RPC가 더 솔직하다.
