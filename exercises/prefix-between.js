// Between Prefixes — two units, neither the base (1 cm = ? µm): as a power of ten, as a number, or both.
// Spec: specs/prefixes.md (3). Uses lib/prefix.js, lib/forms.js.
(function () {
  const { any } = Apparatus.util, F = Forms, X = Prefix;
  // pairs [bigger, smaller] of non-base powers, 2–6 places apart; the ones across a gap (k–M, m–µ) are tricky
  const NEAR = [[2, -1], [1, -2], [-1, -3], [3, 1], [2, -2]];
  const FAR = [[-2, -6], [3, -2], [3, -3], [6, 3], [-3, -6], [6, 2]];
  // an item: { b, a: power of the "1" unit, t: power of the answer's unit, how: 'pow' | 'num' | 'both' }
  const mk = (dir, pool, how) => ({ idea: dir, make: () => { const [big, small] = any(pool); const b = any(X.BASES); return dir === 'down' ? { b, a: big, t: small, how } : { b, a: small, t: big, how }; } });
  const K = it => it.a - it.t;

  function question(it) {
    const A = X.unit(it.a, it.b), B = X.unit(it.t, it.b);
    const pow = `${F.pow('power')} ${B}`, num = `${F.num('number', true)} ${B}`;
    const rhs = it.how === 'pow' ? pow : it.how === 'num' ? num : `${pow} <span class="eqs">=</span> ${num}`;
    return `<div class="fq">${X.lineHTML(it.b, [it.a, it.t])}<div class="q">1 ${A} = ${rhs}</div>
      <button type="button" class="go">Check</button><div class="ans" aria-live="polite"></div></div>`;
  }

  Apparatus.define({
    id: 'prefix-between',
    title: 'Between Prefixes',
    ideas: {
      down: { name: '1 bigger = ? smaller (10ⁿ)', easy: ['d-near-pow'], hard: ['d-far-pow', 'd-far-num', 'd-far-both'] },
      up:   { name: '1 smaller = ? bigger (10⁻ⁿ)', easy: ['u-near-pow'], hard: ['u-far-pow', 'u-far-num', 'u-far-both'] }
    },
    kinds: {
      'd-near-pow': mk('down', NEAR, 'pow'), 'd-far-pow': mk('down', FAR, 'pow'), 'd-far-num': mk('down', FAR, 'num'), 'd-far-both': mk('down', FAR, 'both'),
      'u-near-pow': mk('up', NEAR, 'pow'), 'u-far-pow': mk('up', FAR, 'pow'), 'u-far-num': mk('up', FAR, 'num'), 'u-far-both': mk('up', FAR, 'both')
    },
    opening: [{ kind: 'd-far-both', item: { b: 'm', a: -2, t: -6, how: 'both' } }],
    defaults: { tricky: 3 },
    nextOnRight: true,
    text: it => `1 ${X.unit(it.a, it.b)} = ? ${X.unit(it.t, it.b)} (${it.how === 'both' ? 'power and number' : it.how === 'pow' ? 'power' : 'number'})`,
    speak: it => `1 ${X.unit(it.a, it.b)} equals how many ${X.unit(it.t, it.b)}?`,
    ask(el, it, submit) { el.innerHTML = question(it); el._form = F.wire(el, submit); },
    correct: it => K(it),
    isRight: (it, v) => (v.power === undefined || v.power === K(it)) && (v.number === undefined || F.powerOf(v.number) === K(it)),
    classify(it, v) {
      if (v.power !== undefined && v.power !== K(it)) return X.powerError(K(it), v.power);
      return X.powerError(K(it), F.powerOf(v.number));
    },
    feedback: (it, want, v, kind, err) => ['line', X.sentence(err, X.unit(it.a, it.b), X.unit(it.t, it.b), K(it))],
    revealMs: 1400,
    reveal(el, it, v, o) {
      el._form && el._form.mark(o.right);
      if (o.right) return;
      const ans = el.querySelector('.ans'), k = K(it);
      X.hops(el.querySelector('.pline'), it.a, it.t, k > 0 ? '×10' : '÷10', () => {
        ans.innerHTML = `1 ${X.unit(it.a, it.b)} = 10<sup>${k < 0 ? '−' + -k : k}</sup> = ${X.powerVal(k)} ${X.unit(it.t, it.b)}`;
      });
    },
    errors: { dir: 'the wrong way (big ↔ small)', count: 'wrong number of places', other: 'not a power of ten' },
    diagnose: err => X.DIAG[err] || ['', ''],
    cheat: X.cheatHTML('Count the places between the two prefixes. cm (10<sup>−2</sup>) to µm (10<sup>−6</sup>) is 4 places: 1 cm = 10<sup>4</sup> µm = 10,000 µm.')
  });
})();
