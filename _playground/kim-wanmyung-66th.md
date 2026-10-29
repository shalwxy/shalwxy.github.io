---
title: "아버님께 — 66번째 생신, 그리고 창원시 감사관 임명 축하"
excerpt: "1960년 가을의 어느 날 세상에 오셔서, 2026년 가을 창원시 감사관으로 첫 출근하신 아버님(김완명)의 66번째 생신을 축하드립니다. 페이지 어딘가에 선물 상자 두 개를 숨겨 두었어요."
date: 2026-10-29
tags:
  - 생일
  - 축하
  - 창원시
header:
  teaser: /assets/img/playground/kim-wanmyung-appointment.jpg
toc: false
author_profile: false
classes: wide
---

<style>
  .birthday-wrap { max-width: 760px; margin: 0 auto; word-break: keep-all; line-height: 1.7; }
  .birthday-wrap h2 { border-bottom: 1px solid #eee; padding-bottom: 0.3em; margin-top: 2.4em; }
  .birthday-wrap p { line-height: 1.75; }
  .birthday-hero {
    position: relative;
    padding: 2.4em 1.6em;
    text-align: center;
    background: linear-gradient(135deg, #fff8e7 0%, #ffe9ec 55%, #e8f0ff 100%);
    border-radius: 14px;
    overflow: hidden;
  }
  .birthday-hero::before {
    content: "🎂";
    position: absolute; top: 10px; left: 14px;
    font-size: 1.6em; opacity: 0.55;
  }
  .birthday-hero::after {
    content: "🔍";
    position: absolute; bottom: 10px; right: 14px;
    font-size: 1.6em; opacity: 0.55;
  }
  .birthday-hero h1 {
    margin: 0 0 0.3em; font-size: 1.6em; line-height: 1.35;
  }
  .birthday-hero p { margin: 0.2em 0; color: #555; }
  .birthday-hero .big-num {
    font-size: 2.6em; font-weight: 800; letter-spacing: -0.04em;
    background: linear-gradient(90deg,#e24a6d,#f0a500);
    -webkit-background-clip: text; background-clip: text; color: transparent;
    display: inline-block; margin: 0.1em 0.15em;
  }

  .timeline { list-style: none; padding: 0; margin: 1.4em 0; }
  .timeline li {
    position: relative;
    padding: 0.6em 0 0.6em 1.6em;
    border-left: 2px dashed #ddd;
    margin-left: 0.5em;
    word-break: keep-all;
    line-height: 1.6;
  }
  .timeline li::before {
    content: ""; position: absolute; left: -7px; top: 1em;
    width: 12px; height: 12px; border-radius: 50%; background: #e24a6d;
  }
  .timeline .year { font-weight: 700; color: #333; margin-right: 0.4em; }
  .timeline .note { color: #777; font-size: 0.92em; }
  .timeline li.has-photo { padding-bottom: 1.2em; }
  .timeline li + li { margin-top: 0.1em; }

  .find-status-wrap { text-align: center; margin: 1.4em 0 0.6em; }
  .find-status {
    display: inline-flex; align-items: center; gap: 0.5em;
    padding: 0.5em 1em; border-radius: 999px;
    background: #f6f6f6; font-size: 0.95em;
  }

  /* 숨겨진 선물 상자 — 모바일 터치 가능하도록 영역 확보 */
  .gift {
    display: inline-block;
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    min-width: 44px;
    min-height: 44px;
    line-height: 44px;
    text-align: center;
    padding: 0 6px;
    vertical-align: middle;
    transition: transform 0.18s ease, filter 0.18s ease, opacity 0.18s ease;
    animation: giftWiggle 2.8s ease-in-out infinite;
  }
  .gift[data-found="true"] {
    filter: grayscale(1);
    opacity: 0.4 !important;
    cursor: default;
    animation: none;
  }
  .gift:not([data-found="true"]):hover,
  .gift:not([data-found="true"]):active {
    transform: scale(1.3) rotate(-6deg);
    opacity: 1 !important;
    filter: drop-shadow(0 0 8px rgba(255, 180, 60, 0.95));
  }
  .gift-1 { font-size: 1.3em; opacity: 0.5; }
  .gift-2 { font-size: 1.25em; opacity: 0.45; }

  @keyframes giftWiggle {
    0%, 92%, 100% { transform: rotate(0deg) scale(1); }
    94% { transform: rotate(-8deg) scale(1.1); }
    96% { transform: rotate(8deg) scale(1.1); }
    98% { transform: rotate(-5deg) scale(1.05); }
  }

  /* 모달 */
  .gift-modal-backdrop {
    position: fixed; inset: 0;
    background: rgba(20, 20, 30, 0.55);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    display: none; align-items: center; justify-content: center;
    z-index: 9998;
    padding: 1.2em;
    animation: fadeIn 0.25s ease;
  }
  .gift-modal-backdrop.show { display: flex; }
  .gift-modal {
    position: relative;
    background: #fff;
    border-radius: 18px;
    padding: 2em 1.8em 1.6em;
    max-width: 420px; width: 100%;
    text-align: center;
    box-shadow: 0 24px 70px rgba(0,0,0,0.35);
    animation: popIn 0.38s cubic-bezier(.2,1.3,.4,1);
    overflow: hidden;
    word-break: keep-all;
  }
  .gift-modal::before {
    content: "";
    position: absolute; left: 0; right: 0; top: 0;
    height: 5px;
    background: linear-gradient(90deg, #e24a6d, #f0a500, #ffd166, #4fc3f7);
  }
  .gift-modal h3 {
    margin: 0 0 0.6em;
    font-size: 1.35em;
    line-height: 1.4;
    color: #222;
  }
  .gift-modal .gift-modal-body p,
  .gift-modal .gift-modal-note {
    color: #555;
    line-height: 1.75;
    margin: 0.55em 0;
    font-size: 1em;
  }
  .gift-modal .gift-modal-body p:first-child { margin-top: 0; }
  .gift-modal .gift-modal-body p:last-child { margin-bottom: 0; }
  .gift-modal .gift-modal-note {
    margin-top: 0.9em;
    color: #999;
    font-size: 0.88em;
  }
  .gift-modal .gift-modal-note:empty { display: none; }
  .gift-modal button {
    margin-top: 1.4em;
    padding: 0.8em 2em;
    background: linear-gradient(135deg, #e24a6d, #f0a500);
    color: #fff;
    border: 0;
    border-radius: 999px;
    font-size: 1em;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 6px 18px rgba(226, 74, 109, 0.35);
    transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease;
  }
  .gift-modal button:hover {
    transform: translateY(-1px);
    filter: brightness(1.05);
    box-shadow: 0 8px 22px rgba(226, 74, 109, 0.45);
  }
  .gift-modal button:active { transform: translateY(0); }
  /* 잠금 모달 (당일 전) 전용 톤 */
  .gift-modal.is-locked::before {
    background: linear-gradient(90deg, #9ca3af, #d4af37, #9ca3af);
  }
  .gift-modal.is-locked button {
    background: linear-gradient(135deg, #6b7280, #9ca3af);
    box-shadow: 0 6px 18px rgba(107, 114, 128, 0.3);
  }
  .gift-modal.is-locked button:hover {
    box-shadow: 0 8px 22px rgba(107, 114, 128, 0.4);
  }

  @media (max-width: 640px) {
    .gift-modal { padding: 1.6em 1.3em 1.3em; border-radius: 16px; }
    .gift-modal h3 { font-size: 1.2em; }
    .gift-modal p { font-size: 0.95em; }
    .gift-modal button { padding: 0.75em 1.7em; }
  }

  @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
  @keyframes popIn {
    0% { transform: scale(0.6); opacity: 0 }
    100% { transform: scale(1); opacity: 1 }
  }

  /* confetti canvas */
  #confetti-canvas {
    position: fixed; inset: 0; pointer-events: none; z-index: 9999;
  }

  .signoff {
    margin-top: 3em; padding: 1.4em; text-align: center;
    background: #fafafa; border-radius: 10px; color: #555;
    font-size: 0.95em;
  }

  .photo-card {
    margin: 1em 0 1.6em;
    padding: 0.8em;
    background: #fff;
    border: 1px solid #eee;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }
  .photo-card img {
    width: 100%; height: auto; display: block;
    border-radius: 6px;
  }
  .photo-card figcaption {
    margin-top: 0.7em;
    color: #666; font-size: 0.9em; text-align: center;
    line-height: 1.75;
    word-break: keep-all;
  }
  @media (max-width: 480px) {
    .photo-card figcaption br { display: none; }
  }

  /* 숫자 카드 */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.8em;
    margin: 1.4em 0 1.6em;
  }
  .stat-card {
    background: #fff;
    border: 1px solid #eee;
    border-radius: 12px;
    padding: 1em 0.9em;
    text-align: center;
    box-shadow: 0 2px 6px rgba(0,0,0,0.04);
    transition: transform 0.2s ease;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }
  .stat-card:hover { transform: translateY(-2px); }
  .stat-card .stat-num {
    font-size: 1.9em;
    font-weight: 800;
    letter-spacing: -0.02em;
    background: linear-gradient(90deg, #e24a6d, #f0a500);
    -webkit-background-clip: text; background-clip: text; color: transparent;
    line-height: 1.1;
  }
  .stat-card .stat-label {
    margin-top: 0.3em;
    font-size: 1em; color: #333; font-weight: 600;
    word-break: keep-all;
  }
  .stat-card .stat-note {
    margin-top: 0.4em;
    font-size: 0.88em; color: #777; line-height: 1.55;
    flex: 1;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    word-break: keep-all;
  }
  .stat-card.countdown .stat-num {
    background: linear-gradient(90deg, #4fc3f7, #9c6ade);
    -webkit-background-clip: text; background-clip: text; color: transparent;
  }
  .stat-card.countdown[data-today="true"] {
    background: linear-gradient(135deg, #fff8e7 0%, #ffe9ec 100%);
    border-color: #f0a500;
    animation: cakeGlow 2.4s ease-in-out infinite;
  }
  @keyframes cakeGlow {
    0%, 100% { box-shadow: 0 2px 6px rgba(0,0,0,0.04); }
    50% { box-shadow: 0 2px 20px rgba(240, 165, 0, 0.45); }
  }

  /* 모바일 반응형 (모달 관련은 모달 블록 안쪽 @media 참고) */
  @media (max-width: 640px) {
    .birthday-hero { padding: 1.8em 1em; }
    .birthday-hero h1 { font-size: 1.3em; }
    .birthday-hero .big-num { font-size: 2em; }
    .timeline li { padding-left: 1.2em; }
    .timeline .year { display: block; margin-bottom: 0.2em; }
    .gift-1, .gift-2 { font-size: 1.5em; opacity: 0.6; }
    .find-status { font-size: 0.9em; padding: 0.4em 0.8em; }
    .photo-card { padding: 0.5em; }
  }
</style>

<div class="birthday-wrap" markdown="1">

<div class="birthday-hero">
  <h1>아버님, <br>생신을 진심으로 축하드립니다 🎉</h1>
  <p><span class="big-num">66</span><span style="font-size:1.1em">번째 가을</span></p>
  <p>그리고 <strong>창원시 감사관</strong> 임명을 함께 축하드려요.</p>
</div>

## 들어가며

1960년 가을의 어느 날, 한 아이가 세상에 왔습니다. 그로부터 66번의 가을이 더 지난 오늘,
아버님께서는 **창원시 감사관**이라는 이름으로 또 하나의 가을을 맞이하십니다.

이 페이지는 짧은 축하 편지이자, 작은 숨바꼭질입니다.
읽어 내려가시다 보면 **선물 상자 두 개**가 어딘가 숨어 있어요. 눈 밝으신 아버님께서
한 번씩 눌러 봐 주시면, 그때마다 저에게 알림이 오고
**아버님 통장으로 "축하의 송금"** 이 조용히 들어갑니다.

<div style="background:#fafafa;border-radius:10px;padding:0.9em 1.1em;margin-top:1em;color:#666;font-size:0.9em;line-height:1.7">
  <p style="margin:0 0 0.4em">🔒 선물 상자는 <strong>생신 당일(10월 31일)</strong>에 열립니다. 그 전에 눌러 보셔도 괜찮지만, 그날이 되기 전까지는 조용히 잠들어 있어요.</p>
  <p style="margin:0 0 0.4em">💡 당일 상자를 눌러 주신 시점부터 <strong>최대 6시간 안에</strong> 아버님 통장에 송금이 도착해요. 조금만 기다려 주셔요.</p>
  <p style="margin:0">📅 이 축하 페이지는 <strong>생신 전후로 약 일주일간</strong> 열어 두었다가 조용히 내릴 예정이에요.</p>
</div>

<div class="find-status-wrap">
  <span class="find-status">발견한 선물 상자 <strong><span id="found-count">0</span> / 2</strong></span>
</div>

## 숫자로 보는 아버님의 66년

<div class="stats-grid">
  <div class="stat-card">
    <div class="stat-num" id="stat-days">—</div>
    <div class="stat-label">지구에서 보내신 날</div>
    <div class="stat-note">긴 세월을 묵묵히 걸어와 주셔서 감사해요. 하루하루가 모여 지금의 아버님이 되셨습니다.</div>
  </div>
  <div class="stat-card">
    <div class="stat-num" id="stat-orbits">—</div>
    <div class="stat-label">지구와 함께한 공전</div>
    <div class="stat-note">아버님께서 지구와 함께 돌아 주신 햇수예요. 올해도 한 바퀴 평안히 지나오셨어요.</div>
  </div>
  <div class="stat-card">
    <div class="stat-num" id="stat-meals">—</div>
    <div class="stat-label">드신 밥 (추정, 끼)</div>
    <div class="stat-note">하루 세 끼로 어림잡은 숫자예요. 그 많은 끼니 가운데 대부분을 어머님의 정갈한 손맛이 채워 주셨지요.</div>
  </div>
  <div class="stat-card countdown" id="stat-countdown-card">
    <div class="stat-num" id="stat-countdown">—</div>
    <div class="stat-label" id="stat-countdown-label">66번째 생신까지</div>
    <div class="stat-note" id="stat-countdown-note">달력에서 반짝이는 그 날짜가 점점 가까워집니다. 조금만 더 기다려 주셔요.</div>
  </div>
</div>

## 짧게 되돌아보는 66년

<ul class="timeline">
  <li><span class="year">1960</span> — 가을, 세상에 처음 등장. <span class="note">경자년, 쥐띠.</span></li>
  <li><span class="year">… 그 사이</span> — 셀 수 없는 아침과 저녁, 수많은 이름들을 지나오심. <span class="gift gift-1" data-gift="1" title="눌러 보세요" role="button" tabindex="0" aria-label="숨겨진 선물 상자 1">🎁</span></li>
  <li class="has-photo">
    <span class="year">2026·07·28</span> — 창원시 감사관으로 첫 출근. <span class="note">창원시 어딘가의 서류들이 "올 것이 왔구나" 하고 조용히 자세를 바로잡은 날.</span>
    <figure class="photo-card">
      <img src="/assets/img/playground/kim-wanmyung-appointment.jpg" alt="창원시 감사관 임명식 — 태극기와 시 상징기 사이, 다섯 분이 주먹을 쥐고 포즈">
      <figcaption>
        임명장을 손에 쥐신 그날의 사진 한 장.<br>
        함께 서 주신 분들과 어깨를 나란히 하신 모습에서,<br>
        지난 세월 아버님께서 쌓아 오신 성실의 무게가 그대로 느껴져요.
      </figcaption>
    </figure>
  </li>
  <li><span class="year">2026·10·31</span> — 66번째 생신. <span class="note">할로윈. 세상이 알아서 축제 중.</span></li>
</ul>

## 제가 그려 본 아버님의 하루

- 08:50 — 출근. 책상 위 서류를 가지런히 맞추시며 하루를 여십니다.
- 10:00 — 서류를 한 장 한 장 꼼꼼히 들여다보시며 오전을 보내십니다.
- 12:00 — 점심. 담백한 백반 한 상이면 충분하시지요.
- 14:30 — 오후 회의. 묵묵히 들으시고, 꼭 필요한 말씀만 짧게.
- 18:00 — 퇴근. 손에는 서류 가방, 가슴에는 늘 그 자리의 원칙.

> 아버님께서 쌓아 오신 성실과 정직이 창원시의 든든한 바탕이 되실 거라 믿어요. <span class="gift gift-2" data-gift="2" title="눌러 보세요" role="button" tabindex="0" aria-label="숨겨진 선물 상자 2">📦</span>

## 생신 메시지

세어 보면 66년, 안 세어 보면 어제 같은 시간들을 지나오셨지요.
새로 맡으신 자리는 꼼꼼함과 끈기를 요구할 터인데,
그 두 가지는 지난 66년의 세월이 이미 넉넉히 증명해 둔 아버님의 자질이십니다.

올해 생신엔 큰 걱정은 잠시 내려 두시고, 좋아하시는 것들로만 하루를 채우시길 바라요.
늘 강건하시고 평안하시길, 새로 맡으신 자리에서도 뜻하신 바가 두루 이루어지시길 진심으로 기원드립니다.

그리고 오랜 세월 아버님 곁에서 변함없는 마음과 따뜻한 손길로 가족을 지켜 주신 **어머님께도** 깊은 감사와 사랑을 함께 전합니다. 저희도 자주 찾아뵙고, 두 분께 기쁜 소식 더해 드릴게요.

<div class="signoff">
  — 2026년 10월 31일, 마음을 담아 <br>
  며느리 올림
</div>

</div>

<!-- 숨겨진 선물용 모달 -->
<div class="gift-modal-backdrop" id="gift-modal-backdrop">
  <div class="gift-modal">
    <h3 id="gift-modal-title">🎁 선물 상자 발견!</h3>
    <div id="gift-modal-body" class="gift-modal-body"></div>
    <p class="gift-modal-note" id="gift-modal-note"></p>
    <button type="button" onclick="closeGiftModal()">고맙습니다</button>
  </div>
</div>

<canvas id="confetti-canvas"></canvas>

<script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"></script>
<script>
(function () {
  // === 설정: 아래 URL을 사용자의 webhook endpoint 로 교체 ===
  // 예시 (A) Cloudflare Worker: https://xxx.workers.dev/notify
  // 예시 (B) n8n Webhook: https://n8n.example.com/webhook/birthday
  // 예시 (C) IFTTT Webhooks: https://maker.ifttt.com/trigger/EVENT/with/key/KEY
  // Worker/서비스 쪽에서 Telegram Bot API 로 다시 쏘도록 구성하세요.
  const NOTIFY_WEBHOOK_URL = "https://green-haze-edce.shalwxy.workers.dev";

  const STORAGE_KEY = "wanmyung-66-gifts";
  // 선물 상자를 열 수 있는 날 (한국시간 10월 31일 하루 동안).
  // ?preview=1 쿼리가 붙으면 테스트용으로 바로 열림 상태로 간주한다.
  const PREVIEW_MODE = (function () {
    try { return new URLSearchParams(location.search).has("preview"); }
    catch (e) { return false; }
  })();
  function isOpenDay() {
    if (PREVIEW_MODE) return true;
    const now = new Date();
    const kst = new Date(now.getTime() + (now.getTimezoneOffset() + 540) * 60000);
    return kst.getMonth() === 9 && kst.getDate() === 31; // 월: 0-based (9 = 10월)
  }
  // URL 에 ?reset=1 이 붙어 있으면 로컬 발견 상태를 비우고 쿼리를 떼어 낸다 (테스트/재방문 편의).
  try {
    const sp = new URLSearchParams(location.search);
    if (sp.has("reset")) {
      localStorage.removeItem(STORAGE_KEY);
      sp.delete("reset");
      const qs = sp.toString();
      history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
    }
  } catch (e) {}
  function loadFound() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
    catch (e) { return {}; }
  }
  function saveFound(obj) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(obj)); } catch (e) {}
  }

  const messages = {
    "1": {
      title: "🎁 아버님, 첫 번째 상자를 찾아 주셨어요!",
      body: [
        "축하의 송금 1회차가 곧 출발합니다.",
        "최대 여섯 시간 안에 아버님 통장으로 조용히 도착할 거예요."
      ],
      colors: ["#e24a6d", "#f0a500", "#ffd166"]
    },
    "2": {
      title: "📦 아버님, 두 번째 상자도 찾아 주셨어요!",
      body: [
        "역시 아버님이십니다.",
        "2회차 송금도 함께 최대 여섯 시간 안에 도착합니다."
      ],
      colors: ["#4fc3f7", "#81d4fa", "#b2ebf2"]
    }
  };

  const bonusMessage = {
    title: "🏆 두 상자 모두 발견하셨어요!",
    body: [
      "하나도 놓치지 않으시는 아버님께, 보너스 이체도 조용히 더해 둘게요.",
      "모든 송금은 최대 여섯 시간 안에 도착합니다."
    ],
    colors: ["#e24a6d", "#f0a500", "#4fc3f7", "#ffd166", "#9c6ade"]
  };

  function fireConfetti(colors) {
    if (!window.confetti) return;
    const end = Date.now() + 1200;
    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60, spread: 55,
        origin: { x: 0, y: 0.9 },
        colors: colors
      });
      confetti({
        particleCount: 4,
        angle: 120, spread: 55,
        origin: { x: 1, y: 0.9 },
        colors: colors
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 }, colors: colors });
  }

  function openModal(title, body, note, opts) {
    opts = opts || {};
    document.getElementById("gift-modal-title").textContent = title;
    // body 는 문자열 또는 문단 배열. 배열이면 문단별로 <p> 로 렌더링.
    const bodyEl = document.getElementById("gift-modal-body");
    bodyEl.innerHTML = "";
    const paragraphs = Array.isArray(body) ? body : [body];
    paragraphs.forEach(function (txt) {
      if (!txt) return;
      const p = document.createElement("p");
      p.textContent = txt;
      bodyEl.appendChild(p);
    });
    document.getElementById("gift-modal-note").textContent = note || "";
    const backdrop = document.getElementById("gift-modal-backdrop");
    const modal = backdrop.querySelector(".gift-modal");
    if (modal) modal.classList.toggle("is-locked", !!opts.locked);
    backdrop.classList.add("show");
    document.body.style.overflow = "hidden";
  }
  window.closeGiftModal = function () {
    const backdrop = document.getElementById("gift-modal-backdrop");
    backdrop.classList.remove("show");
    document.body.style.overflow = "";
  };

  function notify(payload) {
    if (!NOTIFY_WEBHOOK_URL || NOTIFY_WEBHOOK_URL.indexOf("REPLACE_ME") === 0) {
      console.info("[gift] webhook not configured yet", payload);
      return Promise.resolve({ skipped: true });
    }
    return fetch(NOTIFY_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true
    }).then(function (res) {
      return res.ok ? res.json().catch(function () { return {}; })
                    : Promise.resolve({});
    }).catch(function (err) {
      console.warn("[gift] notify failed", err);
      return {};
    });
  }

  function updateCount(found) {
    const n = Object.keys(found).filter(function (k) { return found[k]; }).length;
    const el = document.getElementById("found-count");
    if (el) el.textContent = n;
    return n;
  }

  function markFound(giftId, el) {
    // 생신 당일이 아니면 상자를 열어 보실 수 없음 (서버 알림도 보내지 않음).
    if (!isOpenDay()) {
      openModal(
        "🔒 아직은 조금 이른 날이에요",
        [
          "선물 상자는 아버님의 생신 당일, 10월 31일에만 열립니다.",
          "그날 이 페이지에 다시 들러 주시면, 작은 즐거움이 기다리고 있을 거예요."
        ],
        "",
        { locked: true }
      );
      return;
    }

    const found = loadFound();
    const already = !!found[giftId];
    found[giftId] = true;
    saveFound(found);
    if (el) el.setAttribute("data-found", "true");
    const total = updateCount(found);

    if (already) return;

    const meta = messages[giftId] || messages["1"];
    fireConfetti(meta.colors);

    const now = new Date().toISOString();
    const ua = navigator.userAgent || "";
    notify({
      event: "birthday_gift_found",
      gift_id: giftId,
      total_found: total,
      page: location.pathname,
      url: location.href,
      time: now,
      ua: ua,
      message: "김완명 선생 생신 페이지에서 선물 상자 " + giftId + " 발견 (" + total + "/2)"
    }).then(function (res) {
      // 서버가 중복(이미 다른 디바이스에서 열림)이라 알려주면 안내만 바꿔 띄움
      if (res && res.duplicate) {
        openModal(
          "이미 한 번 열어 보셨던 상자예요",
          [
            "이 상자는 아버님께서 먼저 열어 보셨답니다.",
            "그때 송금도 함께 처리되었으니, 안심하셔요."
          ],
          ""
        );
      }
    });

    openModal(
      meta.title,
      meta.body,
      total >= 2 ? "" : "남은 상자가 " + (2 - total) + "개 더 숨어 있어요."
    );

    if (total >= 2) {
      setTimeout(function () {
        fireConfetti(bonusMessage.colors);
        openModal(bonusMessage.title, bonusMessage.body, "");
        notify({
          event: "birthday_gift_complete",
          page: location.pathname,
          url: location.href,
          time: new Date().toISOString(),
          message: "김완명 선생 생신 페이지, 두 상자 모두 발견 완료!"
        });
      }, 1600);
    }
  }

  function fmtNum(n) {
    return n.toLocaleString("ko-KR");
  }

  function initStats() {
    // 아버님 생년월일: 1960-10-31 (KST 자정 기준)
    const BIRTH = new Date("1960-10-31T00:00:00+09:00");
    const now = new Date();
    const msPerDay = 86400000;

    const daysLived = Math.floor((now - BIRTH) / msPerDay);
    const orbits = Math.floor(daysLived / 365.2425);
    const meals = daysLived * 3;

    // 올해 생일 (KST 자정)
    const y = now.getFullYear();
    let nextBday = new Date(y + "-10-31T00:00:00+09:00");
    const dayAfterBday = new Date(nextBday.getTime() + msPerDay);

    let countdownText, countdownLabel, countdownNote, isToday = false;
    if (now < nextBday) {
      const dLeft = Math.ceil((nextBday - now) / msPerDay);
      countdownText = "D−" + dLeft;
      countdownLabel = orbits + 1 + "번째 생신까지";
      countdownNote = "달력에서 반짝이는 그 날짜가 점점 가까워집니다. 조금만 더 기다려 주셔요.";
    } else if (now < dayAfterBday) {
      isToday = true;
      countdownText = "D-DAY";
      countdownLabel = "오늘이 바로 그날이에요 🎂";
      countdownNote = "오늘 하루, 아버님께서 좋아하시는 것들로만 가득하시길 진심으로 바라요.";
    } else {
      // 올해 생일 지나감 → 내년 생일 D-N
      nextBday = new Date((y + 1) + "-10-31T00:00:00+09:00");
      const dLeft = Math.ceil((nextBday - now) / msPerDay);
      countdownText = "D−" + dLeft;
      countdownLabel = orbits + 1 + "번째 생신까지";
      countdownNote = "지난 생신도 평안히 지나오셨어요. 다음 한 해도 함께 걷겠습니다.";
    }

    const set = function (id, v) {
      const el = document.getElementById(id);
      if (el) el.textContent = v;
    };
    set("stat-days", fmtNum(daysLived) + "일");
    set("stat-orbits", fmtNum(orbits) + "바퀴");
    set("stat-meals", fmtNum(meals) + "끼");
    set("stat-countdown", countdownText);
    set("stat-countdown-label", countdownLabel);
    set("stat-countdown-note", countdownNote);
    const card = document.getElementById("stat-countdown-card");
    if (card && isToday) card.setAttribute("data-today", "true");
  }

  function initGifts() {
    const found = loadFound();
    updateCount(found);
    document.querySelectorAll(".gift").forEach(function (el) {
      const id = el.getAttribute("data-gift");
      if (found[id]) el.setAttribute("data-found", "true");
      el.addEventListener("click", function () {
        if (el.getAttribute("data-found") === "true") return;
        markFound(id, el);
      });
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (el.getAttribute("data-found") === "true") return;
          markFound(id, el);
        }
      });
    });
  }

  function initModalDismiss() {
    const backdrop = document.getElementById("gift-modal-backdrop");
    if (!backdrop) return;
    // 바깥(backdrop) 클릭으로 닫기 — 모달 내부 클릭은 통과시킴
    backdrop.addEventListener("click", function (e) {
      if (e.target === backdrop) window.closeGiftModal();
    });
    // ESC 로 닫기
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && backdrop.classList.contains("show")) {
        window.closeGiftModal();
      }
    });
  }

  function initAll() {
    initStats();
    initGifts();
    initModalDismiss();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
</script>
