// Rise and Run (G1) — the slope of a drawn line: tap two points on it, the slope triangle appears, write rise over run.
// Spec: specs/geometry-lines.md (G1). Uses lib/grid.js, lib/frac.js, lib/lines.js.
(function () {
  const F = Frac, G = Grid, L = Lines, { r, any } = L;
  // an item: { p: a lattice point on the line, run, rise } — the line through p with that direction
  const mk = (idea, f) => ({ idea, make: () => { const [run, rise] = f(); return { p: L.fit(run, rise), run, rise }; } });
  const slope = it => F.of(it.rise, it.run);
  const onLine = (it, q) => it.run === 0 ? q[0] === it.p[0] : (q[1] - it.p[1]) * it.run === (q[0] - it.p[0]) * it.rise;

  function draw(el, it, o = {}) {
    el.innerHTML = `<div class="gq"><div class="gridbox"></div><p class="say" aria-live="polite"></p>
      <div class="q ans" hidden>slope = ${F.box('slope', { undef: true })}</div><button type="button" class="go" hidden>Check</button></div>`;
    const g = G.make(el.querySelector('.gridbox'));
    g.line([it.p[0] - it.run, it.p[1] - it.rise], [it.p[0] + it.run, it.p[1] + it.rise]);
    return g;
  }
  // tap two points on the line → the triangle between them → done(a, b)
  function pickTwo(el, g, it, o, done) {
    const say = el.querySelector('.say'); let a = null;
    say.textContent = o.prompt || 'Tap two points on the line.';
    const stop = g.onTap(q => {
      if (!onLine(it, q)) { say.textContent = 'On the line, where it crosses grid corners.'; return; }
      if (!a) { a = q; g.dot(q, 'pt pick'); return; }
      if (q[0] === a[0] && q[1] === a[1]) return;
      stop(); g.dot(q, 'pt pick'); say.textContent = '';
      g.triangle(a, q, { labels: !!o.labels, words: o.words });
      done(a, q);
    });
  }

  const D = Apparatus.define({
    id: 'geo-rise',
    title: 'Rise and Run',
    ideas: {
      up:      { name: 'Going up (positive)', easy: ['up-steep'], hard: ['up-gentle', 'up-mixed'] },
      down:    { name: 'Going down (negative)', easy: ['down-steep'], hard: ['down-gentle', 'down-mixed'] },
      special: { name: 'Flat (0) and vertical (undefined)', easy: ['flat'], hard: ['flat', 'vertical'], late: true }
    },
    kinds: {
      'up-steep':    mk('up', () => [1, r(2, 3)]),
      'up-gentle':   mk('up', () => [r(2, 3), 1]),
      'up-mixed':    mk('up', () => any([[3, 2], [2, 3], [4, 3], [3, 4]])),
      'down-steep':  mk('down', () => [1, -r(2, 3)]),
      'down-gentle': mk('down', () => [r(2, 3), -1]),
      'down-mixed':  mk('down', () => any([[3, -2], [2, -3], [4, -3], [3, -4]])),
      'flat':        mk('special', () => [1, 0]),
      'vertical':    mk('special', () => [0, 1])
    },
    // the same steepness, up and down
    opening: [
      { kind: 'up-mixed', item: { p: [0, 0], run: 3, rise: 2 } },
      { kind: 'down-mixed', item: { p: [0, 1], run: 3, rise: -2 } }
    ],
    nextOnRight: true,
    text: it => `line with slope ${F.text(slope(it))}`,
    speak: it => `A line on a grid. Find its slope.`,
    ask(el, it, submit, ctx) {
      const g = draw(el, it);
      pickTwo(el, g, it, { labels: ctx.mode === 'open' }, (a, b) => {
        el._ab = [a, b];
        el.querySelector('.ans').hidden = false; el.querySelector('.go').hidden = false;
        el._f = F.wire(el, { want: () => slope(it), onSubmit: v => submit(v.slope) });
      });
      el._g = g;
    },
    correct: it => F.text(slope(it)),
    isRight: (it, a) => F.eq(a.v, slope(it)),
    classify(it, a) {
      const m = slope(it), v = a.v;
      if ((m.undef && v.n === 0) || (!m.undef && m.n === 0 && v.undef)) return 'zero';
      if (!m.undef && !v.undef && m.n !== 0 && F.eq(v, F.recip(m))) return 'swap';
      if (!m.undef && !v.undef && F.eq(v, F.neg(m))) return 'sign';
      return 'other';
    },
    feedback(it, want, a, kind, err) {
      const m = slope(it), up = G.sgn(it.rise), across = G.sgn(it.run);
      if (err === 'zero') return ['tri', m.undef ? 'A vertical line has no run: rise ÷ 0 is undefined.' : 'A flat line rises 0: 0 ÷ run = 0.'];
      if (err === 'swap') return ['tri', `Rise goes on top: rise ${up}, run ${across} is ${F.html(m)}.`];
      if (err === 'sign') return ['tri', m.n < 0 ? 'The line goes down to the right, so the slope is negative.' : 'The line goes up to the right, so the slope is positive.'];
      return ['tri', `Rise ${up} over run ${across}: ${F.html(m)}.`];
    },
    reveal(el, it, a, o) {
      el._f && el._f.mark('slope', o.right);
      if (o.right || !el._ab) return;
      // the triangle again, labelled
      el._g.triangle(el._ab[0], el._ab[1], { labels: true, words: true });
    },
    errors: { swap: 'run over rise (flipped)', sign: 'wrong sign', zero: 'flat ↔ vertical mixed up', other: 'miscounted' },
    diagnose(err) {
      return ({
        swap: ['Puts run on top.', 'Say it as “up over across”: rise first, then run.'],
        sign: ['Misses the direction: down to the right is negative.', 'Trace the line left to right with a finger: going down means a negative rise.'],
        zero: ['Mixes up flat (0) and vertical (undefined).', 'A flat line never goes up: 0 over anything is 0. A vertical line never goes across: you can’t divide by 0.'],
        other: ['Miscounts the squares.', 'Count the run along the bottom, then the rise up the side, one square at a time.']
      })[err] || ['', ''];
    },
    get keyHTML() {
      const host = document.createElement('div');
      const g = G.make(host, { min: -2, max: 4 });
      g.line([0, 0], [3, 2]); g.dot([0, 0]); g.dot([3, 2]); g.triangle([0, 0], [3, 2], { labels: true, words: true });
      return `<div class="gk"><div class="gridbox">${host.innerHTML}</div><div>slope = rise ÷ run = ${F.html(F.of(2, 3))}</div></div>`;
    },

    // ---- tutorial: tap two points; the triangle shows rise and run ----
    tutorial(stage, api) {
      const N = 2;
      const step = (i, it, say, after) => {
        if (!api.alive()) return;
        api.step(i, N); api.caption('');
        const g = draw(stage, it);
        pickTwo(stage, g, it, { labels: true, words: true, prompt: say }, () => { api.caption(after); next(); });
      };
      const next = () => {
        const h = document.createElement('div'); h.className = 'tbtns';
        h.innerHTML = '<button type="button" class="tb" aria-label="Next">›</button>';
        stage.firstChild.appendChild(h);
        h.firstChild.addEventListener('click', () => (stage._next || (() => {}))(), { once: true }); h.firstChild.focus();
      };
      stage._next = () => { stage._next = () => { api.step(N, N); api.done(); }; step(1, { p: [0, 1], run: 2, rise: -1 }, 'Now this one.', 'Going down: the rise is negative. −1 over 2.'); };
      step(0, { p: [0, 0], run: 1, rise: 2 }, 'Tap two points on the line.', 'Rise over run: up 2 for 1 across is 2.');
    }
  });
})();
