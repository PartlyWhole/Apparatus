// Lines — writing equations (y = mx + b, Ax + By = C, y = c, x = c) and making lines that fit the grid.
// Needs frac.js. Spec: specs/geometry-lines.md.
(function () {
  const F = window.Frac;
  const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const any = a => a[Math.floor(Math.random() * a.length)];
  const neg = s => String(s).replace('-', '−');

  // "−3x", "+ ½x", "x"; first term: no "+", sign stuck to it; later terms: "+ 3x" / "− 3x"
  function term(m, v, first) {
    if (m.n === 0) return '';
    const sign = m.n < 0 ? '−' : first ? '' : '+', mag = F.of(Math.abs(m.n), m.d);
    const body = mag.n === 1 && mag.d === 1 ? '' : F.html(mag);
    return first ? `${sign}${body}${v}` : `${sign} ${body}${v}`;
  }
  function constant(b, first) {
    if (b.n === 0) return first ? '0' : '';
    const sign = b.n < 0 ? '−' : first ? '' : '+', mag = F.html(F.of(Math.abs(b.n), b.d));
    return first ? `${sign}${mag}` : `${sign} ${mag}`;
  }
  // y = mx + b
  function si(m, b) {
    if (m.undef) return 'x = ?';
    const t = term(m, 'x', true), c = constant(b, !t);
    return `y = ${[t, c].filter(Boolean).join(' ')}`;
  }
  // y = b + mx ("y = 4 − 3x")
  function siRev(m, b) { const c = constant(b, true), t = term(m, 'x', false); return `y = ${[c, t].filter(Boolean).join(' ')}`; }
  // Ax + By = C (A, B, C fractions)
  function std(A, B, C) { const t1 = term(A, 'x', true), t2 = term(B, 'y', !t1); return `${[t1, t2].filter(Boolean).join(' ')} = ${constant(C, true)}`; }

  // a lattice point p and a direction (run, rise) whose line crosses the grid (−6..6) at p − d, p, p + d
  function fit(run, rise, lim = 5) {
    for (let k = 0; k < 200; k++) {
      const p = [r(-3, 3), r(-3, 3)], a = [p[0] - run, p[1] - rise], b = [p[0] + run, p[1] + rise];
      if ([a, b].every(q => Math.abs(q[0]) <= lim && Math.abs(q[1]) <= lim)) return p;
    }
    return [0, 0];
  }
  // html → plain text: fractions as 3/4, tags dropped
  const plain = h => h.replace(/<span class="fr"><span>(\d+)<\/span><span>(\d+)<\/span><\/span>/g, '$1/$2').replace(/<[^>]+>/g, '');

  // a given line, in any of its forms:
  //   { form: 'si', m, b } · { form: 'std', A, B, C } · { form: 'h', c } · { form: 'v', c }   (fractions)
  //   { form: 'pts', a: [x, y], b: [x, y], names?: ['A', 'B'] }   the line through two points (whole numbers)
  //   { form: 'graph', a: [x, y], b: [x, y] }                     drawn on a grid through two lattice points (not marked)
  // Lines.given.slope(g) → fraction (F.UNDEF for vertical) · .html(g) · .plain(g)
  const show = f => f.d === 1 ? neg(f.n) : F.text(f);
  const P = (n, p) => `${n}(${neg(p[0])}, ${neg(p[1])})`;
  const given = {
    slope: g => g.form === 'si' ? g.m : g.form === 'std' ? F.of(-g.A.n * g.B.d, g.A.d * g.B.n) : g.form === 'h' ? F.of(0) : g.form === 'v' ? F.UNDEF
      : F.of(g.b[1] - g.a[1], g.b[0] - g.a[0]),
    html: g => g.form === 'si' ? si(g.m, g.b) : g.form === 'std' ? std(g.A, g.B, g.C) : g.form === 'h' ? `y = ${show(g.c)}` : g.form === 'v' ? `x = ${show(g.c)}`
      : g.form === 'pts' ? `the line through ${P((g.names || 'AB')[0], g.a)} and ${P((g.names || 'AB')[1], g.b)}` : 'the line on the grid',
    plain: g => plain(given.html(g))
  };
  window.Lines = { r, any, neg, term, constant, si, siRev, std, fit, plain, given };
})();
