---
title: "연금 절세 시뮬레이터"
excerpt: "연금저축·IRP·ISA에 월 납입액을 어떻게 배분하느냐에 따라 세액공제 환급액과 ISA 비과세 효과가 얼마나 달라지는지 계산해주는 참고용 시뮬레이터."
date: 2026-11-24
tags:
  - 시뮬레이터
  - 연금
header:
  teaser: /assets/img/thumbnail/playground-pension.svg
links:
  - label: "관련 글 보기"
    url: /essay/review/reading/pension-rich-class/
toc: false
author_profile: false
classes: wide
---

[`[독서] 연금 부자 수업 (박곰희)`](/essay/review/reading/pension-rich-class/) 글의 "4개 통장" 구조로 만든 계산기다. 연금저축·IRP는 **세액공제**와 **과세이연**으로, ISA는 **비과세 한도**로 세금을 아낀다. 월 납입액 배분에 따라 얼마를 돌려받고 아끼는지 숫자로 보여준다.

<div class="pt-notice">
  ⚠️ <strong><strong id="pt-asof">-</strong> 기준 확정 법만 반영했다.</strong> 세액공제 한도(600/900만원), 공제율(16.5%/13.2%), ISA 비과세 한도(200/400만원), 사적연금 1,500만원 기준, 종신형 분리과세 3%(2026년 시행 확정).<br><br>
  <strong>2026년 세제개편안</strong>(생산적금융 ISA 신설, 청년 IRP 요건 폐지 등)은 아직 국회 심의 중인 정부안(시행 예정 2027년)이라 반영하지 않았다.<br><br>
  운용수익은 복리로 불어난다고 가정한 추정치이고, 실제 세액은 홈택스·국세청으로 재확인한다.<br>
  최종 업데이트: <strong>2026-11-24</strong> · 참고 자료는 글 하단 참고.
</div>

<div class="pt-wrap">
  <div class="pt-form">
    <h3>입력</h3>

    <label>
      <span class="pt-label-text">총급여 (만원, 연)<span class="pt-tip" tabindex="0" data-tip="5,500만원(종합소득 4,500만원) 이하 16.5%, 초과 13.2% 공제율.">?</span></span>
      <input type="number" id="pt-income" value="5000">
    </label>

    <label class="pt-checkbox">
      <input type="checkbox" id="pt-ordinary">
      ISA 서민형·농어민형 해당
      <span class="pt-tip" tabindex="0" data-tip="총급여 5,000만원 이하면 자동 체크됩니다. 종합소득·농어민 여부는 직접 체크하세요. 비과세 한도가 400만원으로 늘어납니다.">?</span>
    </label>
    <div class="pt-hint-slot"><div class="pt-hint" id="pt-ordinary-hint"></div></div>

    <label>연금저축 월 납입액 (만원, 세액공제용)
      <input type="number" id="pt-savings" value="50">
    </label>

    <label>저축 IRP 월 납입액 (만원)
      <input type="number" id="pt-irp" value="25">
    </label>

    <label>ISA 월 납입액 (만원)
      <input type="number" id="pt-isa" value="125">
    </label>

    <label>
      <span class="pt-label-text">연금저축·IRP 납입 기간 (년)<span class="pt-tip" tabindex="0" data-tip="세액공제 받는 기간. 은퇴 전까지 수십 년이라 ISA 기간과 다릅니다.">?</span></span>
      <input type="number" id="pt-pension-years" value="25">
    </label>

    <label>
      <span class="pt-label-text">ISA 투자 기간 (년)<span class="pt-tip" tabindex="0" data-tip="보통 3년 만기(최장 5년)로 재가입하는 구조라 따로 입력받습니다.">?</span></span>
      <input type="number" id="pt-isa-years" value="3">
    </label>

    <label>
      <span class="pt-label-text">예상 연 수익률 (%, 운용 가정)<span class="pt-tip" tabindex="0" data-tip="ISA·연금저축·IRP 공통 가정치입니다. 실제 수익률은 상품마다 다릅니다.">?</span></span>
      <input type="number" step="0.1" id="pt-return" value="4">
    </label>

    <label class="pt-checkbox">
      <input type="checkbox" id="pt-whole-life">
      연금 수령을 종신형으로 받을 예정
      <span class="pt-tip" tabindex="0" data-tip="종신형은 나이 무관 3% 분리과세. 안 하면 확정기간형(나이별 세율)입니다.">?</span>
    </label>

    <label>연금 수령 시작 나이 (세)
      <input type="number" id="pt-start-age" value="65">
    </label>

    <label>연금 수령 기간 (년, 확정기간형인 경우)
      <input type="number" id="pt-payout-years" value="20">
    </label>

    <button type="button" class="btn btn--primary" id="pt-calc">계산하기</button>
  </div>

  <div class="pt-result" id="pt-result">
    <p class="pt-placeholder">값을 입력하고 계산하기를 눌러보세요.</p>
  </div>
