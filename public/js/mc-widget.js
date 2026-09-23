/* Monte Carlo convergence widget — runs the article's chip-stack survival
   experiment live in the browser (15 chips, bet 1, p = 0.49, 100 hands,
   seed 2026) and plots the running estimate converging to the exact
   dynamic-programming answer, computed here too. Illustrative only. */
(function () {
  'use strict';
  var root = document.getElementById('mc-widget');
  if (!root) return;

  // Article parameters (all illustrative toy parameters from the article).
  var S0 = 15, BET = 1, P = 0.49, H = 100;
  var SEED = 2026;

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Exact survival probability via dynamic programming — the article's "truth".
  function dpExact() {
    var SMAX = S0 + H;
    var V = new Float64Array(SMAX + 1);
    for (var s = 1; s <= SMAX; s++) V[s] = 1.0; // V[0][s>0] = 1, V[*][0] = 0
    for (var t = 1; t <= H; t++) {
      var Vn = new Float64Array(SMAX + 1);
      for (var s2 = 1; s2 <= SMAX; s2++) {
        var up = Math.min(s2 + 1, SMAX);
        var dn = Math.max(s2 - 1, 0);
        Vn[s2] = P * V[up] + (1 - P) * V[dn];
      }
      V = Vn;
    }
    return V[S0];
  }
  var EXACT = dpExact();

  var canvas = root.querySelector('canvas');
  var ctx = canvas.getContext('2d');
  var btn = root.querySelector('[data-run]');
  var sel = root.querySelector('[data-trials]');
  var readout = root.querySelector('[data-readout]');

  var lastPoints = [], lastN = parseInt(sel.value, 10);

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  var Y_MIN = 0.75, Y_MAX = 0.90;
  var MONO = '10px "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

  function draw(points, N) {
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
    var paper = cssVar('--paper') || '#f6f5f0';

    var mL = 52, mR = 12, mT = 14, mB = 32;
    var pw = W - mL - mR, ph = Hh - mT - mB;
    var x0 = Math.log10(100), x1 = Math.log10(N);
    function X(n) { return mL + (Math.log10(Math.max(n, 100)) - x0) / (x1 - x0) * pw; }
    function Y(v) { return mT + (1 - (v - Y_MIN) / (Y_MAX - Y_MIN)) * ph; }

    ctx.clearRect(0, 0, W, Hh);
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, W, Hh);
    ctx.font = MONO;

    // y grid
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    [0.75, 0.78, 0.81, 0.84, 0.87, 0.90].forEach(function (tv) {
      var y = Y(tv);
      ctx.strokeStyle = line; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(mL, y); ctx.lineTo(W - mR, y); ctx.stroke();
      ctx.fillStyle = muted; ctx.fillText(tv.toFixed(2), mL - 7, y);
    });

    // x ticks
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    [[100, '100'], [1000, '1k'], [10000, '10k'], [100000, '100k']].forEach(function (xl) {
      if (xl[0] > N) return;
      ctx.fillStyle = muted;
      ctx.fillText(xl[1], X(xl[0]), Hh - mB + 8);
    });
    ctx.textAlign = 'left';
    ctx.fillStyle = muted;
    ctx.fillText('trials', 6, Hh - mB + 8);

    // exact (dynamic programming) reference line
    var ey = Y(EXACT);
    ctx.strokeStyle = ink; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(mL, ey); ctx.lineTo(W - mR, ey); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = ink; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
    ctx.fillText('exact (DP) ' + EXACT.toFixed(4), mL + 6, ey - 4);

    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = muted;
    ctx.fillText('survival probability', 6, 6);

    if (points.length === 1) {
      var p0 = points[0];
      ctx.fillStyle = green;
      ctx.beginPath(); ctx.arc(X(p0.n), Y(p0.p), 3.5, 0, 6.3); ctx.fill();
    } else if (points.length > 1) {
      // 95% confidence band
      ctx.beginPath();
      points.forEach(function (pt, i) {
        var x = X(pt.n), y = Y(pt.p + 1.96 * pt.se);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      for (var i = points.length - 1; i >= 0; i--) {
        ctx.lineTo(X(points[i].n), Y(points[i].p - 1.96 * points[i].se));
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(28,107,74,0.16)';
      ctx.fill();
      // running estimate
      ctx.beginPath();
      points.forEach(function (pt, j) {
        var x = X(pt.n), y = Y(pt.p);
        if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = green; ctx.lineWidth = 2; ctx.stroke();
    }
  }

  function updateReadout(done, N, p, se) {
    readout.innerHTML =
      'trials <strong>' + done.toLocaleString('en-US') + ' / ' + N.toLocaleString('en-US') + '</strong>' +
      ' &middot; estimate <strong>' + p.toFixed(4) + '</strong>' +
      ' &middot; 95% CI [' + (p - 1.96 * se).toFixed(4) + ', ' + (p + 1.96 * se).toFixed(4) + ']' +
      ' &middot; exact ' + EXACT.toFixed(4);
  }

  var running = false;
  function run() {
    if (running) return;
    running = true;
    btn.disabled = true;
    var N = parseInt(sel.value, 10);
    lastN = N;
    lastPoints = [];
    var rand = mulberry32(SEED);
    var survivors = 0, done = 0;
    var batch = Math.max(250, Math.ceil(N / 80));
    readout.textContent = 'running\u2026';
    function step() {
      var count = Math.min(batch, N - done);
      for (var i = 0; i < count; i++) {
        var s = S0, alive = true;
        for (var h = 0; h < H; h++) {
          s += (rand() < P) ? BET : -BET;
          if (s <= 0) { alive = false; break; }
        }
        if (alive) survivors++;
      }
      done += count;
      var p = survivors / done;
      var se = Math.sqrt(p * (1 - p) / done);
      lastPoints.push({ n: done, p: p, se: se });
      draw(lastPoints, N);
      updateReadout(done, N, p, se);
      if (done < N) {
        requestAnimationFrame(step);
      } else {
        running = false;
        btn.disabled = false;
      }
    }
    requestAnimationFrame(step);
  }

  btn.addEventListener('click', run);
  sel.addEventListener('change', function () {
    lastN = parseInt(sel.value, 10);
    lastPoints = [];
    draw([], lastN);
    readout.textContent = 'Press \u201cRun simulation\u201d \u2014 seed 2026, reproducible.';
  });

  var rT = null;
  window.addEventListener('resize', function () {
    clearTimeout(rT);
    rT = setTimeout(function () { draw(lastPoints, lastN); }, 120);
  });
  if (window.MutationObserver) {
    new MutationObserver(function () { draw(lastPoints, lastN); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }

  draw([], lastN);
  readout.textContent = 'Press \u201cRun simulation\u201d \u2014 seed 2026, reproducible.';
})();
