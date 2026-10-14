// Factor In — rewrite scientific notation as a decimal by moving the point; each hop puts one 10 (or 10⁻¹) back into the number,
// until the power is gone. Spec: specs/factor-in.md. Shared visual: lib/places.js. Engine: docs/design/engine.md.
(function () {
  const { r } = Apparatus.util, P = Places, PAD = P.PAD;
  const nz = () => String(r(1, 9));
  const dig = n => nz() + Array.from({ length: n - 2 }, () => r(0, 9)).join('') + (n > 1 ? nz() : '');

  // an item: { d: digits (first not 0), e: the power }; it starts as d[0].d[1..] × 10^e
  const S0 = () => PAD + 1;
  const T = it => PAD + 1 + it.e;
  const left = (it, g) => it.e - (g - S0());     // the power still left over with the point at g
  const lhs = it => `${P.fmt(it.d, 1)} ${P.powHTML(it.e)}`;
  const dec = it => P.fmt(it.d, 1 + it.e);

  function draw(el, it) {
    el.innerHTML = `<div class="pq"><div class="lhs">${lhs(it)} =</div>${P.rowHTML(it.d, 1)}<div class="res" aria-live="polite"></div></div>`;
    return el.querySelector('.prow');
  }
  function power(row, it, g) {
    const at = g == null ? S0() : g, e = left(it, at), pw = row.querySelector('.pw');
    const before = pw.hidden ? 0 : pw.dataset.e | 0;
    P.setPower(row, it.d, at, e); pw.dataset.e = e;
    if (e !== before) { pw.classList.remove('tick'); void pw.offsetWidth; pw.classList.add('tick'); }
  }

  const D = Apparatus.define({
    id: 'factor-in',
    title: 'Factor In',

    ideas: {
      pos:  { name: '× 10ⁿ (bigger)',   easy: ['p-one'], hard: ['p-past', 'p-mid'] },
      neg:  { name: '× 10⁻ⁿ (smaller)', easy: ['n-one'], hard: ['n-deep', 'n-gap'] },
      zero: { name: '× 10⁰',            easy: ['zero'],  hard: ['zero'], late: true }
    },
    kinds: {
      'p-one':  { idea: 'pos',  make: () => ({ d: dig(2), e: 1 }) },                 // 4.5 × 10¹ → 45
      'p-past': { idea: 'pos',  make: () => ({ d: dig(2), e: r(2, 3) }) },           // 4.5 × 10³ → 4,500
      'p-mid':  { idea: 'pos',  make: () => ({ d: dig(4), e: r(1, 2) }) },           // 3.527 × 10² → 352.7
      'n-one':  { idea: 'neg',  make: () => ({ d: dig(2), e: -1 }) },                // 3.5 × 10⁻¹ → 0.35
      'n-deep': { idea: 'neg',  make: () => ({ d: dig(2), e: -r(2, 3) }) },          // 3.5 × 10⁻³ → 0.0035
      'n-gap':  { idea: 'neg',  make: () => ({ d: nz() + '0' + nz(), e: -2 }) },     // 4.08 × 10⁻² → 0.0408
      'zero':   { idea: 'zero', make: () => ({ d: dig(r(2, 3)), e: 0 }) }            // 6.2 × 10⁰ → 6.2
    },
    opening: [
      { kind: 'p-past', item: { d: '45', e: 3 } },
      { kind: 'n-deep', item: { d: '45', e: -3 } }
    ],
    nextOnRight: true,

    text: it => `${P.fmt(it.d, 1)} ${P.powText(it.e)} = ?`,
    speak: it => `${P.fmt(it.d, 1)} times 10 to the ${it.e < 0 ? 'minus ' + -it.e : it.e}. Move the point to write it as a decimal.`,

    // the power counts down live only in the opening (and the tutorial); after that the student works it out
    ask(el, it, submit, ctx) {
      const row = draw(el, it), live = ctx.mode === 'open';
      if (live) power(row, it, null);
      P.bind(row, it.d, S0(), g => { P.paint(row, it.d, g, S0()); if (live) power(row, it, g); }, submit);
    },
    correct: it => T(it),
    classify(it, g) {
      const moved = g - S0();
      if (it.e === 0) return 'zero';
      if (moved !== 0 && Math.sign(moved) !== Math.sign(it.e)) return 'dir';
      return 'count';
    },
    feedback(it, want, g, kind, err) {
      if (err === 'zero') return ['hops', `10<sup>0</sup> is 1, so the point stays.`];
      if (err === 'dir') return ['hops', it.e > 0 ? `${P.powHTML(it.e)} makes it bigger, so the point moves right.` : `${P.powHTML(it.e)} makes it smaller, so the point moves left.`];
      const n = Math.abs(it.e), rest = left(it, g);
      return ['hops', `That leaves ${P.powHTML(rest)}. ${P.powHTML(it.e)} is ${n} hop${n === 1 ? '' : 's'}.`];
    },
    revealMs: 1400,
    reveal(el, it, g, o) {
      const row = el.querySelector('.prow'), res = el.querySelector('.res');
      if (o.right) {
        P.paint(row, it.d, g, S0(), true); P.setPower(row, it.d, g, 0);
        P.addPoint(row, 'pick ok', g);
        res.textContent = '= ' + dec(it); res.className = 'res ok';
        return;
      }
      // the picked point shows what's left over; then the right move replays, putting a 10 back in each hop
      P.paint(row, it.d, S0(), S0(), true); P.setFills(row, it.d, g, 'prev');
      if (g !== S0()) P.addPoint(row, 'pick no', g);
      power(row, it, S0());
      const run = P.addPoint(row, 'run', S0());
      const end = () => { res.textContent = '= ' + dec(it); res.className = 'res'; };
      if (T(it) === S0()) { run.classList.add('stay'); end(); return; }
      setTimeout(() => P.hop(row, run, S0(), T(it), {
        onStep: (at, from) => {
          row.querySelectorAll('.s.fill').forEach(s => s.classList.remove('fill'));
          P.setFills(row, it.d, at, 'fill');
          P.token(row, Math.max(PAD + it.d.length, at) + 1, Math.min(at, from) + 0.5, at > from ? '10' : '10⁻¹');
          power(row, it, at);
        }
      }, end), 300);
    },

    errors: { dir: 'moved the wrong way', count: 'wrong number of places', zero: 'moved the point for 10⁰' },
    diagnose(err) {
      if (err === 'dir') return ['Hasn’t linked the sign of the power to the direction.', 'Ask: “Does × 10⁻³ make it bigger or smaller?” Smaller means the point moves left.'];
      if (err === 'zero') return ['Thinks 10⁰ is 10 (or 0).', '10⁰ = 1: multiplying by 1 changes nothing.'];
      return ['Counts the hops wrong.', 'One hop for each 1 in the power: count them aloud with a finger.'];
    },

    cheatRule: 'Move the point as many places as the power: positive → right (bigger), negative → left (smaller).',
    get keyHTML() {
      const ex = [{ d: '45', e: 3 }, { d: '45', e: -3 }];
      return `<div class="pkey">${ex.map(it => `<div class="kx">${lhs(it)} =</div>${P.staticHops(it.d, 1, T(it), 0)}`).join('')}</div>`;
    },

    // ---- tutorial: move the point until the power is gone ----
    tutorial(stage, api) {
      const N = 2;
      function step(i, it, say, after) {
        if (!api.alive()) return;
        api.step(i, N); api.caption(say);
        const row = draw(stage, it); power(row, it, null);
        P.bind(row, it.d, S0(), g => { P.paint(row, it.d, g, S0()); power(row, it, g); }, g => {
          if (!api.alive()) return;
          if (g === T(it)) { P.paint(row, it.d, g, S0(), true); P.setPower(row, it.d, g, 0); P.addPoint(row, 'pick ok', g); after(); }
          else { api.caption('Try again: until the power is gone.'); setTimeout(() => step(i, it, say, after), 1100); }
        });
        row.focus({ preventScroll: true });
      }
      const next = fn => { const h = document.createElement('div'); h.className = 'tbtns'; h.innerHTML = '<button type="button" class="tb" aria-label="Next">›</button>'; stage.firstChild.appendChild(h); h.firstChild.addEventListener('click', fn, { once: true }); h.firstChild.focus(); };
      const a = { d: '45', e: 3 }, b = { d: '45', e: -3 };
      step(0, a, 'Drag the point until the power is gone.', () => {
        api.caption(`Each hop puts a 10 back in: ${lhs(a)} = 4,500`);
        next(() => step(1, b, 'Now this one.', () => {
          api.caption(`${lhs(b)} = 0.0045`);
          next(() => { api.step(N, N); api.done(); });
        }));
      });
    }
  });
})();
