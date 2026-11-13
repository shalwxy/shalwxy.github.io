---
title: "부동산 첫 구매 시뮬레이터"
excerpt: "지역 규제·생애최초 여부·연소득·공시가격을 입력하면 대출 가능액, 월 상환액, 총 필요 현금을 계산해주는 참고용 시뮬레이터."
date: 2026-11-13
last_modified_at: 2026-11-13
tags:
  - 시뮬레이터
  - 부동산
header:
  teaser: /assets/img/thumbnail/playground-firsthome.svg
links:
  - label: "관련 글 보기"
    url: /essay/learning/life/mortgage-consultation/
toc: false
author_profile: false
classes: wide
---

[`주택담보대출 은행 상담 비교`](/essay/learning/life/mortgage-consultation/) 글에서 정리한 구조를 바탕으로 만든 계산기다. **LTV와 DSR 중 더 낮은 쪽**이 실제 대출 한도를 정하고, 거기에 취득세·중개수수료 같은 부대비용을 더하면 "진짜 필요한 현금"이 나온다는 걸 숫자로 보여준다. 2025년 하반기에 나온 6·27 대책, 9·7 추가대책, 10·15 대책, 스트레스 DSR 3단계와 2026년 8·13 금융 종합대책까지 반영해 지역 구분과 DSR 계산 방식을 업데이트했다.

<div class="hb-notice">
  ⚠️ <strong>이 시뮬레이터는 참고용 스냅샷이다.</strong> 아래 수치는 <strong id="hb-asof">-</strong> 발표 기준으로 단순화해 넣었고, 규제지역 지정·LTV·토허제 구역은 수시로 바뀐다. 공시가격은 실제 LTV 산정 기준(시세·감정가)과 다를 수 있어 근사치로만 썼다. 실제 대출 가능액은 반드시 취급 은행과 금융위원회·국토교통부 공지로 재확인한다.<br>
  최종 업데이트: <strong>2026-11-13</strong> · 참고한 자료는 글 하단의 "참고 자료"를 확인한다.
</div>

<div class="hb-wrap">
  <div class="hb-form">
    <h3>입력</h3>

    <label>
      <span class="hb-label-text">지역 구분<span class="hb-tip" tabindex="0" data-tip="투기과열지구·조정대상지역은 정부가 집값 과열을 막기 위해 지정하는 규제지역입니다. 두 지정이 겹치는 곳(강남3구·용산 등)이 가장 강한 규제(LTV 40%, 6억원 상한 등)를 받습니다.">?</span></span>
      <select id="hb-region">
        <option value="local">지방 (비수도권)</option>
        <option value="metro">수도권 (비규제지역)</option>
        <option value="regulated">규제지역 (강남3구·용산 등)</option>
      </select>
    </label>

    <label>
      <span class="hb-label-text">시/군/구 또는 동 (토허제 확인용·선택)<span class="hb-tip" tabindex="0" data-tip="토지거래허가제의 줄임말입니다. 지정된 구역에서 집을 사려면 구청장 허가가 필요하고, 허가를 받으면 보통 2년간 실거주해야 하며 그 전까지 전세를 주거나 되팔 수 없습니다.">?</span></span>
      <input type="text" id="hb-dong" placeholder="예: 강남구, 가리봉동">
    </label>
    <div class="hb-hint-slot"><div class="hb-hint" id="hb-dong-result"></div></div>

    <label class="hb-checkbox">
      <input type="checkbox" id="hb-first-time" checked>
      생애최초 주택 구입
    </label>

    <label class="hb-checkbox">
      <input type="checkbox" id="hb-ordinary">
      서민·실수요자 요건 충족
      <span class="hb-tip" tabindex="0" data-tip="보통 무주택 세대주이면서 부부합산 연소득과 구매하려는 주택 가격이 일정 기준 이하인 경우를 말합니다. 규제지역에서 생애최초로 집을 살 때 이 요건을 충족하면 LTV가 40%에서 60%로 완화됩니다. 정확한 소득·가격 기준은 시기·은행마다 다르므로 상담 시 별도 확인이 필요합니다.">?</span>
    </label>

    <label class="hb-checkbox">
      <input type="checkbox" id="hb-multi-home">
      2주택 이상 보유 (다주택자)
    </label>

    <label>연소득 (만원)
      <input type="number" id="hb-income" value="6000">
    </label>

    <label>기존 대출 월 상환액 (만원, 원리금 합산)
      <input type="number" id="hb-existing-pay" value="0">
    </label>

    <label>구매 희망 부동산 공시가격 (만원)
      <input type="number" id="hb-price" value="80000">
    </label>

    <label>신규 대출 금리 (연 %, 실제 계약 기준)
      <input type="number" step="0.1" id="hb-rate" value="4.2">
    </label>

    <label>신규 대출 만기 (년)
      <input type="number" id="hb-years" value="30">
    </label>

    <button type="button" class="btn btn--primary" id="hb-calc">계산하기</button>
  </div>

  <div class="hb-result" id="hb-result">
    <p class="hb-placeholder">왼쪽 값을 입력하고 계산하기를 눌러보세요.</p>
  </div>
