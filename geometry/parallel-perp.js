// Parallel and Perpendicular (G4 + G5) — one progression: first write the other slopes (∥ and ⟂) for a slope or a line,
// then pick parallel, perpendicular or neither for two lines; true/false facts come last as the twist.
// The tutorial and the picture after a miss: the slope triangle turns 90° — rise and run swap, one sign flips.
// Replaces relation.js and other-slope.js (left on disk, unlinked). Spec: specs/geometry-lines.md (G4, G5).
// Uses lib/grid.js, lib/frac.js, lib/lines.js.
(function () {
  const F = Frac, G = Grid, L = Lines, { r, any } = L;
  const nz = (a, b) => { let v = 0; while (v === 0) v = r(a, b); return v; };
  const plain = h => h.replace(/<span class="fr"><span>(\d+)<\/span><span>(\d+)<\/span><\/span>/g, '$1/$2').replace(/<[^>]+>/g, '');
  const eq = (m, b) => m.undef ? `x = ${L.neg(b.n)}` : L.si(m, b);

  // ---- items ----
  // { kind: 'slope', m, b, from: 'slope' | 'line' }  write the parallel and perpendicular slopes
  // { kind: 'lines', m1, m2, b1, b2, rel, trap? }    parallel, perpendicular or neither (m can be UNDEF (x = c) or 0 (y = c))
  // { kind: 'fact', i }                               true or false
  const NEGW = [[-2], [-3], [-4]], FR = [[1, 2], [2, 3], [3, 4]], NEGF = [[-1, 4], [-2, 3], [-1, 3]];
  const SL = [[2], [3], [-2], [1, 2], [-1, 3], [2, 3], [-3, 4], [3, 2]];
  const slope = (pool, from) => () => ({ kind: 'slope', m: pool === 'undef' ? F.UNDEF : F.of(...any(pool)), b: F.of(nz(-5, 5)), from });
  function pair(rel) {
    if (rel === 'hv') return { kind: 'lines', m1: F.of(0), m2: F.UNDEF, b1: F.of(nz(-4, 4)), b2: F.of(nz(-4, 4)), rel: 'perp', trap: 'hv' };
    if (rel === 'none') rel = any(['opp', 'recip']);
    const m = F.of(...any(SL));
    const m2 = rel === 'par' ? m : rel === 'perp' ? F.perp(m) : rel === 'opp' ? F.neg(m) : F.recip(m);
    let b1 = nz(-4, 4), b2 = nz(-4, 4); if (rel === 'par' && b1 === b2) b2 = -b1;
    return { kind: 'lines', m1: m, m2, b1: F.of(b1), b2: F.of(b2), rel: rel === 'opp' || rel === 'recip' ? 'none' : rel, trap: rel };
  }
  const FACTS = [
    ['Parallel lines intersect exactly once.', 'F', 'Parallel lines never meet.'],
    ['Perpendicular lines intersect at a 90° angle.', 'T', 'That’s what perpendicular means.'],
    ['Perpendicular lines have equal slopes.', 'F', 'Equal slopes are parallel. Perpendicular slopes flip and change sign (2 and −½).'],
    ['Parallel lines have equal slopes.', 'T', 'Same steepness, never meeting.'],
    ['A horizontal line and a vertical line are perpendicular.', 'T', 'They meet at a right angle.'],
    ['Two vertical lines are perpendicular.', 'F', 'Two vertical lines are parallel.'],
    ['Perpendicular slopes multiply to −1.', 'T', '2 × (−½) = −1.']
  ];
  let lastFact = -1;
  const fact = () => { let i; do i = r(0, FACTS.length - 1); while (i === lastFact); lastFact = i; return { kind: 'fact', i }; };
  const CHOICES = { lines: [['par', 'Parallel'], ['perp', 'Perpendicular'], ['none', 'Neither']], fact: [['T', 'True'], ['F', 'False']] };
  const want = it => it.kind === 'fact' ? FACTS[it.i][1] : it.kind === 'lines' ? it.rel : `${F.text(it.m)} | ${F.text(F.perp(it.m))}`;
  const given = it => it.from === 'line' ? eq(it.m, it.b) : `slope ${F.html(it.m)}`;
  const mk = (idea, make) => ({ idea, make });

  // ---- pictures ----
  // the turn: the slope triangle for m, and a copy that turns 90° about its corner (flat ↔ vertical: the line itself turns)
  function turnPicture(host, m, after) {
    const g = G.make(host, { min: -5, max: 5 });
    if (m.undef || m.n === 0) {
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
  // two lines: both drawn, a slope triangle on the first; for perpendicular, the triangle turns 90° onto the second
  function linesPicture(host, it) {
    const g = G.make(host);
    const draw = (m, b, cls) => m.undef ? g.line([b.n, 0], [b.n, 1], cls) : g.line([0, b.n / b.d], [m.d, b.n / b.d + m.n], cls);
    draw(it.m1, it.b1, 'ln'); draw(it.m2, it.b2, 'ln b');
    if (it.m1.undef || it.m1.n === 0) return;
    const p = [0, it.b1.n], q = [it.m1.d, it.b1.n + it.m1.n];
    g.triangle(p, q, { labels: true });
    if (it.rel === 'perp') { const t2 = g.triangle(p, q, { labels: false, cls: 'turned' }); setTimeout(() => g.turn(t2, p, () => { t2.remove(); g.triangle(p, [p[0] - it.m1.n, p[1] + it.m1.d], { labels: true, cls: 'turned' }); }), 500); }
  }

  // ---- the two answer areas ----
  function askSlope(el, it, submit) {
    el.innerHTML = `<div class="gq"><div class="q">${given(it)}</div>
      <div class="q two"><span class="col"><span class="rl"><b class="sym">∥</b> parallel</span>${F.box('par')}</span><span class="col"><span class="rl"><b class="sym">⟂</b> perpendicular</span>${F.box('perp')}</span></div>
      <p class="say" aria-live="polite"></p><button type="button" class="go">Check</button><div class="gridbox pic"></div></div>`;
    el._f = F.wire(el, { want: n => n === 'par' ? it.m : F.perp(it.m), onSubmit: submit });
  }
  function askPick(el, it, submit) {
    const ch = CHOICES[it.kind];
    el.innerHTML = `<div class="gq">${it.kind === 'fact' ? `<div class="q fact">${FACTS[it.i][0]}</div>` : `<div class="eqs"><span>${eq(it.m1, it.b1)}</span><span class="l2">${eq(it.m2, it.b2)}</span></div>`}
      <div class="gmc" style="--k:${ch.length}">${ch.map(([id, t]) => `<button type="button" data-a="${id}">${t}</button>`).join('')}</div><div class="gridbox pic"></div></div>`;
    const btns = Array.from(el.querySelectorAll('.gmc button'));
    const send = a => { document.removeEventListener('keydown', keys); btns.forEach(b => { b.disabled = true; }); submit(a); };
    const keys = e => { const i = +e.key - 1; if (i >= 0 && i < btns.length && el.isConnected) { e.preventDefault(); send(btns[i].dataset.a); } };
    btns.forEach(b => b.addEventListener('click', () => send(b.dataset.a)));
    document.addEventListener('keydown', keys);
  }

  // ---- feedback: one sentence on why the picked answer is wrong ----
  function slopeFeedback(it, err) {
    const m = it.m, s = F.text(m), p = F.text(F.perp(m));
    if (err === 'slope-par') return `Parallel lines have the same slope: ${s}.`;
    if (err === 'flat') return m.undef ? 'Perpendicular to a vertical line is a flat line: slope 0.' : 'Perpendicular to a flat line is a vertical line: undefined.';
    if (err === 'sign-only') return `Turned 90°, rise and run swap too: perpendicular to ${s} is ${p}.`;
    if (err === 'same') return `The same slope is parallel. Perpendicular flips and changes sign: ${p}.`;
    return `Flip and change the sign: perpendicular to ${s} is ${p}.`;
  }
  function linesFeedback(it, a) {
    const s1 = F.text(it.m1), s2 = F.text(it.m2);
    if (it.rel === 'par') return `Same slope (${s1} and ${s2}): parallel.`;
    if (it.rel === 'perp') return it.m2.undef ? 'A flat line and a vertical line meet at a right angle: perpendicular.'
      : a === 'par' ? `Parallel means the same slope. ${s1} and ${s2} flip and change sign: perpendicular.` : `${s1} × ${/^−/.test(s2) ? `(${s2})` : s2} = −1: perpendicular.`;
    if (it.trap === 'opp') return `Only the sign changed. Turned 90°, rise and run swap too: perpendicular to ${s1} is ${F.text(F.perp(it.m1))}.`;
    return `Only flipped. The sign must change too: perpendicular to ${s1} is ${F.text(F.perp(it.m1))}.`;
  }

  const TIPS = {
    'slope-par': ['Changes the slope for a parallel line.', 'Parallel lines have the same steepness: same slope, no change.'],
    'sign-only': ['Only changes the sign.', 'Turn the slope triangle 90°: rise and run swap AND one sign changes. Check: the slopes multiply to −1.'],
    'flip-only': ['Only flips the fraction.', 'Flip AND change the sign. Check: the slopes multiply to −1.'],
    same: ['Uses the same slope for perpendicular.', 'Same slope is parallel; perpendicular is the negative reciprocal.'],
    flat: ['Mixes up 0 and undefined.', 'Perpendicular to a flat line (0) is vertical (undefined), and the other way around.'],
    other: ['Slips with the fraction or the sign.', 'Write the slope as a fraction first (3 = 3/1), then flip it and change the sign.'],
    fact: ['Mixes up the facts about parallel and perpendicular lines.', 'Draw two of each and talk through: do they meet? at what angle? what are the slopes?']
  };

  Apparatus.define({
    id: 'geo-parallel-perp',
    title: 'Parallel and Perpendicular',
    // other slope first, then which is it; 0 / undefined and the facts are the late twists
    ideas: {
      whole:   { name: 'The other slope: whole numbers (3 → −⅓)', easy: ['whole'], hard: ['line-whole'] },
      frac:    { name: 'The other slope: fractions (−¼ → 4)', easy: ['frac'], hard: ['line-frac'] },
      which:   { name: 'Parallel, perpendicular or neither', easy: ['par', 'perp'], hard: ['perp', 'none'] },
      special: { name: 'Flat and vertical (0 and undefined)', easy: ['zero'], hard: ['undef', 'hv'], late: true },
      facts:   { name: 'True or false facts', easy: ['fact'], hard: ['fact', 'fact'], late: true }
    },
    kinds: {
      whole: mk('whole', slope([[2], [3], [4], [5]], 'slope')), 'line-whole': mk('whole', slope(NEGW, 'line')),
      frac: mk('frac', slope(FR, 'slope')), 'line-frac': mk('frac', slope(FR.concat(NEGF), 'line')),
      par: mk('which', () => pair('par')), perp: mk('which', () => pair('perp')), none: mk('which', () => pair('none')),
      zero: mk('special', () => ({ kind: 'slope', m: F.of(0), b: F.of(nz(-5, 5)), from: 'line' })), undef: mk('special', slope('undef', 'line')), hv: mk('special', () => pair('hv')),
      fact: mk('facts', fact)
    },
    // the contrast set on one slope: write the other slopes for 2, then 2 against −2 and against ½
    opening: [
      { kind: 'whole', item: { kind: 'slope', m: F.of(2), b: F.of(1), from: 'slope' } },
      { kind: 'none', item: { kind: 'lines', m1: F.of(2), m2: F.of(-2), b1: F.of(1), b2: F.of(-3), rel: 'none', trap: 'opp' } },
      { kind: 'none', item: { kind: 'lines', m1: F.of(2), m2: F.of(1, 2), b1: F.of(1), b2: F.of(-3), rel: 'none', trap: 'recip' } }
    ],
    nextOnRight: true,
    defaults: { fix: 1 },
    text: it => it.kind === 'fact' ? FACTS[it.i][0] : it.kind === 'lines' ? `${plain(eq(it.m1, it.b1))} and ${plain(eq(it.m2, it.b2))}` : plain(given(it)),
    speak: it => it.kind === 'fact' ? `True or false: ${FACTS[it.i][0]}`
      : it.kind === 'lines' ? `${plain(eq(it.m1, it.b1))} and ${plain(eq(it.m2, it.b2))}. Parallel, perpendicular or neither?`
      : `${plain(given(it))}. Write the parallel slope and the perpendicular slope.`,
    ask(el, it, submit) { el._f = null; (it.kind === 'slope' ? askSlope : askPick)(el, it, submit); },
    correct: want,
    isRight: (it, a) => it.kind === 'slope' ? F.eq(a.par.v, it.m) && F.eq(a.perp.v, F.perp(it.m)) : a === want(it),
    classify(it, a) {
      if (it.kind === 'fact') return 'fact';
      if (it.kind === 'lines') return `${it.trap === 'opp' || it.trap === 'recip' || it.trap === 'hv' ? it.trap : it.rel}>${a}`;
      const m = it.m, p = a.perp.v;
      if (!F.eq(a.par.v, m)) return 'slope-par';
      if (m.undef || m.n === 0) return 'flat';
      if (F.eq(p, F.neg(m))) return 'sign-only';
      if (F.eq(p, F.recip(m))) return 'flip-only';
      if (F.eq(p, m)) return 'same';
      return 'other';
    },
    feedback(it, w, a, kind, err) {
      if (it.kind === 'fact') return ['', FACTS[it.i][2]];
      return ['pic', it.kind === 'lines' ? linesFeedback(it, a) : slopeFeedback(it, err)];
    },
    revealMs: 1300,
    reveal(el, it, a, o) {
      if (it.kind === 'slope') {
        const f = el._f; f && f.mark('par', F.eq(a.par.v, it.m)); f && f.mark('perp', F.eq(a.perp.v, F.perp(it.m)));
        if (!o.right) turnPicture(el.querySelector('.pic'), it.m);
        return;
      }
      el.querySelectorAll('.gmc button').forEach(b => { b.className = b.dataset.a === want(it) ? (o.right ? 'ok' : 'want') : b.dataset.a === a ? 'no' : ''; });
      if (!o.right && it.kind === 'lines') linesPicture(el.querySelector('.pic'), it);
    },
    errors: {
      'slope-par': 'wrote a different parallel slope', 'sign-only': 'only changed the sign', 'flip-only': 'only flipped', same: 'kept the same slope for perpendicular', flat: '0 ↔ undefined', other: 'other slip',
      'opp>perp': 'called “only the sign changed” perpendicular', 'recip>perp': 'called “only flipped” perpendicular', 'opp>par': 'called opposite slopes parallel', 'recip>par': 'called reciprocal slopes parallel',
      'perp>par': 'called perpendicular parallel', 'perp>none': 'missed perpendicular', 'par>perp': 'called parallel perpendicular', 'par>none': 'missed parallel', 'hv>par': 'called flat and vertical parallel', 'hv>none': 'missed flat ⟂ vertical',
      fact: 'a fact'
    },
    diagnose(err) {
      if (TIPS[err]) return TIPS[err];
      if (/^(opp|recip)>perp/.test(err)) return ['Thinks perpendicular is only a sign change, or only a flip.', 'Show the slope triangle turning 90°: rise and run swap AND one sign changes. Check: the slopes multiply to −1.'];
      if (/^(opp|recip)>par/.test(err)) return ['Calls lines parallel when the slopes only look alike.', 'Parallel needs the very same slope: 2 and 2, not 2 and −2 or 2 and ½.'];
      if (/^hv>/.test(err)) return ['Doesn’t see a flat line and a vertical line as perpendicular.', 'Draw y = 2 and x = 3: they cross at a right angle. Slopes 0 and undefined go together.'];
      if (/^perp>/.test(err)) return ['Doesn’t recognize negative reciprocals.', 'Multiply the slopes: −1 means perpendicular.'];
      if (/^par>/.test(err)) return ['Doesn’t see equal slopes as parallel.', 'Compare only the numbers in front of x.'];
      return ['Mixes up the slope rules.', 'Write both slopes side by side and compare.'];
    },
    get keyHTML() {
      const host = document.createElement('div');
      linesPicture(host, { m1: F.of(2), m2: F.of(-1, 2), b1: F.of(0), b2: F.of(0), rel: 'none' });
      const half = n => `<span class="frs"><span class="fr"><span>1</span><span>${n}</span></span></span>`;
      return `<div class="gk"><div>∥ parallel: same slope (2 and 2)</div><div>⟂ perpendicular: flip and change sign (2 → −${half(2)})</div>`
        + `<div>−${half(4)} → 4 · 0 → undefined</div><div class="gridbox">${host.innerHTML}</div></div>`;
    },

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
