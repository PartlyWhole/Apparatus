// Reflect It (T4) — flip a point, then a figure, across a mirror line: the x-axis, the y-axis, y = x, y = −x, x = a, y = b.
// The picture: the mirror (Plot.mirror), the point's dashed path straight across it, ticked once on each side: the image
// is as far past the line as the point is before it. Point items fade with lvl: 2 = the path from P to the mirror is
// drawn (and runs on, faint, past it) with its length in the legend; 1 = the mirror only; 0 = coordinates only (the
// next-session check is always 0). Answers: P′(□, □) in the shared answer box. Figures: tap the image's vertices
// (lib/plot.js); the test's Q7 twist (big numbers across y = −x) is typed. A miss draws the right path, ticks and image.
// Spec: specs/geometry-transformations.md (T4). Uses lib/grid.js (+ grid-extra.css), lib/plot.js, lib/frac.js; styles lib/reflect.css.
(function () {
  const G = Grid, s = G.sgn, F = Frac, { r, any } = Apparatus.util;
  const pt = p => `(${s(p[0])}, ${s(p[1])})`;
  const same = (p, q) => !!p && !!q && p[0] === q[0] && p[1] === q[1];
  const inGrid = (p, n = 6) => Math.abs(p[0]) <= n && Math.abs(p[1]) <= n;
  const nz = (a, b) => { let v = 0; while (v === 0) v = r(a, b); return v; };
  const mk = (idea, make) => ({ idea, make });

  // ---- mirrors: { x: a } | { y: b } | { m: 1 } (y = x) | { m: -1 } (y = −x) ----
  const refl = (L, p) => L.x != null ? [2 * L.x - p[0], p[1]] : L.y != null ? [p[0], 2 * L.y - p[1]] : L.m === 1 ? [p[1], p[0]] : [-p[1], -p[0]];
  // where the path from p meets the mirror (a half-point on a diagonal when x ± y is odd)
  const foot = (L, p) => L.x != null ? [L.x, p[1]] : L.y != null ? [p[0], L.y] : L.m === 1 ? [(p[0] + p[1]) / 2, (p[0] + p[1]) / 2] : [(p[0] - p[1]) / 2, (p[1] - p[0]) / 2];
  const onLine = (L, p) => same(foot(L, p), p);
  const lname = L => L.x === 0 ? 'the y-axis' : L.y === 0 ? 'the x-axis' : L.x != null ? `x = ${s(L.x)}` : L.y != null ? `y = ${s(L.y)}` : L.m === 1 ? 'y = x' : 'y = −x';
  const lkey = L => L.x != null ? 'x=' + L.x : L.y != null ? 'y=' + L.y : 'm=' + L.m;
  // how far from the mirror: grid squares straight across (x = a, y = b), or squares corner to corner (diagonals)
  const dist = (L, p) => Math.abs(p[0] - foot(L, p)[0]) || Math.abs(p[1] - foot(L, p)[1]);
  const AX = [{ y: 0 }, { x: 0 }], DG = [{ m: 1 }, { m: -1 }];

  // ---- items ----
  // { k: 'pt', L, p, lvl }                       reflect P
  // { k: 'fig', L, v: [[x, y], …], typed }        reflect a figure (tap the image; typed: type its vertices)
  // a point: no zeros, |x| ≠ |y| (so every wrong rule gives a different answer), the image on the grid
  function point(Ls, lvl, ok = () => true) {
    for (let k = 0; k < 400; k++) {
      const L = any(Ls), p = [nz(-5, 5), nz(-5, 5)], q = refl(L, p);
      if (Math.abs(p[0]) === Math.abs(p[1]) || onLine(L, p) || !inGrid(q) || !ok(L, p)) continue;
      // with the distance shown on a diagonal, the path crosses the mirror at a grid corner
      if (L.m && lvl === 2 && (p[0] + p[1]) % 2) continue;
      return { k: 'pt', L, p, lvl };
    }
    return { k: 'pt', L: { y: 0 }, p: [4, 2], lvl };
  }
  // x = a, y = b: a ≠ 0, and the wrong rules (across the axis; the distance counted from the axis) all differ
  const LINES = () => any([0, 1]) ? { x: nz(-3, 3) } : { y: nz(-3, 3) };
  function linePoint(lvl, far) {
    for (let k = 0; k < 400; k++) {
      const L = LINES(), c = L.x != null ? 0 : 1, a = L.x != null ? L.x : L.y;
      const it = point([L], lvl, (_, p) => {
        const w = refl(L, p)[c], d = Math.abs(p[c] - a);
        if (d < 1 || -p[c] === w || a - p[c] === w || -p[c] === a || Math.abs(p[c]) === d) return false;
        // far: the line sits between P and the axis's other side, as in the test's Q9 (x = −2 with x = 2 or 4)
        return !far || Math.sign(p[c]) !== Math.sign(a);
      });
      if (lkey(it.L) === lkey(L)) return it;
    }
    return { k: 'pt', L: { x: -2 }, p: [2, 1], lvl };
  }

  // figures: small shapes moved about, all on one side of the mirror, image on the grid, no image vertex on a preimage one
  const SHAPES = [
    [[0, 0], [3, 1], [1, 3]], [[0, 0], [2, 0], [0, 3]], [[0, 0], [3, 2], [0, 2]], [[0, 0], [2, 3], [3, 0]],
    [[0, 0], [3, 0], [4, 2], [1, 2]], [[0, 0], [2, -1], [3, 2], [0, 2]]
  ];
  const side = (L, p) => L.x != null ? Math.sign(p[0] - L.x) : L.y != null ? Math.sign(p[1] - L.y) : Math.sign(p[1] - L.m * p[0]);
  // Ls: a list of mirrors, or a function that picks one (a fresh pick each try)
  function figure(Ls, quads) {
    for (let k = 0; k < 600; k++) {
      const L = typeof Ls === 'function' ? Ls() : any(Ls), sh = any(quads ? SHAPES : SHAPES.slice(0, 4)), f = [any([1, -1]), any([1, -1])], o = [r(-5, 5), r(-5, 5)];
      const v = sh.map(p => [o[0] + f[0] * p[0], o[1] + f[1] * p[1]]), im = v.map(p => refl(L, p));
      // no vertex on an axis: its path would run along the axis
      if (!v.every(p => inGrid(p, 5) && p[0] && p[1]) || !im.every(p => inGrid(p))) continue;
      const sd = v.map(p => side(L, p));
      if (sd.some(x => x === 0) || new Set(sd).size > 1) continue;
      if (im.some(q => v.some(p => same(p, q)))) continue;
      return { k: 'fig', L, v };
    }
    return { k: 'fig', L: { x: 0 }, v: [[1, 1], [4, 2], [2, 4]] };
  }
  // the test's Q7: a segment with big numbers across y = −x (or y = x), typed
  function typedSeg() {
    const L = any([{ m: -1 }, { m: -1 }, { m: 1 }]);
    for (let k = 0; k < 200; k++) {
      const a = [r(6, 10), r(1, 9)], b = [r(6, 10), r(1, 9)];
      if (same(a, b) || a[0] === a[1] || b[0] === b[1] || Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) < 4) continue;
      return { k: 'fig', L, v: [a, b], typed: true };
    }
    return { k: 'fig', L: { m: -1 }, v: [[7, 5], [10, 1]], typed: true };
  }
  const NAMES = ['A', 'B', 'C', 'D'];
  const nameOf = (it, i) => it.k === 'pt' ? 'P' : NAMES[i];
  const pres = it => it.k === 'pt' ? [it.p] : it.v;
  const want = it => pres(it).map(p => refl(it.L, p));

  // ---- what a wrong image says (P: the point, A: the answer) ----
  function errOf(L, P, A) {
    const W = refl(L, P);
    if (same(A, W)) return null;
    if (same(A, P)) return 'same';
    if (L.m) {
      if (same(A, refl({ m: -L.m }, P))) return 'diag';
      if (same(A, [-P[0], -P[1]])) return 'nosw';
      if (same(A, [-P[1], P[0]]) || same(A, [P[1], -P[0]])) return 'turn';
      return 'other';
    }
    const c = L.x != null ? 0 : 1, a = L.x != null ? L.x : L.y;         // c: the number that changes
    if (A[1 - c] !== P[1 - c]) return A[c] === P[c] ? 'axis' : same(A, [-P[0], -P[1]]) ? 'origin' : 'other';
    if (A[c] === a) return 'short';
    if (a !== 0 && A[c] === -P[c]) return 'axisline';
    if (a !== 0 && A[c] === a - P[c]) return 'dist';
    return 'other';
  }
  // one plain sentence about the picked image; nm: the point's letter (its image is nm′)
  function say(L, P, A, err, nm) {
    const W = refl(L, P), Ln = lname(L), im = `${nm}′${pt(W)}`;
    if (L.m) {
      const rule = L.m === 1 ? 'the numbers swap' : 'the numbers swap and both change sign';
      if (err === 'diag') return L.m === 1 ? `Across y = x the numbers just swap, no sign change: ${im}.` : `Across ${Ln} ${rule}: ${im}.`;
      if (err === 'nosw') return `Across ${Ln} the numbers also swap places: ${im}.`;
      if (err === 'turn') return `That’s a 90° turn; across ${Ln} ${rule}: ${im}.`;
      if (err === 'same') return `That’s ${nm} itself; across ${Ln} ${rule}: ${im}.`;
      return `Across ${Ln} ${rule}: ${im}.`;
    }
    const c = L.x != null ? 0 : 1, a = L.x != null ? L.x : L.y, xy = c ? 'y' : 'x', d = Math.abs(P[c] - a);
    const before = c ? (P[1] > a ? 'above' : 'below') : (P[0] > a ? 'to the right of' : 'to the left of');
    const past = c ? (P[1] > a ? 'below' : 'above') : (P[0] > a ? 'to the left of' : 'to the right of');
    if (err === 'axis') return `Across ${Ln} the ${c ? 'x' : 'y'} stays: ${im}.`;
    if (err === 'origin') return `Only the ${xy} changes across ${Ln}: ${im}.`;
    if (err === 'same') return `That’s ${nm} itself; ${nm}′ is on the other side of ${Ln}: ${im}.`;
    if (err === 'short') return `That’s on the mirror; go ${d} past it: ${im}.`;
    if (err === 'axisline') return `The mirror is ${Ln}: ${d} ${before} it lands ${d} ${past} it, at ${xy} = ${s(W[c])}.`;
    if (err === 'dist') return `${nm} is ${d} ${before} ${Ln}, not ${Math.abs(P[c])}: ${d} ${past} it is ${xy} = ${s(W[c])}.`;
    return `${nm} is ${d} ${before} ${Ln}, so ${nm}′ is ${d} ${past} it: ${im}.`;
  }

  // ---- the picture ----
  const NS = 'http://www.w3.org/2000/svg';
  // a dashed piece of the path from p to q, with one tick across its middle
  function half(g, p, q, cls) {
    const grp = g.el('g', { class: 'rf-half' + (cls ? ' ' + cls : '') });
    const x1 = g.X(p[0]), y1 = g.Y(p[1]), x2 = g.X(q[0]), y2 = g.Y(q[1]), l = Math.hypot(x2 - x1, y2 - y1);
    if (!l) return grp;
    const mk1 = (a) => { const e = document.createElementNS(NS, 'line'); for (const k in a) e.setAttribute(k, a[k]); grp.appendChild(e); };
    mk1({ x1, y1, x2, y2, class: 'rf-path' });
    const ux = (x2 - x1) / l, uy = (y2 - y1) / l, mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    mk1({ x1: mx - uy * 6, y1: my + ux * 6, x2: mx + uy * 6, y2: my - ux * 6, class: 'rf-tick' });
    return grp;
  }
  // the distance in the legend: a ticked dash in the path's direction and the count
  function legendDist(g, L, p) {
    const leg = g.svg.parentNode.querySelector('.glegend'); if (!leg) return;
    const a = L.x != null ? 0 : L.y != null ? 90 : L.m === 1 ? 45 : -45, d = dist(L, p);
    const html = `<span class="lg-br rf-lgx"></span><span class="rf-lgd rf-lgx"><svg viewBox="-14 -14 28 28" width="24" height="24" aria-hidden="true"><g transform="rotate(${a})"><line x1="-12" y1="0" x2="12" y2="0" class="rf-path"/><line x1="0" y1="-6" x2="0" y2="6" class="rf-tick"/></g></svg>${d}</span>`;
    // the grid redraws its legend as things are drawn: put the distance back each time
    const put = () => { if (!leg.querySelector('.rf-lgd')) leg.insertAdjacentHTML('beforeend', html); };
    put(); new MutationObserver(put).observe(leg, { childList: true });
  }
  function grid(host, it) {
    const g = G.make(host);
    Plot.mirror(g, it.L, 'ln mirror rf-m');
    if (it.k === 'pt') g.dot(it.p, 'pt', 'P' + pt(it.p));
    else {
      if (it.v.length > 2) g.poly(it.v, 'pg'); else g.seg(it.v[0], it.v[1]);
      it.v.forEach((p, i) => g.dot(p, 'pt', NAMES[i] + pt(p)));
    }
    return g;
  }
  // P's path to the mirror (lvl 2): ticked, its length in the legend, running on faint past the mirror
  function showDist(g, it, p) {
    // the faint run-on: from the mirror, on in the same direction to the grid's edge
    const f = foot(it.L, p), u = [f[0] - p[0], f[1] - p[1]];
    const t = Math.min(...[0, 1].filter(c => u[c]).map(c => ((u[c] > 0 ? g.max : g.min) - f[c]) / u[c]));
    g.seg(f, [f[0] + u[0] * t, f[1] + u[1] * t], 'ln rf-ray');
    half(g, p, f);
    legendDist(g, it.L, p);
  }
  // the right image: the path from P to the mirror and as far past it, ticked the same; the image dot
  function showImage(g, it, p, nm, label) {
    const f = foot(it.L, p), q = refl(it.L, p);
    half(g, p, f, 'ok'); half(g, f, q, 'ok');
    return g.dot(q, 'pt ok', label ? `${nm}′${pt(q)}` : undefined);
  }

  // ---- the answer areas ----
  const boxRow = (nm, i) => `<div class="q rf-q">${nm}′(${F.box('x' + i)}, ${F.box('y' + i)})</div>`;
  function typed(el, it, submit) {
    const W = want(it);
    F.wire(el, { say: el.querySelector('.say'), want: k => F.of(W[+k.slice(1)][k[0] === 'x' ? 0 : 1]), onSubmit: v => {
      submit({ pts: W.map((_, i) => [F.num(v['x' + i].v), F.num(v['y' + i].v)]) });
    } });
  }
  function askPoint(el, it, lvl, submit) {
    const top = lvl ? '<div class="gridbox"></div>' : `<div class="q rf-head">P${pt(it.p)}</div>`;
    el.innerHTML = `<div class="gq rf">${top}<div class="q small rf-p">Reflect across ${lname(it.L)}.</div>${boxRow('P', 0)}
      <p class="say" aria-live="polite"></p><button type="button" class="go">Check</button></div>`;
    const x = el._x = { it, lvl };
    if (lvl) { x.g = grid(el.querySelector('.gridbox'), it); if (lvl === 2) { showDist(x.g, it, it.p); x.dist = true; } }
    typed(el, it, submit);
  }
  function askFig(el, it, submit) {
    if (it.typed) {
      el.innerHTML = `<div class="gq rf"><div class="q two rf-head">${it.v.map((p, i) => `<span>${NAMES[i]}${pt(p)}</span>`).join('')}</div>
        <div class="q small rf-p">Reflect across ${lname(it.L)}.</div>${it.v.map((_, i) => boxRow(NAMES[i], i)).join('')}
        <p class="say" aria-live="polite"></p><button type="button" class="go">Check</button></div>`;
      el._x = { it };
      return typed(el, it, submit);
    }
    el.innerHTML = `<div class="gq rf"><div class="gridbox"></div><div class="q small rf-p">Reflect across ${lname(it.L)}: tap ${it.v.map((_, i) => NAMES[i] + '′').join(', ')}.</div>
      <button type="button" class="go" disabled>Check</button></div>`;
    const g = grid(el.querySelector('.gridbox'), it), go = el.querySelector('.go');
    const p = Plot.wire(g, { names: it.v.map((_, i) => NAMES[i] + '′'), closed: it.v.length > 2, onChange: () => { go.disabled = !p || !p.done(); } });
    go.disabled = true;
    el._x = { it, g, plot: p };
    go.addEventListener('click', () => {
      if (!p.done()) return;
      p.stop(); go.disabled = true;
      submit({ pts: p.points() });
    });
  }

  // ---- the key: the rules, and one reflection drawn ----
  const KEY = { k: 'pt', L: { x: 1 }, p: [4, 2] };

  const TIPS = {
    axis: ['Changes the wrong number: flips across the other axis.', 'Across the x-axis the point goes up or down, so only y changes; across the y-axis it goes left or right, so only x changes. Point at the mirror and ask “which way do I cross it?”'],
    origin: ['Changes both signs (a half turn), not one.', 'A mirror flips one way only. Draw the straight path to the mirror; only the number along that path changes.'],
    same: ['Leaves the point where it is.', 'The image is on the other side of the mirror. Count to the mirror, then the same again past it.'],
    short: ['Stops on the mirror.', 'Count to the mirror, then keep going the same number past it.'],
    axisline: ['Reflects across the axis instead of the line x = a (or y = b).', 'Find the mirror line first and count from it, not from the axis: x = −2 is two left of the y-axis.'],
    dist: ['Counts the distance from the axis, then goes that far past the line.', 'Count squares from the point to the mirror line itself, then the same number past it. Rule: x → 2a − x.'],
    diag: ['Mixes up y = x and y = −x.', 'y = x goes up to the right: just swap the numbers. y = −x goes down to the right: swap and change both signs. Check with one point: (1, 0) → (0, 1) or (0, −1).'],
    nosw: ['Changes the signs but doesn’t swap the numbers.', 'Across a diagonal mirror the numbers trade places: (x, y) → (y, x) for y = x; (−y, −x) for y = −x.'],
    turn: ['Turns 90° instead of reflecting.', 'A turn swaps and changes one sign; a reflection across y = x just swaps, across y = −x swaps and changes both signs.'],
    other: ['Miscounts the distance to the mirror.', 'Count the squares from the point straight to the mirror (draw the path), then the same number past it.']
  };

  Apparatus.define({
    id: 'geo-reflect',
    title: 'Reflect It',
    ideas: {
      ax:  { name: 'Across the x-axis or the y-axis', easy: ['ax-2'], hard: ['ax-1', 'ax-0'], check: 'ax-0' },
      dg:  { name: 'Across y = x or y = −x', easy: ['dg-2'], hard: ['dg-1', 'dg-0'], check: 'dg-0' },
      ln:  { name: 'Across x = a or y = b', easy: ['ln-2'], hard: ['ln-2f', 'ln-1'], check: 'ln-0' },
      fig: { name: 'A whole figure', easy: ['fig-ax'], hard: ['fig', 'fig-type'], late: true, check: 'fig' }
    },
    kinds: {
      'ax-2': mk('ax', () => point(AX, 2)), 'ax-1': mk('ax', () => point(AX, 1)), 'ax-0': mk('ax', () => point(AX, 0)),
      'dg-2': mk('dg', () => point(DG, 2)), 'dg-1': mk('dg', () => point(DG, 1)), 'dg-0': mk('dg', () => point(DG, 0)),
      'ln-2': mk('ln', () => linePoint(2, false)), 'ln-2f': mk('ln', () => linePoint(2, true)),
      'ln-1': mk('ln', () => linePoint(1, true)), 'ln-0': mk('ln', () => linePoint(0, any([true, false]))),
      'fig-ax': mk('fig', () => figure(AX, true)),
      'fig': mk('fig', () => figure(() => any([any(DG), LINES(), LINES()]), false)),
      'fig-type': mk('fig', typedSeg)
    },
    // the contrast set: one point, three mirrors, the distance shown
    opening: [
      { kind: 'ax-2', item: { k: 'pt', L: { y: 0 }, p: [4, 2], lvl: 2 } },
      { kind: 'ax-2', item: { k: 'pt', L: { x: 0 }, p: [4, 2], lvl: 2 } },
      { kind: 'dg-2', item: { k: 'pt', L: { m: 1 }, p: [4, 2], lvl: 2 } }
    ],
    nextOnRight: true,
    defaults: { fix: 1 },
    text: it => it.k === 'pt' ? `P${pt(it.p)} across ${lname(it.L)}${it.lvl === 2 ? ' (distance shown)' : it.lvl === 0 ? ' (no grid)' : ''}`
      : `${it.v.map((p, i) => NAMES[i] + pt(p)).join(' ')} across ${lname(it.L)}${it.typed ? ' (typed)' : ''}`,
    speak: it => it.k === 'pt' ? `P is at ${pt(it.p)}. Reflect it across ${lname(it.L)}.`
      : `${it.v.map((p, i) => `${NAMES[i]} is at ${pt(p)}`).join(', ')}. Reflect the figure across ${lname(it.L)}${it.typed ? '' : ' by tapping the image’s vertices'}.`,
    ask(el, it, submit, ctx) {
      el._x = null;
      if (it.k === 'fig') return askFig(el, it, submit);
      askPoint(el, it, ctx && ctx.mode === 'warm' ? 0 : it.lvl ?? 1, submit);
    },
    correct: it => want(it).map((q, i) => `${nameOf(it, i)}′${pt(q)}`).join(' '),
    isRight: (it, a) => want(it).every((q, i) => same(q, a.pts[i])),
    // the first wrong vertex names the error
    classify(it, a) {
      const P = pres(it), i = P.findIndex((p, j) => !same(refl(it.L, p), a.pts[j]));
      return i < 0 ? 'other' : errOf(it.L, P[i], a.pts[i]) || 'other';
    },
    feedback(it, w, a, kind, err) {
      const P = pres(it), i = P.findIndex((p, j) => !same(refl(it.L, p), a.pts[j]));
      return i < 0 ? ['pic', ''] : ['pic', say(it.L, P[i], a.pts[i], err, nameOf(it, i))];
    },
    reveal(el, it, a, o) {
      const x = el._x; if (!x) return;
      const W = want(it), P = pres(it), oks = W.map((q, i) => same(q, a.pts[i]));
      W.forEach((_, i) => ['x', 'y'].forEach((c, k) => { const b = el.querySelector(`.sf[data-n="${c}${i}"]`); b && b.classList.add(a.pts[i][k] === W[i][k] ? 'ok' : 'no'); }));
      if (x.plot) {
        x.plot.mark(oks);
        if (o.right) return;
        // the right image faint, and the path for each missed vertex (the wrong dots stay red)
        const g = x.g;
        if (P.length > 2) g.poly(W, 'pg rf-want'); else g.seg(W[0], W[1], 'sg rf-want');
        P.forEach((p, i) => { if (!oks[i]) showImage(g, it, p, NAMES[i], false); });
        return;
      }
      if (it.typed) {
        if (o.right) return;
        // the picture only fits when the numbers are small
        if (!P.concat(W).every(p => inGrid(p))) return;
      }
      // points: the path ticked on both sides of the mirror, and P′; a wrong answer as a red dot
      if (!x.g) {
        if (o.right) return;
        const gb = document.createElement('div'), head = el.querySelector('.rf-head'); gb.className = 'gridbox';
        if (head) head.hidden = true;      // the legend has P now
        el.querySelector('.gq').insertBefore(gb, el.querySelector('.gq').firstChild);
        x.g = grid(gb, it);
      }
      const g = x.g;
      if (!o.right && !x.dist && it.k === 'pt') legendDist(g, it.L, it.p);
      g.svg.querySelectorAll('.rf-half:not(.ok), .ln.rf-ray').forEach(n => g.remove(n));
      P.forEach((p, i) => {
        if (!o.right && a.pts[i] && !oks[i] && inGrid(a.pts[i]) && !same(a.pts[i], p)) g.dot(a.pts[i], 'pt no');
        showImage(g, it, p, nameOf(it, i), it.k === 'pt');
      });
    },
    errors: {
      axis: 'changed the wrong number (other axis)', origin: 'changed both signs', same: 'left it where it was', short: 'stopped on the mirror',
      axisline: 'reflected across the axis, not the line', dist: 'counted the distance from the axis', diag: 'mixed up y = x and y = −x',
      nosw: 'changed signs, didn’t swap', turn: 'turned 90° instead', other: 'miscounted'
    },
    diagnose: err => TIPS[err] || ['', ''],
    get keyHTML() {
      const host = document.createElement('div'), g = grid(host, KEY);
      showImage(g, KEY, KEY.p, 'P', true);
      const row = (a, b) => `<div><span class="rf-kl">${a}</span> ${b}</div>`;
      return `<div class="gk rf-key"><div class="gridbox">${host.innerHTML}</div><div>across x = 1: as far past the mirror as before it</div>`
        + row('x-axis', '(x, y) → (x, −y)') + row('y-axis', '(x, y) → (−x, y)') + row('y = x', '(x, y) → (y, x)') + row('y = −x', '(x, y) → (−y, −x)')
        + row('x = a', 'x → 2a − x') + row('y = b', 'y → 2b − y') + '</div>';
    }
  });
})();
