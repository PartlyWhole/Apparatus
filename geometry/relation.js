// Parallel, Perpendicular or Neither (G4) — two lines by their equations; then true/false facts about them.
// After a miss the lines are drawn with their slope triangles; for perpendicular lines the triangle turns 90°.
// Spec: specs/geometry-lines.md (G4). Uses lib/grid.js, lib/frac.js, lib/lines.js.
(function () {
  const F = Frac, G = Grid, L = Lines, { r, any } = L;
  const SL = [[2], [3], [-2], [1, 2], [-1, 3], [2, 3], [-3, 4], [3, 2]];
  const nz = (a, b) => { let v = 0; while (v === 0) v = r(a, b); return v; };
  const CHOICES = { lines: [['par', 'Parallel'], ['perp', 'Perpendicular'], ['none', 'Neither']], fact: [['T', 'True'], ['F', 'False']] };
  const FACTS = [
    ['Parallel lines intersect exactly once.', 'F', 'Parallel lines never meet.'],
    ['Perpendicular lines intersect at a 90° angle.', 'T', 'That’s what perpendicular means.'],
    ['Perpendicular lines have equal slopes.', 'F', 'Equal slopes are parallel. Perpendicular slopes flip and change sign (2 and −½).'],
    ['Parallel lines have equal slopes.', 'T', 'Same steepness, never meeting.'],
    ['A horizontal line and a vertical line are perpendicular.', 'T', 'They meet at a right angle.'],
    ['Two vertical lines are perpendicular.', 'F', 'Two vertical lines are parallel.'],
    ['Perpendicular slopes multiply to −1.', 'T', '2 × (−½) = −1.']
  ];
  // an item: { kind: 'lines', m1, m2, b1, b2, rel } or { kind: 'fact', i }; m can be UNDEF (x = c) or 0 (y = c)
  function pair(rel, special) {
    if (special) return { kind: 'lines', m1: F.of(0), m2: F.UNDEF, b1: F.of(nz(-4, 4)), b2: F.of(nz(-4, 4)), rel: 'perp' };
    const m = F.of(...any(SL));
    const m2 = rel === 'par' ? m : rel === 'perp' ? F.perp(m) : rel === 'opp' ? F.neg(m) : F.recip(m);
    let b1 = nz(-4, 4), b2 = nz(-4, 4); if (rel === 'par' && b1 === b2) b2 = -b1;
    return { kind: 'lines', m1: m, m2, b1: F.of(b1), b2: F.of(b2), rel: rel === 'opp' || rel === 'recip' ? 'none' : rel, trap: rel };
  }
  const mk = (idea, f) => ({ idea, make: f });
  const eq = (m, b) => m.undef ? `x = ${L.neg(b.n)}` : L.si(m, b);
  const want = it => it.kind === 'fact' ? FACTS[it.i][1] : it.rel;
  const plain = h => h.replace(/<span class="fr"><span>(\d+)<\/span><span>(\d+)<\/span><\/span>/g, '$1/$2').replace(/<[^>]+>/g, '');

  // the picture: both lines, a slope triangle on the first; for perpendicular, the triangle turns 90° onto the second
  function picture(host, it) {
    const g = G.make(host);
    const draw = (m, b, cls) => m.undef ? g.line([b.n, 0], [b.n, 1], cls) : g.line([0, b.n / b.d], [m.d, b.n / b.d + m.n], cls);
    draw(it.m1, it.b1, 'ln'); draw(it.m2, it.b2, 'ln b');
    if (it.m1.undef || it.m1.n === 0) return;
    const p = [0, it.b1.n], q = [it.m1.d, it.b1.n + it.m1.n];
    g.triangle(p, q, { labels: true });
    // the turned copy, then redrawn run-then-rise with its labels (run −rise, rise run)
    if (it.rel === 'perp') { const t2 = g.triangle(p, q, { labels: false, cls: 'turned' }); setTimeout(() => g.turn(t2, p, () => { t2.remove(); g.triangle(p, [p[0] - it.m1.n, p[1] + it.m1.d], { labels: true, cls: 'turned' }); }), 500); }
  }

  Apparatus.define({
    id: 'geo-relation',
    title: 'Parallel or Perpendicular',
    ideas: {
      par:   { name: 'Parallel (same slope)', easy: ['par'], hard: ['par'] },
      perp:  { name: 'Perpendicular (flip and change sign)', easy: ['perp'], hard: ['perp', 'hv'] },
      none:  { name: 'Neither (only flipped, or only the sign)', easy: ['opp'], hard: ['opp', 'recip'] },
      facts: { name: 'True or false facts', easy: ['fact'], hard: ['fact', 'fact'], late: true }
    },
    kinds: {
      par: mk('par', () => pair('par')), perp: mk('perp', () => pair('perp')), hv: mk('perp', () => pair('perp', true)),
      opp: mk('none', () => pair('opp')), recip: mk('none', () => pair('recip')),
      fact: mk('facts', () => ({ kind: 'fact', i: r(0, FACTS.length - 1) }))
    },
    // the same first line three ways
    opening: [
      { kind: 'par', item: { kind: 'lines', m1: F.of(2), m2: F.of(2), b1: F.of(1), b2: F.of(-3), rel: 'par' } },
      { kind: 'perp', item: { kind: 'lines', m1: F.of(2), m2: F.of(-1, 2), b1: F.of(1), b2: F.of(-3), rel: 'perp' } },
      { kind: 'opp', item: { kind: 'lines', m1: F.of(2), m2: F.of(-2), b1: F.of(1), b2: F.of(-3), rel: 'none', trap: 'opp' } }
    ],
    nextOnRight: true,
    defaults: { fix: 1 },
    text: it => it.kind === 'fact' ? FACTS[it.i][0] : `${plain(eq(it.m1, it.b1))} and ${plain(eq(it.m2, it.b2))}`,
    speak: it => it.kind === 'fact' ? `True or false: ${FACTS[it.i][0]}` : `${plain(eq(it.m1, it.b1))} and ${plain(eq(it.m2, it.b2))}. Parallel, perpendicular or neither?`,
    ask(el, it, submit) {
      const ch = CHOICES[it.kind];
      el.innerHTML = `<div class="gq">${it.kind === 'fact' ? `<div class="q fact">${FACTS[it.i][0]}</div>` : `<div class="eqs"><span>${eq(it.m1, it.b1)}</span><span class="l2">${eq(it.m2, it.b2)}</span></div>`}
        <div class="gmc" style="--k:${ch.length}">${ch.map(([id, t]) => `<button type="button" data-a="${id}">${t}</button>`).join('')}</div><div class="gridbox pic"></div></div>`;
      const btns = Array.from(el.querySelectorAll('.gmc button'));
      const send = a => { document.removeEventListener('keydown', keys); btns.forEach(b => { b.disabled = true; }); submit(a); };
      const keys = e => { const i = +e.key - 1; if (i >= 0 && i < btns.length && el.isConnected) { e.preventDefault(); send(btns[i].dataset.a); } };
      btns.forEach(b => b.addEventListener('click', () => send(b.dataset.a)));
      document.addEventListener('keydown', keys);
    },
    correct: it => want(it),
    classify: (it, a) => it.kind === 'fact' ? 'fact' : `${it.trap === 'opp' || it.trap === 'recip' ? it.trap : it.rel}>${a}`,
    feedback(it, w, a, kind, err) {
      if (it.kind === 'fact') return ['', FACTS[it.i][2]];
      const s1 = F.text(it.m1), s2 = F.text(it.m2);
      const t = it.trap;
      if (it.rel === 'par') return ['pic', `Same slope (${s1} and ${s2}): parallel.`];
      if (it.rel === 'perp') return ['pic', it.m2.undef ? 'A flat line and a vertical line meet at a right angle: perpendicular.'
        : a === 'par' ? `Parallel means the same slope. ${s1} and ${s2} flip and change sign: perpendicular.` : `${s1} × ${/^−/.test(s2) ? `(${s2})` : s2} = −1: perpendicular.`];
      if (t === 'opp') return ['pic', `Only the sign changed. Turned 90°, rise and run swap too: perpendicular to ${s1} is ${F.text(F.perp(it.m1))}.`];
      return ['pic', `Only flipped. The sign must change too: perpendicular to ${s1} is ${F.text(F.perp(it.m1))}.`];
    },
    revealMs: 1100,
    reveal(el, it, a, o) {
      el.querySelectorAll('.gmc button').forEach(b => { b.className = b.dataset.a === want(it) ? (o.right ? 'ok' : 'want') : b.dataset.a === a ? 'no' : ''; });
      if (!o.right && it.kind === 'lines') picture(el.querySelector('.pic'), it);
    },
    errors: { 'opp>perp': 'called “only the sign changed” perpendicular', 'recip>perp': 'called “only flipped” perpendicular', 'perp>par': 'called perpendicular parallel', 'perp>none': 'missed perpendicular', 'par>perp': 'called parallel perpendicular', 'par>none': 'missed parallel', 'opp>par': 'called opposite slopes parallel', 'recip>par': 'called reciprocal slopes parallel', fact: 'a fact' },
    diagnose(err) {
      if (/^(opp|recip)>perp/.test(err)) return ['Thinks perpendicular is only a sign change, or only a flip.', 'Show the slope triangle turning 90°: rise and run swap AND one sign changes. Check: the slopes multiply to −1.'];
      if (/^perp>/.test(err)) return ['Doesn’t recognize negative reciprocals.', 'Multiply the slopes: −1 means perpendicular.'];
      if (/^par>/.test(err)) return ['Doesn’t see equal slopes as parallel.', 'Compare only the numbers in front of x.'];
      if (err === 'fact') return ['Mixes up the facts about parallel and perpendicular lines.', 'Draw two of each and talk through: do they meet? at what angle? what are the slopes?'];
      return ['Mixes up the slope rules.', 'Write both slopes side by side and compare.'];
    },
    get keyHTML() {
      const host = document.createElement('div');
      picture(host, { m1: F.of(2), m2: F.of(-1, 2), b1: F.of(0), b2: F.of(0), rel: 'none' });
      return `<div class="gk"><div>parallel: same slope (2 and 2)</div><div>perpendicular: flip and change sign (2 and −½)</div><div class="gridbox">${host.innerHTML}</div></div>`;
    }
  });
})();
