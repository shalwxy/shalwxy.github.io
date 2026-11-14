---
title: "분산 락 쟁탈전"
excerpt: "나와 봇 노드들이 동시에 같은 락을 노린다. 먼저 잡는 쪽이 가져가고, 늦은 쪽은 에러 없이 그냥 튕겨 나간다 — 선점을 몸으로 느껴보는 반응 게임."
date: 2026-11-13
last_modified_at: 2026-11-14
tags:
  - 게임
  - 동시성
header:
  teaser: /assets/img/thumbnail/playground-lockrace.svg
links:
  - label: "관련 글 보기"
    url: /lab/engineering/distributed/preempt-over-check/
toc: false
author_profile: false
classes: wide
---

[`확인과 사용 간극의 제거`](/lab/engineering/distributed/preempt-over-check/) 글에서 다룬 분산 락 선점을 게임으로 만들었다. 화면에 🔒가 뜨면 나와 봇 노드 4개가 동시에 그 락을 노린다. **가장 먼저 잡는 쪽이 가져가고, 나머지는 전부 "이미 선점됨"으로 튕겨 나간다.** 봇은 자기 색 조준점으로 보드를 떠돌다가, 충전이 끝나갈 즈음 정확한 위치에 자리를 잡는다 — 조준점이 멈춰 서는 순간이 곧 그 봇이 선점을 시도하는 시점이라, 눈으로 보면서 타이밍을 잴 수 있다. **봇은 라운드 수가 아니라 경과 시간에 따라 점점 빨라진다** — 시작할 땐 여유롭다가 60초에 가까워질수록 조준이 훨씬 빨리 끝난다.

가끔 다른 것도 섞여 나온다. 💣 가짜 락([`DLQ` 글](/lab/engineering/distributed/dlq-over-db/)에서 다룬 "비정상 메시지"와 같은 개념), 🔑 우선순위 토큰, 그리고 락이 한꺼번에 여러 개 뜨는 "샤딩 타임"까지. **봇도 나와 똑같은 조건으로 움직인다.** 🔑를 내가 잡으면 그 자리에서 보너스 점수를 받고, 이어지는 두 번의 락은 봇이 끼어들지 않아 거의 확정으로 가져간다 — 반대로 봇이 먼저 채가면 몇 초 동안 그 봇만 움직여서 뜨는 건 뭐든(락이든 가짜 락이든 토큰이든) 가져가고, 나를 포함한 나머지 셋은 그 사이 전부 손을 놓는다. 반대로 💣를 내가 클릭하면 콤보가 끊기고 점수도 깎이는 데다, 몇 초 동안 내 클릭이 먹히지 않는 페널티가 눈에 보이게 이어진다 — 그 와중에도 락은 계속 뜨고 봇은 평소처럼 노려서 가져가니 방심하면 안 된다. 봇이 속으면 그 봇은 몇 라운드 동안 그대로 멈춘다. 연속으로 성공하면 콤보 배율이 붙고, 최고 점수는 브라우저에 저장된다.

<div class="lr-wrap">
  <div class="lr-hud">
    <div class="lr-stat"><span>남은 시간</span><strong id="lr-time">60</strong></div>
    <div class="lr-stat"><span>점수</span><strong id="lr-score">0</strong></div>
    <div class="lr-stat"><span>콤보</span><strong id="lr-combo">x1</strong></div>
    <div class="lr-stat"><span>최고 기록</span><strong id="lr-best">0</strong></div>
  </div>

  <div class="lr-bots" id="lr-bots">
    <div class="lr-bot" id="lr-bot-0"><span class="lr-bot-dot lr-bot-dot-0"></span>봇1</div>
    <div class="lr-bot" id="lr-bot-1"><span class="lr-bot-dot lr-bot-dot-1"></span>봇2</div>
    <div class="lr-bot" id="lr-bot-2"><span class="lr-bot-dot lr-bot-dot-2"></span>봇3</div>
    <div class="lr-bot" id="lr-bot-3"><span class="lr-bot-dot lr-bot-dot-3"></span>봇4</div>
  </div>

  <div class="lr-board" id="lr-board">
    <p class="lr-board-hint" id="lr-board-hint">시작 버튼을 누르면 🔒가 나타납니다.</p>
    <div class="lr-lockout" id="lr-lockout"></div>
  </div>

  <div class="lr-banner" id="lr-banner">봇의 조준점이 락 위에 자리를 잡기 전에 🔒를 클릭해보자. 60초 동안 4개의 봇과 겨뤄본다.</div>

  <div class="lr-controls">
    <button type="button" class="btn btn--primary" id="lr-start">시작</button>
    <button type="button" class="btn btn--warning" id="lr-stop" disabled>정지</button>
  </div>
</div>

