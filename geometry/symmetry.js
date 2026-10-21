// Symmetry (T7) — lines of symmetry and the angle of rotational symmetry; T3's 360° ÷ n folded in.
//   a line of symmetry: fold on it and the halves match        the angle: the smallest turn that lands it on itself
//   a regular polygon with n sides: n lines, 360° ÷ n           backwards (late): sides = 360° ÷ the angle
// Everything is a plain drawing (no grid, no numbers): by eye first (a square, a rectangle, a kite…), then by count
// (regular n-gons drawn, then in words like the test's Q2; composite figures like Q11; a pinwheel turns but doesn't
// fold; a kite folds but doesn't turn). Each item asks "How many lines of symmetry?" then the turn (typed in the shared
// answer box; None for no turn), or the test's choices (lib/pick.js). A wrong part ends the item at once.
// A miss: the box red + one sentence on the PICKED answer, then a ›-stepped picture, one idea per step: a ghost copy
// folds on a line (green when it matches, red on a diagonal), the lines dashed, the ghost turning onto itself, the
// angle at the center (360° ÷ k), the corner angle (red) when that was given.
// Symmetries are computed from the drawing (edges compared after each fold and turn), never typed in by hand.
// Spec: specs/geometry-transformations.md (T7). Uses lib/frac.js, lib/pick.js; styles lib/symmetry.css.
(function () {
  const F = Frac, U = Apparatus.util, any = U.any, shuffle = U.shuffle;
  const rad = d => d * Math.PI / 180;
  const rotP = ([x, y], d) => { const c = Math.cos(rad(d)), s = Math.sin(rad(d)); return [x * c - y * s, x * s + y * c]; };
  // the reflection across the line through the center at angle d
  const refP = ([x, y], d) => { const c = Math.cos(rad(2 * d)), s = Math.sin(rad(2 * d)); return [x * c + y * s, x * s - y * c]; };
  const near = (a, b) => Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6;
  const fmt = x => String(Math.round(x * 100) / 100);
  const lines = n => `${n} line${n === 1 ? '' : 's'}`;

  // ---- the shapes: pieces (polygons, counterclockwise), centered on their vertices' average ----
  // a regular n-gon pointing up (odd n) or with a flat top (even n)
  const reg = (n, R = 1) => { const a0 = n % 2 ? 90 : 90 + 180 / n; return Array.from({ length: n }, (_, i) => rotP([R, 0], a0 + 360 * i / n)); };
  // a central regular polygon with a tile off each side, a gap away: tri (isosceles, like Q11), sq, or right (shifted: a pinwheel)
  function tiles(n, tile) {
    const C = reg(n), out = [C];
    C.forEach((a, i) => {
      const b = C[(i + 1) % n], s = Math.hypot(b[0] - a[0], b[1] - a[1]), t = [(b[0] - a[0]) / s, (b[1] - a[1]) / s], u = [t[1], -t[0]];
      const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], P = (al, be) => [m[0] + t[0] * al + u[0] * be, m[1] + t[1] * al + u[1] * be];
      const g = 0.14 * s, w = s * 0.5;
      if (tile === 'tri') out.push([P(-w, g), P(w, g), P(0, g + 0.6 * s)]);
      if (tile === 'sq') out.push([P(-w * 0.8, g), P(w * 0.8, g), P(w * 0.8, g + 1.6 * w * 0.8), P(-w * 0.8, g + 1.6 * w * 0.8)]);
      if (tile === 'right') out.push([P(-w, g), P(w, g), P(-w, g + 0.7 * s)]);
    });
    return out;
  }
  const blades = k => Array.from({ length: k }, (_, i) => [[0, 0], [1, 0], [0.62, 0.46]].map(p => rotP(p, 360 * i / k)));
  const star = () => Array.from({ length: 10 }, (_, i) => rotP([i % 2 ? 0.42 : 1, 0], 90 + 36 * i));
  const SHAPES = {
    square:  { pieces: () => [reg(4)], name: 'a square' },
    tri:     { pieces: () => [reg(3)], name: 'an equilateral triangle' },
    hex:     { pieces: () => [reg(6)], name: 'a regular hexagon' },
    reg:     { pieces: n => [reg(n)], name: n => `a regular polygon with ${n} sides`, regular: true },
    star:    { pieces: () => [star()], name: 'a five-pointed star' },
    rect:    { pieces: () => [[[-1, -0.55], [1, -0.55], [1, 0.55], [-1, 0.55]]], name: 'a rectangle' },
    rhombus: { pieces: () => [[[0, -1], [0.62, 0], [0, 1], [-0.62, 0]]], name: 'a rhombus' },
    pgram:   { pieces: () => [[[-1, -0.5], [0.45, -0.5], [1, 0.5], [-0.45, 0.5]]], name: 'a parallelogram' },
    iso:     { pieces: () => [[[-0.6, -0.8], [0.6, -0.8], [0, 1]]], name: 'an isosceles triangle' },
    kite:    { pieces: () => [[[0, -1], [0.6, 0.3], [0, 0.75], [-0.6, 0.3]]], name: 'a kite' },
    arrow:   { pieces: () => [[[0, 1], [-0.75, 0.15], [-0.3, 0.15], [-0.3, -1], [0.3, -1], [0.3, 0.15], [0.75, 0.15]]], name: 'an arrow' },
    trap:    { pieces: () => [[[-1, -0.5], [1, -0.5], [0.5, 0.5], [-0.5, 0.5]]], name: 'an isosceles trapezoid' },
    zed:     { pieces: () => [[[-1, 1], [1, 1], [1, 0.6], [-0.35, -0.6], [1, -0.6], [1, -1], [-1, -1], [-1, -0.6], [0.35, 0.6], [-1, 0.6]]], name: 'a Z' },
    blades:  { pieces: k => blades(k), name: 'a pinwheel' },
    comp:    { pieces: ([n, t]) => tiles(n, t), name: ([n, t]) => t === 'right' ? 'a pinwheel of tiles' : `a ${['', '', '', 'triangle', 'square', '', 'hexagon'][n]} with ${n} tiles around it`, regular: true }
  };
  const cache = {};
  // { pieces, segs, axes (degrees, 0 ≤ a < 180), L, k (turns that fit in 360°), T (the angle, or null), n (sides, regular), I (corner angle) }
  function shapeOf(it) {
    const key = JSON.stringify([it.s, it.p, it.tilt || 0]);
    if (cache[key]) return cache[key];
    const def = SHAPES[it.s];
    let pieces = def.pieces(it.p);
    if (it.tilt) pieces = pieces.map(pc => pc.map(p => rotP(p, it.tilt)));
    const vs = []; pieces.flat().forEach(p => { if (!vs.some(q => near(p, q))) vs.push(p); });
    const c = [vs.reduce((a, p) => a + p[0], 0) / vs.length, vs.reduce((a, p) => a + p[1], 0) / vs.length];
    pieces = pieces.map(pc => pc.map(p => [p[0] - c[0], p[1] - c[1]]));
    const segs = pieces.flatMap(pc => pc.map((a, i) => [a, pc[(i + 1) % pc.length]]));
    const same = f => segs.every(([a, b]) => { const A = f(a), B = f(b); return segs.some(([p, q]) => (near(A, p) && near(B, q)) || (near(A, q) && near(B, p))); });
    const cand = [];
    segs.forEach(([a, b]) => [a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]].forEach(p => {
      if (Math.hypot(...p) < 1e-6) return;
      [0, 90].forEach(o => { const d = ((Math.atan2(p[1], p[0]) * 180 / Math.PI + o) % 180 + 180) % 180; if (!cand.some(x => Math.abs(x - d) < 1e-4 || Math.abs(Math.abs(x - d) - 180) < 1e-4)) cand.push(d); });
    }));
    const axes = cand.filter(d => same(p => refP(p, d))).sort((a, b) => a - b);
    let k = 1; for (let q = 36; q >= 2; q--) if (same(p => rotP(p, 360 / q))) { k = q; break; }
    const n = def.regular ? (it.s === 'comp' ? it.p[0] : it.p) : ({ square: 4, tri: 3, hex: 6 })[it.s];
    const sh = { pieces, segs, axes, L: axes.length, k, T: k > 1 ? 360 / k : null, n, I: n ? 180 * (n - 2) / n : null,
      R: Math.max(...pieces.flat().map(p => Math.hypot(...p))), name: typeof def.name === 'function' ? def.name(it.p) : def.name };
    return (cache[key] = sh);
  }

  // ---- grading: the first wrong part names the error ----
  const isPoly = it => ['square', 'tri', 'hex', 'reg'].includes(it.s);
  function linesErr(it, m) {
    const sh = shapeOf(it), L = sh.L;
    if (m === L) return null;
    if ((it.s === 'rect' && m === 4) || (it.s === 'pgram' && m === 2)) return 'diag';
    if (L === 0 && m > 0) return 'blade';
    if (L % 2 === 0 && L > 2 && m === L / 2) return 'half';
    if (L > 0 && m === 2 * L) return 'double';
    if (m === 0) return 'lines0';
    return 'lines';
  }
  // t: degrees or 'none' (None, ?, 0 and 360 all mean no turn short of a full one)
  function turnErr(it, t) {
    const sh = shapeOf(it), T = sh.T;
    if (t !== 'none' && (Math.abs(t) < 1e-9 || Math.abs(t - 360) < 1e-9)) t = 'none';
    if (T == null) return t === 'none' ? null : 'turnless';
    if (t === 'none') return 'noturn';
    if (Math.abs(t - T) < 1e-9) return null;
    if (Math.abs(t - T / 2) < 1e-9) return 'div';
    if (t > 0 && t < 360 && Math.abs(t / T - Math.round(t / T)) < 1e-9) return 'notmin';   // a hexagon's 120° works too
    if (isPoly(it) && Math.abs(t - sh.I) < 1e-9) return 'interior';
    if (isPoly(it) && t === sh.n) return 'sides';
    return 'turn';
  }
  function sidesErr(it, m) {
    if (m === it.p) return null;
    if (Math.abs(m - 180 / it.T) < 1e-9) return 'b-half';
    return 'back';
  }

  // the sentence about the picked answer
  function say(it, e) {
    const sh = shapeOf(it), L = sh.L, T = sh.T, k = sh.k, v = e.v;
    const t = v === 'none' ? v : fmt(v);
    switch (e.type) {
      case 'diag': return 'A diagonal isn’t a line of symmetry: folded on it, the corners don’t meet.';
      case 'blade': return `Flipped over, ${/^(blades|comp)$/.test(it.s) ? 'the blades point the other way' : 'it doesn’t match itself'}: no lines of symmetry.`;
      case 'half': return `Lines through opposite corners and through the middles of opposite sides both count: ${lines(L)}.`;
      case 'double': return `Each line goes all the way across; counted once, there are ${L}.`;
      case 'lines0': return `It does fold onto itself: ${lines(L)} of symmetry.`;
      case 'lines': return v < L ? `There are more than ${v}: ${lines(L)} fold it onto itself.` : `Only ${lines(L)} fold${L === 1 ? 's' : ''} it onto itself, not ${v}.`;
      case 'noturn': return `A turn of ${fmt(T)}° already lands it on itself.`;
      case 'turnless': return `Turned ${t}°, it doesn’t land on itself; only a full turn does.`;
      case 'interior': return `${t}° is the angle at a corner; the turn is at the center: 360° ÷ ${sh.n} = ${fmt(T)}°.`;
      case 'div': return `It lands on itself ${k} times in a full turn, not ${2 * k}: 360° ÷ ${k} = ${fmt(T)}°.`;
      case 'notmin': return `${t}° works, but a smaller turn does too: ${fmt(T)}°.`;
      case 'sides': return `${t} is the number of sides; the turn is 360° ÷ ${sh.n} = ${fmt(T)}°.`;
      case 'turn': return `Turned ${t}°, it doesn’t land on itself; ${fmt(T)}° does.`;
      case 'b-half': return `A full turn is 360°, not 180°: 360° ÷ ${it.T} = ${it.p} sides.`;
      case 'back': return v > 0 ? `A regular polygon with ${v} sides turns ${fmt(360 / v)}°, not ${it.T}°.` : `360° ÷ ${it.T} = ${it.p} sides.`;
    }
    return '';
  }

  // ---- the picture: a plain drawing on its own; ghost copies fold and turn on it ----
  const S = 100, reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const xy = p => `${(p[0] * S).toFixed(1)} ${(-p[1] * S).toFixed(1)}`;
  const pathOf = pc => `M${pc.map(xy).join('L')}Z`;
  const NS = 'http://www.w3.org/2000/svg';
  function figure(host, it) {
    const sh = shapeOf(it), V = Math.ceil(sh.R * S * 1.32), body = sh.pieces.map(pc => `<path d="${pathOf(pc)}"/>`).join('');
    host.innerHTML = `<svg class="sy" viewBox="${-V} ${-V} ${2 * V} ${2 * V}" role="img" aria-label="${sh.name}"><g class="sy-l"></g><g class="sy-f">${body}</g><g class="sy-m"></g></svg>`;
    const svg = host.firstChild, gl = svg.querySelector('.sy-l'), gm = svg.querySelector('.sy-m'), made = [];
    const el = (tag, at, parent = gm) => { const n = document.createElementNS(NS, tag); Object.entries(at).forEach(([k, v]) => n.setAttribute(k, v)); parent.appendChild(n); made.push(n); return n; };
    const ext = sh.R * S * 1.22;
    const line = (d, cls) => { const c = Math.cos(rad(d)) * ext, s = -Math.sin(rad(d)) * ext; return el('line', { x1: -c, y1: -s, x2: c, y2: s, class: cls }, gl); };
    const wait = ms => new Promise(res => setTimeout(res, ms));
    // a ghost copy that moves from `from` to `to` (CSS transforms about the center, which is the viewBox origin)
    async function ghost(from, to, ms, ok) {
      const g = el('g', { class: 'sy-g' }, svg); g.innerHTML = body;
      g.style.transform = from;
      if (!reduced()) { void g.getBoundingClientRect(); g.style.transition = `transform ${ms}ms ease-in-out`; }
      requestAnimationFrame(() => { g.style.transform = to; });
      await wait(reduced() ? 30 : ms + 60);
      g.classList.add(ok ? 'ok' : 'no');
      return g;
    }
    return {
      sh, svg,
      clear() { made.splice(0).forEach(n => n.remove()); },
      lines(axes, cls = 'sy-ax') { axes.forEach(d => line(d, cls)); },
      // folds on the line at angle d: on screen the line is at −d
      fold(d, ok) { line(d, ok ? 'sy-ax' : 'sy-ax off'); return ghost(`rotate(${-d}deg) scaleY(1) rotate(${d}deg)`, `rotate(${-d}deg) scaleY(-1) rotate(${d}deg)`, 900, ok); },
      // turns counterclockwise by d (negative on screen)
      turn(d, ok) { el('circle', { cx: 0, cy: 0, r: 4, class: 'sy-c' }); return ghost('rotate(0deg)', `rotate(${-d}deg)`, Math.round(700 + d * 2.2), ok); },
      // the angle at the center between a corner and where it lands; spokes to every match when all is set
      wedge(T, all) {
        const v = sh.pieces[0].reduce((a, p) => Math.hypot(...p) > Math.hypot(...a) + 1e-9 ? p : a), a0 = Math.atan2(v[1], v[0]) * 180 / Math.PI, Rv = Math.hypot(...v) * S;
        const spoke = (d, cls) => el('line', { x1: 0, y1: 0, x2: Math.cos(rad(d)) * Rv, y2: -Math.sin(rad(d)) * Rv, class: cls });
        if (all) for (let q = 2; q < 360 / T; q++) spoke(a0 + q * T, 'sy-sp faint');
        spoke(a0, 'sy-sp'); spoke(a0 + T, 'sy-sp');
        const r0 = Math.min(Rv * 0.36, 40), p1 = [Math.cos(rad(a0)) * r0, -Math.sin(rad(a0)) * r0], p2 = [Math.cos(rad(a0 + T)) * r0, -Math.sin(rad(a0 + T)) * r0];
        el('path', { d: `M${p1[0]} ${p1[1]}A${r0} ${r0} 0 ${T > 180 ? 1 : 0} 0 ${p2[0]} ${p2[1]}`, class: 'sy-arc' });
        const lr = T < 45 ? Rv * 0.62 : r0 + 22, mid = a0 + T / 2;
        el('text', { x: Math.cos(rad(mid)) * lr, y: -Math.sin(rad(mid)) * lr + 6, class: 'sy-t' }).textContent = `${fmt(T)}°`;
        el('circle', { cx: 0, cy: 0, r: 4, class: 'sy-c' });
      },
      // the angle at a corner of a regular polygon (the trap), in red
      corner() {
        const P = sh.pieces[0], n = P.length, j = Math.floor(n / 2), v = P[j], a = P[j - 1], b = P[(j + 1) % n];   // a corner away from the wedge
        const da = Math.atan2(a[1] - v[1], a[0] - v[0]), db = Math.atan2(b[1] - v[1], b[0] - v[0]), r0 = 26;
        const q = d => [v[0] * S + Math.cos(d) * r0, -(v[1] * S + Math.sin(d) * r0)];
        const p1 = q(db), p2 = q(da), m = (db + da) / 2 + (Math.abs(da - db) > Math.PI ? Math.PI : 0);
        el('path', { d: `M${p1[0]} ${p1[1]}A${r0} ${r0} 0 0 0 ${p2[0]} ${p2[1]}`, class: 'sy-arc no' });
        el('text', { x: v[0] * S + Math.cos(m) * (r0 + 22), y: -(v[1] * S + Math.sin(m) * (r0 + 22)) + 6, class: 'sy-t no' }).textContent = `${fmt(sh.I)}°`;
      }
    };
  }

  // after a miss: one idea per tap of ›, each step clearing the last (the student sets the pace)
  function story(it, errs) {
    const sh = shapeOf(it), steps = [];
    errs.forEach(e => {
      if (e.part === 'lines') {
        const off = sh.pieces[0][0], dOff = (Math.atan2(off[1], off[0]) * 180 / Math.PI + 180) % 180;
        if (e.type === 'diag') steps.push([f => f.fold(dOff, false), 'Folded on a diagonal, the corners miss.']);
        else if (sh.L === 0) steps.push([f => f.fold(dOff, false), 'Folded on this line, the halves don’t match.']);
        else {
          // counted only one kind of line: fold on the other kind (through a corner, the one most often missed)
          const vAng = sh.pieces[0].map(p => (Math.atan2(p[1], p[0]) * 180 / Math.PI + 360) % 180);
          const ax = e.type === 'half' ? sh.axes.find(d => vAng.some(a => Math.abs(a - d) < 1e-4)) ?? sh.axes[0] : sh.axes[0];
          steps.push([f => f.fold(ax, true), 'Folded on this line, the two halves match.']);
        }
        if (sh.L) steps.push([f => f.lines(sh.axes), `${lines(sh.L)} of symmetry.`]);
        else steps.push([() => {}, 'No line of symmetry.']);
      }
      if (e.part === 'turn') {
        if (sh.T == null) {
          const t = e.v === 'none' ? 180 : e.v % 360 || 180;
          steps.push([f => f.turn(t, false), `Turned ${fmt(t)}°, it doesn’t match.`]);
          steps.push([f => f.turn(360, true), 'Only a full turn brings it back.']);
        } else {
          steps.push([f => f.turn(sh.T, true), `A turn of ${fmt(sh.T)}° lands it on itself.`]);
          if (e.type === 'interior') steps.push([f => { f.wedge(sh.T); f.corner(); }, 'The turn is the angle at the center, not at a corner.']);
          else steps.push([f => f.wedge(sh.T, true), `${sh.k} turns of ${fmt(sh.T)}° make a full turn: 360° ÷ ${sh.k} = ${fmt(sh.T)}°.`]);
        }
      }
      if (e.part === 'sides') steps.push([f => f.wedge(it.T, true), `${it.p} turns of ${it.T}° make a full turn: 360° ÷ ${it.T} = ${it.p}.`]);
    });
    return steps;
  }
  function explain(el, it, errs) {
    const host = el.querySelector('.gq.sy'); if (!host || el.querySelector('.sy-why')) return;
    host.classList.add('shown');   // only the picked and the right choice stay, so the picture and OK fit on a phone
    let fig = el._fig;
    if (!fig) { const b = document.createElement('div'); b.className = 'sy-fig'; host.prepend(b); fig = el._fig = figure(b, it); }
    host.insertAdjacentHTML('beforeend', '<div class="sy-why"><p class="q small sy-cap" aria-live="polite"></p><button type="button" class="tb sy-next" aria-label="Next">›</button></div>');
    const cap = el.querySelector('.sy-cap'), btn = el.querySelector('.sy-next'), steps = story(it, errs);
    let i = 0;
    const go = async () => {
      if (!el.isConnected) return;
      btn.disabled = true; fig.clear();
      const [draw, text] = steps[i++];
      cap.textContent = text;
      await draw(fig);
      btn.disabled = false;
      if (i === steps.length) btn.remove();
    };
    btn.addEventListener('click', go);
    go();
  }

  // ---- the answer area ----
  const Q = { lines: 'How many lines of symmetry?', turn: 'Smallest turn that maps it onto itself?', angle: 'Angle of rotational symmetry?', sides: 'How many sides?' };
  // one part: the question, a box (° for a turn, with None), Check
  function part(host, p, words, done) {
    const row = document.createElement('div'); row.className = 'sy-part';
    const turn = p === 'turn';
    row.innerHTML = `<div class="q small">${turn && words ? Q.angle : Q[p]}</div><div class="q step">${F.box('v')}${turn ? '<span class="sy-deg">°</span>' : ''}<button type="button" class="go">Check</button>${turn ? '<button type="button" class="sy-none">None</button>' : ''}</div>`;
    host.appendChild(row);
    const step = row.querySelector('.q.step'), none = row.querySelector('.sy-none');
    let sent = false;
    const send = v => { if (sent) return; sent = true; step.querySelectorAll('input, button').forEach(b => { b.disabled = true; }); done(v, row); };
    const f = F.wire(step, { onSubmit: vals => { const r = vals.v; send(r.v.undef ? (turn ? 'none' : NaN) : F.num(r.v)); } });
    if (none) none.addEventListener('click', () => send('none'));
    row._mark = ok => { if (none && sent) none.classList.toggle('picked', true); f.mark('v', ok); };
    return row;
  }
  const GRADE = { lines: linesErr, turn: turnErr, sides: sidesErr };
  function askParts(el, it, submit) {
    const out = { errs: [], vals: {} }, host = el.querySelector('.sy-parts');
    let i = 0;
    const next = () => {
      if (i === it.ask.length) return submit(out);
      const p = it.ask[i++];
      part(host, p, it.how === 'words', (v, row) => {
        const type = GRADE[p](it, v);
        out.vals[p] = v;
        if (v === 'none') row.querySelector('.sy-none').classList.add(type ? 'no' : 'ok');
        else row._mark(!type);
        if (type) { out.errs.push({ part: p, type, v }); return submit(out); }
        next();
      });
    };
    next();
  }
  // the test's choices: [id, label, { lines, turn }]
  function choicesOf(it) {
    const sh = shapeOf(it);
    if (it.ask[0] === 'pick-angle') {
      const n = sh.n, ds = [360 / n, 180 / n, n, sh.I].sort((a, b) => b - a);
      return ds.map(d => [String(d), `${fmt(d)}°`, { turn: d }]);
    }
    const L = sh.L, T = sh.T, Ls = L % 2 ? [L, 2 * L] : [L / 2, L];
    return Ls.flatMap(l => [T / 2, T].map(t => [`${l}-${t}`, `${lines(l)}, ${fmt(t)}°`, { lines: l, turn: t }]));
  }
  function askPick(el, it, submit) {
    const ch = choicesOf(it);
    el.querySelector('.sy-parts').insertAdjacentHTML('beforeend', `<div class="q small">${it.ask[0] === 'pick-angle' ? Q.angle : 'It has…'}</div><div class="sy-ch"></div>`);
    Pick.ask(el.querySelector('.sy-ch'), ch.map(([id, h]) => [id, h]), id => {
      const c = ch.find(x => x[0] === id)[2], errs = [];
      if (c.lines != null) { const t = linesErr(it, c.lines); if (t) errs.push({ part: 'lines', type: t, v: c.lines }); }
      const t = turnErr(it, c.turn); if (t) errs.push({ part: 'turn', type: t, v: c.turn });
      submit({ errs, id, vals: c });
    }, { cols: 2 });
  }
  const wantId = it => it.ask[0] === 'pick-angle' ? String(shapeOf(it).T) : `${shapeOf(it).L}-${shapeOf(it).T}`;

  function words(it) {
    if (it.how === 'back') return `A regular polygon’s angle of rotational symmetry is ${it.T}°.`;
    return `A regular polygon has ${it.p} sides.`;
  }

  // ---- the items ----
  const tilt = () => any([1, -1]) * U.r(12, 30);
  const item = (s, p, ask, how = 'pic', o = {}) => Object.assign({ s, p: p ?? null, ask, how }, o);
  const BOTH = ['lines', 'turn'];
  const make = {
    eye: () => item(any(['square', 'tri', 'hex', 'iso', 'rhombus', 'star']), null, BOTH, 'eye'),
    'eye-rect': () => item('rect', null, BOTH, 'eye', any([{}, { tilt: tilt() }])),
    'ngon-pic': () => item('reg', any([5, 6, 8, 9, 10]), BOTH),
    ngon: () => item('reg', any([9, 10, 12, 15, 18, 20, 24, 30]), BOTH, 'words'),
    'ngon-pick': () => item('reg', any([9, 10, 12, 15, 18, 20]), ['pick-angle'], 'words'),
    'comp-pic': () => item('comp', any([[3, 'sq'], [6, 'tri'], [4, 'sq']]), BOTH),
    'comp-pick': () => item('comp', any([[4, 'tri'], [4, 'tri'], [6, 'tri'], [4, 'sq']]), ['pick']),
    kite: () => item(any(['kite', 'iso', 'arrow', 'trap']), null, BOTH),
    pinwheel: () => { const [s, p] = any([['blades', 3], ['blades', 4], ['comp', [4, 'right']], ['comp', [3, 'right']]]); return item(s, p, BOTH); },
    pgram: () => item(any(['pgram', 'zed']), null, BOTH),
    'back-easy': () => { const [T, n] = any([[90, 4], [120, 3], [60, 6], [72, 5]]); return item('reg', n, ['sides'], 'back', { T }); },
    back: () => { const [T, n] = any([[24, 15], [20, 18], [30, 12], [36, 10], [40, 9], [45, 8], [18, 20]]); return item('reg', n, ['sides'], 'back', { T }); }
  };
  const mk = (idea, f) => ({ idea, make: make[f] });

  const ERR = {
    diag: 'took a diagonal for a line of symmetry', blade: 'saw lines on a figure that only turns', half: 'counted only one kind of line',
    double: 'counted each line twice', lines0: 'saw no lines of symmetry', lines: 'miscounted the lines of symmetry',
    interior: 'gave the corner angle', div: '360 ÷ twice the turns (45° for 4 lines)', notmin: 'a turn that works, not the smallest',
    noturn: 'missed the turn (said none)', turnless: 'gave a turn to a figure with none', sides: 'gave the number of sides as the angle',
    turn: 'a turn that doesn’t land it on itself', 'b-half': 'sides from 180° instead of 360°', back: 'wrong number of sides from the angle'
  };
  const TIPS = {
    diag: ['Takes a rectangle’s (or parallelogram’s) diagonal for a line of symmetry.', 'Fold a paper rectangle on its diagonal: the corners don’t meet. Only the two lines through the middles of opposite sides work.'],
    blade: ['Thinks a figure that turns onto itself must also fold onto itself (a pinwheel, a parallelogram).', 'Turning and folding are separate checks: flipped over, a pinwheel points the other way.'],
    half: ['Counts only one kind of line (corner to corner, or side middle to side middle).', 'On a regular polygon with an even number of sides both kinds count: n lines in all (a square has 4).'],
    double: ['Counts each line of symmetry twice (once at each end).', 'Each line goes all the way across: count lines, not ends.'],
    lines0: ['Doesn’t see any line of symmetry.', 'Try folding on a line through the center: if the halves match, it’s a line of symmetry.'],
    lines: ['Miscounts the lines of symmetry.', 'Draw each fold line through the center and check that the halves match.'],
    interior: ['Gives the angle at a corner (the interior angle) as the angle of rotational symmetry.', 'The turn is measured at the center: 360° ÷ the number of sides (15 sides: 24°, not 156°).'],
    div: ['Divides 360° by twice the number of turns (45° for a figure with 4 lines).', 'Count the positions where it lands on itself in a full turn (4 for a square), then 360° ÷ that: 90°.'],
    notmin: ['Gives a turn that works but isn’t the smallest (180° for a square).', 'The angle of rotational symmetry is the smallest turn; try smaller turns that still land it on itself.'],
    noturn: ['Misses rotational symmetry (says “none”).', 'Trace it and turn the tracing: if it lands on itself before a full turn, that turn is the angle.'],
    turnless: ['Gives a turn to a figure with no rotational symmetry (a kite, an isosceles triangle).', 'A line of symmetry doesn’t make a turn work: only a full turn lands a kite on itself.'],
    sides: ['Gives the number of sides as the angle.', 'The angle is 360° ÷ the number of sides.'],
    turn: ['Gives a turn that doesn’t land the figure on itself.', 'Count how many positions match in a full turn, then 360° ÷ that number.'],
    'b-half': ['Uses 180° instead of 360° to find the number of sides.', 'The turns fill a full circle: 360° ÷ 24° = 15 sides.'],
    back: ['Can’t work backwards from the angle to the number of sides.', 'The turns fill a full circle: sides = 360° ÷ the angle.']
  };

  Apparatus.define({
    id: 'geo-symmetry',
    title: 'Symmetry',
    ideas: {
      eye:   { name: 'By eye (a rectangle’s diagonal isn’t a line)', easy: ['eye'], hard: ['eye-rect'], check: 'eye-rect' },
      ngon:  { name: 'Regular polygons: n lines, 360° ÷ n', easy: ['ngon-pic'], hard: ['ngon', 'ngon-pick'], check: 'ngon' },
      comp:  { name: 'Composite figures (tiles around a square)', easy: ['comp-pic'], hard: ['comp-pick'], check: 'comp-pick' },
      split: { name: 'Turns without folds, folds without turns', easy: ['kite'], hard: ['pinwheel', 'pgram'], check: 'pinwheel' },
      back:  { name: 'Backwards: sides from the angle', easy: ['back-easy'], hard: ['back'], late: true, check: 'back' }
    },
    kinds: {
      eye: mk('eye', 'eye'), 'eye-rect': mk('eye', 'eye-rect'),
      'ngon-pic': mk('ngon', 'ngon-pic'), ngon: mk('ngon', 'ngon'), 'ngon-pick': mk('ngon', 'ngon-pick'),
      'comp-pic': mk('comp', 'comp-pic'), 'comp-pick': mk('comp', 'comp-pick'),
      kite: mk('split', 'kite'), pinwheel: mk('split', 'pinwheel'), pgram: mk('split', 'pgram'),
      'back-easy': mk('back', 'back-easy'), back: mk('back', 'back')
    },
    // by eye: a square (folds 4 ways, turns 90°), a rectangle (its diagonals don't fold), a kite (folds, never turns)
    opening: [
      { kind: 'eye', item: item('square', null, BOTH, 'eye') },
      { kind: 'eye-rect', item: item('rect', null, BOTH, 'eye') },
      { kind: 'kite', item: item('kite', null, BOTH) }
    ],
    defaults: { fix: 1 },
    revealMs: 900,
    text(it) {
      const sh = shapeOf(it);
      if (it.how === 'back') return `${it.T}° → sides`;
      if (it.how === 'words') return `regular ${it.p}-gon (words)${it.ask[0] === 'pick-angle' ? ': choices' : ''}`;
      return `${sh.name}${it.tilt ? ' (tilted)' : ''}${it.ask[0] === 'pick' ? ': choices' : ''}`;
    },
    speak: it => it.how === 'back' || it.how === 'words' ? words(it) : `A drawing of ${shapeOf(it).name}. ${it.ask[0] === 'pick' ? 'How many lines of symmetry, and what angle of rotational symmetry?' : Q.lines}`,
    ask(el, it, submit) {
      el._fig = null;
      const drawn = it.how !== 'words' && it.how !== 'back';
      el.innerHTML = `<div class="gq sy">${drawn ? '<div class="sy-fig"></div>' : `<div class="q sy-w">${words(it)}</div>`}<div class="sy-parts"></div></div>`;
      if (drawn) el._fig = figure(el.querySelector('.sy-fig'), it);
      (/^pick/.test(it.ask[0]) ? askPick : askParts)(el, it, submit);
    },
    correct(it) {
      if (it.how === 'back') return `${it.p} sides`;
      const sh = shapeOf(it);
      return `${lines(sh.L)}, ${sh.T ? fmt(sh.T) + '°' : 'no turn'}`;
    },
    isRight: (it, a) => a.errs.length === 0,
    classify: (it, a) => a.errs[0].type,
    feedback: (it, w, a) => ['', say(it, a.errs[0])],
    reveal(el, it, a, o) {
      if (a.id != null) Pick.mark(el, wantId(it), a.id, o.right);
      if (!o.right) explain(el, it, a.errs);
    },
    errors: ERR,
    diagnose: err => TIPS[err] || ['', ''],
    get keyHTML() {
      // two small squares: its 4 lines dashed; the 90° turn at the center
      const a = document.createElement('div'), b = document.createElement('div'), sq = item('square', null, BOTH);
      const f = figure(a, sq); f.lines(f.sh.axes); figure(b, sq).wedge(90);
      return `<div class="gk sy-k"><div class="sy-fig">${a.innerHTML}${b.innerHTML}</div>
        <div><b>Line of symmetry:</b> fold on it and the halves match.</div>
        <div><b>Angle of rotational symmetry:</b> the smallest turn that lands it on itself.</div>
        <div>A regular polygon with <b>n</b> sides: <b>n</b> lines, <b>360° ÷ n</b>.</div>
        <div>No turn short of a full turn: <b>None</b>.</div></div>`;
    }
  });

  // for tests: every shape's computed symmetry
  Apparatus.defs['geo-symmetry']._shapeOf = shapeOf;
  Apparatus.defs['geo-symmetry']._make = make;
})();
