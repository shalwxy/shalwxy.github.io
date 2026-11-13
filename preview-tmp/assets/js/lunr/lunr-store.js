var store = [{
        "title": "[부동산] 주택담보대출 은행 상담 비교",
        "excerpt":"2024년 봄, 생애최초로 집을 사면서 네 은행에서 다섯 번(농협은 비대면과 대면) 주택담보대출 상담을 받았다. 같은 질문을 돌려 가며 물었고, 은행마다 조금씩 다른 답을 한데 모아 정리한다. 금리가 정해지는 구조는 농협 비대면 상담에서 들은 설명을 바탕으로 썼고, 상담에서 미처 못 물은 것은 따로 찾아 보탰다. 금리·한도 숫자는 모두 2024년 상반기 기준이다....","categories": [],
        "tags": ["부동산","대출"],
        "url": "/essay/learning/life/mortgage-consultation/",
        "teaser": null
      },{
        "title": "[건강] 심폐소생술 및 AED 사용법",
        "excerpt":"심폐소생술 및 AED 사용법 교육에서 배운 순서를 그대로 적어 둔다. 실제 상황에서는 생각할 시간이 없으니, 몸이 순서를 기억하도록 가끔 다시 읽기 위한 글이다. 1. 현장 안전 확인 환자에게 다가가기 전에 주변을 먼저 본다. 차도, 감전, 낙하물, 화재처럼 나까지 다칠 수 있는 위험이 없는지 확인한다. 구조자가 쓰러지면 환자도 구할 수 없다....","categories": [],
        "tags": ["교육","심폐소생술"],
        "url": "/essay/learning/life/cpr-aed/",
        "teaser": null
      },{
        "title": "[성능] 호출 횟수의 최적화",
        "excerpt":"문제 NFT 아이템을 거래소에 등록·해제하는 흐름을 검증하는 코드가 있다. 사용자가 여러 아이템을 한 번에 등록할 수 있는데, 검증 로직은 아이템 하나마다 상태 서비스에 “이 아이템이 등록 가능한 상태인가?”를 물었다. func (v *Validator) Validate(ctx context.Context, items []Item) error { for _, item := range items { state, err := stateService.Get(ctx, item.ID)...","categories": [],
        "tags": ["성능","gRPC"],
        "url": "/lab/engineering/distributed/validate-with-list-fetch/",
        "teaser": null
      },{
        "title": "[동시성] 확인과 사용 간극의 제거",
        "excerpt":"문제 게임 캐릭터 민트 흐름에서 닉네임이 두 번 만들어지는 버그가 보고됐다. 원인을 좁혀 들어가 보니 코드는 아주 자연스러운 모양이었다. exists, err := repo.Exists(ctx, nickname) if err != nil { return err } if exists { return ErrDuplicatedNickname } return repo.Create(ctx, nickname, accountID) “있는지 확인하고, 없으면 만든다.” 영어로는 TOCTOU(Time-Of-Check to Time-Of-Use)...","categories": [],
        "tags": ["동시성","Redis"],
        "url": "/lab/engineering/distributed/preempt-over-check/",
        "teaser": null
      },{
        "title": "[책임] DLQ: 비정상 이벤트의 처리 책임",
        "excerpt":"문제 Kafka로 들어오는 이벤트를 받아 테이블에 적재하는 컨슈머가 있다. 이벤트는 대부분 정상이지만 가끔 비정상이다 — 필드가 비어 있거나, 외래 키가 없는 ID를 참조하거나, 생산자의 버그로 스키마가 깨져 있다. 이 “이상한 메시지”를 어떻게 처리할 것인가. 선택지는 두 축이다. 축 선택지 저장 DB에 저장 vs 저장 안 함 실패 처리 컨슈머가 error를...","categories": [],
        "tags": ["Kafka","에러 처리"],
        "url": "/lab/engineering/distributed/dlq-over-db/",
        "teaser": null
      },{
        "title": "[동시성] CQRS: 쓰기와 집계의 일관성 보장",
        "excerpt":"문제 거래소에 조회수와 북마크 수를 붙여야 했다. 아이템 상세 페이지를 열면 조회수 1 증가, 북마크를 추가하면 북마크 수 1 증가. 처음에는 가장 자연스러운 자리에 코드를 뒀다 — 요청을 받는 그 자리. // 아이템 상세 조회 func (s *ItemService) GetItem(ctx, itemID) (*Item, error) { item := repo.Get(ctx, itemID) repo.IncrementViewCount(ctx, itemID) //...","categories": [],
        "tags": ["CQRS","Kafka"],
        "url": "/lab/engineering/distributed/count-by-event-not-request/",
        "teaser": null
      },{
        "title": "[정합성] 캐시 정합성과 비용의 트레이드오프",
        "excerpt":"문제 거래소 BFF에 북마크 목록 조회 캐시를 넣었다. 사용자가 한 지갑의 북마크를 조회하면 응답을 Redis에 올려 두고, 같은 요청이 다시 오면 캐시에서 돌려준다. func (s *BookmarkService) List(ctx, walletAddr) ([]Bookmark, error) { return cache.GetOrFetch(ctx, \"bookmarks:\"+walletAddr, 60*time.Second, func() ([]Bookmark, error) { return bookmarkClient.List(ctx, walletAddr) }) } 이걸로 사용자 쪽은 빨라졌는데, 다음 문제가...","categories": [],
        "tags": ["캐시","Redis"],
        "url": "/lab/engineering/distributed/short-ttl-over-invalidation/",
        "teaser": null
      },{
        "title": "[책임] SSE: 서비스 역할의 경계",
        "excerpt":"문제 웹 서비스에 실시간 알림을 붙여야 했다. 사용자가 웹을 열고 있는 동안 서버가 “거래 체결됐어요”, “KYC 승인됐어요” 같은 알림을 밀어 넣는다. 전송 방식으로 SSE(Server-Sent Events)를 골랐다 — 서버 → 클라이언트 단방향 푸시가 필요했고, WebSocket의 양방향·바이너리 기능까지는 필요 없었다. SSE는 HTTP 위에서 돌아 방화벽·프록시 통과가 자연스럽고, 브라우저 EventSource API가 재연결까지 자동으로...","categories": [],
        "tags": ["SSE","알림"],
        "url": "/lab/engineering/distributed/sse-notification-three-decisions/",
        "teaser": null
      },{
        "title": "[동시성] 락 목적의 구분",
        "excerpt":"문제 크로스체인 거래 이벤트를 받아 저장하는 컨슈머가 있다. 이벤트는 여러 종류다 — 거래 체결, 자산 전송, 토큰 스왑, 체인 간 전송(브리지) 등. Kafka 특성상 두 가지 어려움이 겹쳐 있다. 어려움 1 — 같은 이벤트가 여러 번 도착한다. at-least-once 전달이라 컨슈머가 재시작하면 같은 메시지를 다시 받을 수 있다. 어려움 2 —...","categories": [],
        "tags": ["동시성","Kafka"],
        "url": "/lab/engineering/distributed/concurrent-ingest-per-event-type/",
        "teaser": null
      },{
        "title": "[응답 설계] API: 처리 결과와 비즈니스 결과의 분리",
        "excerpt":"문제 본인 인증을 대행하는 외부 벤더에 인증을 요청하면 응답이 아래처럼 돌아온다. 인증 성공 성공했지만 추가 인증(2차 인증) 필요 지원하지 않는 인증 수단 같은 식별자로 이미 가입됨 위험 신호로 판정됨 (사기 탐지 걸림) 세션이 만료되어 처음부터 다시 해야 함 벤더 내부 장애 (DB 다운, 타임아웃 등) HTTP 상태코드로 환산하면 벤더는 이걸...","categories": [],
        "tags": ["API 설계","외부 API"],
        "url": "/lab/engineering/design/vendor-outcome-vs-error/",
        "teaser": null
      },{
        "title": "[동시성] Saga: 보상 로직의 위치",
        "excerpt":"문제 출금 요청이 들어오면 “일일 출금 한도”를 먼저 깎아 두어야 한다. 그 사이에 또 다른 출금 요청이 들어와도 한도를 초과하지 않도록. 요청 받음 → 한도 선차감 → 블록체인에 출금 요청 → (몇 분~몇십 분 뒤) → 결과 도착 문제는 블록체인 쪽에서 실패가 올 수 있다는 점이다. 네트워크 혼잡으로 드랍되거나, 지갑...","categories": [],
        "tags": ["Saga","Kafka"],
        "url": "/lab/engineering/distributed/result-topic-over-rollback-topic/",
        "teaser": null
      },{
        "title": "[성능] 주기적 작업의 부하 분산",
        "excerpt":"👉 지터 시각화에서 직접 눌러보며 확인할 수 있다. 문제 각 서비스 인스턴스는 정책(호출 제한 규칙, 차단 목록 등)을 정책 서비스에서 주기적으로 다시 읽는다. 주기는 60초. 인스턴스가 수십 개다. 정책 서비스의 모니터링을 보니 60초마다 요청이 뾰족하게 치솟았다. 평소엔 거의 0이다가 특정 초에 수십 건이 한꺼번에 들어오고, 그 순간 DB 커넥션 풀과...","categories": [],
        "tags": ["동시성","Go"],
        "url": "/lab/engineering/distributed/policy-refresh-with-jitter/",
        "teaser": null
      },{
        "title": "[배포] 코드와 배포 설정의 동기화",
        "excerpt":"문제 정책 전용 서비스를 새로 만들 때의 일이다(정책 전용 서비스 글). 이전에 신설된 서비스들을 보면 공통된 모양이 있었다 — 코드는 다 있는데 dev 환경에서만 돈다. test·qa·stage·live로 올리려면 그때 가서 매니페스트를 복사하고, 게이트웨이 route를 추가하고, CI job을 붙이고, 환경별 시크릿을 넣는다. 이 “뒤로 미룬 일”이 보통 몇 주 뒤 다른 사람...","categories": [],
        "tags": ["CI/CD","Kubernetes"],
        "url": "/lab/engineering/ops/service-with-deploy-set/",
        "teaser": null
      },{
        "title": "[책임] 공통 도메인의 책임 분리",
        "excerpt":"문제 정책이라는 말은 몇 가지를 뭉뚱그린다. 호출 제한(rate limit): 지갑 주소당 초당 호출 횟수 제한 접근 제어(ACL): 특정 IP는 특정 엔드포인트를 못 씀 화이트리스트·블랙리스트: 이 지갑은 수수료 면제, 저 지갑은 출금 금지 feature flag: “A 기능 켜기/끄기”를 코드 배포 없이 lockout: 로그인 실패가 반복되면 일정 시간 잠금 공통점은 “비즈니스 로직이...","categories": [],
        "tags": ["아키텍처","마이크로서비스"],
        "url": "/lab/engineering/distributed/dedicated-policy-service/",
        "teaser": null
      },{
        "title": "[유연성] 결정 로직의 경계",
        "excerpt":"문제 출금 전에 여러 가지 검사를 한다 — 국가 코드, 등급, 일일 한도, 사용자의 잠금 설정. 어느 검사를 돌릴지가 기획에 따라 몇 번이고 바뀌었다. “이번 분기는 등급으로 거르자”, “아니, 사용자 잠금 설정으로 하자”, “프론트 어떤 화면에서는 한도만 보자”, … 처음 구현은 자연스럽게 분기문이었다. func (s *Service) CheckEligibility(ctx context.Context, req Request)...","categories": [],
        "tags": ["API 설계","Go"],
        "url": "/lab/engineering/design/policy-as-enum/",
        "teaser": null
      },{
        "title": "[LLM] Slack 에러 알림에 원인 후보를 달아 주는 봇",
        "excerpt":"문제 운영 에러는 Slack 채널에 올라온다. 담당자는 에러를 보면 늘 같은 세 가지를 한다. 스택트레이스에서 어느 파일·어느 코드인지 찾는다 전에도 본 에러인지 채널을 검색한다 최근 배포 중 무엇이 바뀌어서 났을지 커밋 로그를 뒤진다 세 가지 다 기계적인 일인데도 사람이 직접 한다. 그래서 밤이나 주말에는 처리가 느려진다. 이 셋을 봇이 먼저...","categories": [],
        "tags": ["LLM","운영"],
        "url": "/lab/engineering/ops/llm-error-analysis-bot/",
        "teaser": null
      },{
        "title": "[모델링] 쿨다운 상태의 모델링",
        "excerpt":"문제 보안 기능 하나. 이메일을 바꾸면 그 시점부터 일정 시간 동안 보안 설정을 바꿀 수 없다. 탈취된 계정으로 이메일을 바꾼 공격자가 바로 OTP·비밀번호·결제 정보를 바꾸지 못하도록 막는 장치다. “잠금”이라는 단어 때문에 Redis TTL이 자연스러워 보였다 — 이메일 바꿀 때 키를 걸고, TTL이 만료되면 알아서 사라진다. 코드가 짧다. // 이메일 변경...","categories": [],
        "tags": ["DB","설계"],
        "url": "/lab/engineering/design/db-column-over-redis-ttl/",
        "teaser": null
      },{
        "title": "[책임] gRPC: 응답 크기의 상한 설계",
        "excerpt":"문제 백오피스에서 운영자가 대량 알림을 보낸다. 알림 설정 하나에 수신자(지갑 주소)가 수만 건 붙는다. 설정 상세 조회 RPC는 이렇게 생겼다. message NotificationSetting { string id = 1; string title = 2; string message = 3; repeated string recipients = 4; // 수만 건 // ... } rpc GetNotificationSetting(GetRequest) returns (NotificationSetting);...","categories": [],
        "tags": ["gRPC","API 설계"],
        "url": "/lab/engineering/distributed/stream-large-recipient-list/",
        "teaser": null
      },{
        "title": "[배열] 밤하늘 사진에서 별 세기",
        "excerpt":"문제 N×N 크기의 흑백 밤하늘 사진이 있다. 각 픽셀에는 밝기 값이 쓰여 있다. 어떤 픽셀이 상하좌우 네 이웃 픽셀보다 모두 밝으면 그 픽셀을 별로 본다. 사진 바깥은 밝기 0(완전한 어둠)으로 가정한다. 사진에 별이 몇 개인지 센다. 2 ≤ N ≤ 50, 밝기는 1 이상 100 이하의 정수 입력: 첫 줄에...","categories": [],
        "tags": ["알고리즘","배열"],
        "url": "/lab/engineering/algorithm/star-count/",
        "teaser": null
      },{
        "title": "[배열] 학회에서 가장 많이 마주친 사람",
        "excerpt":"문제 N명의 참가자가 학회의 다섯 세션에 모두 참여했다. 세션마다 여러 트랙이 동시에 열리고, 참가자는 각 세션에서 트랙 하나를 골라 듣는다. 두 참가자가 어떤 세션에서 같은 트랙을 들었다면 그 세션에서 마주쳤다고 한다. 다섯 세션 동안 한 번이라도 마주친 사람의 수가 가장 많은 참가자를 찾는다. 여러 명이면 번호가 가장 작은 참가자를 답으로...","categories": [],
        "tags": ["알고리즘","배열"],
        "url": "/lab/engineering/algorithm/conference-companion/",
        "teaser": null
      },{
        "title": "[배열] 페이스메이커 짝 세기",
        "excerpt":"문제 달리기 모임에 N명이 있다. 모임은 M번의 기록회를 열었고, 기록회마다 결승선에 들어온 순서를 기록했다. 모임은 실력 차가 분명한 두 사람을 짝지어 앞선 사람이 페이스메이커, 뒤처진 사람이 따라 뛰는 사람이 되게 하려 한다. A가 B의 페이스메이커가 되려면 M번의 기록회 모두에서 A가 B보다 먼저 들어왔어야 한다. 만들 수 있는 (페이스메이커, 따라 뛰는...","categories": [],
        "tags": ["알고리즘","배열"],
        "url": "/lab/engineering/algorithm/pacemaker-pairs/",
        "teaser": null
      },{
        "title": "[CDC] Debezium을 활용한 RDB to Snowflake",
        "excerpt":"목표 Debezium CDC의 개념과 동작 방식을 이해하고, Debezium으로 AWS Aurora PostgreSQL의 데이터 변경 사항을 Snowflake까지 안정적으로 반영하는 방법을 정리한다. 예시의 DB·테이블·토픽 이름은 설명용으로 바꾼 것이다. 일반 테이블은 orders, 보존 기간이 지나면 운영 DB에서 지워지는 이력 테이블은 order_history로 부른다. 실제 환경에서는 각자의 이름으로 바꿔 읽으면 된다. 개념과 용어 CDC CDC(Change Data...","categories": [],
        "tags": ["CDC","Debezium","Snowflake"],
        "url": "/lab/engineering/data/debezium-rdb-to-snowflake/",
        "teaser": null
      },{
        "title": "[투 포인터] 연속된 자연수의 합으로 나타내는 방법의 수",
        "excerpt":"문제 사탕 N개를 2개 이상의, 크기가 1씩 늘어나는 연속된 봉지들에 남김없이 나눠 담는 방법이 몇 가지인지 구한다. 7 ≤ N &lt; 1,000 입력: 자연수 N 출력: 2개 이상의 연속된 자연수의 합으로 N을 나타내는 방법의 수 입력 출력 21 3 사탕 21개는 10개와 11개로 나눠 담거나(2봉지), 6, 7, 8개로 나눠 담거나(3봉지),...","categories": [],
        "tags": ["알고리즘","투 포인터"],
        "url": "/lab/engineering/algorithm/candy-consecutive-bags/",
        "teaser": null
      },{
        "title": "[해시] 두 동아리의 공통 회원 찾기",
        "excerpt":"문제 두 동아리 A, B가 있다. 각 동아리는 회원의 학번을 가지고 있고, 같은 동아리 안에서는 학번이 중복되지 않는다. 두 동아리에 모두 가입한 회원의 학번을 오름차순으로 구한다. 동아리 A의 인원 N, 동아리 B의 인원 M (1 ≤ N, M ≤ 30,000) 학번은 1,000,000,000 이하의 자연수. 같은 동아리 안에서는 중복되지 않지만, 두...","categories": [],
        "tags": ["알고리즘","해시"],
        "url": "/lab/engineering/algorithm/club-common-members/",
        "teaser": null
      },{
        "title": "[투 포인터] 두 반의 키 순서 합치기",
        "excerpt":"문제 1반과 2반 학생들이 각각 키 순서로 줄을 섰다. 두 반의 줄은 이미 키가 작은 순서(오름차순)로 정렬되어 있다. 두 반을 합쳐 전체 학생을 키가 작은 순서로 나열한 명단을 만든다. 1반의 학생 수 N, 2반의 학생 수 M (1 ≤ N, M ≤ 100) 각 학생의 키는 int 범위를 넘지 않는...","categories": [],
        "tags": ["알고리즘","투 포인터"],
        "url": "/lab/engineering/algorithm/height-lineup-merge/",
        "teaser": null
      },{
        "title": "[슬라이딩 윈도우] 연속 K일 최대 대출 권수",
        "excerpt":"문제 도서관에서 N일 동안 매일 몇 권이 대출됐는지 기록했다. 이 기록에서 연속된 K일 동안의 대출 권수 합이 가장 큰 값을 구한다. 5 ≤ N ≤ 100,000, 2 ≤ K ≤ N 각 날짜의 대출 권수는 500 이하의 음이 아닌 정수 입력: 첫 줄에 N과 K. 둘째 줄에 N개의 대출 권수...","categories": [],
        "tags": ["알고리즘","슬라이딩 윈도우"],
        "url": "/lab/engineering/algorithm/library-loan-window/",
        "teaser": null
      },{
        "title": "[슬라이딩 윈도우] 연속 저축액 합이 M인 경우의 수",
        "excerpt":"문제 N일 동안 매일 모은 저축액(천 원 단위) 기록이 있다. 이 기록에서 연속된 며칠 동안 모은 금액의 합이 정확히 M(천 원)이 되는 경우가 몇 번인지 구한다. 1 ≤ N ≤ 100,000, 1 ≤ M ≤ 100,000,000 각 날의 저축액은 1,000 이하의 자연수(1 이상 — 0이나 음수는 없다) 입력: 첫째 줄에...","categories": [],
        "tags": ["알고리즘","슬라이딩 윈도우"],
        "url": "/lab/engineering/algorithm/savings-streak-sum/",
        "teaser": null
      },{
        "title": "[슬라이딩 윈도우] K번 바꿔 만드는 최장 연속 구간",
        "excerpt":"문제 하루에 운동을 했으면 1, 쉬었으면 0으로 기록한 N일간의 기록이 있다. 이 중 최대 k번까지 “쉰 날(0)”을 “운동한 날(1)”로 바꿔 쓸 수 있을 때, 만들 수 있는 가장 긴 연속 운동 기간의 길이를 구한다. 5 ≤ N &lt; 100,000 입력: 첫 줄에 N과 k. 둘째 줄에 N개의 0 또는 1...","categories": [],
        "tags": ["알고리즘","슬라이딩 윈도우"],
        "url": "/lab/engineering/algorithm/workout-streak-window/",
        "teaser": null
      },{
        "title": "지터(jitter) 시각화",
        "excerpt":"주기적 작업의 부하 분산 글에서 다룬 내용을 직접 눌러서 확인해볼 수 있게 만들었다. 인스턴스 24개가 60초 주기로 정책을 갱신한다고 가정한다. 막대그래프는 “그 초(0~59초)에 몇 개 인스턴스가 동시에 갱신했는지”를 보여준다. 이번 주기 최대 동시 호출 - 경과 주기 0 지터 꺼짐 0초15초30초45초59초 지터 켜기 한 주기 진행 ▶ 자동 재생 초기화...","categories": [],
        "tags": ["시각화","동시성"],
        "url": "/playground/jitter-visualizer/",
        "teaser": "/assets/img/thumbnail/playground-spring.jpg"
      },]
