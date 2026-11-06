---
title: "[설계] 정책은 코드 분기가 아니라 enum/설정으로"
excerpt: "자주 바뀌는 '무엇을 검사할지'를 코드 분기 대신 enum/설정으로 옮기는 과정."
date: 2026-07-09
published: true
tags:
  - API 설계
  - Go
---

## 문제

출금 전에 여러 가지 검사를 한다 — 국가 코드, 등급, 일일 한도, 사용자의 잠금 설정. 어느 검사를 돌릴지가 **기획에 따라 몇 번이고 바뀌었다.** "이번 분기는 등급으로 거르자", "아니, 사용자 잠금 설정으로 하자", "프론트 어떤 화면에서는 한도만 보자", …

처음 구현은 자연스럽게 분기문이었다.

```go
func (s *Service) CheckEligibility(ctx context.Context, req Request) error {
    if err := s.checkRegion(ctx, req); err != nil { return err }
    if err := s.checkRankVip(ctx, req); err != nil { return err }
    if err := s.checkDailyLimit(ctx, req); err != nil { return err }
    if err := s.checkUserLock(ctx, req); err != nil { return err }
    return nil
}
```

이 코드가 **기획이 바뀔 때마다 한 번씩 수정**됐다. "이번엔 등급 검증을 뺀다", "저 API에서는 잠금만 본다" 같은 요구가 들어오면 함수를 쪼개거나 플래그를 넣거나 호출부에 따라 분기가 늘어난다. 매번 코드를 고치고 배포하고 롤백하는 일이 반복됐다.

문제의 본질은 "**어느 검사를 돌릴지**"가 **코드에 하드코딩**돼 있다는 점이었다. 이 결정은 서비스 코드에 속하기엔 너무 자주 바뀌고, 호출자별로도 다르다.

## 시도 1 — 호출자별 함수를 늘리기

### 접근

용도별로 함수를 따로 만든다. "전체 검사", "한도만", "잠금만" 같은 식이다.

```go
func (s *Service) CheckAll(ctx, req) error        { /* 네 가지 다 */ }
func (s *Service) CheckWithdrawalLimit(ctx, req) error { /* 한도만 */ }
func (s *Service) CheckUserLock(ctx, req) error   { /* 잠금만 */ }
```

### 결과

**실패** — 조합이 폭발한다. "한도 + 잠금 두 개"가 필요한 자리가 생기면 또 함수를 하나 만든다. 공통 로직(DB 조회, 검증 공통 코드)이 함수마다 중복되고, 하나를 고치면 여러 자리를 동기화해야 한다.

### 분석

함수를 쪼갠 것은 "무엇을 검사할지"를 **함수 이름**에 넣은 셈이다. 함수 이름은 코드라서, 변하지 않을 것일 때만 쓸 수 있다. 자주 바뀌는 결정을 함수 이름에 담으면 변할 때마다 **코드를 만들어야** 한다.

## 시도 2 — 매개변수 플래그로 켜고 끄기

### 접근

함수 하나로 합치고, 어떤 검사를 돌릴지를 boolean 플래그로 받는다.

```go
type CheckOptions struct {
    Region       bool
    RankVip      bool
    DailyLimit   bool
    UserLock     bool
}

func (s *Service) Check(ctx, req, opts CheckOptions) error {
    if opts.Region    { ... }
    if opts.RankVip   { ... }
    if opts.DailyLimit{ ... }
    if opts.UserLock  { ... }
    return nil
}
```

### 결과

**부분 성공** — 함수 수가 줄었다. 하지만 호출자가 네 개의 boolean을 **매번 채워서** 넘겨야 하고, 새 검사가 추가되면 구조체에 필드가 늘어 **모든 호출자가 수정**된다.

### 분석

boolean 플래그 묶음은 **"기본값이 뭐냐"**가 안 정해진다. `CheckOptions{}`를 넘기면 "아무 검사도 안 함"인데, 그게 의도된 건지 호출자가 잊은 건지 구분이 안 된다. 호출자마다 관용구(preset)가 다르면 결국 "자주 쓰는 조합을 변수로 만들어 두자"가 되어 시도 1로 돌아간다.

