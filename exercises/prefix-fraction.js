// Conversion Fractions — equal amounts on top and bottom make a fraction worth 1 (1 m / 100 cm). No prefix line.
// Spec: specs/prefixes.md (4). Uses lib/prefix.js (units, powers), lib/forms.js, lib/places.js.
(function () {
  const { any } = Apparatus.util, F = Forms, X = Prefix, P = Places;
  const BASE = [[0, -2], [0, -3], [3, 0], [0, -1], [2, 0], [0, -6]];               // one unit is the base
  const NONBASE = [[-2, -3], [3, -2], [-3, -6], [3, -3], [2, -1], [1, -2]];        // neither is (cm/mm, km/cm, mm/µm …)
  // an item: { b, top: power of the top unit, bot: power of the bottom unit, given: 'top' | 'bot' | null (which number is 1) }
  const mk = (idea, pool, given) => ({ idea, make: () => {
    let [x, y] = any(pool); if (Math.random() < 0.5) [x, y] = [y, x];
    return { b: any(X.BASES), top: x, bot: y, given };
  } });
  // the numbers that make top = bottom when one of them is 1
  const topWhenBot1 = it => it.bot - it.top;      // power of the top number
  const field = (it, side) => it.given === side ? `<span class="given">1</span>` : F.num(side);

  function fracHTML(it) {
    return `<div class="frac"><span class="row1">${field(it, 'top')} <span>${X.unit(it.top, it.b)}</span></span><span class="fbar"></span>
      <span class="row1">${field(it, 'bot')} <span>${X.unit(it.bot, it.b)}</span></span></div>`;
  }
  // the student's pair as powers of ten: { t, b } or null if either isn't a power of ten
  function pair(it, v) {
    const t = it.given === 'top' ? 0 : F.powerOf(v.top), b = it.given === 'bot' ? 0 : F.powerOf(v.bot);
    return t == null || b == null ? null : { t, b };
  }
  const right = (it, v) => { const p = pair(it, v); return !!p && p.t - p.b === topWhenBot1(it); };
  function classify(it, v) {
    const p = pair(it, v);
    if (!p) return 'other';
    const want = topWhenBot1(it), got = p.t - p.b;
    return want !== 0 && got === -want ? 'flip' : 'count';
  }
  // the nicest correct pair: 1 on the side of the bigger unit
  function answerHTML(it) {
    const k = topWhenBot1(it);
    const [tn, bn] = k >= 0 ? [X.powerVal(k), '1'] : ['1', X.powerVal(-k)];
    return `<div class="frac"><span class="row1"><span class="given">${tn}</span> ${X.unit(it.top, it.b)}</span><span class="fbar"></span><span class="row1"><span class="given">${bn}</span> ${X.unit(it.bot, it.b)}</span></div>`;
  }

  const D = Apparatus.define({
    id: 'prefix-fraction',
    title: 'Conversion Fractions',
    ideas: {
      base:    { name: 'With the base unit (m / cm)', easy: ['b-top1'], hard: ['b-top1', 'b-bot1', 'b-free'] },
      nonbase: { name: 'Two prefixes (cm / mm)',     easy: ['n-top1'], hard: ['n-top1', 'n-bot1', 'n-free'] }
    },
    kinds: {
      'b-top1': mk('base', BASE, 'top'), 'b-bot1': mk('base', BASE, 'bot'), 'b-free': mk('base', BASE, null),
      'n-top1': mk('nonbase', NONBASE, 'top'), 'n-bot1': mk('nonbase', NONBASE, 'bot'), 'n-free': mk('nonbase', NONBASE, null)
    },
    opening: [{ kind: 'b-top1', item: { b: 'm', top: 0, bot: -2, given: 'top' } }],
    defaults: { tricky: 3 },
    nextOnRight: true,
    text: it => `${it.given === 'top' ? '1' : '?'} ${X.unit(it.top, it.b)} / ${it.given === 'bot' ? '1' : '?'} ${X.unit(it.bot, it.b)}`,
    speak: it => `A fraction: ${X.unit(it.top, it.b)} over ${X.unit(it.bot, it.b)}. Fill in numbers so top and bottom are equal.`,
    ask(el, it, submit) {
      el.innerHTML = `<div class="fq"><div class="q">${fracHTML(it)}</div><button type="button" class="go">Check</button><div class="ans" aria-live="polite"></div></div>`;
      el._form = F.wire(el, submit);
    },
    correct: it => topWhenBot1(it),
    isRight: right,
    classify,
    feedback(it, want, v, kind, err) {
      const A = X.unit(it.top, it.b), B = X.unit(it.bot, it.b), k = topWhenBot1(it);
      const big = k < 0 ? A : B, small = k < 0 ? B : A, n = X.powerVal(Math.abs(k));
      if (err === 'flip') return ['ans', `1 ${big} is bigger than 1 ${small}, so it takes ${n} ${small} to equal 1 ${big}.`];
      if (err === 'other') return ['ans', `Top and bottom must be equal: 1 ${big} = ${n} ${small}.`];
      return ['ans', `1 ${big} = ${n} ${small}: that’s ${Math.abs(k)} place${Math.abs(k) === 1 ? '' : 's'}.`];
    },
    revealMs: 1400,
    reveal(el, it, v, o) {
      el._form && el._form.mark(o.right);
      if (!o.right) el.querySelector('.ans').innerHTML = answerHTML(it);
    },
    errors: { flip: 'numbers on the wrong side', count: 'wrong number of places', other: 'top and bottom not equal' },
    diagnose: err => err === 'other' ? ['Doesn’t make top and bottom equal amounts.', 'Ask: is 1 m the same length as 100 cm? A conversion fraction is always worth exactly 1.'] : (X.DIAG[err] || ['', '']),
    keyHTML: `<div class="pkey2">${X.lineHTML('m')}</div>`,

    // ---- tutorial: an equation becomes a fraction ----
    tutorial(stage, api) {
      const N = 2;
      api.step(0, N); api.caption('');
      stage.innerHTML = `<div class="fq"><div class="q tut-eq">1 m <span class="eqs">=</span> 100 cm</div><div class="tbtns"><button type="button" class="tb" aria-label="Make it a fraction">›</button></div></div>`;
      stage.querySelector('.tb').addEventListener('click', () => {
        if (!api.alive()) return;
        stage.querySelector('.q').innerHTML = answerHTML({ b: 'm', top: 0, bot: -2 });
        api.caption('Equal amounts make a conversion fraction.');
        const t = stage.querySelector('.tbtns');
        t.innerHTML = '<button type="button" class="tb" aria-label="Next">›</button>';
        t.firstChild.addEventListener('click', () => {
          if (!api.alive()) return;
          api.step(1, N); api.caption('Fill in the other number.');
          const it = { b: 'm', top: -2, bot: 0, given: 'bot' };
          (function attempt() {
            stage.innerHTML = `<div class="fq"><div class="q">${fracHTML(it)}</div><button type="button" class="go">Check</button><div class="ans"></div></div>`;
            const f = F.wire(stage, v => {
              if (!api.alive()) return;
              const ok = right(it, v); f.mark(ok);
              if (ok) { api.caption('✓ 100 cm = 1 m'); setTimeout(() => { if (api.alive()) { api.step(N, N); api.done(); } }, 1400); }
              else { stage.querySelector('.ans').innerHTML = answerHTML(it); api.caption('Top and bottom must be equal. Try again.'); setTimeout(() => api.alive() && attempt(), 2200); }
            });
          })();
        }, { once: true });
      }, { once: true });
    }
  });
})();
