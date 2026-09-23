/* Gradient-descent playground — the optimization article's double-well
   landscape (f(x) = x^4 - 3x^2 + x), live in the browser. Gradient descent
   with an adjustable learning rate: too small crawls, too large diverges or
   oscillates, just right converges — usually into the *nearest* valley, not
   the deepest. Flip to simulated annealing and watch the Boltzmann rule
   escape the local trap. Minima are located numerically at load (grid +
   Newton refinement); nothing about the landscape is hardcoded beyond the
   formula itself. Click the plot to choose a starting point.
   Illustrative only. */
(function () {
  'use strict';
  var root = document.getElementById('gd-widget');
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
      do { u = rand() * 2 - 1; v = rand() * 2 - 1; s = u * u + v * v; }
      while (s >= 1 || s === 0);
      var m = Math.sqrt(-2 * Math.log(s) / s);
      spare = v * m;
      return u * m;
    };
  }

  var REDUCED = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // The landscape. Everything else is derived from these two functions.
  function f(x) { return x * x * x * x - 3 * x * x + x; }
  function df(x) { return 4 * x * x * x - 6 * x + 1; }

  var XMIN = -2.5, XMAX = 2.5;

  // Locate minima numerically: coarse grid, refine each -/+ sign change of f'
  // with Newton's method on f'.
  function findMinima() {
    var cands = [];
    var n = 2000, prevX = XMIN, prevD = df(XMIN);
    for (var i = 1; i <= n; i++) {
      var x = XMIN + (XMAX - XMIN) * i / n;
      var d = df(x);
      if (prevD < 0 && d >= 0) {
        var r = (prevX + x) / 2;
        for (var k = 0; k < 40; k++) {
          var d2 = 12 * r * r - 6; // f''(r)
          if (Math.abs(d2) < 1e-9) break;
          var step = df(r) / d2;
          r -= step;
          if (Math.abs(step) < 1e-12) break;
        }
        if (r > XMIN && r < XMAX && Math.abs(df(r)) < 1e-6) cands.push(r);
      }
      prevX = x; prevD = d;
    }
    // dedupe
    var mins = [];
    cands.forEach(function (c) {
      if (!mins.some(function (m) { return Math.abs(m - c) < 1e-3; })) mins.push(c);
    });
    mins.sort(function (a, b) { return f(a) - f(b); });
    return mins;
  }
  var minima = findMinima();
  var globalMin = minima.length ? minima[0] : null;

  var canvas = root.querySelector('canvas');
  var ctx = canvas.getContext('2d');
  var methodSel = root.querySelector('[data-method]');
  var lrSlider = root.querySelector('[data-lr]');
  var lrLabel = root.querySelector('[data-lr-label]');
  var startSlider = root.querySelector('[data-start]');
  var startLabel = root.querySelector('[data-start-label]');
  var btn = root.querySelector('[data-run]');
  var readout = root.querySelector('[data-readout]');

  function lr() { return Math.pow(10, parseFloat(lrSlider.value)); }
  function startX() { return parseFloat(startSlider.value); }

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  var MONO = '10px "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

  var lastPath = null; // {xs: [...], verdict, iters}

  function draw(path) {
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
    var red = cssVar('--red') || '#a83c2a';

    var mL = 44, mR = 12, mT = 14, mB = 32;
    var pw = W - mL - mR, ph = Hh - mT - mB;

    // y range from the curve itself
    var yLo = Infinity, yHi = -Infinity;
    for (var i = 0; i <= 400; i++) {
      var v = f(XMIN + (XMAX - XMIN) * i / 400);
      if (v < yLo) yLo = v; if (v > yHi) yHi = v;
    }
    var pad = (yHi - yLo) * 0.12; yLo -= pad; yHi += pad;
    function X(x) { return mL + (x - XMIN) / (XMAX - XMIN) * pw; }
    function Y(v) { return mT + (1 - (v - yLo) / (yHi - yLo)) * ph; }

    ctx.clearRect(0, 0, W, Hh);
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, W, Hh);
    ctx.font = MONO;

    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (var gi = 0; gi <= 4; gi++) {
      var tv = yLo + (yHi - yLo) * gi / 4, y = Y(tv);
      ctx.strokeStyle = line; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(mL, y); ctx.lineTo(W - mR, y); ctx.stroke();
      ctx.fillStyle = muted; ctx.fillText(tv.toFixed(1), mL - 7, y);
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    [-2, -1, 0, 1, 2].forEach(function (xv) {
      ctx.fillStyle = muted; ctx.fillText(String(xv), X(xv), Hh - mB + 8);
    });
    ctx.textAlign = 'left';
    ctx.fillStyle = muted;
    ctx.fillText('x', 6, Hh - mB + 8);
    ctx.fillText('f(x) = x\u2074 \u2212 3x\u00b2 + x', 6, 6);

    // the curve
    ctx.beginPath();
    for (var j = 0; j <= 400; j++) {
      var xx = XMIN + (XMAX - XMIN) * j / 400;
      var px = X(xx), py = Y(f(xx));
      if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.stroke();

    // minima markers
    minima.forEach(function (m, mi) {
      var mx = X(m), my = Y(f(m));
      ctx.fillStyle = mi === 0 ? greenDeep : muted;
      ctx.beginPath(); ctx.arc(mx, my, mi === 0 ? 5 : 3.5, 0, 6.3); ctx.fill();
    });
    ctx.fillStyle = muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('\u25cf global min', 6, 20);

    // start marker (before run)
    if (!path) {
      var sx = X(startX()), sy = Y(f(startX()));
      ctx.strokeStyle = green; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(sx, sy - 10); ctx.lineTo(sx, sy + 10); ctx.stroke();
      ctx.fillStyle = greenDeep; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('start', sx, sy - 12);
      return;
    }

    // path trail
    var xs = path.xs;
    for (var p = 0; p < xs.length; p++) {
      var qx = xs[p];
      if (qx < XMIN - 0.6 || qx > XMAX + 0.6) continue;
      var qy = f(Math.max(XMIN, Math.min(XMAX, qx)));
      var a = 0.25 + 0.75 * p / Math.max(1, xs.length - 1);
      ctx.fillStyle = path.diverged && p === xs.length - 1
        ? red : 'rgba(28,107,74,' + a.toFixed(2) + ')';
      ctx.beginPath(); ctx.arc(X(qx), Y(qy), p === xs.length - 1 ? 5 : 2.4, 0, 6.3); ctx.fill();
    }
  }

  function verdictFor(x, iters, diverged, method) {
    if (diverged) return 'diverged — learning rate far too large; the iterates blew up.';
    if (method === 'gd') {
      for (var i = 0; i < minima.length; i++) {
        if (Math.abs(x - minima[i]) < 0.12) {
          return i === 0
            ? 'converged to the GLOBAL minimum (x \u2248 ' + minima[i].toFixed(2) + ').'
            : 'converged — but trapped in a LOCAL minimum (x \u2248 ' + minima[i].toFixed(2) +
              '), missing the global one at x \u2248 ' + globalMin.toFixed(2) + '. This is the trap.';
        }
      }
      return 'stopped after ' + iters + ' steps without settling — try a larger learning rate.';
    }
    // SA verdict handled inline in finishSA
    return '';
  }

  // --- animation driver: steps the computation in rAF batches ---
  function runAnimated(compute, onDone) {
    // compute: object {step() -> bool continue, snapshot() -> path}
    btn.disabled = true;
    (function tick() {
      var cont = true;
      for (var b = 0; b < 4 && cont; b++) cont = compute.step();
      draw(compute.snapshot());
      if (cont && !REDUCED) requestAnimationFrame(tick);
      else { btn.disabled = false; onDone(compute.snapshot()); }
    })();
  }

  function run() {
    var method = methodSel.value;
    var x0 = startX();
    readout.textContent = 'running\u2026';
    lastPath = null;
    if (method === 'gd') {
      var stepLR = lr(), x = x0, xs = [x0], iters = 0, diverged = false;
      var MAXIT = 200;
      var compute = {
        step: function () {
          var g = df(x);
          x = x - stepLR * g;
          iters++;
          if (!isFinite(x) || Math.abs(x) > 3.2) { diverged = true; xs.push(x); return false; }
          xs.push(x);
          if (Math.abs(g) < 1e-7) return false;
          return iters < MAXIT;
        },
        snapshot: function () { return { xs: xs, diverged: diverged }; }
      };
      function finish(path) {
        var xf = path.xs[path.xs.length - 1];
        var v = verdictFor(xf, iters, diverged, 'gd');
        readout.innerHTML = 'GD, lr = <strong>' + stepLR.toExponential(1) + '</strong>, start x = <strong>' +
          x0.toFixed(2) + '</strong>, ' + iters + ' steps &rarr; <strong>' + v + '</strong>';
        lastPath = path;
      }
      if (REDUCED) { while (compute.step()) {} finish(compute.snapshot()); }
      else runAnimated(compute, finish);
    } else {
      // simulated annealing
      var rand = mulberry32(99);
      var gauss = makeNormal(rand);
      var T0 = 2.0, TEND = 0.005, SASTEPS = 800;
      var xa = x0, fa = f(xa), best = xa, bestV = fa;
      var xsa = [xa], si = 0;
      var computeSA = {
        step: function () {
          var T = T0 * Math.pow(TEND / T0, si / SASTEPS);
          var prop = xa + 0.6 * gauss();
          var fp = f(Math.max(XMIN - 1, Math.min(XMAX + 1, prop)));
          if (fp < fa || rand() < Math.exp(-(fp - fa) / T)) { xa = prop; fa = fp; }
          if (fa < bestV) { bestV = fa; best = xa; }
          xsa.push(xa);
          si++;
          return si < SASTEPS;
        },
        snapshot: function () { return { xs: xsa, diverged: false }; }
      };
      function finishSA(path) {
        var v = Math.abs(best - globalMin) < 0.2
          ? 'escaped the local trap and found the GLOBAL minimum (x \u2248 ' + best.toFixed(2) + ').'
          : 'best x \u2248 ' + best.toFixed(2) + ' (f = ' + bestV.toFixed(3) + ') — ' +
            (Math.abs(best - globalMin) < 0.5 ? 'near the global minimum.' : 'did not reach the global minimum this run; randomness is the price of admission.');
        readout.innerHTML = 'Simulated annealing, T: 2.0 \u2192 0.005, start x = <strong>' +
          x0.toFixed(2) + '</strong>, 800 steps &rarr; <strong>' + v + '</strong>';
        lastPath = path;
      }
      if (REDUCED) { while (computeSA.step()) {} finishSA(computeSA.snapshot()); }
      else runAnimated(computeSA, finishSA);
    }
  }

  function refreshLabels() {
    var l = lr();
    lrLabel.textContent = l < 0.01 ? l.toExponential(0) : l.toFixed(3).replace(/0+$/, '').replace(/\.$/, '.0');
    startLabel.textContent = startX().toFixed(1);
    if (!runningFlag) { lastPath = null; draw(null); }
    readout.textContent = methodSel.value === 'gd'
      ? 'Press \u201cRun\u201d — watch where gradient descent lands from this start.'
      : 'Press \u201cRun\u201d — simulated annealing can climb out of the local valley.';
  }
  var runningFlag = false;
  btn.addEventListener('click', function () {
    if (runningFlag) return;
    runningFlag = true;
    run();
    runningFlag = false;
  });
  [methodSel, lrSlider, startSlider].forEach(function (el) {
    el.addEventListener('input', refreshLabels);
    el.addEventListener('change', refreshLabels);
  });
  canvas.addEventListener('click', function (ev) {
    var rect = canvas.getBoundingClientRect();
    var mL = 44, mR = 12;
    var frac = (ev.clientX - rect.left - mL) / (rect.width - mL - mR);
    var xv = XMIN + Math.max(0, Math.min(1, frac)) * (XMAX - XMIN);
    startSlider.value = (Math.round(xv * 10) / 10).toFixed(1);
    refreshLabels();
  });

  var rT = null;
  window.addEventListener('resize', function () {
    clearTimeout(rT);
    rT = setTimeout(function () { draw(lastPath); }, 120);
  });
  if (window.MutationObserver) {
    new MutationObserver(function () { draw(lastPath); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }

  refreshLabels();
})();
