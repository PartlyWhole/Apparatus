// Slope from Two Points (G2) — Δy over Δx, subtracting in the same order; points on the grid first, then numbers only.
// Spec: specs/geometry-lines.md (G2). Uses lib/grid.js, lib/frac.js, lib/lines.js.
(function () {
  const F = Frac, G = Grid, L = Lines, { r, any } = L;
  // an item: { a: [x1, y1], b: [x2, y2] }
  const mk = (idea, f) => ({ idea, make: f });
  const slope = it => F.of(it.b[1] - it.a[1], it.b[0] - it.a[0]);
  const onGrid = it => [it.a, it.b].every(p => Math.abs(p[0]) <= 6 && Math.abs(p[1]) <= 6);
  const pt = p => `(${G.sgn(p[0])}, ${G.sgn(p[1])})`;
  const dir = it => [it.b[0] - it.a[0], it.b[1] - it.a[1]];
  const paren = n => n < 0 ? `(${G.sgn(n)})` : String(n);
  // the work: (y₂ − y₁) / (x₂ − x₁) = Δy / Δx = slope
  function work(it) {
    const dy = it.b[1] - it.a[1], dx = it.b[0] - it.a[0], m = slope(it);
    const raw = `${G.sgn(dy)}/${G.sgn(dx)}`;
    return `(${G.sgn(it.b[1])} − ${paren(it.a[1])}) / (${G.sgn(it.b[0])} − ${paren(it.a[0])}) = ${raw}${dx === 0 ? '' : F.text(m) !== raw ? ` = ${F.text(m)}` : ''}${dx === 0 ? ': undefined' : ''}`;
  }
  // a pair of points on the grid with a given direction
  const gridPair = (run, rise) => { const p = L.fit(run, rise, 6); return { a: p, b: [p[0] + run, p[1] + rise] }; };

  Apparatus.define({
    id: 'geo-two-points',
    title: 'Slope from Two Points',
    ideas: {
      grid:    { name: 'Points on the grid', easy: ['grid-up'], hard: ['grid-down'] },
      numbers: { name: 'Numbers only (with negatives)', easy: ['big'], hard: ['big', 'negs'] },
      special: { name: 'Same x or same y', easy: ['flat'], hard: ['flat', 'vertical'], late: true }
    },
    kinds: {
      'grid-up':   mk('grid', () => gridPair(any([1, 2, 3]), any([1, 2, 3]))),
      'grid-down': mk('grid', () => gridPair(any([1, 2, 3]), -any([1, 2, 3]))),
      'big':       mk('numbers', () => { const a = [r(1, 6), r(-5, -2)], dx = any([1, 2]), m = any([2, 3, -2, -1]); return { a, b: [a[0] + dx, a[1] + m * dx] }; }),
      'negs':      mk('numbers', () => { const a = [-r(1, 5), -r(1, 6)], dx = any([2, 3, 4]), dy = any([-1, 1, -2, 2, 3]); return { a, b: [a[0] + dx, a[1] + dy] }; }),
      'flat':      mk('special', () => { const a = [r(-8, -1), r(-9, 9)]; return { a, b: [r(1, 9), a[1]] }; }),
      'vertical':  mk('special', () => { const a = [r(-9, 9), r(-9, -1)]; return { a, b: [a[0], r(1, 9)] }; })
    },
    opening: [{ kind: 'grid-up', item: { a: [-2, -1], b: [2, 2] } }, { kind: 'negs', item: { a: [-3, -5], b: [1, -2] } }],
    nextOnRight: true,
    defaults: { fix: 1 },
    text: it => `A${pt(it.a)} and B${pt(it.b)}`,
    speak: it => `The points ${pt(it.a)} and ${pt(it.b)}. What is the slope?`,
    ask(el, it, submit) {
      el.innerHTML = `<div class="gq">${onGrid(it) ? '<div class="gridbox"></div>' : `<div class="q two"><span>A${pt(it.a)}</span><span>B${pt(it.b)}</span></div>`}
        <div class="q">slope = ${F.box('slope')}</div><p class="say" aria-live="polite"></p><button type="button" class="go">Check</button><div class="work" aria-live="polite"></div></div>`;
      if (onGrid(it)) { const g = G.make(el.querySelector('.gridbox')); g.line(it.a, it.b, 'ln faint'); g.dot(it.a, 'pt', 'A' + pt(it.a), dir(it)); g.dot(it.b, 'pt', 'B' + pt(it.b), dir(it)); el._g = g; }
      el._f = F.wire(el, { want: () => slope(it), onSubmit: v => submit(v.slope) });
    },
    correct: it => F.text(slope(it)),
    isRight: (it, a) => F.eq(a.v, slope(it)),
    classify(it, a) {
      const m = slope(it), v = a.v;
      if ((m.undef && !v.undef && v.n === 0) || (!m.undef && m.n === 0 && v.undef)) return 'zero';
      if (!m.undef && !v.undef && F.eq(v, F.neg(m)) && m.n !== 0) return 'order';
      if (!m.undef && !v.undef && m.n !== 0 && (F.eq(v, F.recip(m)) || F.eq(v, F.neg(F.recip(m))))) return 'swap';
      return 'other';
    },
    feedback(it, want, a, kind, err) {
      const w = work(it);
      if (err === 'order') return ['work', `Subtract in the same order on top and bottom: ${w}.`];
      if (err === 'swap') return ['work', `The change in y goes on top: ${w}.`];
      if (err === 'zero') return ['work', slope(it).undef ? `The x’s are the same, so you’d divide by 0: undefined.` : `The y’s are the same, so the rise is 0: slope 0.`];
      return ['work', `${w}.`];
    },
    reveal(el, it, a, o) {
      el._f && el._f.mark('slope', o.right);
      if (o.right) return;
      el.querySelector('.work').textContent = work(it);
      if (el._g) el._g.triangle(it.a, it.b, { labels: true, words: true });
    },
    errors: { order: 'subtracted in mixed order (sign)', swap: 'Δx over Δy', zero: 'flat ↔ vertical mixed up', other: 'arithmetic' },
    diagnose(err) {
      return ({
        order: ['Subtracts the points in a different order on top and bottom, which flips the sign.', 'Label the points 1 and 2 first; take “2 minus 1” on top and on the bottom.'],
        swap: ['Puts the change in x on top.', 'Slope is rise over run: the y’s on top.'],
        zero: ['Mixes up same-y (0) and same-x (undefined).', 'Same y: no rise, slope 0. Same x: no run, can’t divide by 0.'],
        other: ['Slips with negatives when subtracting (−2 − (−5)).', 'Rewrite “minus a negative” as plus before working it out.']
      })[err] || ['', ''];
    },
    keyHTML: `<div class="gk"><div>slope = <span class="frs"><span class="fr"><span>y₂ − y₁</span><span>x₂ − x₁</span></span></span></div><div>same order, top and bottom</div></div>`
  });
})();