</div>

<div class="pt-warn" style="max-width: 900px; margin: 0.6em auto;">⚠ 결과를 공유하면 총급여·납입액 등 입력한 값이 모두 링크에 담겨 전달됩니다. 공개된 곳에 공유하기 전에 확인하세요.</div>
<div class="result-share">
  <button type="button" class="btn btn--kakao" id="pt-share-kakao">
    <i class="fas fa-fw fa-comment" aria-hidden="true"></i><span> 결과 공유</span>
  </button>
  <button type="button" class="btn btn--inverse" id="pt-share-link">
    <i class="fas fa-fw fa-link" aria-hidden="true"></i><span> 결과 링크</span>
  </button>
</div>

<style>
.pt-notice {
  max-width: 900px; margin: 1.2em auto 1.6em;
  background: #fff3cd; border: 1px solid #ffe69c;
  border-radius: 8px; padding: 0.9em 1.1em; font-size: 0.85em; line-height: 1.6;
}
.pt-wrap { max-width: 900px; margin: 0 auto; display: flex; gap: 2em; flex-wrap: wrap; word-break: keep-all; }
.pt-form { flex: 1 1 320px; min-width: 0; display: flex; flex-direction: column; gap: 0.9em; }
.pt-form h3 { margin: 0 0 0.2em; }
.pt-form label { display: flex; flex-direction: column; gap: 0.3em; font-size: 0.88em; font-weight: 600; }
.pt-form input[type="number"] {
  font-weight: 400; padding: 0.45em 0.6em; border-radius: 6px; border: 1px solid #ccc;
}
.pt-checkbox { flex-direction: row !important; align-items: center; gap: 0.5em !important; }
.pt-checkbox input { width: auto; }
.pt-label-text { display: inline-flex; align-items: center; }
.pt-hint-slot { position: relative; height: 2.8em; margin-top: -0.5em; }
.pt-hint { position: absolute; top: 0; left: 0; right: 0; font-size: 0.78em; color: #52514e; line-height: 1.3em; }
.pt-result {
  flex: 1 1 380px; min-width: 0; background: #f7f7f8; border-radius: 10px; padding: 1.2em 1.4em;
  font-size: 0.92em; line-height: 1.7;
}
.pt-placeholder { color: #888; }
.pt-headline {
  display: flex; justify-content: space-between; align-items: baseline; gap: 1em;
  background: #eaf2fc; border: 1px solid #bcd6f2; border-radius: 8px;
  padding: 0.7em 0.9em; margin-bottom: 1em; font-size: 1em; font-weight: 600; color: #333;
}
.pt-headline strong { font-size: 1.35em; color: #1c5cab; white-space: nowrap; }
.pt-result h4 { margin: 1em 0 0.4em; font-size: 1em; }
.pt-result h4:first-child { margin-top: 0; }
.pt-row { display: flex; justify-content: space-between; align-items: baseline; gap: 1em; }
.pt-row > span:first-child { flex: 1 1 auto; min-width: 0; }
.pt-row > span:last-child { flex: 0 0 auto; white-space: nowrap; text-align: right; }
.pt-row.pt-total { font-weight: 700; font-size: 1.08em; border-top: 1px solid #ddd; margin-top: 0.4em; padding-top: 0.4em; }
.pt-row.pt-grand { font-size: 1.2em; color: #1c5cab; }
.pt-row.pt-tight { font-size: 0.7em; }
.pt-warn { background: #fbe4e1; color: #a9342a; border-radius: 6px; padding: 0.6em 0.8em; margin: 0.6em 0; font-size: 0.85em; }

.pt-tip {
  display: inline-flex; align-items: center; justify-content: center;
  width: 1.15em; height: 1.15em; border-radius: 50%;
  background: #b7bec8; color: #fff; font-size: 0.72em; font-weight: 700;
  margin-left: 0.3em; cursor: help; position: relative; vertical-align: middle;
}
.pt-tip::after {
  content: attr(data-tip);
  position: absolute; bottom: 140%; left: 50%; transform: translateX(-50%);
  background: #333; color: #fff; font-weight: 400; font-size: 0.92em; line-height: 1.5;
  padding: 0.6em 0.8em; border-radius: 8px; width: 240px; text-align: left;
  white-space: normal; opacity: 0; pointer-events: none; transition: opacity 0.15s ease;
  z-index: 20;
}
.pt-tip:hover::after, .pt-tip:focus::after { opacity: 1; }
.pt-paren { font-size: 0.78em; font-weight: 400; }
</style>

<script>
(function () {
  var SNAPSHOT_LABEL = "2025년 세법개정안(2025-12 국회 통과, 2026년 시행) 기준";
  var lastOutput = null;
  var calculated = false;

  var PENSION_SAVINGS_CAP = 600;   // 연금저축 단독 세액공제 한도(만원)
  var PENSION_COMBINED_CAP = 900;  // 연금저축+IRP 합산 세액공제 한도(만원)
  var ISA_TAX_FREE_GENERAL = 200;  // ISA 일반형 비과세 한도(만원)
  var ISA_TAX_FREE_ORDINARY = 400; // ISA 서민형·농어민형 비과세 한도(만원)
  var ISA_SEPARATE_TAX_RATE = 0.099;   // ISA 비과세 한도 초과분 분리과세(지방소득세 포함)
  var GENERAL_ACCOUNT_TAX_RATE = 0.154; // 일반 과세계좌 이자·배당소득세(지방소득세 포함)
  var PRIVATE_PENSION_THRESHOLD = 1500; // 사적연금 종합과세 전환 기준(만원)
  var WHOLE_LIFE_RATE = 0.03; // 종신형 연금계좌 분리과세(2025년 세법개정, 2026년 시행 확정: 4%→3%)

  function acquisitionDeductionRate(income) {
    return income <= 5500 ? 0.165 : 0.132;
  }

  // 나이대별 연금소득세 분리과세율 (확정기간형 기준, 변경 없음)
  function ageBasedRate(age) {
    if (age >= 80) return 0.033;
    if (age >= 70) return 0.044;
    return 0.055;
  }

  // 매달 일정액을 납입하며 복리로 불어나는 적립식 투자의 미래가치(원금+운용수익).
  // "평균 잔존기간"으로 단순 근사하면 3~5년짜리 ISA 주기에는 오차가 작지만(1%대),
  // 수십 년짜리 연금 납입 기간에는 복리 효과를 못 담아내 실제보다 크게 과소평가된다
  // (25년·연 4% 기준 실측 대비 약 30% 과소평가). 그래서 복리 공식으로 통일했다.
  function futureValueOfMonthlyContributions(monthlyAmount, years, annualReturnPct) {
    var n = years * 12;
    if (n <= 0) return 0;
    var r = annualReturnPct / 100 / 12;
    if (r === 0) return monthlyAmount * n;
    return monthlyAmount * (Math.pow(1 + r, n) - 1) / r;
  }

  function fmt(n) {
    return Math.round(n).toLocaleString('ko-KR') + '만원';
  }
  function fmtPct(n) {
    return (n * 100).toFixed(1) + '%';
  }

  // 괄호로 감싼 텍스트만 찾아 작은 글씨(.pt-paren)로 감싼다. 문자열 상태에서 정규식으로
  // 치환하면 data-tip 속성 안의 괄호까지 건드릴 수 있어, 렌더링된 텍스트 노드만 순회한다.
  function wrapParens(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    var n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function (node) {
      if (node.nodeValue.indexOf('(') === -1) return;
      var frag = document.createDocumentFragment();
      node.nodeValue.split(/(\([^()]*\))/g).forEach(function (part) {
        if (/^\(.*\)$/.test(part)) {
          var small = document.createElement('small');
          small.className = 'pt-paren';
          small.textContent = part;
          frag.appendChild(small);
        } else if (part) {
          frag.appendChild(document.createTextNode(part));
        }
      });
      node.parentNode.replaceChild(frag, node);
    });
  }

  document.getElementById('pt-asof').textContent = SNAPSHOT_LABEL;

  var ISA_ORDINARY_INCOME_THRESHOLD = 5000; // 서민형 ISA 총급여 기준(만원). 종합소득금액 3,800만원 기준·농어민 여부는 입력값이 없어 자동 판정 불가.
  var ordinaryManuallySet = false;

  document.getElementById('pt-ordinary').addEventListener('change', function () {
    ordinaryManuallySet = true;
    document.getElementById('pt-ordinary-hint').textContent = '';
  });

  document.getElementById('pt-income').addEventListener('input', function () {
    if (ordinaryManuallySet) return;
    var income = parseFloat(this.value) || 0;
    var checkbox = document.getElementById('pt-ordinary');
    checkbox.checked = income > 0 && income <= ISA_ORDINARY_INCOME_THRESHOLD;
    document.getElementById('pt-ordinary-hint').textContent =
      '총급여 ' + ISA_ORDINARY_INCOME_THRESHOLD.toLocaleString('ko-KR') + '만원 기준 자동 추정. 종합소득·농어민 여부로 다르면 직접 체크/해제.';
  });
  document.getElementById('pt-income').dispatchEvent(new Event('input'));

  function calculate() {
    var income = parseFloat(document.getElementById('pt-income').value) || 0;
    var isOrdinary = document.getElementById('pt-ordinary').checked;
    var savingsMonthly = parseFloat(document.getElementById('pt-savings').value) || 0;
    var irpMonthly = parseFloat(document.getElementById('pt-irp').value) || 0;
    var isaMonthly = parseFloat(document.getElementById('pt-isa').value) || 0;
    var pensionYears = parseFloat(document.getElementById('pt-pension-years').value) || 0;
    var isaYears = parseFloat(document.getElementById('pt-isa-years').value) || 0;
    var annualReturn = parseFloat(document.getElementById('pt-return').value) || 0;
    var isWholeLife = document.getElementById('pt-whole-life').checked;
    var startAge = parseFloat(document.getElementById('pt-start-age').value) || 65;
    var payoutYears = parseFloat(document.getElementById('pt-payout-years').value) || 20;

    // 1. 세액공제 (납입 단계)
    var savingsAnnual = savingsMonthly * 12;
    var irpAnnual = irpMonthly * 12;
    var savingsEligible = Math.min(savingsAnnual, PENSION_SAVINGS_CAP);
    var combinedEligible = Math.min(savingsEligible + irpAnnual, PENSION_COMBINED_CAP);
    var deductionRate = acquisitionDeductionRate(income);
    var annualRefund = combinedEligible * deductionRate;
    var totalRefund = annualRefund * pensionYears;

    // 1-2. 연금저축·IRP 과세이연 효과 (운용 단계) — ISA와 같은 복리 공식으로 운용수익을
    // 추정한다. ISA의 "비과세"와 달리 세금을 영구히 안 내는 게 아니라 수령 시점까지
    // 미루는 것이라, 나중에 "연금 수령 시 참고"의 연금소득세로 일부 돌아온다.
    var accumulatedPrincipal = (savingsAnnual + irpAnnual) * pensionYears;
    var pensionFV = futureValueOfMonthlyContributions(savingsMonthly + irpMonthly, pensionYears, annualReturn);
    var pensionProfit = Math.max(pensionFV - accumulatedPrincipal, 0);
    var pensionGeneralTax = pensionProfit * GENERAL_ACCOUNT_TAX_RATE;

    // 2. ISA 비과세 효과 (운용 단계) — 매월 적립식이 복리로 불어난다고 가정한 추정
    var isaAnnual = isaMonthly * 12;
    var isaPrincipal = isaAnnual * isaYears;
    var isaFV = futureValueOfMonthlyContributions(isaMonthly, isaYears, annualReturn);
    var isaProfit = Math.max(isaFV - isaPrincipal, 0);
    var taxFreeLimit = isOrdinary ? ISA_TAX_FREE_ORDINARY : ISA_TAX_FREE_GENERAL;
    var isaTaxableProfit = Math.max(isaProfit - taxFreeLimit, 0);
    var isaTax = isaTaxableProfit * ISA_SEPARATE_TAX_RATE;
    var generalTax = isaProfit * GENERAL_ACCOUNT_TAX_RATE;
    var isaSaved = generalTax - isaTax;

    // ISA는 만기(isaYears)마다 재가입해서 반복하는 구조라, 연금저축·IRP 납입 기간(pensionYears)
    // 동안 같은 패턴을 몇 번 반복하는지 구해서 누적 절세효과로도 보여준다. 복리효과(이전 만기
    // 자금을 재투자해서 불어나는 것)는 반영하지 않은 단순 반복 가정이다.
    var isaCycles = isaYears > 0 ? Math.floor(pensionYears / isaYears) : 0;
    var isaSavedCumulative = isaSaved * isaCycles;

    // 3. 연금 수령 시 참고 — 납입 원금 + 위에서 추정한 운용수익(pensionProfit) 합산 기준
    var accumulatedTotal = accumulatedPrincipal + pensionProfit;
    var appliedRate = isWholeLife ? WHOLE_LIFE_RATE : ageBasedRate(startAge);
    var payoutAnnual = isWholeLife ? null : accumulatedTotal / Math.max(payoutYears, 1);
    var exceedsThreshold = !isWholeLife && payoutAnnual > PRIVATE_PENSION_THRESHOLD;
    var payoutTax = (!isWholeLife && !exceedsThreshold) ? payoutAnnual * appliedRate : null;

    // 순 과세이연 효과 = 과세이연 효과(일반계좌였다면 미리 냈을 세금) − 수령 기간 전체 동안
    // 낼 연금소득세 총액. 둘이 과세 대상(운용수익만 vs 원금+수익 합산)과 세율이 달라 정확한
    // 1:1 상쇄는 아니지만, 전체 흐름에서 세제 혜택이 어느 정도 남는지 가늠하는 참고용 수치다.
    // 종신형이거나(연 수령액을 모델링하지 않음) 1,500만원 초과(세액을 추정할 수 없음)일 때는
    // 계산할 수 없다.
    var netDeferralBenefit = (!isWholeLife && !exceedsThreshold)
      ? pensionGeneralTax - (payoutTax * payoutYears)
      : null;

    // 4. 총 절세효과 요약 — 세액공제 + ISA 누적 절세효과 + (계산 가능하면) 순 과세이연 효과.
    // 순 과세이연 효과를 뺀 단순 과세이연 효과나 연금소득세 자체는 서로 상쇄되는 성격이라
    // 포함하지 않는다.
    var totalSaved = totalRefund + isaSavedCumulative + (netDeferralBenefit !== null ? netDeferralBenefit : 0);

    var html = '';
    html += '<div class="pt-headline"><span>총 절세효과</span><strong>' + fmt(totalSaved) + '</strong></div>';
    html += '<h4>세액공제 (납입 단계)</h4>';
    html += '<div class="pt-row"><span>연금저축 공제대상액 (연, 600만원 한도)</span><span>' + fmt(savingsEligible) + '</span></div>';
    html += '<div class="pt-row"><span>IRP 포함 합산 공제대상액<span class="pt-tip" tabindex="0" data-tip="연금저축 600만원 + IRP를 더해 최대 900만원까지 공제됩니다.">?</span></span><span>' + fmt(combinedEligible) + '</span></div>';
    html += '<div class="pt-row"><span>적용 공제율 (총급여 ' + fmt(income) + ' 기준)</span><span>' + fmtPct(deductionRate) + '</span></div>';
    html += '<div class="pt-row"><span>연간 환급액</span><span>' + fmt(annualRefund) + '</span></div>';
    html += '<div class="pt-row pt-total"><span>' + pensionYears + '년간 누적 환급액</span><span>' + fmt(totalRefund) + '</span></div>';

    html += '<h4>연금저축·IRP 과세이연 효과 (운용 단계, ' + pensionYears + '년 기준)</h4>';
    html += '<div class="pt-row"><span>납입 원금 (' + pensionYears + '년)</span><span>' + fmt(accumulatedPrincipal) + '</span></div>';
    html += '<div class="pt-row"><span>추정 운용수익 (연 ' + annualReturn + '%)</span><span>' + fmt(pensionProfit) + '</span></div>';
    html += '<div class="pt-row"><span>원금+운용수익 합계</span><span>' + fmt(pensionFV) + '</span></div>';
    html += '<div class="pt-row pt-total"><span>과세이연 효과<span class="pt-tip" tabindex="0" data-tip="운용수익에 대해 일반 과세계좌였다면 냈을 15.4% 세금을 수령 시까지 미루는 효과입니다. ISA처럼 영구 비과세는 아니라 수령 시 연금소득세로 나가지만, 연금소득세율(확정기간형 3.3~5.5%, 종신형 3%)이 15.4%보다 낮아 보통은 미루기만 하는 게 아니라 실제로 덜 냅니다. 정확한 차액은 아래 순 과세이연 효과를 확인하세요.">?</span></span><span>' + fmt(pensionGeneralTax) + '</span></div>';

    html += '<h4>ISA 비과세 효과 (운용 단계, ' + isaYears + '년 만기 1회 기준)</h4>';
    html += '<div class="pt-row"><span>ISA 납입 원금 (' + isaYears + '년)</span><span>' + fmt(isaPrincipal) + '</span></div>';
    html += '<div class="pt-row"><span>추정 운용수익 (연 ' + annualReturn + '%)</span><span>' + fmt(isaProfit) + '</span></div>';
    html += '<div class="pt-row"><span>원금+운용수익 합계</span><span>' + fmt(isaFV) + '</span></div>';
    html += '<div class="pt-row"><span>비과세 한도 (' + (isOrdinary ? '서민형·농어민형' : '일반형') + ')</span><span>' + fmt(taxFreeLimit) + '</span></div>';
    html += '<div class="pt-row"><span>ISA 분리과세 (9.9%, 한도 초과분만)</span><span>' + fmt(isaTax) + '</span></div>';
    html += '<div class="pt-row pt-tight"><span>운용수익에 대해 일반 과세계좌였다면 냈을 세금 (15.4%)</span><span>' + fmt(generalTax) + '</span></div>';
    html += '<div class="pt-row"><span>ISA로 아낀 세금 (1회, ' + isaYears + '년 만기)</span><span>' + fmt(isaSaved) + '</span></div>';
    html += '<div class="pt-row pt-total"><span>누적 절세효과 (' + pensionYears + '년 ÷ ' + isaYears + '년 ≈ ' + isaCycles + '회)<span class="pt-tip" tabindex="0" data-tip="만기마다 재가입해 ' + isaCycles + '번 반복한다고 가정했습니다(복리효과 미반영).">?</span></span><span>' + fmt(isaSavedCumulative) + '</span></div>';

    html += '<h4>연금 수령 시 참고</h4>';
    if (isWholeLife) {
      html += '<div class="pt-row"><span>적용 세율 (종신형, 확정)<span class="pt-tip" tabindex="0" data-tip="실제 연 수령액은 보험사 지급률에 따라 다르고, 모델링하지 않아 순 과세이연 효과는 계산하지 않았습니다.">?</span></span><span>' + fmtPct(WHOLE_LIFE_RATE) + '</span></div>';
    } else {
      html += '<div class="pt-row"><span>추정 연 수령액 (' + payoutYears + '년 수령 기준)<span class="pt-tip" tabindex="0" data-tip="납입 원금과 추정 운용수익을 더한 금액 기준이며, 실제 수령액은 운용 성과에 따라 달라집니다.">?</span></span><span>' + fmt(payoutAnnual) + '</span></div>';
      if (exceedsThreshold) {
        html += '<div class="pt-warn">⚠ 1,500만원을 넘어 ' + startAge + '세 기준 ' + fmtPct(appliedRate) + ' 분리과세 대신 종합과세 또는 16.5% 분리과세를 선택해야 합니다. 실제 세액을 추정할 수 없어 순 과세이연 효과도 계산하지 않았습니다.</div>';
      } else {
        html += '<div class="pt-row"><span>' + startAge + '세 수령 기준 적용 세율</span><span>' + fmtPct(appliedRate) + '</span></div>';
        html += '<div class="pt-row"><span>추정 연금소득세</span><span>' + fmt(payoutTax) + '</span></div>';
        html += '<div class="pt-row pt-total"><span>순 과세이연 효과 (과세이연 효과 − ' + payoutYears + '년 수령세 총액)<span class="pt-tip" tabindex="0" data-tip="과세이연 효과(15.4% 기준)에서 수령 기간 동안 실제로 낸 연금소득세를 뺀 값입니다. 과세 대상(운용수익만 vs 원금+운용수익 전체)과 세율이 달라 정확한 1:1 상쇄는 아닌 참고용 수치입니다. 연 수령액이 1,500만원을 넘으면 종합과세(또는 16.5% 분리과세)로 전환돼 세율이 15.4%보다 높아질 수 있어, 그 경우엔 이 계산을 하지 않습니다.">?</span></span><span>' + fmt(netDeferralBenefit) + '</span></div>';
      }
    }

    html += '<h4>총 절세효과 요약</h4>';
    html += '<div class="pt-row"><span>세액공제 누적액 (' + pensionYears + '년간 납입)</span><span>' + fmt(totalRefund) + '</span></div>';
    html += '<div class="pt-row"><span>ISA 누적 절세효과 (' + isaCycles + '회 반복, 약 ' + pensionYears + '년)</span><span>' + fmt(isaSavedCumulative) + '</span></div>';
    if (netDeferralBenefit !== null) {
      html += '<div class="pt-row"><span>연금저축·IRP 순 과세이연 효과 (수령 ' + payoutYears + '년 포함)</span><span>' + fmt(netDeferralBenefit) + '</span></div>';
    }
    var totalTip = netDeferralBenefit !== null
      ? ('세액공제·ISA는 ' + pensionYears + '년 안팎, 순 과세이연 효과는 그 뒤 수령 ' + payoutYears + '년까지 포함해 기간이 서로 다릅니다.')
      : ((isWholeLife ? '종신형이라 연 수령액을 모델링하지 않아' : '1,500만원 초과로 실제 세액을 추정할 수 없어') + ' 순 과세이연 효과는 이 합계에 포함하지 않았습니다.');
    html += '<div class="pt-row pt-total pt-grand"><span>총 절세효과<span class="pt-tip" tabindex="0" data-tip="' + totalTip + '">?</span></span><span>' + fmt(totalSaved) + '</span></div>';

    lastOutput = { totalRefund: totalRefund, isaSaved: isaSavedCumulative, totalSaved: totalSaved };
    calculated = true;
    var resultEl = document.getElementById('pt-result');
    resultEl.innerHTML = html;
    wrapParens(resultEl);
  }

  document.getElementById('pt-calc').addEventListener('click', calculate);

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
  function getSharePayload() {
    if (!calculated) return null;
    return {
      income: document.getElementById('pt-income').value,
      ordinary: document.getElementById('pt-ordinary').checked,
      savings: document.getElementById('pt-savings').value,
      irp: document.getElementById('pt-irp').value,
      isa: document.getElementById('pt-isa').value,
      pensionYears: document.getElementById('pt-pension-years').value,
      isaYears: document.getElementById('pt-isa-years').value,
      ret: document.getElementById('pt-return').value,
      wholeLife: document.getElementById('pt-whole-life').checked,
      startAge: document.getElementById('pt-start-age').value,
      payoutYears: document.getElementById('pt-payout-years').value
    };
  }
  function applySharedPayload(p) {
    document.getElementById('pt-income').value = p.income;
    ordinaryManuallySet = true;
    document.getElementById('pt-ordinary').checked = !!p.ordinary;
    document.getElementById('pt-ordinary-hint').textContent = '';
    document.getElementById('pt-savings').value = p.savings;
    document.getElementById('pt-irp').value = p.irp;
    document.getElementById('pt-isa').value = p.isa;
    document.getElementById('pt-pension-years').value = p.pensionYears;
    document.getElementById('pt-isa-years').value = p.isaYears;
    document.getElementById('pt-return').value = p.ret;
    document.getElementById('pt-whole-life').checked = !!p.wholeLife;
    document.getElementById('pt-start-age').value = p.startAge;
    document.getElementById('pt-payout-years').value = p.payoutYears;
    calculate();
  }

  document.getElementById('pt-share-kakao').addEventListener('click', function () {
    var payload = getSharePayload();
    if (!payload) { showShareToast('계산하기를 먼저 눌러주세요.'); return; }
    var url = buildResultShareUrl(payload);
    if (!window.Kakao) return;
    if (!Kakao.isInitialized()) Kakao.init('{{ site.kakao.js_key }}');
    Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: '연금 절세 시뮬레이터',
        description: '세액공제 누적 ' + fmt(lastOutput.totalRefund) + ', ISA 절세 ' + fmt(lastOutput.isaSaved) + ', 총 절세효과 ' + fmt(lastOutput.totalSaved),
        imageUrl: '{{ page.header.teaser | absolute_url }}',
        link: { mobileWebUrl: url, webUrl: url }
      }
    });
  });

  document.getElementById('pt-share-link').addEventListener('click', function () {
    var payload = getSharePayload();
    if (!payload) { showShareToast('계산하기를 먼저 눌러주세요.'); return; }
    copyResultLink(buildResultShareUrl(payload)).then(function () { showShareToast('복사됨!'); });
  });

  var shared = decodeResultShare();
  if (shared) applySharedPayload(shared);
})();
</script>

## 참고 자료

참고한 연금·ISA 세제 자료다. "2026년 세제개편안"은 아직 국회 심의 중인 정부안이므로 확정 여부는 국세청·기획재정부 공식 발표로 재확인한다.

- [2026-08-07 · 정책브리핑(korea.kr) — 2026년 세제개편안 PART 01: 생산적금융 ISA 신설·일반 ISA 정비 (미확정 정부안)](https://www.korea.kr/news/policyNewsView.do?newsId=148969672)
- [2025-08-29 · KB의 생각 — 2025년 세법 개정안의 연금 세제 개편 방향과 시사점 (종신형 연금 분리과세 4%→3%, 해외펀드 외국납부세액공제)](https://kbthink.com/pension/plan/gw/250829-2.html)
- [2025-07-31 · 뉴시스 — 기재부 '2025년 세제개편안' 발표](https://mobile.newsis.com/view/NISX20250731_0003273798)

그 외 한도·기준 수치(600/900만원, 200/400만원, 1,500만원 등)는 국세청 홈택스·소득세법의 현행 기준이며 변경 사실은 확인되지 않았다. 가입·납입 전에는 홈택스나 취급 금융사에서 최신 기준을 다시 확인한다.
