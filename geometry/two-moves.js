// Two in a Row (T6) — two transformations, one after the other: the image of the first is the preimage of the second.
// Plot each image by tapping (lib/plot.js). The ideas: reflect across x = a (or y = b), then an axis (the test's Q9);
// two parallel mirrors (one move does both: a translation, twice the gap); both axes (one move: a half turn about the
// origin); translate then rotate about the origin (Q12-style: one point).
// Scaffolding fades with the item's lvl: 2 = plot the first image (it stays drawn faint), then the second;
// 1 = plot only the final image; 0 = type the final coordinates of one point (no grid). The next-session check is lvl 0.
// First tries are graded; a wrong plot shows one sentence, then the step rebuilds and is fixed in place (Steps); from the
// third try the right spots show as faint rings. After a figure, "what one move does both?" is told one idea per ›
// (tutor rule). Traps caught: the order swapped; the second move applied to the preimage; only one move; the axis for
// x = a; the gap once (not twice); a turn the wrong way or (y, x); a slide the wrong way.
// Spec: specs/geometry-transformations.md (T6). Uses lib/grid.js (+ grid-extra.css), lib/plot.js, lib/steps.js,
// lib/frac.js; styles lib/two-moves.css.
(function () {
  const G = Grid, s = G.sgn, F = Frac, { r, any } = Apparatus.util;
  const pt = p => `(${s(p[0])}, ${s(p[1])})`;
  const same = (p, q) => !!p && !!q && p[0] === q[0] && p[1] === q[1];
  const inG = (p, n = 6) => Math.abs(p[0]) <= n && Math.abs(p[1]) <= n;
  const z = n => n || 0;                                          // no −0
  const cap = t => t[0].toUpperCase() + t.slice(1);
  const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- moves: { t: 'ref', x: a } | { t: 'ref', y: b } | { t: 'slide', v: [a, b] } | { t: 'rot', d: 90 | -90 | 180 }
  //      (90 = counterclockwise, −90 = clockwise, about the origin); 'swap' (x, y) → (y, x) is only a wrong move ----
  function apply(m, p) {
    const [x, y] = p;
    if (m.t === 'ref') return m.x != null ? [z(2 * m.x - x), y] : [x, z(2 * m.y - y)];
    if (m.t === 'slide') return [x + m.v[0], y + m.v[1]];
    if (m.t === 'rot') return m.d === 90 ? [z(-y), x] : m.d === -90 ? [y, z(-x)] : [z(-x), z(-y)];
    return [y, x];
  }
  const both = (it, p) => apply(it.ms[1], apply(it.ms[0], p));
  const lineName = m => m.x != null ? (m.x === 0 ? 'the y-axis' : `x = ${s(m.x)}`) : (m.y === 0 ? 'the x-axis' : `y = ${s(m.y)}`);
  const ROT = { 90: '90° counterclockwise', '-90': '90° clockwise', 180: '180°' };
  const RULE = { 90: '(x, y) → (−y, x)', '-90': '(x, y) → (y, −x)', 180: '(x, y) → (−x, −y)' };
  // the header: what each move is, in the test's words
  const moveHTML = m => m.t === 'ref' ? (isAxis(m) ? `reflect across ${lineName(m)}` : `reflect across <b>${lineName(m)}</b>`)
    : m.t === 'slide' ? `translate <b>⟨${s(m.v[0])}, ${s(m.v[1])}⟩</b>` : `rotate <b>${ROT[m.d]}</b> about the origin`;
  const moveTxt = m => moveHTML(m).replace(/<\/?b>/g, '');
  // the move inside a sentence
  const short = m => m.t === 'ref' ? `the reflection across ${lineName(m)}` : m.t === 'slide' ? 'the translation' : 'the rotation';
  const isAxis = m => m.t === 'ref' && (m.x === 0 || m.y === 0);
  const axisOf = m => m.x != null ? { t: 'ref', x: 0 } : { t: 'ref', y: 0 };

  // ---- items ----
  // { idea, lvl, pre: [[x, y]…], ms: [m1, m2] }: three points (a triangle ABC) or one (A, or P for translate-then-rotate)
  const namesOf = (it, mark = '') => (it.pre.length === 1 ? [it.idea === 'tr' ? 'P' : 'A'] : ['A', 'B', 'C']).map(n => n + mark);
  const first = it => it.pre.map(p => apply(it.ms[0], p));
  const final = it => it.pre.map(p => both(it, p));
  const onMirror = (ms, p) => ms.some(m => m.t === 'ref' && (m.x != null ? p[0] === m.x : p[1] === m.y));
  const distinct = pts => new Set(pts.map(p => p + '')).size === pts.length;
  // a figure is fair when everything fits, nothing sits on a mirror, and no two of its 9 points coincide
  const fits = (pre, ms) => {
    const a = pre.map(p => apply(ms[0], p)), b = a.map(p => apply(ms[1], p)), all = pre.concat(a, b);
    return all.every(p => inG(p)) && !pre.concat(a).some(p => onMirror(ms, p)) && distinct(all);
  };
  function triangle(ms) {
    for (let k = 0; k < 3000; k++) {
      const c = [r(-4, 4), r(-4, 4)], pre = [0, 1, 2].map(() => [c[0] + r(-2, 2), c[1] + r(-3, 3)]);
      const a2 = Math.abs((pre[1][0] - pre[0][0]) * (pre[2][1] - pre[0][1]) - (pre[2][0] - pre[0][0]) * (pre[1][1] - pre[0][1]));
      if (a2 >= 5 && fits(pre, ms)) return pre;
    }
    return null;
  }
  // one point: the wrong answers worth telling apart (see candidates) must all land somewhere else
  function point(it, extra) {
    for (let k = 0; k < 3000; k++) {
      const p = [r(-5, 5), r(-5, 5)], t = Object.assign({}, it, { pre: [p] });
      if (!p[0] || !p[1] || !fits([p], it.ms)) continue;              // off the axes, so its path shows
      const w = both(t, p), cs = candidates(t, 'both').map(c => c.img[0]);
      if (cs.every(q => !same(q, w)) && distinct(cs.concat([w])) && (!extra || extra(p))) return p;
    }
    return null;
  }
  const MIRA = [-3, -2, -1, 1, 2, 3];
  const rrMoves = () => r(0, 1) ? [{ t: 'ref', x: any(MIRA) }, { t: 'ref', y: 0 }] : [{ t: 'ref', y: any(MIRA) }, { t: 'ref', x: 0 }];
  function parMoves() {
    const a = r(-3, 3), gap = any([1, 2, -1, -2]), k = r(0, 1) ? 'x' : 'y';
    return [{ t: 'ref', [k]: a }, { t: 'ref', [k]: a + gap }];
  }
  const axesMoves = () => r(0, 1) ? [{ t: 'ref', y: 0 }, { t: 'ref', x: 0 }] : [{ t: 'ref', x: 0 }, { t: 'ref', y: 0 }];
  function trMoves(order) {
    let v; do { v = [r(-4, 4), r(-4, 4)]; } while (!v[0] || !v[1] || Math.abs(v[0]) === Math.abs(v[1]));
    const m = [{ t: 'slide', v }, { t: 'rot', d: any([90, 90, -90, 180]) }];
    return order === 'rt' ? m.reverse() : m;
  }
  function figure(idea, moves, lvl) {
    for (let k = 0; k < 50; k++) {
      const ms = moves(), it = { idea, lvl, ms };
      it.pre = lvl === 0 ? [point(it)] : triangle(ms);
      if (it.pre && it.pre[0]) return it;
    }
    return OPEN[0];
  }
  function trItem(lvl, order) {
    for (let k = 0; k < 50; k++) {
      const it = { idea: 'tr', lvl, ms: trMoves(order) }, p = point(it);
      if (p) return Object.assign(it, { pre: [p] });
    }
    return { idea: 'tr', lvl, ms: [{ t: 'slide', v: [3, -1] }, { t: 'rot', d: 90 }], pre: [[1, 2]] };
  }
  // the opening contrast set: the test's Q9 (small numbers: crossing mirrors), then two parallel mirrors (the figure,
  // its first image and the final one side by side, so the slide reads at a glance)
  const OPEN = [
    { idea: 'rr', lvl: 2, ms: [{ t: 'ref', x: -2 }, { t: 'ref', y: 0 }], pre: [[0, 1], [2, 4], [1, -2]] },
    { idea: 'par', lvl: 2, ms: [{ t: 'ref', x: -3 }, { t: 'ref', x: 0 }], pre: [[-5, 1], [-4, 4], [-4, -2]] }
  ];

  // ---- what a wrong plot was (the student's points against the images of the likely mistakes) ----
  // k: 0 = the first move (from the preimage), 1 = the second (from the first image), 'both' = straight to the final image
  function candidates(it, k) {
    const [m1, m2] = it.ms, pre = it.pre, A = first(it), out = [];
    const add = (type, f, from, text) => out.push({ type, img: from.map(f), text });
    const variants = (m, from, k2) => {                          // the usual slips inside one move
      if (m.t === 'ref' && !isAxis(m)) add('axis', p => k2(apply(axisOf(m), p)), from, `That’s across ${lineName(axisOf(m))}; the mirror is ${lineName(m)}.`);
      if (m.t === 'rot' && m.d !== 180) {
        add('dir', p => k2(apply({ t: 'rot', d: -m.d }, p)), from, `That turns ${m.d === 90 ? 'clockwise' : 'counterclockwise'}. ${cap(ROT[m.d])} is ${RULE[m.d]}.`);
        add('swap', p => k2(apply({ t: 'swap' }, p)), from, `That’s a flip across y = x. A turn also changes a sign: ${RULE[m.d]}.`);
      }
      if (m.t === 'slide') add('vec', p => k2([p[0] - m.v[0], p[1] - m.v[1]]), from, `That goes the wrong way: ⟨${s(m.v[0])}, ${s(m.v[1])}⟩ is ${dirWords(m.v)}.`);
    };
    const id = p => p;
    if (k === 0) {
      add('order', p => apply(m2, p), pre, 'That’s move 2. Move 1 comes first.');
      variants(m1, pre, id);
    } else if (k === 1) {
      add('pre', p => apply(m2, p), pre, `That moves ${namesOf(it).join('')}. Move 2 starts from ${namesOf(it, '′').join('')}.`);
      add('back', p => apply(m1, p), A, `That’s back where it started. Move 2 is ${short(m2)}.`);
      variants(m2, A, id);
    } else {
      add('order', p => apply(m1, apply(m2, p)), pre, 'That’s move 2, then move 1: the other way round.');
      add('pre', p => apply(m2, p), pre, 'That’s only move 2. Move 1 comes first.');
      add('first', p => apply(m1, p), pre, 'That’s only move 1. Then move 2.');
      variants(m1, pre, p => apply(m2, p));
      variants(m2, pre.map(p => apply(m1, p)), id);
      if (it.idea === 'par') {
        const k2 = m1.x != null ? 0 : 1, gap = (m2.x ?? m2.y) - (m1.x ?? m1.y);
        add('once', p => k2 ? [p[0], p[1] + gap] : [p[0] + gap, p[1]], pre, `That moves ${Math.abs(gap)}, the gap. Two mirrors move each point twice the gap: ${2 * Math.abs(gap)}.`);
      }
    }
    // a mistake that lands on the right answer can't be told apart: drop it (and a later one that looks the same)
    const want = k === 0 ? A : final(it), key = c => c.img.join(';');
    return out.filter((c, j) => !c.img.every((q, i) => same(q, want[i])) && out.findIndex(d => key(d) === key(c)) === j);
  }
  const dirWords = v => [v[0] ? `${Math.abs(v[0])} ${v[0] > 0 ? 'right' : 'left'}` : '', v[1] ? `${Math.abs(v[1])} ${v[1] > 0 ? 'up' : 'down'}` : ''].filter(Boolean).join(' and ');
  // one point, one move: why it lands where it does (for a slip on a single point)
  function howOne(m, p, nm, nm2) {
    if (m.t === 'ref') {
      const vert = m.x != null, d = vert ? p[0] - m.x : p[1] - m.y, w = vert ? (d > 0 ? ['right of', 'left of'] : ['left of', 'right of']) : (d > 0 ? ['above', 'below'] : ['below', 'above']);
      return `${nm} is ${Math.abs(d)} ${w[0]} ${lineName(m)}, so ${nm2} is ${Math.abs(d)} ${w[1]} it.`;
    }
    if (m.t === 'slide') return `${nm2} is ${nm} moved ${dirWords(m.v)}.`;
    return `${cap(ROT[m.d])}: ${RULE[m.d]}.`;
  }
  // grade a plot: null when right, else { type, text }
  function plotErr(it, k, pts) {
    const from = k === 1 ? first(it) : it.pre, want = k === 0 ? first(it) : final(it);
    const nmFrom = namesOf(it, k === 1 ? '′' : ''), nmTo = namesOf(it, k === 0 ? '′' : '″');
    const bad = pts.map((p, i) => !same(p, want[i]));
    if (!bad.some(Boolean)) return null;
    // the right spots under the wrong names
    if (pts.length > 1 && pts.every(p => want.some(q => same(p, q)))) {
      const i = bad.indexOf(true);
      return { type: 'names', text: `Right spots, but ${nmTo[i]} goes with ${nmFrom[i]}.`, i };
    }
    const c = candidates(it, k).find(c => c.img.every((q, i) => same(q, pts[i])));
    if (c) return { type: c.type, text: c.text };
    const i = bad.indexOf(true), m = k === 1 ? it.ms[1] : it.ms[0];
    if (k !== 'both') return { type: bad.filter(Boolean).length === 1 ? 'slip' : 'other', text: `${nmTo[i]} is off. ${howOne(m, from[i], nmFrom[i], nmTo[i])}` };
    const mid = namesOf(it, '′')[i];
    return { type: bad.filter(Boolean).length === 1 ? 'slip' : 'other',
      text: `${pts.length > 1 ? nmTo[i] + ' is off. ' : ''}${nmFrom[i]} goes first to ${mid}${pt(apply(it.ms[0], it.pre[i]))}; then ${moveTxt(it.ms[1])}.` };
  }

  // ---- the answer areas ----
  let EXPLAIN = true;                                    // tutor rule: "what one move does both?" after a figure
  const told = new Set();                                // ideas already explained on this visit
  function header(it) { return `<ol class="tm-moves">${it.ms.map((m, i) => `<li data-i="${i}">${moveHTML(m)}</li>`).join('')}</ol>`; }
  function picture(host, it) {
    const g = G.make(host), mir = it.ms.map(m => m.t === 'ref' && window.Plot ? Plot.mirror(g, m, 'ln mirror') : null);   // (analytics draws the key without plot.js)
    if (it.pre.length > 2) g.poly(it.pre, 'pg');
    it.pre.forEach((p, i) => g.dot(p, 'pt', namesOf(it)[i] + pt(p)));
    return { g, mir };
  }
  function faint(g, pts, names) {
    const out = [];
    if (pts.length > 2) out.push(g.poly(pts, 'pg faint'));
    pts.forEach((p, i) => { const d = g.dot(p, 'pt faint', names[i] + pt(p)); if (d._gl) d._gl.t.classList.add('tm-faint'); out.push(d); });
    return out;
  }
  // which move is being done now: its line in the header and its mirror stand out (k null: both)
  function current(el, x, k) {
    el.querySelectorAll('.tm-moves li').forEach((li, i) => li.classList.toggle('cur', i === k));
    x.mir.forEach((n, i) => n && n.classList.toggle('cur', i === k));
  }

  // one tap step: plot an image (k: 0, 1 or 'both'); a miss is fixed in place
  function plotStep(el, x, k) {
    const it = x.it, names = namesOf(it, k === 0 ? '′' : '″'), want = k === 0 ? first(it) : final(it);
    const prompt = el.querySelector('.tm-p');
    let pl = null, hint = [];
    return { tap: (g, row, tries) => new Promise(res => {
      if (pl) { pl.clear(); pl = null; }
      hint.forEach(n => g.remove(n)); hint = [];
      current(el, x, k === 'both' ? null : k);
      prompt.innerHTML = k === 'both' ? `Tap <b>${names.join(', ')}</b>: where both moves end.` : `Tap <b>${names.join(', ')}</b>`;
      // from the third try, faint rings on the right spots
      if (tries >= 2) hint = want.map(p => g.el('circle', { cx: g.X(p[0]), cy: g.Y(p[1]), r: 7, class: 'tm-hint' }));
      row.innerHTML = '<button type="button" class="go" disabled>Check</button>';
      const go = row.querySelector('.go');
      pl = Plot.wire(g, { names, closed: names.length > 2, onChange: () => { go.disabled = !(pl && pl.done()); } });
      go.addEventListener('click', () => {
        if (!pl.done()) return;
        pl.stop(); go.disabled = true;
        const pts = pl.points(), e = plotErr(it, k, pts);
        pl.mark(pts.map((p, i) => same(p, want[i])));
        hint.forEach(n => g.remove(n)); hint = [];
        if (!e) {
          // the first image stays, faint, while the second is plotted
          if (k === 0) {
            pl.clear(); x.faint = faint(g, want, names);
            if (it.ms[0].t === 'slide') it.pre.forEach((p, j) => g.triangle(p, want[j], { labels: false }));   // the slide's run and rise
          }
          else x.plot = pl;
          return res({ ok: true, value: pts });
        }
        if (!x.bad) x.bad = { k, pts };
        res({ ok: false, err: e.type, sentence: e.text });
      });
    }) };
  }
  function askPlot(el, it, lvl, submit) {
    el.innerHTML = `<div class="gq tm">${header(it)}<div class="gridbox"></div><p class="tm-p"></p><div class="tm-steps"></div></div>`;
    const x = el._x = Object.assign(picture(el.querySelector('.gridbox'), it), { it, lvl });
    const steps = lvl === 2 ? [plotStep(el, x, 0), plotStep(el, x, 1)] : [plotStep(el, x, 'both')];
    x.run = Steps.run(el.querySelector('.tm-steps'), steps, { grid: x.g, done: errs => { current(el, x, -1); submit({ lvl, errs }); } });
  }
  // lvl 0: numbers only, one point
  function askNum(el, it, submit) {
    const nm = namesOf(it)[0], p = it.pre[0];
    el.innerHTML = `<div class="gq tm"><div class="q">${nm}${pt(p)}</div>${header(it)}
      <div class="q">${nm}″ = (${F.box('x')},&nbsp;${F.box('y')})</div><p class="say" aria-live="polite"></p>
      <button type="button" class="go">Check</button><div class="tm-cue"></div></div>`;
    const x = el._x = { it, lvl: 0 };
    x.f = F.wire(el, { onSubmit: v => {
      const ok = v.x.v.d === 1 && v.y.v.d === 1 && !v.x.v.undef && !v.y.v.undef;
      const q = ok ? [v.x.v.n, v.y.v.n] : null;
      x.p = q;
      const e = q ? plotErr(it, 'both', [q]) : { type: 'other', text: `${nm}″ is a grid point: two whole numbers.` };
      submit({ lvl: 0, p: q, errs: e ? [Object.assign({ step: 0 }, e)] : [] });
    } });
  }

  // ---- after a figure: what one move does both? one idea per tap of › ----
  function explain(el, x) {
    const it = x.it, g = x.g, host = el.querySelector('.gq.tm');
    if (!host || el.querySelector('.tm-why')) return;
    host.classList.add('tm-x');                          // the final image turns green, out of the legs' way
    el.querySelectorAll('.tm-p, .tm-steps').forEach(n => { n.style.display = 'none'; });   // the plotting is done
    host.insertAdjacentHTML('beforeend', '<div class="tm-why"><p class="tm-cap" aria-live="polite"></p><button type="button" class="tb tm-next" aria-label="Next">›</button></div>');
    const capEl = el.querySelector('.tm-cap'), btn = el.querySelector('.tm-next');
    const [m1, m2] = it.ms, pre = it.pre, fin = final(it), N = namesOf(it), N2 = namesOf(it, '″');
    let shown = [], i = 0;
    const clear = () => { shown.forEach(n => g.remove(n)); shown = []; };
    let steps;
    if (it.idea === 'par') {
      const vert = m1.x != null, gap = vert ? m2.x - m1.x : m2.y - m1.y, v = vert ? [2 * gap, 0] : [0, 2 * gap];
      steps = [
        () => { capEl.textContent = `Every point moves the same way: ${dirWords(v).replace(/^\d+ /, '')}.`; pre.forEach((q, j) => shown.push(g.triangle(q, fin[j], { labels: false }))); },
        () => { capEl.textContent = `The mirrors are ${Math.abs(gap)} apart. Each point moves ${Math.abs(2 * gap)}: twice that.`;
          pre.forEach((q, j) => shown.push(g.triangle(q, fin[j], { labels: false })));
          shown.push(gapMark(g, m1, m2, pre)); },
        () => { capEl.textContent = `One move does both: translate ⟨${s(v[0])}, ${s(v[1])}⟩.`; return ghost(g, pre, shown, { slide: v }); }
      ];
    } else {
      const c = [m1.x ?? m2.x, m1.y ?? m2.y], at = c[0] === 0 && c[1] === 0 ? 'the origin' : pt(c);
      steps = [
        () => { capEl.textContent = `The mirrors cross at ${at}.`; shown.push(g.el('circle', { cx: g.X(c[0]), cy: g.Y(c[1]), r: 9, class: 'tm-ring' })); },
        () => { capEl.textContent = `${N[0]} and ${N2[0]} are the same distance from it, straight through it.`;
          shown.push(g.el('circle', { cx: g.X(c[0]), cy: g.Y(c[1]), r: 9, class: 'tm-ring' }), g.strings(c, pre[0], fin[0], 'ok')); },
        () => { capEl.textContent = `One move does both: a half turn (180°) about ${at}.`; return ghost(g, pre, shown, { turn: c }); }
      ];
    }
    const go = async () => {
      btn.disabled = true; clear();
      await steps[i++]();
      if (!btn.isConnected) return;
      btn.disabled = false;
      if (i === steps.length) btn.remove(); else btn.focus({ preventScroll: true });
    };
    btn.addEventListener('click', go);
    told.add(it.idea);
    go();
  }
  // the gap between two parallel mirrors, drawn as a short bar beside the figure
  function gapMark(g, m1, m2, pre) {
    const vert = m1.x != null, ys = pre.map(p => vert ? p[1] : p[0]);
    const at = Math.max(...ys) + 1 <= 6 ? Math.max(...ys) + 1 : Math.min(...ys) - 1;
    return vert ? g.seg([m1.x, at], [m2.x, at], 'sg tm-gap') : g.seg([at, m1.y], [at, m2.y], 'sg tm-gap');
  }
  // a ghost of the preimage slides or half-turns onto the final image
  function ghost(g, pre, shown, o) {
    return new Promise(res => {
      const grp = g.el('g', { class: 'tm-ghost' }), pg = g.poly(pre, 'pg tm-gh'); grp.appendChild(pg);
      shown.push(pg, grp);
      const U = g.X(1) - g.X(0), t0 = performance.now(), ms = reduced() ? 1 : 1100;
      (function frame(t) {
        if (!grp.isConnected) return res();
        const k = Math.min(1, (t - t0) / ms), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        grp.setAttribute('transform', o.slide ? `translate(${o.slide[0] * U * e} ${-o.slide[1] * U * e})` : `rotate(${-180 * e} ${g.X(o.turn[0])} ${g.Y(o.turn[1])})`);
        if (k < 1) requestAnimationFrame(frame); else res();
      })(t0);
    });
  }

  // lvl 0 miss: the point's two moves on a grid — P, P′ (faint), P″ (green), the typed point red
  function numCue(el, it, typed) {
    const host = el.querySelector('.tm-cue'); if (!host) return;
    host.innerHTML = '<div class="gridbox"></div>';
    const { g } = picture(host.querySelector('.gridbox'), it), nm = namesOf(it)[0], a = first(it)[0], b = final(it)[0];
    g.seg(it.pre[0], a, 'sg tm-path'); g.seg(a, b, 'sg tm-path');
    faint(g, [a], [nm + '′']);
    g.dot(b, 'pt ok', nm + '″' + pt(b));
    if (typed && inG(typed) && !same(typed, b)) g.dot(typed, 'pt no');
  }

  const mk = (idea, make) => ({ idea, make });
  const ERRORS = {
    order: 'did the moves in the wrong order', pre: 'did the second move from the preimage', first: 'stopped after the first move',
    back: 'undid the first move', axis: 'reflected across the axis, not x = a (y = b)', once: 'moved the gap once, not twice',
    dir: 'turned the wrong way', swap: 'swapped x and y without the sign', vec: 'translated the wrong way',
    names: 'right spots, wrong names', slip: 'one point off', other: 'other'
  };
  const TIPS = {
    order: ['Does the two moves in the wrong order.', 'Number the moves 1 and 2 and do 1 first. With a turn and a slide, the order changes the answer.'],
    pre: ['Applies the second move to the original figure instead of the first image.', 'The image of the first move is the preimage of the second: work from the primes (A′), not from A.'],
    first: ['Stops after the first move.', 'Two moves means two images: A → A′ → A″. Write both down.'],
    back: ['Undoes the first move instead of doing the second.', 'Read the second move again: it is a new mirror (or turn), not the first one backwards.'],
    axis: ['Reflects across the axis instead of x = a or y = b.', 'Count from the mirror line, not from the axis: 3 right of x = −2 lands 3 left of x = −2.'],
    once: ['Moves the figure the gap between the mirrors, not twice the gap.', 'Each reflection carries a point past a mirror. Two parallel mirrors make a slide twice their distance apart.'],
    dir: ['Turns clockwise for counterclockwise (or back).', 'Counterclockwise (x, y) → (−y, x); clockwise (x, y) → (y, −x). Check with the point (1, 0).'],
    swap: ['Swaps the coordinates but forgets the sign.', 'A 90° turn swaps x and y AND changes one sign; a plain swap is a reflection across y = x.'],
    vec: ['Translates the wrong way.', '⟨a, b⟩: a right (left if negative), b up (down if negative).'],
    names: ['Plots the right spots but mixes up the names.', 'A′ is the image of A: follow one vertex at a time.'],
    slip: ['One vertex off (a counting slip).', 'Count one point at a time from the mirror (or use the rule), then check each image.'],
    other: ['Lost track of the two moves.', 'Do one move at a time and write each image down: A → A′ → A″. Plot the first image before the second.']
  };

  Apparatus.define({
    id: 'geo-two-moves',
    title: 'Two in a Row',
    ideas: {
      rr:   { name: 'Reflect, then reflect again', easy: ['rr-steps'], hard: ['rr-final', 'rr-num'], check: 'rr-num' },
      par:  { name: 'Two parallel mirrors: a translation', easy: ['par-steps'], hard: ['par-final', 'par-num'], check: 'par-num' },
      axes: { name: 'Both axes: a half turn', easy: ['axes-steps'], hard: ['axes-final', 'axes-num'], check: 'axes-num' },
      tr:   { name: 'Translate, then rotate', easy: ['tr-steps'], hard: ['tr-steps', 'tr-num'], check: 'tr-num' }
    },
    kinds: {
      'rr-steps': mk('rr', () => figure('rr', rrMoves, 2)), 'rr-final': mk('rr', () => figure('rr', rrMoves, 1)), 'rr-num': mk('rr', () => figure('rr', rrMoves, 0)),
      'par-steps': mk('par', () => figure('par', parMoves, 2)), 'par-final': mk('par', () => figure('par', parMoves, 1)), 'par-num': mk('par', () => figure('par', parMoves, 0)),
      'axes-steps': mk('axes', () => figure('axes', axesMoves, 2)), 'axes-final': mk('axes', () => figure('axes', axesMoves, 1)), 'axes-num': mk('axes', () => figure('axes', axesMoves, 0)),
      'tr-steps': mk('tr', () => trItem(2, 'tr')), 'tr-num': mk('tr', () => trItem(0, any(['tr', 'rt'])))
    },
    opening: [{ kind: 'rr-steps', item: OPEN[0] }, { kind: 'par-steps', item: OPEN[1] }],
    nextOnRight: true,
    defaults: { fix: 1 },
    rules: [['explain', 'What one move does both', [[true, 'On'], [false, 'Off']], 'After a figure (always on the first of its kind, and after a miss): tap › through why two parallel mirrors make a translation and two crossing mirrors a half turn.']],
    configure(S) { EXPLAIN = S.explain !== false; return {}; },
    text: it => `${it.pre.map((p, i) => namesOf(it)[i] + pt(p)).join(' ')}: ${it.ms.map(moveTxt).join(', then ')}${it.lvl === 2 ? ' (both images)' : it.lvl === 1 ? ' (final image)' : ''}`,
    speak: it => `${it.pre.map((p, i) => namesOf(it)[i] + ' at ' + pt(p)).join(', ')}. First ${moveTxt(it.ms[0])}, then ${moveTxt(it.ms[1])}.`
      + (it.lvl === 0 ? ` Type where ${namesOf(it)[0]} ends up.` : ' Tap the images on the grid.'),
    ask(el, it, submit, ctx) {
      el._x = null;
      const lvl = ctx && ctx.mode === 'warm' ? Math.min(it.lvl, 1) : it.lvl;
      lvl ? askPlot(el, it, lvl, submit) : askNum(el, it, submit);
    },
    correct: it => final(it).map((p, i) => namesOf(it, '″')[i] + pt(p)).join(' '),
    isRight: (it, a) => a.errs.length === 0,
    classify: (it, a) => a.errs[0].type,
    feedback: (it, w, a) => ['pic', a.errs[0].text],
    reveal(el, it, a, o) {
      const x = el._x; if (!x) return;
      if (x.lvl === 0) {
        x.f.mark('x', a.p && a.p[0] === final(it)[0][0]); x.f.mark('y', a.p && a.p[1] === final(it)[0][1]);
        if (!o.right) numCue(el, it, a.p);
        return;
      }
      const g = x.g;
      // the cue: the first wrong try, red and dashed, beside the fixed figure
      if (!o.right && x.lvl === 1) faint(g, first(it), namesOf(it, '′'));       // the step they skipped in their head
      if (!o.right && x.bad && a.errs[0].type !== 'names') {
        const b = x.bad.pts;
        if (b.length > 2) g.poly(b, 'pg no tm-was');
        b.forEach(p => { if (!final(it).concat(first(it)).some(q => same(p, q))) g.dot(p, 'pt no'); });
      }
      if (EXPLAIN && it.idea !== 'tr' && (x.lvl === 2 || !o.right || !told.has(it.idea))) explain(el, x);
    },
    errors: ERRORS,
    diagnose: err => TIPS[err] || ['', ''],
    get keyHTML() {
      const host = document.createElement('div'), it = OPEN[0], { g } = picture(host, it);
      faint(g, first(it), namesOf(it, '′'));
      g.poly(final(it), 'pg ok'); final(it).forEach((p, i) => g.dot(p, 'pt ok', namesOf(it, '″')[i] + pt(p)));
      return `<div class="gk"><div class="gridbox">${host.querySelector('svg').outerHTML}</div><div>A → A′ → A″: the second move starts from the first image</div>`
        + '<div>two parallel mirrors: a translation, twice the gap</div><div>two crossing mirrors (like the axes): a half turn about where they cross</div></div>';
    }
  });
  // for tests: Apparatus.defs['geo-two-moves']._t
  Apparatus.defs['geo-two-moves']._t = { apply, final, first, candidates, plotErr, OPEN, figure, trItem, rrMoves, parMoves, axesMoves };
})();
