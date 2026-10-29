// Cloudflare Workers: 생일 축하 페이지 webhook 엔드포인트.
//
// 하는 일:
//   1) 브라우저가 보낸 선물 상자 발견 이벤트를 받는다.
//   2) KV 에 상자별로 한 번만 기록한다 (중복이면 Telegram 알림을 보내지 않는다).
//   3) 처음 열린 상자에 한해 Telegram Bot API 로 shalee 의 chat 에 메시지를 보낸다.
//
// 세팅 (Cloudflare 대시보드):
//   - Workers & Pages → Create → Hello World (JS) → 이 코드로 교체 → Deploy.
//   - 같은 Worker 의 Settings → Variables and Secrets 에서 아래 Secret 두 개 추가:
//       TELEGRAM_BOT_TOKEN  = BotFather 가 준 토큰
//       TELEGRAM_CHAT_ID    = @userinfobot 등으로 받은 chat_id (음수면 그룹)
//   - Settings → Variables and Secrets → KV Namespace Bindings:
//       바인딩 이름: GIFTS  (아래 코드가 참조하는 이름)
//       네임스페이스: 새로 하나 만들어 연결 (예: "birthday-gifts")
//   - CORS 허용 Origin 은 Worker 코드 내 ALLOWED_ORIGINS 에 persica.co.kr 추가.
//
// Worker URL 을 받으면 _playground/kim-wanmyung-66th.md 안의
//   const NOTIFY_WEBHOOK_URL = "REPLACE_ME_WITH_YOUR_WEBHOOK_URL";
// 를 그 URL 로 교체하고 커밋/푸시.

const ALLOWED_ORIGINS = new Set([
  "https://persica.co.kr",
  "https://shalwxy.github.io",
  "http://localhost:4000",
  "http://127.0.0.1:4000",
]);

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.has(origin) ? origin : "https://persica.co.kr";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

async function sendTelegram(env, text) {
  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
  if (!res.ok) {
    console.error("telegram failed", res.status, await res.text());
  }
}

function fmt(payload, duplicate) {
  const lines = [
    `<b>🎂 아버님 생신 페이지 알림</b>`,
    duplicate
      ? `⚠️ 이미 열렸던 상자의 재방문입니다 (알림 생략 후보).`
      : `✅ ${payload.message || "선물 상자가 열렸습니다."}`,
    "",
    `• event: <code>${payload.event || "-"}</code>`,
  ];
  if (payload.gift_id) lines.push(`• gift_id: <code>${payload.gift_id}</code>`);
  if (payload.total_found != null) lines.push(`• total: <code>${payload.total_found}/2</code>`);
  if (payload.time) lines.push(`• time: <code>${payload.time}</code>`);
  if (payload.url) lines.push(`• url: ${payload.url}`);
  if (payload.ua) lines.push(`• ua: <code>${(payload.ua || "").slice(0, 180)}</code>`);
  return lines.join("\n");
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: cors });
    }

    let payload;
    try {
      payload = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "invalid json" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...cors },
      });
    }

    const event = String(payload.event || "");
    const giftId = String(payload.gift_id || "");

    let duplicate = false;

    if (event === "birthday_gift_found" && giftId) {
      const key = `gift:${giftId}`;
      const existing = await env.GIFTS.get(key);
      if (existing) {
        duplicate = true;
      } else {
        await env.GIFTS.put(
          key,
          JSON.stringify({ at: payload.time || new Date().toISOString(), ua: payload.ua || "" })
        );
      }
    }

    // 완성 이벤트는 중복 처리 대상이 아님 (한 번만 와도 축하 알림).
    if (event === "birthday_gift_complete") {
      const key = "complete";
      const existing = await env.GIFTS.get(key);
      if (existing) duplicate = true;
      else await env.GIFTS.put(key, JSON.stringify({ at: payload.time || new Date().toISOString() }));
    }

    if (!duplicate && env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
      await sendTelegram(env, fmt(payload, duplicate));
    }

    return new Response(JSON.stringify({ ok: true, duplicate }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...cors },
    });
  },
};
