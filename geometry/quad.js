// Classify the Quadrilateral (G12) — one picture, three tests, then the name.
//   ∥  same slope triangle                 (opposite sides AB, DC and AD, BC)
//   ⟂  the triangle turned 90° (product −1) (AB and BC, the corner at B)
//   =  the same length d, even with different legs: 5, 0 and 3, 4 are both 5
// Tree: two ∥ pairs → parallelogram (+ right angle: rectangle, + equal sides: rhombus, both: square); exactly one → trapezoid.
// The most specific name wins. Scaffolding fades with item.lvl:
//   2 = tap each side to see its triangle, then plain yes/no questions, then the name (the opening; wrong steps fixed in place)
//   1 = the grid, tap sides to compare, the name   0 = the vertices as text only (like the test's Q20), the name
// A wrong name: the deciding sides' triangles on the grid + one sentence on the first property the PICKED name gets wrong.
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
    pairs: (it, a) => { const S = sides(it); return a === 'y' ? `AD and BC have different triangles: slopes ${sl(S.AD)} and ${sl(S.BC)}.` : 'AB and DC have the same triangle, and so do AD and BC.'; },
    perp: (it, a) => { const S = sides(it); return a === 'y' ? `BC’s triangle isn’t AB’s turned 90°: ${perpWork(S.AB, S.BC)}.` : `BC’s triangle is AB’s turned 90°: ${perpWork(S.AB, S.BC)}.`; },
    eq: (it, a) => {
      const S = sides(it), la = len2(S.AB), lb = len2(S.BC);
      return a === 'y' ? `${sq(S.AB)} = ${la} but ${sq(S.BC)} = ${lb}: AB is ${lenText(la)}, BC is ${lenText(lb)}.` : `${sq(S.AB)} = ${sq(S.BC)} = ${la}: both are ${lenText(la)}.`;
    }
  };

  // ---- the picture ----
  // the shape with lettered corners (coordinates in the legend); sides tappable when tap(side) is given
  function picture(host, it, o = {}) {
    const g = G.make(host, { min: -5, max: 5 }), L = 'ABCD';
    g.poly(it.v, 'pg');
    const c = it.v.reduce((m, p) => [m[0] + p[0] / 4, m[1] + p[1] / 4], [0, 0]);
    it.v.forEach((p, i) => g.dot(p, 'pt', L[i] + pt(p), sub(p, c)));
    const tris = {}, opts = {};
    // a side's slope triangle on the grid and in the legend (from its first letter to its second); all shown sides are
    // redrawn in the order AB, DC, AD, BC so the legend pairs opposite sides (AB beside DC, AD beside BC)
    const redraw = () => Object.keys(ENDS).forEach(k => {
      if (tris[k]) g.remove(tris[k]);
      if (!opts[k]) return delete tris[k];
      const [i, j] = ENDS[k];
      tris[k] = g.triangle(it.v[i], it.v[j], Object.assign({ labels: true }, opts[k]));
    });
    g.side = (k, x = {}) => { opts[k] = x; redraw(); return tris[k]; };
    g.unside = k => { delete opts[k]; redraw(); };
    g.shown = k => !!tris[k];
    if (o.tap) {
      // wide invisible strokes over each side take the taps (and Enter/Space)
      Object.keys(ENDS).forEach(k => {
        const [i, j] = ENDS[k], p = it.v[i], q = it.v[j];
        const h = g.el('line', { x1: g.X(p[0]), y1: g.Y(p[1]), x2: g.X(q[0]), y2: g.Y(q[1]), class: 'q-hit', tabindex: 0, role: 'button', 'aria-label': `side ${k}` });
        h.parentNode.appendChild(h);
        const go = () => o.tap(k, h);
        h.addEventListener('click', e => { e.stopPropagation(); go(); });
        h.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
      });
      g.svg.classList.add('q-taps');
    }
    return g;
  }
  // the cue after a wrong name: the deciding sides' triangles
  function cue(g, it, prop) {
    Object.keys(ENDS).forEach(k => g.unside(k));
    const S = sides(it), B = it.v[1];
    if (prop === 'pairs') { g.side('AD'); g.side('BC'); return; }
    if (prop === 'eq') { const d = k => lenText(len2(S[k])); g.side('AB', { hyp: true, d: d('AB') }); g.side('BC', { hyp: true, d: d('BC') }); return; }
    g.side('AB'); g.side('BC');
    if (dot(S.AB, S.BC) === 0) g.rightMark(B, sub(it.v[0], B), S.BC, 'rmark ok');
  }

  // ---- the answer area ----
  const choices = () => Object.keys(NAMES).filter(n => PG || n !== 'pgram').map(n => [n, NAMES[n]]);
  const vertsHTML = it => `<div class="q quad-v">${it.v.map((p, i) => `<span><b>${'ABCD'[i]}</b>${pt(p)}</span>`).join('')}</div>`;

  function askName(el, it, lvl, submit) {
    el.innerHTML = `<div class="gq quad">${lvl ? '<div class="gridbox"></div>' : vertsHTML(it)}
      <div class="q small quad-p">${lvl ? 'Tap a side to see its triangle.' : ''}</div><div class="quad-n"><div class="q small">ABCD is a…</div></div></div>`;
    if (lvl) {
      el._g = picture(el.querySelector('.gridbox'), it, { tap: k => { if (el._done) return; el._g.shown(k) ? el._g.unside(k) : el._g.side(k); } });
    } else el._g = null;
    el._done = false;
    Pick.ask(el.querySelector('.quad-n'), choices(), id => { el._done = true; submit({ name: id, errs: [] }); }, { cols: 3 });
  }

  // lvl 2: tap every side, then the questions, then the name; a wrong step is fixed in place (first tries graded)
  function askSteps(el, it, submit) {
    el.innerHTML = `<div class="gq quad"><div class="gridbox"></div><div class="quad-s"></div></div>`;
    const S = sides(it), P = props[it.shape], yn = [['y', 'Yes'], ['n', 'No']];
    let seen = new Set(), onAll = null;
    const g = el._g = picture(el.querySelector('.gridbox'), it, { tap: k => {
      if (!onAll) return;
      if (!g.shown(k)) g.side(k);
      seen.add(k); if (seen.size === 4) { const f = onAll; onAll = null; f(); }
    } });
    const ask = (q, want, key, onRight) => ({ text: q, pick: yn, want, cols: 2, name: key, why: a => [`q-${key}>${a}`, stepSay[key](it, a)], onRight });
    const steps = [
      { text: 'Tap each side to see its slope triangle.', tap: () => new Promise(res => { onAll = () => res({ ok: true }); }) },
      ask('Are both pairs of opposite sides parallel?', P.two ? 'y' : 'n', 'pairs')
    ];
    if (P.two) {
      steps.push(ask('A right angle at B?', P.perp ? 'y' : 'n', 'perp', () => { if (P.perp) g.rightMark(it.v[1], sub(it.v[0], it.v[1]), S.BC, 'rmark ok'); }));
      steps.push(ask('AB and BC the same length?', P.eq ? 'y' : 'n', 'eq', () => ['AB', 'BC'].forEach(k => g.side(k, { hyp: true, d: lenText(len2(S[k])) }))));
    }
    steps.push({ text: 'So ABCD is a…', pick: choices(), want: it.shape, cols: 3, name: 'name', why: id => [`${it.shape}>${id}`, nameSay(it, id)] });
    Steps.run(el.querySelector('.quad-s'), steps, {
      final: () => `ABCD is a ${word(it.shape)}.`,
      done: errs => {
        // the first name picked (the fix happens in place)
        const n = errs.find(e => /^\w+>\w+$/.test(e.type) && !/^q-/.test(e.type));
        submit({ name: n ? n.type.split('>')[1] : it.shape, errs });
      }
    });
  }

  // ---- the rule "Parallelogram as a choice" (Off: the test's four names) ----
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
      perp:  { name: 'A right angle (turned 90°, not just swapped)', easy: ['rect'], hard: ['swap', 'rect0'], check: 'swap' },
      eq:    { name: 'Equal sides (same d, different legs)', easy: ['square'], hard: ['legs', 'square0'], check: 'legs' },
      pairs: { name: 'Parallel pairs (parallelogram or trapezoid)', easy: ['pgram'], hard: ['trap', 'pgram0'], check: 'trap' }
    },
    kinds: {
      rect: mk('perp', 'rect', 1), rect0: mk('perp', 'rect', 0), swap: mk('perp', 'swap', 1),
      square: mk('eq', 'square', 1), square0: mk('eq', 'square', 0), legs: mk('eq', 'legs', 1),
      pgram: mk('pairs', 'pgram', 1), pgram0: mk('pairs', 'pgram', 0), trap: mk('pairs', 'trap', 1), trap0: mk('pairs', 'trap', 0)
    },
    // the contrast set: a rhombus and a square sharing AB = (2, 1); only the turn at B differs
    opening: [
      { kind: 'swap', item: { shape: 'rhombus', v: [[-2, -1], [0, 0], [1, 2], [-1, 1]], lvl: 2 } },
      { kind: 'square', item: { shape: 'square', v: [[-2, -1], [0, 0], [-1, 2], [-3, 1]], lvl: 2 } }
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
    text: it => `${it.v.map((p, i) => 'ABCD'[i] + pt(p)).join(' ')}${it.lvl === 0 ? '' : ' (grid)'}`,
    speak: it => `The quadrilateral ${it.v.map((p, i) => 'ABCD'[i] + pt(p)).join(', ')}. Which name fits best?`,
    ask(el, it, submit, ctx) {
      const lvl = ctx && ctx.mode === 'warm' ? 0 : it.lvl ?? 1;
      el._lvl = lvl;
      (lvl === 2 ? askSteps : (e, i, s) => askName(e, i, lvl, s))(el, it, submit);
    },
    correct: it => NAMES[it.shape],
    isRight: (it, a) => a.name === it.shape && a.errs.length === 0,
    classify: (it, a) => a.errs.length ? a.errs[0].type : `${it.shape}>${a.name}`,
    feedback(it, w, a) {
      if (a.errs.length) return ['', a.errs[0].text];
      return [decide(it.shape, a.name).prop, nameSay(it, a.name)];
    },
    reveal(el, it, a, o) {
      if (el._lvl === 2) return;
      Pick.mark(el, it.shape, a.name, o.right);
      const p = el.querySelector('.quad-p'); if (p) p.textContent = '';
      if (o.right) return;
      if (!el._g) {
        const gb = document.createElement('div'); gb.className = 'gridbox';
        el.querySelector('.quad-v').after(gb);
        el._g = picture(gb, it);
      }
      el._g.svg.classList.remove('q-taps');
      cue(el._g, it, o.cue);
    },
    errors: ERR,
    diagnose(err) {
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
