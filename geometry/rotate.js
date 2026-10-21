// Rotate About the Origin (T2) — turn a point or a figure 90°, 180° or 270° about the origin, counterclockwise first,
// then clockwise as "the other way". The picture: the point's run-and-rise triangle from the origin turns with it, so the
// run and rise swap and the new run changes sign: (x, y) → (−y, x). Twice: (−x, −y). Three times (= 90° clockwise): (y, −x).
// Points fade with the item's lvl: 2 = the triangle is drawn and the student taps where P lands; 1 = P on the grid, type
// P′(□, □); 0 = coordinates only. A figure: tap A′, B′, C′ (lib/plot.js). What a rotation keeps: true/false facts on a
// triangle FGH turned about P (Test Q5). Late: how far it turned — the minute hand (6° a minute, clockwise), a revolving
// restaurant, a wheel's cars (T3, folded in). On 270° items both names show while scaffolded (tutor rule).
// Tutorial: P(4, 1)'s triangle turns 90° and lands at (−1, 4); one idea per ›; a second turn gives 180°.
// Spec: specs/geometry-transformations.md (T2, T3). Uses lib/grid.js (+ grid-extra.css), lib/plot.js, lib/frac.js,
// lib/pick.js; styles lib/rotate.css.
(function () {
  const G = Grid, s = G.sgn, F = Frac, { r, any, shuffle } = Apparatus.util;
  const pt = p => `(${s(p[0])}, ${s(p[1])})`;
  const same = (p, q) => !!p && !!q && p[0] === q[0] && p[1] === q[1];
  const nz = (a, b) => { let v = 0; while (v === 0) v = r(a, b); return v; };
  const O = [0, 0];
  const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mk = (idea, make) => ({ idea, make });

  // ---- the turn ----
  // q quarter turns counterclockwise (negative: clockwise) about the origin
  const rot = (p, q) => { let [x, y] = p; for (let i = 0, n = ((q % 4) + 4) % 4; i < n; i++) [x, y] = [-y, x]; return [x, y]; };
  const quarters = it => (it.dir === 'cw' ? -1 : 1) * it.ang / 90;
  const ccwQ = it => ((quarters(it) % 4) + 4) % 4;       // the same turn as counterclockwise quarters: 1, 2, 3
  const RULE = { 1: '(x, y) → (−y, x)', 2: '(x, y) → (−x, −y)', 3: '(x, y) → (y, −x)' };
  const dirWord = d => d === 'cw' ? 'clockwise' : 'counterclockwise';
  const name = it => it.ang === 180 ? '180°' : `${it.ang}° ${dirWord(it.dir)}`;
  // the other name for the same turn (270° counterclockwise = 90° clockwise)
  const alias = it => it.ang === 270 ? `90° ${dirWord(it.dir === 'cw' ? 'ccw' : 'cw')}` : null;
  let BOTH = 'scaf', ANIM = true;      // tutor rules (configure)
  const showBoth = (it, lvl) => !!alias(it) && (BOTH === 'always' || (BOTH === 'scaf' && lvl > 0));
  // the turn arrow: counterclockwise, or mirrored for clockwise
  const ARC = cw => `<svg class="rt-arc${cw ? ' cw' : ''}" viewBox="0 0 24 24" aria-hidden="true"><path d="M5.9 8.5A7 7 0 1 0 12 5"/><path d="M15 2L12 5L15 8"/></svg>`;
  const turnHTML = (it, lvl) => `<div class="q rt-turn">${ARC(it.ang !== 180 && it.dir === 'cw')}<span>${it.ang}°</span>${it.ang === 180 ? '' : `<span class="rt-dir">${dirWord(it.dir)}</span>`}</div>`
    + (showBoth(it, lvl) ? `<div class="rt-alias">same as ${alias(it)}</div>` : '');

  // ---- items ----
  // { kind: 'pt', p, ang, dir, lvl }       turn P; lvl 2 tap (triangle drawn), 1 type (on the grid), 0 type (numbers only)
  // { kind: 'fig', pts: [A, B, C], ang, dir }   tap the image's vertices
  // { kind: 'fact', i, tri: [F, G, H] }    true or false, about FGH turned 90° about P
  // { kind: 'clock', h, m0, m1 } · { kind: 'spin', per, t } · { kind: 'cars', n }   how far it turned (degrees)
  function point() { for (;;) { const p = [nz(-5, 5), nz(-5, 5)]; if (Math.abs(p[0]) !== Math.abs(p[1])) return p; } }
  const ptItem = (ang, dir, lvl) => () => ({ kind: 'pt', p: point(), ang, dir, lvl });
  const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  function figure(turns) {
    const [ang, dir] = any(turns);
    for (let k = 0; k < 500; k++) {
      const pts = [0, 1, 2].map(() => [r(-5, 5), r(-5, 5)]);
      if (pts.some(p => same(p, O) || Math.abs(p[0]) === Math.abs(p[1]))) continue;
      const a2 = Math.abs(cross(...pts));
      if (a2 < 6 || a2 > 24) continue;
      const it = { kind: 'fig', pts, ang, dir }, img = pts.map(p => rot(p, quarters(it)));
      if (img.some(q => pts.some(p => same(p, q)))) continue;
      if (pts.some((p, i) => pts.some((q, j) => i < j && same(p, q)))) continue;
      return it;
    }
    return { kind: 'fig', pts: [[1, 1], [4, 2], [2, 4]], ang, dir };
  }
  const d2 = (p, q) => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;
  // FGH in the first quadrant (its image, turned 90° about P, in the second); F and G at different distances from P
  function factTri() {
    for (let k = 0; k < 500; k++) {
      const t = [0, 1, 2].map(() => [r(1, 5), r(1, 4)]);
      if (Math.abs(cross(...t)) < 5) continue;
      const [Fp, Gp] = t;
      if (d2(Fp, O) === d2(Gp, O) || d2(Fp, O) === d2(Fp, Gp)) continue;
      return t;
    }
    return [[2, 1], [5, 2], [3, 4]];
  }
  const FACTS = [
    { s: 'FP = F′P', t: 'T', cue: 'fp', why: () => 'A turn about P keeps every point the same distance from P: FP = F′P.' },
    { s: 'FG = F′G′', t: 'T', cue: 'fg', why: () => 'A turn doesn’t stretch anything: each side keeps its length, FG = F′G′.' },
    { s: '∠FPF′ = ∠GPG′', t: 'T', cue: 'ang', why: () => 'Every point turns through the same angle about P, here 90°.' },
    { s: 'FP = FG', t: 'F', cue: 'fpfg', why: () => 'FP goes to the center; FG is a side. Here they aren’t the same length.' },
    { s: 'FF′ = GG′', t: 'F', cue: 'move', why: it => { const f = d2(it.tri[0], O) < d2(it.tri[1], O); return `${f ? 'G' : 'F'} is farther from P than ${f ? 'F' : 'G'}, so it moves farther.`; } },
    { s: 'F′G′H′ is bigger than FGH.', t: 'F', cue: 'size', words: true, why: () => 'A turn keeps the size and the shape: F′G′H′ is a copy of FGH.' },
    { s: 'The angles of F′G′H′ match the angles of FGH.', t: 'T', cue: 'size', words: true, why: () => 'A turn keeps the shape, so every angle stays the same.' },
    { s: 'P moves too.', t: 'F', cue: 'ring', words: true, why: () => 'The center stays where it is; everything else turns around it.' }
  ];
  let deck = [];
  const fact = () => { if (!deck.length) deck = shuffle(FACTS.map((_, i) => i)); return { kind: 'fact', i: deck.pop(), tri: factTri() }; };
  // how far it turned
  function clock(easy) {
    for (;;) {
      const h = r(1, 12), m0 = easy ? 5 * r(0, 5) : r(1, 25), m1 = easy ? m0 + 5 * r(2, 8) : m0 + r(13, 50);
      if (m1 < 60 && (easy || (m0 % 5 && m1 % 5))) return { kind: 'clock', h, m0, m1 };
    }
  }
  function spin() {
    // a whole number of minutes, a friendly fraction of the period (a multiple of 30°)
    const per = any([60, 30, 20, 90, 120]);
    for (;;) { const t = r(5, per - 5); if ((12 * t) % per === 0 && t % 5 === 0 && t * 2 !== per) return { kind: 'spin', per, t }; }
  }
  const cars = () => ({ kind: 'cars', n: any([12, 18, 20, 24, 30, 36, 40]) });
  const degs = it => it.kind === 'clock' ? 6 * (it.m1 - it.m0) : it.kind === 'spin' ? 360 * it.t / it.per : 360 / it.n;
  const mm = m => (m < 10 ? '0' : '') + m;

  // ---- what an answer got wrong ----
  // a typed or tapped point a for the image of p (null: right)
  function ptErr(it, p, a) {
    const want = rot(p, quarters(it)), wq = ccwQ(it);
    if (same(a, want)) return null;
    if (same(a, p)) return 'same';
    if (same(a, [p[1], p[0]])) return 'swap';
    if (same(a, [-p[1], -p[0]])) return 'swapneg';
    const k = [1, 2, 3].find(k => same(a, rot(p, k)));
    if (k) return wq === 2 || k === 2 ? 'angle' : 'dir';
    if (same(a, [-p[0], p[1]]) || same(a, [p[0], -p[1]])) return wq === 2 ? 'onesign' : 'nosw';
    return 'other';
  }
  function ptSay(it, p, a, err, N = 'P') {
    const want = rot(p, quarters(it)), wq = ccwQ(it), A = pt(a), W = pt(want);
    if (err === 'same') return `${A} is where ${N} started. Turned ${name(it)}, it lands on ${W}.`;
    if (err === 'swap') return `${A} is a flip across y = x. ${wq === 2 ? 'A half turn doesn’t swap; it changes both signs' : 'A turn also changes a sign'}: ${W}.`;
    if (err === 'swapneg') return `${A} is a flip across y = −x. ${wq === 2 ? 'A half turn doesn’t swap x and y' : 'A quarter turn changes only one sign'}: ${W}.`;
    if (err === 'dir') {
      if (it.ang === 270) return `${A} is 90° ${dirWord(it.dir)}. ${name(it)} is the same as ${alias(it)}: ${W}.`;
      return `${A} is 90° ${dirWord(it.dir === 'cw' ? 'ccw' : 'cw')}. ${it.dir === 'cw' ? 'Clockwise' : 'Counterclockwise'} turns the other way: ${W}.`;
    }
    if (err === 'angle') return wq === 2 ? `${A} is a quarter turn. 180° is two: both signs change, ${W}.` : `${A} is a half turn (180°). ${name(it)} lands on ${W}.`;
    if (err === 'onesign') return `Only one sign changed: that’s a flip. A half turn changes both: ${W}.`;
    if (err === 'nosw') return `Only a sign changed. A quarter turn also swaps x and y: ${W}.`;
    return `Turned ${name(it)}, ${RULE[wq]}: ${W}.`;
  }
  const NAMES = ['A', 'B', 'C'];
  function figErr(it, vs) {
    const img = it.pts.map(p => rot(p, quarters(it)));
    if (vs.every((v, i) => same(v, img[i]))) return null;
    // every vertex by the same wrong rule
    const errs = vs.map((v, i) => ptErr(it, it.pts[i], v));
    if (errs.every(e => e && e === errs[0]) && errs[0] !== 'other') return { type: errs[0], i: 0 };
    // the right spots under the wrong names
    if (vs.every(v => img.some(q => same(q, v)))) return { type: 'order', i: vs.findIndex((v, i) => !same(v, img[i])) };
    const i = errs.findIndex(e => e);
    return { type: errs[i], i };
  }
  function figSay(it, vs, fe) {
    const i = fe.i, img = it.pts.map(p => rot(p, quarters(it)));
    if (fe.type === 'order') return `Those are the right spots, but ${NAMES[i]}′ is where ${NAMES[i]} lands: ${pt(img[i])}.`;
    return `${NAMES[i]}′` + ptSay(it, it.pts[i], vs[i], fe.type, NAMES[i]);
  }
  function degErr(it, a) {
    const w = degs(it);
    if (a === w) return null;
    if (it.kind === 'clock') {
      const m = it.m1 - it.m0;
      if (a === 30 * m) return 'thirty';
      if (a === 360 - w) return 'back';
      if (a === m) return 'mins';
      if (a === 6 * it.m1) return 'from12';
      return 'deg';
    }
    if (it.kind === 'spin') { if (a === it.t) return 'mins'; if (a === 360 - w) return 'back'; return 'part'; }
    return a === it.n ? 'count' : 'part';
  }
  function degSay(it, a, err) {
    const w = degs(it);
    if (it.kind === 'clock') {
      const m = it.m1 - it.m0, work = `${m} × 6 = ${w}°`;
      if (err === 'thirty') return `30° is one number on the clock (5 minutes). Each minute is 6°: ${work}.`;
      if (err === 'back') return `${a}° is the rest of the way round. The hand goes clockwise from :${mm(it.m0)} to :${mm(it.m1)}: ${work}.`;
      if (err === 'mins') return `${m} is the minutes. Each minute is 6°: ${work}.`;
      if (err === 'from12') return `${a}° is from the 12. From :${mm(it.m0)} to :${mm(it.m1)} is ${m} minutes: ${work}.`;
      return `Each minute is 6°: ${work}.`;
    }
    if (it.kind === 'spin') {
      if (err === 'mins') return `${it.t} is the minutes. ${it.t} of ${it.per} minutes is ${it.t}/${it.per} of 360°: ${w}°.`;
      if (err === 'back') return `${a}° is what’s left of the turn. In ${it.t} of ${it.per} minutes it turns ${it.t}/${it.per} of 360°: ${w}°.`;
      return `In ${it.t} of ${it.per} minutes it turns ${it.t}/${it.per} of 360°: ${w}°.`;
    }
    if (err === 'count') return `${it.n} is the number of cars. The ${it.n} gaps share 360°: 360 ÷ ${it.n} = ${w}°.`;
    return `${it.n} equal gaps share 360°: 360 ÷ ${it.n} = ${w}°.`;
  }

  // ---- pictures ----
  const NS = 'http://www.w3.org/2000/svg';
  const center = g => g.el('circle', { cx: g.X(0), cy: g.Y(0), r: 5, class: 'rt-o' });
  // turn grp about the origin from q0 to q1 quarter turns counterclockwise (animated; ~0.7 s a quarter)
  function spinTo(g, grp, q0, q1) {
    return new Promise(res => {
      const cx = g.X(0), cy = g.Y(0), set = q => grp.setAttribute('transform', `rotate(${-90 * q} ${cx} ${cy})`);
      if (reduced() || !ANIM) { set(q1); return res(); }
      const t0 = performance.now(), ms = 700 * Math.abs(q1 - q0);
      (function frame(t) {
        if (!grp.isConnected) return res();
        const k = Math.min(1, (t - t0) / ms), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        set(q0 + (q1 - q0) * e);
        if (k < 1) requestAnimationFrame(frame); else res();
      })(t0);
    });
  }
  const pause = ms => new Promise(res => setTimeout(res, reduced() || !ANIM ? 0 : ms));
  // P's triangle from the origin: a copy turns onto P′; the turned copy's run and rise go in the legend (dashed)
  async function turnPoint(g, it, p, label, dot = true) {
    const q = quarters(it), img = rot(p, q);
    const grp = g.el('g', { class: 'rt-spin' }), tri = g.triangle(O, p, { labels: false, cls: 'turned' });
    grp.appendChild(tri);
    await pause(250);
    await spinTo(g, grp, 0, q);
    if (!g.svg.isConnected) return;
    if (q % 2) recolor(tri);
    if (dot) g.dot(img, 'pt ok', `${label}${pt(img)}`);
    g.triangle(O, img, { labels: true, cls: 'turned rt-leg' });
  }
  // after an odd number of quarter turns the old run stands up as the new rise (and the other way): swap the colors
  function recolor(tri) {
    const a = tri.querySelector('.run'), b = tri.querySelector('.rise');
    if (a) a.setAttribute('class', 'rise'); if (b) b.setAttribute('class', 'run');
  }
  async function turnFig(g, it) {
    const img = it.pts.map(p => rot(p, quarters(it)));
    const grp = g.el('g', { class: 'rt-spin' }); grp.appendChild(g.poly(it.pts, 'pg faint'));
    await pause(250);
    await spinTo(g, grp, 0, quarters(it));
    if (!g.svg.isConnected) return;
    g.poly(img, 'pg ok');
    img.forEach((p, i) => g.dot(p, 'pt ok', NAMES[i] + '′' + pt(p)));
  }
  function ptPicture(host, it, tri) {
    const g = G.make(host);
    center(g);
    g.dot(it.p, 'pt', 'P' + pt(it.p));
    if (tri) g.triangle(O, it.p, { labels: true });
    return g;
  }
  function figPicture(host, it) {
    const g = G.make(host);
    center(g);
    g.poly(it.pts, 'pg');
    it.pts.forEach((p, i) => g.dot(p, 'pt', NAMES[i] + pt(p)));
    return g;
  }
  function factPicture(host, it) {
    const g = G.make(host, { min: -6, max: 6 }), img = it.tri.map(p => rot(p, 1));
    g.poly(it.tri, 'pg'); g.poly(img, 'pg img');
    g.dot(O, 'pt', 'P');
    ['F', 'G', 'H'].forEach((n, i) => { g.dot(it.tri[i], 'pt', n); g.dot(img[i], 'pt pick', n + '′'); });
    return g;
  }
  function factCue(g, it, ok) {
    const [Fp, Gp] = it.tri, [F2, G2] = [Fp, Gp].map(p => rot(p, 1)), c = ok ? 'ok' : 'no', f = FACTS[it.i];
    const hl = (p, q, k = c) => g.seg(p, q, 'sg rt-hl ' + k);
    if (f.cue === 'fp') g.strings(O, Fp, F2, 'ok');
    if (f.cue === 'fg') { hl(Fp, Gp, 'ok'); hl(F2, G2, 'ok'); }
    // each point travels round its own circle about P, through the same quarter turn
    const arc = p => { const q = rot(p, 1), R = Math.hypot(p[0], p[1]) * 20; return g.el('path', { d: `M${g.X(p[0])} ${g.Y(p[1])}A${R} ${R} 0 0 0 ${g.X(q[0])} ${g.Y(q[1])}`, class: 'rt-arcs' }); };
    if (f.cue === 'ang') [Fp, Gp].forEach(p => { g.seg(O, p, 'sg rt-ray'); g.seg(O, rot(p, 1), 'sg rt-ray'); arc(p); });
    if (f.cue === 'fpfg') g.strings(Fp, O, Gp, 'no');
    if (f.cue === 'move') { hl(Fp, F2, 'no'); hl(Gp, G2, 'no'); }
    if (f.cue === 'size') g.svg.querySelectorAll('.pg').forEach(n => n.classList.add('rt-glow'));
    if (f.cue === 'ring') g.el('circle', { cx: g.X(0), cy: g.Y(0), r: 10, class: 'rt-ring' });
  }
  // the clock: the minute hand at :m0 (faint) and at :m1, the clockwise arc between
  function clockSVG(it, cue) {
    const R = 52, at = (m, L) => { const a = m * Math.PI / 30; return [+(Math.sin(a) * L).toFixed(1), +(-Math.cos(a) * L).toFixed(1)]; };
    let h = `<circle r="${R}" class="ck-face"/>`;
    for (let m = 0; m < 60; m++) { const [x1, y1] = at(m, R - (m % 5 ? 4 : 8)), [x2, y2] = at(m, R - 1); h += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="ck-t${m % 5 ? '' : ' big'}"/>`; }
    [12, 3, 6, 9].forEach(n => { const [x, y] = at(n * 5, R - 16); h += `<text x="${x}" y="${y + 4}" class="ck-n">${n}</text>`; });
    const a0 = at(it.m0, 30), a1 = at(it.m1, 30), big = (it.m1 - it.m0) * 6 > 180 ? 1 : 0;
    h += `<path d="M${a0[0]} ${a0[1]}A30 30 0 ${big} 1 ${a1[0]} ${a1[1]}" class="ck-arc${cue ? ' ' + cue : ''}"/>`;
    const e0 = at(it.m0, 42), e1 = at(it.m1, 42);
    h += `<line x2="${e0[0]}" y2="${e0[1]}" class="ck-hand was"/><line x2="${e1[0]}" y2="${e1[1]}" class="ck-hand"/><circle r="3" class="ck-hub"/>`;
    return `<svg class="ck" viewBox="-60 -60 120 120" aria-hidden="true">${h}</svg>`;
  }
  // the wheel: n cars round a circle; two neighbours and the angle between them
  function wheelSVG(it, cue) {
    const R = 46, at = (k, L) => { const a = k * 2 * Math.PI / it.n; return [+(Math.sin(a) * L).toFixed(1), +(-Math.cos(a) * L).toFixed(1)]; };
    let h = `<circle r="${R}" class="ck-face"/>`;
    for (let k = 0; k < it.n; k++) { const [x, y] = at(k, R); h += `<circle cx="${x}" cy="${y}" r="${k < 2 ? 4 : 2.6}" class="wh-car${k < 2 ? ' on' : ''}"/>`; }
    const [x0, y0] = at(0, R), [x1, y1] = at(1, R);
    h += `<line x2="${x0}" y2="${y0}" class="wh-sp"/><line x2="${x1}" y2="${y1}" class="wh-sp"/>`;
    const b0 = at(0, 18), b1 = at(1, 18);
    h += `<path d="M${b0[0]} ${b0[1]}A18 18 0 0 1 ${b1[0]} ${b1[1]}" class="ck-arc${cue ? ' ' + cue : ''}"/><circle r="3" class="ck-hub"/>`;
    return `<svg class="ck" viewBox="-60 -60 120 120" aria-hidden="true">${h}</svg>`;
  }

  // ---- the answer areas ----
  const ptBoxes = (N = 'P′') => `<div class="q rt-ans">${N}(${F.box('x')},&nbsp;${F.box('y')})</div>`;
  function readBoxes(v, names) { return names.map(n => { const x = v[n].v; return x.undef || x.d !== 1 ? NaN : x.n; }); }
  function askPoint(el, it, submit, lvl) {
    el._x = { lvl };
    if (lvl === 2) {
      el.innerHTML = `<div class="gq rt">${turnHTML(it, lvl)}<div class="gridbox"></div><div class="q small rt-do">Tap where P lands.</div><p class="say" aria-live="polite"></p><button type="button" class="go" disabled>Check</button></div>`;
      const g = el._x.g = ptPicture(el.querySelector('.gridbox'), it, true), go = el.querySelector('.go');
      const pl = el._x.plot = Plot.wire(g, { names: ['P′'], closed: false, onChange: ps => { go.disabled = ps.length < 1; } });
      go.addEventListener('click', () => { const v = pl.points()[0]; if (!v) return; pl.stop(); go.disabled = true; submit({ v }); });
      return;
    }
    const grid = lvl === 1;
    el.innerHTML = `<div class="gq rt">${grid ? '' : `<div class="q">P${pt(it.p)}</div>`}${turnHTML(it, lvl)}${grid ? '<div class="gridbox"></div>' : ''}${ptBoxes()}
      <p class="say" aria-live="polite"></p><button type="button" class="go">Check</button>${grid ? '' : '<div class="gridbox pic"></div>'}</div>`;
    if (grid) el._x.g = ptPicture(el.querySelector('.gridbox'), it, false);
    el._x.f = F.wire(el.querySelector('.gq'), { onSubmit: v => submit({ v: readBoxes(v, ['x', 'y']) }) });
  }
  function askFig(el, it, submit) {
    el.innerHTML = `<div class="gq rt">${turnHTML(it, el._x.lvl)}<div class="gridbox"></div><div class="q small rt-do">Tap where A, B and C land.</div><p class="say" aria-live="polite"></p><button type="button" class="go" disabled>Check</button></div>`;
    const g = el._x.g = figPicture(el.querySelector('.gridbox'), it), go = el.querySelector('.go');
    const pl = el._x.plot = Plot.wire(g, { names: ['A′', 'B′', 'C′'], onChange: () => { go.disabled = !pl.done(); } });
    go.addEventListener('click', () => { if (!pl.done()) return; pl.stop(); go.disabled = true; submit({ vs: pl.points() }); });
  }
  function askFact(el, it, submit) {
    const f = FACTS[it.i];
    el.innerHTML = `<div class="gq rt"><div class="gridbox"></div><div class="q rt-fact${f.words ? ' words' : ''}">${f.s}</div><div class="rt-ch"></div></div>`;
    el._x.g = factPicture(el.querySelector('.gridbox'), it);
    Pick.ask(el.querySelector('.rt-ch'), [['T', 'True'], ['F', 'False']], id => submit({ id }));
  }
  function askDeg(el, it, submit) {
    const head = it.kind === 'clock'
      ? `${clockSVG(it)}<div class="q">${it.h}:${mm(it.m0)} → ${it.h}:${mm(it.m1)}</div><div class="q small">How far does the minute hand turn?</div>`
      : it.kind === 'spin' ? `<div class="q small rt-words">A restaurant turns all the way round once every ${it.per} minutes.</div><div class="q small rt-words">How far does it turn in ${it.t} minutes?</div>`
      : `${wheelSVG(it)}<div class="q small rt-words">A wheel has ${it.n} cars, equally spaced.</div><div class="q small rt-words">How many degrees from one car to the next?</div>`;
    el.innerHTML = `<div class="gq rt"><div class="rt-pic">${head}</div><div class="q rt-ans">${F.box('deg')}<span>°</span></div><p class="say" aria-live="polite"></p><button type="button" class="go">Check</button></div>`;
    el._x.f = F.wire(el.querySelector('.gq'), { onSubmit: v => submit({ n: readBoxes(v, ['deg'])[0] }) });
  }

  const want = it => it.kind === 'pt' ? rot(it.p, quarters(it)) : it.kind === 'fig' ? it.pts.map(p => rot(p, quarters(it))) : it.kind === 'fact' ? FACTS[it.i].t : degs(it);
  const TIPS = {
    swap: ['Swaps x and y but keeps both signs: (y, x).', 'That’s a flip across y = x. Turn the point’s run-and-rise triangle 90°: the run and rise swap AND the new run changes sign, (−y, x).'],
    swapneg: ['Swaps and changes both signs: (−y, −x).', 'That’s a flip across y = −x. A quarter turn changes only one sign. Draw the triangle from the origin and turn it.'],
    dir: ['Turns the wrong way (clockwise for counterclockwise, or 270° as 90°).', 'Counterclockwise is the way from the positive x-axis up to the positive y-axis. 90° clockwise = 270° counterclockwise: (y, −x).'],
    angle: ['Turns 180° for 90° (or 90° for 180°).', 'A quarter turn swaps x and y; a half turn keeps them in place and changes both signs. Count the quarter turns.'],
    onesign: ['Changes one sign on a 180° turn.', 'That’s a flip across an axis. A half turn changes both signs: (−x, −y).'],
    nosw: ['Changes a sign but doesn’t swap on a 90° turn.', 'Turn the triangle: the run becomes the rise. x and y swap, and one sign changes.'],
    same: ['Leaves the point where it is.', 'Only the center stays put. Draw the triangle from the origin and turn it.'],
    order: ['Plots the right points under the wrong names.', 'Turn each vertex on its own: A goes to A′, B to B′, C to C′.'],
    other: ['Slips on the rule.', 'Draw the run-and-rise triangle from the origin and turn it a quarter turn at a time.'],
    fact: ['Mixes up what a rotation keeps.', 'A turn keeps lengths, angles and each point’s distance to the center; it moves far points farther than near ones.'],
    thirty: ['Uses 30° for each minute.', '30° is one number on the clock face (5 minutes). One minute is 360 ÷ 60 = 6°.'],
    back: ['Measures the turn the other way round.', 'A minute hand turns clockwise, forward in time. Count the minutes from the start time to the end.'],
    mins: ['Gives the minutes, not the degrees.', 'Change minutes into degrees: × 6 for a minute hand; for anything else, minutes ÷ period × 360.'],
    from12: ['Measures from 12 o’clock, not from the start.', 'Count the minutes from the start time to the end time first.'],
    deg: ['Slips multiplying by 6.', 'Minutes × 6. Split it: 37 × 6 = 30 × 6 + 7 × 6.'],
    part: ['Can’t turn a fraction of a period into degrees.', 'It turns the same fraction of 360°: 40 of 60 minutes is ⅔ of 360° = 240°. n equal gaps: 360 ÷ n.'],
    count: ['Gives the number of cars, not the angle.', 'The cars split 360° into equal gaps: 360 ÷ n.']
  };
  const IDEAS = {
    q90:   { name: '90° counterclockwise', easy: ['q90-tap'], hard: ['q90-grid', 'q90'], check: 'q90' },
    h180:  { name: '180°', easy: ['h180-tap'], hard: ['h180'], check: 'h180' },
    cw:    { name: '90° clockwise = 270° counterclockwise', easy: ['cw-tap'], hard: ['cw270', 'cw270cw'], check: 'cw270cw' },
    fig:   { name: 'A figure', easy: ['fig'], hard: ['fig-cw'], check: 'fig-cw' },
    keeps: { name: 'What a rotation keeps', easy: ['fact'], hard: ['fact', 'fact'] },
    clock: { name: 'How far it turned (clock, wheel)', easy: ['clock5', 'cars'], hard: ['clock', 'spin'], late: true, check: 'clock' }
  };
  const TUT_P = [4, 1];

  Apparatus.define({
    id: 'geo-rotate',
    title: 'Rotate About the Origin',
    ideas: IDEAS,
    kinds: {
      'q90-tap': mk('q90', ptItem(90, 'ccw', 2)), 'q90-grid': mk('q90', ptItem(90, 'ccw', 1)), q90: mk('q90', ptItem(90, 'ccw', 0)),
      'h180-tap': mk('h180', ptItem(180, 'ccw', 2)), h180: mk('h180', ptItem(180, 'ccw', 0)),
      'cw-tap': mk('cw', ptItem(90, 'cw', 2)), cw270: mk('cw', ptItem(270, 'ccw', 1)), cw270cw: mk('cw', ptItem(270, 'cw', 0)),
      fig: mk('fig', () => figure([[90, 'ccw'], [180, 'ccw']])), 'fig-cw': mk('fig', () => figure([[90, 'cw'], [270, 'ccw']])),
      fact: mk('keeps', fact),
      clock5: mk('clock', () => clock(true)), clock: mk('clock', () => clock(false)), spin: mk('clock', spin), cars: mk('clock', cars)
    },
    // the contrast set on one point: 90° counterclockwise, then 90° clockwise (the other way)
    opening: [
      { kind: 'q90-tap', item: { kind: 'pt', p: [3, 2], ang: 90, dir: 'ccw', lvl: 2 } },
      { kind: 'cw-tap', item: { kind: 'pt', p: [3, 2], ang: 90, dir: 'cw', lvl: 2 } }
    ],
    nextOnRight: true,
    defaults: { fix: 1, both: 'scaf', clock: true, anim: true },
    rules: [
      ['both', 'Name both turns on 270° items', [['scaf', 'While scaffolded'], ['always', 'Always'], ['never', 'Never']], '“270° counterclockwise” also shows “same as 90° clockwise” (and the other way round). While scaffolded: not on the numbers-only items or the next-session check.'],
      ['anim', 'Turn animation', [[true, 'On'], [false, 'Off']], 'After a miss (and on the tap items), a copy of the point’s triangle or the figure turns about the origin onto the image.'],
      ['clock', 'How far it turned', [[true, 'On'], [false, 'Off']], 'The late idea: the minute hand turns 6° a minute (10:05 → 10:42 = 222°), a revolving restaurant, a wheel’s cars (Test Q4).']
    ],
    configure(S) {
      BOTH = S.both || 'scaf'; ANIM = S.anim !== false;
      if (S.clock !== false) return {};
      const { clock: _, ...rest } = IDEAS;
      return { ideas: rest };
    },
    text: it => it.kind === 'pt' ? `P${pt(it.p)} ${name(it)}${it.lvl === 2 ? ' (tap, triangle)' : it.lvl === 1 ? ' (grid)' : ''}`
      : it.kind === 'fig' ? `A${pt(it.pts[0])} B${pt(it.pts[1])} C${pt(it.pts[2])} ${name(it)} (tap)`
      : it.kind === 'fact' ? `T/F: ${FACTS[it.i].s}`
      : it.kind === 'clock' ? `minute hand ${it.h}:${mm(it.m0)} → ${it.h}:${mm(it.m1)}`
      : it.kind === 'spin' ? `once every ${it.per} min, turn in ${it.t} min` : `wheel, ${it.n} cars: degrees between`,
    speak: it => it.kind === 'pt' ? `P is at ${pt(it.p)}. Turn it ${name(it)} about the origin. Where does it land?`
      : it.kind === 'fig' ? `Turn triangle ABC ${name(it)} about the origin. Tap where A, B and C land.`
      : it.kind === 'fact' ? `Triangle FGH is turned 90 degrees about P. True or false: ${FACTS[it.i].s.replace(/′/g, ' prime').replace(/∠/g, 'angle ')}`
      : it.kind === 'clock' ? `The minute hand goes from ${it.h}:${mm(it.m0)} to ${it.h}:${mm(it.m1)}. How many degrees does it turn?`
      : it.kind === 'spin' ? `A restaurant turns once every ${it.per} minutes. How far does it turn in ${it.t} minutes?`
      : `A wheel has ${it.n} cars, equally spaced. How many degrees from one car to the next?`,
    ask(el, it, submit, ctx) {
      const warm = ctx && ctx.mode === 'warm';
      el._x = { lvl: warm ? 0 : it.lvl ?? 1 };
      if (it.kind === 'pt') return askPoint(el, it, submit, el._x.lvl);
      if (it.kind === 'fig') return askFig(el, it, submit);
      if (it.kind === 'fact') return askFact(el, it, submit);
      askDeg(el, it, submit);
    },
    correct: it => { const w = want(it); return it.kind === 'pt' ? pt(w) : it.kind === 'fig' ? w.map((p, i) => NAMES[i] + '′' + pt(p)).join(' ') : it.kind === 'fact' ? (w === 'T' ? 'True' : 'False') : w + '°'; },
    isRight(it, a) {
      if (it.kind === 'pt') return !ptErr(it, it.p, a.v);
      if (it.kind === 'fig') return !figErr(it, a.vs);
      if (it.kind === 'fact') return a.id === FACTS[it.i].t;
      return a.n === degs(it);
    },
    classify(it, a) {
      if (it.kind === 'pt') return ptErr(it, it.p, a.v);
      if (it.kind === 'fig') return figErr(it, a.vs).type;
      if (it.kind === 'fact') return 'fact';
      return degErr(it, a.n);
    },
    feedback(it, w, a, kind, err) {
      if (it.kind === 'pt') return ['pic', ptSay(it, it.p, a.v, err)];
      if (it.kind === 'fig') return ['pic', figSay(it, a.vs, figErr(it, a.vs))];
      if (it.kind === 'fact') return ['pic', FACTS[it.i].why(it)];
      return ['pic', degSay(it, a.n, err)];
    },
    reveal(el, it, a, o) {
      const x = el._x || {}, g = x.g;
      el.querySelectorAll('.rt-do').forEach(n => { n.hidden = true; });
      if (it.kind === 'pt') {
        const w = want(it);
        if (x.f) { x.f.mark('x', a.v[0] === w[0]); x.f.mark('y', a.v[1] === w[1]); }
        if (x.plot) x.plot.mark([o.right]);
        if (o.right) { if (x.lvl === 2 && g) turnPoint(g, it, it.p, 'P′', false); return; }
        let gg = g;
        // the tapped point stays, red and unnamed: the name goes to where P lands
        if (x.plot) { x.plot.clear(); g.dot(a.v, 'pt no'); }
        if (!gg) { const pic = el.querySelector('.pic'); if (!pic) return; gg = ptPicture(pic, it, true); }
        else if (x.lvl === 1) gg.triangle(O, it.p, { labels: true });
        if (x.lvl !== 2 && a.v.every(n => Number.isInteger(n) && Math.abs(n) <= 6)) gg.dot(a.v, 'pt no');
        turnPoint(gg, it, it.p, 'P′');
        return;
      }
      if (it.kind === 'fig') {
        const w = want(it);
        if (o.right) { x.plot && x.plot.mark(a.vs.map(() => true)); return; }
        // the taps that missed stay red and unnamed; the names go to the image, which the figure turns onto
        if (x.plot) x.plot.clear();
        a.vs.forEach((v, i) => { if (!same(v, w[i])) g.dot(v, 'pt no'); });
        turnFig(g, it);
        return;
      }
      if (it.kind === 'fact') {
        Pick.mark(el, o.right ? null : FACTS[it.i].t, a.id, o.right);
        if (!o.right && g) factCue(g, it, FACTS[it.i].t === 'T');
        return;
      }
      x.f && x.f.mark('deg', o.right);
      if (!o.right) {
        const pic = el.querySelector('.rt-pic svg.ck');
        if (pic) pic.outerHTML = it.kind === 'clock' ? clockSVG(it, 'cue') : wheelSVG(it, 'cue');
      }
    },
    errors: {
      swap: 'swapped only: (y, x), a flip across y = x', swapneg: 'swapped and both signs: (−y, −x)', dir: 'turned the other way',
      angle: 'wrong angle (90° ↔ 180°)', onesign: '180°: changed one sign only', nosw: '90°: changed a sign, didn’t swap', same: 'left it in place',
      order: 'right points, wrong names', other: 'other slip', fact: 'what a rotation keeps (true/false)',
      thirty: 'clock: 30° a minute', back: 'measured the other way round', mins: 'gave minutes, not degrees', from12: 'clock: measured from 12',
      deg: 'clock: arithmetic', part: 'fraction of a turn', count: 'gave the number of cars'
    },
    diagnose: err => TIPS[err] || ['', ''],
    cheatRule: 'Turn the point’s run-and-rise triangle about the origin: the run and rise swap, and the new run changes sign.',
    get keyHTML() {
      const host = document.createElement('div'), g = G.make(host, { min: -5, max: 5 }), P = TUT_P;
      g.triangle(O, P, { labels: false }); g.dot(P, 'pt', 'P');
      // P's triangle turned once, twice, three times (the turned copies, as in the tutorial)
      [[1, 'P′'], [2, 'P″'], [3, 'P‴']].forEach(([q, n]) => {
        const grp = g.el('g', { transform: `rotate(${-90 * q} ${g.X(0)} ${g.Y(0)})` }), tri = g.triangle(O, P, { labels: false, cls: 'turned' });
        grp.appendChild(tri); if (q % 2) recolor(tri);
        g.dot(rot(P, q), 'pt pick', n);
      });
      return `<div class="gk rt-key"><div class="gridbox">${host.innerHTML}</div>`
        + `<div>${ARC(false)} 90°: (x, y) → (−y, x) · P′${pt(rot(P, 1))}</div>`
        + `<div>180°: (x, y) → (−x, −y) · P″${pt(rot(P, 2))}</div>`
        + `<div>${ARC(false)} 270° = ${ARC(true)} 90°: (x, y) → (y, −x)</div>`
        + `<div>A turn keeps lengths, angles, and each point’s distance to the center.</div>`
        + `<div>Minute hand: 6° a minute, clockwise.</div></div>`;
    },

    // ---- tutorial: P(4, 1)'s triangle turns 90° and lands at (−1, 4), one idea per › ----
    tutorial(stage, api) {
      const N = 6;
      stage.innerHTML = `<div class="gq rt"><div class="gridbox"></div><div class="tbtns"><button type="button" class="tb wide">Turn 90° ${ARC(false)}</button></div></div>`;
      const P = TUT_P, P1 = rot(P, 1), P2 = rot(P, 2), b = stage.querySelector('.tb');
      const g = G.make(stage.querySelector('.gridbox'));
      center(g); g.dot(P, 'pt', 'P' + pt(P)); g.triangle(O, P, { labels: true });
      const grp = g.el('g', { class: 'rt-spin' }), tri = g.triangle(O, P, { labels: false, cls: 'turned' }); grp.appendChild(tri);
      let legT = null;
      const nb = t => t.replace(/ /g, '\u00a0');
      const runL = tri.querySelector('.run'), riseL = tri.querySelector('.rise');
      api.step(0, N); api.caption(`P${pt(P)}: run 4, rise 1.`);
      const next = (label, f) => { b.textContent = ''; b.innerHTML = label; b.classList.toggle('wide', label.length > 1); b.disabled = false; b.onclick = () => { if (api.alive()) { b.disabled = true; f(); } }; };
      const steps = [
        async () => {
          await spinTo(g, grp, 0, 1); if (!api.alive()) return;
          g.dot(P1, 'pt ok', 'P′' + pt(P1));
          api.step(1, N); api.caption(`Turned 90° counterclockwise: P′${nb(pt(P1))}.`); go();
        },
        // the old run stands up: it becomes the rise (green); the old rise lies flat, to the left: the run (blue)
        () => { runL.setAttribute('class', 'rise hl'); api.step(2, N); api.caption('The run 4 is now the rise: up 4.'); go(); },
        () => { runL.setAttribute('class', 'rise'); riseL.setAttribute('class', 'run hl'); api.step(3, N); api.caption('The rise 1 is now the run, to the left: −1.'); go(); },
        () => {
          riseL.setAttribute('class', 'run'); legT = g.triangle(O, P1, { labels: true, cls: 'turned rt-leg' });
          api.step(4, N); api.caption(`They swap, and the new run changes sign: ${nb('(x, y) → (−y, x)')}.`); go(`Turn again ${ARC(false)}`);
        },
        async () => {
          await spinTo(g, grp, 1, 2); if (!api.alive()) return;
          runL.setAttribute('class', 'run'); riseL.setAttribute('class', 'rise'); g.remove(legT);
          g.dot(P2, 'pt ok', 'P″' + pt(P2));
          api.step(5, N); api.caption(`Two turns: 180°. Both signs change: P″${nb(pt(P2))}.`); go();
        },
        () => { api.step(6, N); api.done(); }
      ];
      let i = 0;
      function go(label = '›') { const f = steps[i++]; next(label, f); if (label === '›') b.setAttribute('aria-label', 'Next'); else b.removeAttribute('aria-label'); b.focus(); }
      go(`Turn 90° ${ARC(false)}`);
    }
  });
})();
