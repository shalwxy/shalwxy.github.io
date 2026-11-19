// Cloudflare Workers: "다녀간 자리" 위치 메모 API.
//
// 하는 일:
//   1) 지도 위 한 지점에 남긴 메모(루트)와 그 메모에 달린 답글을 D1에 저장한다.
//   2) 전체 메모+답글 목록을 GET으로 내려주고, 새 메모/답글은 POST로 받는다.
//   3) 수정·삭제 엔드포인트는 없다 — 한 번 남긴 기록은 그대로 남는다.
//
// 세팅 (Cloudflare 대시보드):
//   - Workers & Pages → Create → Hello World (JS) → 이 코드로 교체 → Deploy.
//   - 같은 Worker 의 Settings → Bindings 에서 D1 database 추가:
//       바인딩 이름: MEMO_DB  (아래 코드가 참조하는 이름)
//       데이터베이스: 새로 하나 만들어 연결 (예: "been-here")
//   - D1 대시보드 → 해당 데이터베이스 → Console 에서 아래 스키마를 한 번 실행:
//       CREATE TABLE memo (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         parent_id INTEGER REFERENCES memo(id),
//         lat REAL,
//         lng REAL,
//         text TEXT NOT NULL,
//         visitor_id TEXT NOT NULL,
//         created_at TEXT NOT NULL
//       );
//       CREATE INDEX idx_memo_parent ON memo(parent_id);
//
//   닉네임: visitor_id(브라우저 localStorage에 저장된 랜덤 토큰, 클라이언트가 보냄)를
//   해시해서 "형용사 동물" 닉네임을 결정론적으로 뽑는다. DB에는 토큰 원본만 저장하고
//   닉네임 문자열 자체는 저장하지 않음 — 매번 읽을 때 서버가 계산해서 내려준다.
//   - CORS 허용 Origin 은 아래 ALLOWED_ORIGINS 에 이미 persica.co.kr / shalwxy.github.io 포함.
//
// Worker URL 을 받으면 _playground/been-here.md 안의
//   const API_URL = "REPLACE_ME_WITH_YOUR_WORKER_URL";
// 를 그 URL 로 교체하고 커밋/푸시.

const ALLOWED_ORIGINS = new Set([
  "https://persica.co.kr",
  "https://shalwxy.github.io",
  "http://localhost:4000",
  "http://127.0.0.1:4000",
]);

const TEXT_MAX_LEN = 200;
const VISITOR_ID_MAX_LEN = 100;

// 닉네임 재료 — visitor_id 해시로 결정론적으로 하나씩 골라 "형용사 동물" 형태로 조합한다.
const NICK_ADJECTIVES = [
  "방황하는", "조용한", "용감한", "수줍은", "날쌘", "느긋한", "엉뚱한", "다정한",
  "무심한", "호기심많은", "씩씩한", "게으른", "상냥한", "까칠한", "차분한", "들뜬",
  "신중한", "명랑한", "어리숙한", "영리한", "외로운", "유쾌한", "졸린", "소심한",
];
const NICK_ANIMALS = [
  "팬더", "여우", "고양이", "부엉이", "수달", "너구리", "펭귄", "고래",
  "토끼", "거북이", "다람쥐", "미어캣", "코알라", "돌핀", "늑대", "사막여우",
  "하마", "기린", "오소리", "카피바라", "두루미", "해달", "삵", "산양",
];

// FNV-1a 32비트 해시 — 같은 visitor_id 는 항상 같은 값을 내도록 결정론적으로 계산.
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function nicknameFor(visitorId) {
  const h = hashString(String(visitorId));
  const adjIdx = h % NICK_ADJECTIVES.length;
  const aniIdx = Math.floor(h / NICK_ADJECTIVES.length) % NICK_ANIMALS.length;
  return NICK_ADJECTIVES[adjIdx] + " " + NICK_ANIMALS[aniIdx];
}

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.has(origin) ? origin : "https://persica.co.kr";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(data, status, cors) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}

function cleanText(raw) {
  const text = String(raw == null ? "" : raw).trim();
  if (!text || text.length > TEXT_MAX_LEN) return null;
  return text;
}

