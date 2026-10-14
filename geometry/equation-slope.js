// Slope from an Equation (G3) — y = mx + b (read m, in any order), Ax + By = C (solve for y: m = −A/B), y = c and x = c.
// Spec: specs/geometry-lines.md (G3). Uses lib/frac.js, lib/lines.js.
(function () {
  const F = Frac, L = Lines, { r, any } = L;
  const nz = (a, b) => { let v = 0; while (v === 0) v = r(a, b); return v; };
  // an item: { form: 'si' | 'rev' | 'std' | 'h' | 'v', m, b } for slope-intercept; { form: 'std', A, B, C } (fractions) for standard
  const SLOPES = [[2], [3], [-2], [-3], [1, 2], [-1, 3], [3, 4], [-2, 5], [5, 2]];
  const mk = (idea, f) => ({ idea, make: f });
  const siItem = (form, pool) => { const s = any(pool); return { form, m: F.of(...s), b: F.of(nz(-9, 9)) }; };
  // standard form with whole A, B: pick m = −A/B nicely, C a multiple of B
  function stdItem(easy) {
    const B = easy ? any([1, -1]) : any([2, -2, 3, -3, 4, -4, 6, -8, -18]), A = nz(-9, 9) * (easy ? 1 : any([1, 2]));
    return { form: 'std', A: F.of(A), B: F.of(B), C: F.of(B * nz(-6, 6)) };
  }
  const slope = it => it.form === 'std' ? (it.B.n === 0 ? F.UNDEF : F.of(-it.A.n * it.B.d, it.A.d * it.B.n)) : it.form === 'h' ? F.of(0) : it.form === 'v' ? F.UNDEF : it.m;
  const eqHTML = it => it.form === 'si' ? L.si(it.m, it.b) : it.form === 'rev' ? L.siRev(it.m, it.b) : it.form === 'std' ? L.std(it.A, it.B, it.C)
    : it.form === 'h' ? `y = ${L.neg(it.c)}` : `x = ${L.neg(it.c)}`;
  const plain = h => h.replace(/<span class="fr"><span>(\d+)<\/span><span>(\d+)<\/span><\/span>/g, '$1/$2').replace(/<[^>]+>/g, '');
  // the work shown after a miss
  function work(it) {
    const m = slope(it);
    if (it.form === 'std') {
      const negA = F.neg(it.A), bC = F.of(it.C.n * it.B.d, it.C.d * it.B.n);
      return `${plain(L.term(it.B, 'y', true))} = ${plain([L.term(negA, 'x', true), L.constant(it.C, false)].filter(Boolean).join(' '))}  →  ${plain(L.si(m, bC))}`;
    }
    if (it.form === 'rev') return `${plain(eqHTML(it))}  →  ${plain(L.si(it.m, it.b))}`;
    if (it.form === 'h') return `y = ${L.neg(it.c)} is flat: slope 0`;
    if (it.form === 'v') return `x = ${L.neg(it.c)} is vertical: slope undefined`;
    return `${plain(eqHTML(it))}: slope ${F.text(m)}`;
  }

  Apparatus.define({
    id: 'geo-equation',
    title: 'Slope from an Equation',
    ideas: {
      si:      { name: 'y = mx + b (any order)', easy: ['si'], hard: ['rev', 'si-frac'] },
      std:     { name: 'Ax + By = C', easy: ['std-easy'], hard: ['std', 'std-frac'] },
      special: { name: 'y = c and x = c', easy: ['h'], hard: ['h', 'v'], late: true }
    },
    kinds: {
      'si':       mk('si', () => siItem('si', SLOPES.slice(0, 4))),
      'rev':      mk('si', () => siItem('rev', SLOPES)),
      'si-frac':  mk('si', () => siItem('si', SLOPES.slice(4))),
      'std-easy': mk('std', () => stdItem(true)),
      'std':      mk('std', () => stdItem(false)),
      'std-frac': mk('std', () => ({ form: 'std', A: F.of(nz(-6, 6)), B: F.of(any([1, -1]), any([2, 3])), C: F.of(nz(-9, 9)) })),
      'h':        mk('special', () => ({ form: 'h', c: nz(-20, 20) })),
      'v':        mk('special', () => ({ form: 'v', c: nz(-20, 20) }))
    },
    opening: [
      { kind: 'rev', item: { form: 'rev', m: F.of(-3), b: F.of(4) } },
      { kind: 'std', item: { form: 'std', A: F.of(14), B: F.of(-18), C: F.of(72) } }
    ],
    nextOnRight: true,
    text: it => plain(eqHTML(it)),
    speak: it => `${plain(eqHTML(it))}. What is the slope?`,
    ask(el, it, submit) {
      el.innerHTML = `<div class="gq"><div class="q">${eqHTML(it)}</div><div class="q">slope = ${F.box('slope', { undef: true })}</div>
        <p class="say" aria-live="polite"></p><button type="button" class="go">Check</button><div class="work" aria-live="polite"></div></div>`;
      el._f = F.wire(el, { want: () => slope(it), onSubmit: v => submit(v.slope) });
    },
    correct: it => F.text(slope(it)),
    isRight: (it, a) => F.eq(a.v, slope(it)),
    classify(it, a) {
      const m = slope(it), v = a.v;
      if ((m.undef && !v.undef && v.n === 0) || (!m.undef && m.n === 0 && v.undef)) return 'zero';
      const b = it.form === 'std' ? [it.C, F.of(it.C.n * it.B.d, it.C.d * it.B.n)] : it.b ? [it.b] : [];
      if (!v.undef && b.some(x => F.eq(v, x)) && !F.eq(v, m)) return 'b';
      if (!m.undef && !v.undef && m.n !== 0 && F.eq(v, F.neg(m))) return 'sign';
      if (!m.undef && !v.undef && m.n !== 0 && (F.eq(v, F.recip(m)) || F.eq(v, F.neg(F.recip(m))))) return 'recip';
      return 'other';
    },
    feedback(it, want, a, kind, err) {
      const m = slope(it), w = work(it);
      if (err === 'zero') return ['work', m.undef ? `x = ${L.neg(it.c)} is a vertical line: slope undefined.` : `y = ${L.neg(it.c)} is a flat line: slope 0.`];
      if (err === 'b') return ['work', `That number is where the line crosses the y-axis. The slope goes with x: ${F.text(m)}.`];
      if (it.form === 'std') return ['work', err === 'sign' ? `Moving the x term across changes its sign: ${w}.` : err === 'recip' ? `Divide by the y number, not the x number: ${w}.` : `Solve for y: ${w}.`];
      return ['work', `${w}.`];
    },
    reveal(el, it, a, o) {
      el._f && el._f.mark('slope', o.right);
      if (!o.right) el.querySelector('.work').textContent = work(it);
    },
    errors: { b: 'took the y-intercept', sign: 'wrong sign', recip: 'divided the wrong way', zero: 'flat ↔ vertical mixed up', other: 'other' },
    diagnose(err) {
      return ({
        b: ['Takes the constant (where it crosses the y-axis) instead of the number with x.', 'Circle the x term first: the slope is the number in front of x, once y is alone.'],
        sign: ['Loses the sign when moving the x term to the other side.', 'Write the step out: 14x − 18y = 72 → −18y = −14x + 72.'],
        recip: ['Divides the wrong way (B/A instead of −A/B).', 'Get y alone: divide everything by the number in front of y.'],
        zero: ['Mixes up y = c (flat, 0) and x = c (vertical, undefined).', 'y = 16: every point has y 16, a flat line. x = 5: every point has x 5, a vertical line.'],
        other: ['Slips while solving for y.', 'Solve for y one step at a time, writing each step.']
      })[err] || ['', ''];
    },
    keyHTML: `<div class="gk"><div>y = <b>m</b>x + b: slope m</div><div>Ax + By = C → y = <span class="frs">−<span class="fr"><span>A</span><span>B</span></span></span>x + …</div><div>y = c: 0 · x = c: undefined</div></div>`
  });
})();
