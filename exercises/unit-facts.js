// Unit Facts — the conversion table: multiple choice ("1 mi = ?"), then written ("1 mi = [ ] ft").
// Spec: specs/units.md (1). Uses lib/units.js, lib/forms.js, lib/places.js.
(function () {
  const U = Units, F = Forms, { shuffle } = Apparatus.util;
  const GROUP = { length: [0, 1, 2], time: [3, 4, 5, 6, 7], volume: [8, 9, 10, 11] };    // indexes into Units.TABLE
  const POOL = [3, 10, 12, 24, 60, 100, 365, 1000, 2.54, 3600, 5280, 1000000];
  let recent = [];
  // an item: { f: index into TABLE, how: 'mc' | 'ty', opts?, ans? } — "1 big = ? small"
  function make(group, how) {
    const ids = GROUP[group].filter(i => !recent.includes(i));
    const f = U.pick(ids.length ? ids : GROUP[group]);
    recent = recent.concat(f).slice(-3);
    const it = { f, how };
    if (how === 'mc') {
      const t = U.TABLE[f];
      const wrong = shuffle(POOL.filter(n => n !== t[0])).slice(0, 3);
      it.opts = shuffle([t[0]].concat(wrong));
      it.ans = it.opts.indexOf(t[0]);
    }
    return it;
  }
  const T = it => U.TABLE[it.f];
  const html = it => {
    const [a, small, b, big] = T(it);
    return it.how === 'mc'
      ? `<div class="fq"><div class="q">1 ${big} = ?</div><div class="mc"></div><div class="ans" aria-live="polite"></div></div>`
      : `<div class="fq"><div class="q">1 ${big} = ${F.num('answer', true)} ${small}</div><button type="button" class="go">Check</button><div class="ans" aria-live="polite"></div></div>`;
  };
  // which other fact a wrong number comes from (a mix-up), if any
  const mixup = (it, n) => U.TABLE.findIndex((t, i) => i !== it.f && t[0] === n);
  const K = (g, how) => ({ idea: g, make: () => make(g, how) });

  Apparatus.define({
    id: 'unit-facts',
    title: 'Unit Facts',
    ideas: {
      length: { name: 'Length (mi, yd, in)', easy: ['mc-length'], hard: ['mc-length', 'mc-length', 'ty-length', 'ty-length'] },
      time:   { name: 'Time (min, hr, day, yr)', easy: ['mc-time'], hard: ['mc-time', 'mc-time', 'ty-time', 'ty-time'] },
      volume: { name: 'Volume (L, m³, mL)', easy: ['mc-volume'], hard: ['mc-volume', 'mc-volume', 'ty-volume', 'ty-volume'] }
    },
    kinds: { 'mc-length': K('length', 'mc'), 'ty-length': K('length', 'ty'), 'mc-time': K('time', 'mc'), 'ty-time': K('time', 'ty'), 'mc-volume': K('volume', 'mc'), 'ty-volume': K('volume', 'ty') },
    defaults: { tricky: 4 },
    text: it => `1 ${T(it)[3]} = ? ${T(it)[1]} (${it.how === 'mc' ? 'choice' : 'written'})`,
    speak: it => `1 ${T(it)[3]} equals how many ${T(it)[1]}?`,
    ask(el, it, submit) {
      U.cheatSheet();
      el.innerHTML = html(it);
      if (it.how === 'mc') el._mc = F.choices(el, it.opts.map(n => `${U.fmtN(n)} ${T(it)[1]}`), submit);
      else el._form = F.wire(el, v => submit(parseFloat(v.answer.raw.replace(/,/g, ''))));
    },
    correct: it => T(it)[0],
    isRight: (it, a) => it.how === 'mc' ? a === it.ans : Math.abs(a - T(it)[0]) < 1e-9,
    classify: (it, a) => mixup(it, it.how === 'mc' ? it.opts[a] : a) >= 0 ? 'mixup' : 'fact',
    feedback(it, want, a, kind, err) {
      const [n, small, , big] = T(it), got = it.how === 'mc' ? it.opts[a] : a;
      const m = mixup(it, got);
      return ['ans', err === 'mixup' ? `${U.fmtN(got)} is from ${U.factText({ a: U.TABLE[m][0], small: U.TABLE[m][1], b: U.TABLE[m][2], big: U.TABLE[m][3] })}. Here: 1 ${big} = ${U.fmtN(n)} ${small}.` : `1 ${big} = ${U.fmtN(n)} ${small}.`];
    },
    reveal(el, it, a, o) {
      if (it.how === 'mc') el._mc.mark(a, it.ans); else el._form.mark(o.right);
    },
    errors: { fact: 'wrong number', mixup: 'number from another fact' },
    diagnose: err => err === 'mixup' ? ['Remembers the numbers but mixes up which fact they belong to.', 'Pair each number with its units out loud: “5,280 feet in a mile.”'] : ['Doesn’t know this fact yet.', 'Look at the table together, then cover it and ask again.'],
    keyHTML: U.tableHTML(),
    // first visit: the table to know
    tutorial(stage, api) {
      U.cheatSheet();
      api.step(0, 1); api.caption('The ones to know.');
      stage.innerHTML = `<div class="fq">${U.tableHTML()}<div class="tbtns"><button type="button" class="tb" aria-label="Start">›</button></div></div>`;
      stage.querySelector('.tb').addEventListener('click', () => { if (api.alive()) { api.step(1, 1); api.done(); } }, { once: true });
    }
  });
})();
