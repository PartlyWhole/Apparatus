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
  window.Lines = { r, any, neg, term, constant, si, siRev, std, fit };
})();