function isValidLat(v) { return typeof v === "number" && isFinite(v) && v >= -90 && v <= 90; }
function isValidLng(v) { return typeof v === "number" && isFinite(v) && v >= -180 && v <= 180; }

function cleanVisitorId(raw) {
  const id = String(raw == null ? "" : raw).trim();
  if (!id || id.length > VISITOR_ID_MAX_LEN) return null;
  return id;
}

// 루트 메모 500개 + 각 메모에 달린 답글을 묶어서 반환한다.
async function listMemos(env) {
  const roots = await env.MEMO_DB.prepare(
    "SELECT id, lat, lng, text, visitor_id, created_at FROM memo WHERE parent_id IS NULL ORDER BY created_at DESC LIMIT 500"
  ).all();

  const rootIds = roots.results.map((r) => r.id);
  const repliesByParent = {};
  if (rootIds.length > 0) {
    const placeholders = rootIds.map(() => "?").join(",");
    const replies = await env.MEMO_DB.prepare(
      `SELECT id, parent_id, text, visitor_id, created_at FROM memo WHERE parent_id IN (${placeholders}) ORDER BY created_at ASC`
    ).bind(...rootIds).all();
    for (const r of replies.results) {
      (repliesByParent[r.parent_id] = repliesByParent[r.parent_id] || []).push({
        id: r.id, text: r.text, nickname: nicknameFor(r.visitor_id), created_at: r.created_at,
      });
    }
  }

  return roots.results.map((r) => ({
    id: r.id, lat: r.lat, lng: r.lng, text: r.text, nickname: nicknameFor(r.visitor_id), created_at: r.created_at,
    replies: repliesByParent[r.id] || [],
  }));
}

async function createRoot(env, body) {
  const text = cleanText(body.text);
  const visitorId = cleanVisitorId(body.visitor_id);
  if (!text || !visitorId || !isValidLat(body.lat) || !isValidLng(body.lng)) return null;
  const created_at = new Date().toISOString();
  const res = await env.MEMO_DB.prepare(
    "INSERT INTO memo (parent_id, lat, lng, text, visitor_id, created_at) VALUES (NULL, ?, ?, ?, ?, ?)"
  ).bind(body.lat, body.lng, text, visitorId, created_at).run();
  return {
    id: res.meta.last_row_id, lat: body.lat, lng: body.lng, text,
    nickname: nicknameFor(visitorId), created_at, replies: [],
  };
}

// 답글은 루트 메모에만 달 수 있다 (답글에 또 답글은 없음 — 2단 구조로 제한).
async function createReply(env, parentId, body) {
  const text = cleanText(body.text);
  const visitorId = cleanVisitorId(body.visitor_id);
  if (!text || !visitorId) return null;
  const parent = await env.MEMO_DB.prepare(
    "SELECT id FROM memo WHERE id = ? AND parent_id IS NULL"
  ).bind(parentId).first();
  if (!parent) return null;
  const created_at = new Date().toISOString();
  const res = await env.MEMO_DB.prepare(
    "INSERT INTO memo (parent_id, lat, lng, text, visitor_id, created_at) VALUES (?, NULL, NULL, ?, ?, ?)"
  ).bind(parentId, text, visitorId, created_at).run();
  return { id: res.meta.last_row_id, text, nickname: nicknameFor(visitorId), created_at };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin);
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method === "GET" && url.pathname === "/memos") {
      const memos = await listMemos(env);
      return json(memos, 200, cors);
    }

    if (request.method === "POST" && url.pathname === "/memos") {
      let body;
      try { body = await request.json(); } catch (e) { return json({ error: "invalid json" }, 400, cors); }
      const memo = await createRoot(env, body);
      if (!memo) return json({ error: "invalid memo" }, 400, cors);
      return json(memo, 201, cors);
    }

    const replyMatch = url.pathname.match(/^\/memos\/(\d+)\/replies$/);
    if (request.method === "POST" && replyMatch) {
      let body;
      try { body = await request.json(); } catch (e) { return json({ error: "invalid json" }, 400, cors); }
      const reply = await createReply(env, Number(replyMatch[1]), body);
      if (!reply) return json({ error: "invalid reply" }, 400, cors);
      return json(reply, 201, cors);
    }

    return new Response("Not Found", { status: 404, headers: cors });
  },
};
