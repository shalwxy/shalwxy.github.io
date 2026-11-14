---
title: "우연의 장소"
excerpt: "지도에 중심점을 찍고 반경을 정하면, 그 원 안에서 무작위 좌표 하나를 똑같은 확률로 뽑아 보여준다."
date: 2026-11-14
last_modified_at: 2026-11-14
tags:
  - 시각화
  - 확률
header:
  teaser: /assets/img/thumbnail/playground-radiusroulette.svg
toc: false
author_profile: false
classes: wide
---

지도에 **중심점을 찍고 반경을 정하면**, 그 원 안에서 무작위 좌표 하나를 똑같은 확률로 뽑아 보여준다. 어디로 갈지 못 정했을 때, 동네 산책이든 드라이브든 일단 방향 하나를 정해주는 룰렛이다.

<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">

<div class="rr-wrap">
  <div class="rr-hud">
    <div class="rr-stat"><span>반경</span><strong id="rr-radius-label">1km</strong></div>
    <div class="rr-stat rr-stat-wide"><span>중심에서 뽑힌 곳까지</span><strong id="rr-dist">-</strong></div>
  </div>

  <div class="rr-controls">
    <label for="rr-radius">반경</label>
    <input type="range" id="rr-radius" min="200" max="10000" step="100" value="1000">
    <button type="button" class="btn btn--primary" id="rr-roll" disabled>뽑기</button>
    <button type="button" class="btn btn--info" id="rr-reset">초기화</button>
  </div>

  <div id="rr-map"></div>

  <div class="rr-banner" id="rr-banner">지도를 클릭해서 중심점을 찍어보세요.</div>
</div>

## 왜 그냥 "반지름 × 난수"로는 안 되는가

반지름 r인 원 안에서 완전히 무작위인 점 하나를 고르고 싶다면, 각도만 무작위로 돌리고 거리는 `r * Math.random()`으로 정하면 안 된다. 그렇게 하면 점들이 중심 근처에 몰린다 — 중심에서 멀어질수록 같은 간격의 "띠" 하나가 담을 수 있는 면적이 커지는데(둘레가 2πd로 늘어나므로), 거리를 균등하게 뽑으면 그 넓어지는 띠에는 상대적으로 적게 배정하는 셈이 되기 때문이다.

그래서 거리는 `r * Math.sqrt(Math.random())`으로 뽑는다. 제곱근을 취하면 거리 d 이하에 점이 들어갈 확률이 (d/r)²에 비례하게 되고, 이는 반지름 d인 원의 면적(πd²)에 정확히 비례한다 — 즉 원 안 어디든 같은 면적이면 같은 확률로 뽑힌다.

위경도는 평면이 아니라서, [공평한 약속 장소 찾기](/playground/fair-meeting-point/) 페이지와 같은 방식으로 중심점을 기준으로 미터 단위 평면좌표를 만들어 그 위에서 샘플링한 뒤, 결과만 다시 위경도로 돌려 찍는다.