## 시도 3 — enum 하나로 "무엇을 검사할지" 받기 (채택)

### 접근

검사 종류를 **enum**으로 정의하고, API가 그중 하나를 받는다. 특별한 값 `ALL`은 "전부 검사"를 뜻한다.

proto 정의:

```protobuf
message CheckEligibilityRequest {
    string from_address = 1;
    string amount       = 2;

    enum CheckType {
        ALL                   = 0;   // 기본값 = 전부
        POLICY_REGION_COUNTRY = 1;
        POLICY_RANK_VIP       = 2;
        POLICY_LIMIT_DAILY    = 3;
        USER_SETTING_LOCK     = 4;
    }
    CheckType check_type = 3;
}
```

서버 쪽:

```go
type CheckType int32

const (
    CheckTypeAll                 CheckType = 0
    CheckTypePolicyRegionCountry CheckType = 1
    CheckTypePolicyRankVip       CheckType = 2
    CheckTypePolicyLimitDaily    CheckType = 3
    CheckTypeUserSettingLock      CheckType = 4
)

func (t CheckType) Validate() bool {
    switch t {
    case CheckTypeAll, CheckTypePolicyRegionCountry,
         CheckTypePolicyRankVip, CheckTypePolicyLimitDaily,
         CheckTypeUserSettingLock:
        return true
    default:
        return false
    }
}

func (s *Service) Check(ctx context.Context, req Request) error {
    t := req.CheckType
    if t == CheckTypeAll || t == CheckTypePolicyRegionCountry {
        if err := s.checkRegion(ctx, req); err != nil { return err }
    }
    if t == CheckTypeAll || t == CheckTypePolicyRankVip {
        if err := s.checkRankVip(ctx, req); err != nil { return err }
    }
    if t == CheckTypeAll || t == CheckTypePolicyLimitDaily {
        if err := s.checkDailyLimit(ctx, req); err != nil { return err }
    }
    if t == CheckTypeAll || t == CheckTypeUserSettingLock {
        if err := s.checkUserLock(ctx, req); err != nil { return err }
    }
    return nil
}
```

호출자는 이렇게 쓴다.

```go
// 전체 검사 (대부분의 경로)
svc.Check(ctx, Request{..., CheckType: CheckTypeAll})

// 프론트 화면의 "한도만 조회" 경로
svc.Check(ctx, Request{..., CheckType: CheckTypePolicyLimitDaily})
```

### 결과

**성공** — 세 가지가 동시에 해결됐다.

- 함수는 **하나**다. 공통 로직이 한 자리에 모여 있다.
- 호출자는 **enum 하나만** 넘긴다. 플래그 묶음을 채우지 않아도 되고, "전부"가 명확히 `ALL`로 적힌다.
- 검사를 추가할 때는 **enum 값 하나 추가 + 서비스 안의 `if` 한 줄 추가**. 기존 호출자는 손대지 않는다.

### 분석 — 왜 enum인가

플래그 묶음(시도 2)과 enum(시도 3)은 둘 다 "무엇을 검사할지"를 호출자가 고르게 한다는 점에서 같다. 차이는 **기본값**과 **진화 방식**이다.

| | 플래그 묶음 | enum |
|---|---|---|
| 기본값 | 모두 false (= 아무것도 안 함) | `ALL` = 0 (= 전부 검사) |
| 안전한 디폴트 | 없음. 호출자가 안 채우면 동작 안 함 | 있음. 호출자가 잊으면 "전부 검사" |
| 새 종류 추가 | 모든 호출자가 새 필드를 고려해야 함 | 기존 호출자는 그대로, 필요한 호출자만 새 값으로 바꿈 |
| 조합 | 자유 (2^n) | 미리 정의된 조합만 |

이 문제에서 호출자가 실제로 필요로 한 것은 **"자주 쓰는 소수의 조합"**(전부 / 한도만 / 잠금만)이었지 임의의 2^n 조합이 아니었다. enum이 그 현실에 맞고, `ALL`을 **zero value = 0**에 두면 proto에서 필드를 생략해도 안전한 디폴트가 된다.

