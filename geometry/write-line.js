// Write the Line (G7) — parallel or perpendicular to a given line (any form, two points, or a graph) through a point → y = mx + b.
// Asked in plain steps, information given as it's needed:
//   1. What is the slope of 2x − 4y = 8?   2. What slope is parallel (perpendicular) to it?
//   3. The parallel line goes through P(4, 1): drag the slope into y = [ ]x + b, then P's numbers into [y] = ½·[x] + b
//   4. b = [ ]  → the line, y = ½x − 1.
// Scaffolding fades with item.lvl: 2 = all steps with the drags (opening), 1 = steps 1–2 then y = ½x + [b] typed,
// 0 = the whole line at once (later items, the next-session check). Flat/vertical answers are y = c / x = c.
// A wrong step is explained in place and fixed; first-try mistakes are what's graded.
// The line can be given by two points ("the line through A(−3, 2) and B(1, 1)") or drawn on a grid with no dots
// (lvl 2: tap two lattice points on it first; lvl 1: the slope box; lvl 0: y = [ ]x + [ ]). When P is on the y-axis the
// step reads "crosses the y-axis at (0, 4)" and b is read off (no substitution).
// Spec: specs/geometry-lines.md (G7), specs/geometry-next.md (additions). Uses lib/frac.js, lib/lines.js, lib/drag.js, lib/grid.js.
(function () {
  const F = Frac, L = Lines, { r, any } = L;
  const nz = (a, b) => { let v = 0; while (v === 0) v = r(a, b); return v; };
  const show = f => f.undef ? 'undefined' : f.d === 1 ? L.neg(f.n) : [2, 4, 5, 10].includes(f.d) ? L.neg(String(f.n / f.d)) : F.text(f);
  const sl = f => F.text(f);
  const pt = p => `(${show(p[0])}, ${show(p[1])})`;
  const plain = L.plain;
  const REL = { par: 'parallel', perp: 'perpendicular' };

  // a given line (Lines.given): si | std | h | v | pts (two points) | graph (drawn on the grid)
  const gSlope = L.given.slope, gHTML = L.given.html;
  const words = g => g.form === 'pts' || g.form === 'graph';
  // bold the equation; for two points only the points (a long bold run won't wrap)
  const gB = g => g.form === 'pts' ? gHTML(g).replace(/[A-Z]\([^)]*\)/g, '<b>$&</b>') : words(g) ? gHTML(g) : `<b>${gHTML(g)}</b>`;
  const gErr = g => g.form === 'pts' || g.form === 'graph' ? g.form : 'given';
  const onY = it => it.p[0].n === 0;
  const par = v => v < 0 ? `(${L.neg(v)})` : String(v);
  const newSlope = it => it.rel === 'par' ? gSlope(it.g) : F.perp(gSlope(it.g));
  const B = it => F.sub(it.p[1], F.mul(newSlope(it), it.p[0]));
  const flatOrUp = it => { const n = newSlope(it); return n.undef || n.n === 0; };
  // the answer, written: y = mx + b, y = c or x = c
  const answerHTML = it => { const m = newSlope(it); return m.undef ? `x = ${show(it.p[0])}` : m.n === 0 ? `y = ${show(it.p[1])}` : L.si(m, B(it)); };

  // items
  const SL = [[2], [3], [-2], [1, 2], [-1, 3], [1, 5], [3, 4], [-2, 3]];
  function si() { return { form: 'si', m: F.of(...any(SL)), b: F.of(nz(-9, 9)) }; }
  function std() { const Bc = any([2, -2, 4, -4, 3]), A = nz(-4, 4); return { form: 'std', A: F.of(A), B: F.of(Bc), C: F.of(Bc * nz(-3, 3)) }; }
  // the line through two points, or drawn on the grid: small slopes, both points (or the line's grid corners) on −5..5
  const SLP = [[2], [-2], [3], [1, 2], [-1, 2], [-1, 3], [2, 3], [-1, 4]];
  function pts() { const m = any(SLP), a = L.fit(m[1] || 1, m[0]), k = any([1, -1]); return { form: 'pts', a, b: [a[0] + k * (m[1] || 1), a[1] + k * m[0]] }; }
  function graph() { const m = any(SLP.slice(0, 7)), a = L.fit(m[1] || 1, m[0]); return { form: 'graph', a, b: [a[0] + (m[1] || 1), a[1] + m[0]] }; }
  // is p on the given line? (a parallel line through it would be the line itself)
  function onGiven(g, p) {
    const [x, y] = p, m = gSlope(g);
    if (g.form === 'h') return F.eq(y, g.c); if (g.form === 'v') return F.eq(x, g.c);
    const q = g.form === 'si' ? [F.of(0), g.b] : g.form === 'std' ? [F.of(0), F.div(g.C, g.B)] : [F.of(g.a[0]), F.of(g.a[1])];
    return F.eq(F.sub(y, q[1]), F.mul(m, F.sub(x, q[0])));
  }
  // a point that makes b a whole number for the new slope (yAxis: sometimes on the y-axis, b read off)
  function point(m, yAxis) { const x = m.undef || m.n === 0 ? nz(-6, 6) : yAxis && Math.random() < 0.35 ? 0 : m.d * nz(-2, 2); return [F.of(x), F.of(nz(-6, 6))]; }
  function item(rel, gfun, lvl) {
    const g = gfun(), it = { rel, g, lvl };
    do it.p = point(newSlope(it), words(g)); while (rel === 'par' && onGiven(g, it.p));
    return it;
  }
  // the graph fades: the first one taps two points (lvl 2), the next the slope box (1), then the line at once (0)
  let graphs = 0;
  const graphItem = () => item(any(['par', 'perp']), graph, Math.max(0, 2 - graphs++));
  const hv = lvl => { const rel = any(['par', 'perp']), g = any([{ form: 'h', c: F.of(nz(-6, 6)) }, { form: 'v', c: F.of(nz(-6, 6)) }]); return { rel, g, lvl, p: [F.of(nz(-6, 6)), F.of(nz(-9, 9))] }; };
  const mk = (idea, f) => ({ idea, make: f });

  // what a wrong step means, in one sentence
  function stdWork(g) {
    const m = gSlope(g), negA = F.neg(g.A), bC = F.of(g.C.n * g.B.d, g.C.d * g.B.n);
    return `${plain(L.term(g.B, 'y', true))} = ${plain([L.term(negA, 'x', true), L.constant(g.C, false)].filter(Boolean).join(' '))} → ${plain(L.si(m, bC))}`;
  }
  const say = {
    given: it => { const g = it.g, m = gSlope(g); return g.form === 'pts' ? `Subtract in the same order: (${L.neg(g.b[1])} − ${par(g.a[1])})/(${L.neg(g.b[0])} − ${par(g.a[0])}) = ${sl(m)}.`
      : g.form === 'graph' ? `${m.n < 0 ? 'Down' : 'Up'} ${Math.abs(m.n)} for every ${m.d} across: ${sl(m)}.`
      : g.form === 'std' ? `Solve for y: ${stdWork(g)}. Slope ${sl(m)}.` : g.form === 'h' ? `y = ${show(g.c)} is flat: slope 0.` : g.form === 'v' ? `x = ${show(g.c)} is vertical: slope undefined.` : `The slope is the number with x: ${sl(m)}.`; },
    slope: it => { const m = gSlope(it.g), n = newSlope(it); return it.rel === 'par' ? `Parallel lines have the same slope: ${sl(n)}.` : m.undef || m.n === 0 ? `Perpendicular to a ${m.undef ? 'vertical' : 'flat'} line is ${m.undef ? 'flat' : 'vertical'}: ${sl(n)}.` : `Flip and change the sign: perpendicular to ${sl(m)} is ${sl(n)}.`; },
    b: it => { const n = newSlope(it), x = it.p[0]; if (onY(it)) return `It crosses the y-axis at ${pt(it.p)}, so b = ${show(it.p[1])}.`; return `b = y − m·x = ${show(it.p[1])} − ${n.n < 0 ? `(${sl(n)})` : sl(n)}·${x.n < 0 ? `(${show(x)})` : show(x)} = ${show(B(it))}.`; },
    hv: it => { const n = newSlope(it); return n.undef ? `A vertical line through ${pt(it.p)}: every point has x = ${show(it.p[0])}.` : `A flat line through ${pt(it.p)}: every point has y = ${show(it.p[1])}.`; }
  };

  say.pts = say.graph = say.given;

  // extra sentences for the drag steps
  say.pick = it => `That’s the given line’s slope. The ${REL[it.rel]} line’s slope is ${sl(newSlope(it))}.`;
  say.sub = it => `A point is (x, y): x is ${show(it.p[0])}, y is ${show(it.p[1])}.`;

  // a row with answer boxes: boxes = [[name, right value, error type]], html before/after them
  function boxRow(row, it, ctx, boxes, before, after) {
    row.innerHTML = `${before}${boxes.map(([n], k) => (k ? ' <span>x +</span> ' : '') + F.box(n)).join('')}${after || ''} <button type="button" class="go">Check</button>`;
    const f = F.wire(row, { say: ctx.say, want: nm => boxes.find(x => x[0] === nm)[1], onSubmit: v => {
      boxes.forEach(([n, w]) => f.mark(n, F.eq(v[n].v, w)));
      const bad = boxes.find(([n, w]) => !F.eq(v[n].v, w));
      if (!bad) return ctx.right();
      // the given line's slope picked for the new one (perpendicular): say so
      if (bad[2] === 'slope' && it.rel === 'perp' && F.eq(v[bad[0]].v, gSlope(it.g))) return ctx.wrong('slope', say.pick(it));
      ctx.wrong(bad[2], say[bad[2]](it));
    } });
  }
  // a row with drag slots: chips [[key, html]], slots in the equation, want { slot: chipKey }
  function dragRow(row, it, ctx, chips, eqHTML, want, type, point) {
    row.classList.add('drag');
    const chip = ([k, h]) => `<button type="button" class="dchip" data-k="${k}">${h}</button>`;
    // the point's numbers stay in their point: P( 4 , 1 )
    row.innerHTML = `<div class="wl-chips">${point ? `<span class="dpt"><b>P</b>(${chip(chips[0])},&nbsp;${chip(chips[1])})</span>` : chips.map(chip).join('')}</div>
      <div class="wl-eq">${eqHTML}</div><button type="button" class="go" disabled>Check</button>`;
    const go = row.querySelector('.go'), n = Object.keys(want).length;
    const html = Object.fromEntries(chips);
    const d = Drag.wire({
      chips: Array.from(row.querySelectorAll('.dchip')), slots: Array.from(row.querySelectorAll('.dslot')),
      show: (slot, k) => { slot.innerHTML = k ? html[k] : `<span class="dn">${slot.dataset.ph}</span>`; },
      onChange: placed => { go.disabled = Object.keys(placed).length < n; }
    });
    go.addEventListener('click', () => {
      d.disable(); go.disabled = true;
      const bad = Object.keys(want).filter(k => d.placed[k] !== want[k]);
      row.querySelectorAll('.dslot').forEach(s => s.classList.add(bad.includes(s.dataset.s) ? 'no' : 'ok'));
      if (!bad.length) return ctx.right();
      // which mistake: the given line's slope used, or x and y swapped
      ctx.wrong(type, type === 'slope' ? say.pick(it) : say.sub(it));
    });
  }
  const slot = (name, ph) => `<span class="dslot" data-s="${name}" data-ph="${ph}" role="button" tabindex="0"><span class="dn">${ph}</span></span>`;

  // the steps for an item, by its scaffolding level
  function steps(it, lvl) {
    const n = newSlope(it), rel = REL[it.rel], P = `P${pt(it.p)}`, out = [], y0 = onY(it) && !n.undef && n.n !== 0;
    const at = y0 ? `crosses the y-axis at ${pt(it.p)}` : `goes through ${P}`;
    if (lvl === 0) {
      out.push({ text: `The line ${rel} to ${gB(it.g)} that ${at}:` });
      if (n.undef) out.push({ boxes: [['x', it.p[0], 'hv']], before: 'x = ' });
      else if (n.n === 0) out.push({ boxes: [['y', it.p[1], 'hv']], before: 'y = ' });
      else out.push({ boxes: [['m', n, 'slope'], ['b', B(it), 'b']], before: 'y = ' });
      return out;
    }
    out.push({ text: `What is the slope of ${gB(it.g)}?` });
    // the graph, fully scaffolded: tap two grid corners on the line first
    if (it.g.form === 'graph' && lvl === 2) out.push({ tap: true });
    out.push({ boxes: [['given', gSlope(it.g), gErr(it.g)]], before: 'slope = ' });
    out.push({ text: `What slope is ${rel} to it?`, boxes: [['slope', n, 'slope']], before: 'slope = ' });
    out.push({ text: `The ${rel} line ${at}.` });
    if (n.undef) { out.push({ boxes: [['x', it.p[0], 'hv']], before: 'x = ' }); return out; }
    if (n.n === 0) { out.push({ boxes: [['y', it.p[1], 'hv']], before: 'y = ' }); return out; }
    if (lvl === 2) {
      // the skeleton: drag the new slope in (for perpendicular, the given slope is a chip too)
      const ms = [['new', F.html(n)]]; if (it.rel === 'perp') ms.push(['old', F.html(gSlope(it.g))]);
      out.push({ drag: ms.sort(() => Math.random() - 0.5), eq: `y = ${slot('m', 'm')}x + b`, want: { m: 'new' }, type: 'slope' });
      // substitute P: [y] = m·[x] + b (on the y-axis b is read off instead)
      const mm = n.n < 0 ? `(${F.html(n)})` : F.html(n);
      if (!y0) {
        out.push({ text: `To find b, put P’s x and y into the equation.` });
        out.push({ drag: [['x', show(it.p[0])], ['y', show(it.p[1])]], point: true, eq: `${slot('y', 'y')} = ${mm}·${slot('x', 'x')} + b`, want: { x: 'x', y: 'y' }, type: 'sub' });
      }
      out.push({ boxes: [['b', B(it), 'b']], before: 'b = ' });
    } else {
      out.push({ boxes: [['b', B(it), 'b']], before: `${L.term(n, 'x', true) ? `y = ${L.term(n, 'x', true)} +` : 'y ='} ` });
    }
    return out;
  }

  // the rows, one at a time; a miss shows why, then the row again in the same place (first tries are graded)
  function mount(el, it, lvl, done) {
    const errs = [], gr = it.g.form === 'graph';
    el.innerHTML = `<div class="gq wline">${gr ? '<div class="gridbox wl-grid"></div>' : ''}<div class="wl"></div><p class="say" aria-live="polite"></p><div class="q final"></div></div>`;
    const list = el.querySelector('.wl'), sayEl = el.querySelector('.say'), all = steps(it, lvl);
    // the given line on the grid, no dots; a slope miss shows the counted triangle between two of its grid corners
    let g = null, ab = [it.g.a, it.g.b], tri = null;
    if (gr) { g = Grid.make(el.querySelector('.wl-grid')); g.line(it.g.a, it.g.b, 'ln'); }
    const counted = () => { if (!g) return; tri && g.remove(tri); tri = g.triangle(ab[0], ab[1], { labels: true }); };
    let i = 0;
    (function next() {
      if (i === all.length) { el.querySelector('.final').innerHTML = `<span class="ok">${answerHTML(it)}</span>`; sayEl.textContent = ''; return done(errs); }
      const st = all[i];
      if (st.text) { const t = document.createElement('div'); t.className = 'q small wl-text'; t.innerHTML = st.text; list.appendChild(t); }
      if (st.tap) {
        // not graded: a tap off the line just says where to tap
        const [a, b] = [it.g.a, it.g.b], on = q => (q[0] - a[0]) * (b[1] - a[1]) === (q[1] - a[1]) * (b[0] - a[0]);
        g.pickTwo({ on, labels: '?', say: sayEl }).then(two => { ab = two; tri = two.tri; i++; next(); });
        return;
      }
      if (!st.boxes && !st.drag) { i++; return next(); }
      const row = document.createElement('div'); row.className = 'q step'; list.appendChild(row);
      const ctx = {
        say: sayEl,
        right() { const g = row.querySelector('.go'); g && g.remove(); sayEl.textContent = ''; sayEl.classList.remove('bad'); i++; next(); },
        wrong(type, text) {
          if (!errs.some(e => e.step === i)) errs.push({ type, text, step: i });
          if (type === 'graph') counted();
          sayEl.textContent = text; sayEl.classList.add('bad');
          setTimeout(build, 1600);
        }
      };
      const build = () => st.drag ? dragRow(row, it, ctx, st.drag, st.eq, st.want, st.type, st.point) : boxRow(row, it, ctx, st.boxes, st.before, st.after);
      build();
    })();
  }

  Apparatus.define({
    id: 'geo-write-line',
    title: 'Write the Line',
    ideas: {
      par:  { name: 'Parallel through a point', easy: ['par-steps'], hard: ['par-line'] },
      perp: { name: 'Perpendicular through a point', easy: ['perp-steps'], hard: ['perp-line', 'perp-steps'] },
      from: { name: 'Given two points or a graph', easy: ['pts-steps'], hard: ['pts-line', 'graph-line'] },
      hv:   { name: 'Horizontal and vertical lines', easy: ['hv-steps'], hard: ['hv-line'], late: true }
    },
    kinds: {
      'par-steps': mk('par', () => item('par', any([si, std]), 1)), 'par-line': mk('par', () => item('par', std, 0)),
      'perp-steps': mk('perp', () => item('perp', any([si, std]), 1)), 'perp-line': mk('perp', () => item('perp', any([si, std]), 0)),
      'pts-steps': mk('from', () => item(any(['par', 'perp']), pts, 1)), 'pts-line': mk('from', () => item(any(['par', 'perp']), pts, 0)),
      'graph-line': mk('from', graphItem),
      'hv-steps': mk('hv', () => hv(1)), 'hv-line': mk('hv', () => hv(0))
    },
    // the full scaffold first (small numbers on purpose: the process, not the arithmetic)
    opening: [
      { kind: 'par-steps', item: { rel: 'par', g: { form: 'std', A: F.of(2), B: F.of(-4), C: F.of(8) }, p: [F.of(4), F.of(1)], lvl: 2 } },
      { kind: 'perp-steps', item: { rel: 'perp', g: { form: 'si', m: F.of(1, 5), b: F.of(-4) }, p: [F.of(1), F.of(-2)], lvl: 2 } }
    ],
    nextOnRight: true,
    defaults: { fix: 1 },
    // for the tutor, a graph is named by two of its grid corners
    text: it => `${it.rel === 'par' ? '∥' : '⟂'} to ${it.g.form === 'graph' ? `the graph ${pt(it.g.a.map(v => F.of(v)))}–${pt(it.g.b.map(v => F.of(v)))}` : plain(gHTML(it.g))} through ${pt(it.p)}`,
    speak: it => `Write the line ${it.rel === 'par' ? 'parallel' : 'perpendicular'} to ${plain(gHTML(it.g))} through ${pt(it.p)}.`,
    ask(el, it, submit, ctx) { mount(el, it, ctx.mode === 'warm' ? 0 : it.lvl ?? 1, submit); },
    correct: it => plain(answerHTML(it)),
    isRight: (it, errs) => errs.length === 0,
    classify: (it, errs) => errs[0].type,
    feedback: (it, w, errs) => ['', errs[0].text],
    reveal() {},
    errors: { given: 'slope of the given line', pts: 'slope from the two points', graph: 'slope from the graph', slope: 'parallel/perpendicular slope', sub: 'swapped x and y substituting', b: 'b', hv: 'horizontal/vertical line' },
    diagnose(err) {
      return ({
        given: ['Can’t read the slope of the given line (often from Ax + By = C).', 'Solve for y first, one step at a time; the slope is the number with x.'],
        pts: ['Slips on the slope from two points: subtracts in a different order on top and bottom, or puts across over up.', 'Write (y of B − y of A) over (x of B − x of A): the same point first both times, brackets around negatives.'],
        graph: ['Misreads the slope of a drawn line: the sign, or across over up.', 'Find two grid corners the line goes through; count across, then up (+) or down (−); slope = up or down over across.'],
        slope: ['Mixes up the parallel and perpendicular rules.', 'Parallel: same slope. Perpendicular: flip and change sign — check they multiply to −1.'],
        sub: ['Puts the point’s x where y goes (or the other way round) when substituting.', 'Write x = and y = under the point’s two numbers before plugging them in.'],
        b: ['Slips finding b.', 'Plug the point into y = mx + b and solve: b = y − m·x, with brackets around negatives.'],
        hv: ['Doesn’t handle horizontal/vertical lines.', 'A flat line is y = (its y); a vertical line is x = (its x). Parallel to flat is flat; perpendicular to vertical is flat.']
      })[err] || ['', ''];
    },
    keyHTML: `<div class="gk"><div>1. the slope of the given line (two points: subtract in the same order)</div><div>2. parallel: the same · perpendicular: flip and change sign</div><div>3. put the point into y = mx + b and solve for b</div><div>flat: y = c · vertical: x = c</div></div>`
  });
})();
