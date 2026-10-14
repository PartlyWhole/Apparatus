// Factor Out — rewrite a decimal in scientific notation by moving the point; each hop takes a 10 (or 10⁻¹) out into the power.
// Spec: specs/factor-out.md. Shared visual: lib/places.js. Engine: docs/design/engine.md.
(function () {
  const { r } = Apparatus.util, P = Places, PAD = P.PAD;
  const nz = () => String(r(1, 9));
  const dig = n => nz() + Array.from({ length: n - 2 }, () => r(0, 9)).join('') + (n > 1 ? nz() : '');   // first and last not 0

  // an item: { d: digits (first not 0), p: digits left of the point }. Scientific: the point after the first digit.
  const S0 = it => PAD + it.p;                 // where the point starts
  const T = () => PAD + 1;                     // where it belongs
  const powAt = (it, g) => S0(it) - g;         // each hop left takes out a 10; each hop right a 10⁻¹
  const sci = it => `${P.fmt(it.d, 1)} ${P.powHTML(it.p - 1)}`;

  function draw(el, it, mode) {
    el.innerHTML = `<div class="pq"><div class="lhs">${P.numStr(it.d, it.p)} =</div>${P.rowHTML(it.d, it.p)}<div class="res" aria-live="polite"></div></div>`;
    const row = el.querySelector('.prow');
    P.paint(row, it.d, null, S0(it));
    return row;
  }
  // the live power while the point is previewed (a tick when it changes)
  function livePower(row, it, g) {
    const at = g == null ? S0(it) : g, e = powAt(it, at), pw = row.querySelector('.pw');
    const before = pw.hidden ? 0 : pw.dataset.e | 0;
    P.setPower(row, it.d, at, e); pw.dataset.e = e;
    if (e !== before && e !== 0) { pw.classList.remove('tick'); void pw.offsetWidth; pw.classList.add('tick'); }
  }

  // after the point is placed: the power shows as × 10^[ ] at the end of the row; the student writes it (typing a minus if negative)
  function askPower(el, row, it, g, done) {
    const pw = row.querySelector('.pw');
    P.setPower(row, it.d, g, '?');
    pw.classList.add('askx');
    pw.innerHTML = `<span>× 10<sup><input class="px" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Power of ten"></sup></span>`;
    const ctl = document.createElement('div');
    ctl.className = 'pctl';
    ctl.innerHTML = '<button type="button" class="go">Check</button>';
    row.after(ctl);
    const x = pw.querySelector('input'), read = () => P.parseInt10(x.value);    // a minus is typed ("-" or "−")
    const check = () => {
      const v = read();
      if (v == null) { x.classList.remove('bad'); void x.offsetWidth; x.classList.add('bad'); x.focus(); return; }
      x.disabled = true; ctl.querySelectorAll('button').forEach(b => { b.disabled = true; });
      done(v);
    };
    ctl.querySelector('.go').addEventListener('click', check);
    x.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
    x.addEventListener('input', () => x.classList.remove('bad'));
    setTimeout(() => x.focus({ preventScroll: true }), 30);
  }

  const D = Apparatus.define({
    id: 'factor-out',
    title: 'Factor Out',

    ideas: {
      big:   { name: 'Big numbers (10ⁿ)',    easy: ['b-two'],  hard: ['b-whole', 'b-dec'] },
      small: { name: 'Small numbers (10⁻ⁿ)', easy: ['s-one'],  hard: ['s-deep', 's-gap'] },
      ready: { name: 'Already one digit',    easy: ['ready'],  hard: ['ready'], late: true }
    },
    kinds: {
      'b-two':   { idea: 'big',   make: () => ({ d: dig(2), p: 2 }) },                         // 45 → 4.5 × 10¹
      'b-whole': { idea: 'big',   make: () => { const z = r(2, 3); return { d: dig(2) + '0'.repeat(z), p: 2 + z }; } },   // 4,500 → 4.5 × 10³
      'b-dec':   { idea: 'big',   make: () => ({ d: dig(4), p: r(2, 3) }) },                 // 352.7 → 3.527 × 10²
      's-one':   { idea: 'small', make: () => ({ d: dig(2), p: 0 }) },                       // 0.35 → 3.5 × 10⁻¹
      's-deep':  { idea: 'small', make: () => ({ d: dig(2), p: -r(1, 3) }) },                // 0.0035 → 3.5 × 10⁻³
      's-gap':   { idea: 'small', make: () => ({ d: nz() + '0' + nz(), p: -1 }) },           // 0.0408 → 4.08 × 10⁻²
      'ready':   { idea: 'ready', make: () => ({ d: dig(r(2, 3)), p: 1 }) }                  // 6.2 → 6.2 × 10⁰
    },
    // the same digits, big and small
    opening: [
      { kind: 'b-whole', item: { d: '4500', p: 4 } },
      { kind: 's-deep',  item: { d: '45', p: -2 } }
    ],
    nextOnRight: true,

    text: it => `${P.numStr(it.d, it.p)} = ? × 10?`,   // the log's pick is { g: where the point went, x: the power written }
    speak: it => `${P.numStr(it.d, it.p)}. Move the point to write it in scientific notation.`,

    // the opening shows the power live; after that it's hidden: place the point, then write the power that came out
    ask(el, it, submit, ctx) {
      const row = draw(el, it), live = ctx.mode === 'open';
      if (live) livePower(row, it, null);
      P.bind(row, it.d, S0(it), g => { P.paint(row, it.d, g, S0(it)); if (live) livePower(row, it, g); }, g => {
        if (live || g !== T()) return submit({ g });
        P.paint(row, it.d, g, S0(it), true); P.addPoint(row, 'pick ok', g);
        askPower(el, row, it, g, x => submit({ g, x }));
      });
    },
    correct: () => T(),
    isRight: (it, a) => a.g === T() && (a.x === undefined || a.x === it.p - 1),
    classify(it, a) {
      if (a.g < T()) return 'zero';
      if (a.g > T()) return 'many';
      const n = it.p - 1;
      return n !== 0 && a.x !== 0 && Math.sign(a.x) !== Math.sign(n) ? 'sign' : 'count';
    },
    feedback(it, want, a, kind, err) {
      const n = it.p - 1, k = Math.abs(n), num = P.numStr(it.d, it.p);
      if (err === 'zero') return ['hops', `Now there’s a 0 before the point. Scientific notation needs one digit from 1 to 9 there.`];
      if (err === 'many') {
        const int = P.valueAt(it.d, a.g).split('.')[0].replace(/,/g, '');
        return ['hops', `There are ${int.length} digits (${int}) before the point. Scientific notation has just one.`];
      }
      if (err === 'sign') return ['hops', n > 0 ? `${num} got smaller (${P.fmt(it.d, 1)}), so the power is positive: ${P.powHTML(n)}.` : `${num} got bigger (${P.fmt(it.d, 1)}), so the power is negative: ${P.powHTML(n)}.`];
      return ['hops', n === 0 ? `The point didn’t move, so it’s ${P.powHTML(0)}.` : `The point hopped ${k} place${k === 1 ? '' : 's'}: ${P.powHTML(n)}.`];
    },
    revealMs: 1400,
    reveal(el, it, a, o) {
      const g = a.g, row = el.querySelector('.prow'), res = el.querySelector('.res');
      el.querySelectorAll('.pctl').forEach(c => c.remove());
      if (o.right) {
        P.paint(row, it.d, g, S0(it), true); livePower(row, it, g);
        if (!row.querySelector('.pt.pick')) P.addPoint(row, 'pick ok', g);
        res.innerHTML = `= ${sci(it)}`; res.className = 'res ok';
        return;
      }
      // a wrong place keeps its light zeros (a wrong power keeps the right place); then the right move replays:
      // hops, with a 10 going into the power each time, the power counting
      row.querySelectorAll('.pt.pick').forEach(p => p.remove());
      P.paint(row, it.d, S0(it), S0(it), true);
      if (g !== T()) { P.setFills(row, it.d, g, 'prev'); if (g !== S0(it)) P.addPoint(row, 'pick no', g); }
      livePower(row, it, S0(it));
      const run = P.addPoint(row, 'run', S0(it));
      const end = () => { res.innerHTML = `= ${sci(it)}`; res.className = 'res'; };
      if (T() === S0(it)) { livePower(row, it, T()); end(); return; }
      setTimeout(() => P.hop(row, run, S0(it), T(), {
        onStep: (at, from) => {
          row.querySelectorAll('.s.fill').forEach(s => s.classList.remove('fill'));
          P.setFills(row, it.d, at, 'fill');
          P.token(row, Math.min(at, from) + 0.5, Math.max(PAD + it.d.length, at) + 1, at < from ? '10' : '10⁻¹');
          livePower(row, it, at);
        }
      }, end), 300);
    },

    errors: { many: 'more than one digit before the point', zero: '0 before the point', sign: 'power with the wrong sign', count: 'power: wrong number of hops' },
    diagnose(err) {
      if (err === 'zero') return ['Moves the point past the first digit.', 'The point goes right after the first digit that isn’t 0.'];
      if (err === 'many') return ['Stops too early: more than one digit is left before the point.', 'Count the digits before the point: scientific notation has exactly one.'];
      if (err === 'sign') return ['Places the point right, but gets the sign of the power backwards.', 'Ask: did the number get smaller or bigger? Smaller (4,500 → 4.5) means a positive power.'];
      return ['Places the point right, but doesn’t count the hops.', 'Before writing the power, count the hops aloud: one per place.'];
    },

    get keyHTML() {
      const ex = [{ d: '4500', p: 4 }, { d: '45', p: -2 }];
      return `<div class="pkey">${ex.map(it => `<div class="kx">${P.numStr(it.d, it.p)} =</div>${P.staticHops(it.d, it.p, T(), it.p - 1)}`).join('')}</div>`;
    },

    // ---- tutorial: drag the point; the power counts the hops ----
    tutorial(stage, api) {
      const N = 4;
      function step(i, it, say, want, after) {
        if (!api.alive()) return;
        api.step(i, N); api.caption(say);
        const row = draw(stage, it); livePower(row, it, null);
        P.bind(row, it.d, S0(it), g => { P.paint(row, it.d, g, S0(it)); livePower(row, it, g); }, g => {
          if (!api.alive()) return;
          if (want(g)) { P.paint(row, it.d, g, S0(it), true); livePower(row, it, g); P.addPoint(row, 'pick ok', g); after(g); }
          else { api.caption('Try again.'); setTimeout(() => step(i, it, say, want, after), 900); }
        });
        row.focus({ preventScroll: true });
      }
      const big = { d: '4500', p: 4 }, small = { d: '45', p: -2 };
      const next = fn => { const h = document.createElement('div'); h.className = 'tbtns'; h.innerHTML = '<button type="button" class="tb" aria-label="Next">›</button>'; stage.firstChild.appendChild(h); h.firstChild.addEventListener('click', fn, { once: true }); h.firstChild.focus(); };
      step(0, big, 'Drag the point left.', g => g < S0(big), () => {
        api.caption('Each hop left takes out a 10.');
        next(() => step(1, big, 'Make it 4.5.', g => g === T(), () => {
          api.caption(`4,500 = 4.5 ${P.powHTML(3)}`);
          next(() => step(2, small, 'Now drag the point right.', g => g > S0(small), () => {
            api.caption(`Each hop right takes out a 10<sup>−1</sup>.`);
            next(() => step(3, small, 'Make it 4.5.', g => g === T(), () => {
              api.caption(`0.0045 = 4.5 ${P.powHTML(-3)}`);
              next(() => { api.step(N, N); api.done(); });
            }));
          }));
        }));
      });
    }
  });
})();
