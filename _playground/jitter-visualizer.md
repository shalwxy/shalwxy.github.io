---
title: "지터(jitter) 시각화"
excerpt: "여러 인스턴스가 같은 주기로 돌 때 왜 스파이크가 생기고, jitter가 그걸 어떻게 흩뿌리는지 직접 눌러보는 시뮬레이터."
date: 2026-11-13
tags:
  - 시각화
  - 동시성
header:
  teaser: /assets/img/thumbnail/playground-spring.jpg
links:
  - label: "관련 글 보기"
    url: /lab/engineering/distributed/policy-refresh-with-jitter/
toc: false
author_profile: false
classes: wide
---

[`주기적 작업의 부하 분산`](/lab/engineering/distributed/policy-refresh-with-jitter/) 글에서 다룬 내용을 직접 눌러서 확인해볼 수 있게 만들었다. 인스턴스 24개가 60초 주기로 정책을 갱신한다고 가정한다. 막대그래프는 "그 초(0~59초)에 몇 개 인스턴스가 동시에 갱신했는지"를 보여준다.

<div class="jv-wrap">
  <div class="jv-stats">
    <div class="jv-stat">
      <span class="jv-stat-label">이번 주기 최대 동시 호출</span>
      <span class="jv-stat-value" id="jv-peak">-</span>
    </div>
    <div class="jv-stat">
      <span class="jv-stat-label">경과 주기</span>
      <span class="jv-stat-value" id="jv-cycle">0</span>
    </div>
    <div class="jv-stat">
      <span class="jv-stat-label">지터</span>
      <span class="jv-stat-value" id="jv-jitter-state">꺼짐</span>
    </div>
  </div>

  <div class="jv-chart" id="jv-chart" aria-label="60초 동안의 초당 동시 호출 수 막대그래프"></div>
  <div class="jv-axis">
    <span>0초</span><span>15초</span><span>30초</span><span>45초</span><span>59초</span>
  </div>

  <div class="jv-controls">
    <button type="button" class="btn btn--primary" id="jv-toggle-jitter">지터 켜기</button>
    <button type="button" class="btn btn--inverse" id="jv-step">한 주기 진행 ▶</button>
    <button type="button" class="btn btn--inverse" id="jv-play">자동 재생</button>
    <button type="button" class="btn btn--inverse" id="jv-reset">초기화</button>
  </div>

  <p class="jv-caption">
    <strong>지터 꺼짐</strong>: 배포 시 몇 초 안에 몰린 시작 시각이 주기마다 그대로 재현된다 — 막대 몇 개가 영원히 높게 유지된다.<br>
    <strong>지터 켜짐</strong>: 매 주기 간격에 무작위를 섞는다 — 주기를 거듭할수록 막대가 60초 전체로 퍼진다.
  </p>
</div>

<style>
.jv-wrap { max-width: 720px; margin: 2em auto; }
.jv-stats { display: flex; gap: 1em; margin-bottom: 1em; flex-wrap: wrap; }
.jv-stat {
  flex: 1 1 140px;
  background: #f7f7f8;
  border-radius: 8px;
  padding: 0.8em 1em;
  text-align: center;
}
.jv-stat-label { display: block; font-size: 0.78em; color: #6b6b6b; margin-bottom: 0.3em; }
.jv-stat-value { display: block; font-size: 1.5em; font-weight: 700; }
.jv-stat-value.jv-danger { color: #d1483a; }
.jv-chart {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 160px;
  border-bottom: 2px solid #333;
  padding: 0 2px;
}
.jv-bar {
  flex: 1 1 0;
  background: #7b8fa6;
  border-radius: 2px 2px 0 0;
  min-height: 2px;
  transition: height 0.25s ease, background-color 0.25s ease;
}
.jv-bar.jv-hot { background: #d1483a; }
.jv-axis {
  display: flex;
  justify-content: space-between;
  font-size: 0.75em;
  color: #999;
  margin: 0.3em 0 1.2em;
}
.jv-controls { display: flex; gap: 0.6em; flex-wrap: wrap; margin-bottom: 1em; }
.jv-caption { font-size: 0.85em; color: #666; line-height: 1.6; }
</style>

<script>
(function () {
  var N = 24;
  var BUCKETS = 60;
  var JITTER_RANGE = 5; // ±5초

  var jitterOn = false;
  var cycle = 0;
  var playing = false;
  var playTimer = null;

  // 초기 phase: 배포가 몇 초 안에 몰렸다고 가정 (0~4초 사이에 흩어져 시작)
  var phases = [];
  function resetPhases() {
    phases = [];
    for (var i = 0; i < N; i++) {
      phases.push(Math.floor(Math.random() * 5));
    }
  }
  resetPhases();

  var chartEl = document.getElementById('jv-chart');
  var bars = [];
  for (var b = 0; b < BUCKETS; b++) {
    var bar = document.createElement('div');
    bar.className = 'jv-bar';
    chartEl.appendChild(bar);
    bars.push(bar);
  }

  function render() {
    var counts = new Array(BUCKETS).fill(0);
    for (var i = 0; i < phases.length; i++) counts[phases[i]]++;
    var max = Math.max.apply(null, counts);
    var hotThreshold = Math.ceil(N / 6); // 균등 분포라면 평균은 N/60, 이 이상이면 '몰림'으로 표시

    for (var j = 0; j < BUCKETS; j++) {
      var h = Math.max(2, Math.round((counts[j] / N) * 150));
      bars[j].style.height = h + 'px';
      bars[j].classList.toggle('jv-hot', counts[j] >= hotThreshold);
    }

    document.getElementById('jv-peak').textContent = max + '건';
    document.getElementById('jv-peak').className = 'jv-stat-value' + (max >= hotThreshold ? ' jv-danger' : '');
    document.getElementById('jv-cycle').textContent = cycle;
    document.getElementById('jv-jitter-state').textContent = jitterOn ? '켜짐' : '꺼짐';
  }

  function advanceCycle() {
    cycle++;
    if (jitterOn) {
      for (var i = 0; i < phases.length; i++) {
        var delta = Math.floor(Math.random() * (JITTER_RANGE * 2 + 1)) - JITTER_RANGE;
        phases[i] = ((phases[i] + delta) % BUCKETS + BUCKETS) % BUCKETS;
      }
    }
    // 지터가 꺼져 있으면 phase는 그대로 유지된다 — 이게 핵심
    render();
  }

  document.getElementById('jv-toggle-jitter').addEventListener('click', function () {
    jitterOn = !jitterOn;
    this.textContent = jitterOn ? '지터 끄기' : '지터 켜기';
  });

  document.getElementById('jv-step').addEventListener('click', advanceCycle);

  document.getElementById('jv-play').addEventListener('click', function () {
    playing = !playing;
    this.textContent = playing ? '자동 재생 중단' : '자동 재생';
    if (playing) {
      playTimer = setInterval(advanceCycle, 450);
    } else {
      clearInterval(playTimer);
    }
  });

  document.getElementById('jv-reset').addEventListener('click', function () {
    cycle = 0;
    resetPhases();
    playing = false;
    clearInterval(playTimer);
    document.getElementById('jv-play').textContent = '자동 재생';
    render();
  });

  render();
})();
</script>
