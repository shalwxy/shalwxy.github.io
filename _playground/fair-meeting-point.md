---
title: "공평한 약속 장소 찾기"
excerpt: "지도에 각자의 출발점을 찍으면, 가장 멀리 가야 하는 사람의 이동 거리가 최소가 되는 약속 장소를 찾아준다."
date: 2026-11-13
last_modified_at: 2026-11-13
tags:
  - 시각화
  - 기하학
header:
  teaser: /assets/img/thumbnail/playground-fairmeet.svg
toc: false
author_profile: false
classes: wide
---

지도에 사람들의 **출발점을 2개 이상** 찍으면, "가장 멀리 가야 하는 사람의 이동 거리"가 최소가 되는 약속 장소를 찾아준다.

<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">

<div class="mc-wrap">
  <div class="mc-hud">
    <div class="mc-stat"><span>출발점</span><strong id="mc-count">0</strong></div>
    <div class="mc-stat mc-stat-wide"><span>가장 먼 사람의 이동 거리</span><strong id="mc-radius">-</strong></div>
  </div>

  <div id="mc-map"></div>

  <div class="mc-banner" id="mc-banner">지도를 클릭해서 출발점을 두 개 이상 찍어보세요.</div>

  <div class="mc-controls">
    <button type="button" class="btn btn--info" id="mc-undo">마지막 점 취소</button>
    <button type="button" class="btn btn--primary" id="mc-reset">초기화</button>
  </div>
</div>

## 왜 이 지점이 "공평"한가

이동 거리를 공평하게 만드는 기준은 사실 하나가 아니다.

- **이 페이지가 쓰는 기준(미니맥스)**: 가장 멀리 가는 사람의 이동 거리를 최소화한다. 그 결과로 나오는 지점은 **모든 출발점을 포함하는 가장 작은 원(최소 외접원)의 중심**과 정확히 같다 — 그 원의 반지름이 곧 "가장 멀리 가는 사람의 이동 거리"이기 때문이다. 이 지점은 "가장 고생하는 사람을 기준으로 봤을 때 더 나은 지점이 없다"는 뜻에서 공평하다.
- **다른 기준(기하 중앙값)**: 모두의 이동 거리 **합**을 최소화하는 지점(페르마 포인트)도 있다. 전체적으로는 더 효율적일 수 있지만, 한 사람만 유독 많이 걸어야 할 수도 있어서 이 페이지가 말하는 "공평"과는 다르다.

점이 2개면 두 점을 잇는 선분의 중점이 답이고(두 점을 지름으로 하는 원), 3개 이상이면 **그중 2점 또는 3점이 원을 결정**한다 — 둔각삼각형이면 가장 긴 변의 두 점이, 예각삼각형이면 세 점 모두가 원을 결정하는 식이다. 이 페이지는 가능한 모든 2점·3점 조합을 검사해서 전부를 포함하는 가장 작은 원을 찾는다.

위경도는 평면이 아니라서, 찍은 점들을 첫 번째 점 기준으로 **미터 단위 평면좌표로 바꾼 뒤** 계산하고, 결과를 다시 위경도로 돌려 그린다.

