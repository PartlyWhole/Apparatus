// Write the Line (G7) — parallel or perpendicular to a given line (any form) through a point → y = mx + b.
// Asked in plain steps, information given as it's needed:
//   1. What is the slope of 2x − 4y = 8?   2. What slope is parallel (perpendicular) to it?
//   3. The parallel line goes through P(4, 1): drag the slope into y = [ ]x + b, then P's numbers into [y] = ½·[x] + b
//   4. b = [ ]  → the line, y = ½x − 1.
// Scaffolding fades with item.lvl: 2 = all steps with the drags (opening), 1 = steps 1–2 then y = ½x + [b] typed,
// 0 = the whole line at once (later items, the next-session check). Flat/vertical answers are y = c / x = c.
// A wrong step is explained in place and fixed; first-try mistakes are what's graded.
// Spec: specs/geometry-lines.md (G7). Uses lib/frac.js, lib/lines.js, lib/drag.js.
(function () {
  const F = Frac, L = Lines, { r, any } = L;
  const nz = (a, b) => { let v = 0; while (v === 0) v = r(a, b); return v; };
  const show = f => f.undef ? 'undefined' : f.d === 1 ? L.neg(f.n) : [2, 4, 5, 10].includes(f.d) ? L.neg(String(f.n / f.d)) : F.text(f);
  const sl = f => F.text(f);
  const pt = p => `(${show(p[0])}, ${show(p[1])})`;
  const plain = h => h.replace(/<span class="fr"><span>(\d+)<\/span><span>(\d+)<\/span><\/span>/g, '$1/$2').replace(/<[^>]+>/g, '');
  const REL = { par: 'parallel', perp: 'perpendicular' };

  // a given line: { form: 'si', m, b } | { form: 'std', A, B, C } | { form: 'h', c } | { form: 'v', c }
  const gSlope = g => g.form === 'si' ? g.m : g.form === 'std' ? F.of(-g.A.n * g.B.d, g.A.d * g.B.n) : g.form === 'h' ? F.of(0) : F.UNDEF;
  const gHTML = g => g.form === 'si' ? L.si(g.m, g.b) : g.form === 'std' ? L.std(g.A, g.B, g.C) : g.form === 'h' ? `y = ${show(g.c)}` : `x = ${show(g.c)}`;
  const newSlope = it => it.rel === 'par' ? gSlope(it.g) : F.perp(gSlope(it.g));
  const B = it => F.sub(it.p[1], F.mul(newSlope(it), it.p[0]));
  const flatOrUp = it => { const n = newSlope(it); return n.undef || n.n === 0; };
  // the answer, written: y = mx + b, y = c or x = c
  const answerHTML = it => { const m = newSlope(it); return m.undef ? `x = ${show(it.p[0])}` : m.n === 0 ? `y = ${show(it.p[1])}` : L.si(m, B(it)); };

  // items
  const SL = [[2], [3], [-2], [1, 2], [-1, 3], [1, 5], [3, 4], [-2, 3]];
  function si() { return { form: 'si', m: F.of(...any(SL)), b: F.of(nz(-9, 9)) }; }
  function std() { const Bc = any([2, -2, 4, -4, 3]), A = nz(-4, 4); return { form: 'std', A: F.of(A), B: F.of(Bc), C: F.of(Bc * nz(-3, 3)) }; }
  // a point that makes b a whole number for the new slope
  function point(m) { const x = m.undef || m.n === 0 ? nz(-6, 6) : m.d * nz(-2, 2); return [F.of(x), F.of(nz(-6, 6))]; }
  function item(rel, gfun, lvl) { const g = gfun(), it = { rel, g, lvl }; it.p = point(newSlope(it)); return it; }
  const hv = lvl => { const rel = any(['par', 'perp']), g = any([{ form: 'h', c: F.of(nz(-6, 6)) }, { form: 'v', c: F.of(nz(-6, 6)) }]); return { rel, g, lvl, p: [F.of(nz(-6, 6)), F.of(nz(-9, 9))] }; };
  const mk = (idea, f) => ({ idea, make: f });

  // what a wrong step means, in one sentence
  function stdWork(g) {
    const m = gSlope(g), negA = F.neg(g.A), bC = F.of(g.C.n * g.B.d, g.C.d * g.B.n);
    return `${plain(L.term(g.B, 'y', true))} = ${plain([L.term(negA, 'x', true), L.constant(g.C, false)].filter(Boolean).join(' '))} → ${plain(L.si(m, bC))}`;
  }
  const say = {
    given: it => { const g = it.g, m = gSlope(g); return g.form === 'std' ? `Solve for y: ${stdWork(g)}. Slope ${sl(m)}.` : g.form === 'h' ? `y = ${show(g.c)} is flat: slope 0.` : g.form === 'v' ? `x = ${show(g.c)} is vertical: slope undefined.` : `The slope is the number with x: ${sl(m)}.`; },
    slope: it => { const m = gSlope(it.g), n = newSlope(it); return it.rel === 'par' ? `Parallel lines have the same slope: ${sl(n)}.` : m.undef || m.n === 0 ? `Perpendicular to a ${m.undef ? 'vertical' : 'flat'} line is ${m.undef ? 'flat' : 'vertical'}: ${sl(n)}.` : `Flip and change the sign: perpendicular to ${sl(m)} is ${sl(n)}.`; },
    b: it => { const n = newSlope(it), x = it.p[0], mx = F.mul(n, x); return `b = y − m·x = ${show(it.p[1])} − ${n.n < 0 ? `(${sl(n)})` : sl(n)}·${x.n < 0 ? `(${show(x)})` : show(x)} = ${show(B(it))}.`; },
    hv: it => { const n = newSlope(it); return n.undef ? `A vertical line through ${pt(it.p)}: every point has x = ${show(it.p[0])}.` : `A flat line through ${pt(it.p)}: every point has y = ${show(it.p[1])}.`; }
  };

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
    const n = newSlope(it), rel = REL[it.rel], P = `P${pt(it.p)}`, out = [];
    if (lvl === 0) {
      out.push({ text: `The line ${rel} to <b>${gHTML(it.g)}</b> that goes through ${P}:` });
      if (n.undef) out.push({ boxes: [['x', it.p[0], 'hv']], before: 'x = ' });
      else if (n.n === 0) out.push({ boxes: [['y', it.p[1], 'hv']], before: 'y = ' });
      else out.push({ boxes: [['m', n, 'slope'], ['b', B(it), 'b']], before: 'y = ' });
      return out;
    }
    out.push({ text: `What is the slope of <b>${gHTML(it.g)}</b>?`, boxes: [['given', gSlope(it.g), 'given']], before: 'slope = ' });
    out.push({ text: `What slope is ${rel} to it?`, boxes: [['slope', n, 'slope']], before: 'slope = ' });
    out.push({ text: `The ${rel} line goes through ${P}.` });
    if (n.undef) { out.push({ boxes: [['x', it.p[0], 'hv']], before: 'x = ' }); return out; }
    if (n.n === 0) { out.push({ boxes: [['y', it.p[1], 'hv']], before: 'y = ' }); return out; }
    if (lvl === 2) {
      // the skeleton: drag the new slope in (for perpendicular, the given slope is a chip too)
      const ms = [['new', F.html(n)]]; if (it.rel === 'perp') ms.push(['old', F.html(gSlope(it.g))]);
      out.push({ drag: ms.sort(() => Math.random() - 0.5), eq: `y = ${slot('m', 'm')}x + b`, want: { m: 'new' }, type: 'slope' });
      // substitute P: [y] = m·[x] + b
      const mm = n.n < 0 ? `(${F.html(n)})` : F.html(n);
      out.push({ drag: [['x', show(it.p[0])], ['y', show(it.p[1])]], point: true, eq: `${slot('y', 'y')} = ${mm}·${slot('x', 'x')} + b`, want: { x: 'x', y: 'y' }, type: 'sub' });
      out.push({ boxes: [['b', B(it), 'b']], before: 'b = ' });
    } else {
      out.push({ boxes: [['b', B(it), 'b']], before: `${L.term(n, 'x', true) ? `y = ${L.term(n, 'x', true)} +` : 'y ='} ` });
    }
    return out;
  }

  // the rows, one at a time; a miss shows why, then the row again in the same place (first tries are graded)
  function mount(el, it, lvl, done) {
    const errs = [];
    el.innerHTML = `<div class="gq wline"><div class="wl"></div><p class="say" aria-live="polite"></p><div class="q final"></div></div>`;
    const list = el.querySelector('.wl'), sayEl = el.querySelector('.say'), all = steps(it, lvl);
    let i = 0;
    (function next() {
      if (i === all.length) { el.querySelector('.final').innerHTML = `<span class="ok">${answerHTML(it)}</span>`; sayEl.textContent = ''; return done(errs); }
      const st = all[i];
      if (st.text) { const t = document.createElement('div'); t.className = 'q small wl-text'; t.innerHTML = st.text; list.appendChild(t); }
      if (!st.boxes && !st.drag) { i++; return next(); }
      const row = document.createElement('div'); row.className = 'q step'; list.appendChild(row);
      const ctx = {
        say: sayEl,
        right() { const g = row.querySelector('.go'); g && g.remove(); sayEl.textContent = ''; sayEl.classList.remove('bad'); i++; next(); },
        wrong(type, text) {
          if (!errs.some(e => e.step === i)) errs.push({ type, text, step: i });
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
      hv:   { name: 'Horizontal and vertical lines', easy: ['hv-steps'], hard: ['hv-line'], late: true }
    },
    kinds: {
      'par-steps': mk('par', () => item('par', any([si, std]), 1)), 'par-line': mk('par', () => item('par', std, 0)),
      'perp-steps': mk('perp', () => item('perp', any([si, std]), 1)), 'perp-line': mk('perp', () => item('perp', any([si, std]), 0)),
      'hv-steps': mk('hv', () => hv(1)), 'hv-line': mk('hv', () => hv(0))
    },
    // the full scaffold first (small numbers on purpose: the process, not the arithmetic)
    opening: [
      { kind: 'par-steps', item: { rel: 'par', g: { form: 'std', A: F.of(2), B: F.of(-4), C: F.of(8) }, p: [F.of(4), F.of(1)], lvl: 2 } },
      { kind: 'perp-steps', item: { rel: 'perp', g: { form: 'si', m: F.of(1, 5), b: F.of(-4) }, p: [F.of(1), F.of(-2)], lvl: 2 } }
    ],
    nextOnRight: true,
    defaults: { fix: 1 },
    text: it => `${it.rel === 'par' ? '∥' : '⟂'} to ${plain(gHTML(it.g))} through ${pt(it.p)}`,
    speak: it => `Write the line ${it.rel === 'par' ? 'parallel' : 'perpendicular'} to ${plain(gHTML(it.g))} through ${pt(it.p)}.`,
    ask(el, it, submit, ctx) { mount(el, it, ctx.mode === 'warm' ? 0 : it.lvl ?? 1, submit); },
    correct: it => plain(answerHTML(it)),
    isRight: (it, errs) => errs.length === 0,
    classify: (it, errs) => errs[0].type,
    feedback: (it, w, errs) => ['', errs[0].text],
    reveal() {},
    errors: { given: 'slope of the given line', slope: 'parallel/perpendicular slope', sub: 'swapped x and y substituting', b: 'b', hv: 'horizontal/vertical line' },
    diagnose(err) {
      return ({
        given: ['Can’t read the slope of the given line (often from Ax + By = C).', 'Solve for y first, one step at a time; the slope is the number with x.'],
        slope: ['Mixes up the parallel and perpendicular rules.', 'Parallel: same slope. Perpendicular: flip and change sign — check they multiply to −1.'],
        sub: ['Puts the point’s x where y goes (or the other way round) when substituting.', 'Write x = and y = under the point’s two numbers before plugging them in.'],
        b: ['Slips finding b.', 'Plug the point into y = mx + b and solve: b = y − m·x, with brackets around negatives.'],
        hv: ['Doesn’t handle horizontal/vertical lines.', 'A flat line is y = (its y); a vertical line is x = (its x). Parallel to flat is flat; perpendicular to vertical is flat.']
      })[err] || ['', ''];
    },
    keyHTML: `<div class="gk"><div>1. the slope of the given line</div><div>2. parallel: the same · perpendicular: flip and change sign</div><div>3. put the point into y = mx + b and solve for b</div><div>flat: y = c · vertical: x = c</div></div>`
  });
})();
