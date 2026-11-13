---
title: "[책임과 경계] gRPC: 응답 크기의 상한 설계"
excerpt: "응답에 수만 건이 실리던 수신자 목록을 server-streaming RPC로 떼어 내는 과정."
date: 2026-10-16
published: true
tags:
  - gRPC
  - API 설계
---

## 문제

백오피스에서 운영자가 **대량 알림**을 보낸다. 알림 설정 하나에 수신자(지갑 주소)가 **수만 건** 붙는다. 설정 상세 조회 RPC는 이렇게 생겼다.

```protobuf
message NotificationSetting {
    string   id          = 1;
    string   title       = 2;
    string   message     = 3;
    repeated string recipients = 4;   // 수만 건
    // ...
}

rpc GetNotificationSetting(GetRequest) returns (NotificationSetting);
```

수신자가 수천 건일 땐 괜찮았는데 **수만 건이 되자 조회가 깨졌다.** gRPC 기본 메시지 크기 상한(4MB)을 넘기는 경우가 생겼고, 넘기지 않아도 응답 하나를 만드는 데 메모리가 수십 MB씩 들었다. 백오피스 화면은 "설정 제목과 본문만 보고 싶은" 경우가 대부분인데, 매번 수신자 수만 건을 같이 받았다.

## 시도 1 — 메시지 크기 상한을 올리기

### 접근

서버·클라이언트의 `MaxRecvMsgSize`를 4MB → 64MB로 올린다.

### 결과

**부분 성공** — 당장 에러는 사라진다. 하지만 수신자가 더 늘면 또 넘기고, 응답을 만드는 메모리·직렬화 시간·네트워크 전송량은 그대로 수신자 수에 비례한다. 상세 조회를 여는 운영자 몇 명이 동시에 요청하면 서버 메모리가 그만큼 곱해진다.

### 분석

문제는 크기 상한이 아니라 **응답 하나가 상한 없이 커질 수 있는 설계**다. "수신자 수"는 운영자가 정하는 값이라 서버가 통제할 수 없고, 그 값에 비례해 커지는 응답은 언젠가 깨진다. 상한을 올리는 건 **깨지는 시점을 뒤로 미루는 것**이다.

## 시도 2 — 상세 응답에서 수신자를 빼고, 스트리밍 RPC로 분리 (채택)

### 접근

두 가지를 동시에 했다.

**① 상세 조회에서 `recipients`를 뺀다.** 설정 자체(제목·본문·상태)만 돌려준다. 응답 크기가 수신자 수와 무관하게 **일정**해진다.

**② 수신자는 별도의 server-streaming RPC로** 500건씩 끊어 보낸다.

```protobuf
rpc GetNotificationSetting(GetRequest) returns (NotificationSetting);   // recipients 없음

rpc DownloadNotificationSettingRecipients(DownloadRequest)
    returns (stream RecipientChunk);

message RecipientChunk {
    repeated string recipients = 1;   // 최대 500건
}
```

서버 쪽:

```go
const chunkSize = 500

func (s *Server) DownloadNotificationSettingRecipients(
    req *DownloadRequest, stream Service_DownloadServer,
) error {
    cursor := ""
    for {
        recipients, next, err := s.repo.ListRecipients(stream.Context(), req.SettingId, cursor, chunkSize)
        if err != nil {
            return err
        }
        if len(recipients) > 0 {
            if err := stream.Send(&RecipientChunk{Recipients: recipients}); err != nil {
                return err
            }
        }
        if next == "" {
            return nil
        }
        cursor = next
    }
}
```

클라이언트 쪽:

```go
stream, err := client.DownloadNotificationSettingRecipients(ctx, &DownloadRequest{SettingId: id})
if err != nil { return err }

var all []string
for {
    chunk, err := stream.Recv()
    if errors.Is(err, io.EOF) {
        break
    }
    if err != nil {
        return err
    }
    all = append(all, chunk.Recipients...)
}
```

### 결과

**성공** — 상세 조회는 수신자 수와 무관하게 빠르고 작아졌다. 수신자가 필요한 화면(다운로드·검수)만 스트리밍 RPC를 따로 호출한다. 서버는 한 번에 500건만 메모리에 올리고, 클라이언트는 받는 대로 처리하거나 파일로 흘려보낼 수 있다.

### 분석 — 쪼개는 것보다 "조립 규약"

스트리밍으로 바꾸면서 가장 시간을 쓴 곳은 chunk 크기가 아니라 **받는 쪽의 규칙을 정하는 일**이었다. 이 규칙을 코드와 proto 주석에 명시했다.

