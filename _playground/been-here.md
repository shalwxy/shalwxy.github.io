---
title: "다녀간 자리"
excerpt: "지금 서 있는 자리에 한마디를 남기면 그 위치에 메모가 하나 찍힌다."
date: 2026-11-19
tags:
  - 지도
  - 방명록
header:
  teaser: /assets/img/thumbnail/playground-beenhere.svg
links:
  - label: "관련 글 보기"
    url: /essay/review/reading/attention-and-observation/#common-themes
toc: false
author_profile: false
classes: wide
---

지금 서 있는 자리에 한마디를 남기면, 그 위치에 메모가 하나 찍힌다.

[`주의를 기울이는 법 (롭 워커), 관찰 연습 (니콜라 노바)`](/essay/review/reading/attention-and-observation/#common-themes)의 '주석 달기' 부분에서 아이디어를 가져왔다.

<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" integrity="sha256-YU3qCpj/P06tdPBJGPax0bm6Q1wltfwjsho5TR4+TYc=" crossorigin="">
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" integrity="sha256-YSWCMtmNZNwqex4CEw1nQhvFub2lmU7vcCKP+XVwwXA=" crossorigin="">

<div class="bh-wrap">
  <div id="bh-map" class="bh-map"></div>

  <div class="bh-create">
    <input type="text" id="bh-input" class="bh-input" maxlength="200" placeholder="떠오른 생각">
    <button type="button" class="bh-create-btn" id="bh-submit">남기기</button>
  </div>

  <div class="bh-warn">⚠ 지도에 정확한 위치가 표시됩니다. 개인적인 장소에서는 메모를 남기지 마세요.</div>

  <div class="bh-status" id="bh-status"></div>
</div>

<style>
.bh-wrap { max-width: 860px; margin: 2em auto; }
.bh-map { height: 420px; border-radius: 10px; border: 1px solid #dadfe4; margin-bottom: 1em; }
.bh-create {
  display: flex; align-items: center; margin-bottom: 0.6em;
  border: 1px solid #c9ccd1; border-radius: 8px; overflow: hidden;
}
.bh-wrap .bh-create input.bh-input {
  flex: 1 1 auto; min-width: 0; box-sizing: border-box;
  -webkit-appearance: none; -moz-appearance: none; appearance: none; box-shadow: none;
  font-family: inherit; font-size: 1em;
  height: 46px; padding: 0 0.9em; margin: 0; border: none; border-radius: 0; background: #fff;
}
.bh-wrap .bh-create input.bh-input:focus { outline: none; background: #fafbfc; }
.bh-wrap .bh-create button.bh-create-btn {
  flex: none; white-space: nowrap; box-sizing: border-box;
  display: flex; align-items: center; justify-content: center;
  -webkit-appearance: none; -moz-appearance: none; appearance: none; box-shadow: none; margin: 0;
  font-family: inherit; font-size: 1em; font-weight: 600;
  height: 46px; padding: 0 1.1em; border: none;
  background: #2a5a8a; color: #fff; cursor: pointer;
}
.bh-wrap .bh-create button.bh-create-btn:hover { background: #244d77; }
.bh-wrap .bh-create button.bh-create-btn:disabled { opacity: 0.6; cursor: default; }
.bh-warn { background: #fbe4e1; color: #a9342a; border-radius: 6px; padding: 0.6em 0.8em; margin: 0.6em 0; font-size: 0.85em; }
.bh-status { min-height: 1.4em; font-size: 0.9em; color: #666; }
.bh-status.bh-bad { color: #a9342a; }
.bh-status.bh-good { color: #335c38; }

.bh-marker span {
  display: block; width: 22px; height: 22px; border-radius: 50%;
  border: 3px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.35);
}
.bh-cluster-header { display: flex; justify-content: flex-end; margin-bottom: 0.4em; }
button.bh-cluster-update {
  -webkit-appearance: none; -moz-appearance: none; appearance: none; box-shadow: none; margin: 0;
  padding: 0.3em 0.6em; border: 1px solid #c9ccd1; border-radius: 6px; background: #fff;
  font-size: 0.8em; cursor: pointer;
}
button.bh-cluster-update:disabled { opacity: 0.5; cursor: default; }
.bh-cluster-list { max-height: 260px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.4em; }
button.bh-cluster-item {
  display: block; width: 100%; text-align: left; font: inherit; cursor: pointer;
  -webkit-appearance: none; -moz-appearance: none; appearance: none; box-shadow: none; margin: 0;
  background: #f7f7f8; border: none; border-radius: 6px; padding: 0.5em 0.6em;
}
button.bh-cluster-item:hover { background: #ebedf0; }
.bh-cluster-nick { display: block; color: #2a5a8a; font-weight: 700; font-size: 0.82em; }
.bh-cluster-text { display: block; font-weight: 600; margin: 0.15em 0; white-space: pre-wrap; word-break: break-word; }
.bh-cluster-item time { display: block; color: #8a8a8a; font-size: 0.78em; }

.bh-popup { font-size: 0.92em; max-width: 260px; }
.bh-popup-nick { margin: 0; color: #2a5a8a; font-weight: 700; font-size: 0.85em; }
.bh-popup-text { margin: 0.15em 0 0.3em; font-weight: 600; white-space: pre-wrap; word-break: break-word; }
.bh-popup-date { display: block; color: #8a8a8a; font-size: 0.82em; margin-bottom: 0.5em; }
.bh-replies { max-height: 150px; overflow-y: auto; border-top: 1px solid #e5e5e5; margin-top: 0.4em; padding-top: 0.4em; }
.bh-reply { margin-bottom: 0.35em; }
.bh-reply-nick { display: block; color: #2a5a8a; font-weight: 700; font-size: 0.82em; }
.bh-reply span:not(.bh-reply-nick) { display: block; white-space: pre-wrap; word-break: break-word; }
.bh-reply time { display: block; color: #8a8a8a; font-size: 0.78em; }
.bh-reply-form {
  display: flex; align-items: center; margin: 0.6em 0 0; padding: 0;
  border: 1px solid #c9ccd1; border-radius: 8px; overflow: hidden; background: #fff;
}
.bh-popup form.bh-reply-form input {
  flex: 1 1 auto; min-width: 0; box-sizing: border-box;
  -webkit-appearance: none; -moz-appearance: none; appearance: none; box-shadow: none;
  font-family: inherit; font-size: 0.95em;
  height: 40px; padding: 0 0.9em; margin: 0; border: none; border-radius: 0; background: #fff;
}
.bh-popup form.bh-reply-form input:focus { outline: none; background: #fafbfc; }
.bh-popup form.bh-reply-form button {
  flex: none; white-space: nowrap; box-sizing: border-box;
  display: flex; align-items: center; justify-content: center;
  -webkit-appearance: none; -moz-appearance: none; appearance: none; box-shadow: none; margin: 0;
  font-family: inherit; font-size: 0.95em; font-weight: 600;
  height: 40px; padding: 0 1.1em; border: none;
  background: #2a5a8a; color: #fff; cursor: pointer;
}
.bh-popup form.bh-reply-form button:hover { background: #244d77; }
.bh-popup form.bh-reply-form button:disabled { opacity: 0.6; cursor: default; }
</style>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
<script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js" integrity="sha256-Hk4dIpcqOSb0hZjgyvFOP+cEmDXUKKNE/tT542ZbNQg=" crossorigin=""></script>
<script>
(function () {
  var API_URL = "https://been-here.shalwxy.workers.dev";
  var TEXT_MAX_LEN = 200;
  var VISITOR_KEY = 'bh-visitor-id';

  // 기기(브라우저)별로 한 번만 발급해서 저장 — 서버는 이 토큰을 해시해서 닉네임을 정한다.
  function getVisitorId() {
    try {
      var id = localStorage.getItem(VISITOR_KEY);
      if (!id) {
        id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : (Date.now() + '-' + Math.random().toString(36).slice(2));
        localStorage.setItem(VISITOR_KEY, id);
      }
      return id;
    } catch (e) {
      return Date.now() + '-' + Math.random().toString(36).slice(2);
    }
  }

  var input = document.getElementById('bh-input');
  var submitBtn = document.getElementById('bh-submit');
  var statusEl = document.getElementById('bh-status');

  var map = L.map('bh-map').setView([20, 20], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);
  var markersLayer = L.markerClusterGroup({
    zoomToBoundsOnClick: false,
    spiderfyOnMaxZoom: false,
    showCoverageOnHover: false
  });
  map.addLayer(markersLayer);

  var CLUSTER_PAGE_SIZE = 20;

  // 클러스터 영역(bounds) 안에 있는 메모들을 markersLayer에서 직접 모아 최신순으로 정렬한다.
  // 클러스터 객체 자체가 아니라 지리적 영역으로 걸러서, 업데이트 후 데이터가 바뀌어도 그대로 재사용할 수 있다.
  function collectItemsInBounds(bounds) {
    var out = [];
    markersLayer.eachLayer(function (m) {
      if (m.memoData && bounds.contains(m.getLatLng())) out.push({ marker: m, memo: m.memoData });
    });
    out.sort(function (a, b) { return new Date(b.memo.created_at) - new Date(a.memo.created_at); });
    return out;
  }

  function buildClusterItemEl(item) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'bh-cluster-item';
    btn.innerHTML =
      '<span class="bh-cluster-nick">' + escapeHtml(item.memo.nickname) + '</span>' +
      '<span class="bh-cluster-text">' + escapeHtml(item.memo.text) + '</span>' +
      '<time>' + formatDate(item.memo.created_at) + '</time>';
    btn.addEventListener('click', function () {
      map.closePopup();
      // 클러스터 상태(펼쳐져 있는지, 겹쳐 있는지)와 무관하게 항상 같은 방식으로 열리도록,
      // 마커를 조작하는 대신 이미 가진 메모 데이터로 그 위치에 팝업을 바로 띄운다.
      var popup = L.popup({ maxWidth: 260, minWidth: 220 })
        .setLatLng(item.marker.getLatLng())
        .setContent(buildPopupHtml(item.memo));
      popup.bhMemo = item.memo;
      popup.openOn(map);
    });
    return btn;
  }

  // 클러스터를 클릭하면 확대 대신, 그 안에 뭉친 메모들을 최신순 목록으로 보여준다.
  // 목록은 한 번에 일부만 그리고 스크롤이 바닥에 닿을 때마다 더 그려서(무한 스크롤) 메모가 많아져도 가볍게 유지한다.
  markersLayer.on('clusterclick', function (e) {
    var bounds = e.layer.getBounds();

    var headerEl = document.createElement('div');
    headerEl.className = 'bh-cluster-header';
    var updateBtn = document.createElement('button');
    updateBtn.type = 'button';
    updateBtn.className = 'bh-cluster-update';
    updateBtn.textContent = '업데이트';
    headerEl.appendChild(updateBtn);

    var listEl = document.createElement('div');
    listEl.className = 'bh-cluster-list';

    var wrapEl = document.createElement('div');
    wrapEl.appendChild(headerEl);
    wrapEl.appendChild(listEl);

    var popup = L.popup({ maxWidth: 280, minWidth: 220 })
      .setLatLng(bounds.getCenter())
      .setContent(wrapEl)
      .openOn(map);

    var listState = { items: [], rendered: 0 };

    function renderMore() {
      var next = listState.items.slice(listState.rendered, listState.rendered + CLUSTER_PAGE_SIZE);
      next.forEach(function (item) { listEl.appendChild(buildClusterItemEl(item)); });
      listState.rendered += next.length;
    }

    function resetAndRender(items) {
      listState.items = items;
      listState.rendered = 0;
      listEl.innerHTML = '';
      renderMore();
      listEl.scrollTop = 0;
    }

    listEl.addEventListener('scroll', function () {
      if (listEl.scrollTop + listEl.clientHeight >= listEl.scrollHeight - 40) renderMore();
    });

    updateBtn.addEventListener('click', function () {
      updateBtn.disabled = true;
      loadMemos().then(function () {
        resetAndRender(collectItemsInBounds(bounds));
        updateBtn.disabled = false;
      }).catch(function () { updateBtn.disabled = false; });
    });

    resetAndRender(collectItemsInBounds(bounds));
  });

  // 닉네임 문자열을 해시해서 늘 같은 색을 뽑는다 — 같은 사람이 남긴 마커는 지도에서 같은 색으로 보인다.
  function hashStringClient(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h >>> 0;
  }
  function iconForNickname(nickname) {
    var hue = hashStringClient(nickname) % 360;
    return L.divIcon({
      className: 'bh-marker',
      html: '<span style="background:hsl(' + hue + ',65%,45%)"></span>',
      iconSize: [22, 22],
      iconAnchor: [11, 11],
      popupAnchor: [0, -11]
    });
  }

  function setStatus(text, cls) {
    statusEl.textContent = text || '';
    statusEl.className = 'bh-status' + (cls ? ' bh-' + cls : '');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function pad2(n) { return String(n).padStart(2, '0'); }

  function formatDate(iso) {
    try {
      var d = new Date(iso);
      return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' +
        pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
    } catch (e) { return iso; }
  }

  var REPLY_PAGE_SIZE = 10;

  function buildPopupHtml(memo) {
    return (
      '<div class="bh-popup">' +
        '<p class="bh-popup-nick">' + escapeHtml(memo.nickname) + '</p>' +
        '<p class="bh-popup-text">' + escapeHtml(memo.text) + '</p>' +
        '<time class="bh-popup-date">' + formatDate(memo.created_at) + '</time>' +
        '<div class="bh-replies"></div>' +
        '<form class="bh-reply-form">' +
          '<input type="text" maxlength="' + TEXT_MAX_LEN + '" placeholder="떠오른 생각">' +
          '<button type="submit">남기기</button>' +
        '</form>' +
      '</div>'
    );
  }

  function buildReplyEl(r) {
    var div = document.createElement('div');
    div.className = 'bh-reply';
    div.innerHTML =
      '<span class="bh-reply-nick">' + escapeHtml(r.nickname) + '</span>' +
      '<span>' + escapeHtml(r.text) + '</span>' +
      '<time>' + formatDate(r.created_at) + '</time>';
    return div;
  }

  // 답글 목록도 한 번에 일부만 그리고, 스크롤이 바닥에 닿으면 이어서 더 그린다(무한 스크롤).
  // revealAll이 true면(방금 답글을 남겼을 때) 전부 그리고 맨 아래로 스크롤해서 바로 보여준다.
  function wireReplies(popup, memo, revealAll) {
    var el = popup.getElement();
    var container = el && el.querySelector('.bh-replies');
    if (!container) return;
    container.innerHTML = '';
    var rendered = 0;
    function renderMore() {
      var next = memo.replies.slice(rendered, rendered + REPLY_PAGE_SIZE);
      next.forEach(function (r) { container.appendChild(buildReplyEl(r)); });
      rendered += next.length;
    }
    container.onscroll = function () {
      if (container.scrollTop + container.clientHeight >= container.scrollHeight - 30) renderMore();
    };
    if (revealAll) {
      while (rendered < memo.replies.length) renderMore();
      container.scrollTop = container.scrollHeight;
    } else {
      renderMore();
    }
  }

  function renderMemos(memos) {
    markersLayer.clearLayers();
    memos.forEach(function (memo) {
      var marker = L.marker([memo.lat, memo.lng], { icon: iconForNickname(memo.nickname) });
      marker.memoData = memo;
      marker.bindPopup(buildPopupHtml(memo), { maxWidth: 260, minWidth: 220 });
      marker.getPopup().bhMemo = memo;
      marker.addTo(markersLayer);
    });
  }

  function loadMemos() {
    if (API_URL.indexOf('REPLACE_ME') !== -1) {
      setStatus('아직 백엔드 연결 전입니다. 지도는 둘러볼 수 있지만 메모는 저장되지 않습니다.', 'bad');
      return Promise.resolve();
    }
    return fetch(API_URL + '/memos')
      .then(function (res) { if (!res.ok) throw new Error('load failed'); return res.json(); })
      .then(renderMemos)
      .catch(function (err) { setStatus('메모를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.', 'bad'); throw err; });
  }

  function geoErrorMessage(err) {
    if (err.code === err.PERMISSION_DENIED) return '위치 권한이 거부되어 메모를 남길 수 없습니다.';
    if (err.code === err.TIMEOUT) return '위치를 확인하는 데 시간이 너무 오래 걸렸습니다. 다시 시도해주세요.';
    return '위치를 확인할 수 없습니다.';
  }

  // 답글 폼은 팝업 내용이 바뀔 때마다(처음 열릴 때 + 답글 등록 후 다시 그릴 때) 새로 생성되므로,
  // 그때마다 이 함수로 submit 리스너를 다시 건다. 팝업은 닫지 않고, 등록된 답글을 그 자리에 바로 붙여 보여준다.
  function wireReplyForm(popup, memo) {
    var el = popup.getElement();
    var form = el && el.querySelector('.bh-reply-form');
    if (!form || form.dataset.wired) return;
    form.dataset.wired = '1';
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var replyInput = form.querySelector('input');
      var text = replyInput.value.trim();
      if (!text) return;
      var btn = form.querySelector('button');
      replyInput.disabled = true;
      btn.disabled = true;
      fetch(API_URL + '/memos/' + memo.id + '/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text, visitor_id: getVisitorId() })
      })
        .then(function (res) { if (!res.ok) throw new Error('reply failed'); return res.json(); })
        .then(function (created) {
          memo.replies.push(created);
          popup.setContent(buildPopupHtml(memo));
          wireReplyForm(popup, memo);
          wireReplies(popup, memo, true);
          setStatus("'" + created.nickname + "'로 답글을 남겼습니다.", 'good');
        })
        .catch(function () {
          replyInput.disabled = false;
          btn.disabled = false;
          setStatus('답글을 남기지 못했습니다. 잠시 후 다시 시도해주세요.', 'bad');
        });
    });
  }

  map.on('popupopen', function (e) {
    if (!e.popup.bhMemo) return;
    wireReplyForm(e.popup, e.popup.bhMemo);
    wireReplies(e.popup, e.popup.bhMemo, false);
  });

  input.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter') { ev.preventDefault(); submitBtn.click(); }
  });

  submitBtn.addEventListener('click', function () {
    var text = input.value.trim();
    if (!text) { setStatus('메모를 먼저 입력해주세요.', 'bad'); return; }
    if (API_URL.indexOf('REPLACE_ME') !== -1) { setStatus('아직 백엔드 연결 전이라 저장할 수 없습니다.', 'bad'); return; }
    if (!navigator.geolocation) { setStatus('이 브라우저는 위치 정보를 지원하지 않습니다.', 'bad'); return; }

    submitBtn.disabled = true;
    setStatus('위치를 확인하는 중...', '');
    navigator.geolocation.getCurrentPosition(function (pos) {
      var lat = pos.coords.latitude;
      var lng = pos.coords.longitude;
      fetch(API_URL + '/memos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: lat, lng: lng, text: text, visitor_id: getVisitorId() })
      })
        .then(function (res) { if (!res.ok) throw new Error('create failed'); return res.json(); })
        .then(function (created) {
          input.value = '';
          setStatus("'" + created.nickname + "'로 이 자리에 메모를 남겼습니다.", 'good');
          map.setView([lat, lng], 13);
          loadMemos().catch(function () {});
        })
        .catch(function () { setStatus('메모를 남기지 못했습니다. 잠시 후 다시 시도해주세요.', 'bad'); })
        .finally(function () { submitBtn.disabled = false; });
    }, function (err) {
      submitBtn.disabled = false;
      setStatus(geoErrorMessage(err), 'bad');
    }, { timeout: 10000 });
  });

  loadMemos().catch(function () {});
})();
</script>
