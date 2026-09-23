/* Overfitting playground — the stacking article's honesty lesson, live in the
   browser. A noisy 1D regression (true curve: sin(1.6x) + 0.25x, seed 7) is
   fit with polynomials of degree 1..12 by exact least squares. Drag the
   degree slider: training error falls monotonically while validation error
   U-turns — the moment the model starts memorizing noise instead of learning
   signal. The error-curves panel shows the full bias-variance tradeoff with
   your current degree marked. Everything is computed live; nothing is canned.
   Illustrative only. */
(function () {
  'use strict';
  var root = document.getElementById('overfit-widget');
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

  var rand = mulberry32(7);
  var gauss = makeNormal(rand);
  function truth(x) { return Math.sin(1.6 * x) + 0.25 * x; }

  var NTRAIN = 40, NVAL = 40;
  var train = [], val = [];
  var i, x, y;
  for (i = 0; i < NTRAIN; i++) {
    x = -3 + 6 * rand();
    train.push({ x: x, y: truth(x) + 0.45 * gauss() });
  }
  for (i = 0; i < NVAL; i++) {
    x = -3 + 6 * rand();
    val.push({ x: x, y: truth(x) + 0.45 * gauss() });
  }

  // Least squares on scaled u = x/3 via normal equations + partial-pivot
  // Gaussian elimination. Returns coefficients c[0..d].
  function fitPoly(pts, d) {
    var m = d + 1;
    var A = [], b = [];
    for (i = 0; i < m; i++) { A.push(new Float64Array(m + 1)); b.push(0); }
    for (var k = 0; k < pts.length; k++) {
      var u = pts[k].x / 3, pw = [1];
      for (i = 1; i < m; i++) pw.push(pw[i - 1] * u);
      for (i = 0; i < m; i++) {
        b[i] += pw[i] * pts[k].y;
        for (var j = 0; j < m; j++) A[i][j] += pw[i] * pw[j];
      }
    }
    for (i = 0; i < m; i++) A[i][m] = b[i];
    for (var col = 0; col < m; col++) {
      var piv = col;
      for (var r = col + 1; r < m; r++)
        if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
      if (Math.abs(A[piv][col]) < 1e-12) continue;
      var tmp = A[col]; A[col] = A[piv]; A[piv] = tmp;
      for (r = col + 1; r < m; r++) {
        var f = A[r][col] / A[col][col];
        for (var c = col; c <= m; c++) A[r][c] -= f * A[col][c];
      }
    }
    var c = new Float64Array(m);
    for (var r2 = m - 1; r2 >= 0; r2--) {
      var s = A[r2][m];
      for (var c2 = r2 + 1; c2 < m; c2++) s -= A[r2][c2] * c[c2];
      c[r2] = Math.abs(A[r2][r2]) < 1e-12 ? 0 : s / A[r2][r2];
    }
    return c;
  }
  function evalPoly(c, x) {
    var u = x / 3, s = 0, p = 1;
    for (var i = 0; i < c.length; i++) { s += c[i] * p; p *= u; }
    return s;
  }
  function rmse(c, pts) {
    var s = 0;
    for (var i = 0; i < pts.length; i++) {
      var e = evalPoly(c, pts[i].x) - pts[i].y;
      s += e * e;
    }
    return Math.sqrt(s / pts.length);
  }

  var DMAX = 12;
  var trainErr = [], valErr = [], coeffs = [];
  for (var d = 1; d <= DMAX; d++) {
    var c = fitPoly(train, d);
    coeffs.push(c);
    trainErr.push(rmse(c, train));
    valErr.push(rmse(c, val));
  }

  var fitCanvas = root.querySelector('[data-fit]');
  var errCanvas = root.querySelector('[data-err]');
  var fctx = fitCanvas.getContext('2d');
  var ectx = errCanvas.getContext('2d');
  var slider = root.querySelector('[data-degree]');
  var degLabel = root.querySelector('[data-degree-label]');
  var readout = root.querySelector('[data-readout]');

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  var MONO = '10px "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

  function drawFit(deg) {
    var dpr = window.devicePixelRatio || 1;
    var W = fitCanvas.clientWidth, Hh = fitCanvas.clientHeight;
    if (!W || !Hh) return;
    fitCanvas.width = Math.round(W * dpr);
    fitCanvas.height = Math.round(Hh * dpr);
    fctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var ink = cssVar('--ink') || '#17150f';
    var muted = cssVar('--muted') || '#6f6c60';
    var line = cssVar('--line') || '#dcd7c6';
    var green = cssVar('--green') || '#1c6b4a';
    var paper = cssVar('--paper') || '#f6f5f0';
    var red = cssVar('--red') || '#a83c2a';

    var mL = 44, mR = 12, mT = 14, mB = 30;
    var pw = W - mL - mR, ph = Hh - mT - mB;
    var yLo = -3.4, yHi = 3.4;
    function X(v) { return mL + (v + 3) / 6 * pw; }
    function Y(v) { return mT + (1 - (v - yLo) / (yHi - yLo)) * ph; }

    fctx.clearRect(0, 0, W, Hh);
    fctx.fillStyle = paper; fctx.fillRect(0, 0, W, Hh);
    fctx.font = MONO;
    fctx.textAlign = 'right'; fctx.textBaseline = 'middle';
    [-3, -1.5, 0, 1.5, 3].forEach(function (tv) {
      var y = Y(tv);
      fctx.strokeStyle = line; fctx.lineWidth = 1;
      fctx.beginPath(); fctx.moveTo(mL, y); fctx.lineTo(W - mR, y); fctx.stroke();
      fctx.fillStyle = muted; fctx.fillText(tv.toFixed(1), mL - 7, y);
    });
    fctx.textAlign = 'left'; fctx.textBaseline = 'top';
    fctx.fillStyle = muted;
    fctx.fillText('x', 6, Hh - mB + 8);
    fctx.fillText('degree ' + deg + ' fit vs data', 6, 6);

    // true curve (dashed)
    fctx.beginPath();
    for (var j = 0; j <= 200; j++) {
      var xx = -3 + 6 * j / 200;
      var px = X(xx), py = Y(truth(xx));
      if (j === 0) fctx.moveTo(px, py); else fctx.lineTo(px, py);
    }
    fctx.strokeStyle = muted; fctx.lineWidth = 1.5; fctx.setLineDash([6, 4]); fctx.stroke();
    fctx.setLineDash([]);

    // fitted curve
    var c = coeffs[deg - 1];
    fctx.beginPath();
    for (var k = 0; k <= 200; k++) {
      var qx = -3 + 6 * k / 200;
      var qy = Math.max(yLo - 1, Math.min(yHi + 1, evalPoly(c, qx)));
      var rx = X(qx), ry = Y(qy);
      if (k === 0) fctx.moveTo(rx, ry); else fctx.lineTo(rx, ry);
    }
    fctx.strokeStyle = green; fctx.lineWidth = 2.5; fctx.stroke();

    // points: train dots, validation crosses
    fctx.fillStyle = ink;
    train.forEach(function (pt) {
      fctx.beginPath(); fctx.arc(X(pt.x), Y(pt.y), 2.6, 0, 6.3); fctx.fill();
    });
    fctx.strokeStyle = red; fctx.lineWidth = 1.6;
    val.forEach(function (pt) {
      var vx = X(pt.x), vy = Y(pt.y);
      fctx.beginPath();
      fctx.moveTo(vx - 3.4, vy - 3.4); fctx.lineTo(vx + 3.4, vy + 3.4);
      fctx.moveTo(vx + 3.4, vy - 3.4); fctx.lineTo(vx - 3.4, vy + 3.4);
      fctx.stroke();
    });
    fctx.fillStyle = muted; fctx.textAlign = 'left'; fctx.textBaseline = 'top';
    fctx.fillText('\u25cf train (n=40)   \u00d7 validation (n=40)   - - truth', 6, 20);
  }

  function drawErr(deg) {
    var dpr = window.devicePixelRatio || 1;
    var W = errCanvas.clientWidth, Hh = errCanvas.clientHeight;
    if (!W || !Hh) return;
    errCanvas.width = Math.round(W * dpr);
    errCanvas.height = Math.round(Hh * dpr);
    ectx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var muted = cssVar('--muted') || '#6f6c60';
    var line = cssVar('--line') || '#dcd7c6';
    var green = cssVar('--green') || '#1c6b4a';
    var paper = cssVar('--paper') || '#f6f5f0';
    var red = cssVar('--red') || '#a83c2a';

    var mL = 44, mR = 12, mT = 14, mB = 30;
    var pw = W - mL - mR, ph = Hh - mT - mB;
    var yMax = 0;
    for (var d = 0; d < DMAX; d++) {
      if (trainErr[d] > yMax) yMax = trainErr[d];
      if (valErr[d] > yMax) yMax = valErr[d];
    }
    yMax = Math.min(3, yMax * 1.08);
    function X(dd) { return mL + (dd - 1) / (DMAX - 1) * pw; }
    function Y(v) { return mT + (1 - Math.min(v, yMax) / yMax) * ph; }

    ectx.clearRect(0, 0, W, Hh);
    ectx.fillStyle = paper; ectx.fillRect(0, 0, W, Hh);
    ectx.font = MONO;
    ectx.textAlign = 'right'; ectx.textBaseline = 'middle';
    for (var gi = 0; gi <= 3; gi++) {
      var tv = yMax * gi / 3, y = Y(tv);
      ectx.strokeStyle = line; ectx.lineWidth = 1;
      ectx.beginPath(); ectx.moveTo(mL, y); ectx.lineTo(W - mR, y); ectx.stroke();
      ectx.fillStyle = muted; ectx.fillText(tv.toFixed(2), mL - 7, y);
    }
    ectx.textAlign = 'center'; ectx.textBaseline = 'top';
    [1, 4, 7, 10, 12].forEach(function (dd) {
      ectx.fillStyle = muted; ectx.fillText(String(dd), X(dd), Hh - mB + 8);
    });
    ectx.textAlign = 'left';
    ectx.fillStyle = muted;
    ectx.fillText('polynomial degree', 6, Hh - mB + 8);
    ectx.fillText('RMSE', 6, 6);

    function curve(err, color) {
      ectx.beginPath();
      for (var d2 = 0; d2 < DMAX; d2++) {
        var px = X(d2 + 1), py = Y(err[d2]);
        if (d2 === 0) ectx.moveTo(px, py); else ectx.lineTo(px, py);
      }
      ectx.strokeStyle = color; ectx.lineWidth = 2; ectx.stroke();
    }
    curve(trainErr, green);
    curve(valErr, red);
    // current-degree marker
    var mx = X(deg);
    ectx.strokeStyle = muted; ectx.lineWidth = 1; ectx.setLineDash([4, 3]);
    ectx.beginPath(); ectx.moveTo(mx, mT); ectx.lineTo(mx, mT + ph); ectx.stroke();
    ectx.setLineDash([]);
    ectx.fillStyle = muted; ectx.textAlign = 'left'; ectx.textBaseline = 'top';
    ectx.fillText('\u2014 train   \u2014 validation', 6, 20);
  }

  function update(deg) {
    degLabel.textContent = String(deg);
    drawFit(deg);
    drawErr(deg);
    var gap = valErr[deg - 1] - trainErr[deg - 1];
    readout.innerHTML =
      'degree <strong>' + deg + '</strong>' +
      ' &middot; train RMSE <strong>' + trainErr[deg - 1].toFixed(3) + '</strong>' +
      ' &middot; validation RMSE <strong>' + valErr[deg - 1].toFixed(3) + '</strong>' +
      ' &middot; optimism gap <strong>' + gap.toFixed(3) + '</strong>' +
      (deg >= 9 ? ' — the fit is memorizing noise now.' :
       deg >= 5 ? ' — past the sweet spot; validation is turning.' :
       ' — both errors still falling; the model is underfitting.');
  }

  slider.addEventListener('input', function () {
    update(parseInt(slider.value, 10));
  });

  var rT = null;
  window.addEventListener('resize', function () {
    clearTimeout(rT);
    rT = setTimeout(function () { update(parseInt(slider.value, 10)); }, 120);
  });
  if (window.MutationObserver) {
    new MutationObserver(function () { update(parseInt(slider.value, 10)); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }

  update(parseInt(slider.value, 10));
})();
