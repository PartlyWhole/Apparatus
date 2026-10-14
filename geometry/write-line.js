// Write the Line (G7) — parallel or perpendicular to a given line (any form) through a point → y = mx + b.
// Step by step, as on paper: slope of the given line → the new slope → b; horizontal/vertical answers are y = c / x = c.
// A wrong step is explained in place and fixed; first-try mistakes are what's graded. The next-session check asks
// for the answer directly (m and b). Spec: specs/geometry-lines.md (G7). Uses lib/frac.js, lib/lines.js.
(function () {
  const F = Frac, L = Lines, { r, any } = L;
  const nz = (a, b) => { let v = 0; while (v === 0) v = r(a, b); return v; };
  const show = f => f.undef ? 'undefined' : f.d === 1 ? L.neg(f.n) : [2, 4, 5, 10].includes(f.d) ? L.neg(String(f.n / f.d)) : F.text(f);
  const sl = f => F.text(f);
  const pt = p => `(${show(p[0])}, ${show(p[1])})`;
  const plain = h => h.replace(/<span class="fr"><span>(\d+)<\/span><span>(\d+)<\/span><\/span>/g, '$1/$2').replace(/<[^>]+>/g, '');

  // a given line: { form: 'si', m, b } | { form: 'std', A, B, C } | { form: 'h', c } | { form: 'v', c }
  const gSlope = g => g.form === 'si' ? g.m : g.form === 'std' ? F.of(-g.A.n * g.B.d, g.A.d * g.B.n) : g.form === 'h' ? F.of(0) : F.UNDEF;
  const gHTML = g => g.form === 'si' ? L.si(g.m, g.b) : g.form === 'std' ? L.std(g.A, g.B, g.C) : g.form === 'h' ? `y = ${show(g.c)}` : `x = ${show(g.c)}`;
  const hvItem = it => it.g.form === 'h' || it.g.form === 'v';
  const newSlope = it => it.rel === 'par' ? gSlope(it.g) : F.perp(gSlope(it.g));
  const B = it => F.sub(it.p[1], F.mul(newSlope(it), it.p[0]));
  // the answer, written: y = mx + b, y = c or x = c
  const answerHTML = it => { const m = newSlope(it); return m.undef ? `x = ${show(it.p[0])}` : m.n === 0 ? `y = ${show(it.p[1])}` : L.si(m, B(it)); };

  // items
  const SL = [[2], [3], [-2], [1, 2], [-1, 3], [1, 5], [3, 4], [-2, 3]];
  function si() { return { form: 'si', m: F.of(...any(SL)), b: F.of(nz(-9, 9)) }; }
  function std() { const Bc = any([2, -2, 4, -4, 3]), A = nz(-4, 4); return { form: 'std', A: F.of(A), B: F.of(Bc), C: F.of(Bc * nz(-3, 3)) }; }
  // a point that makes b a whole number for the new slope
  function point(m) { const x = m.undef || m.n === 0 ? nz(-6, 6) : m.d * nz(-2, 2); return [F.of(x), F.of(nz(-6, 6))]; }
  function item(rel, gfun) { const g = gfun(), it = { rel, g }; it.p = point(newSlope(it)); return it; }
  const hv = () => { const rel = any(['par', 'perp']), g = any([{ form: 'h', c: F.of(nz(-6, 6)) }, { form: 'v', c: F.of(nz(-6, 6)) }]); return { rel, g, p: [F.of(nz(-6, 6)), F.of(nz(-9, 9))] }; };
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

  // the steps: [label HTML, the box, the right value, error type]
  function steps(it) {
    const n = newSlope(it), out = [
      ['m =', 'given', gSlope(it.g), 'given'],
      [`${it.rel === 'par' ? '∥' : '⟂'} m =`, 'slope', n, 'slope']
    ];
    if (n.undef) out.push(['x =', 'x', it.p[0], 'hv']);
    else if (n.n === 0) out.push(['y =', 'y', it.p[1], 'hv']);
    else out.push([`${L.term(n, 'x', true) ? `y = ${L.term(n, 'x', true)} +` : 'y ='}`, 'b', B(it), 'b']);
    return out;
  }
  // the steps, one row at a time; a miss shows why, then fresh boxes in the same place (first tries are graded).
  // In the next-session check (warm) it's the answer at once: y = [m]x + [b] (or y = [ ] / x = [ ]).
  function mount(el, it, direct, done) {
    const errs = [];
    el.innerHTML = `<div class="gq"><div class="q">${it.rel === 'par' ? '∥' : '⟂'} to ${gHTML(it.g)}</div><div class="q small">through P${pt(it.p)}</div>
      <div class="wl"></div><p class="say" aria-live="polite"></p><div class="q final"></div></div>`;
    const list = el.querySelector('.wl'), sayEl = el.querySelector('.say'), n = newSlope(it);
    const flatOrUp = n.undef || n.n === 0;
    // each row: [label before, [[box name, right value, error type, undef chip]], label after]
    const all = !direct ? steps(it).map(([lab, name, want, type]) => [lab, [[name, want, type, (type === 'given' || type === 'slope') && hvItem(it)]], ''])
      : flatOrUp ? [[steps(it)[2][0], [[steps(it)[2][1], steps(it)[2][2], 'hv', false]], '']]
      : [['y =', [['m', n, 'slope', false], ['b', B(it), 'b', false]], '']];
    let i = 0;
    (function next() {
      if (i === all.length) { el.querySelector('.final').innerHTML = `<span class="ok">${answerHTML(it)}</span>`; sayEl.textContent = ''; return done(errs); }
      const [lab, boxes] = all[i], row = document.createElement('div');
      row.className = 'q step'; list.appendChild(row);
      (function build() {
        const bx = boxes.map(([name, , , u], k) => `${k ? '<span>x +</span> ' : ''}${F.box(name, { undef: u })}`).join(' ');
        row.innerHTML = `<span class="lab">${lab}</span> ${bx} <button type="button" class="go">Check</button>`;
        const f = F.wire(row, { say: sayEl, want: nm => boxes.find(x => x[0] === nm)[1], onSubmit: v => {
          const bad = boxes.filter(([name, want]) => !F.eq(v[name].v, want));
          boxes.forEach(([name, want]) => f.mark(name, F.eq(v[name].v, want)));
          if (!bad.length) { row.querySelector('.go').remove(); sayEl.textContent = ''; sayEl.classList.remove('bad'); i++; return next(); }
          const type = bad[0][2];
          if (!errs.some(e => e.step === i)) errs.push({ type, text: say[type](it), step: i });
          sayEl.textContent = say[type](it); sayEl.classList.add('bad');
          setTimeout(build, 1600);
        } });
      })();
    })();
  }

  Apparatus.define({
    id: 'geo-write-line',
    title: 'Write the Line',
    ideas: {
      par:  { name: 'Parallel through a point', easy: ['par-si'], hard: ['par-std'] },
      perp: { name: 'Perpendicular through a point', easy: ['perp-si'], hard: ['perp-std', 'perp-si'] },
      hv:   { name: 'Horizontal and vertical lines', easy: ['hv'], hard: ['hv', 'hv'], late: true }
    },
    kinds: {
      'par-si': mk('par', () => item('par', si)), 'par-std': mk('par', () => item('par', std)),
      'perp-si': mk('perp', () => item('perp', si)), 'perp-std': mk('perp', () => item('perp', std)),
      hv: mk('hv', hv)
    },
    // small numbers on purpose: the process, not the arithmetic
    opening: [
      { kind: 'perp-si', item: { rel: 'perp', g: { form: 'si', m: F.of(1, 5), b: F.of(-4) }, p: [F.of(1), F.of(-2)] } },
      { kind: 'par-std', item: { rel: 'par', g: { form: 'std', A: F.of(2), B: F.of(-4), C: F.of(8) }, p: [F.of(4), F.of(1)] } }
    ],
    nextOnRight: true,
    text: it => `${it.rel === 'par' ? '∥' : '⟂'} to ${plain(gHTML(it.g))} through ${pt(it.p)}`,
    speak: it => `Write the line ${it.rel === 'par' ? 'parallel' : 'perpendicular'} to ${plain(gHTML(it.g))} through ${pt(it.p)}.`,
    ask(el, it, submit, ctx) { mount(el, it, ctx.mode === 'warm', submit); },
    correct: it => plain(answerHTML(it)),
    isRight: (it, errs) => errs.length === 0,
    classify: (it, errs) => errs[0].type,
    feedback: (it, w, errs) => ['', errs[0].text],
    reveal() {},
    errors: { given: 'slope of the given line', slope: 'parallel/perpendicular slope', b: 'b', hv: 'horizontal/vertical line' },
    diagnose(err) {
      return ({
        given: ['Can’t read the slope of the given line (often from Ax + By = C).', 'Solve for y first, one step at a time; the slope is the number with x.'],
        slope: ['Mixes up the parallel and perpendicular rules.', 'Parallel: same slope. Perpendicular: flip and change sign — check they multiply to −1.'],
        b: ['Slips finding b.', 'Plug the point into y = mx + b and solve: b = y − m·x, with brackets around negatives.'],
        hv: ['Doesn’t handle horizontal/vertical lines.', 'A flat line is y = (its y); a vertical line is x = (its x). Parallel to flat is flat; perpendicular to vertical is flat.']
      })[err] || ['', ''];
    },
    keyHTML: `<div class="gk"><div>1. slope of the given line</div><div>2. ∥ same · ⟂ flip and change sign</div><div>3. b = y − m·x</div><div>flat: y = c · vertical: x = c</div></div>`
  });
})();