### 프론트 요청을 받다 발견한 문제

실제 운영 중에 프론트가 **빈 문자열로 enum을 보내는** 상황이 있었다. 엄격한 validator가 "허용되지 않은 값"으로 거절해 일시 장애가 났다. 며칠 뒤 수정은 두 가지였다.

1. **validator를 완화** — 빈 값은 `ALL`로 해석. `enum = 0` 디폴트의 의도와 같다.
2. **optional 필드를 명시** — `to_address`처럼 "비어 있을 수 있는" 값은 포인터(또는 optional)로 받아 "미제공"과 "빈 문자열"을 코드가 구분할 수 있게.

여기서 얻은 교훈 두 가지:

- enum의 zero value는 반드시 **안전한 디폴트**로 둔다. 빈 값으로 해석되는 `0`이 "아무것도 안 함"이면 호출자의 사소한 실수가 장애가 된다.
- **"미제공"과 "빈 문자열"의 차이**를 서비스가 구분해야 하면 optional 타입을 쓴다. proto3라면 `optional` 키워드, Go라면 포인터.

## 다른 방법 — 설정 파일로 빼기

enum은 "호출자가 매번 고른다"는 구조다. 그와 다르게 **"서비스 전체가 이 시점엔 OTP, 다음 분기엔 잠금"**처럼 **한 번에 바뀌는** 결정은 enum보다 **설정 파일**이 맞다.

```yaml
withdrawal:
  check:
    region:      true
    rank_vip:    true
    daily_limit: true
    user_lock:   false   # 이번 분기엔 사용자 잠금 검사 생략
```

- 얻는 것: 코드는 그대로, **배포 없이 설정만 바꿔** 정책을 바꿀 수 있다(설정 서비스나 feature flag와 결합). 토큰 종류·시간 정책처럼 "운영이 결정하는 것"에 적합하다.
- 치르는 것: 호출자별로 다른 조합이 필요할 땐 안 맞는다. 설정은 "서비스가 하나의 결정을 공유"할 때 쓴다.
- enum과 설정은 **배타적이지 않다.** enum으로 "어느 검사를 돌릴지"를 받고, 설정으로 "각 검사의 임계값(한도 금액, 잠금 기간)"을 둔다. 역할을 섞지 않으면 둘 다 깔끔하다.

## 정리

| 방식 | 호출자 | 새 종류 추가 | 적합한 자리 |
|---|---|---|---|
| 함수 분리 (시도 1) | 함수 이름으로 선택 | 함수 하나 더 추가 | 선택지가 2~3개로 고정된 안정된 API |
| 플래그 묶음 (시도 2) | boolean 여러 개 | 모든 호출자 수정 필요 | 임의 조합이 정말 필요한 희귀 케이스 |
| **enum (채택)** | enum 하나 선택 | 서비스에만 분기 추가 | 자주 쓰는 소수의 조합 + 호출자별로 다른 선택 |
| 다른 방법. 설정 | 호출자는 건드리지 않음 | 설정 키 추가 | 서비스 전체에 영향을 주는 결정 |

**채택: 시도 3.** "무엇을 할지"가 자주 바뀌고 호출자마다 다를 때, 결정을 **코드가 아니라 데이터**에 담는다. 호출자는 enum 하나만 넘기고, 서비스는 enum 값으로 분기한다. 새 종류는 enum에 값 하나 + 서비스에 `if` 한 줄 추가로 끝난다.

- 코드가 **기획 변경 때마다 수정된다**면, 그 결정이 코드가 아니라 데이터여야 한다는 신호다.
- enum의 **zero value는 안전한 디폴트**(`ALL`, `UNSPECIFIED → 기본 동작`)로 둔다. 호출자의 실수가 장애가 되지 않도록.
- "미제공"과 "빈 값"을 구분해야 하면 **optional 타입**을 쓴다. 안 그러면 validator가 거절해야 할지 허용해야 할지 결정할 수 없다.
- enum은 "**호출자가 고르는 것**", 설정은 "**운영이 고르는 것**". 둘을 섞지 않으면 각자의 자리가 분명하다.
