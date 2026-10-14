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

    text: it => `${P.numStr(it.d, it.p)} = ? × 10?`,
    speak: it => `${P.numStr(it.d, it.p)}. Move the point to write it in scientific notation.`,

    ask(el, it, submit) {
      const row = draw(el, it);
      livePower(row, it, null);
      P.bind(row, it.d, S0(it), g => { P.paint(row, it.d, g, S0(it)); livePower(row, it, g); }, submit);
    },
    correct: () => T(),
    classify: (it, g) => g < T() ? 'zero' : 'many',
    feedback(it, want, g, kind, err) {
      if (err === 'zero') return ['hops', `Now there’s a 0 before the point. Scientific notation needs one digit from 1 to 9 there.`];
      const int = P.valueAt(it.d, g).split('.')[0].replace(/,/g, '');
      return ['hops', `There are ${int.length} digits (${int}) before the point. Scientific notation has just one.`];
    },
    revealMs: 1400,
    reveal(el, it, g, o) {
      const row = el.querySelector('.prow'), res = el.querySelector('.res');
      if (o.right) {
        P.paint(row, it.d, g, S0(it), true); livePower(row, it, g);
        P.addPoint(row, 'pick ok', g);
        res.innerHTML = `= ${sci(it)}`; res.className = 'res ok';
        return;
      }
      // the picked point keeps its light zeros; the right move replays: hops, with a 10 going into the power each time
      P.paint(row, it.d, S0(it), S0(it), true); P.setFills(row, it.d, g, 'prev');
      if (g !== S0(it)) P.addPoint(row, 'pick no', g);
      livePower(row, it, S0(it));
      const run = P.addPoint(row, 'run', S0(it));
      setTimeout(() => P.hop(row, run, S0(it), T(), {
        onStep: (at, from) => {
          row.querySelectorAll('.s.fill').forEach(s => s.classList.remove('fill'));
          P.setFills(row, it.d, at, 'fill');
          P.token(row, Math.min(at, from) + 0.5, Math.max(PAD + it.d.length, at) + 1, at < from ? '10' : '10⁻¹');
          livePower(row, it, at);
        }
      }, () => { res.innerHTML = `= ${sci(it)}`; res.className = 'res'; }), 300);
    },

    errors: { many: 'more than one digit before the point', zero: '0 before the point' },
    diagnose(err) {
      if (err === 'zero') return ['Moves the point past the first digit.', 'The point goes right after the first digit that isn’t 0.'];
      return ['Stops too early: more than one digit is left before the point.', 'Count the digits before the point: scientific notation has exactly one.'];
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