</div>

<style>
.hb-notice {
  max-width: 900px; margin: 1.2em auto 1.6em;
  background: #fff3cd; border: 1px solid #ffe69c;
  border-radius: 8px; padding: 0.9em 1.1em; font-size: 0.85em; line-height: 1.6;
}
.hb-wrap { max-width: 900px; margin: 0 auto; display: flex; gap: 2em; flex-wrap: wrap; }
.hb-form { flex: 1 1 320px; display: flex; flex-direction: column; gap: 0.9em; }
.hb-form h3 { margin: 0 0 0.2em; }
.hb-form label { display: flex; flex-direction: column; gap: 0.3em; font-size: 0.88em; font-weight: 600; }
.hb-form input[type="number"], .hb-form input[type="text"], .hb-form select {
  font-weight: 400; padding: 0.45em 0.6em; border-radius: 6px; border: 1px solid #ccc;
}
.hb-checkbox { flex-direction: row !important; align-items: center; gap: 0.5em !important; }
.hb-checkbox input { width: auto; }
.hb-label-text { display: inline-flex; align-items: center; }
.hb-hint-slot { position: relative; height: 3.2em; }
.hb-hint { position: absolute; top: 0; left: 0; right: 0; font-size: 0.78em; color: #a9342a; line-height: 1.3em; }
.hb-result {
  flex: 1 1 380px; background: #f7f7f8; border-radius: 10px; padding: 1.2em 1.4em;
  font-size: 0.92em; line-height: 1.7;
}
.hb-placeholder { color: #888; }
.hb-result h4 { margin: 1em 0 0.4em; font-size: 1em; }
.hb-result h4:first-child { margin-top: 0; }
.hb-row { display: flex; justify-content: space-between; align-items: baseline; gap: 1em; }
.hb-row > span:first-child { flex: 1 1 auto; }
.hb-row > span:last-child { flex: 0 0 auto; white-space: nowrap; text-align: right; }
.hb-row.hb-total { font-weight: 700; font-size: 1.08em; border-top: 1px solid #ddd; margin-top: 0.4em; padding-top: 0.4em; }
.hb-note { font-size: 0.8em; color: #666; }
.hb-warn { background: #fbe4e1; color: #a9342a; border-radius: 6px; padding: 0.6em 0.8em; margin: 0.6em 0; font-size: 0.85em; }

.hb-tip {
  display: inline-flex; align-items: center; justify-content: center;
  width: 1.15em; height: 1.15em; border-radius: 50%;
  background: #b7bec8; color: #fff; font-size: 0.72em; font-weight: 700;
  margin-left: 0.3em; cursor: help; position: relative; vertical-align: middle;
}
.hb-tip::after {
  content: attr(data-tip);
  position: absolute; bottom: 140%; left: 50%; transform: translateX(-50%);
  background: #333; color: #fff; font-weight: 400; font-size: 0.92em; line-height: 1.5;
  padding: 0.6em 0.8em; border-radius: 8px; width: 240px; text-align: left;
  white-space: normal; opacity: 0; pointer-events: none; transition: opacity 0.15s ease;
  z-index: 20;
}
.hb-tip:hover::after, .hb-tip:focus::after { opacity: 1; }
</style>

<script>
(function () {
  var SNAPSHOT_LABEL = "2025.6.27~2026.8.13 발표 누적(2026년 11월 확인)";

  // 2025.6.27 대책 + 2025.9.7 추가대책 + 2025.10.15 대책 + 2026.8.13 금융 종합대책 반영 (단순화).
  // 2026.8.13 대책은 가계대출 총량 목표만 조정했고, 개인별 LTV·DSR 한도 자체는 그대로 유지된다고 밝혔다.
  // regulated = 투기과열지구·조정대상지역 동시지정 지역(강남3구·용산 등).
  var REGION_TIERS = {
    local:      { label: "지방(비수도권)", ltv: 0.70, ltvFirst: 0.80, metroCap: false, stressRate: 0.75 },
    metro:      { label: "수도권(비규제)", ltv: 0.70, ltvFirst: 0.80, metroCap: true,  stressRate: 3.00 },
    regulated:  { label: "규제지역",       ltv: 0.40, ltvFirst: 0.40, metroCap: true,  stressRate: 3.00 }
  };
  var LTV_ORDINARY_BUYER = 0.60; // 규제지역 + 생애최초 + 서민·실수요자 요건 충족 시
  var METRO_LOAN_CAP = 60000;    // 수도권·규제지역 주담대 6억원 상한 (만원), 6·27 대책
  // 지방 주담대의 2단계 스트레스 금리(0.75%p) 적용은 2026.12.31까지 두 번째 연장됨(2026.6.18 금융위 발표).

  // 토허제: 강남3구·용산구는 '구' 전역 아파트가 대상(2025.9.17 재지정, ~2026.12.31로 보도됨).
  // 그 외 신속통합기획·공공재개발 후보지 일부(2025.9.30~2026.8.30)는 동 단위로 추가.
  // 반대로 2026.11.3부터 경기 김포·구리·하남·의정부 그린벨트 일부(324㎢, 신규 택지 후보지 제외분)는 해제됐다.
  // 토허제는 이렇게 양방향으로 수시 변경되니, 실제 전체 목록은 서울시·해당 시군구 고시로 확인한다.
  var LAND_PERMIT_GU = ["강남구", "서초구", "송파구", "용산구"];
  var LAND_PERMIT_EXTRA_DONG = ["가리봉동"]; // 공공재개발 후보지 1곳(구로구) 등 일부만 반영

  var DSR_LIMIT = 0.40; // 은행권 일반 기준, 상품·규제에 따라 다름
  var ETC_COST_ESTIMATE = 300; // 이사·법무사 등 기타 부대비용 추정치 (만원)

  function monthlyRate(annualPct) { return annualPct / 100 / 12; }

  function monthlyPayment(principal, annualPct, years) {
    var r = monthlyRate(annualPct);
    var n = years * 12;
    if (principal <= 0) return 0;
    if (r === 0) return principal / n;
    return principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  }

  function maxPrincipalFromMonthlyPayment(monthlyAllowed, annualPct, years) {
    var r = monthlyRate(annualPct);
    var n = years * 12;
    if (monthlyAllowed <= 0) return 0;
    if (r === 0) return monthlyAllowed * n;
    return monthlyAllowed * (Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n));
  }

  // 취득세율: 6억 이하 1%, 6~9억 1~3% 선형, 9억 초과 3% (85㎡ 이하 가정, 단순화)
  function acquisitionTaxRate(priceManwon) {
    if (priceManwon <= 60000) return 0.01;
    if (priceManwon <= 90000) {
      return 0.01 + (priceManwon - 60000) / (90000 - 60000) * 0.02;
    }
    return 0.03;
  }

  // 중개보수 상한요율 (서울 매매 기준, 단순화)
  function brokerFee(priceManwon) {
    var rate, cap;
    if (priceManwon < 5000) { rate = 0.006; cap = 25; }
    else if (priceManwon < 20000) { rate = 0.005; cap = 80; }
    else if (priceManwon < 90000) { rate = 0.004; cap = null; }
    else if (priceManwon < 120000) { rate = 0.005; cap = null; }
    else if (priceManwon < 150000) { rate = 0.006; cap = null; }
    else { rate = 0.007; cap = null; }
    var fee = priceManwon * rate;
    if (cap != null) fee = Math.min(fee, cap);
    return fee;
  }

  function fmt(n) {
    return Math.round(n).toLocaleString('ko-KR') + '만원';
  }

  // null = 입력 없음, true/false = 토허제 목록(구 전역 또는 추가 동) 매치 여부
  function checkLandPermitZone(input) {
    if (!input) return null;
    var trimmed = input.trim();
    if (!trimmed) return null;
    var guHit = LAND_PERMIT_GU.some(function (gu) { return trimmed.indexOf(gu) !== -1; });
    var dongHit = LAND_PERMIT_EXTRA_DONG.some(function (d) { return trimmed.indexOf(d) !== -1; });
    return guHit || dongHit;
  }

  document.getElementById('hb-asof').textContent = SNAPSHOT_LABEL;

  document.getElementById('hb-dong').addEventListener('input', function () {
    var result = checkLandPermitZone(this.value);
    var el = document.getElementById('hb-dong-result');
    if (result === null) { el.textContent = ''; return; }
    el.textContent = result
      ? '⚠ 토허제 목록(스냅샷)에 걸리는 지역입니다.'
      : '목록(스냅샷)에는 없습니다 — 신규 지정 여부는 별도 확인이 필요합니다.';
  });

  document.getElementById('hb-calc').addEventListener('click', function () {
    var regionKey = document.getElementById('hb-region').value;
    var region = REGION_TIERS[regionKey];
    var firstTime = document.getElementById('hb-first-time').checked;
    var ordinaryBuyer = document.getElementById('hb-ordinary').checked;
    var multiHome = document.getElementById('hb-multi-home').checked;
    var income = parseFloat(document.getElementById('hb-income').value) || 0;
    var existingPay = parseFloat(document.getElementById('hb-existing-pay').value) || 0;
    var price = parseFloat(document.getElementById('hb-price').value) || 0;
    var rate = parseFloat(document.getElementById('hb-rate').value) || 0;
    var years = parseInt(document.getElementById('hb-years').value, 10) || 30;
    var etc = ETC_COST_ESTIMATE;
    var dong = document.getElementById('hb-dong').value;

    // LTV 결정: 다주택자는 수도권·규제지역에서 신규 주담대 LTV 0% (6·27 대책)
    var ltvRatio;
    var multiHomeBlocked = multiHome && region.metroCap;
    if (multiHomeBlocked) {
      ltvRatio = 0;
    } else if (regionKey === 'regulated' && firstTime && ordinaryBuyer) {
      ltvRatio = LTV_ORDINARY_BUYER; // 규제지역 생애최초 + 서민·실수요자 60%
    } else {
      ltvRatio = firstTime ? region.ltvFirst : region.ltv;
    }

    var ltvLimit = price * ltvRatio;
    var metroCapApplied = region.metroCap && ltvLimit > METRO_LOAN_CAP;
    if (region.metroCap) {
      ltvLimit = Math.min(ltvLimit, METRO_LOAN_CAP);
    }

    // DSR 한도는 스트레스 금리(가산)를 더한 '심사용 금리'로 계산한다 (실제 상환액과는 다른 금리).
    var stressRate = region.stressRate;
    var dsrCalcRate = rate + stressRate;
    var annualDsrAllowed = income * DSR_LIMIT - existingPay * 12;
    var dsrLimit = maxPrincipalFromMonthlyPayment(Math.max(annualDsrAllowed, 0) / 12, dsrCalcRate, years);

    var finalLoan = Math.min(ltvLimit, dsrLimit, price);
    finalLoan = Math.max(finalLoan, 0);
    var bindingFactor = finalLoan === 0 ? '—'
      : (ltvLimit <= dsrLimit ? 'LTV' : 'DSR');

    var equityNeeded = Math.max(price - finalLoan, 0);
    var taxRate = acquisitionTaxRate(price);
    var acquisitionTax = price * taxRate;
    var localEduTax = acquisitionTax * 0.1;
    var broker = brokerFee(price);
    var extraCosts = acquisitionTax + localEduTax + broker + etc;
    var totalCashNeeded = equityNeeded + extraCosts;
    var monthlyPay = monthlyPayment(finalLoan, rate, years); // 실제 월 상환액은 계약금리 기준

    var isLandPermitZone = checkLandPermitZone(dong);

    var html = '';
    html += '<h4>규제 요약</h4>';
    html += '<div class="hb-row"><span>적용 지역</span><span>' + region.label + (firstTime ? ' · 생애최초' : '') + '</span></div>';
    html += '<div class="hb-row"><span>적용 LTV<span class="hb-tip" tabindex="0" data-tip="주택담보대출비율(Loan To Value)의 줄임말로, 집값 대비 대출 가능한 비율입니다. 예: LTV 40%면 8억원 집은 최대 3.2억원까지 대출됩니다.">?</span></span><span>' + Math.round(ltvRatio * 100) + '%</span></div>';
    if (multiHomeBlocked) {
      html += '<div class="hb-warn">⚠ 수도권·규제지역에서 2주택 이상 보유자는 추가 주택구입 목적 주담대가 제한됩니다(LTV 0%, 6·27 대책).</div>';
    }
    if (metroCapApplied) {
      html += '<div class="hb-row"><span>대출 상한(6억원) 적용</span><span>' + fmt(METRO_LOAN_CAP) + '</span></div>';
    }
    if (isLandPermitZone) {
      html += '<div class="hb-warn">⚠ 입력한 지역은 토지거래허가구역 목록(스냅샷, 2025.9.17 재지정분, ~2026.12.31 등)에 걸립니다. 허가 후 2년 실거주 의무 등 추가 제약이 있어 별도 확인이 필요합니다.</div>';
    }

    html += '<h4>대출 가능액</h4>';
    html += '<div class="hb-row"><span>LTV 기준 한도</span><span>' + fmt(ltvLimit) + '</span></div>';
    html += '<div class="hb-row"><span>DSR 기준 한도<span class="hb-tip" tabindex="0" data-tip="DSR(총부채원리금상환비율)은 연소득 대비 모든 대출의 연간 원리금 상환액 비율입니다. 한도를 계산할 때는 실제 금리보다 높은 가상의 스트레스 금리(이번 계산엔 +' + stressRate.toFixed(2) + '%p)를 더해 더 보수적으로 잡고, 실제로 내는 월 상환액은 이 가상 금리가 아니라 계약 금리로 계산합니다.">?</span></span><span>' + fmt(dsrLimit) + '</span></div>';
    html += '<div class="hb-row hb-total"><span>최종 대출 가능액 (' + bindingFactor + ' 기준)</span><span>' + fmt(finalLoan) + '</span></div>';

    html += '<h4>부대비용</h4>';
    html += '<div class="hb-row"><span>취득세 (' + (taxRate * 100).toFixed(1) + '%)</span><span>' + fmt(acquisitionTax) + '</span></div>';
    html += '<div class="hb-row"><span>지방교육세<span class="hb-tip" tabindex="0" data-tip="취득세를 낼 때 함께 부과되는 세금으로, 보통 취득세액의 10%입니다.">?</span></span><span>' + fmt(localEduTax) + '</span></div>';
    html += '<div class="hb-row"><span>중개수수료<span class="hb-tip" tabindex="0" data-tip="공인중개사에게 지급하는 수수료의 법정 최고 한도입니다. 실제 수수료는 이 범위 안에서 중개사와 협의해 정해집니다.">?</span></span><span>' + fmt(broker) + '</span></div>';
    html += '<div class="hb-row"><span>기타 부대비용 (추정)</span><span>' + fmt(etc) + '</span></div>';

    html += '<h4>필요 현금</h4>';
    html += '<div class="hb-row"><span>자기자본 필요액 (공시가격 − 대출)</span><span>' + fmt(equityNeeded) + '</span></div>';
    html += '<div class="hb-row hb-total"><span>총 필요 현금</span><span>' + fmt(totalCashNeeded) + '</span></div>';

    html += '<h4>월 상환액</h4>';
    html += '<div class="hb-row hb-total"><span>원리금균등 월 상환액<span class="hb-tip" tabindex="0" data-tip="매달 갚는 금액(원금+이자)이 상환 기간 내내 똑같은 방식입니다. 초반엔 이자 비중이 크고 후반으로 갈수록 원금 비중이 커집니다.">?</span></span><span>' + fmt(monthlyPay) + '</span></div>';
    html += '<p class="hb-note">월 상환액은 입력한 실제 계약금리(연 ' + rate + '%) 기준이고, DSR 한도 계산에만 스트레스 금리를 가산했습니다. 기존 대출 월 상환액(' + fmt(existingPay) + ')은 포함하지 않은 신규 대출분만의 금액입니다.</p>';

    document.getElementById('hb-result').innerHTML = html;
  });
})();
</script>

## 참고 자료

2025년 6월부터 2026년 11월까지 나온 대출 규제 변경 내용을 반영하면서 참고한 자료다. 각 링크 앞에 그 글의 게시일자를 적었다. 날짜가 최신이라고 해서 항상 더 정확한 건 아니니(특히 블로그성 글은 수치가 서로 다르기도 했다), 실제 적용 전엔 공식 발표·취급 은행으로 재확인한다.

- [2026-11-03 · SBS Biz — 김포·구리·하남·의정부 그린벨트 324㎢ 토지거래허가구역 해제](https://biz.sbs.co.kr/amp/article/20000344013)
- [2026-08-13 · 더체크 — 2026년 가계대출 총량 목표 1.5%→3% 확대](https://thecheck.co.kr/2026-household-loan-growth-target-3-percent/)
- [2026-06-30 · 아시아경제(영문) — 지방 주담대 2단계 스트레스 DSR 연말까지 유지](https://view.asiae.co.kr/en/article/2026063015591295914)
- [2025-10 · 뱅크몰 — 2025년 생애최초 주택구입자금대출 조건·한도 사례](https://weolbu.com/community/3327392/2025-%EC%83%9D%EC%95%A0%EC%B5%9C%EC%B4%88%EC%A3%BC%ED%83%9D%EC%9E%90%EA%B8%88%EB%8C%80%EC%B6%9C-%EC%A1%B0%EA%B1%B4-%ED%95%9C%EB%8F%84-%EC%82%AC%EB%A1%80-%EC%9E%90%EA%B2%A9-%EC%B2%B4%ED%81%AC%EB%A6%AC%EC%8A%A4%ED%8A%B8%EA%B9%8C%EC%A7%80)
- [2025-09-17 · 뉴시스 — 강남3구·용산구 토지거래허가구역 1년 3개월 재지정](https://mobile.newsis.com/view/NISX20250917_0003333383)
- [2025-07-06 · 한국경제 — 수도권 6억 초과 주담대 금지](https://www.hankyung.com/article/2025070609611)
- [2025-07-01(시행) · KB — 스트레스 DSR 3단계 시행, 대출 한도 얼만큼 줄었을까?](https://kbthink.com/loan/borrow-guide/stressdsr.html)
- [2025-06-27 · KB — 6.27 가계부채 관리 방안 발표](https://kbthink.com/loan-guide/627-regulation.html)