<style>
.rr-wrap { margin: 2em 0; }
.rr-hud { display: flex; gap: 1em; margin-bottom: 1em; flex-wrap: wrap; }
.rr-stat {
  flex: 1 1 140px; background: #f7f7f8; border-radius: 8px;
  padding: 0.7em 1em; text-align: center;
}
.rr-stat-wide { flex: 2 1 220px; }
.rr-stat span { display: block; font-size: 0.78em; color: #6b6b6b; margin-bottom: 0.2em; }
.rr-stat strong { font-size: 1.3em; font-weight: 700; }
#rr-map { aspect-ratio: 1 / 1; min-height: 280px; border-radius: 10px; border: 1px solid #dadfe4; margin-bottom: 1em; }
.rr-banner {
  padding: 0.9em 1.1em; border-radius: 8px; background: #eef1f4;
  font-weight: 600; margin-bottom: 1em; min-height: 1.4em; font-size: 0.92em;
}
.rr-banner.rr-good { background: #e5f0e6; color: #335c38; }
.rr-controls { display: flex; align-items: center; gap: 0.8em; margin-bottom: 1em; flex-wrap: wrap; }
.rr-controls label { font-weight: 600; font-size: 0.9em; flex: 0 0 auto; margin-bottom: 0; }
.rr-controls input[type="range"] { flex: 1 1 auto; width: auto; min-width: 120px; margin-bottom: 0; }
.rr-controls .btn { flex: 0 0 auto; }
.rr-popup { font-size: 0.85em; }
</style>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
<script>
(function () {
  var EARTH_RADIUS = 6371000; // m

  var center = null;     // { lat, lng }
  var centerMarker = null;
  var circleLayer = null;
  var winnerMarker = null;
  var radius = 1000;      // m

  var banner = document.getElementById('rr-banner');
  var radiusLabel = document.getElementById('rr-radius-label');
  var distEl = document.getElementById('rr-dist');
  var radiusInput = document.getElementById('rr-radius');
  var rollBtn = document.getElementById('rr-roll');
  var resetBtn = document.getElementById('rr-reset');

  function setBanner(text, cls) {
    banner.textContent = text;
    banner.className = 'rr-banner' + (cls ? ' ' + cls : '');
  }

  var map = L.map('rr-map').setView([37.5665, 126.9780], 13); // 서울 시청 부근 기본 위치
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // 컨테이너 크기를 늦게 읽어서 지도가 작게/깨져 보이는 경우를 막는 안전장치
  setTimeout(function () { map.invalidateSize(); }, 0);
  window.addEventListener('load', function () { map.invalidateSize(); });
  window.addEventListener('resize', function () { map.invalidateSize(); });

  // 중심점 기준 미터 단위 평면좌표를 위경도로 돌리는 간이 등장방형 역투영
  function fromLocalXY(x, y, refLat, refLng) {
    var refRad = refLat * Math.PI / 180;
    var lat = refLat + (y / EARTH_RADIUS) * (180 / Math.PI);
    var lng = refLng + (x / (EARTH_RADIUS * Math.cos(refRad))) * (180 / Math.PI);
    return { lat: lat, lng: lng };
  }

  function fmtDistance(m) {
    if (m >= 1000) return (m / 1000).toFixed(2) + 'km';
    return Math.round(m) + 'm';
  }

  function fmtRadiusLabel(m) {
    if (m >= 1000) {
      var km = m / 1000;
      return (km % 1 === 0 ? km.toFixed(0) : km.toFixed(1)) + 'km';
    }
    return m + 'm';
  }

  function drawCircle() {
    if (circleLayer) map.removeLayer(circleLayer);
    circleLayer = L.circle([center.lat, center.lng], {
      radius: radius, color: '#2a5a8a', weight: 3, fill: true,
      fillColor: '#2a5a8a', fillOpacity: 0.08, dashArray: '6 8'
    }).addTo(map);
  }

  function clearWinner() {
    if (winnerMarker) { map.removeLayer(winnerMarker); winnerMarker = null; }
    distEl.textContent = '-';
  }

  function setCenter(latlng) {
    center = { lat: latlng.lat, lng: latlng.lng };
    if (centerMarker) map.removeLayer(centerMarker);
    centerMarker = L.circleMarker(center, {
      radius: 8, color: '#fff', weight: 2, fillColor: '#d1483a', fillOpacity: 1
    }).addTo(map);
    clearWinner();
    drawCircle();
    rollBtn.disabled = false;
    setBanner('', '');
  }

  // 거리는 r * sqrt(random)으로 뽑아야 원 전체에서 면적 기준 균등 분포가 된다
  function roll() {
    if (!center) return;
    var angle = Math.random() * Math.PI * 2;
    var dist = radius * Math.sqrt(Math.random());
    var x = Math.cos(angle) * dist;
    var y = Math.sin(angle) * dist;
    var picked = fromLocalXY(x, y, center.lat, center.lng);

    clearWinner();
    winnerMarker = L.circleMarker([picked.lat, picked.lng], {
      radius: 9, color: '#fff', weight: 2, fillColor: '#4f7a55', fillOpacity: 1
    }).addTo(map).bindPopup(
      '<div class="rr-popup">여기로 가보세요<br>' + picked.lat.toFixed(6) + ', ' + picked.lng.toFixed(6) + '</div>'
    ).openPopup();

    distEl.textContent = fmtDistance(dist);
    setBanner('🎯 여기로 가보세요! 중심에서 ' + fmtDistance(dist) + ' 떨어진 곳입니다.', 'rr-good');
    map.panTo([picked.lat, picked.lng]);
  }

  function resetAll() {
    center = null;
    if (centerMarker) { map.removeLayer(centerMarker); centerMarker = null; }
    if (circleLayer) { map.removeLayer(circleLayer); circleLayer = null; }
    clearWinner();
    rollBtn.disabled = true;
    setBanner('지도를 클릭해서 중심점을 찍어보세요.', '');
  }

  map.on('click', function (e) { setCenter(e.latlng); });

  radiusInput.addEventListener('input', function () {
    radius = parseInt(radiusInput.value, 10);
    radiusLabel.textContent = fmtRadiusLabel(radius);
    if (center) { drawCircle(); clearWinner(); }
  });

  rollBtn.addEventListener('click', roll);
  resetBtn.addEventListener('click', resetAll);

  radiusLabel.textContent = fmtRadiusLabel(radius);
})();
</script>
