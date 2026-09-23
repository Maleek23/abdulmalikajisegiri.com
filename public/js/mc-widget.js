/* Monte Carlo widget v2 — the article's chip-stack survival experiment, live in
   the browser, now with adjustable parameters (win probability, starting
   chips, hands per trial). Top panel: running survival-probability estimate
   converging to the exact dynamic-programming answer (recomputed live for the
   current parameters). Bottom panel: histogram of final chip stacks across
   trials, with the simulated mean and the untruncated-walk expected value —
   the gap between them is the ruin drag. Seed 2026, reproducible.
   Illustrative only. */
(function () {
  'use strict';
  var root = document.getElementById('mc-widget');
  if (!root) return;

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var REDUCED = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Exact survival probability via dynamic programming, for current params.
  function dpExact(S0, H, P) {
    var SMAX = S0 + H;
    var V = new Float64Array(SMAX + 1);
    for (var s = 1; s <= SMAX; s++) V[s] = 1.0;
    for (var t = 1; t <= H; t++) {
      var Vn = new Float64Array(SMAX + 1);
      for (var s2 = 1; s2 <= SMAX; s2++) {
        var up = s2 + 1 <= SMAX ? s2 + 1 : SMAX;
        var dn = s2 - 1 >= 0 ? s2 - 1 : 0;
        Vn[s2] = P * V[up] + (1 - P) * V[dn];
      }
      V = Vn;
    }
    return V[S0];
  }

  var plotCanvas = root.querySelector('[data-plot]');
  var histCanvas = root.querySelector('[data-hist]');
  var pctx = plotCanvas.getContext('2d');
  var hctx = histCanvas.getContext('2d');
  var btn = root.querySelector('[data-run]');
  var sel = root.querySelector('[data-trials]');
  var pSlider = root.querySelector('[data-p]');
  var chipsSlider = root.querySelector('[data-chips]');
  var handsSlider = root.querySelector('[data-hands]');
  var pLabel = root.querySelector('[data-p-label]');
  var chipsLabel = root.querySelector('[data-chips-label]');
  var handsLabel = root.querySelector('[data-hands-label]');
  var readout = root.querySelector('[data-readout]');
  var histReadout = root.querySelector('[data-hist-readout]');

  var P = parseFloat(pSlider.value);
  var S0 = parseInt(chipsSlider.value, 10);
  var H = parseInt(handsSlider.value, 10);
  var N = parseInt(sel.value, 10);
  var EXACT = dpExact(S0, H, P);

  var lastPoints = [];
  var lastHist = null; // {counts: Float64Array, maxStack, mean, ruined, done}

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  var MONO = '10px "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

  function setupCanvas(canvas, ctx) {
    var dpr = window.devicePixelRatio || 1;
    var W = canvas.clientWidth, Hh = canvas.clientHeight;
    if (!W || !Hh) return null;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(Hh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, Hh);
    ctx.fillStyle = cssVar('--paper') || '#f6f5f0';
    ctx.fillRect(0, 0, W, Hh);
    ctx.font = MONO;
    return {
      W: W, Hh: Hh,
      ink: cssVar('--ink') || '#17150f',
      muted: cssVar('--muted') || '#6f6c60',
      line: cssVar('--line') || '#dcd7c6',
      green: cssVar('--green') || '#1c6b4a',
      greenDeep: cssVar('--green-deep') || '#14563a',
      red: cssVar('--red') || '#a83c2a'
    };
  }

  function drawPlot(points) {
    var g = setupCanvas(plotCanvas, pctx);
    if (!g) return;
    var W = g.W, Hh = g.Hh;
    var mL = 52, mR = 12, mT = 14, mB = 32;
    var pw = W - mL - mR, ph = Hh - mT - mB;

    var yLo = Math.max(0, EXACT - 0.08), yHi = Math.min(1, EXACT + 0.08);
    if (yHi - yLo < 0.04) { yLo = Math.max(0, yLo - 0.02); yHi = Math.min(1, yHi + 0.02); }
    var x0 = Math.log10(100), x1 = Math.log10(Math.max(N, 101));
    function X(n) { return mL + (Math.log10(Math.max(n, 100)) - x0) / (x1 - x0) * pw; }
    function Y(v) { return mT + (1 - (v - yLo) / (yHi - yLo)) * ph; }

    pctx.textAlign = 'right'; pctx.textBaseline = 'middle';
    for (var gi = 0; gi <= 4; gi++) {
      var tv = yLo + (yHi - yLo) * gi / 4;
      var y = Y(tv);
      pctx.strokeStyle = g.line; pctx.lineWidth = 1;
      pctx.beginPath(); pctx.moveTo(mL, y); pctx.lineTo(W - mR, y); pctx.stroke();
      pctx.fillStyle = g.muted; pctx.fillText(tv.toFixed(2), mL - 7, y);
    }
    pctx.textAlign = 'center'; pctx.textBaseline = 'top';
    [[100, '100'], [1000, '1k'], [10000, '10k'], [100000, '100k']].forEach(function (xl) {
      if (xl[0] > N) return;
      pctx.fillStyle = g.muted;
      pctx.fillText(xl[1], X(xl[0]), Hh - mB + 8);
    });
    pctx.textAlign = 'left';
    pctx.fillStyle = g.muted;
    pctx.fillText('trials', 6, Hh - mB + 8);
    pctx.fillText('survival probability', 6, 6);

    var ey = Y(EXACT);
    pctx.strokeStyle = g.ink; pctx.lineWidth = 1.5; pctx.setLineDash([6, 4]);
    pctx.beginPath(); pctx.moveTo(mL, ey); pctx.lineTo(W - mR, ey); pctx.stroke();
    pctx.setLineDash([]);
    pctx.fillStyle = g.ink; pctx.textAlign = 'left'; pctx.textBaseline = 'bottom';
    pctx.fillText('exact (DP) ' + EXACT.toFixed(4), mL + 6, ey - 4);

    if (points.length === 1) {
      pctx.fillStyle = g.green;
      pctx.beginPath(); pctx.arc(X(points[0].n), Y(points[0].p), 3.5, 0, 6.3); pctx.fill();
    } else if (points.length > 1) {
      pctx.beginPath();
      points.forEach(function (pt, i) {
        var x = X(pt.n), y = Y(Math.min(yHi, Math.max(yLo, pt.p + 1.96 * pt.se)));
        if (i === 0) pctx.moveTo(x, y); else pctx.lineTo(x, y);
      });
      for (var i = points.length - 1; i >= 0; i--) {
        pctx.lineTo(X(points[i].n),
          Y(Math.min(yHi, Math.max(yLo, points[i].p - 1.96 * points[i].se))));
      }
      pctx.closePath();
      pctx.fillStyle = 'rgba(28,107,74,0.16)';
      pctx.fill();
      pctx.beginPath();
      points.forEach(function (pt, j) {
        var x = X(pt.n), y = Y(Math.min(yHi, Math.max(yLo, pt.p)));
        if (j === 0) pctx.moveTo(x, y); else pctx.lineTo(x, y);
      });
      pctx.strokeStyle = g.green; pctx.lineWidth = 2; pctx.stroke();
    }
  }

  function drawHist(hist) {
    var g = setupCanvas(histCanvas, hctx);
    if (!g) return;
    var W = g.W, Hh = g.Hh;
    var mL = 52, mR = 12, mT = 14, mB = 32;
    var pw = W - mL - mR, ph = Hh - mT - mB;
    var maxStack = S0 + H;

    function X(s) { return mL + s / maxStack * pw; }
    var maxC = 1;
    if (hist) {
      for (var s = 0; s <= maxStack; s++) if (hist.counts[s] > maxC) maxC = hist.counts[s];
    }
    function Y(c) { return mT + (1 - c / (maxC * 1.08)) * ph; }

    hctx.textAlign = 'right'; hctx.textBaseline = 'middle';
    for (var gi = 0; gi <= 3; gi++) {
      var cv = maxC * 1.08 * gi / 3, y = Y(cv);
      hctx.strokeStyle = g.line; hctx.lineWidth = 1;
      hctx.beginPath(); hctx.moveTo(mL, y); hctx.lineTo(W - mR, y); hctx.stroke();
      hctx.fillStyle = g.muted; hctx.fillText(String(Math.round(cv)), mL - 7, y);
    }
    hctx.textAlign = 'center'; hctx.textBaseline = 'top';
    hctx.fillStyle = g.muted;
    hctx.fillText('0', X(0), Hh - mB + 8);
    hctx.fillText(String(S0), X(S0), Hh - mB + 8);
    hctx.fillText(String(maxStack), X(maxStack), Hh - mB + 8);
    hctx.textAlign = 'left';
    hctx.fillText('final stack (chips)', 6, Hh - mB + 8);
    hctx.fillText('trials ending at each stack', 6, 6);

    if (hist && hist.done > 0) {
      var bw = pw / (maxStack + 1);
      hctx.fillStyle = 'rgba(28,107,74,0.55)';
      for (var s2 = 0; s2 <= maxStack; s2++) {
        var c = hist.counts[s2];
        if (c <= 0) continue;
        hctx.fillRect(X(s2), Y(c), Math.max(1, bw - 0.5), mT + ph - Y(c));
      }
      // untruncated-walk expected value (dashed ink)
      var ev = S0 + H * (2 * P - 1);
      var ex = X(Math.max(0, Math.min(maxStack, ev)));
      hctx.strokeStyle = g.ink; hctx.lineWidth = 1.5; hctx.setLineDash([6, 4]);
      hctx.beginPath(); hctx.moveTo(ex, mT); hctx.lineTo(ex, mT + ph); hctx.stroke();
      hctx.setLineDash([]);
      hctx.fillStyle = g.ink; hctx.textAlign = 'left'; hctx.textBaseline = 'top';
      hctx.fillText('EV (no ruin) ' + ev.toFixed(1), Math.min(ex + 5, W - mR - 118), mT + 2);
      // simulated mean (solid green)
      var mx = X(Math.max(0, Math.min(maxStack, hist.mean)));
      hctx.strokeStyle = g.greenDeep; hctx.lineWidth = 2;
      hctx.beginPath(); hctx.moveTo(mx, mT); hctx.lineTo(mx, mT + ph); hctx.stroke();
      hctx.fillStyle = g.greenDeep; hctx.textAlign = 'right';
      hctx.fillText('sim mean ' + hist.mean.toFixed(1), Math.max(mx - 5, mL + 92), mT + 2);
    }
  }

  function updateReadout(done, p, se) {
    readout.innerHTML =
      'trials <strong>' + done.toLocaleString('en-US') + ' / ' + N.toLocaleString('en-US') + '</strong>' +
      ' &middot; estimate <strong>' + p.toFixed(4) + '</strong>' +
      ' &middot; 95% CI [' + (p - 1.96 * se).toFixed(4) + ', ' + (p + 1.96 * se).toFixed(4) + ']' +
      ' &middot; exact ' + EXACT.toFixed(4);
  }

  function updateHistReadout(hist) {
    if (!hist || hist.done === 0) {
      histReadout.textContent = 'Run the simulation to build the final-stack distribution.';
      return;
    }
    var ev = S0 + H * (2 * P - 1);
    histReadout.innerHTML =
      'mean final stack <strong>' + hist.mean.toFixed(2) + '</strong>' +
      ' &middot; untruncated EV <strong>' + ev.toFixed(2) + '</strong>' +
      ' &middot; ruined <strong>' + (100 * hist.ruined / hist.done).toFixed(1) + '%</strong>' +
      ' of trials — the gap between sim mean and EV is the ruin drag.';
  }

  function refreshParams() {
    P = parseFloat(pSlider.value);
    S0 = parseInt(chipsSlider.value, 10);
    H = parseInt(handsSlider.value, 10);
    N = parseInt(sel.value, 10);
    pLabel.textContent = P.toFixed(3).replace(/0$/, '');
    chipsLabel.textContent = String(S0);
    handsLabel.textContent = String(H);
    EXACT = dpExact(S0, H, P);
    lastPoints = [];
    lastHist = null;
    drawPlot([]);
    drawHist(null);
    readout.innerHTML = 'exact (DP) for current parameters: <strong>' + EXACT.toFixed(4) + '</strong> — press \u201cRun simulation\u201d.';
    updateHistReadout(null);
  }

  var running = false;
  function run() {
    if (running) return;
    running = true;
    btn.disabled = true;
    N = parseInt(sel.value, 10);
    lastPoints = [];
    var maxStack = S0 + H;
    var counts = new Float64Array(maxStack + 1);
    var hist = { counts: counts, mean: 0, ruined: 0, done: 0 };
    lastHist = hist;
    var rand = mulberry32(2026);
    var survivors = 0, done = 0, sumFinal = 0;

    function doBatch(count) {
      for (var i = 0; i < count; i++) {
        var s = S0, h;
        for (h = 0; h < H; h++) {
          s += (rand() < P) ? 1 : -1;
          if (s <= 0) { s = 0; break; }
        }
        if (s > 0) survivors++;
        else hist.ruined++;
        if (s > maxStack) s = maxStack;
        counts[s]++;
        sumFinal += s;
      }
      done += count;
      hist.done = done;
      hist.mean = sumFinal / done;
      var p = survivors / done;
      var se = Math.sqrt(p * (1 - p) / done);
      lastPoints.push({ n: done, p: p, se: se });
      drawPlot(lastPoints);
      drawHist(hist);
      updateReadout(done, p, se);
      updateHistReadout(hist);
    }

    if (REDUCED) {
      doBatch(N);
      running = false;
      btn.disabled = false;
      return;
    }
    var batch = Math.max(250, Math.ceil(N / 80));
    readout.textContent = 'running\u2026';
    (function step() {
      doBatch(Math.min(batch, N - done));
      if (done < N) requestAnimationFrame(step);
      else { running = false; btn.disabled = false; }
    })();
  }

  btn.addEventListener('click', run);
  [pSlider, chipsSlider, handsSlider, sel].forEach(function (el) {
    el.addEventListener('input', function () { if (!running) refreshParams(); });
    el.addEventListener('change', function () { if (!running) refreshParams(); });
  });

  var rT = null;
  window.addEventListener('resize', function () {
    clearTimeout(rT);
    rT = setTimeout(function () { drawPlot(lastPoints); drawHist(lastHist); }, 120);
  });
  if (window.MutationObserver) {
    new MutationObserver(function () { drawPlot(lastPoints); drawHist(lastHist); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }

  refreshParams();
})();
