// Classify the Quadrilateral (G12) — one picture, three tests, then the name.
//   ∥  same slope triangle                 (opposite sides AB, DC and AD, BC)
//   ⟂  the triangle turned 90° (product −1) (AB and BC, the corner at B)
//   =  the same length d, even with different legs: 5, 0 and 3, 4 are both 5
// Tree: two ∥ pairs → parallelogram (+ right angle: rectangle, + equal sides: rhombus, both: square); exactly one → trapezoid.
// It starts by eye (lvl 'look'): a plain drawing, no grid or numbers, pick the name; a miss draws the markings
// (ticks on equal sides, arrows on parallel sides, right-angle boxes). Then the most specific name wins, by the numbers.
// Scaffolding fades with item.lvl ('v' = the first coordinates-only item: slopes of all four sides, the parallel
// questions, the corner, the lengths, then the name):
//   2 = one comparison per question ("Is AB parallel to DC?", "Is AD parallel to BC?", the angle at B, AB vs BC):
//       its two sides lit on the shape, their slope triangles side by side under it; then the name (the opening)
//   1 = the grid (zoomed to the shape), the name   0 = the vertices as text only (like the test's Q20), the name
// A wrong name: the deciding sides lit + their triangles side by side + one sentence on the first property the PICKED
// name gets wrong. Nothing but the shape and its corner letters on the grid (coordinates in the legend).
// Shapes are P, P+u, P+u+v, P+v (a trapezoid: P, P+a·w, P+v+b·w, P+v). Spec: specs/geometry-next.md (G12).
// Uses lib/grid.js (+ grid-extra.css), lib/frac.js, lib/pick.js, lib/steps.js (+ steps.css); styles lib/quad.css.
(function () {
  const G = Grid, F = Frac, s = G.sgn;
  const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), any = a => a[r(0, a.length - 1)];
  const pt = p => `(${s(p[0])}, ${s(p[1])})`;
  const add = (p, w, k = 1) => [p[0] + w[0] * k, p[1] + w[1] * k], sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
  const dot = (u, v) => u[0] * v[0] + u[1] * v[1], cross = (u, v) => u[0] * v[1] - u[1] * v[0], len2 = w => dot(w, w);
  const rot = (w, k = 1) => k > 0 ? [-w[1], w[0]] : [w[1], -w[0]];
  const plain = h => h.replace(/<[^>]+>/g, '');

  // ---- the shapes ----
  const NAMES = { square: 'Square', rect: 'Rectangle', rhombus: 'Rhombus', pgram: 'Parallelogram', trap: 'Trapezoid' };
  const word = n => NAMES[n].toLowerCase();
  const props = {
    square: { two: true, perp: true, eq: true }, rect: { two: true, perp: true, eq: false },
    rhombus: { two: true, perp: false, eq: true }, pgram: { two: true, perp: false, eq: false }, trap: { two: false }
  };
  // what a name needs (the most specific name wins, so Rhombus doesn't rule out right angles; Square is the name then)
  const needs = { square: ['perp', 'eq'], rect: ['perp'], rhombus: ['eq'], pgram: [], trap: [] };
  // the first deciding property the picked name gets wrong: ∥ pairs, then the angle, then the sides.
  // claim: the pick needs it and the shape doesn't have it · miss: the shape has it and the pick doesn't say so
  function decide(shape, pick) {
    const P = props[shape];
    if (P.two !== props[pick].two) return { prop: 'pairs', how: pick === 'trap' ? 'claim' : 'miss' };
    for (const k of ['perp', 'eq']) if (needs[pick].includes(k) && !P[k]) return { prop: k, how: 'claim' };
    for (const k of ['perp', 'eq']) if (P[k] && !needs[pick].includes(k)) return { prop: k, how: 'miss' };
    return { prop: 'eq', how: 'miss' };
  }

  // an item: { shape, v: [A, B, C, D], lvl }. Sides as directions: AB, DC (D→C), AD, BC (B→C).
  const sides = it => { const [A, B, C, D] = it.v; return { AB: sub(B, A), DC: sub(C, D), AD: sub(D, A), BC: sub(C, B) }; };
  const ENDS = { AB: [0, 1], DC: [3, 2], AD: [0, 3], BC: [1, 2] };

  // fit the corners (offsets from A) on the grid, within ±4 (the grid runs ±5)
  function place(offs) {
    const xs = offs.map(o => o[0]), ys = offs.map(o => o[1]);
    const x0 = -4 - Math.min(...xs), x1 = 4 - Math.max(...xs), y0 = -4 - Math.min(...ys), y1 = 4 - Math.max(...ys);
    if (x0 > x1 || y0 > y1) return null;
    const A = [r(x0, x1), r(y0, y1)];
    return offs.map(o => add(A, o));
  }
  const flip = w => any([w, [-w[0], w[1]], [w[0], -w[1]], [-w[0], -w[1]]]);
  const TILT = [[2, 1], [1, 2], [1, 1], [3, 1], [1, 3]];
  function pgramFrom(shape, u, v, lvl) {
    if (cross(u, v) < 0) v = [-v[0], -v[1]];             // counterclockwise A, B, C, D
    const vs = place([[0, 0], u, add(u, v), v]);
    return vs && { shape, v: vs, lvl };
  }
  const tries = f => { for (let k = 0; k < 200; k++) { const it = f(); if (it) return it; } return null; };
  const make = {
    square: lvl => tries(() => { const u = flip(any(TILT)); return pgramFrom('square', u, rot(u, any([1, -1])), lvl); }),
    rect: lvl => tries(() => {
      const b = flip(any([[2, 1], [1, 2], [1, 1], [1, 3], [3, 1]])), [k1, k2] = any([[1, 2], [2, 1]]);
      return pgramFrom('rect', add([0, 0], b, k1), add([0, 0], rot(b, any([1, -1])), k2), lvl);
    }),
    // the flip-only (or sign-only) partner: same length, looks square, not turned
    swap: lvl => tries(() => { const [a, b] = any([[2, 1], [3, 1], [3, 2]]), u = flip([a, b]); const v = any([[u[1], u[0]], [u[0], -u[1]]]); return pgramFrom('rhombus', u, v, lvl); }),
    // equal sides with different legs: 5, 0 and 3, 4
    legs: lvl => tries(() => {
      const t = any([[3, 4], [4, 3], [-3, 4], [-4, 3]]), [u, v] = any([[[5, 0], t], [t, [5, 0]]]);
      return pgramFrom('rhombus', u, v, lvl);
    }),
    pgram: lvl => tries(() => {
      const u = flip(any([[2, 1], [1, 2], [3, 1], [2, 0], [3, 0], [1, 1], [4, 1]])), v = flip(any([[1, 2], [1, 3], [2, 3], [1, 1], [2, 1]]));
      if (Math.abs(cross(u, v)) < 3 || dot(u, v) === 0 || len2(u) === len2(v)) return null;
      return pgramFrom('pgram', u, v, lvl);
    }),
    // one ∥ pair: AB = a·w, DC = b·w (a ≠ b); AD and BC slanted, never vertical
    trap: lvl => tries(() => {
      const w = flip(any([[1, 0], [2, 0], [2, 1], [1, 1], [3, 1]])), [a, b] = any([[1, 2], [2, 1], [1, 3], [3, 1], [2, 3], [3, 2]]);
      const v = flip(any([[1, 2], [1, 3], [2, 3], [-1, 2], [1, 1], [2, 1]]));
      const cr = cross(w, v); if (Math.abs(cr) < 2) return null;
      const vv = cr < 0 ? [-v[0], -v[1]] : v, bc = sub(add(vv, w, b), add([0, 0], w, a));
      if (!bc[0] || !bc[1] || !vv[0] || !vv[1]) return null;
      const vs = place([[0, 0], add([0, 0], w, a), add(vv, w, b), vv]);
      return vs && { shape: 'trap', v: vs, lvl };
    })
  };

  // ---- numbers in words ----
  const VF = { '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾', '1/5': '⅕', '2/5': '⅖', '3/5': '⅗', '4/5': '⅘', '1/6': '⅙', '5/6': '⅚', '1/8': '⅛', '3/8': '⅜', '5/8': '⅝', '7/8': '⅞' };
  const slope = w => F.of(w[1], w[0]);
  const sl = w => { const t = F.text(slope(w)), m = /^(−?)(\d+\/\d+)$/.exec(t); return m && VF[m[2]] ? m[1] + VF[m[2]] : t; };
  const par = t => /^−/.test(t) ? `(${t})` : t;
  const lenText = n => Number.isInteger(Math.sqrt(n)) ? String(Math.sqrt(n)) : `√${n}`;
  const sq = w => `${Math.abs(w[0])}² + ${Math.abs(w[1])}²`;
  // the ⟂ test on AB and BC, worked: "½ × (−2) = −1" or "½ × 2 isn’t −1"
  function perpWork(u, v) {
    const p = dot(u, v) === 0, fl = w => w[1] === 0, up = w => w[0] === 0;
    if (fl(u) || up(u) || fl(v) || up(v)) {
      const [a, b, x, y] = fl(u) || up(u) ? ['AB', 'BC', u, v] : ['BC', 'AB', v, u];
      return `${a} is ${fl(x) ? 'flat' : 'vertical'} ${p ? 'and' : 'but'} ${b} ${p ? 'is' : 'isn’t'} ${fl(x) ? 'vertical' : 'flat'}`;
    }
    return `${sl(u)} × ${par(sl(v))} ${p ? '=' : 'isn’t'} −1`;
  }

  // ---- the sentence for a wrong name: the first deciding property the pick gets wrong ----
  function nameSay(it, pick) {
    const S = sides(it), d = decide(it.shape, pick), u = S.AB, v = S.BC, la = len2(u), lb = len2(v);
    if (d.prop === 'pairs') return d.how === 'miss'
      ? `Only AB and DC are parallel; AD and BC have slopes ${sl(S.AD)} and ${sl(S.BC)}.`
      : `Both pairs are parallel: AB ∥ DC (slope ${sl(u)}) and AD ∥ BC (slope ${sl(v)}), so not a trapezoid.`;
    if (d.prop === 'perp' && d.how === 'claim') return `AB and BC aren’t at a right angle: ${perpWork(u, v)}, so not a ${word(pick)}.`;
    if (d.prop === 'perp') {
      if (pick === 'rhombus') return `It has right angles too (${perpWork(u, v)}): a rhombus with right angles is a square.`;
      if (it.shape === 'square') return `It has right angles (${perpWork(u, v)}) and its sides are all ${lenText(la)}: a square.`;
      return `It has right angles (${perpWork(u, v)}): a parallelogram with right angles is a rectangle.`;
    }
    if (d.how === 'claim') return `AB is ${lenText(la)} but BC is ${lenText(lb)}: the sides aren’t all equal.`;
    const legs = Math.abs(u[0]) !== Math.abs(v[0]) && Math.abs(u[0]) !== Math.abs(v[1]) ? ` (${sq(u)} = ${sq(v)})` : '';
    return `AB and BC are both ${lenText(la)}${legs}: a ${pick === 'rect' ? 'rectangle' : 'parallelogram'} with equal sides is a ${it.shape === 'square' ? 'square' : 'rhombus'}.`;
  }
  // the sentences for a wrong yes/no step (lvl 2)
  const stepSay = {
    pairs: (it, a, k1 = 'AD', k2 = 'BC') => { const S = sides(it); return a === 'y' ? `${k1} and ${k2} have different triangles: slopes ${sl(S[k1])} and ${sl(S[k2])}.` : `${k1} and ${k2} have the same triangle: both slope ${sl(S[k1])}.`; },
    perp: (it, a) => { const S = sides(it); return a === 'y' ? `BC’s triangle isn’t AB’s turned 90°: ${perpWork(S.AB, S.BC)}.` : `BC’s triangle is AB’s turned 90°: ${perpWork(S.AB, S.BC)}.`; },
    eq: (it, a) => {
      const S = sides(it), la = len2(S.AB), lb = len2(S.BC);
      return a === 'y' ? `${sq(S.AB)} = ${la} but ${sq(S.BC)} = ${lb}: AB is ${lenText(la)}, BC is ${lenText(lb)}.` : `${sq(S.AB)} = ${sq(S.BC)} = ${la}: both are ${lenText(la)}.`;
    }
  };

  // ---- the picture ----
  // the shape, zoomed to fit, with lettered corners (coordinates in the legend). g.hi(['AB', 'DC']) lights the sides
  // a question is about; their slope triangles go in the comparison panel (cmpHTML), never on the grid.
  function picture(host, it) {
    const xs = it.v.flatMap(p => p), lo0 = Math.min(...xs) - 1, hi0 = Math.max(...xs) + 1, grow = Math.max(0, 6 - (hi0 - lo0));
    const lo = lo0 - Math.floor(grow / 2), hi = hi0 + Math.ceil(grow / 2);
    const g = G.make(host, { min: lo, max: hi }), L = 'ABCD';
    g.poly(it.v, 'pg');
    it.v.forEach((p, i) => g.dot(p, 'pt', L[i] + pt(p)));
    let lit = [];
    g.hi = (keys = []) => {
      lit.forEach(n => g.remove(n));
      lit = keys.map(k => { const [i, j] = ENDS[k]; return g.seg(it.v[i], it.v[j], 'sg q-hi'); });
    };
    return g;
  }
  // two sides' slope triangles side by side, each from its first letter to its second: run (blue), rise (green), the side
  function triSVG(k, w, o = {}) {
    const run = w[0], rise = w[1], m = Math.max(Math.abs(run), Math.abs(rise), 1), u = Math.min(30, 76 / m);
    const P = [0, 0], C = [run * u, 0], Q = [run * u, -rise * u], xs = [0, C[0]], ys = [0, Q[1]];
    const x0 = Math.min(...xs) - 26, x1 = Math.max(...xs) + 26, y0 = Math.min(...ys) - 14, y1 = Math.max(...ys) + 20;
    const R0 = run >= 0 ? 1 : -1, T = (x, y, c, a, t) => `<text x="${x}" y="${y}" class="${c}" text-anchor="${a}">${t}</text>`;
    let b = `<path class="k-hyp" d="M0 0L${Q[0]} ${Q[1]}"/>`;
    if (run) b += `<path class="k-run" d="M0 0H${C[0]}"/>` + T(C[0] / 2, rise > 0 ? 16 : -7, 'k-rl', 'middle', s(run));
    if (rise) b += `<path class="k-rise" d="M${C[0]} 0V${Q[1]}"/>` + T(C[0] + 7 * R0, Q[1] / 2 + 4, 'k-ri', R0 > 0 ? 'start' : 'end', s(rise));
    if (o.d) b += T(Q[0] / 2 - 8 * R0, Q[1] / 2 - 4, 'k-dl', R0 > 0 ? 'end' : 'start', o.d);
    return `<figure class="cmp-t"><figcaption>${k}</figcaption><svg viewBox="${x0} ${y0} ${x1 - x0} ${y1 - y0}" width="${x1 - x0}" height="${y1 - y0}" style="width:${x1 - x0}px;height:${y1 - y0}px" aria-hidden="true">${b}</svg></figure>`;
  }
  const cmpHTML = (it, keys, o = {}) => { const S = sides(it); return `<div class="cmp">${keys.map(k => triSVG(k, S[k], { d: o.d ? lenText(len2(S[k])) : '' })).join('')}</div>`; };
  // the cue after a wrong name: the deciding sides lit, their triangles side by side
  function cue(el, g, it, prop) {
    const S = sides(it), B = it.v[1], keys = prop === 'pairs' ? ['AD', 'BC'] : ['AB', 'BC'];
    g.hi(keys);
    if (prop === 'perp' && dot(S.AB, S.BC) === 0) g.rightMark(B, sub(it.v[0], B), S.BC, 'rmark ok');
    const p = el.querySelector('.quad-p'); if (p) p.innerHTML = cmpHTML(it, keys, { d: prop === 'eq' });
  }

  // ---- by eye (lvl 'look'): a plain drawing of the shape, then its markings after a miss ----
  // shapes as corners A, B, C, D (counterclockwise) in plain units; tilt turns them (a turned square is still a square)
  const LOOK = {
    square:  () => [[0, 0], [1, 0], [1, 1], [0, 1]],
    rect:    () => [[0, 0], [1.8, 0], [1.8, 1], [0, 1]],
    rhombus: tilt => tilt ? [[0, 0], [1.2, 0], [1.2 + 0.6, 1.04], [0.6, 1.04]] : [[0, -1], [0.7, 0], [0, 1], [-0.7, 0]],
    pgram:   () => [[0, 0], [1.7, 0], [2.3, 1], [0.6, 1]],
    trap:    tilt => tilt ? [[0, 0], [2, 0], [1.4, 1], [0, 1]] : [[0, 0], [2.2, 0], [1.6, 1], [0.6, 1]]
  };
  const turn = (pts, deg) => { const a = deg * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a); return pts.map(([x, y]) => [x * c - y * sn, x * sn + y * c]); };
  function lookItem(tilt) {
    const shape = any(Object.keys(NAMES).filter(n => PG || n !== 'pgram'));
    let v = LOOK[shape](tilt);
    if (tilt) v = turn(v, shape === 'square' ? 45 : any([1, -1]) * r(15, 35));
    return { shape, v, lvl: 'look' };
  }
  const near = (a, b) => Math.abs(a - b) < 1e-6;
  function lookSVG(it, marks) {
    const xs = it.v.map(p => p[0]), ys = it.v.map(p => p[1]), w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
    const k = 200 / Math.max(w, h * 1.25), P = it.v.map(([x, y]) => [(x - Math.min(...xs)) * k + 30, (Math.max(...ys) - y) * k + 30]);
    const W = w * k + 60, H = h * k + 60, path = P.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('') + 'Z';
    let m = '';
    if (marks) {
      const side = i => [P[i], P[(i + 1) % 4]], L = i => { const [a, b] = side(i); return Math.hypot(b[0] - a[0], b[1] - a[1]); };
      const dir = i => { const [a, b] = side(i); return [b[0] - a[0], b[1] - a[1]]; };
      const par = (i, j) => near(dir(i)[0] * dir(j)[1] - dir(i)[1] * dir(j)[0], 0);
      // ticks: sides of equal length share a count (1 or 2)
      const groups = []; [0, 1, 2, 3].forEach(i => { const g = groups.find(g => near(L(g[0]) / L(i), 1)); g ? g.push(i) : groups.push([i]); });
      groups.filter(g => g.length > 1).forEach((g, n) => g.forEach(i => {
        const [a, b] = side(i), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, d = dir(i), l = L(i), ux = d[0] / l, uy = d[1] / l;
        for (let t = 0; t <= n; t++) { const o = (t - n / 2) * 6; m += `<path class="lk-mark" d="M${mx + ux * o - uy * 7} ${my + uy * o + ux * 7}L${mx + ux * o + uy * 7} ${my + uy * o - ux * 7}"/>`; }
      }));
      // arrows: each parallel pair (1 or 2 chevrons)
      [[0, 2], [1, 3]].filter(([i, j]) => par(i, j)).forEach(([i, j], n) => [i, j].forEach(q => {
        const [a, b] = side(q), d = dir(q), l = L(q), ux = d[0] / l, uy = d[1] / l, f = q === j ? -1 : 1;   // both arrows point the same way
        for (let t = 0; t <= n; t++) { const c = 0.2 + t * 0.07, cx = a[0] + d[0] * c, cy = a[1] + d[1] * c; m += `<path class="lk-mark" d="M${cx - f * ux * 7 - uy * 6} ${cy - f * uy * 7 + ux * 6}L${cx} ${cy}L${cx - f * ux * 7 + uy * 6} ${cy - f * uy * 7 - ux * 6}"/>`; }
      }));
      // right-angle boxes
      [0, 1, 2, 3].forEach(i => {
        const c = P[i], a = P[(i + 3) % 4], b = P[(i + 1) % 4], u = [a[0] - c[0], a[1] - c[1]], v = [b[0] - c[0], b[1] - c[1]];
        const lu = Math.hypot(...u), lv = Math.hypot(...v); if (!near((u[0] * v[0] + u[1] * v[1]) / (lu * lv), 0)) return;
        const s1 = [u[0] / lu * 12, u[1] / lu * 12], s2 = [v[0] / lv * 12, v[1] / lv * 12];
        m += `<path class="lk-mark" d="M${c[0] + s1[0]} ${c[1] + s1[1]}L${c[0] + s1[0] + s2[0]} ${c[1] + s1[1] + s2[1]}L${c[0] + s2[0]} ${c[1] + s2[1]}"/>`;
      });
    }
    return `<svg class="lk" viewBox="0 0 ${W.toFixed(0)} ${H.toFixed(0)}" style="width:min(70vw, ${Math.round(W)}px)" role="img" aria-label="a four-sided shape"><path class="lk-shape" d="${path}"/>${m}</svg>`;
  }
  // a wrong name by eye: what the marks show, in one sentence
  function lookSay(it, pick) {
    const d = decide(it.shape, pick), P = props[it.shape], is = `it’s a ${word(it.shape)}`;
    if (d.prop === 'pairs') return P.two ? `Both pairs of opposite sides are parallel: ${is}.` : `Only one pair of sides is parallel: ${is}.`;
    if (d.prop === 'perp') return d.how === 'claim' ? `Its corners aren’t square: ${is}.` : `Its corners are all right angles: ${is}.`;
    return d.how === 'claim' ? `Its sides aren’t all the same length: ${is}.` : `All four sides are the same length: ${is}.`;
  }
  function askLook(el, it, submit) {
    el.innerHTML = `<div class="gq quad"><div class="lk-box">${lookSVG(it, false)}</div><div class="quad-n"><div class="q small">This is a…</div></div></div>`;
    Pick.ask(el.querySelector('.quad-n'), choices(), id => submit({ name: id, errs: [] }), { cols: 3 });
  }

  // ---- the answer area ----
  const choices = () => Object.keys(NAMES).filter(n => PG || n !== 'pgram').map(n => [n, NAMES[n]]);
  const vertsHTML = it => `<div class="q quad-v">${it.v.map((p, i) => `<span><b>${'ABCD'[i]}</b>${pt(p)}</span>`).join('')}</div>`;

  function askName(el, it, lvl, submit) {
    el.innerHTML = `<div class="gq quad">${lvl ? '<div class="gridbox"></div>' : vertsHTML(it)}
      <div class="quad-p"></div><div class="quad-n"><div class="q small">ABCD is a…</div></div></div>`;
    if (lvl) {
      el._g = picture(el.querySelector('.gridbox'), it);
    } else el._g = null;
    el._done = false;
    Pick.ask(el.querySelector('.quad-n'), choices(), id => { el._done = true; submit({ name: id, errs: [] }); }, { cols: 3 });
  }

  // lvl 2: one comparison per question — its two sides lit on the shape, their triangles side by side under it —
  // then the name; a wrong step is fixed in place (first tries graded)
  function askSteps(el, it, submit) {
    el.innerHTML = `<div class="gq quad"><div class="gridbox"></div><div class="quad-sum" aria-live="polite"></div><div class="quad-s"></div></div>`;
    const S = sides(it), P = props[it.shape], yn = [['y', 'Yes'], ['n', 'No']];
    // an answered question folds into one line of findings, so the shape and the current question stay in view
    const sum = el.querySelector('.quad-sum'), note = t => { sum.insertAdjacentHTML('beforeend', `<span>${t}</span>`); };
    const g = el._g = picture(el.querySelector('.gridbox'), it);
    const par = (k1, k2) => cross(S[k1], S[k2]) === 0;
    const ask = (q, keys, want, key, say, onRight, d, found) => () => {
      g.hi(keys);
      return { text: `${q}${cmpHTML(it, keys, { d })}`, pick: yn, want, cols: 2, name: q, why: a => [`q-${key}>${a}`, say(a)],
        onRight: (v, row) => { note(found[want]); onRight && onRight(v, row); } };
    };
    const steps = [
      ask('Is AB parallel to DC?', ['AB', 'DC'], par('AB', 'DC') ? 'y' : 'n', 'pairs', a => stepSay.pairs(it, a, 'AB', 'DC'), null, false, { y: 'AB ∥ DC', n: 'AB ∦ DC' }),
      ask('Is AD parallel to BC?', ['AD', 'BC'], par('AD', 'BC') ? 'y' : 'n', 'pairs', a => stepSay.pairs(it, a, 'AD', 'BC'), null, false, { y: 'AD ∥ BC', n: 'AD ∦ BC' })
    ];
    if (P.two) {
      steps.push(ask('Is the angle at B a right angle?', ['AB', 'BC'], P.perp ? 'y' : 'n', 'perp', a => stepSay.perp(it, a),
        () => { if (P.perp) g.rightMark(it.v[1], sub(it.v[0], it.v[1]), S.BC, 'rmark ok'); }, false, { y: 'right angle at B', n: 'no right angle' }));
      steps.push(ask('Are AB and BC the same length?', ['AB', 'BC'], P.eq ? 'y' : 'n', 'eq', a => stepSay.eq(it, a), null, false, { y: 'AB = BC', n: 'AB ≠ BC' }));
    }
    steps.push(() => { g.hi([]); return { text: 'So ABCD is a…', pick: choices(), want: it.shape, cols: 3, name: 'name', why: id => [`${it.shape}>${id}`, nameSay(it, id)] }; });
    Steps.run(el.querySelector('.quad-s'), steps, {
      final: () => `ABCD is a ${word(it.shape)}.`,
      done: errs => {
        // the first name picked (the fix happens in place)
        const n = errs.find(e => /^\w+>\w+$/.test(e.type) && !/^q-/.test(e.type));
        submit({ name: n ? n.type.split('>')[1] : it.shape, errs });
      }
    });
  }

  // lvl 'v' (the first coordinates-only item): the method, in the student's own numbers — the slope of each side,
  // the two parallel questions, the corner at B, the lengths of AB and BC, then the name; findings fold into one line
  const KS = { AB: [0, 1], BC: [1, 2], CD: [2, 3], DA: [3, 0] };
  function askVerts(el, it, submit) {
    el.innerHTML = `<div class="gq quad">${vertsHTML(it)}<div class="quad-sum" aria-live="polite"></div><div class="quad-s"></div></div>`;
    const P = props[it.shape], yn = [['y', 'Yes'], ['n', 'No']], V = it.v;
    const vec = k => { const [i, j] = KS[k]; return sub(V[j], V[i]); };
    const slopeOf = k => { const w = vec(k); return w[0] ? F.of(w[1], w[0]) : F.UNDEF; };
    const sum = el.querySelector('.quad-sum'), note = t => sum.insertAdjacentHTML('beforeend', `<span>${t}</span>`);
    const work = k => { const [i, j] = KS[k], a = V[i], b = V[j]; return `${k}: (${s(b[1])} − ${par(s(a[1]))}) ÷ (${s(b[0])} − ${par(s(a[0]))}) = ${vec(k)[0] ? sl(vec(k)) : 'undefined'}.`; };
    const len = k => { const n = len2(vec(k)), q = Root.split(n); return Root.of(q.a, q.b); };
    const sameSlope = (k1, k2) => F.eq(slopeOf(k1), slopeOf(k2));
    const yesno = (q, want, key, say, found, onRight) => ({ text: q, pick: yn, want, cols: 2, name: q, why: a => [`q-${key}>${a}`, say(a)],
      onRight: (v, row) => { note(found[want]); onRight && onRight(v, row); } });
    const steps = [
      { text: 'The slope of each side:', boxes: ['AB', 'BC', 'CD', 'DA'].map(k => [k, slopeOf(k), 'q-slope']), kind: 'frac',
        eq: '<span class="vs-grid"><span>AB</span>{AB}<span>BC</span>{BC}<span>CD</span>{CD}<span>DA</span>{DA}</span>',
        why: k => ['q-slope', work(k)] },
      yesno('Is AB parallel to CD?', sameSlope('AB', 'CD') ? 'y' : 'n', 'pairs', a => a === 'y' ? `AB and CD have different slopes: ${sl(vec('AB'))} and ${sl(vec('CD'))}.` : `AB and CD both have slope ${sl(vec('AB'))}.`, { y: 'AB ∥ CD', n: 'AB ∦ CD' }),
      yesno('Is BC parallel to DA?', sameSlope('BC', 'DA') ? 'y' : 'n', 'pairs', a => a === 'y' ? `BC and DA have different slopes: ${sl(vec('BC'))} and ${sl(vec('DA'))}.` : `BC and DA both have slope ${sl(vec('BC'))}.`, { y: 'BC ∥ DA', n: 'BC ∦ DA' })
    ];
    if (P.two) {
      steps.push(yesno('Is the angle at B a right angle?', P.perp ? 'y' : 'n', 'perp', a => stepSay.perp(it, a), { y: 'right angle at B', n: 'no right angle' }));
      steps.push({ text: 'The lengths of AB and BC:', boxes: [['lAB', len('AB'), 'q-len'], ['lBC', len('BC'), 'q-len']], kind: 'root',
        eq: '<span class="vs-grid"><span>AB</span>{lAB}<span>BC</span>{lBC}</span>',
        why: k => { const kk = k.slice(1), w = vec(kk); return ['q-len', `${kk}: √(${Math.abs(w[0])}² + ${Math.abs(w[1])}²) = √${len2(w)}${Root.text(len(kk)) === `√${len2(w)}` ? '' : ` = ${Root.text(len(kk))}`}.`]; } });
      steps.push(yesno('Are AB and BC the same length?', P.eq ? 'y' : 'n', 'eq', a => stepSay.eq(it, a), { y: 'AB = BC', n: 'AB ≠ BC' }));
    }
    steps.push({ text: 'So ABCD is a…', pick: choices(), want: it.shape, cols: 3, name: 'name', why: id => [`${it.shape}>${id}`, nameSay(it, id)] });
    Steps.run(el.querySelector('.quad-s'), steps, {
      final: () => `ABCD is a ${word(it.shape)}.`,
      done: errs => { const n = errs.find(e => /^\w+>\w+$/.test(e.type) && !/^q-/.test(e.type)); submit({ name: n ? n.type.split('>')[1] : it.shape, errs }); }
    });
  }

  // ---- the rule "Parallelogram as a choice\" (Off: the test's four names) ----
  let PG = true;
  const mk = (idea, f, lvl) => ({ idea, make: () => make[f](lvl) });
  const ERR = {};
  Object.keys(NAMES).forEach(a => Object.keys(NAMES).forEach(b => { if (a !== b) ERR[`${a}>${b}`] = `${NAMES[a]} called ${word(b)}`; }));
  Object.assign(ERR, {
    'q-pairs>y': 'said both pairs ∥ (trapezoid)', 'q-pairs>n': 'missed a ∥ pair',
    'q-perp>y': 'saw a right angle that isn’t there', 'q-perp>n': 'missed the right angle',
    'q-eq>y': 'called unequal sides equal', 'q-eq>n': 'different legs, so “different lengths”'
  });
  // what a miss means, by the property it gets wrong
  const TIP = {
    'pairs-miss': ['Sees one parallel pair and assumes two (calls a trapezoid a parallelogram).', 'Check both pairs: AB with DC, then AD with BC. Same slope triangle means parallel. A trapezoid has only one parallel pair.'],
    'pairs-claim': ['Calls a shape with two parallel pairs a trapezoid.', 'Compare opposite sides’ slope triangles: two matching pairs make a parallelogram (or a more specific name).'],
    'perp-claim': ['Trusts the look for a right angle, or takes swapped legs (2, 1 and 1, 2) for a 90° turn.', 'A right angle needs BC’s triangle to be AB’s turned 90°: the legs swap AND one sign flips. Check: the slopes multiply to −1.'],
    'perp-miss': ['Doesn’t check the corner for a right angle, or doesn’t use the most specific name.', 'Multiply the slopes of AB and BC: −1 is a right angle. A rhombus with right angles is a square; a parallelogram with right angles is a rectangle.'],
    'eq-claim': ['Calls the sides equal without measuring.', 'Each side’s length from its triangle: run² + rise². Equal sides need equal totals (√5 isn’t √20).'],
    'eq-miss': ['Doesn’t see equal sides, often because the legs differ (5, 0 and 3, 4 are both 5), or doesn’t use the most specific name.', 'Compare run² + rise², not the legs: 5² + 0² = 3² + 4² = 25, so both sides are 5.']
  };

  Apparatus.define({
    id: 'geo-quad',
    title: 'Classify the Quadrilateral',
    ideas: {
      look:  { name: 'By eye', easy: ['look'], hard: ['look-tilt'], check: 'look-tilt' },
      perp:  { name: 'A right angle (turned 90°, not just swapped)', easy: ['rect'], hard: ['swap', 'rect-v'], check: 'swap' },
      eq:    { name: 'Equal sides (same d, different legs)', easy: ['square'], hard: ['legs', 'square0'], check: 'legs' },
      pairs: { name: 'Parallel pairs (parallelogram or trapezoid)', easy: ['pgram'], hard: ['trap', 'pgram0'], check: 'trap' }
    },
    kinds: {
      look: { idea: 'look', make: () => lookItem(false) }, 'look-tilt': { idea: 'look', make: () => lookItem(true) },
      rect: mk('perp', 'rect', 1), rect0: mk('perp', 'rect', 0), 'rect-v': mk('perp', 'rect', 'v'), swap: mk('perp', 'swap', 1),
      square: mk('eq', 'square', 1), square0: mk('eq', 'square', 0), legs: mk('eq', 'legs', 1),
      pgram: mk('pairs', 'pgram', 1), pgram0: mk('pairs', 'pgram', 0), trap: mk('pairs', 'trap', 1), trap0: mk('pairs', 'trap', 0)
    },
    // by eye first (a rectangle, a rhombus), then by the numbers: a rhombus that looks almost square, step by step
    opening: [
      { kind: 'look', item: { shape: 'rect', v: LOOK.rect(), lvl: 'look' } },
      { kind: 'look', item: { shape: 'rhombus', v: LOOK.rhombus(false), lvl: 'look' } },
      { kind: 'swap', item: { shape: 'rhombus', v: [[-2, -1], [0, 0], [1, 2], [-1, 1]], lvl: 2 } }
    ],
    defaults: { fix: 1, pgram: true },
    rules: [['pgram', 'Parallelogram as a choice', [[true, 'On'], [false, 'Off']], 'Off: only the test’s four names (Square, Rectangle, Rhombus, Trapezoid), and no plain parallelograms.']],
    configure(S) {
      PG = S.pgram !== false;
      if (PG) return {};
      const ideas = Object.assign({}, this.ideas, { pairs: { name: 'Parallel pairs (trapezoid)', easy: ['trap'], hard: ['trap', 'trap0'], check: 'trap' } });
      return { ideas };
    },
    nextOnRight: true,
    text: it => it.lvl === 'look' ? `a ${word(it.shape)} (by eye)` : `${it.v.map((p, i) => 'ABCD'[i] + pt(p)).join(' ')}${it.lvl === 0 ? '' : ' (grid)'}`,
    speak: it => it.lvl === 'look' ? 'A four-sided shape. Which name fits best?' : `The quadrilateral ${it.v.map((p, i) => 'ABCD'[i] + pt(p)).join(', ')}. Which name fits best?`,
    ask(el, it, submit, ctx) {
      if (it.lvl === 'look') { el._lvl = 'look'; return askLook(el, it, submit); }
      if (it.lvl === 'v' && !(ctx && ctx.mode === 'warm')) { el._lvl = 2; return askVerts(el, it, submit); }
      const lvl = ctx && ctx.mode === 'warm' ? 0 : it.lvl ?? 1;
      el._lvl = lvl;
      (lvl === 2 ? askSteps : (e, i, s) => askName(e, i, lvl, s))(el, it, submit);
    },
    correct: it => NAMES[it.shape],
    isRight: (it, a) => a.name === it.shape && a.errs.length === 0,
    classify: (it, a) => a.errs.length ? a.errs[0].type : `${it.shape}>${a.name}`,
    feedback(it, w, a) {
      if (a.errs.length) return ['', a.errs[0].text];
      return [decide(it.shape, a.name).prop, it.lvl === 'look' ? lookSay(it, a.name) : nameSay(it, a.name)];
    },
    reveal(el, it, a, o) {
      if (el._lvl === 2) return;
      Pick.mark(el, it.shape, a.name, o.right);
      if (el._lvl === 'look') { if (!o.right) el.querySelector('.lk-box').innerHTML = lookSVG(it, true); return; }
      const p = el.querySelector('.quad-p'); if (p) p.textContent = '';
      if (o.right) return;
      if (!el._g) {
        const gb = document.createElement('div'); gb.className = 'gridbox';
        el.querySelector('.quad-v').after(gb);
        el._g = picture(gb, it);
      }
      cue(el, el._g, it, o.cue);
    },
    errors: ERR,
    diagnose(err) {
      if (err === 'q-slope') return ['Slips finding a side’s slope from two corners.', 'Write (y₂ − y₁) ÷ (x₂ − x₁) with the corners in order, brackets around negatives.'];
      if (err === 'q-len') return ['Slips finding a side’s length.', 'The length is √(run² + rise²): square both, add, then simplify the root.'];
      const m = /^q-(\w+)>(y|n)$/.exec(err);
      if (m) {
        // a yes/no step: yes to a property that isn't there is a claim, no to one that is a miss
        const k = m[1], how = k === 'pairs' ? (m[2] === 'y' ? 'miss' : 'claim') : (m[2] === 'y' ? 'claim' : 'miss');
        return TIP[`${k}-${how}`];
      }
      const n = /^(\w+)>(\w+)$/.exec(err);
      if (!n || !props[n[1]] || !props[n[2]]) return ['', ''];
      const d = decide(n[1], n[2]);
      return TIP[`${d.prop}-${d.how}`] || ['', ''];
    },
    get keyHTML() {
      // the three tests drawn small: two slope triangles each (run blue, rise green, the side in ink)
      const tri = (x, y, run, rise, k = 12) => `<path class="k-run" d="M${x} ${y}h${run * k}"/><path class="k-rise" d="M${x + run * k} ${y}v${-rise * k}"/><path class="k-hyp" d="M${x} ${y}L${x + run * k} ${y - rise * k}"/>`;
      const svg = (w, h, body) => `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">${body}</svg>`;
      const T = (x, y, t) => `<text x="${x}" y="${y}">${t}</text>`;
      const par2 = svg(84, 40, tri(6, 34, 2, 1) + tri(44, 34, 2, 1));
      const perp2 = svg(84, 52, tri(34, 46, 2, 1, 14) + `<path class="k-run" d="M34 46h-14"/><path class="k-rise" d="M20 46v-28"/><path class="k-hyp" d="M34 46L20 18"/>`);
      const eq2 = svg(110, 56, tri(6, 50, 3, 4, 9) + `<path class="k-hyp" d="M60 50h45"/>` + T(14, 14, 'd 5') + T(72, 42, 'd 5'));
      return `<div class="gk quad-k">
        <div class="kt"><div class="kr"><b>∥</b>${par2}<span>same triangle</span></div>
        <div class="kr"><b>⟂</b>${perp2}<span>turned 90°: ½ × (−2) = −1</span></div>
        <div class="kr"><b>=</b>${eq2}<span>same d: 3² + 4² = 5²</span></div></div>
        <div class="tree"><div>2 <i>∥</i> pairs → <b>parallelogram</b></div><div class="in">+ right angle → <b>rectangle</b></div>
        <div class="in">+ equal sides → <b>rhombus</b></div><div class="in">+ both → <b>square</b></div>
        <div>exactly 1 <i>∥</i> pair → <b>trapezoid</b></div></div></div>`;
    }
  });
})();
