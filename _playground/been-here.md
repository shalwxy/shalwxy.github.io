---
title: "다녀간 자리"
excerpt: "지금 서 있는 자리에 한마디를 남기면 지도 위에 점이 찍힌다. 수정도 삭제도 없이 그대로 쌓이고, 다른 사람이 남긴 점에는 답글을 남길 수 있다. 메모에는 기기별로 고정된 랜덤 닉네임이 붙는다."
date: 2026-11-19
tags:
  - 지도
  - 방명록
header:
  teaser: /assets/img/thumbnail/playground-beenhere.svg
toc: false
author_profile: false
classes: wide
---

지금 서 있는 자리에 한마디를 남기면, 그 위치에 점이 하나 찍힌다. **수정도 삭제도 없이, 남긴 그대로 지도 위에 쌓인다.** 다른 사람이 남긴 점을 클릭하면 뭐라고 남겼는지 볼 수 있고, 그 밑에 답글도 남길 수 있다. 메모를 남기려면 위치 권한을 허용해야 하지만, 지도를 둘러보고 읽는 건 누구나 할 수 있다. 메모와 답글에는 기기(브라우저)별로 고정된 랜덤 닉네임(예: "방황하는 팬더")이 함께 붙는다 — 로그인은 없지만, 같은 기기로 남기면 계속 같은 닉네임으로 보인다.

<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">

<div class="bh-wrap">
  <div id="bh-map" class="bh-map"></div>

  <div class="bh-create">
    <input type="text" id="bh-input" class="bh-input" maxlength="200" placeholder="지금 이 자리에서 남길 한마디">
    <button type="button" class="btn btn--primary" id="bh-submit">현재 위치에 남기기</button>
  </div>

  <div class="bh-status" id="bh-status"></div>
</div>