<style>
.lr-wrap { max-width: 720px; margin: 2em auto; }
.lr-hud { display: flex; gap: 1em; margin-bottom: 1em; flex-wrap: wrap; }
.lr-stat {
  flex: 1 1 140px; background: #f7f7f8; border-radius: 8px;
  padding: 0.7em 1em; text-align: center;
}
.lr-stat span { display: block; font-size: 0.78em; color: #6b6b6b; margin-bottom: 0.2em; }
.lr-stat strong { font-size: 1.5em; font-weight: 700; }
.lr-bots { display: flex; gap: 1em; margin-bottom: 1em; flex-wrap: wrap; }
.lr-bot {
  flex: 1 1 140px; font-size: 0.85em; color: #666;
  display: flex; align-items: center; gap: 0.6em;
  background: #f7f7f8; border-radius: 8px; padding: 0.55em 0.8em;
}
.lr-bot-dot {
  width: 10px; height: 10px; border-radius: 50%; background: #c9ccd1; flex-shrink: 0;
  transition: background 0.15s ease;
}
.lr-bot.lr-bot-stunned { opacity: 0.35; filter: grayscale(1); }
.lr-bot.lr-bot-suppressed { opacity: 0.35; filter: grayscale(1); }
/* 봇이 락을 조준 중일 때: 자신의 식별 색으로 깜빡이는 점으로 표시 (프로그레스바 대신) */
.lr-bot-dot-0.lr-dot-aiming { background: #d1483a; animation: lr-dot-pulse-0 0.6s ease-in-out infinite; }
.lr-bot-dot-1.lr-dot-aiming { background: #3a7bd1; animation: lr-dot-pulse-1 0.6s ease-in-out infinite; }
.lr-bot-dot-2.lr-dot-aiming { background: #3a9a5a; animation: lr-dot-pulse-2 0.6s ease-in-out infinite; }
.lr-bot-dot-3.lr-dot-aiming { background: #8a4fd1; animation: lr-dot-pulse-3 0.6s ease-in-out infinite; }
@keyframes lr-dot-pulse-0 { 0%, 100% { box-shadow: 0 0 0 0 rgba(209, 72, 58, 0.5); } 50% { box-shadow: 0 0 0 5px rgba(209, 72, 58, 0.12); } }
@keyframes lr-dot-pulse-1 { 0%, 100% { box-shadow: 0 0 0 0 rgba(58, 123, 209, 0.5); } 50% { box-shadow: 0 0 0 5px rgba(58, 123, 209, 0.12); } }
@keyframes lr-dot-pulse-2 { 0%, 100% { box-shadow: 0 0 0 0 rgba(58, 154, 90, 0.5); } 50% { box-shadow: 0 0 0 5px rgba(58, 154, 90, 0.12); } }
@keyframes lr-dot-pulse-3 { 0%, 100% { box-shadow: 0 0 0 0 rgba(138, 79, 209, 0.5); } 50% { box-shadow: 0 0 0 5px rgba(138, 79, 209, 0.12); } }

/* 봇의 조준 효과: 커서처럼 생긴 작은 조준점이 노리는 락 주변을 들썩이며 떠돌다가,
   충전이 끝나갈 즈음 정확히 락 위로 자리를 잡는다(JS가 위치를 흔들고, 여기 transition이 매끈하게 이어준다). */
.lr-aim {
  position: absolute; width: 26px; height: 26px;
  margin-left: -13px; margin-top: -13px;
  border-radius: 50%; border: 2px solid #7b8fa6;
  pointer-events: none; opacity: 0.8;
  transition: left 0.14s ease-out, top 0.14s ease-out, scale 0.15s ease, opacity 0.15s ease;
}
.lr-aim::before {
  content: ""; position: absolute; left: 50%; top: 50%;
  width: 4px; height: 4px; margin: -2px; border-radius: 50%; background: #7b8fa6;
}
.lr-aim.lr-aim-locked { scale: 1.4; opacity: 1; border-width: 3px; }
.lr-aim-0 { border-color: #d1483a; }
.lr-aim-0::before { background: #d1483a; }
.lr-aim-1 { border-color: #3a7bd1; }
.lr-aim-1::before { background: #3a7bd1; }
.lr-aim-2 { border-color: #3a9a5a; }
.lr-aim-2::before { background: #3a9a5a; }
.lr-aim-3 { border-color: #8a4fd1; }
.lr-aim-3::before { background: #8a4fd1; }
.lr-board {
  position: relative; height: 340px; background: #eef1f4;
  border: 1px solid #dadfe4; border-radius: 10px; overflow: hidden; margin-bottom: 1em;
}
.lr-board.lr-shake { animation: lr-shake 0.35s; }
@keyframes lr-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}
.lr-board-hint {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  color: #999; font-size: 0.9em; width: 80%; text-align: center;
}
/* 폭탄 페널티 동안에도 락은 계속 뜨고 봇도 그대로 움직인다 — 오직 내 클릭만 막힌다는 걸
   보여주는 배지. 메인 배너는 라운드 결과로 계속 갈아치워지므로, 독립된 자리에 띄운다. */
.lr-lockout {
  position: absolute; top: 10px; right: 10px; z-index: 5;
  background: #a9342a; color: #fff; font-size: 0.78em; font-weight: 700;
  padding: 0.35em 0.7em; border-radius: 999px; box-shadow: 0 2px 6px rgba(0,0,0,0.25);
  opacity: 0; transform: translateY(-6px); pointer-events: none;
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.lr-lockout.lr-show { opacity: 1; transform: translateY(0); }
.lr-board.lr-player-locked .lr-lock { cursor: not-allowed; filter: grayscale(0.35) brightness(0.92); }
.lr-lock {
  position: absolute; width: 56px; height: 56px; border-radius: 50%;
  background: #4a5a68; color: #fdd79a; font-size: 1.6em; line-height: 56px;
  text-align: center; border: none; cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
  animation: lr-pop 0.15s ease;
  /* 버튼 기본 포커스 링/탭 하이라이트는 둥근 모양을 무시하고 사각형으로 그려지므로 꺼둔다 */
  outline: none;
  -webkit-tap-highlight-color: transparent;
}
.lr-lock:focus-visible {
  outline: 2px solid #fdd79a;
  outline-offset: 2px;
}
.lr-lock-fake { background: #7a2e26; }
.lr-lock-power { background: #e8c468; color: #3d2b00; }
@keyframes lr-pop { from { transform: scale(0.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }
/* 클릭/선점된 락이 사라지기 전 짧게 보여주는 상태: 자물쇠는 열림, 가짜 락은 폭발, 토큰은 반짝임 */
.lr-lock-open { background: #3f8f63; animation: lr-lock-open 0.38s ease forwards; }
@keyframes lr-lock-open {
  0% { transform: scale(1); }
  40% { transform: scale(1.25) rotate(-8deg); }
  100% { transform: scale(0.85) rotate(4deg); opacity: 0; }
}
.lr-lock-boom { background: #e8a33a; animation: lr-lock-boom 0.45s ease forwards; }
@keyframes lr-lock-boom {
  0% { transform: scale(1); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25); }
  30% { transform: scale(1.5); box-shadow: 0 0 0 14px rgba(232, 163, 58, 0.35); }
  100% { transform: scale(1.9); opacity: 0; box-shadow: 0 0 0 28px rgba(232, 163, 58, 0); }
}
.lr-lock-key { background: #f4d35e; color: #3d2b00; animation: lr-lock-key 0.42s ease forwards; }
@keyframes lr-lock-key {
  0% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.3) rotate(15deg); box-shadow: 0 0 0 10px rgba(244, 211, 94, 0.3); }
  100% { transform: scale(0.6) rotate(25deg); opacity: 0; box-shadow: 0 0 0 20px rgba(244, 211, 94, 0); }
}
.lr-particle {
  position: absolute; width: 8px; height: 8px; margin: -4px; border-radius: 50%;
  background: #f4b740; pointer-events: none;
  animation: lr-particle-fly 0.5s ease-out forwards;
}
@keyframes lr-particle-fly {
  from { transform: translate(0, 0); opacity: 1; }
  to { transform: translate(var(--dx), var(--dy)); opacity: 0; }
}
.lr-banner {
  padding: 0.9em 1.1em; border-radius: 8px; background: #eef1f4;
  font-weight: 600; margin-bottom: 1em; min-height: 1.4em;
}
.lr-banner.lr-good { background: #e5f0e6; color: #335c38; }
.lr-banner.lr-bad { background: #fbe4e1; color: #a9342a; }
.lr-banner.lr-info { background: #eaf1fb; color: #2a5a8a; }
.lr-controls { display: flex; gap: 0.6em; }
</style>

<script>
(function () {
  var GAME_DURATION = 60;
  var BOT_COUNT = 4;
  var ROUND_TIMEOUT = 3000;
  var BOMB_PENALTY_POINTS = 3;
  var KEY_BONUS_POINTS = 3;
  var KEY_GUARANTEED_ROUNDS = 2;
  var PLAYER_LOCKOUT_MIN = 2600;
  var PLAYER_LOCKOUT_MAX = 3400;
  var BOT_EXCLUSIVE_MIN = 2600;
  var BOT_EXCLUSIVE_MAX = 3400;
  var BEST_KEY = 'lr-best-score';

  var board = document.getElementById('lr-board');
  var hintEl = document.getElementById('lr-board-hint');
  var banner = document.getElementById('lr-banner');
  var lockoutBadge = document.getElementById('lr-lockout');
  var startBtn = document.getElementById('lr-start');
  var stopBtn = document.getElementById('lr-stop');

  var LOCK_VARIANTS = {
    open: { icon: '🔓', cls: 'lr-lock-open', delay: 380 },
    boom: { icon: '💥', cls: 'lr-lock-boom', delay: 450 },
    key: { icon: '✨', cls: 'lr-lock-key', delay: 420 }
  };

  var state = null;
  var countdownTimer = null;
  var audioCtx = null;

  function randRange(a, b) { return a + Math.random() * (b - a); }

  function loadBest() {
    try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch (e) { return 0; }
  }
  function saveBest(v) {
    try { localStorage.setItem(BEST_KEY, String(v)); } catch (e) { /* 저장 불가 시 조용히 무시 */ }
  }

  function playTone(freq, duration, type) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.16, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(); osc.stop(audioCtx.currentTime + duration);
    } catch (e) { /* 오디오 미지원 환경이면 조용히 무시 */ }
  }

  function shakeBoard() {
    board.classList.remove('lr-shake');
    void board.offsetWidth;
    board.classList.add('lr-shake');
  }

  function spawnParticles(x, y) {
    for (var i = 0; i < 8; i++) {
      var angle = (Math.PI * 2 * i) / 8;
      var p = document.createElement('span');
      p.className = 'lr-particle';
      p.style.left = x + 'px';
      p.style.top = y + 'px';
      p.style.setProperty('--dx', Math.cos(angle) * 50 + 'px');
      p.style.setProperty('--dy', Math.sin(angle) * 50 + 'px');
      board.appendChild(p);
      (function (el) { setTimeout(function () { el.remove(); }, 500); })(p);
    }
  }

  // 사람이 락을 보고 마우스를 옮겨 클릭하기까지의 시간을 감안해 약간의 여유를 둔다.
  function botDelayRange(timeLeft) {
    var progress = 1 - timeLeft / GAME_DURATION; // 0(시작) -> 1(막판)
    var maxDelay = 1500 - progress * 750;         // 1500ms -> 750ms
    var minDelay = 600 - progress * 300;          // 600ms -> 300ms
    return [minDelay, maxDelay];
  }

  function multiplierFor(combo) {
    if (combo >= 6) return 3;
    if (combo >= 3) return 2;
    return 1;
  }

  function comboSuffix() {
    var m = multiplierFor(state.combo);
    return m > 1 ? (' (콤보 x' + m + '!)') : '';
  }

  function pickRoundKind() {
    var r = Math.random();
    if (r < 0.12) return 'shard';
    if (r < 0.12 + 0.15) return 'fake';
    if (r < 0.12 + 0.15 + 0.08) return 'powerup';
    return 'normal';
  }

  function setDotAiming(i, on) {
    var dot = document.querySelector('#lr-bot-' + i + ' .lr-bot-dot');
    if (dot) dot.classList.toggle('lr-dot-aiming', on);
  }

  // 봇의 충전을 프로그레스바가 아니라, 화면 전체를 돌아다니며 락을 찾아 헤매다가
  // 막판에 정확한 위치를 찾아내 자리 잡는 조준점으로 보여준다.
  var AIM_JITTER_INTERVAL = 150;
  var AIM_SETTLE_LEAD = 150; // 발사 이 ms 전부터는 흔들림을 멈추고 과녁에 정확히 고정
  var AIM_MARGIN = 14; // 보드 테두리에 조준점이 붙지 않도록 두는 여백

  function clearBotAim(i) {
    if (state && state.botAimTimers && state.botAimTimers[i]) {
      clearInterval(state.botAimTimers[i].jitter);
      clearTimeout(state.botAimTimers[i].settle);
      state.botAimTimers[i] = null;
    }
    var aim = state && state.botAimEls && state.botAimEls[i];
    if (aim && aim.parentNode) aim.remove();
    if (state && state.botAimEls) state.botAimEls[i] = null;
    setDotAiming(i, false);
  }

  function armBotAim(i, lockObj, delay) {
    clearBotAim(i);
    var rect = lockObj.el.getBoundingClientRect();
    var boardRect = board.getBoundingClientRect();
    var cx = rect.left - boardRect.left + rect.width / 2;
    var cy = rect.top - boardRect.top + rect.height / 2;
    var bw = boardRect.width;
    var bh = boardRect.height;
    // 보드 전체를 헤맬 수 있을 만큼 넉넉한 반경에서 시작해, 과녁 바로 위까지 좁혀 들어온다.
    var searchRadius = Math.max(bw, bh);

    var aim = document.createElement('div');
    aim.className = 'lr-aim lr-aim-' + i;
    aim.style.left = randRange(AIM_MARGIN, Math.max(AIM_MARGIN, bw - AIM_MARGIN)) + 'px';
    aim.style.top = randRange(AIM_MARGIN, Math.max(AIM_MARGIN, bh - AIM_MARGIN)) + 'px';
    board.appendChild(aim);
    setDotAiming(i, true);

    var start = Date.now();
    var settleAt = Math.max(0, delay - AIM_SETTLE_LEAD);

    var jitter = setInterval(function () {
      var progress = settleAt > 0 ? (Date.now() - start) / settleAt : 1; // 0(시작, 헤맴) -> 1(정착 직전, 발견)
      progress = Math.min(1, progress);
      var eased = Math.pow(1 - progress, 2); // 한동안 넓게 헤매다가 막판에 빠르게 좁혀진다
      var radius = 10 + eased * searchRadius;
      var angle = Math.random() * Math.PI * 2;
      var dist = Math.random() * radius;
      var jx = Math.max(AIM_MARGIN, Math.min(bw - AIM_MARGIN, cx + Math.cos(angle) * dist));
      var jy = Math.max(AIM_MARGIN, Math.min(bh - AIM_MARGIN, cy + Math.sin(angle) * dist));
      aim.style.left = jx + 'px';
      aim.style.top = jy + 'px';
    }, AIM_JITTER_INTERVAL);

    var settle = setTimeout(function () {
      clearInterval(jitter);
      aim.style.left = cx + 'px';
      aim.style.top = cy + 'px';
      aim.classList.add('lr-aim-locked');
    }, settleAt);

    state.botAimEls[i] = aim;
    state.botAimTimers[i] = { jitter: jitter, settle: settle };
  }

  // 클릭/선점된 락을 바로 지우지 않고, 종류에 맞는 아이콘으로 잠깐 바꾼 뒤 사라지게 한다.
  function resolveLockVisual(lockObj, variant) {
    var el = lockObj.el;
    if (!el) return;
    lockObj.el = null;
    el.disabled = true;
    el.textContent = variant.icon;
    el.classList.add(variant.cls);
    setTimeout(function () { if (el.parentNode) el.remove(); }, variant.delay);
  }

  function updateHud() {
    document.getElementById('lr-time').textContent = state.timeLeft;
    document.getElementById('lr-score').textContent = state.points;
    document.getElementById('lr-combo').textContent = 'x' + multiplierFor(state.combo) + (state.combo > 0 ? ' (' + state.combo + ')' : '');
    document.getElementById('lr-best').textContent = state.best;
  }

  function setBanner(text, cls) {
    banner.textContent = text;
    banner.className = 'lr-banner' + (cls ? ' ' + cls : '');
  }

  function randomPos() {
    var rect = board.getBoundingClientRect();
    var size = 56;
    return { x: randRange(10, Math.max(10, rect.width - size - 10)), y: randRange(10, Math.max(10, rect.height - size - 10)) };
  }

  function makeLockElement(kind) {
    var el = document.createElement('button');
    el.type = 'button';
    el.className = 'lr-lock' + (kind === 'fake' ? ' lr-lock-fake' : kind === 'powerup' ? ' lr-lock-power' : '');
    el.textContent = kind === 'fake' ? '💣' : kind === 'powerup' ? '🔑' : '🔒';
    return el;
  }

  function clearPendingTimer() {
    if (!state.round) return;
    clearTimeout(state.round.timer);
    state.round.botTimers.forEach(clearTimeout);
  }

  function registerSuccess(px, py) {
    state.combo++;
    state.points += multiplierFor(state.combo);
    state.claims++;
    spawnParticles(px, py);
    playTone(880, 0.12, 'sine');
    updateHud();
  }

  function finishRoundNormalGap() {
    state.round = null;
    if (state.running) setTimeout(spawnRound, randRange(400, 800));
  }

  function setLockoutBadge(text) {
    lockoutBadge.textContent = text || '';
    lockoutBadge.classList.toggle('lr-show', !!text);
  }

  function clearPlayerLockout() {
    if (!state) return;
    clearInterval(state.lockoutBannerTimer);
    clearTimeout(state.lockoutTimer);
    state.lockoutBannerTimer = null;
    state.lockoutTimer = null;
    state.playerLocked = false;
    board.classList.remove('lr-player-locked');
    setLockoutBadge('');
  }

  // 라운드/봇은 평소처럼 계속 돌아가고, 오직 내 클릭만 몇 초간 먹히지 않는다.
  // waitMs를 명시하면 그 시간만큼, 아니면 폭탄 페널티 기본 범위를 쓴다. icon은 배지에 붙는 이유 표시.
  function applyPlayerLockout(waitMs, icon) {
    clearPlayerLockout();
    state.playerLocked = true;
    board.classList.add('lr-player-locked');
    if (!waitMs) waitMs = randRange(PLAYER_LOCKOUT_MIN, PLAYER_LOCKOUT_MAX);
    icon = icon || '🚫';
    var remain = Math.ceil(waitMs / 1000);
    setLockoutBadge(icon + ' ' + remain + '초');
    state.lockoutBannerTimer = setInterval(function () {
      remain--;
      if (remain > 0 && state && state.running && state.playerLocked) {
        setLockoutBadge(icon + ' ' + remain + '초');
      } else {
        clearInterval(state.lockoutBannerTimer);
      }
    }, 1000);
    state.lockoutTimer = setTimeout(function () {
      if (state && state.running) clearPlayerLockout();
    }, waitMs);
    return waitMs;
  }

  function updateBotExclusiveVisuals() {
    for (var i = 0; i < BOT_COUNT; i++) {
      var container = document.getElementById('lr-bot-' + i);
      if (!container) continue;
      var suppressed = state.exclusiveBot !== -1 && state.exclusiveBot !== i;
      container.classList.toggle('lr-bot-suppressed', suppressed);
    }
  }

  function clearBotExclusive() {
    if (!state) return;
    clearTimeout(state.exclusiveBotTimer);
    state.exclusiveBotTimer = null;
    state.exclusiveBot = -1;
    updateBotExclusiveVisuals();
  }

  // 봇이 열쇠를 가져가면, 몇 초간 그 봇만 아무 종류의 락이든 획득할 수 있고
  // 나(클릭 봉인)와 나머지 봇(조준 자체를 안 함)은 전부 손을 놓는다.
  function applyBotExclusive(botIndex) {
    clearBotExclusive();
    state.exclusiveBot = botIndex;
    updateBotExclusiveVisuals();
    var waitMs = randRange(BOT_EXCLUSIVE_MIN, BOT_EXCLUSIVE_MAX);
    applyPlayerLockout(waitMs, '🤖');
    state.exclusiveBotTimer = setTimeout(function () {
      if (state && state.running) clearBotExclusive();
    }, waitMs);
  }

  function handleLockClick(lockObj) {
    if (!state || !state.running || !state.round || lockObj.claimed) return;
    if (state.round.locks.indexOf(lockObj) === -1) return;
    if (state.playerLocked) {
      // 페널티 중에는 클릭 자체가 무시된다 — 락은 그대로 두어 봇이 가져갈 수 있게 한다.
      shakeBoard();
      playTone(140, 0.12, 'square');
      return;
    }
    lockObj.claimed = true;

    var rect = lockObj.el.getBoundingClientRect();
    var boardRect = board.getBoundingClientRect();
    var px = rect.left - boardRect.left + rect.width / 2;
    var py = rect.top - boardRect.top + rect.height / 2;

    var kind = lockObj.kind;

    if (kind === 'fake') {
      resolveLockVisual(lockObj, LOCK_VARIANTS.boom);
      for (var fi = 0; fi < BOT_COUNT; fi++) clearBotAim(fi);
      state.combo = 0;
      state.points = Math.max(0, state.points - BOMB_PENALTY_POINTS);
      shakeBoard();
      playTone(110, 0.3, 'square');
      setBanner('💥 가짜 락이었습니다! -' + BOMB_PENALTY_POINTS + '점, 잠시 클릭이 막힙니다...', 'lr-bad');
      clearPendingTimer();
      updateHud();
      applyPlayerLockout();
      finishRoundNormalGap();
      return;
    }
    if (kind === 'powerup') {
      resolveLockVisual(lockObj, LOCK_VARIANTS.key);
      for (var pi = 0; pi < BOT_COUNT; pi++) clearBotAim(pi);
      state.points += KEY_BONUS_POINTS;
      state.priorityCount = KEY_GUARANTEED_ROUNDS;
      spawnParticles(px, py);
      playTone(1300, 0.15, 'triangle');
      setBanner('🔑 우선순위 토큰 획득! +' + KEY_BONUS_POINTS + '점, 다음 ' + KEY_GUARANTEED_ROUNDS + '번의 락은 무조건 내가 먼저.', 'lr-info');
      clearPendingTimer();
      updateHud();
      finishRoundNormalGap();
      return;
    }

    // normal / normal-priority / shard: 성공 처리
    resolveLockVisual(lockObj, LOCK_VARIANTS.open);
    registerSuccess(px, py);
    if (kind === 'shard') {
      reconcileShardBots();
      var allDone = state.round.locks.every(function (l) { return l.claimed; });
      if (allDone) {
        setBanner('🟢 샤딩 타임 클리어!' + comboSuffix(), 'lr-good');
        clearPendingTimer();
        finishRoundNormalGap();
      } else {
        setBanner('🟢 조각 선점!' + comboSuffix(), 'lr-good');
      }
    } else {
      setBanner('🟢 선점 성공!' + comboSuffix(), 'lr-good');
      for (var i = 0; i < BOT_COUNT; i++) clearBotAim(i);
      clearPendingTimer();
      finishRoundNormalGap();
    }
  }

  function reconcileShardBots(excludeIndex) {
    if (!state.round || state.round.kind !== 'shard' || !state.round.botTargets) return;
    for (var i = 0; i < BOT_COUNT; i++) {
      if (i === excludeIndex) continue;
      var target = state.round.botTargets[i];
      if (target && target.claimed) {
        clearBotAim(i);
        clearTimeout(state.round.botTimers[i]);
      }
    }
  }

  function handleBotFire(lockObj, botIndex) {
    if (!state || !state.running || !state.round || lockObj.claimed) return;
    lockObj.claimed = true;
    clearBotAim(botIndex);

    var kind = lockObj.kind;
    var botName = '봇' + (botIndex + 1);

    if (kind === 'shard') {
      // 같은 조각을 노리던 다른 봇만 정리하고, 다른 조각을 노리는 봇은 그대로 둔다
      reconcileShardBots(botIndex);
      resolveLockVisual(lockObj, LOCK_VARIANTS.open);
      playTone(220, 0.15, 'sawtooth');
      setBanner(botName + '이(가) 조각 하나를 가져갔습니다.', '');
      var allDone = state.round.locks.every(function (l) { return l.claimed; });
      if (allDone) {
        clearPendingTimer();
        finishRoundNormalGap();
      }
      return;
    }

    // 나머지 종류는 봇끼리도 같은 락 하나를 두고 경쟁하므로 다른 봇은 전부 정리한다
    for (var i = 0; i < BOT_COUNT; i++) { if (i !== botIndex) clearBotAim(i); }

    if (kind === 'fake') {
      resolveLockVisual(lockObj, LOCK_VARIANTS.boom);
      state.botStun[botIndex] = 3;
      updateBotStunVisuals();
      playTone(220, 0.15, 'square');
      setBanner('🙈 ' + botName + '이(가) 가짜 락에 속아 잠시 멈춥니다!', 'lr-info');
      clearPendingTimer();
      finishRoundNormalGap();
      return;
    }
    if (kind === 'powerup') {
      resolveLockVisual(lockObj, LOCK_VARIANTS.key);
      playTone(220, 0.15, 'triangle');
      applyBotExclusive(botIndex);
      setBanner('🙅 ' + botName + '이(가) 우선순위 토큰을 채갔습니다. 잠시 ' + botName + '만 움직이고 나머지는 전부 손을 놓습니다.', 'lr-info');
      clearPendingTimer();
      finishRoundNormalGap();
      return;
    }

    // normal: 기존 패널티
    resolveLockVisual(lockObj, LOCK_VARIANTS.open);
    state.missed++;
    state.combo = 0;
    shakeBoard();
    playTone(160, 0.2, 'sawtooth');
    clearPendingTimer();
    setBanner('🔴 ' + botName + '에게 선점당했습니다 — AlreadyExists', 'lr-bad');
    updateHud();
    finishRoundNormalGap();
  }

  function expireRound(locks, kind) {
    if (!state.round) return;
    locks.forEach(function (l) { if (!l.claimed && l.el) l.el.remove(); });
    state.round.botTimers.forEach(clearTimeout);
    for (var i = 0; i < BOT_COUNT; i++) clearBotAim(i);
    if (kind === 'fake') {
      setBanner('🙂 가짜 락을 무시했습니다 — 안전!', '');
    } else if (kind === 'powerup') {
      setBanner('⌛ 우선순위 토큰을 놓쳤습니다.', '');
    } else if (kind === 'shard') {
      setBanner('⏳ 샤딩 타임 일부를 놓쳤습니다.', '');
    } else if (kind === 'normal-priority') {
      setBanner('⌛ 우선순위였는데 놓쳤습니다...', '');
    } else {
      setBanner('⏳ 아무도 못 잡고 사라졌습니다. 다음 락!', '');
    }
    state.round = null;
    if (state.running) setTimeout(spawnRound, randRange(400, 800));
  }

  function spawnSingle(kind) {
    var el = makeLockElement(kind);
    var pos = randomPos();
    el.style.left = pos.x + 'px';
    el.style.top = pos.y + 'px';
    board.appendChild(el);

    var lockObj = { el: el, claimed: false, kind: kind };
    el.addEventListener('click', function () { handleLockClick(lockObj); });

    var botTimers = [];
    if (kind === 'normal' || kind === 'fake' || kind === 'powerup') {
      var range = botDelayRange(state.timeLeft);
      for (var i = 0; i < BOT_COUNT; i++) {
        // 스턴당한 봇, 그리고 다른 봇이 우선권 독점 중이라 손을 놓은 봇은 조준에서 제외한다
        if (state.botStun[i] > 0 || (state.exclusiveBot !== -1 && state.exclusiveBot !== i)) { clearBotAim(i); continue; }
        (function (botIndex) {
          var delay = randRange(range[0], range[1]);
          armBotAim(botIndex, lockObj, delay);
          botTimers[botIndex] = setTimeout(function () { handleBotFire(lockObj, botIndex); }, delay);
        })(i);
      }
    } else {
      // 'normal-priority': 플레이어 토큰 효과로 이번 라운드는 봇이 아예 참여하지 않는다
      for (var j = 0; j < BOT_COUNT; j++) clearBotAim(j);
    }

    var timeoutMs = kind === 'fake' ? 1600 : kind === 'powerup' ? 1800 : ROUND_TIMEOUT;
    var timer = setTimeout(function () { expireRound([lockObj], kind); }, timeoutMs);

    state.round = { kind: kind, locks: [lockObj], timer: timer, botTimers: botTimers };
  }

  function spawnShardRound() {
    setBanner('⚡ 샤딩 타임! 뜬 락을 전부 잡아보자', 'lr-info');
    var count = Math.random() < 0.5 ? 2 : 3;
    var locks = [];
    for (var k = 0; k < count; k++) {
      var el = makeLockElement('shard');
      var pos = randomPos();
      el.style.left = pos.x + 'px';
      el.style.top = pos.y + 'px';
      board.appendChild(el);
      var lockObj = { el: el, claimed: false, kind: 'shard' };
      (function (lo) { lo.el.addEventListener('click', function () { handleLockClick(lo); }); })(lockObj);
      locks.push(lockObj);
    }

    // 봇마다 조각 하나씩 무작위로 찍어서 그 조각만 노린다 (같은 조각을 여러 봇이 노릴 수도 있다)
    var range = botDelayRange(state.timeLeft);
    var botTimers = [];
    var botTargets = [];
    for (var i = 0; i < BOT_COUNT; i++) {
      if (state.botStun[i] > 0 || (state.exclusiveBot !== -1 && state.exclusiveBot !== i)) { clearBotAim(i); continue; }
      (function (botIndex) {
        var target = locks[Math.floor(Math.random() * locks.length)];
        botTargets[botIndex] = target;
        var delay = randRange(range[0], range[1]);
        armBotAim(botIndex, target, delay);
        botTimers[botIndex] = setTimeout(function () { handleBotFire(target, botIndex); }, delay);
      })(i);
    }

    var timer = setTimeout(function () { expireRound(locks, 'shard'); }, ROUND_TIMEOUT + 800);
    state.round = { kind: 'shard', locks: locks, timer: timer, botTimers: botTimers, botTargets: botTargets };
  }

  function updateBotStunVisuals() {
    for (var i = 0; i < BOT_COUNT; i++) {
      var container = document.getElementById('lr-bot-' + i);
      if (container) container.classList.toggle('lr-bot-stunned', state.botStun[i] > 0);
    }
  }

  function spawnRound() {
    if (!state.running) return;
    hintEl.style.display = 'none';
    state.rounds++;

    for (var s = 0; s < BOT_COUNT; s++) { if (state.botStun[s] > 0) state.botStun[s]--; }
    updateBotStunVisuals();

    var kind;
    if (state.priorityCount > 0) {
      kind = 'normal-priority';
      state.priorityCount--;
    } else {
      kind = pickRoundKind();
    }

    if (kind === 'shard') { spawnShardRound(); return; }
    spawnSingle(kind);
  }

  function tick() {
    state.timeLeft--;
    updateHud();
    if (state.timeLeft <= 0) endGame();
  }

  function zeroArray(len) {
    var a = [];
    for (var i = 0; i < len; i++) a.push(0);
    return a;
  }

  function startGame() {
    state = {
      running: true, points: 0, claims: 0, missed: 0, rounds: 0,
      combo: 0, priorityCount: 0, best: loadBest(),
      botStun: zeroArray(BOT_COUNT),
      botAimEls: new Array(BOT_COUNT).fill(null), botAimTimers: new Array(BOT_COUNT).fill(null),
      playerLocked: false, lockoutBannerTimer: null, lockoutTimer: null,
      exclusiveBot: -1, exclusiveBotTimer: null,
      timeLeft: GAME_DURATION, round: null
    };
    board.classList.remove('lr-player-locked');
    setLockoutBadge('');
    updateHud();
    updateBotStunVisuals();
    updateBotExclusiveVisuals();
    hintEl.style.display = 'none';
    startBtn.disabled = true;
    stopBtn.disabled = false;
    setBanner('시작! 🔒가 뜨면 바로 클릭하세요.', '');
    countdownTimer = setInterval(tick, 1000);
    spawnRound();
  }

  function endGame() {
    if (!state) return;
    state.running = false;
    clearInterval(countdownTimer);
    if (state.round) {
      clearTimeout(state.round.timer);
      state.round.botTimers.forEach(clearTimeout);
      state.round.locks.forEach(function (l) { if (l.el) l.el.remove(); });
    }
    for (var i = 0; i < BOT_COUNT; i++) clearBotAim(i);
    clearPlayerLockout();
    clearBotExclusive();

    var newRecord = false;
    if (state.points > state.best) { state.best = state.points; saveBest(state.best); newRecord = true; }
    updateHud();

    hintEl.textContent = '다시 하려면 시작 버튼을 누르세요.';
    hintEl.style.display = '';
    setBanner(
      '🏁 종료 — 점수 ' + state.points + '점 (선점 ' + state.claims + ', 뺏김 ' + state.missed + ')' + (newRecord ? ' 🏆 신기록!' : ''),
      newRecord ? 'lr-good' : ''
    );
    startBtn.disabled = false;
    startBtn.textContent = '다시 시작';
    stopBtn.disabled = true;
  }

  // 페이지 로드 시 저장된 최고 기록을 바로 보여준다
  document.getElementById('lr-best').textContent = loadBest();

  startBtn.addEventListener('click', startGame);
  stopBtn.addEventListener('click', endGame);
})();
</script>