<style>
.mc-wrap { margin: 2em 0; }
.mc-hud { display: flex; gap: 1em; margin-bottom: 1em; flex-wrap: wrap; }
.mc-stat {
  flex: 1 1 140px; background: #f7f7f8; border-radius: 8px;
  padding: 0.7em 1em; text-align: center;
}
.mc-stat-wide { flex: 2 1 220px; }
.mc-stat span { display: block; font-size: 0.78em; color: #6b6b6b; margin-bottom: 0.2em; }
.mc-stat strong { font-size: 1.3em; font-weight: 700; }
#mc-map { aspect-ratio: 1 / 1; min-height: 280px; border-radius: 10px; border: 1px solid #dadfe4; margin-bottom: 1em; }
.mc-banner {
  padding: 0.9em 1.1em; border-radius: 8px; background: #eef1f4;
  font-weight: 600; margin-bottom: 1em; min-height: 1.4em; font-size: 0.92em;
}
.mc-banner.mc-good { background: #e5f0e6; color: #335c38; }
.mc-banner.mc-bad { background: #fbe4e1; color: #a9342a; }
.mc-controls { display: flex; justify-content: space-between; gap: 0.6em; flex-wrap: wrap; }
.mc-popup { font-size: 0.85em; }
</style>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
<script>
(function () {
  var EARTH_RADIUS = 6371000; // m

  var points = [];       // { lat, lng, marker }
  var circleLayer = null;
  var centerMarker = null;

  var countEl = document.getElementById('mc-count');
  var radiusEl = document.getElementById('mc-radius');
  var banner = document.getElementById('mc-banner');

  function setBanner(text, cls) {
    banner.textContent = text;
    banner.className = 'mc-banner' + (cls ? ' ' + cls : '');
  }

  var map = L.map('mc-map').setView([37.5665, 126.9780], 12); // 서울 시청 부근 기본 위치
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // 컨테이너 크기를 늦게 읽어서 지도가 작게/깨져 보이는 경우를 막는 안전장치
  setTimeout(function () { map.invalidateSize(); }, 0);
  window.addEventListener('load', function () { map.invalidateSize(); });
  // 폭이 바뀌면 정사각형 높이도 같이 바뀌므로(aspect-ratio), 화면 회전·창 크기 변경 시 다시 계산한다
  window.addEventListener('resize', function () { map.invalidateSize(); });

  // 첫 번째 점을 기준으로 위경도를 미터 단위 평면좌표로 바꾼다 (간이 등장방형 투영)
  function toLocalXY(lat, lng, refLat, refLng) {
    var refRad = refLat * Math.PI / 180;
    var x = EARTH_RADIUS * (lng - refLng) * Math.PI / 180 * Math.cos(refRad);
    var y = EARTH_RADIUS * (lat - refLat) * Math.PI / 180;
    return { x: x, y: y };
  }

  function fromLocalXY(x, y, refLat, refLng) {
    var refRad = refLat * Math.PI / 180;
    var lat = refLat + (y / EARTH_RADIUS) * (180 / Math.PI);
    var lng = refLng + (x / (EARTH_RADIUS * Math.cos(refRad))) * (180 / Math.PI);
    return { lat: lat, lng: lng };
  }

  function distXY(a, b) {
    return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
  }

  function circleFrom2(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, r: distXY(a, b) / 2 };
  }

  // 평면좌표 세 점의 외심을 반지름까지 함께 구한다. 일직선이면 null.
  function circleFrom3(a, b, c) {
    var d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
    if (Math.abs(d) < 1e-9) return null;
    var aa = a.x * a.x + a.y * a.y;
    var bb = b.x * b.x + b.y * b.y;
    var cc = c.x * c.x + c.y * c.y;
    var ux = (aa * (b.y - c.y) + bb * (c.y - a.y) + cc * (a.y - b.y)) / d;
    var uy = (aa * (c.x - b.x) + bb * (a.x - c.x) + cc * (b.x - a.x)) / d;
    var center = { x: ux, y: uy };
    return { x: ux, y: uy, r: distXY(center, a) };
  }

  function circleContainsAll(circle, pts) {
    var eps = 1e-6;
    for (var i = 0; i < pts.length; i++) {
      if (distXY(circle, pts[i]) > circle.r + eps) return false;
    }
    return true;
  }

  // 최소 외접원: 모든 2점 조합(지름)과 3점 조합(외접원) 중 전부를 포함하면서 반지름이 가장 작은 원.
  // 점 개수가 적어(수십 개 이하) 브루트포스로도 충분히 빠르다.
  function minEnclosingCircle(pts) {
    if (pts.length === 1) return { x: pts[0].x, y: pts[0].y, r: 0 };
    var best = null;
    for (var i = 0; i < pts.length; i++) {
      for (var j = i + 1; j < pts.length; j++) {
        var c2 = circleFrom2(pts[i], pts[j]);
        if (circleContainsAll(c2, pts) && (!best || c2.r < best.r)) best = c2;
      }
    }
    for (var p = 0; p < pts.length; p++) {
      for (var q = p + 1; q < pts.length; q++) {
        for (var r = q + 1; r < pts.length; r++) {
          var c3 = circleFrom3(pts[p], pts[q], pts[r]);
          if (c3 && circleContainsAll(c3, pts) && (!best || c3.r < best.r)) best = c3;
        }
      }
    }
    return best;
  }

  function fmtDistance(m) {
    if (m >= 1000) return (m / 1000).toFixed(2) + 'km';
    return Math.round(m) + 'm';
  }

  function clearResult() {
    if (circleLayer) { map.removeLayer(circleLayer); circleLayer = null; }
    if (centerMarker) { map.removeLayer(centerMarker); centerMarker = null; }
    radiusEl.textContent = '-';
  }

  function computeAndDraw() {
    var refLat = points[0].lat, refLng = points[0].lng;
    var xy = points.map(function (p) { return toLocalXY(p.lat, p.lng, refLat, refLng); });

    var circle = minEnclosingCircle(xy);
    var centerLatLng = fromLocalXY(circle.x, circle.y, refLat, refLng);

    clearResult();
    if (circle.r > 0) {
      circleLayer = L.circle([centerLatLng.lat, centerLatLng.lng], {
        radius: circle.r, color: '#4f7a55', weight: 3, fill: false, dashArray: '6 8'
      }).addTo(map);
    }
    centerMarker = L.circleMarker([centerLatLng.lat, centerLatLng.lng], {
      radius: 7, color: '#fff', weight: 2, fillColor: '#4f7a55', fillOpacity: 1
    }).addTo(map).bindPopup('<div class="mc-popup">공평한 약속 장소<br>' + centerLatLng.lat.toFixed(6) + ', ' + centerLatLng.lng.toFixed(6) + '</div>');

    radiusEl.textContent = fmtDistance(circle.r);
    setBanner('🟢 가장 멀리 가는 사람도 ' + fmtDistance(circle.r) + '만 이동하면 됩니다.', 'mc-good');
  }

  function updateCount() {
    countEl.textContent = points.length;
  }

  function addPoint(latlng) {
    var marker = L.circleMarker(latlng, {
      radius: 8, color: '#fff', weight: 2, fillColor: '#d1483a', fillOpacity: 1
    }).addTo(map).bindTooltip(String(points.length + 1), { permanent: true, direction: 'top', offset: [0, -8] });

    points.push({ lat: latlng.lat, lng: latlng.lng, marker: marker });
    updateCount();

    if (points.length < 2) {
      setBanner('점 1개 찍음. 한 개 더 찍으면 계산을 시작합니다.', '');
    } else {
      computeAndDraw();
    }
  }

  function removeLastPoint() {
    var last = points.pop();
    if (last) map.removeLayer(last.marker);
    updateCount();
    clearResult();
    if (points.length === 0) {
      setBanner('지도를 클릭해서 출발점을 두 개 이상 찍어보세요.', '');
    } else if (points.length === 1) {
      setBanner('점 1개 남음. 한 개 더 찍으면 계산을 시작합니다.', '');
    } else {
      computeAndDraw();
    }
  }

  function resetAll() {
    points.forEach(function (p) { map.removeLayer(p.marker); });
    points = [];
    updateCount();
    clearResult();
    setBanner('지도를 클릭해서 출발점을 두 개 이상 찍어보세요.', '');
  }

  map.on('click', function (e) { addPoint(e.latlng); });
  document.getElementById('mc-undo').addEventListener('click', removeLastPoint);
  document.getElementById('mc-reset').addEventListener('click', resetAll);
})();
</script>
