---
title: "심폐소생술 속도 감각 익히기"
excerpt: "분당 100~120회 압박 속도를 손 감각으로 익히는 리듬 게임. 30:2 세트와 AED 분석 주기까지 실제 흐름 그대로 따라간다."
date: 2026-11-13
last_modified_at: 2026-11-14
tags:
  - 게임
  - 건강
header:
  teaser: /assets/img/thumbnail/playground-cpr.svg
links:
  - label: "관련 글 보기"
    url: /essay/learning/life/cpr-aed/
toc: false
author_profile: false
classes: wide
---

[`심폐소생술 및 AED 사용법`](/essay/learning/life/cpr-aed/) 글에서 정리한 **가슴압박 속도(분당 100~120회)**를 몸으로 익혀보는 리듬 게임이다. 압박 버튼을 그 속도로 눌러보면서, 너무 빠른지 느린지 바로 피드백을 받는다. 박자 가이드(소리·시각 펄스)는 100~120회의 중간값인 **110회**에 맞춰져 있고, 점수는 가이드에 맞췄는지가 아니라 **내가 누른 간격 자체가 100~120 범위 안에 들었는지**로 매긴다 — 실제로 중요한 건 박자를 외부 신호에 맞추는 게 아니라 스스로 그 속도를 몸에 익히는 것이기 때문이다.

실제 흐름처럼 **압박 30회 + 인공호흡 2회**를 한 세트로 묶었고, AED가 리듬을 다시 분석하는 주기인 **5세트(약 2분)**를 한 판으로 삼았다.

<div class="cr-wrap">
  <div class="cr-hud">
    <div class="cr-stat"><span>세트</span><strong id="cr-set">0</strong> / 5</div>
    <div class="cr-stat"><span>압박</span><strong id="cr-count">0</strong> / 30</div>
    <div class="cr-stat cr-stat-wide"><span>현재 속도</span><strong id="cr-bpm">-</strong></div>
    <div class="cr-stat"><span>정확도</span><strong id="cr-accuracy">-</strong></div>
  </div>

  <div class="cr-stage" id="cr-stage">
    <div class="cr-pulse" id="cr-pulse"></div>
    <button type="button" class="cr-pad" id="cr-pad" disabled>압박</button>
  </div>

  <div class="cr-banner" id="cr-banner">시작을 누르면 3초 뒤 압박이 시작됩니다.</div>

  <div class="cr-controls">
    <label class="cr-checkbox"><input type="checkbox" id="cr-metronome" checked> 박자음 듣기 (110회/분)</label>
    <div class="cr-controls-right">
      <button type="button" class="btn btn--primary" id="cr-start">시작</button>
      <button type="button" class="btn btn--warning" id="cr-stop" disabled>정지</button>
      <button type="button" class="btn btn--info" id="cr-reset">초기화</button>
    </div>
  </div>
</div>