<style>
.bh-wrap { max-width: 860px; margin: 2em auto; }
.bh-map { height: 420px; border-radius: 10px; border: 1px solid #dadfe4; margin-bottom: 1em; }
.bh-create { display: flex; gap: 0.6em; flex-wrap: wrap; margin-bottom: 0.6em; }
.bh-input {
  flex: 1 1 260px; padding: 0.6em 0.8em; border: 1px solid #c9ccd1; border-radius: 8px; font-size: 1em;
}
.bh-status { min-height: 1.4em; font-size: 0.9em; color: #666; }
.bh-status.bh-bad { color: #a9342a; }
.bh-status.bh-good { color: #335c38; }

.bh-popup { font-size: 0.92em; max-width: 220px; }
.bh-popup-nick { margin: 0; color: #2a5a8a; font-weight: 700; font-size: 0.85em; }
.bh-popup-text { margin: 0.15em 0 0.3em; font-weight: 600; white-space: pre-wrap; word-break: break-word; }
.bh-popup-date { display: block; color: #8a8a8a; font-size: 0.82em; margin-bottom: 0.5em; }
.bh-replies { border-top: 1px solid #e5e5e5; margin-top: 0.4em; padding-top: 0.4em; }
.bh-reply { margin-bottom: 0.35em; }
.bh-reply-nick { display: block; color: #2a5a8a; font-weight: 700; font-size: 0.82em; }
.bh-reply span:not(.bh-reply-nick) { display: block; white-space: pre-wrap; word-break: break-word; }
.bh-reply time { display: block; color: #8a8a8a; font-size: 0.78em; }
.bh-reply-form { display: flex; gap: 0.4em; margin-top: 0.5em; }
.bh-reply-form input {
  flex: 1 1 auto; min-width: 0; padding: 0.35em 0.5em; border: 1px solid #c9ccd1; border-radius: 6px; font-size: 0.9em;
}
.bh-reply-form button {
  padding: 0.35em 0.7em; border: none; border-radius: 6px; background: #2a5a8a; color: #fff; font-size: 0.85em; cursor: pointer;
}
</style>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
<script>
(function () {
  var API_URL = "REPLACE_ME_WITH_YOUR_WORKER_URL";
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
  var markersLayer = L.layerGroup().addTo(map);

  function setStatus(text, cls) {
    statusEl.textContent = text || '';
    statusEl.className = 'bh-status' + (cls ? ' bh-' + cls : '');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function formatDate(iso) {
    try { return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }); }
    catch (e) { return iso; }
  }

  function buildPopupHtml(memo) {
    var repliesHtml = memo.replies.map(function (r) {
      return '<div class="bh-reply"><span class="bh-reply-nick">' + escapeHtml(r.nickname) + '</span><span>' + escapeHtml(r.text) + '</span><time>' + formatDate(r.created_at) + '</time></div>';
    }).join('');
    return (
      '<div class="bh-popup">' +
        '<p class="bh-popup-nick">' + escapeHtml(memo.nickname) + '</p>' +
        '<p class="bh-popup-text">' + escapeHtml(memo.text) + '</p>' +
        '<time class="bh-popup-date">' + formatDate(memo.created_at) + '</time>' +
        '<div class="bh-replies">' + repliesHtml + '</div>' +
        '<form class="bh-reply-form" data-id="' + memo.id + '">' +
          '<input type="text" maxlength="' + TEXT_MAX_LEN + '" placeholder="답글 남기기" required>' +
          '<button type="submit">등록</button>' +
        '</form>' +
      '</div>'
    );
  }

  function renderMemos(memos) {
    markersLayer.clearLayers();
    memos.forEach(function (memo) {
      L.marker([memo.lat, memo.lng]).bindPopup(buildPopupHtml(memo)).addTo(markersLayer);
    });
  }

  function loadMemos() {
    if (API_URL.indexOf('REPLACE_ME') !== -1) {
      setStatus('아직 백엔드 연결 전입니다. 지도는 둘러볼 수 있지만 메모는 저장되지 않습니다.', 'bad');
      return;
    }
    fetch(API_URL + '/memos')
      .then(function (res) { if (!res.ok) throw new Error('load failed'); return res.json(); })
      .then(renderMemos)
      .catch(function () { setStatus('메모를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.', 'bad'); });
  }

  function geoErrorMessage(err) {
    if (err.code === err.PERMISSION_DENIED) return '위치 권한이 거부되어 메모를 남길 수 없습니다.';
    if (err.code === err.TIMEOUT) return '위치를 확인하는 데 시간이 너무 오래 걸렸습니다. 다시 시도해주세요.';
    return '위치를 확인할 수 없습니다.';
  }

  // 답글 폼은 팝업이 열릴 때마다 새로 생성되므로, 매번 submit 리스너를 다시 건다.
  map.on('popupopen', function (e) {
    var el = e.popup.getElement();
    var form = el && el.querySelector('.bh-reply-form');
    if (!form) return;
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var replyInput = form.querySelector('input');
      var text = replyInput.value.trim();
      if (!text) return;
      var parentId = form.getAttribute('data-id');
      var btn = form.querySelector('button');
      btn.disabled = true;
      fetch(API_URL + '/memos/' + parentId + '/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text, visitor_id: getVisitorId() })
      })
        .then(function (res) { if (!res.ok) throw new Error('reply failed'); return res.json(); })
        .then(function (created) { map.closePopup(); loadMemos(); setStatus("'" + created.nickname + "'로 답글을 남겼습니다.", 'good'); })
        .catch(function () { btn.disabled = false; setStatus('답글을 남기지 못했습니다. 잠시 후 다시 시도해주세요.', 'bad'); });
    });
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
          loadMemos();
        })
        .catch(function () { setStatus('메모를 남기지 못했습니다. 잠시 후 다시 시도해주세요.', 'bad'); })
        .finally(function () { submitBtn.disabled = false; });
    }, function (err) {
      submitBtn.disabled = false;
      setStatus(geoErrorMessage(err), 'bad');
    }, { timeout: 10000 });
  });

  loadMemos();
})();
</script>
