// Find b (G6) — a slope and a point → where the line crosses the y-axis: b = y − m·x.
// The picture: the slope triangle from (0, b) to the point (run x, rise m·x), so b is the point's y minus that rise.
// Spec: specs/geometry-lines.md (G6). Uses lib/grid.js, lib/frac.js, lib/lines.js.
(function () {
  const F = Frac, G = Grid, L = Lines, { r, any } = L;
  const nz = (a, b) => { let v = 0; while (v === 0) v = r(a, b); return v; };
  // a number for display: decimals stay decimals (−8.5), other fractions as fractions (−1/3)
  const show = f => f.d === 1 ? L.neg(f.n) : [2, 4, 5, 10].includes(f.d) ? L.neg(String(f.n / f.d)) : F.text(f);
  const pt = p => `(${show(p[0])}, ${show(p[1])})`;
  // an item: { m, p: [x, y] } (fractions); b = y − m·x
  const B = it => F.sub(it.p[1], F.mul(it.m, it.p[0]));
  const onGrid = it => [it.p[0], it.p[1], B(it)].every(v => v.d === 1 && Math.abs(v.n) <= 6) && F.mul(it.m, it.p[0]).d === 1;
  const mk = (idea, f) => ({ idea, make: f });
  // a line through a grid point with slope m whose b is a small whole number
  function gridItem(m, neg) {
    for (let k = 0; k < 200; k++) {
      const x = m.d * nz(-3, 3), bb = r(-4, 4), y = F.add(F.mul(m, F.of(x)), F.of(bb));
      if ((!neg || x < 0) && Math.abs(x) <= 6 && y.d === 1 && Math.abs(y.n) <= 6) return { m, p: [F.of(x), y] };
    }
    return { m, p: [F.of(2), F.add(F.mul(m, F.of(2)), F.of(1))] };
  }
  const work = it => {
    const m = it.m, x = it.p[0], y = it.p[1], mx = F.mul(m, x);
    const xs = x.n < 0 ? `(${show(x)})` : show(x);
    return `b = y − m·x = ${show(y)} − ${F.text(m).replace(/^−(.*)$/, '(−$1)')}·${xs} = ${show(y)} − ${mx.n < 0 ? `(${show(mx)})` : show(mx)} = ${show(B(it))}`;
  };
  function picture(host, it, labels) {
    const g = G.make(host), b = [0, B(it).n], p = [it.p[0].n, it.p[1].n];
    g.line(b, p); g.dot(p, 'pt', pt(it.p)); g.dot(b, 'pt ok', `(0, ${L.neg(b[1])})`);
    g.triangle(b, p, { labels, words: false });
    return g;
  }

  Apparatus.define({
    id: 'geo-find-b',
    title: 'Find b',
    ideas: {
      grid:  { name: 'On the grid', easy: ['grid'], hard: ['grid-neg'] },
      signs: { name: 'Negative slopes and points', easy: ['neg-m'], hard: ['neg-both', 'big'] },
      frac:  { name: 'Fraction slopes, decimals', easy: ['frac-m'], hard: ['frac-m', 'decimal'] }
    },
    kinds: {
      'grid':     mk('grid', () => gridItem(F.of(any([1, 2, 3])), false)),
      'grid-neg': mk('grid', () => gridItem(F.of(any([1, 2, -1, -2])), true)),
      'neg-m':    mk('signs', () => ({ m: F.of(-any([2, 3, 4])), p: [F.of(r(2, 6)), F.of(nz(-9, 9))] })),
      'neg-both': mk('signs', () => ({ m: F.of(-any([1, 2, 3])), p: [F.of(-r(2, 6)), F.of(nz(-12, 12))] })),
      'big':      mk('signs', () => ({ m: F.of(nz(-5, 5)), p: [F.of(r(-12, 15)), F.of(r(-25, 25))] })),
      'frac-m':   mk('frac', () => { const m = F.of(any([1, -1, 2, -3]), any([2, 3, 4, 5])); return { m, p: [F.of(m.d * nz(-3, 3)), F.of(nz(-9, 9))] }; }),
      'decimal':  mk('frac', () => { const m = F.of(any([3, -3, 1]), 4); return { m, p: [F.of(4 * r(2, 6) + 2), F.fromDec(nz(-9, 9) + 0.5)] }; })
    },
    opening: [
      { kind: 'grid', item: { m: F.of(1, 2), p: [F.of(4), F.of(3)] } },
      { kind: 'neg-both', item: { m: F.of(-1, 4), p: [F.of(-4), F.of(-9)] } }
    ],
    nextOnRight: true,
    text: it => `slope ${F.text(it.m)} through ${pt(it.p)}`,
    speak: it => `A line with slope ${F.text(it.m)} goes through ${pt(it.p)}. What is b?`,
    ask(el, it, submit, ctx) {
      el.innerHTML = `<div class="gq">${onGrid(it) ? '<div class="gridbox"></div>' : ''}<div class="q">${L.term(it.m, 'x', true) ? `y = ${L.term(it.m, 'x', true)} + ` : 'y = '}${F.box('b')}</div>
        <div class="q small">through ${pt(it.p)}</div><p class="say" aria-live="polite"></p><button type="button" class="go">Check</button><div class="work" aria-live="polite"></div></div>`;
      if (onGrid(it)) { const g = G.make(el.querySelector('.gridbox')); g.line([0, B(it).n], [it.p[0].n, it.p[1].n], 'ln faint'); g.dot([it.p[0].n, it.p[1].n], 'pt', pt(it.p)); if (ctx.mode === 'open') picture(el.querySelector('.gridbox'), it, true); }
      el._f = F.wire(el, { want: () => B(it), onSubmit: v => submit(v.b) });
    },
    correct: it => F.text(B(it)),
    isRight: (it, a) => F.eq(a.v, B(it)),
    classify(it, a) {
      const v = a.v, mx = F.mul(it.m, it.p[0]);
      if (F.eq(v, F.add(it.p[1], mx))) return 'sign';
      if (F.eq(v, F.sub(it.p[1], it.m))) return 'mx';
      if (F.eq(v, F.sub(it.p[0], F.mul(it.m, it.p[1])))) return 'xy';
      return 'other';
    },
    feedback(it, w, a, kind, err) {
      const wk = work(it);
      if (err === 'sign') return ['work', `Take m·x away from y (don’t add it): ${wk}.`];
      if (err === 'mx') return ['work', `Multiply the slope by x first: ${wk}.`];
      if (err === 'xy') return ['work', `Use the point’s y, take away m times its x: ${wk}.`];
      return ['work', `${wk}.`];
    },
    reveal(el, it, a, o) {
      el._f && el._f.mark('b', o.right);
      if (o.right) return;
      el.querySelector('.work').textContent = work(it);
      if (onGrid(it)) picture(el.querySelector('.gridbox'), it, true);
    },
    errors: { sign: 'added m·x instead of subtracting', mx: 'forgot to multiply by x', xy: 'mixed up x and y', other: 'arithmetic' },
    diagnose(err) {
      return ({
        sign: ['Adds m·x instead of taking it away (or loses a sign).', 'Start from y = mx + b with the point plugged in, then move m·x across: b = y − m·x.'],
        mx: ['Subtracts the slope itself instead of slope times x.', 'Write m·x out first as its own number.'],
        xy: ['Swaps the point’s x and y.', 'Label the point (x, y) before plugging in.'],
        other: ['Slips with negatives or fractions.', 'Work out m·x on its own line, with brackets around negatives.']
      })[err] || ['', ''];
    },
    get keyHTML() {
      const host = document.createElement('div');
      picture(host, { m: F.of(1, 2), p: [F.of(4), F.of(3)] }, true);
      return `<div class="gk"><div class="gridbox">${host.innerHTML}</div><div>b = y − m·x</div></div>`;
    }
  });
})();
