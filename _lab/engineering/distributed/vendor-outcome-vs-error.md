---
title: "[API] 벤더 응답이 '200 OK + outcome'일 때의 에러 분기"
excerpt: "외부 결제 벤더가 사용자 실수와 시스템 장애를 4xx와 5xx에 섞어서 돌려줄 때, 우리 API가 프론트에 어떻게 전달할지 다시 설계한 과정. 성공/실패 여부를 HTTP 상태코드가 아닌 응답 본문의 outcome 필드로 옮기면서 생긴 단순함과 함정."
date: 2025-09-09
published: false
tags:
  - API 설계
  - 외부 API
---

## 문제

결제 벤더에 신용카드 인증을 요청하면 응답이 아래처럼 돌아온다.

- 승인됨 (성공)
- 승인됨, 다만 3DS 추가 인증 필요
- 카드 종류 미지원
- 같은 카드로 이미 가입됨
- 수상한 결제 수단으로 판정됨 (사기 탐지 걸림)
- 세션이 만료되어 처음부터 다시 해야 함
- 벤더 내부 장애 (DB 다운, 타임아웃 등)

HTTP 상태코드로 환산하면 벤더는 이걸 **4xx·5xx·2xx에 섞어서** 돌려줬다. 그중 어떤 카드 종류 미지원·사기 탐지 같은 사용자 측 문제는 4xx로, 벤더 장애는 5xx로, 승인은 200으로. 우리가 이걸 받아서 **프론트에 어떻게 전달할 것인가**가 문제였다.

우리 API는 gRPC지만 외부에선 REST처럼 보이고, 프론트는 HTTP 상태코드와 응답 본문을 둘 다 받는다. 자연스러운 방향은 **"벤더 상태코드를 그대로 중계"**다. 하지만 중간에 재고가 쌓이면서 그 선택이 흔들렸다.

## 시도 1 — 벤더 상태코드 그대로 중계

### 접근

벤더가 4xx를 주면 우리도 4xx로, 5xx면 5xx로 돌려준다. 프론트는 상태코드만 보고 성공/실패를 판단한다.

```go
func (s *Service) VerifyCard(ctx, req) (*Response, error) {
    res, err := vendor.Authorize(ctx, req)
    if err != nil {
        // 벤더가 4xx/5xx를 돌려줬다
        return nil, mapVendorError(err)
    }
    return toResponse(res), nil
}
```

### 결과

**실패** — 프론트 입장에서 **4xx와 5xx의 UX가 전혀 다르다.**

- 4xx (사용자가 고칠 수 있음, 예: 카드 종류 미지원) → "다른 카드로 다시 해 보세요"
- 5xx (벤더 장애) → "잠시 후 다시 시도해 주세요"

그런데 둘 다 "실패"라는 신호로 왔다. 프론트가 둘을 구분하려면 응답 본문의 **에러 메시지 문자열**이나 특정 **에러 코드**를 파싱해야 했고, 그 매핑 테이블이 한쪽 코드에서만 관리됐다. 벤더가 새 에러 종류를 추가하면 프론트가 모를 때까지 **그 에러는 그냥 "일시 장애"로 보였다.**

### 분석

HTTP 상태코드는 **"요청을 다시 보낼 수 있는가"**를 판단하는 축이다. 그런데 결제 응답에는 그 축이 하나가 아니었다.

| 상태 | "다시 보낼 수 있나?" | 프론트가 사용자에게 보여줄 메시지 |
|---|---|---|
| 승인 | — | 성공 화면 |
| 카드 미지원 | 다른 카드로 → 예 | "이 카드는 사용할 수 없습니다" |
| 사기 탐지 | → 아니오 | "안전상 결제가 거절됐습니다" |
| 세션 만료 | 처음부터 다시 → 예 | "세션이 끝났어요, 다시 시도하세요" |
| 벤더 장애 | 조금 기다렸다 재시도 → 예 | "일시적 오류, 잠시 후 다시" |

**사용자 실수(카드 종류)**, **차단(사기 탐지)**, **세션 문제(만료)**, **시스템 장애(벤더 다운)**는 전혀 다른 UX를 요구하는데, HTTP 상태코드 하나로는 다섯 축을 구분할 수 없다. 상태코드는 "다시 보낼 수 있나"를 간단히 전하기엔 좋지만, **"어떤 종류의 실패인가"**를 담기엔 좁다.