<style>
.cr-wrap { margin: 2em 0; }
.cr-hud { display: flex; gap: 1em; margin-bottom: 1em; flex-wrap: wrap; }
.cr-stat {
  flex: 1 1 110px; background: #f7f7f8; border-radius: 8px;
  padding: 0.7em 0.8em; text-align: center;
}
.cr-stat-wide { flex: 1.6 1 150px; }
.cr-stat span { display: block; font-size: 0.75em; color: #6b6b6b; margin-bottom: 0.2em; }
.cr-stat strong { font-size: 1.3em; font-weight: 700; }
.cr-stage {
  position: relative; height: 260px; display: flex; align-items: center; justify-content: center;
  background: #fdf3f2; border: 1px solid #f0dcda; border-radius: 10px; margin-bottom: 1em; overflow: hidden;
}
.cr-pulse {
  position: absolute; width: 180px; height: 180px; border-radius: 50%;
  background: #fbdcdb; opacity: 0.8;
}
.cr-pulse.cr-pulse-on { animation: cr-beat 545ms ease-in-out infinite; }
@keyframes cr-beat {
  0% { transform: scale(0.85); opacity: 0.6; }
  30% { transform: scale(1.08); opacity: 0.9; }
  100% { transform: scale(0.85); opacity: 0.6; }
}
.cr-pad {
  position: relative; z-index: 1; width: 140px; height: 140px; border-radius: 50%;
  background: #d1483a; color: #fff; font-size: 1.15em; font-weight: 700; border: none;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2); cursor: pointer; user-select: none;
}
.cr-pad:disabled { background: #c7ccd4; cursor: not-allowed; box-shadow: none; }
.cr-pad.cr-pad-good { background: #4f7a55; }
.cr-pad.cr-pad-fast { background: #d1483a; }
.cr-pad.cr-pad-slow { background: #2a5a8a; }
.cr-pad.cr-pad-breath { background: #4f7a55; }
.cr-banner {
  padding: 0.9em 1.1em; border-radius: 8px; background: #eef1f4;
  font-weight: 600; margin-bottom: 1em; min-height: 1.4em; font-size: 0.92em;
}
.cr-banner.cr-good { background: #e5f0e6; color: #335c38; }
.cr-banner.cr-bad { background: #fbe4e1; color: #a9342a; }
.cr-controls { display: flex; justify-content: space-between; align-items: center; gap: 0.6em; flex-wrap: wrap; }
.cr-controls-right { display: flex; gap: 0.6em; }
.cr-checkbox { display: flex; align-items: center; gap: 0.4em; font-size: 0.88em; }
.cr-checkbox input { width: auto; }
</style>

<script>
(function () {
  var TARGET_BPM = 110;        // 안내 박자 (100~120 중간값)
  var BPM_MIN = 100, BPM_MAX = 120;
  var SET_COMPRESSIONS = 30;
  var SET_BREATHS = 2;
  var TOTAL_SETS = 5;          // AED 재분석 주기(약 2분)

  var pad = document.getElementById('cr-pad');
  var pulse = document.getElementById('cr-pulse');
  var banner = document.getElementById('cr-banner');
  var startBtn = document.getElementById('cr-start');
  var stopBtn = document.getElementById('cr-stop');
  var resetBtn = document.getElementById('cr-reset');
  var metronomeCheckbox = document.getElementById('cr-metronome');

  var setEl = document.getElementById('cr-set');
  var countEl = document.getElementById('cr-count');
  var bpmEl = document.getElementById('cr-bpm');
  var accEl = document.getElementById('cr-accuracy');

  var audioCtx = null;
  var metronomeTimer = null;
  var countdownTimer = null;

  var state = null;

  function haltTimers() {
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
    stopMetronome();
  }

  function playBeep() {
    if (!metronomeCheckbox.checked) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(); osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) { /* 오디오 미지원 환경이면 조용히 무시 */ }
  }

  function setBanner(text, cls) {
    banner.textContent = text;
    banner.className = 'cr-banner' + (cls ? ' ' + cls : '');
  }

  function startMetronome() {
    stopMetronome();
    var intervalMs = 60000 / TARGET_BPM;
    playBeep();
    metronomeTimer = setInterval(playBeep, intervalMs);
    pulse.classList.add('cr-pulse-on');
    pulse.style.animationDuration = intervalMs + 'ms';
  }

  function stopMetronome() {
    if (metronomeTimer) { clearInterval(metronomeTimer); metronomeTimer = null; }
    pulse.classList.remove('cr-pulse-on');
  }

  function updateHud() {
    setEl.textContent = state.set;
    countEl.textContent = state.compressionInSet;
    accEl.textContent = state.judged > 0 ? Math.round((state.good / state.judged) * 100) + '%' : '-';
  }

  function classify(bpm) {
    if (bpm >= BPM_MIN && bpm <= BPM_MAX) return 'good';
    if (bpm > BPM_MAX) return 'fast';
    return 'slow';
  }

  function onCompressionTap() {
    if (!state || state.phase !== 'compress' || !state.running) return;
    var now = performance.now();

    pad.classList.remove('cr-pad-good', 'cr-pad-fast', 'cr-pad-slow');

    if (state.lastTapTime !== null) {
      var intervalMs = now - state.lastTapTime;
      var bpm = 60000 / intervalMs;
      var cls = classify(bpm);
      state.judged++;
      if (cls === 'good') { state.good++; pad.classList.add('cr-pad-good'); }
      else if (cls === 'fast') { pad.classList.add('cr-pad-fast'); }
      else { pad.classList.add('cr-pad-slow'); }
      bpmEl.textContent = Math.round(bpm) + '/분';
      setBanner(
        cls === 'good' ? '🟢 좋은 속도예요.' : cls === 'fast' ? '🔴 너무 빨라요, 조금 천천히.' : '🔵 너무 느려요, 조금 더 빠르게.',
        cls === 'good' ? 'cr-good' : 'cr-bad'
      );
    }
    state.lastTapTime = now;
    state.compressionInSet++;
    updateHud();

    if (state.compressionInSet >= SET_COMPRESSIONS) {
      startBreathPhase();
    }
  }

  function startBreathPhase() {
    state.phase = 'breath';
    state.breathCount = 0;
    stopMetronome();
    pad.textContent = '인공호흡';
    pad.className = 'cr-pad cr-pad-breath';
    setBanner('압박 ' + SET_COMPRESSIONS + '회 완료! 인공호흡 버튼을 2번 눌러주세요.', '');
  }

  function onBreathTap() {
    if (!state || state.phase !== 'breath' || !state.running) return;
    state.breathCount++;
    setBanner('인공호흡 ' + state.breathCount + ' / ' + SET_BREATHS, '');
    if (state.breathCount >= SET_BREATHS) {
      nextSetOrFinish();
    }
  }

  function nextSetOrFinish() {
    if (state.set >= TOTAL_SETS) {
      finishGame();
      return;
    }
    state.set++;
    state.phase = 'compress';
    state.compressionInSet = 0;
    state.lastTapTime = null;
    pad.textContent = '압박';
    pad.className = 'cr-pad';
    updateHud();
    setBanner('세트 ' + state.set + ' / ' + TOTAL_SETS + ' 시작! 다시 압박하세요.', '');
    startMetronome();
  }

  function onPadClick() {
    if (!state || !state.running) return;
    if (state.phase === 'compress') onCompressionTap();
    else if (state.phase === 'breath') onBreathTap();
  }

  function finishGame() {
    state.running = false;
    stopMetronome();
    pad.disabled = true;
    pad.textContent = '압박';
    pad.className = 'cr-pad';
    var acc = state.judged > 0 ? Math.round((state.good / state.judged) * 100) : 0;
    setBanner('🫀 AED가 심장 리듬을 다시 분석합니다. 5세트 완료 — 정확도 ' + acc + '% (정확 ' + state.good + ' / 판정 ' + state.judged + ')', acc >= 70 ? 'cr-good' : 'cr-bad');
    startBtn.disabled = false;
    startBtn.textContent = '다시 하기';
    stopBtn.disabled = true;
  }

  function stopGame() {
    var wasCountdown = !!countdownTimer;
    var wasPlaying = !!(state && state.running);
    if (!wasCountdown && !wasPlaying) return; // 멈출 게 없으면 아무것도 안 함

    haltTimers();
    if (state) state.running = false;
    pad.disabled = true;
    startBtn.disabled = false;
    startBtn.textContent = '다시 시작';
    stopBtn.disabled = true;
    setBanner(wasCountdown ? '시작 전에 정지했습니다.' : '⏸ 정지했습니다. 기록은 남아 있어요 — 다시 시작하거나 초기화할 수 있습니다.', '');
  }

  function resetGame() {
    haltTimers();
    state = null;
    pad.disabled = true;
    pad.textContent = '압박';
    pad.className = 'cr-pad';
    setEl.textContent = 0;
    countEl.textContent = 0;
    bpmEl.textContent = '-';
    accEl.textContent = '-';
    startBtn.disabled = false;
    startBtn.textContent = '시작';
    stopBtn.disabled = true;
    setBanner('시작을 누르면 3초 뒤 압박이 시작됩니다.', '');
  }

  function startGame() {
    haltTimers();
    pad.disabled = true;
    startBtn.disabled = true;
    startBtn.textContent = '시작';
    stopBtn.disabled = false;
    var count = 3;
    setBanner(String(count) + '초 뒤 시작합니다...', '');
    countdownTimer = setInterval(function () {
      count--;
      if (count > 0) {
        setBanner(String(count) + '초 뒤 시작합니다...', '');
      } else {
        clearInterval(countdownTimer);
        countdownTimer = null;
        state = {
          running: true, phase: 'compress', set: 1,
          compressionInSet: 0, lastTapTime: null,
          breathCount: 0, good: 0, judged: 0
        };
        pad.disabled = false;
        pad.className = 'cr-pad';
        updateHud();
        setBanner('세트 1 / ' + TOTAL_SETS + ' 시작! 압박을 눌러주세요.', '');
        startMetronome();
      }
    }, 1000);
  }

  pad.addEventListener('click', onPadClick);
  startBtn.addEventListener('click', startGame);
  stopBtn.addEventListener('click', stopGame);
  resetBtn.addEventListener('click', resetGame);
})();
</script>
