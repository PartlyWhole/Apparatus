// Prefix — the prefix line (Mm · · km hm dam m dm cm mm · · µm) and the "build up" / "break down" exercises built on it.
// Spec: specs/prefixes.md. Needs lib/places.js and lib/forms.js. Styles: prefix.css.
(function () {
  const P = window.Places, F = window.Forms;
  const { r, any } = Apparatus.util;

  // the prefixes by power of ten; the line runs from 10⁶ to 10⁻⁶ with empty spots between
  const PRE = [
    { s: 'M', name: 'Mega', e: 6 }, { s: 'k', name: 'kilo', e: 3 }, { s: 'h', name: 'hecto', e: 2 }, { s: 'da', name: 'deca', e: 1 },
    { s: '', name: '', e: 0 }, { s: 'd', name: 'deci', e: -1 }, { s: 'c', name: 'centi', e: -2 }, { s: 'm', name: 'milli', e: -3 }, { s: 'µ', name: 'micro', e: -6 }
  ];
  const BASES = ['m', 'L', 'g'];
  const byE = e => PRE.find(p => p.e === e);
  const unit = (e, b) => byE(e).s + b;
  const N = 13, col = e => 6 - e;             // 13 spots, 10⁶ on the left
  const powerVal = k => P.fmt('1', 1 + k);     // 10^k written out: 1,000 or 0.001

  // the line; hi: powers to highlight; tap: make units tappable (tutorial)
  function lineHTML(b, hi = [], tap) {
    let h = '';
    for (let c = 0; c < N; c++) {
      const e = 6 - c, p = byE(e);
      if (!p) { h += `<span class="pc gap" style="--c:${c}"><b>·</b></span>`; continue; }
      const name = p.e === 0 ? '' : p.name;
      h += `<${tap ? 'button type="button"' : 'span'} class="pc${hi.includes(e) ? ' hi' : ''}${e === 0 ? ' base' : ''}" data-e="${e}" style="--c:${c}"><b>${unit(e, b)}</b><i>${name}</i></${tap ? 'button' : 'span'}>`;
    }
    return `<div class="pline" style="--n:${N}">${h}</div>`;
  }
  // hops along the line from power a to power b: numbered arcs underneath, each labelled (×10 / ÷10); done() at the end
  function hops(line, a, b, label, done) {
    line.querySelectorAll('.parc').forEach(x => x.remove());
    const dir = Math.sign(b - a); let e = a, k = 0;
    if (!dir) { done && done(); return; }
    const ms = P.reduced() ? 120 : 340;
    (function step() {
      if (!line.isConnected) return;
      const from = e; e += dir; k++;
      const arc = document.createElement('span');
      arc.className = 'parc'; arc.style.setProperty('--c', Math.min(col(from), col(e))); arc.dataset.n = label || k;
      line.appendChild(arc);
      if (e !== b) setTimeout(step, ms); else setTimeout(() => done && done(), ms);
    })();
  }

  // ---- reading answers: errors shared by the prefix exercises ----
  // want: the power of ten that's right; got: the power the student wrote (null if it isn't a power of ten)
  function powerError(want, got) {
    if (got == null) return 'other';
    if (got === want) return null;
    return got !== 0 && want !== 0 && Math.sign(got) !== Math.sign(want) ? 'dir' : 'count';
  }
  // "1 km = 1,000 m" — one plain sentence for a miss
  function sentence(err, a, b, k) {
    const A = a, B = b, n = Math.abs(k), val = powerVal(k);
    const chain = n <= 3 ? (k > 0 ? Array(n).fill('10').join(' × ') : '1 ' + Array(n).fill('÷ 10').join(' ')) : `10<sup>${k < 0 ? '−' : ''}${n}</sup>`;
    if (err === 'dir') return k > 0 ? `1 ${A} is bigger than 1 ${B}, so it’s many ${B}: ${val}.` : `1 ${A} is smaller than 1 ${B}, so it’s part of one: ${val}.`;
    if (err === 'other') return `It’s a power of ten: 1 ${A} = ${val} ${B}.`;
    return `From ${A} to ${B} is ${n} place${n === 1 ? '' : 's'}: ${chain} = ${val}.`;
  }
  const DIAG = {
    dir: ['Answers the wrong way around: a big number where a small one belongs (or the reverse).', 'Ask: is the first unit bigger or smaller than the second? Bigger means many of the small ones.'],
    count: ['Counts the places wrong, often across the empty spots between k and M or m and µ.', 'Have them count every spot on the line, empty ones too: one × 10 each.'],
    other: ['Writes a number that isn’t a power of ten.', 'Point out every answer here is 1 followed or led by zeros: 10, 100, 0.01 …'],
    flip: ['Puts the numbers on the wrong side of the fraction.', 'Read it as “1 m equals how many cm?” The bigger unit needs the smaller number.']
  };

  // ---- the "build up" and "break down" exercises: 1 A = ? B, one of A, B the base unit ----
  //   up:   the answer is ≥ 10 (1 L = 1,000 mL; 1 km = 1,000 m)
  //   down: the answer is ≤ 0.1 (1 mL = 0.001 L; 1 m = 0.001 km)
  function updown(cfg) {
    const up = cfg.mode === 'up';
    // an item: { b: base, a: power of the "1" unit, t: power of the answer's unit }; the answer is 10^(a − t)
    const mk = (idea, e) => ({ idea, make: () => { const b = any(BASES); return idea === 'small' ? (up ? { b, a: 0, t: e } : { b, a: e, t: 0 }) : (up ? { b, a: e, t: 0 } : { b, a: 0, t: e }); } });
    const K = it => it.a - it.t;
    const question = it => `<div class="fq">${lineHTML(it.b, [it.a, it.t])}<div class="q">1 ${unit(it.a, it.b)} = ${F.num('answer', true)} ${unit(it.t, it.b)}</div>
      <button type="button" class="go">Check</button><div class="ans" aria-live="polite"></div></div>`;
    return Apparatus.define({
      id: cfg.id, title: cfg.title,
      ideas: up ? {
        small: { name: '1 base = ? small (mL in 1 L)', easy: ['s1', 's2'], hard: ['s3', 's6'] },
        big:   { name: '1 big = ? base (m in 1 km)', easy: ['b1', 'b2'], hard: ['b3', 'b6'] }
      } : {
        big:   { name: '1 base = ? big (km in 1 m)', easy: ['b1', 'b2'], hard: ['b3', 'b6'] },
        small: { name: '1 small = ? base (m in 1 cm)', easy: ['s1', 's2'], hard: ['s3', 's6'] }
      },
      kinds: { s1: mk('small', -1), s2: mk('small', -2), s3: mk('small', -3), s6: mk('small', -6), b1: mk('big', 1), b2: mk('big', 2), b3: mk('big', 3), b6: mk('big', 6) },
      opening: up ? [{ kind: 's3', item: { b: 'L', a: 0, t: -3 } }, { kind: 'b3', item: { b: 'm', a: 3, t: 0 } }]
                  : [{ kind: 'b3', item: { b: 'm', a: 0, t: 3 } }, { kind: 's2', item: { b: 'm', a: -2, t: 0 } }],
      nextOnRight: true,
      text: it => `1 ${unit(it.a, it.b)} = ? ${unit(it.t, it.b)}`,
      speak: it => `1 ${unit(it.a, it.b)} equals how many ${unit(it.t, it.b)}?`,
      ask(el, it, submit) { el.innerHTML = question(it); el._form = F.wire(el, v => submit(v.answer)); },
      correct: it => K(it),
      isRight: (it, v) => F.powerOf(v) === K(it),
      classify: (it, v) => powerError(K(it), F.powerOf(v)),
      feedback: (it, want, v, kind, err) => ['line', sentence(err, unit(it.a, it.b), unit(it.t, it.b), K(it))],
      revealMs: 1400,
      reveal(el, it, v, o) {
        el._form && el._form.mark(o.right);
        if (o.right) return;
        const ans = el.querySelector('.ans');
        hops(el.querySelector('.pline'), it.a, it.t, up ? '×10' : '÷10', () => { ans.innerHTML = `1 ${unit(it.a, it.b)} = ${powerVal(K(it))} ${unit(it.t, it.b)}`; });
      },
      errors: { dir: 'the wrong way (big ↔ small)', count: 'wrong number of places', other: 'not a power of ten' },
      diagnose: err => DIAG[err] || ['', ''],
      keyHTML: `<div class="pkey2">${lineHTML('m')}</div>`,
      tutorial: cfg.tutorial ? (stage, api) => tutorial(stage, api) : undefined
    });
  }

  // ---- tutorial (build up): tap a unit, watch the hops to the base ----
  function tutorial(stage, api) {
    const N2 = 2;
    function step(i, say, ok, done) {
      if (!api.alive()) return;
      api.step(i, N2); api.caption(say);
      stage.innerHTML = `<div class="fq">${lineHTML('L', [0], true)}<div class="ans" aria-live="polite"></div></div>`;
      const line = stage.querySelector('.pline'), ans = stage.querySelector('.ans');
      line.querySelectorAll('button.pc').forEach(b => b.addEventListener('click', () => {
        const e = +b.dataset.e;
        if (!api.alive() || !ok(e)) return;
        line.querySelectorAll('button.pc').forEach(x => { x.disabled = true; });
        b.classList.add('hi');
        const big = Math.max(e, 0), small = Math.min(e, 0), k = big - small;
        hops(line, big, small, '×10', () => {
          ans.innerHTML = `1 ${unit(big, 'L')} = ${powerVal(k)} ${unit(small, 'L')}`;
          api.caption('Each step is × 10.');
          const h = document.createElement('div'); h.className = 'tbtns';
          h.innerHTML = '<button type="button" class="tb" aria-label="Next">›</button>';
          stage.firstChild.appendChild(h); h.firstChild.addEventListener('click', done, { once: true }); h.firstChild.focus();
        });
      }));
    }
    step(0, 'Tap a unit bigger than L.', e => e > 0, () => step(1, 'Now one smaller than L.', e => e < 0, () => { api.step(N2, N2); api.done(); }));
  }

  window.Prefix = { PRE, BASES, byE, unit, lineHTML, hops, powerVal, powerError, sentence, DIAG, updown };
})();
