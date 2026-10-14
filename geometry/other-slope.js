// The Other Slope (G5) — given a slope (or a line), write the parallel slope and the perpendicular slope.
// The picture after a miss, and the tutorial: the slope triangle turns 90° — rise and run swap, one sign flips.
// Spec: specs/geometry-lines.md (G5). Uses lib/grid.js, lib/frac.js, lib/lines.js.
(function () {
  const F = Frac, G = Grid, L = Lines, { r, any } = L;
  const nz = (a, b) => { let v = 0; while (v === 0) v = r(a, b); return v; };
  // an item: { m, b?, from: 'slope' | 'line' }
  const mk = (idea, pool, from) => ({ idea, make: () => ({ m: pool === 'zero' ? F.of(0) : pool === 'undef' ? F.UNDEF : F.of(...any(pool)), b: F.of(nz(-6, 6)), from }) });
  const WHOLE = [[2], [3], [4], [5]], NEGW = [[-2], [-3], [-4]], FR = [[1, 2], [2, 3], [2, 5], [3, 4]], NEGF = [[-1, 4], [-2, 3], [-1, 2], [-3, 5]];
  const given = it => it.from === 'line' ? (it.m.undef ? `x = ${L.neg(it.b.n)}` : L.si(it.m, it.b)) : `slope ${F.html(it.m)}`;
  const plain = h => h.replace(/<span class="fr"><span>(\d+)<\/span><span>(\d+)<\/span><\/span>/g, '$1/$2').replace(/<[^>]+>/g, '');

  // the turn: the slope triangle for m, and a copy that turns 90° about its corner
  function turnPicture(host, m, after) {
    const g = G.make(host, { min: -5, max: 5 });
    if (m.undef || m.n === 0) {
      // flat ↔ vertical: a copy of the line turns upright (or flat)
      const dir = m.undef ? [0, 1] : [1, 0];
      g.line([0, 0], dir, 'ln'); const v = g.line([0, 0], dir, 'ln b');
      setTimeout(() => g.turn(v, [0, 0], after), 400);
      return g;
    }
    const run = m.d, rise = m.n, p = [0, 0], q = [run, rise];
    g.line(p, q, 'ln'); g.triangle(p, q, { labels: true });
    const t2 = g.el('g', {}); const ln = g.line(p, q, 'ln b'); t2.appendChild(ln);
    const tri = g.triangle(p, q, { labels: false, cls: 'turned' }); t2.appendChild(tri);
    setTimeout(() => g.turn(t2, p, () => {
      // the turned triangle, redrawn run-then-rise and labelled: run −rise, rise run
      tri.remove(); g.triangle(p, [-rise, run], { labels: true, cls: 'turned' }); after && after();
    }), 400);
    return g;
  }

  Apparatus.define({
    id: 'geo-other-slope',
    title: 'The Other Slope',
    ideas: {
      whole:   { name: 'Whole-number slopes (3 → −⅓)', easy: ['whole'], hard: ['neg-whole', 'line-whole'] },
      frac:    { name: 'Fraction slopes (−¼ → 4)', easy: ['frac'], hard: ['neg-frac', 'line-frac'] },
      special: { name: '0 and undefined', easy: ['zero'], hard: ['zero', 'undef'], late: true }
    },
    kinds: {
      whole: mk('whole', WHOLE, 'slope'), 'neg-whole': mk('whole', NEGW, 'slope'), 'line-whole': mk('whole', WHOLE.concat(NEGW), 'line'),
      frac: mk('frac', FR, 'slope'), 'neg-frac': mk('frac', NEGF, 'slope'), 'line-frac': mk('frac', FR.concat(NEGF), 'line'),
      zero: mk('special', 'zero', 'line'), undef: mk('special', 'undef', 'line')
    },
    opening: [{ kind: 'whole', item: { m: F.of(2), b: F.of(1), from: 'slope' } }, { kind: 'neg-frac', item: { m: F.of(-1, 4), b: F.of(1), from: 'slope' } }],
    nextOnRight: true,
    text: it => plain(given(it)),
    speak: it => `${plain(given(it))}. Write the parallel slope and the perpendicular slope.`,
    ask(el, it, submit) {
      el.innerHTML = `<div class="gq"><div class="q">${given(it)}</div>
        <div class="q two"><span><b class="sym">∥</b> ${F.box('par', { undef: true })}</span><span><b class="sym">⟂</b> ${F.box('perp', { undef: true })}</span></div>
        <p class="say" aria-live="polite"></p><button type="button" class="go">Check</button><div class="gridbox pic"></div></div>`;
      el._f = F.wire(el, { want: n => n === 'par' ? it.m : F.perp(it.m), onSubmit: submit });
    },
    correct: it => `${F.text(it.m)} | ${F.text(F.perp(it.m))}`,
    isRight: (it, a) => F.eq(a.par.v, it.m) && F.eq(a.perp.v, F.perp(it.m)),
    classify(it, a) {
      const m = it.m, p = a.perp.v;
      if (!F.eq(a.par.v, m)) return 'par';
      if (m.undef || m.n === 0) return 'flat';
      if (F.eq(p, F.neg(m))) return 'sign-only';
      if (F.eq(p, F.recip(m))) return 'flip-only';
      if (F.eq(p, m)) return 'same';
      return 'other';
    },
    feedback(it, w, a, kind, err) {
      const m = it.m, s = F.text(m), p = F.text(F.perp(m));
      if (err === 'par') return ['pic', `Parallel lines have the same slope: ${s}.`];
      if (err === 'flat') return ['pic', m.undef ? 'Perpendicular to a vertical line is a flat line: slope 0.' : 'Perpendicular to a flat line is a vertical line: undefined.'];
      if (err === 'sign-only') return ['pic', `Turned 90°, rise and run swap too: perpendicular to ${s} is ${p}.`];
      if (err === 'flip-only') return ['pic', `Flip and change the sign: perpendicular to ${s} is ${p}.`];
      if (err === 'same') return ['pic', `The same slope is parallel. Perpendicular flips and changes sign: ${p}.`];
      return ['pic', `Flip and change the sign: perpendicular to ${s} is ${p}.`];
    },
    revealMs: 1300,
    reveal(el, it, a, o) {
      const f = el._f; f && f.mark('par', F.eq(a.par.v, it.m)); f && f.mark('perp', F.eq(a.perp.v, F.perp(it.m)));
      if (!o.right) turnPicture(el.querySelector('.pic'), it.m);
    },
    errors: { par: 'parallel slope wrong', 'sign-only': 'only changed the sign', 'flip-only': 'only flipped', same: 'kept the same slope', flat: '0 ↔ undefined', other: 'other' },
    diagnose(err) {
      return ({
        par: ['Changes the slope for a parallel line.', 'Parallel lines have the same steepness: same slope, no change.'],
        'sign-only': ['Only changes the sign.', 'Turn the slope triangle 90°: rise and run swap AND one sign changes. Check: the slopes multiply to −1.'],
        'flip-only': ['Only flips the fraction.', 'Flip AND change the sign. Check: the slopes multiply to −1.'],
        same: ['Uses the same slope for perpendicular.', 'Same slope is parallel; perpendicular is the negative reciprocal.'],
        flat: ['Mixes up 0 and undefined.', 'Perpendicular to a flat line (0) is vertical (undefined), and the other way around.'],
        other: ['Slips with the fraction or the sign.', 'Write the slope as a fraction first (3 = 3/1), then flip it and change the sign.']
      })[err] || ['', ''];
    },
    keyHTML: `<div class="gk"><div>∥ same slope · ⟂ flip and change sign</div><div>2 → −<span class="frs"><span class="fr"><span>1</span><span>2</span></span></span> · −<span class="frs"><span class="fr"><span>1</span><span>4</span></span></span> → 4 · 0 → undefined</div></div>`,

    // ---- tutorial: watch the slope triangle turn 90° ----
    tutorial(stage, api) {
      api.step(0, 1); api.caption('');
      stage.innerHTML = `<div class="gq"><div class="q">slope 2</div><div class="gridbox pic"></div><div class="tbtns"><button type="button" class="tb wide">Turn 90°</button></div></div>`;
      const host = stage.querySelector('.pic'), b = stage.querySelector('.tb');
      const g0 = G.make(host, { min: -5, max: 5 }); g0.line([0, 0], [1, 2]); g0.triangle([0, 0], [1, 2], { labels: true });
      b.addEventListener('click', () => {
        if (!api.alive()) return;
        b.disabled = true;
        turnPicture(host, F.of(2), () => {
          api.caption('Turned 90°: rise and run swap, and one sign flips. Perpendicular to 2 is −½.');
          b.textContent = '›'; b.disabled = false; b.setAttribute('aria-label', 'Next');
          b.addEventListener('click', () => { if (api.alive()) { api.step(1, 1); api.done(); } }, { once: true });
        });
      }, { once: true });
    }
  });
})();