| 규약 | 내용 | 이유 |
|---|---|---|
| 수신자는 `RecipientChunk` 프레임으로만 온다 | 다른 메시지(설정 본문 등)에 `recipients` 필드가 섞여 와도 **무시**한다 | 두 경로로 같은 데이터가 오면 어느 쪽이 진실인지 모호해진다 |
| chunk 하나는 최대 500건 | 서버가 보장, 클라이언트는 검증 | 클라이언트가 메모리 예산을 세울 수 있다 |
| 전체 상한 50,000건 | 서버가 거부 | "수신자 수는 운영자가 정한다"에 상한을 되돌려 준다 |
| EOF는 `errors.Is(err, io.EOF)`로 판정 | 래핑된 에러도 잡는다 | `err == io.EOF` 비교는 래핑에 깨진다 |

특히 첫 번째가 중요했다. 기존 클라이언트 코드 중 일부는 상세 응답의 `recipients`를 읽고 있었고, 스트리밍으로 옮긴 뒤에도 **혹시 상세 응답에 빈 배열이 오면 "수신자 없음"으로 해석**할 위험이 있었다. "수신자는 chunk로만 온다, 다른 곳에 있는 건 무시한다"를 규약으로 못 박아야 두 경로가 충돌하지 않는다.

### 수정할 때 빈 목록이 오면 덮어쓰지 않는다

연관된 사고 방지 하나. 설정 **수정** RPC가 `recipients`를 받는데, 백오피스 화면이 **수신자를 안 건드린 수정**(제목만 바꿈)에서도 요청을 보낸다. 이때 `recipients`가 **빈 배열**로 오면 서버가 "수신자를 전부 지우라"로 해석해 **대상 전체가 사라지는 사고**가 날 수 있다.

```go
if len(req.Recipients) > 0 {
    setting.Recipients = req.Recipients   // 비어 있지 않을 때만 교체
}
```

"빈 목록 = 변경 없음"으로 정했다. 진짜로 전부 지우고 싶으면 **별도 RPC**(`ClearRecipients`)를 쓴다. "비어 있음"과 "지정 안 함"을 같은 값으로 받는 API는 이런 사고의 단골이다 — [enum 글에서의 optional 이야기](/lab/engineering/distributed/policy-as-enum/)와 같은 뿌리다.

### 스트리밍 RPC용 공통 미들웨어

단항(unary) RPC에만 걸려 있던 인증·로깅·에러 변환 미들웨어가 스트리밍에는 적용되지 않았다. gRPC는 `UnaryInterceptor`와 `StreamInterceptor`가 별개라, 스트리밍 RPC를 처음 추가할 때 **같은 미들웨어를 stream용으로 한 벌 더** 구성해야 한다. 빠뜨리면 스트리밍 RPC만 인증 없이 열리는 구멍이 된다.

## 다른 방법 — 페이지네이션 단항 RPC

스트리밍 대신 `ListRecipients(cursor, limit)` 같은 **페이지네이션 단항 RPC**로도 같은 효과를 낸다.

- 얻는 것: 스트리밍 미들웨어·연결 관리가 필요 없다. REST 게이트웨이를 거치는 클라이언트에도 자연스럽다.
- 치르는 것: 클라이언트가 커서를 들고 **N번 왕복**한다. 50,000건이면 100번. 한 번의 연결로 흘려받는 스트리밍보다 느리고, 중간에 데이터가 바뀌면 페이지 경계가 흔들린다.
- 호출자가 **브라우저·REST 클라이언트**이거나, 전체를 받을 일이 드물고 **앞 몇 페이지만** 볼 때 고른다. 전체를 한 번에 내려받는 용도(다운로드·검수)면 스트리밍이 맞다.

## 정리

| 방식 | 응답 크기 | 왕복 | 적합한 자리 |
|---|---|---|---|
| 상세 응답에 전부 포함 | 수신자 수에 비례 (상한 없음) | 1 | 수신자가 수백 건 이하로 보장될 때 |
| 메시지 상한 올리기 | 여전히 비례 | 1 | — (미루기일 뿐) |
| **수신자 분리 + 스트리밍 (채택)** | 일정 (500건/프레임) | 1 연결 | 전체를 내려받는 대량 데이터 |
| 다른 방법. 페이지네이션 | 일정 | N | 브라우저·REST, 앞부분만 보는 조회 |

**채택: 시도 2.** 응답 크기가 **외부가 정하는 값에 비례**하면 언젠가 깨진다. 큰 목록은 상세 응답에서 떼어 내고, 상한을 명시한 프레임으로 흘려보낸다. 그리고 **받는 쪽이 어떻게 조립하는지**를 규약으로 적어 두 경로가 충돌하지 않게 한다.

- 응답 크기가 **운영자나 사용자가 정하는 수**에 비례한다면 설계를 다시 본다. 상한을 올리는 건 해결이 아니다.
- 큰 목록을 떼어 낼 때는 **"어디로만 온다"**를 규약으로 적는다. 두 경로에 같은 데이터가 있으면 반드시 어긋난다.
- 수정 API에서 **빈 목록은 "변경 없음"**으로. 전부 지우기는 별도 RPC로 분리한다.
- 스트리밍 RPC를 처음 추가하면 **stream용 인터셉터**를 잊지 않는다. 단항 미들웨어는 적용되지 않는다.
