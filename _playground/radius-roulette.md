---
title: "우연의 장소"
excerpt: "지도에 중심점을 찍고 반경을 정하면, 그 원 안에서 무작위 좌표 하나를 똑같은 확률로 뽑아 보여준다."
date: 2026-11-14
last_modified_at: 2026-11-15
tags:
  - 시각화
  - 확률
header:
  teaser: /assets/img/thumbnail/playground-radiusroulette.svg
links:
  - label: "관련 글 보기"
    url: /essay/review/reading/attention-and-observation/
toc: false
author_profile: false
classes: wide
---

지도에 **중심점을 찍고 반경을 정하면**, 그 원 안에서 무작위 좌표 하나를 똑같은 확률로 뽑아 보여준다. 어디로 갈지 조사하고 따져보는 대신, 우연에 맡기면 동네 산책도 모험이 된다. 아이디어는 [`주의를 기울이는 법 (롭 워커), 관찰 연습 (니콜라 노바)`](/essay/review/reading/attention-and-observation/#우연의-장소)에서 확인할 수 있다.

<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">

<div class="rr-wrap">
  <div class="rr-banner" id="rr-banner">지도를 클릭해서 중심점을 찍어보세요.</div>

  <div id="rr-map"></div>

  <div class="rr-controls">
    <label for="rr-radius">반경</label>
    <input type="range" id="rr-radius" min="200" max="10000" step="100" value="1000">
    <button type="button" class="btn btn--primary" id="rr-roll" disabled>뽑기</button>
    <button type="button" class="btn btn--info" id="rr-reset">초기화</button>
  </div>

  <div class="rr-hud">
    <div class="rr-stat"><span>반경</span><strong id="rr-radius-label">1km</strong></div>
    <div class="rr-stat rr-stat-wide"><span>중심에서 뽑힌 곳까지</span><strong id="rr-dist">-</strong></div>
  </div>

  <div class="result-share">
    <button type="button" class="btn btn--kakao" id="rr-share-kakao">
      <i class="fas fa-fw fa-comment" aria-hidden="true"></i><span> 결과 공유</span>
    </button>
    <button type="button" class="btn btn--inverse" id="rr-share-link">
      <i class="fas fa-fw fa-link" aria-hidden="true"></i><span> 결과 링크</span>
    </button>
  </div>
</div>

## 왜 그냥 "반지름 × 난수"로는 안 되는가

반지름 r인 원 안에서 완전히 무작위인 점 하나를 고르고 싶다면, 각도만 무작위로 돌리고 거리는 `r * Math.random()`으로 정하면 안 된다. 그렇게 하면 점들이 중심 근처에 몰린다 — 중심에서 멀어질수록 같은 간격의 "띠" 하나가 담을 수 있는 면적이 커지는데(둘레가 2πd로 늘어나므로), 거리를 균등하게 뽑으면 그 넓어지는 띠에는 상대적으로 적게 배정하는 셈이 되기 때문이다.

그래서 거리는 `r * Math.sqrt(Math.random())`으로 뽑는다. 제곱근을 취하면 거리 d 이하에 점이 들어갈 확률이 (d/r)²에 비례하게 되고, 이는 반지름 d인 원의 면적(πd²)에 정확히 비례한다 — 즉 원 안 어디든 같은 면적이면 같은 확률로 뽑힌다.

위경도는 평면이 아니라서, 중심점을 기준으로 미터 단위 평면좌표를 만들어 그 위에서 샘플링한 뒤, 결과만 다시 위경도로 돌려 찍는다.

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
  var lastResult = null;  // 가장 최근 뽑기 결과 — 공유 버튼이 여기서 읽는다

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
    setBanner('반경을 정하고 "뽑기"를 눌러보세요.', '');
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

    lastResult = { lat: center.lat, lng: center.lng, radius: radius, plat: picked.lat, plng: picked.lng, dist: dist };
  }

  function resetAll() {
    center = null;
    lastResult = null;
    if (centerMarker) { map.removeLayer(centerMarker); centerMarker = null; }
    if (circleLayer) { map.removeLayer(circleLayer); circleLayer = null; }
    clearWinner();
    rollBtn.disabled = true;
    radius = 1000;
    radiusInput.value = radius;
    radiusLabel.textContent = fmtRadiusLabel(radius);
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

  // 결과 공유: 현재 상태(중심·반경·뽑힌 좌표)를 ?share= 쿼리에 base64url로 담은 링크를 만든다.
  function buildResultShareUrl(payload) {
    var url = new URL(location.origin + location.pathname);
    var b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    url.searchParams.set('share', b64);
    return url.toString();
  }
  function decodeResultShare() {
    var raw = new URLSearchParams(location.search).get('share');
    if (!raw) return null;
    var s = raw.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    try { return JSON.parse(decodeURIComponent(escape(atob(s)))); } catch (e) { return null; }
  }
  function showShareToast(message) {
    var toast = document.getElementById('copy-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(function () { toast.classList.remove('is-visible'); }, 1500);
  }
  function copyResultLink(url) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(url);
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = url; ta.style.position = 'fixed'; ta.style.left = '-9999px';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy') ? resolve() : reject(); } catch (e) { reject(e); }
      finally { document.body.removeChild(ta); }
    });
  }

  document.getElementById('rr-share-kakao').addEventListener('click', function () {
    if (!lastResult) { showShareToast('먼저 지도를 클릭하고 뽑기를 눌러주세요.'); return; }
    var url = buildResultShareUrl(lastResult);
    if (!window.Kakao) return;
    if (!Kakao.isInitialized()) Kakao.init('{{ site.kakao.js_key }}');
    Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: '우연의 장소',
        description: '중심에서 ' + fmtDistance(lastResult.dist) + ' 떨어진 곳이 뽑혔습니다. 반경 ' + fmtRadiusLabel(lastResult.radius) + ' 안에서 무작위로 골랐어요.',
        imageUrl: '{{ page.header.teaser | absolute_url }}',
        link: { mobileWebUrl: url, webUrl: url }
      }
    });
  });

  document.getElementById('rr-share-link').addEventListener('click', function () {
    if (!lastResult) { showShareToast('먼저 지도를 클릭하고 뽑기를 눌러주세요.'); return; }
    copyResultLink(buildResultShareUrl(lastResult)).then(function () { showShareToast('복사됨!'); });
  });

  // 공유 링크로 들어온 경우: 재굴림 없이 그 결과를 그대로 보여준다.
  var shared = decodeResultShare();
  if (shared && typeof shared.lat === 'number' && typeof shared.plat === 'number') {
    setCenter({ lat: shared.lat, lng: shared.lng });
    radius = shared.radius;
    radiusInput.value = radius;
    radiusLabel.textContent = fmtRadiusLabel(radius);
    drawCircle();
    winnerMarker = L.circleMarker([shared.plat, shared.plng], {
      radius: 9, color: '#fff', weight: 2, fillColor: '#4f7a55', fillOpacity: 1
    }).addTo(map).bindPopup(
      '<div class="rr-popup">공유된 결과<br>' + shared.plat.toFixed(6) + ', ' + shared.plng.toFixed(6) + '</div>'
    ).openPopup();
    distEl.textContent = fmtDistance(shared.dist);
    setBanner('🔗 공유된 결과입니다 — 중심에서 ' + fmtDistance(shared.dist) + ' 떨어진 곳. 지도를 클릭하면 나도 새로 뽑을 수 있다.', 'rr-good');
    lastResult = shared;
    map.setView([shared.lat, shared.lng], map.getZoom());
  }
})();
</script>