## 시도 2 — 응답 본문에 "outcome" 필드 두기 (채택)

### 접근

**"요청을 받아 처리했다"**는 것 자체가 성공이면 200으로 응답한다. 요청 처리 중에 생긴 **실패 종류는 응답 본문의 `outcome` 필드**로 담는다. 벤더 내부의 5xx (시스템 장애)만 그대로 에러로 올린다.

```protobuf
message VerifyCardResponse {
    bool   authorized         = 1;   // 승인 여부
    bool   challenge_required = 2;   // 3DS 추가 인증 필요
    string outcome            = 3;   // 실패 사유 코드 (승인됐으면 빈 값)
}
```

```go
func (s *Service) VerifyCard(ctx, req) (*Response, error) {
    res, err := vendor.Authorize(ctx, req)
    if err != nil {
        // 벤더 네트워크·내부 오류 (5xx)
        return nil, status.Error(codes.Unavailable, "vendor unreachable")
    }
    return &Response{
        Authorized:        res.Authorized,
        ChallengeRequired: res.ChallengeRequired,
        Outcome:           res.Outcome,   // 승인 성공이면 "", 실패면 "UNSUPPORTED_CARD_TYPE" 등
    }, nil
}
```

프론트는 이렇게 쓴다.

```typescript
const res = await api.verifyCard(req);
if (res.authorized) {
    // 승인됨
} else if (res.outcome === "UNSUPPORTED_CARD_TYPE") {
    showMessage("이 카드는 사용할 수 없습니다");
} else if (res.outcome === "ALREADY_IN_USE") {
    showMessage("이 카드는 이미 다른 계정에서 사용 중입니다");
} else if (res.outcome === "SESSION_NOT_FOUND") {
    restartFlow();
} else if (res.outcome === "SUSPICIOUS_PAYMENT_INSTRUMENT") {
    showMessage("안전상 결제가 거절됐습니다");
} else {
    showMessage("처리 중 오류가 발생했어요");
}
```

HTTP 상태코드가 떠맡던 "성공/실패"와 "다시 보낼 수 있나"의 두 축이 **본문의 `authorized` + `outcome`**으로 분리됐다.

### 결과

**성공** — 프론트가 **분기하기 쉬워지고**, 벤더가 새 outcome을 추가해도 매핑 하나만 추가하면 됐다. 벤더의 상태코드 체계가 바뀌어도 우리 API 스펙은 영향을 안 받는다.

### 분석 — HTTP 상태코드가 담아야 할 것

이 선택은 **"HTTP 상태코드와 비즈니스 결과의 역할을 분리"**한 것이다. 각자의 역할은 이렇다.

| 레이어 | 무엇을 뜻하나 | 예 |
|---|---|---|
| HTTP 상태코드 | 요청이 서버에 **도달해 처리됐는지** | 200 OK, 500 Internal Server Error |
| 응답 본문의 결과 필드 | 처리 결과의 **성공·실패와 분류** | `authorized`, `outcome` |

승인이 거절된 것은 **요청 처리는 성공**이고 **비즈니스 결과만 실패**다. 둘을 같은 축에 두면 둘 중 하나가 흐려진다. 분리하면 각 레이어가 담아야 할 것만 담는다.

### 실제로 추가한 outcome 코드들

- `UNSUPPORTED_CARD_TYPE` — 지원하지 않는 카드사·카드 종류
- `ALREADY_IN_USE` — 같은 카드가 다른 계정에서 이미 쓰이고 있음 (멀티계정 방지)
- `SUSPICIOUS_PAYMENT_INSTRUMENT_DETECTED` — 벤더의 사기 탐지가 걸림
- `SESSION_NOT_FOUND` — 3DS 중간 세션이 만료됨 (처음부터 재시작)
- `COUNTRY_CODE_MISMATCH` — 카드 발급국과 신청 국가가 다름
- `TRANSACTION_STAGE_HAS_ALREADY_BEEN_PROCESSED` — 같은 트랜잭션에 대한 중복 완료 요청

각각이 **프론트에서 다른 안내·다른 액션**을 유발한다. 이걸 HTTP 상태코드로 전하려면 커스텀 코드를 쓰거나 메시지 문자열에 담아야 하는데, 둘 다 파싱이 깨지기 쉽다. outcome 필드는 **강 타입 enum**으로 두면 프론트가 자동완성까지 받으며 분기할 수 있다.

