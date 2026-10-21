// Name the Transformation (T5) — a figure and its image on the grid: which move made it?
// The method, one plain question at a time (lvl 2, Steps pick rows; first tries graded, fixed in place):
//   Is the image facing the same way?   (A → B → C goes the same way around as A′ → B′ → C′; a reflection reverses it)
//     No  → Across which line?           (x-axis, y-axis, y = x, y = −x)
//     Yes → Does every vertex move by the same vector?
//             Yes → Which vector?  ⟨□, □⟩        No → How far, which way?  (90° counterclockwise, 180°, 90° clockwise)
// Then it fades to the test's format (Ch. 5 Test A, Q3 and Q6): lvl 1 = the grid and four named choices
// ("a rotation 270° clockwise", "a reflection across the line y = x" …, or four vectors); lvl 0 = coordinates only.
// The next-session check is lvl 0.
// A wrong pick: one cue on the grid + one sentence about the PICKED answer —
//   the wrong family (rotation ↔ reflection): the direction arrows on both figures' sides (the order kept or reversed);
//   the right family, wrong details: where the picked move would put the figure (faint red);
//   a vector: the run and rise from A to A′ (blue, green).
// Traps: a rotation called a reflection; 270° clockwise vs counterclockwise; a reflection across y = x vs a 90° turn.
// Moves are ids: rx (x-axis), ry (y-axis), rd (y = x), ra (y = −x), vx2 (x = 2), hy-1 (y = −1), r90 / r180 / r270
// (counterclockwise, about the origin), t8,-1 (the vector ⟨8, −1⟩). Spec: specs/geometry-transformations.md (T5).
// Uses lib/grid.js (+ grid-extra.css), lib/frac.js, lib/pick.js, lib/steps.js (+ steps.css), lib/plot.js (mirror lines);
// styles lib/name-it.css.
(function () {
  const G = Grid, s = G.sgn;
  const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), any = a => a[r(0, a.length - 1)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = r(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pt = p => `(${s(p[0])},\u00a0${s(p[1])})`, vec = v => `⟨${s(v[0])}, ${s(v[1])}⟩`;
  const same = (p, q) => p[0] === q[0] && p[1] === q[1];
  const cap = t => t[0].toUpperCase() + t.slice(1);

  // ---- the moves ----
  const MAP = { rx: ([x, y]) => [x, -y], ry: ([x, y]) => [-x, y], rd: ([x, y]) => [y, x], ra: ([x, y]) => [-y, -x],
    r90: ([x, y]) => [-y, x], r180: ([x, y]) => [-x, -y], r270: ([x, y]) => [y, -x] };
  const num = (id, re) => { const m = re.exec(id); return m ? m.slice(1).map(Number) : null; };
  const vxA = id => num(id, /^vx(-?\d+)$/), hyB = id => num(id, /^hy(-?\d+)$/), tV = id => num(id, /^t(-?\d+),(-?\d+)$/);
  function apply(id, p) {
    let m;
    if ((m = vxA(id))) return [2 * m[0] - p[0], p[1]];
    if ((m = hyB(id))) return [p[0], 2 * m[0] - p[1]];
    if ((m = tV(id))) return [p[0] + m[0], p[1] + m[1]];
    return MAP[id](p);
  }
  const fam = id => /^r(90|180|270)$/.test(id) ? 'rot' : id[0] === 't' ? 'tr' : 'ref';
  // which side of the mirror a point is on (0: on it)
  const side = (id, [x, y]) => { let m; if ((m = vxA(id))) return Math.sign(x - m[0]); if ((m = hyB(id))) return Math.sign(y - m[0]);
    return Math.sign({ rx: y, ry: x, rd: y - x, ra: y + x }[id]); };
  const mirrorOf = id => { let m; if ((m = vxA(id))) return { x: m[0] }; if ((m = hyB(id))) return { y: m[0] };
    return { rx: { y: 0 }, ry: { x: 0 }, rd: { m: 1 }, ra: { m: -1 } }[id]; };

  // names: the line ("the line y = x"), the turn ("90° counterclockwise"; r90 can also be called "270° clockwise")
  const LINE = { rx: 'the x-axis', ry: 'the y-axis', rd: 'the line y = x', ra: 'the line y = −x' };
  const lineName = id => { let m; if ((m = vxA(id))) return `the line x = ${s(m[0])}`; if ((m = hyB(id))) return `the line y = ${s(m[0])}`; return LINE[id]; };
  const TURN = { r90: { ccw: '90° counterclockwise', cw: '270° clockwise' }, r180: { ccw: '180°', cw: '180°' }, r270: { ccw: '270° counterclockwise', cw: '90° clockwise' } };
  const turnName = (id, way = 'ccw') => TURN[id][way];
  // the full name, as on the test: "a reflection across the x-axis", "a rotation 270° clockwise", "a translation by ⟨8, −1⟩"
  const fullName = (id, way) => { const f = fam(id); return f === 'ref' ? `a reflection across ${lineName(id)}` : f === 'rot' ? `a rotation ${turnName(id, way)}` : `a translation by ${vec(tV(id))}`; };
  const label = (it, id) => fam(id) === 'tr' ? vec(tV(id)) : fullName(id, it.way);

  // ---- the figures ----
  // small scalene triangles (ABC) and quadrilaterals (WXYZ, as in the test's Q3), placed in one of 8 ways
  const TRI = [[[0, 0], [3, 0], [1, 2]], [[0, 0], [3, 1], [1, 2]], [[0, 0], [2, 0], [3, 2]], [[0, 0], [1, 3], [3, 2]], [[0, 0], [4, 1], [1, 2]], [[0, 0], [3, 1], [2, 3]]];
  const QUAD = [[[0, 0], [3, 0], [4, 2], [1, 3]], [[0, 0], [2, 0], [3, 3], [0, 2]], [[0, 0], [3, 1], [2, 3], [0, 2]], [[0, 0], [4, 0], [3, 2], [1, 2]]];
  const SYM = [p => p, ([x, y]) => [-y, x], ([x, y]) => [-x, -y], ([x, y]) => [y, -x], ([x, y]) => [-x, y], ([x, y]) => [x, -y], ([x, y]) => [y, x], ([x, y]) => [-y, -x]];
  const area2 = ps => ps.reduce((a, p, i) => { const q = ps[(i + 1) % ps.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0);
  const ccw = ps => area2(ps) > 0;
  const inBox = (ps, k = 5) => ps.every(p => Math.abs(p[0]) <= k && Math.abs(p[1]) <= k);
  const NAMES = { 3: ['A', 'B', 'C'], 4: ['W', 'X', 'Y', 'Z'] };
  const prime = n => n + '′';

  // the move for a kind
  let AB = true;   // rule: lines x = a and y = b
  function moveFor(fm, lvl) {
    if (fm === 'flip') {
      const ls = ['rx', 'ry', 'rd', 'ra'];
      if (lvl < 2 && AB && Math.random() < 0.35) return any([`vx${any([-3, -2, -1, 1, 2, 3])}`, `hy${any([-3, -2, -1, 1, 2, 3])}`]);
      return any(ls);
    }
    if (fm === 'alike') return any(['rd', 'ra']);
    if (fm === 'turn') return any(['r90', 'r180', 'r270']);
    for (;;) { const a = any([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]), b = any([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]); if (Math.abs(a) !== Math.abs(b)) return `t${a},${b}`; }
  }
  // a fitting figure for a move: inside ±5 before and after; across a mirror, on one side of it; turned, in one quadrant
  function figureFor(id, quad) {
    for (let k = 0; k < 400; k++) {
      const base = any(quad ? QUAD : TRI).map(any(SYM));
      const o = [r(-5, 5), r(-5, 5)], pre = base.map(p => [p[0] + o[0], p[1] + o[1]]), img = pre.map(p => apply(id, p));
      if (!inBox(pre) || !inBox(img)) continue;
      const f = fam(id);
      if (f === 'ref') { const sd = pre.map(p => side(id, p)); if (sd.some(v => v === 0) || sd.some(v => v !== sd[0])) continue; }
      if (f === 'rot' && !(pre.every(p => p[0] > 0) || pre.every(p => p[0] < 0)) || f === 'rot' && !(pre.every(p => p[1] > 0) || pre.every(p => p[1] < 0))) continue;
      // the image apart from the figure (no shared corner)
      if (pre.some(p => img.some(q => same(p, q)))) continue;
      return { pre, img };
    }
    return null;
  }
  // the four named choices: the right one and its traps (the look-alikes first), each landing somewhere else
  const TRAPS = {
    r90: ['r270', 'rd', 'rx', 'r180'], r270: ['r90', 'ra', 'ry', 'r180'], r180: ['rx', 'ry', 'r90', 'r270'],
    rx: ['ry', 'r180', 'rd', 'ra'], ry: ['rx', 'r180', 'ra', 'rd'], rd: ['ra', 'r90', 'r270', 'rx'], ra: ['rd', 'r270', 'r90', 'ry']
  };
  function trapsFor(id) {
    let m;
    if ((m = vxA(id))) return ['ry', `vx${-m[0]}`, `hy${m[0]}`, 'rx'];
    if ((m = hyB(id))) return ['rx', `hy${-m[0]}`, `vx${m[0]}`, 'ry'];
    if ((m = tV(id))) { const [a, b] = m; return [`t${b},${a}`, `t${-a},${-b}`, `t${-b},${-a}`, `t${-a},${b}`, `t${a},${-b}`]; }
    return TRAPS[id];
  }
  function finish(it) {
    const imgs = [it.img], ch = [it.t];
    for (const id of trapsFor(it.t)) {
      if (ch.length === 4) break;
      const im = it.pre.map(p => apply(id, p));
      if (ch.includes(id) || imgs.some(x => x.every((q, i) => same(q, im[i])))) continue;
      ch.push(id); imgs.push(im);
    }
    it.ch = shuffle(ch);
    it.n = NAMES[it.pre.length];
    return it;
  }
  function makeItem(fm, lvl) {
    for (let k = 0; k < 50; k++) {
      const id = moveFor(fm, lvl), f = figureFor(id, lvl < 2 && Math.random() < 0.3);
      if (f) return finish({ t: id, pre: f.pre, img: f.img, lvl, way: any(['cw', 'ccw']) });
    }
    return finish({ t: 'ry', pre: [[1, 1], [4, 2], [2, 4]], img: [[-1, 1], [-4, 2], [-2, 4]], lvl, way: 'cw' });
  }

  // ---- sentences ----
  const nm = (it, i, im) => (im ? prime(it.n[i]) : it.n[i]) + pt((im ? it.img : it.pre)[i]);
  const around = (it, im) => (im ? it.n.map(prime) : it.n).join(' → ');
  const way = ps => ccw(ps) ? 'counterclockwise' : 'clockwise';
  const moveOf = (it, i) => [it.img[i][0] - it.pre[i][0], it.img[i][1] - it.pre[i][1]];
  const words = v => [v[0] && `${Math.abs(v[0])} ${v[0] < 0 ? 'left' : 'right'}`, v[1] && `${Math.abs(v[1])} ${v[1] < 0 ? 'down' : 'up'}`].filter(Boolean).join(' and ');
  // a wrong vector (typed or picked): reversed, swapped, a sign lost
  function vecWrong(it, a) {
    const v = tV(it.t), A = it.n[0], go = `From ${A} to ${prime(A)} is ${words(v)}: ${vec(v)}.`;
    if (a[0] === -v[0] && a[1] === -v[1]) return ['vec-rev', go];
    if (a[0] === v[1] && a[1] === v[0]) return ['vec-swap', `The across part comes first: ${vec(v)}.`];
    if (Math.abs(a[0]) === Math.abs(v[0]) && Math.abs(a[1]) === Math.abs(v[1])) {
      const k = a[0] !== v[0] ? 0 : 1, w = [['Left', 'Right'], ['Down', 'Up']][k][v[k] < 0 ? 0 : 1];
      return ['vec-sign', `${w} is ${v[k] < 0 ? 'negative' : 'positive'}: ${vec(v)}.`];
    }
    return ['vec', go];
  }
  // the error type of a picked move
  function errType(t, p) {
    const ft = fam(t), fp = fam(p);
    if (ft !== fp) return `${ft}>${fp}`;
    if (ft === 'rot') return t === 'r180' || p === 'r180' ? 'angle' : 'dir';
    if (ft === 'tr') { const v = tV(p); return vecWrong({ t, n: ['A'] }, v)[0]; }
    const pair = [t, p].sort().join();
    if (pair === 'rx,ry') return 'axis';
    if (pair === 'ra,rd') return 'diag';
    if (vxA(t) || hyB(t) || vxA(p) || hyB(p)) return 'ab';
    return 'line';
  }
  // one sentence about the picked move
  function wrongSay(it, p, stepLabel) {
    const ft = fam(it.t), fp = fam(p);
    if (ft === 'rot' && fp === 'ref') return 'A reflection reverses the order of the vertices; here it’s kept: a rotation.';
    if (ft === 'ref' && fp === 'rot') return 'A rotation keeps the order of the vertices; here it’s reversed: a reflection.';
    if (ft === 'tr') return vecWrong(it, tV(p))[1];
    // a vertex the picked move sends somewhere else (and not onto itself, if there is one)
    const off = k => !same(apply(p, it.pre[k]), it.img[k]), still = k => same(apply(p, it.pre[k]), it.pre[k]);
    const ks = it.pre.map((_, k) => k), i = ks.find(k => off(k) && !still(k)) ?? ks.find(off) ?? 0, q = apply(p, it.pre[i]);
    // the right answer called "270° …": the two names of one turn
    if (ft === 'rot' && !stepLabel && it.t !== 'r180' && /^270/.test(turnName(it.t, it.way))) {
      const o = it.way === 'cw' ? 'counterclockwise' : 'clockwise';
      return `270° ${it.way === 'cw' ? 'clockwise' : 'counterclockwise'} is the same as 90° ${o}: ${nm(it, i)} → ${pt(it.img[i])}.`;
    }
    const how = fp === 'rot' ? `Turned ${stepLabel || turnName(p, it.way)}` : `Across ${lineName(p)}`;
    return `${how}, ${nm(it, i)} would land on ${pt(q)}, not on ${nm(it, i, true)}.`;
  }
  const sameSay = (it, a) => a === 'y'
    ? `${around(it)} goes ${way(it.pre)}, but ${around(it, true)} goes ${way(it.img)}: the image is flipped.`
    : `${around(it)} and ${around(it, true)} both go ${way(it.pre)}: it faces the same way.`;
  function vecSay(it, a) {
    if (a === 'n') return `Every vertex moves ${vec(moveOf(it, 0))}.`;
    const j = it.pre.findIndex((q, k) => k && !same(moveOf(it, k), moveOf(it, 0)));
    return `${it.n[0]} moves ${vec(moveOf(it, 0))} but ${it.n[j]} moves ${vec(moveOf(it, j))}: not the same.`;
  }

  // ---- the picture ----
  // the figure in ink, its image in blue; letters on the grid, coordinates in the legend
  function picture(host, it) {
    const g = G.make(host, { min: -6, max: 6 });
    g.poly(it.pre, 'pg');
    g.poly(it.img, 'pg nm-img');
    it.pre.forEach((p, i) => g.dot(p, 'pt', nm(it, i)));
    it.img.forEach((p, i) => g.dot(p, 'pt nm-i', nm(it, i, true)));
    return g;
  }
  const NS = 'http://www.w3.org/2000/svg';
  // the order around: a small chevron on each side, pointing A → B → C → A (the image's too)
  function arrows(g, it, cls = '') {
    const grp = document.createElementNS(NS, 'g'); grp.setAttribute('class', 'nm-dirs' + (cls ? ' ' + cls : ''));
    [it.pre, it.img].forEach((ps, k) => ps.forEach((p, i) => {
      const q = ps[(i + 1) % ps.length], ax = g.X(p[0]), ay = g.Y(p[1]), bx = g.X(q[0]), by = g.Y(q[1]);
      const l = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / l, uy = (by - ay) / l, mx = (ax + bx) / 2, my = (ay + by) / 2;
      const tip = [mx + ux * 4, my + uy * 4], w1 = [mx - ux * 3 - uy * 5, my - uy * 3 + ux * 5], w2 = [mx - ux * 3 + uy * 5, my - uy * 3 - ux * 5];
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', `M${w1[0].toFixed(1)} ${w1[1].toFixed(1)}L${tip[0].toFixed(1)} ${tip[1].toFixed(1)}L${w2[0].toFixed(1)} ${w2[1].toFixed(1)}`);
      path.setAttribute('class', k ? 'nm-dir nm-dir-i' : 'nm-dir');
      grp.appendChild(path);
    }));
    g.svg.querySelector('.g-draw').appendChild(grp);
    return grp;
  }
  // each vertex to its image, dashed (the same arrow every time: a translation)
  const moves = (g, it) => it.pre.map((p, i) => g.seg(p, it.img[i], 'sg nm-mv'));
  // the turn: from the origin to A and to A′ (the right-angle square on a quarter turn)
  function spokes(g, it) {
    const A = it.pre[0], A1 = it.img[0], O = [0, 0];
    const n = [g.seg(O, A, 'sg nm-sp'), g.seg(O, A1, 'sg nm-sp')];
    if (it.t !== 'r180') n.push(g.rightMark(O, A, A1, 'rmark ok'));
    return n;
  }
  // a cue drawn once per question (the grid keeps it)
  function cue(g, it, p) {
    const ft = fam(it.t);
    if (ft !== fam(p)) return arrows(g, it, 'cue');
    if (ft === 'tr') return g.triangle(it.pre[0], it.img[0], { labels: true });
    if (ft === 'ref') Plot.mirror(g, mirrorOf(p), 'ln mirror nm-mno');
    return g.poly(it.pre.map(q => apply(p, q)), 'pg faint no nm-ghost');
  }

  // ---- lvl 2: one question at a time, on the grid; answered questions fold into one line of findings ----
  const YN = [['y', 'Yes'], ['n', 'No']];
  const STEP_LINES = ['rx', 'ry', 'rd', 'ra'];
  const STEP_TURN = { r90: '90° counterclockwise', r180: '180°', r270: '90° clockwise' };
  function askSteps(el, it, submit) {
    el.innerHTML = `<div class="gq nm"><div class="gridbox"></div><div class="nm-sum" aria-live="polite"></div><div class="nm-s"></div></div>`;
    const g = el._g = picture(el.querySelector('.gridbox'), it), ft = fam(it.t);
    const sum = el.querySelector('.nm-sum'), note = t => sum.insertAdjacentHTML('beforeend', `<span>${t}</span>`);
    let ghost = [], dirs = null, mv = null, tri = null;
    const unghost = () => { ghost.forEach(n => g.remove(n)); ghost = []; };
    // where the picked move would put it (and the picked mirror)
    const showGhost = id => { unghost(); ghost = [g.poly(it.pre.map(q => apply(id, q)), 'pg faint no nm-ghost')]; if (fam(id) === 'ref') ghost.push(Plot.mirror(g, mirrorOf(id), 'ln mirror nm-mno')); };
    const showDirs = () => { dirs = dirs || arrows(g, it); };
    const showMoves = () => { mv = mv || moves(g, it); };
    const hideMoves = () => { (mv || []).forEach(n => g.remove(n)); mv = null; };
    const showTri = () => { tri = tri || g.triangle(it.pre[0], it.img[0], { labels: true }); };
    const lines = STEP_LINES.includes(it.t) ? STEP_LINES : shuffle([it.t, ...trapsFor(it.t).filter(id => fam(id) === 'ref').slice(0, 3)]);
    const steps = [{
      text: 'Is the image facing the same way?', pick: YN, want: ft === 'ref' ? 'n' : 'y', cols: 2, name: 'same',
      why: a => { showDirs(); return [`q-same>${a}`, sameSay(it, a)]; },
      onRight: () => { showDirs(); note(ft === 'ref' ? 'flipped' : 'same way'); }
    }];
    if (ft === 'ref') steps.push({
      text: 'Across which line?', pick: lines.map(id => [id, lineName(id).replace('the line ', '')]), want: it.t, cols: 2, name: 'line',
      why: id => { showGhost(id); return [errType(it.t, id), wrongSay(it, id)]; },
      onRight: () => { unghost(); Plot.mirror(g, mirrorOf(it.t), 'ln mirror nm-m'); note(`across ${lineName(it.t).replace('the line ', '')}`); }
    });
    else steps.push({
      text: 'Does every vertex move by the same vector?', pick: YN, want: ft === 'tr' ? 'y' : 'n', cols: 2, name: 'vec',
      why: a => { showMoves(); return [`q-vec>${a}`, vecSay(it, a)]; },
      onRight: () => { showMoves(); note(ft === 'tr' ? 'same vector: a translation' : 'not the same: a rotation'); }
    });
    if (ft === 'tr') {
      const v = tV(it.t);
      steps.push(() => ({
        text: 'Which vector?', boxes: [['a', v[0], 'vec'], ['b', v[1], 'vec']], kind: 'dec', eq: '⟨{a},&nbsp;{b}⟩',
        why: () => { hideMoves(); showTri(); const rd = n => run.values[n] && run.values[n].v && !run.values[n].v.undef ? Frac.num(run.values[n].v) : NaN; return vecWrong(it, [rd('a'), rd('b')]); },
        onRight: () => showTri()
      }));
    }
    if (ft === 'rot') steps.push(() => (hideMoves(), {
      text: 'How far, which way?', cols: 1, name: 'turn', want: it.t,
      pick: ['r90', 'r180', 'r270'].map(id => [id, id === 'r270' ? `90° clockwise <small>(= 270° counterclockwise)</small>` : STEP_TURN[id]]),
      why: id => { showGhost(id); return [errType(it.t, id), wrongSay(it, id, STEP_TURN[id])]; },
      onRight: () => { unghost(); spokes(g, it); note(STEP_TURN[it.t]); }
    }));
    const run = Steps.run(el.querySelector('.nm-s'), steps, {
      final: () => `${cap(ft === 'rot' ? `a rotation ${STEP_TURN[it.t]}` : fullName(it.t)).replace(/-axis/, '\u2011axis')}.`,
      done: errs => submit({ pick: it.t, errs })
    });
    el._run = run;
  }

  // ---- lvl 1 (the grid) and lvl 0 (coordinates only): the test's four named choices ----
  // each vertex beside its image: W(−2, −5)  W′(−2, 3)
  const vertsHTML = it => `<div class="q nm-v">${it.pre.map((p, i) => `<span><b>${it.n[i]}</b>${pt(p)}</span><span><b>${prime(it.n[i])}</b>${pt(it.img[i])}</span>`).join('')}</div>`;
  const fig = it => it.n.join(''), figI = it => it.n.map(prime).join('');
  const question = it => fam(it.t) === 'tr' ? `Which vector maps ${fig(it)} onto ${figI(it)}?` : `Which transformation maps ${fig(it)} onto ${figI(it)}?`;
  function askName(el, it, lvl, submit) {
    el.innerHTML = `<div class="gq nm">${lvl ? '<div class="gridbox"></div>' : vertsHTML(it)}<div class="nm-n"><div class="q small">${question(it)}</div></div></div>`;
    el._g = lvl ? picture(el.querySelector('.gridbox'), it) : null;
    const tr = fam(it.t) === 'tr';
    Pick.ask(el.querySelector('.nm-n'), it.ch.map(id => [id, label(it, id)]), id => submit({ pick: id, errs: [] }), { cols: tr ? 2 : 1 });
  }

  // ---- analytics: what a miss means ----
  const ERR = {
    'rot>ref': 'a rotation called a reflection', 'ref>rot': 'a reflection called a rotation',
    dir: 'clockwise ↔ counterclockwise (90° vs 270°)', angle: '180° mixed up with a quarter turn',
    axis: 'x-axis ↔ y-axis', diag: 'y = x ↔ y = −x', line: 'a diagonal line ↔ an axis', ab: 'x = a / y = b mixed up (the axis, the sign, x vs y)',
    'vec-rev': 'vector reversed (image to preimage)', 'vec-swap': 'vector swapped ⟨b, a⟩', 'vec-sign': 'a sign lost in the vector', vec: 'wrong vector',
    'q-same>y': 'a flipped image called “facing the same way”', 'q-same>n': 'an image facing the same way called flipped',
    'q-vec>y': 'a turn taken for a slide (vectors differ)', 'q-vec>n': 'a slide taken for a turn (same vector)'
  };
  const TIP = {
    'rot>ref': ['Calls a turned figure a reflection; it often looks flipped (a 90° turn looks like a flip across y = x).', 'Check the order: go A → B → C on the figure and on the image. Same way around: a rotation (or a translation). Reversed: a reflection.'],
    'ref>rot': ['Calls a flipped figure a rotation.', 'Go A → B → C and A′ → B′ → C′: if one goes clockwise and the other counterclockwise, it’s a reflection. A turn never reverses the order.'],
    dir: ['Mixes up the direction of a turn (90° clockwise vs counterclockwise), or doesn’t see that 270° one way is 90° the other.', 'Follow one vertex from the origin: a quarter turn counterclockwise sends (x, y) to (−y, x). 270° clockwise is the same turn as 90° counterclockwise.'],
    angle: ['Mixes up a half turn (180°) with a quarter turn.', '180° sends (x, y) to (−x, −y): both signs change, the numbers don’t swap. 90° swaps them.'],
    axis: ['Mixes up the x-axis and the y-axis as mirrors.', 'Across the x-axis the x stays and y changes sign (up ↔ down). Across the y-axis the y stays (left ↔ right).'],
    diag: ['Mixes up y = x and y = −x.', 'Across y = x the numbers just swap: (x, y) → (y, x). Across y = −x they swap and both change sign: (−y, −x).'],
    line: ['Takes a diagonal mirror for an axis (or the other way round).', 'Check one vertex: across an axis only one number changes; across y = x or y = −x the numbers swap.'],
    ab: ['Uses the axis (or the wrong line) when the mirror is x = a or y = b.', 'Find the line halfway between a vertex and its image: count the distance to it, and go as far past it.'],
    'vec-rev': ['Gives the vector backwards (preimage − image).', 'A vector goes from the preimage to the image: A′ − A. Count from A to A′: right/up positive, left/down negative.'],
    'vec-swap': ['Writes the rise first ⟨b, a⟩.', 'The across part (run) comes first, then up/down: ⟨run, rise⟩.'],
    'vec-sign': ['Loses a sign: left or down written as positive.', 'Left and down are negative. Count from A to A′ with signs.'],
    vec: ['Miscounts the vector.', 'Count from one vertex to its image: across first, then up or down.'],
    'q-same>y': ['Doesn’t see that the image is flipped.', 'Trace A → B → C, then A′ → B′ → C′. If one goes clockwise and the other counterclockwise, the image is flipped: a reflection.'],
    'q-same>n': ['Thinks a turned image is flipped (it looks different, but the order around is the same).', 'A turn or a slide keeps A → B → C going the same way around. Only a reflection reverses it.'],
    'q-vec>y': ['Takes a turn for a slide.', 'Compare two vertices’ moves (A to A′, B to B′): a translation moves every vertex by the same vector; a turn doesn’t.'],
    'q-vec>n': ['Takes a slide for a turn.', 'If A → A′ and B → B′ are the same run and rise, every point moved the same: a translation.']
  };

  const mk = (idea, fm, lvl) => ({ idea, make: () => makeItem(fm, lvl) });
  const itemText = it => `${it.pre.map((p, i) => it.n[i] + pt(p)).join(' ')} → ${it.img.map((p, i) => prime(it.n[i]) + pt(p)).join(' ')}${it.lvl === 0 ? '' : it.lvl === 2 ? ' (steps)' : ' (grid)'}`;

  Apparatus.define({
    id: 'geo-name-it',
    title: 'Name the Transformation',
    ideas: {
      turn:  { name: 'A rotation: how far, which way', easy: ['turn-2'], hard: ['turn-1', 'turn-0'], check: 'turn-0' },
      flip:  { name: 'A reflection: across which line', easy: ['flip-2'], hard: ['flip-1', 'flip-0'], check: 'flip-0' },
      slide: { name: 'A translation: which vector', easy: ['slide-2'], hard: ['slide-1'], check: 'slide-0' },
      alike: { name: 'Look-alikes: y = x or a 90° turn', late: true, easy: ['alike-2'], hard: ['alike-1'], check: 'alike-0' }
    },
    kinds: {
      'turn-2': mk('turn', 'turn', 2), 'turn-1': mk('turn', 'turn', 1), 'turn-0': mk('turn', 'turn', 0),
      'flip-2': mk('flip', 'flip', 2), 'flip-1': mk('flip', 'flip', 1), 'flip-0': mk('flip', 'flip', 0),
      'slide-2': mk('slide', 'slide', 2), 'slide-1': mk('slide', 'slide', 1), 'slide-0': mk('slide', 'slide', 0),
      'alike-2': mk('alike', 'alike', 2), 'alike-1': mk('alike', 'alike', 1), 'alike-0': mk('alike', 'alike', 0)
    },
    // the method on two contrasting pictures: a quarter turn that looks flipped (the test's Q3, smaller), then a real flip
    opening: [
      { kind: 'turn-2', item: finish({ t: 'r90', pre: [[-5, 4], [-1, 2], [-4, 1]], img: [[-4, -5], [-2, -1], [-1, -4]], lvl: 2, way: 'cw' }) },
      { kind: 'flip-2', item: finish({ t: 'rx', pre: [[1, 2], [5, 1], [3, 4]], img: [[1, -2], [5, -1], [3, -4]], lvl: 2, way: 'cw' }) }
    ],
    defaults: { fix: 1, ab: true },
    rules: [['ab', 'Mirrors x = a and y = b', [[true, 'On'], [false, 'Off']], 'Off: only the axes and y = ±x as mirror lines.']],
    configure(S) { AB = S.ab !== false; return {}; },
    nextOnRight: true,
    text: itemText,
    speak: it => `${fig(it)} with ${it.pre.map((p, i) => it.n[i] + pt(p)).join(', ')}, and its image ${figI(it)} with ${it.img.map((p, i) => prime(it.n[i]) + pt(p)).join(', ')}. ${question(it)}`,
    ask(el, it, submit, ctx) {
      const lvl = ctx && ctx.mode === 'warm' ? 0 : it.lvl;
      el._lvl = lvl;
      if (lvl === 2) return askSteps(el, it, submit);
      askName(el, it, lvl, submit);
    },
    correct: it => it.t,
    isRight: (it, a) => a.pick === it.t && a.errs.length === 0,
    classify: (it, a) => a.errs.length ? a.errs[0].type : errType(it.t, a.pick),
    feedback(it, w, a) {
      if (a.errs.length) return ['', a.errs[0].text];
      return [errType(it.t, a.pick), wrongSay(it, a.pick)];
    },
    reveal(el, it, a, o) {
      if (el._lvl === 2) return;
      Pick.mark(el, it.t, a.pick, o.right);
      if (o.right) return;
      if (!el._g) {
        const gb = document.createElement('div'); gb.className = 'gridbox';
        el.querySelector('.nm-v').after(gb);
        el._g = picture(gb, it);
      }
      cue(el._g, it, a.pick);
    },
    errors: ERR,
    diagnose: err => TIP[err] || ['', ''],
    get keyHTML() {
      const row = (a, b) => `<tr><td>${a}</td><td>${b}</td></tr>`;
      return `<div class="gk nm-k">
        <div class="tree"><div>Facing the same way? <i>(A → B → C)</i></div>
        <div class="in">No → a <b>reflection</b>: across which line?</div>
        <div class="in">Yes → every vertex moved by the same vector?</div>
        <div class="in2">Yes → a <b>translation</b> ⟨run, rise⟩</div>
        <div class="in2">No → a <b>rotation</b> about the origin</div></div>
        <table class="nm-rules">${row('across the x-axis', '(x, −y)')}${row('across the y-axis', '(−x, y)')}${row('across y = x', '(y, x)')}${row('across y = −x', '(−y, −x)')}
        ${row('90° counterclockwise', '(−y, x)')}${row('180°', '(−x, −y)')}${row('90° clockwise', '(y, −x)')}</table>
        <div class="nm-eq">270° clockwise = 90° counterclockwise</div></div>`;
    }
  });
})();
