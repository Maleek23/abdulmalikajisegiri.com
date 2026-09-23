/* Cost-aware threshold widget — recomputes the article's expected-cost sweep
   live in the browser. Synthetic setup from the article (seed 7): n = 20000,
   y = 8x + N(0,1), score = y + N(0,2.5), risk = logistic((score-mean)/2),
   high-risk = top quintile of y; 91 thresholds in [0.05, 0.95].
   Cost(t) = C_FN * P(miss at t) + C_FP * P(false alarm at t).
   The slider varies the C_FN:C_FP ratio; everything is computed, nothing is
   hardcoded. Illustrative only — real costs come from the clinical workflow. */
(function () {
  'use strict';
  var root = document.getElementById('cost-threshold-widget');
  if (!root) return;

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function makeNormal(rand) {
    var spare = null;
    return function () {
      if (spare !== null) { var v = spare; spare = null; return v; }
      var u = 0, v = 0, s = 0;
      do {
        u = rand() * 2 - 1; v = rand() * 2 - 1; s = u * u + v * v;
      } while (s >= 1 || s === 0);
      var m = Math.sqrt(-2 * Math.log(s) / s);
      spare = v * m;
      return u * m;
    };
  }

  var rand = mulberry32(7);
  var gauss = makeNormal(rand);
  var N = 20000, i;
  var y = new Float64Array(N);
  var meanY = 0;
  for (i = 0; i < N; i++) { y[i] = 8 * rand() + gauss(); meanY += y[i]; }
  meanY /= N;
  var risk = new Float64Array(N);
  for (i = 0; i < N; i++) {
    var sc = y[i] + 2.5 * gauss();
    risk[i] = 1 / (1 + Math.exp(-(sc - meanY) / 2));
  }
  var sorted = Array.prototype.slice.call(y).sort(function (a, b) { return a - b; });
  var q80 = sorted[Math.floor(0.8 * N)];
  var high = new Uint8Array(N);
  for (i = 0; i < N; i++) high[i] = y[i] > q80 ? 1 : 0;

  var NT = 91;
  var thresholds = new Float64Array(NT);
  for (var ti = 0; ti < NT; ti++) thresholds[ti] = 0.05 + ti * 0.01;

  // P(miss) and P(false alarm) per threshold — independent of the cost ratio.
  // Also keep raw counts so the confusion matrix at t* is exact, not rounded.
  var pMiss = new Float64Array(NT), pFA = new Float64Array(NT);
  var cntFN = new Float64Array(NT), cntFP = new Float64Array(NT);
  var nHigh = 0;
  for (i = 0; i < N; i++) nHigh += high[i];
  for (ti = 0; ti < NT; ti++) {
    var t = thresholds[ti], fn = 0, fp = 0;
    for (i = 0; i < N; i++) {
      if (risk[i] >= t) { if (!high[i]) fp++; }
      else if (high[i]) fn++;
    }
    cntFN[ti] = fn; cntFP[ti] = fp;
    pMiss[ti] = fn / N;
    pFA[ti] = fp / N;
  }

  var canvas = root.querySelector('canvas');
  var ctx = canvas.getContext('2d');
  var slider = root.querySelector('[data-ratio]');
  var ratioLabel = root.querySelector('[data-ratio-label]');
  var readout = root.querySelector('[data-readout]');
  var cmBox = root.querySelector('[data-cm]');
  var costbarBox = root.querySelector('[data-costbar]');
  var curRatio = parseInt(slider.value, 10) || 10;

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  var MONO = '10px "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

  function compute(ratio) {
    var best = 0, bestC = Infinity, maxC = 0;
    var costs = new Float64Array(NT);
    for (var k = 0; k < NT; k++) {
      var c = ratio * pMiss[k] + pFA[k];
      costs[k] = c;
      if (c < bestC) { bestC = c; best = k; }
      if (c > maxC) maxC = c;
    }
    return { costs: costs, best: best, tStar: thresholds[best], bestC: bestC, c50: costs[45], maxC: maxC };
  }

  function draw(ratio) {
    var res = compute(ratio);
    var dpr = window.devicePixelRatio || 1;
    var W = canvas.clientWidth, Hh = canvas.clientHeight;
    if (!W || !Hh) return;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(Hh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var ink = cssVar('--ink') || '#17150f';
    var muted = cssVar('--muted') || '#6f6c60';
    var line = cssVar('--line') || '#dcd7c6';
    var green = cssVar('--green') || '#1c6b4a';
    var greenDeep = cssVar('--green-deep') || '#14563a';
    var paper = cssVar('--paper') || '#f6f5f0';

    var mL = 52, mR = 12, mT = 26, mB = 34;
    var pw = W - mL - mR, ph = Hh - mT - mB;
    var yMax = res.maxC * 1.06;
    function X(tv) { return mL + (tv - 0.05) / 0.90 * pw; }
    function Y(c) { return mT + (1 - c / yMax) * ph; }

    ctx.clearRect(0, 0, W, Hh);
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, W, Hh);
    ctx.font = MONO;

    // y grid
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (var g = 0; g <= 4; g++) {
      var cv = yMax * g / 4, yy = Y(cv);
      ctx.strokeStyle = line; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(mL, yy); ctx.lineTo(W - mR, yy); ctx.stroke();
      ctx.fillStyle = muted; ctx.fillText(cv.toFixed(2), mL - 7, yy);
    }
    // x ticks
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    [0.1, 0.3, 0.5, 0.7, 0.9].forEach(function (tv) {
      ctx.fillStyle = muted;
      ctx.fillText(tv.toFixed(1), X(tv), Hh - mB + 8);
    });
    ctx.textAlign = 'left';
    ctx.fillText('threshold t', 6, Hh - mB + 8);
    ctx.fillText('expected cost', 6, 6);

    // expected-cost curve
    ctx.beginPath();
    for (var k = 0; k < NT; k++) {
      var x = X(thresholds[k]), y = Y(res.costs[k]);
      if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.stroke();

    // naive t = 0.5 marker
    var x50 = X(0.5);
    ctx.strokeStyle = muted; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(x50, mT); ctx.lineTo(x50, mT + ph); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = muted;
    ctx.beginPath(); ctx.arc(x50, Y(res.c50), 4, 0, 6.3); ctx.fill();
    ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.fillText('naive 0.50', x50 - 6, mT + 2);

    // cost-optimal t* marker
    var xs = X(res.tStar);
    ctx.strokeStyle = green; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(xs, mT); ctx.lineTo(xs, mT + ph); ctx.stroke();
    ctx.fillStyle = greenDeep;
    ctx.beginPath(); ctx.arc(xs, Y(res.bestC), 5, 0, 6.3); ctx.fill();
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('t* ' + res.tStar.toFixed(2), xs + 7, mT + 2);

    // readouts
    var save = res.c50 > 0 ? (res.c50 - res.bestC) / res.c50 * 100 : 0;
    ratioLabel.textContent = ratio + ' : 1';
    readout.innerHTML =
      'C_FN : C_FP = <strong>' + ratio + ' : 1</strong>' +
      ' &middot; t* = <strong>' + res.tStar.toFixed(2) + '</strong>' +
      ' &middot; E[cost] at t=0.50: <strong>' + res.c50.toFixed(3) + '</strong>' +
      ' &middot; at t*: <strong>' + res.bestC.toFixed(3) + '</strong>' +
      ' (' + save.toFixed(1) + '% lower)';

    drawCM(ratio, res);
    drawCostbar(ratio, res);
  }

  // Confusion matrix at t* (raw counts — exact, not rounded).
  function drawCM(ratio, res) {
    if (!cmBox) return;
    var k = res.best;
    var fn = cntFN[k], fp = cntFP[k];
    var tp = nHigh - fn, tn = (N - nHigh) - fp;
    function pct(c) { return (100 * c / N).toFixed(1) + '%'; }
    cmBox.innerHTML =
      '<p class="widget-subhead">Confusion matrix at t* = ' + res.tStar.toFixed(2) + ' <span>(n = ' +
      N.toLocaleString('en-US') + ')</span></p>' +
      '<table class="widget-cm-table" aria-label="Confusion matrix at the cost-optimal threshold">' +
      '<thead><tr><th></th><th scope="col">Flagged high-risk</th><th scope="col">Not flagged</th></tr></thead>' +
      '<tbody>' +
      '<tr><th scope="row">Actually high-risk</th>' +
      '<td class="cm-tp"><strong>' + tp.toLocaleString('en-US') + '</strong><span>TP &middot; ' + pct(tp) + '</span></td>' +
      '<td class="cm-fn"><strong>' + fn.toLocaleString('en-US') + '</strong><span>miss &middot; ' + pct(fn) + '</span></td></tr>' +
      '<tr><th scope="row">Actually low-risk</th>' +
      '<td class="cm-fp"><strong>' + fp.toLocaleString('en-US') + '</strong><span>false alarm &middot; ' + pct(fp) + '</span></td>' +
      '<td class="cm-tn"><strong>' + tn.toLocaleString('en-US') + '</strong><span>TN &middot; ' + pct(tn) + '</span></td></tr>' +
      '</tbody></table>';
  }

  // Cost breakdown: how much of E[cost] at t* comes from misses vs false alarms.
  function drawCostbar(ratio, res) {
    if (!costbarBox) return;
    var k = res.best;
    var missC = ratio * pMiss[k], faC = pFA[k], total = missC + faC;
    var missPct = total > 0 ? 100 * missC / total : 0;
    var faPct = total > 0 ? 100 * faC / total : 0;
    costbarBox.innerHTML =
      '<p class="widget-subhead">Where the expected cost goes at t* <span>(C<sub>FN</sub> : C<sub>FP</sub> = ' +
      ratio + ' : 1)</span></p>' +
      '<div class="widget-costbar" role="img" aria-label="Cost breakdown: ' +
      missPct.toFixed(1) + ' percent from misses, ' + faPct.toFixed(1) + ' percent from false alarms">' +
      '<div class="costbar-miss" style="width:' + missPct.toFixed(2) + '%"></div>' +
      '<div class="costbar-fa" style="width:' + faPct.toFixed(2) + '%"></div>' +
      '</div>' +
      '<p class="widget-costbar-legend"><span class="sw sw-miss"></span>misses: <strong>' +
      missC.toFixed(3) + '</strong> (' + missPct.toFixed(1) + '%)' +
      ' &nbsp;&middot;&nbsp; <span class="sw sw-fa"></span>false alarms: <strong>' +
      faC.toFixed(3) + '</strong> (' + faPct.toFixed(1) + '%)</p>';
  }

  slider.addEventListener('input', function () {
    curRatio = parseInt(slider.value, 10);
    draw(curRatio);
  });

  var rT = null;
  window.addEventListener('resize', function () {
    clearTimeout(rT);
    rT = setTimeout(function () { draw(curRatio); }, 120);
  });
  if (window.MutationObserver) {
    new MutationObserver(function () { draw(curRatio); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }

  draw(curRatio);
})();