### 함정 두 가지

**"200이면 성공"이라는 인상에 속지 않기** — 호출자가 HTTP 상태코드만 보면 승인 거절도 "성공"으로 로그가 남는다. 모니터링 대시보드에서 "결제 성공률 99.9%"가 뜨는데 실제 승인률은 85%인 상황이 나온다. 응답 본문의 `authorized`를 기준으로 **별도 메트릭**을 찍어야 한다.

**outcome 매핑을 공유하기** — outcome 문자열이 서버·프론트·벤더 세 자리에 존재한다. 벤더가 새 outcome을 추가할 때 세 자리를 동기화해야 한다. proto 파일에 outcome enum을 선언하고 server·client 둘 다 거기서 생성된 상수를 쓰면 자동 동기화된다.

```protobuf
enum Outcome {
    OUTCOME_UNSPECIFIED               = 0;
    OUTCOME_UNSUPPORTED_CARD_TYPE     = 1;
    OUTCOME_ALREADY_IN_USE            = 2;
    OUTCOME_SUSPICIOUS_PAYMENT        = 3;
    OUTCOME_SESSION_NOT_FOUND         = 4;
    OUTCOME_COUNTRY_CODE_MISMATCH     = 5;
    // ...
}
```

## 다른 방법 — 에러 코드에 모두 담기

처음 생각했던 방향도 아예 틀린 건 아니다. HTTP 상태코드는 그대로 두되, **에러 응답 본문에 구조화된 code를 담는** 방식이다.

```json
HTTP/1.1 400 Bad Request
{
  "error": {
    "code": "UNSUPPORTED_CARD_TYPE",
    "message": "이 카드 종류는 사용할 수 없습니다"
  }
}
```

- 얻는 것: REST 관습에 맞다. 로드밸런서·게이트웨이가 상태코드로 메트릭을 자연히 집계한다.
- 치르는 것: 프론트가 `response.status`와 `response.body.error.code` 두 자리를 봐야 한다. 로그·메트릭에 **"4xx 급증 알림"**이 울릴 때 실제로 "사용자 입력 실패가 늘었을 뿐 시스템은 멀쩡"인 경우도 섞인다.
- 이 방식은 **정말로 요청 자체가 잘못됐을 때**(스키마 오류, 인증 실패, 권한 없음)에 적합하다. 승인 심사처럼 **"요청 처리는 됐지만 결과가 실패"**인 상황에선 outcome 쪽이 자연스럽다.

## 정리

| 방식 | "성공/실패"가 담기는 자리 | 적합한 자리 |
|---|---|---|
| HTTP 상태코드 중계 | HTTP 상태코드 | 요청 자체의 오류 (스키마·인증·권한) |
| **200 + outcome (채택)** | 응답 본문 | 요청은 처리됐으나 비즈니스 결과가 실패일 수 있는 심사·승인·검증 |
| 다른 방법. 상태코드 + 구조화된 error.code | 둘 다 (상태코드 + 본문) | REST 관습과 로드밸런서 메트릭을 중시할 때 |

**채택: 200 + outcome.** 벤더처럼 "처리는 성공, 결과는 실패일 수 있는" 응답은 HTTP 상태코드 하나의 축으로 담기 어렵다. **처리 성공(200)과 결과(outcome)를 분리**해, 상태코드는 "서버가 처리했다"를, 본문은 "결과가 어떻게 됐다"를 각각 담는다.

- 외부 벤더가 4xx·5xx·2xx에 결과를 섞어 돌려줄 땐, 그걸 **그대로 중계하지 말고** 우리 API에서 두 축으로 **재구성**한다. 벤더의 상태코드 체계가 바뀌어도 우리 스펙은 안 흔들린다.
- outcome 필드는 **강 타입 enum**으로. 문자열이면 프론트가 오타·누락을 못 잡는다.
- outcome 성공 여부와 HTTP 성공 여부는 다르다. **모니터링은 outcome 기준**으로 따로 찍는다.
- 요청 자체의 오류(권한·스키마)는 그대로 4xx로 돌려준다. outcome은 심사·승인·검증처럼 **"요청은 맞지만 결과가 갈릴 수 있는"** 경우를 위한 것이다.
