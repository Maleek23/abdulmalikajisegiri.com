/* Central-limit-theorem sampler — the discrete-event-simulation article's
   "replications" lesson, live in the browser. Pick a population shape
   (right-skewed, uniform, bimodal — each generated live, 60,000 values, with
   its mean and SD computed from the data), choose a sample size n, then add
   replications and watch the distribution of sample means narrow toward a
   normal curve centered on the population mean, with standard error
   shrinking as sigma/sqrt(n). Click the population panel to draw a single
   observation. Everything is computed live; nothing is canned.
   Illustrative only. */
(function () {
  'use strict';
  var root = document.getElementById('clt-widget');
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

  var POPSZ = 60000;
  var rand = mulberry32(1234);
  var gauss = makeNormal(rand);

  function genPopulation(kind) {
    var pop = new Float64Array(POPSZ), i;
    if (kind === 'skewed') {
      for (i = 0; i < POPSZ; i++) pop[i] = -Math.log(1 - rand()) * 2; // Exp mean 2
    } else if (kind === 'uniform') {
      for (i = 0; i < POPSZ; i++) pop[i] = rand() * 10;
    } else { // bimodal
      for (i = 0; i < POPSZ; i++)
        pop[i] = (rand() < 0.5 ? 2 : 8) + 0.6 * gauss();
    }
    var mu = 0, j;
    for (j = 0; j < POPSZ; j++) mu += pop[j];
    mu /= POPSZ;
    var sd = 0;
    for (j = 0; j < POPSZ; j++) { var e = pop[j] - mu; sd += e * e; }
    sd = Math.sqrt(sd / POPSZ);
    var lo = Infinity, hi = -Infinity;
    for (j = 0; j < POPSZ; j++) {
      if (pop[j] < lo) lo = pop[j];
      if (pop[j] > hi) hi = pop[j];
    }
    return { data: pop, mu: mu, sd: sd, lo: lo, hi: hi };
  }

  var popCanvas = root.querySelector('[data-pop]');
  var sampCanvas = root.querySelector('[data-samp]');
  var pctx = popCanvas.getContext('2d');
  var sctx = sampCanvas.getContext('2d');
  var popSel = root.querySelector('[data-population]');
  var nSlider = root.querySelector('[data-n]');
  var nLabel = root.querySelector('[data-n-label]');
  var btn1 = root.querySelector('[data-add1]');
  var btn100 = root.querySelector('[data-add100]');
  var btnRun = root.querySelector('[data-run500]');
  var btnReset = root.querySelector('[data-reset]');
  var readout = root.querySelector('[data-readout]');
  var sampleNote = root.querySelector('[data-sample]');

  var pop = genPopulation(popSel.value);
  var n = parseInt(nSlider.value, 10);
  var means = []; // replication means
  var flash = null; // {x, until} single-draw marker on population panel

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  var MONO = '10px "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

  function setup(canvas, ctx) {
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
      paper: cssVar('--paper') || '#f6f5f0'
    };
  }

  function drawPop() {
    var g = setup(popCanvas, pctx);
    if (!g) return;
    var W = g.W, Hh = g.Hh;
    var mL = 44, mR = 12, mT = 14, mB = 30;
    var pw = W - mL - mR, ph = Hh - mT - mB;
    var NB = 50, counts = new Float64Array(NB);
    for (var i = 0; i < POPSZ; i += 4) {
      var b = Math.floor((pop.data[i] - pop.lo) / (pop.hi - pop.lo) * NB);
      if (b < 0) b = 0; if (b >= NB) b = NB - 1;
      counts[b]++;
    }
    var maxC = 1;
    for (var k = 0; k < NB; k++) if (counts[k] > maxC) maxC = counts[k];
    function X(v) { return mL + (v - pop.lo) / (pop.hi - pop.lo) * pw; }
    function Y(c) { return mT + (1 - c / (maxC * 1.06)) * ph; }

    pctx.textAlign = 'left'; pctx.textBaseline = 'top';
    pctx.fillStyle = g.muted;
    pctx.fillText('population  (\u03bc = ' + pop.mu.toFixed(2) + ', \u03c3 = ' + pop.sd.toFixed(2) + ')', 6, 6);
    var bw = pw / NB;
    pctx.fillStyle = 'rgba(28,107,74,0.55)';
    for (var b2 = 0; b2 < NB; b2++) {
      if (counts[b2] <= 0) continue;
      var bx = mL + b2 / NB * pw;
      pctx.fillRect(bx, Y(counts[b2]), Math.max(1, bw - 0.5), mT + ph - Y(counts[b2]));
    }
    // mean line
    pctx.strokeStyle = g.ink; pctx.lineWidth = 1.5; pctx.setLineDash([6, 4]);
    pctx.beginPath(); pctx.moveTo(X(pop.mu), mT); pctx.lineTo(X(pop.mu), mT + ph); pctx.stroke();
    pctx.setLineDash([]);
    // single-draw flash marker
    if (flash && Date.now() < flash.until) {
      pctx.fillStyle = g.greenDeep;
      pctx.beginPath(); pctx.arc(X(flash.x), mT + ph - 8, 5, 0, 6.3); pctx.fill();
    }
    pctx.fillStyle = g.muted; pctx.textAlign = 'left'; pctx.textBaseline = 'top';
    pctx.fillText('click to draw one observation', 6, Hh - mB + 8);
  }

  function drawSamp() {
    var g = setup(sampCanvas, sctx);
    if (!g) return;
    var W = g.W, Hh = g.Hh;
    var mL = 44, mR = 12, mT = 14, mB = 30;
    var pw = W - mL - mR, ph = Hh - mT - mB;
    var se = pop.sd / Math.sqrt(n);
    var lo = pop.mu - 4 * se, hi = pop.mu + 4 * se;
    var NB = 41, counts = new Float64Array(NB), R = means.length;
    for (var i = 0; i < R; i++) {
      var b = Math.floor((means[i] - lo) / (hi - lo) * NB);
      if (b < 0) b = 0; if (b >= NB) b = NB - 1;
      counts[b]++;
    }
    var maxC = 1;
    for (var k = 0; k < NB; k++) if (counts[k] > maxC) maxC = counts[k];
    function X(v) { return mL + (v - lo) / (hi - lo) * pw; }
    function Y(c) { return mT + (1 - c / (maxC * 1.12)) * ph; }

    sctx.textAlign = 'left'; sctx.textBaseline = 'top';
    sctx.fillStyle = g.muted;
    sctx.fillText('distribution of sample means  (n = ' + n + ', replications = ' + R + ')', 6, 6);
    var bw = pw / NB;
    sctx.fillStyle = 'rgba(28,107,74,0.55)';
    for (var b2 = 0; b2 < NB; b2++) {
      if (counts[b2] <= 0) continue;
      sctx.fillRect(mL + b2 / NB * pw, Y(counts[b2]), Math.max(1, bw - 0.5), mT + ph - Y(counts[b2]));
    }
    if (R > 0) {
      // normal overlay N(mu, se): expected bar height = R * binw * density
      var binw = (hi - lo) / NB;
      sctx.beginPath();
      for (var j = 0; j <= 120; j++) {
        var xv = lo + (hi - lo) * j / 120;
        var z = (xv - pop.mu) / se;
        var dens = Math.exp(-0.5 * z * z) / (se * Math.sqrt(2 * Math.PI));
        var yv = R * binw * dens;
        var px = X(xv), py = Y(yv);
        if (j === 0) sctx.moveTo(px, py); else sctx.lineTo(px, py);
      }
      sctx.strokeStyle = g.ink; sctx.lineWidth = 2; sctx.stroke();
      // mu line
      sctx.strokeStyle = g.greenDeep; sctx.lineWidth = 1.5; sctx.setLineDash([6, 4]);
      sctx.beginPath(); sctx.moveTo(X(pop.mu), mT); sctx.lineTo(X(pop.mu), mT + ph); sctx.stroke();
      sctx.setLineDash([]);
    } else {
      sctx.fillStyle = g.muted; sctx.textAlign = 'center'; sctx.textBaseline = 'middle';
      sctx.fillText('add replications to build the sampling distribution', mL + pw / 2, mT + ph / 2);
    }
  }

  function stats() {
    var R = means.length;
    if (R === 0) return null;
    var m = 0, i;
    for (i = 0; i < R; i++) m += means[i];
    m /= R;
    var s = 0;
    for (i = 0; i < R; i++) { var e = means[i] - m; s += e * e; }
    return { R: R, mean: m, se: R > 1 ? Math.sqrt(s / (R - 1)) : 0 };
  }

  function updateReadout() {
    var st = stats();
    var theorySE = pop.sd / Math.sqrt(n);
    if (!st) {
      readout.innerHTML = 'theoretical SE(\u03bc\u0302) = \u03c3/\u221an = <strong>' +
        theorySE.toFixed(3) + '</strong> — add replications and watch the observed SE converge to it.';
      return;
    }
    readout.innerHTML =
      'replications <strong>' + st.R.toLocaleString('en-US') + '</strong>' +
      ' &middot; mean of means <strong>' + st.mean.toFixed(3) + '</strong>' +
      ' (population \u03bc = ' + pop.mu.toFixed(3) + ')' +
      ' &middot; observed SE <strong>' + st.se.toFixed(3) + '</strong>' +
      ' &middot; theory \u03c3/\u221an = <strong>' + theorySE.toFixed(3) + '</strong>';
  }

  function oneReplication() {
    var s = 0;
    for (var i = 0; i < n; i++) s += pop.data[(rand() * POPSZ) | 0];
    means.push(s / n);
  }

  function addReps(count, done) {
    if (REDUCED) {
      for (var i = 0; i < count; i++) oneReplication();
      drawSamp(); updateReadout();
      if (done) done();
      return;
    }
    var batch = Math.max(25, Math.ceil(count / 40));
    var left = count;
    setButtons(true);
    (function tick() {
      var c = Math.min(batch, left);
      for (var i = 0; i < c; i++) oneReplication();
      left -= c;
      drawSamp(); updateReadout();
      if (left > 0) requestAnimationFrame(tick);
      else { setButtons(false); if (done) done(); }
    })();
  }

  function setButtons(dis) {
    [btn1, btn100, btnRun, btnReset].forEach(function (b) { b.disabled = dis; });
  }

  function resetAll() {
    pop = genPopulation(popSel.value);
    n = parseInt(nSlider.value, 10);
    means = [];
    flash = null;
    nLabel.textContent = String(n);
    sampleNote.textContent = '';
    drawPop(); drawSamp(); updateReadout();
  }

  btn1.addEventListener('click', function () { addReps(1); });
  btn100.addEventListener('click', function () { addReps(100); });
  btnRun.addEventListener('click', function () { addReps(500); });
  btnReset.addEventListener('click', resetAll);
  popSel.addEventListener('change', resetAll);
  nSlider.addEventListener('input', function () {
    n = parseInt(nSlider.value, 10);
    nLabel.textContent = String(n);
    means = []; // n changed -> sampling distribution must be rebuilt
    drawSamp(); updateReadout();
  });

  popCanvas.addEventListener('click', function (ev) {
    var rect = popCanvas.getBoundingClientRect();
    var mL = 44, mR = 12;
    var frac = (ev.clientX - rect.left - mL) / (rect.width - mL - mR);
    // draw a random observation regardless of click x (click = "take a sample")
    var v = pop.data[(rand() * POPSZ) | 0];
    flash = { x: v, until: Date.now() + 1200 };
    sampleNote.innerHTML = 'single draw: <strong>' + v.toFixed(2) + '</strong>' +
      ' — one observation tells you almost nothing; the mean of many tells you \u03bc.';
    drawPop();
    if (!REDUCED) setTimeout(drawPop, 1250);
    void frac;
  });

  var rT = null;
  window.addEventListener('resize', function () {
    clearTimeout(rT);
    rT = setTimeout(function () { drawPop(); drawSamp(); }, 120);
  });
  if (window.MutationObserver) {
    new MutationObserver(function () { drawPop(); drawSamp(); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }

  resetAll();
})();
