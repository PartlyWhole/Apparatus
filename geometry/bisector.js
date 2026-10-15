// Perpendicular Bisector (G11) — draw the line through the middle of AB at a right angle to it; every point on it is
// the same distance from A and from B.
// Drawing fades with the item's lvl: 2 = "Where is the middle of AB?" (tap M), then one more point; the half-triangle at M
// turns 90° with a right-angle mark and (tutor rule) a point steps along the line with equal strings to A and B.
// 1 = the same two taps, no turn unless missed. 0 = tap any two points, then Check. First tries are graded (fixed in place).
// equi: which point is the same distance from A and B — with the bisector drawn (easy), or in two parts: first draw
// the bisector (tap M, then a point), then pick the point on it (hard). hv (late): flat and vertical segments.
// Tutorial: tap on the dashed bisector → equal strings; tap off it → unequal.
// Spec: specs/geometry-next.md (G11). Uses lib/grid.js (+ grid-extra.css), lib/steps.js, lib/pick.js; styles lib/bisector.css.
(function () {
  const G = Grid, s = G.sgn, { r, any, shuffle } = Apparatus.util;
  const pt = p => `(${s(p[0])}, ${s(p[1])})`;
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  const same = (p, q) => p[0] === q[0] && p[1] === q[1];
  const cross = (a, b) => a[0] * b[1] - a[1] * b[0], dot = (a, b) => a[0] * b[0] + a[1] * b[1];
  const sub = (p, q) => [p[0] - q[0], p[1] - q[1]], add = (p, q, k = 1) => [p[0] + k * q[0], p[1] + k * q[1]];
  const d2 = (p, q) => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;
  const rt = n => Number.isInteger(Math.sqrt(n)) ? String(Math.sqrt(n)) : '√' + n;
  const VF = { '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾' };
  // the slope of a direction as text: 2, −½, 3/5
  const slopeTxt = v => {
    let n = v[1], d = v[0]; if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d); n /= g; d /= g;
    return d === 1 ? s(n) : (n < 0 ? '−' : '') + (VF[`${Math.abs(n)}/${d}`] || `${Math.abs(n)}/${d}`);
  };
  const mid = it => [(it.a[0] + it.b[0]) / 2, (it.a[1] + it.b[1]) / 2];
  const dirU = it => sub(it.b, it.a);
  // the bisector's direction, as small as it goes on the lattice: AB's run and rise swapped, one sign changed
  const perpDir = it => { const u = dirU(it), g = gcd(u[0], u[1]); return [-u[1] / g, u[0] / g]; };
  const inGrid = (p, n = 6) => Math.abs(p[0]) <= n && Math.abs(p[1]) <= n;
  const mk = (idea, make) => ({ idea, make });

  // ---- items ----
  // { kind: 'draw', a, b, lvl }        draw the perpendicular bisector of AB (lvl 2 | 1 | 0)
  // { kind: 'equi', a, b, line, ch }   which of ch is the same distance from A and B (line: the bisector is drawn)
  // Δ even both ways so M is a lattice point. Easy: AB slope ±1. Hard: bisector slopes ±2, ±½, ±⅓ (never ±1, where
  // "only the sign" and "only flipped" would be right). hv: flat and vertical.
  const EASY = [[2, 2], [4, 4], [2, -2], [4, -4]];
  const HARD = [[4, 2], [4, -2], [2, 4], [2, -4], [2, 6], [2, -6]];
  const HV = [[4, 0], [6, 0], [0, 4], [0, 6]];
  function pair(pool) {
    for (let k = 0; k < 300; k++) {
      let d = any(pool); if (r(0, 1)) d = [-d[0], -d[1]];
      const a = [r(-5, 5), r(-5, 5)], b = add(a, d);
      if (!inGrid(b, 5)) continue;
      const it = { a, b }, M = mid(it), w = perpDir(it);
      // room for a second point on the bisector, and for the turned half-triangle
      if (!inGrid(add(M, w)) && !inGrid(add(M, w, -1))) continue;
      return it;
    }
    return { a: [-3, 2], b: [1, -2] };
  }
  const draw = (pool, lvl) => () => Object.assign(pair(pool), { kind: 'draw', lvl });
  function equi(line) {
    for (let t = 0; t < 200; t++) {
      const it = pair(EASY.concat(HARD)), A = it.a, B = it.b, M = mid(it), w = perpDir(it), u = dirU(it);
      const ons = [-3, -2, -1, 1, 2, 3].map(k => add(M, w, k)).filter(p => inGrid(p, 5) && !same(p, A) && !same(p, B));
      if (!ons.length) continue;
      const right = any(ons), all = [];
      for (let x = -5; x <= 5; x++) for (let y = -5; y <= 5; y++) { const p = [x, y]; if (d2(p, A) !== d2(p, B) && !same(p, A) && !same(p, B)) all.push(p); }
      // "closest-looking": right by the middle; off: further out, on the "only the sign changed" line when there is one
      const near = all.filter(p => d2(p, M) <= 2), off = all.filter(p => d2(p, M) >= 5 && d2(p, M) <= 20);
      const signed = off.filter(p => cross(sub(p, M), [u[0], -u[1]]) === 0);
      if (!near.length || !off.length) continue;
      return { kind: 'equi', a: A, b: B, line, ch: shuffle([right, any([A, B]), any(near), any(signed.length && r(0, 1) ? signed : off)]) };
    }
    return OPEN_EQUI;
  }
  const OPEN = { a: [-3, 2], b: [1, -2] };
  const OPEN_EQUI = { kind: 'equi', a: OPEN.a, b: OPEN.b, line: true, ch: [[0, 0], [-3, 0], [1, -2], [3, 4]] };
  const equal = (it, p) => d2(p, it.a) === d2(p, it.b);
  const wantPt = it => it.ch.find(p => equal(it, p));

  // ---- what a drawn line got wrong (null: it's the bisector) ----
  function lineErr(it, p, q) {
    const d = sub(q, p), u = dirU(it), M = mid(it);
    const onM = cross(sub(M, p), d) === 0, perp = dot(d, u) === 0;
    if (onM && perp) return null;
    if (onM) {
      if (cross(d, u) === 0) return 'along';
      if (cross(d, [u[0], -u[1]]) === 0) return 'sign';
      if (cross(d, [u[1], u[0]]) === 0) return 'flip';
      return 'slope';
    }
    if (perp) return [it.a, it.b].some(e => cross(sub(e, p), d) === 0) ? 'end' : 'miss';
    return 'both';
  }
  function lineSay(it, err, p, q) {
    const u = dirU(it), w = perpDir(it), M = mid(it);
    if (err === 'mid') return `M is halfway: the average of the x’s and of the y’s, ${pt(M)}.`;
    if (err === 'along') return 'That runs along AB; the bisector crosses it at a right angle.';
    if (err === 'sign') return 'Only the sign changed: turned 90°, rise and run swap too.';
    if (err === 'flip') return 'Only flipped: the sign changes too.';
    if (err === 'slope') {
      if (u[1] === 0) return 'Perpendicular to a flat segment is vertical: straight up and down through M.';
      if (u[0] === 0) return 'Perpendicular to a vertical segment is flat: straight across through M.';
      const v = w[0] < 0 ? [-w[0], -w[1]] : w;
      return `Perpendicular to ${slopeTxt(u)} is ${slopeTxt(w)}: from M, ${v[0]} across and ${Math.abs(v[1])} ${v[1] < 0 ? 'down' : 'up'}.`;
    }
    if (err === 'end') { const e = cross(sub(it.a, p), sub(q, p)) === 0 ? 'A' : 'B'; return `That one goes through ${e}; a bisector cuts AB in half, through M.`; }
    if (err === 'miss') return 'At a right angle to AB, but it misses the middle.';
    return 'It misses the middle of AB, and it isn’t at a right angle to AB.';
  }
  function equiSay(it, p) {
    const A = it.a, B = it.b;
    if (same(p, A)) return `That’s A itself: 0 from A but ${rt(d2(A, B))} from B.`;
    if (same(p, B)) return `That’s B itself: 0 from B but ${rt(d2(A, B))} from A.`;
    return `${pt(p)} is ${rt(d2(p, A))} from A but ${rt(d2(p, B))} from B: not the same.`;
  }

  // ---- pictures ----
  const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pause = ms => new Promise(res => setTimeout(res, reduced() ? 0 : ms));
  let STRINGS = true;      // tutor rule: the equal-strings walk
  function picture(host, it) {
    const g = G.make(host);
    g.seg(it.a, it.b);
    g.dot(it.a, 'pt', 'A' + pt(it.a)); g.dot(it.b, 'pt', 'B' + pt(it.b));
    return g;
  }
  const alive = g => g.svg.isConnected;
  // the half-triangle from M to an end turns 90° about M onto the bisector; a right-angle mark at M
  function turnShow(g, it) {
    return new Promise(res => {
      const M = mid(it), rot = v => [-v[1], v[0]];
      const E = [it.b, it.a].find(e => inGrid(add(M, rot(sub(e, M))))) || it.b, v = sub(E, M);
      g.triangle(M, E, { labels: true });
      const grp = g.el('g', {}), tri = g.triangle(M, E, { labels: false, cls: 'turned' }); grp.appendChild(tri);
      setTimeout(() => {
        if (!alive(g)) return res();
        g.turn(grp, M, () => {
          g.remove(tri); grp.remove();
          if (!alive(g)) return res();
          g.triangle(M, add(M, rot(v)), { labels: true, cls: 'turned' });
          g.rightMark(M, v, rot(v), 'rmark ok');
          res();
        });
      }, reduced() ? 0 : 350);
    });
  }
  // a point steps along the bisector from M; its dashed strings to A and B stay the same length
  async function walk(g, it) {
    const M = mid(it), w = perpDir(it), dir = inGrid(add(M, w)) ? 1 : -1;
    const ks = [1, 2, 3].map(k => add(M, w, k * dir)).filter(p => inGrid(p) && !same(p, it.a) && !same(p, it.b));
    let cur = [];
    for (let i = reduced() ? ks.length - 1 : 0; i < ks.length; i++) {
      if (!alive(g)) return;
      cur.forEach(n => g.remove(n));
      cur = [g.strings(ks[i], it.a, it.b, 'ok'), g.dot(ks[i], 'pt pick')];
      await pause(650);
    }
  }
  // after the line: why it's the perpendicular bisector, one idea per tap of ›, each step clearing the last
  //   1. through the middle   2. at a right angle (the half-triangle turns 90°)   3. every point on it: the same distance
  function explain(el, g, it) {
    const M = mid(it), w = perpDir(it), rot = v => [-v[1], v[0]];
    const host = el.querySelector('.gq'); if (!host || el.querySelector('.bs-why')) return;
    el.querySelectorAll('.st-text, .gq.bs > .q.small').forEach(t => { t.style.display = 'none'; });   // the prompts are done
    host.insertAdjacentHTML('beforeend', '<div class="bs-why"><p class="q small bs-cap"></p><button type="button" class="tb bs-next" aria-label="next">›</button></div>');
    const cap = el.querySelector('.bs-cap'), btn = el.querySelector('.bs-next');
    let shown = [], i = 0;
    const clear = () => { shown.forEach(n => g.remove(n)); shown = []; };
    const steps = [
      () => { cap.textContent = 'It goes through the middle of AB.'; shown.push(ring(g, M)); },
      () => new Promise(res => {
        cap.textContent = 'It crosses AB at a right angle.';
        const E = [it.b, it.a].find(e => inGrid(add(M, rot(sub(e, M))))) || it.b, v = sub(E, M);
        const t1 = g.triangle(M, E, { labels: true }); shown.push(t1);
        const grp = g.el('g', {}), tri = g.triangle(M, E, { labels: false, cls: 'turned' }); grp.appendChild(tri);
        setTimeout(() => {
          if (!alive(g)) return res();
          g.turn(grp, M, () => {
            g.remove(tri); grp.remove();
            if (!alive(g)) return res();
            shown.push(g.triangle(M, add(M, rot(v)), { labels: true, cls: 'turned' }), g.rightMark(M, v, rot(v), 'rmark ok'));
            res();
          });
        }, reduced() ? 0 : 500);
      }),
      () => {
        cap.textContent = 'Any point on it is the same distance from A and B.';
        const P = [2, 1, -1, -2].map(k => add(M, w, k)).find(p => inGrid(p, 5) && !same(p, it.a) && !same(p, it.b)) || add(M, w);
        shown.push(g.strings(P, it.a, it.b, 'ok'), g.dot(P, 'pt pick'));
      }
    ];
    const go = async () => {
      btn.disabled = true; clear();
      await steps[i++]();
      btn.disabled = false;
      if (i === steps.length) btn.remove();
    };
    btn.addEventListener('click', go);
    go();
  }
  function ring(g, p) { return g.el('circle', { cx: g.X(p[0]), cy: g.Y(p[1]), r: 9, class: 'bs-ring' }); }

  // ---- the answer areas ----
  // lvl 2 and 1: tap M, then one more point (Steps: first tries graded, fixed in place)
  // the two drawing steps: tap M, then one more point on the bisector (first tries graded, fixed in place); x holds the picture
  function lineSteps(g, it, x) {
    const M = mid(it);
    let red = null, bad = null;
    const clean = () => { if (red) { red.forEach(n => g.remove(n)); red = null; } };
    return [
      { text: 'Where is the middle of AB?', tap: () => new Promise(res => {
        clean();
        const stop = g.onTap(q => {
          if (same(q, it.a) || same(q, it.b)) return;
          stop();
          if (same(q, M)) { g.dot(M, 'pt ok', 'M' + pt(M)); return res({ ok: true, value: q }); }
          red = [g.dot(q, 'pt no')]; if (!x.mTap) x.mTap = q;
          res({ ok: false, err: 'mid', sentence: lineSay(it, 'mid') });
        });
      }) },
      { text: 'Tap one more point on the perpendicular bisector.', tap: () => new Promise(res => {
        clean();
        const stop = g.onTap(q => {
          if (same(q, M)) return;
          stop();
          const err = lineErr(it, M, q), ln = g.line(M, q, err ? 'ln no' : 'ln b'), d = g.dot(q, err ? 'pt no' : 'pt pick');
          if (!err) { x.good = ln; return res({ ok: true, value: q }); }
          red = [ln, d]; if (!bad) bad = x.bad = [M, q];
          res({ ok: false, err, sentence: lineSay(it, err, M, q) });
        });
      }) }
    ];
  }
  function drawSteps(el, it, lvl, submit) {
    el.innerHTML = '<div class="gq bs"><div class="gridbox"></div><div class="bs-steps"></div></div>';
    const g = picture(el.querySelector('.gridbox'), it), x = el._x = { g, lvl, it };
    Steps.run(el.querySelector('.bs-steps'), lineSteps(g, it, x), { grid: g, done: errs => submit({ lvl, errs }) });
  }
  // lvl 0: tap any two points (tap one again to take it back), then Check
  function drawFree(el, it, submit) {
    el.innerHTML = `<div class="gq bs"><div class="gridbox"></div><div class="q small">Tap two points on the perpendicular bisector of AB.</div><button type="button" class="go" disabled>Check</button></div>`;
    const g = picture(el.querySelector('.gridbox'), it), go = el.querySelector('.go');
    el._x = { g, lvl: 0, it };
    const d = g.drawLine({ cls: 'ln b', onChange: (p, q) => { go.disabled = !(p && q); } });
    go.addEventListener('click', () => {
      const [p, q] = d.points(); if (!q) return;
      d.stop(); go.disabled = true;
      const err = lineErr(it, p, q);
      el._x.bad = err ? [p, q] : null;
      submit({ lvl: 0, line: [p, q], errs: err ? [{ type: err, text: lineSay(it, err, p, q), step: 0 }] : [] });
    });
  }
  function askEqui(el, it, submit) {
    if (!it.line) return askEqui2(el, it, submit);
    el.innerHTML = `<div class="gq bs"><div class="gridbox"></div><div class="q small">Which point is the same distance from A and B?</div><div class="bs-ch"></div></div>`;
    const g = picture(el.querySelector('.gridbox'), it), M = mid(it);
    if (it.line) g.line(M, add(M, perpDir(it)), 'ln faint');
    el._x = { g, it };
    Pick.ask(el.querySelector('.bs-ch'), it.ch.map((p, i) => [i, pt(p)]), id => submit({ id: +id, p: it.ch[+id] }), { cols: 2 });
  }

  // two parts: first the perpendicular bisector, then the point on it (the same distance from A and B)
  function askEqui2(el, it, submit) {
    el.innerHTML = '<div class="gq bs"><div class="gridbox"></div><div class="bs-steps"></div></div>';
    const g = picture(el.querySelector('.gridbox'), it), x = el._x = { g, lvl: 1, it, two: true };
    let picked = null;
    const steps = [{ text: 'First, the perpendicular bisector of AB.' }, ...lineSteps(g, it, x), {
      text: 'Which point is the same distance from A and B?', pick: it.ch.map((p, i) => [String(i), pt(p)]), cols: 2,
      want: String(it.ch.indexOf(wantPt(it))), name: 'pick',
      why: id => { const p = it.ch[+id]; return [same(p, it.a) || same(p, it.b) ? 'endpt' : d2(p, mid(it)) <= 2 ? 'near' : 'off', equiSay(it, p)]; },
      onRight: v => { picked = v; }
    }];
    Steps.run(el.querySelector('.bs-steps'), steps, { grid: g, done: errs => { const R0 = wantPt(it); submit({ two: true, p: R0, id: it.ch.indexOf(R0), errs }); } });
  }
  const DIR = ['along', 'sign', 'flip', 'slope', 'both'];
  const TIPS = {
    mid: ['Can’t find the middle of the segment.', 'Average the x’s and the y’s: ((x₁ + x₂) ÷ 2, (y₁ + y₂) ÷ 2). Or count halfway along the run and the rise.'],
    along: ['Draws the line along the segment instead of across it.', 'The bisector crosses AB at a right angle. Turn AB’s slope triangle 90° at M.'],
    sign: ['Only changes the sign of the slope.', 'Turned 90°, rise and run swap AND one sign changes (½ → −2). Check: the slopes multiply to −1.'],
    flip: ['Only flips the slope.', 'Flip AND change the sign. Check: the slopes multiply to −1.'],
    slope: ['Gets the perpendicular slope wrong.', 'Find AB’s slope (rise over run), flip it and change the sign, then count that run and rise from M.'],
    end: ['Draws the perpendicular through an end of the segment.', 'Bisect means cut in half: the line goes through the middle M, not through A or B.'],
    miss: ['Gets the right angle but misses the middle.', 'Find M first (average the coordinates), then count the slope from M.'],
    both: ['Misses both the middle and the right angle.', 'Two steps, in order: find M, then turn AB’s slope 90° (flip and change sign) and count from M.'],
    near: ['Picks the point that looks closest to the middle.', 'The same distance means on the perpendicular bisector. Draw it, or work out run² + rise² to A and to B and compare.'],
    endpt: ['Picks an end of the segment.', 'A is 0 from A but far from B. The point must be equally far from both: on the perpendicular bisector.'],
    off: ['Picks a point off the perpendicular bisector.', 'Draw the bisector (through M, at a right angle) and find the point on it; or compare run² + rise² to A and to B.']
  };

  Apparatus.define({
    id: 'geo-bisector',
    title: 'Perpendicular Bisector',
    ideas: {
      draw: { name: 'Draw the perpendicular bisector', easy: ['draw-steps'], hard: ['draw-one', 'draw'], check: 'draw' },
      equi: { name: 'Same distance from both ends', easy: ['equi-line'], hard: ['equi', 'equi'], check: 'equi' },
      hv:   { name: 'Flat and vertical segments', easy: ['hv-steps'], hard: ['hv'], late: true, check: 'hv' }
    },
    kinds: {
      'draw-steps': mk('draw', draw(EASY, 1)), 'draw-one': mk('draw', draw(HARD, 1)), draw: mk('draw', draw(HARD, 0)),
      'equi-line': mk('equi', () => equi(true)), equi: mk('equi', () => equi(false)),
      'hv-steps': mk('hv', draw(HV, 1)), hv: mk('hv', draw(HV, 0))
    },
    // the contrast set on one segment: draw its bisector (full scaffold), then which point is equally far from A and B
    opening: [
      { kind: 'draw-steps', item: { kind: 'draw', a: OPEN.a, b: OPEN.b, lvl: 2 } },
      { kind: 'equi-line', item: OPEN_EQUI }
    ],
    nextOnRight: true,
    defaults: { fix: 1 },
    rules: [['strings', 'Equal-strings animation', [[true, 'On'], [false, 'Off']], 'After the first bisector, and after a missed one, a point steps along the line with dashed strings to A and B — always the same length.']],
    configure(S) { STRINGS = S.strings !== false; return {}; },
    text: it => it.kind === 'equi' ? `same distance from A${pt(it.a)} and B${pt(it.b)}${it.line ? ' (line drawn)' : ''}: ${it.ch.map(pt).join(' ')}`
      : `⟂ bisector of A${pt(it.a)} B${pt(it.b)}${it.lvl ? ' (steps)' : ''}`,
    speak: it => it.kind === 'equi' ? `A is at ${pt(it.a)} and B at ${pt(it.b)}. Which point is the same distance from A and B?`
      : `A is at ${pt(it.a)} and B at ${pt(it.b)}. Draw the perpendicular bisector of AB.`,
    ask(el, it, submit, ctx) {
      el._x = null;
      if (it.kind === 'equi') return askEqui(el, it, submit);
      const lvl = ctx && ctx.mode === 'warm' ? 0 : it.lvl ?? 1;
      (lvl ? drawSteps(el, it, lvl, submit) : drawFree(el, it, submit));
    },
    correct: it => it.kind === 'equi' ? pt(wantPt(it)) : `through M${pt(mid(it))}, ${dirU(it)[1] === 0 ? 'vertical' : dirU(it)[0] === 0 ? 'flat' : 'slope ' + slopeTxt(perpDir(it))}`,
    isRight: (it, a) => it.kind === 'equi' ? equal(it, a.p) && !(a.errs || []).length : a.errs.length === 0,
    classify(it, a) {
      if (it.kind === 'draw' || (a.errs && a.errs.length)) return a.errs[0].type;
      return same(a.p, it.a) || same(a.p, it.b) ? 'endpt' : d2(a.p, mid(it)) <= 2 ? 'near' : 'off';
    },
    feedback: (it, w, a) => ['pic', it.kind === 'equi' && !(a.errs && a.errs.length) ? equiSay(it, a.p) : a.errs[0].text],
    reveal(el, it, a, o) {
      const x = el._x; if (!x) return;
      const g = x.g, M = mid(it), w = perpDir(it);
      if (it.kind === 'equi' && a.two) {
        // two parts: the bisector is drawn; show the equal strings from the point on it
        if (x.good) x.good.setAttribute('class', 'ln ok');
        const R = wantPt(it); g.strings(R, it.a, it.b, 'ok'); g.dot(R, 'pt ok');
        return;
      }
      if (it.kind === 'equi') {
        Pick.mark(el, o.right ? null : it.ch.indexOf(wantPt(it)), a.id, o.right);
        if (!it.line && !o.right) g.line(M, add(M, w), 'ln faint');
        if (!o.right) { g.strings(a.p, it.a, it.b, 'no'); g.dot(a.p, 'pt no'); }
        const R = wantPt(it); g.strings(R, it.a, it.b, 'ok'); g.dot(R, 'pt ok');
        return;
      }
      if (x.good) x.good.setAttribute('class', 'ln ok');
      if (o.right) {
        if (x.lvl === 2) explain(el, g, it);
        return;
      }
      // the cue: the first wrong line red, the bisector green, M ringed
      const err = a.errs[0].type;
      if (x.lvl === 0) { const s0 = g.svg.querySelector('.g-draw line.ln.b'); if (s0) s0.setAttribute('class', 'ln no'); }
      else if (x.bad) g.line(x.bad[0], x.bad[1], 'ln no');
      if (!x.good) x.good = g.line(M, add(M, w), 'ln ok faint');
      if (x.lvl === 0) g.dot(M, 'pt ok', 'M' + pt(M));
      if (err === 'mid' && x.mTap) g.dot(x.mTap, 'pt no');
      ring(g, M);
      const turn = x.lvl === 2 || DIR.includes(a.errs.find(e => e.type !== 'mid')?.type || '');
      if (turn || STRINGS) explain(el, g, it);
    },
    errors: {
      mid: 'missed the middle', along: 'drew it along AB', sign: 'only changed the sign', flip: 'only flipped', slope: 'wrong perpendicular slope',
      end: 'through an end, not the middle', miss: 'right angle, missed the middle', both: 'missed the middle and the right angle',
      near: 'picked the closest-looking point', endpt: 'picked an end (A or B)', off: 'picked a point off the bisector'
    },
    diagnose: err => TIPS[err] || ['', ''],
    get keyHTML() {
      const host = document.createElement('div'), it = OPEN, g = picture(host, it), M = mid(it);
      g.line(M, add(M, perpDir(it)), 'ln b'); g.dot(M, 'pt ok', 'M' + pt(M));
      g.rightMark(M, sub(it.b, M), perpDir(it), 'rmark');
      g.strings([3, 4], it.a, it.b);
      return `<div class="gk"><div class="gridbox">${host.innerHTML}</div><div>through the middle M (average the x’s and the y’s)</div>`
        + `<div>at a right angle: flip AB’s slope and change the sign</div><div>every point on it is the same distance from A and B</div></div>`;
    },

    // ---- tutorial: tap on the dashed bisector (equal strings), then off it (unequal) ----
    tutorial(stage, api) {
      api.step(0, 2); api.caption('Tap a point on the dashed line.');
      stage.innerHTML = `<div class="gq bs"><div class="gridbox"></div><div class="tbtns"><button type="button" class="tb" aria-label="Next" hidden>›</button></div></div>`;
      const it = OPEN, g = picture(stage.querySelector('.gridbox'), it), M = mid(it), b = stage.querySelector('.tb');
      g.line(M, add(M, perpDir(it)), 'ln faint'); g.dot(M, 'pt ok', 'M');
      g.rightMark(M, sub(it.b, M), perpDir(it), 'rmark');
      let on = false, cur = [];
      const stop = g.onTap(q => {
        if (!api.alive()) return stop();
        if (same(q, it.a) || same(q, it.b) || same(q, M)) return;
        cur.forEach(n => g.remove(n));
        const eq = equal(it, q), da = rt(d2(q, it.a)), db = rt(d2(q, it.b));
        cur = [g.strings(q, it.a, it.b, eq ? 'ok' : 'no'), g.dot(q, 'pt pick', 'P')];
        if (eq) {
          on = true; api.step(1, 2);
          api.caption(`PA ${da} · PB ${db}: the same. Now tap a point off the line.`);
        } else if (!on) api.caption(`PA ${da} · PB ${db}: not the same. Tap a point on the dashed line.`);
        else {
          stop(); api.step(2, 2);
          api.caption(`PA ${da} · PB ${db}: not the same. Only points on the bisector are equally far from A and B.`);
          b.hidden = false; b.focus();
        }
      });
      b.addEventListener('click', () => { if (api.alive()) api.done(); }, { once: true });
    }
  });
})();
