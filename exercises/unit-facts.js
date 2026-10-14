// Unit Facts — the conversion table: multiple choice ("1 mi = ?"), then written ("1 mi = [ ] ft").
// Spec: specs/units.md (1). Uses lib/units.js, lib/forms.js, lib/places.js.
(function () {
  const U = Units, F = Forms, { shuffle } = Apparatus.util;
  const GROUP = { length: [0, 1, 2, 3], time: [4, 5, 6, 7, 8], volume: [9, 10, 11, 12] };    // indexes into Units.TABLE
  const POOL = [3, 10, 12, 24, 36, 60, 100, 365, 1000, 2.54, 3600, 5280, 1000000];
  let recent = [];
  // an item: { f: index into TABLE, how: 'mc' | 'ty', opts?, ans? } — "1 big = ? small"
  // fixed: a specific fact (Master every fact); otherwise a fact from the group, not one of the last few
  function make(group, how, fixed) {
    const ids = fixed != null ? [fixed] : GROUP[group].filter(i => !recent.includes(i));
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
  // Master every fact (a rule for this exercise, on by default): each fact is its own idea — multiple choice, then written —
  // so passing means every fact answered right, written; the next-session check asks every fact again
  const FACT_KINDS = {};
  U.TABLE.forEach((t, i) => { FACT_KINDS['mc-f' + i] = { idea: 'f' + i, make: () => make(null, 'mc', i) }; FACT_KINDS['ty-f' + i] = { idea: 'f' + i, make: () => make(null, 'ty', i) }; });
  const factName = i => U.factText({ a: U.TABLE[i][0], small: U.TABLE[i][1], b: U.TABLE[i][2], big: U.TABLE[i][3] });
  // interleave the groups: a length fact, a time fact, a volume fact, …
  const ORDER = [];
  for (let k = 0; k < 5; k++) ['length', 'time', 'volume'].forEach(g => { if (GROUP[g][k] != null) ORDER.push(GROUP[g][k]); });
  const FACT_IDEAS = Object.fromEntries(ORDER.map(i => ['f' + i, { name: factName(i), easy: ['mc-f' + i], hard: ['mc-f' + i, 'ty-f' + i], check: 'ty-f' + i }]));

  Apparatus.define({
    id: 'unit-facts',
    title: 'Unit Facts',
    ideas: {
      length: { name: 'Length (mi, yd, in)', easy: ['mc-length'], hard: ['mc-length', 'mc-length', 'ty-length', 'ty-length'] },
      time:   { name: 'Time (min, hr, day, yr)', easy: ['mc-time'], hard: ['mc-time', 'mc-time', 'ty-time', 'ty-time'] },
      volume: { name: 'Volume (L, m³, mL)', easy: ['mc-volume'], hard: ['mc-volume', 'mc-volume', 'ty-volume', 'ty-volume'] }
    },
    kinds: Object.assign({ 'mc-length': K('length', 'mc'), 'ty-length': K('length', 'ty'), 'mc-time': K('time', 'mc'), 'ty-time': K('time', 'ty'), 'mc-volume': K('volume', 'mc'), 'ty-volume': K('volume', 'ty') }, FACT_KINDS),
    defaults: { tricky: 4, master: true },
    rules: [['master', 'Master every fact', [[true, 'On'], [false, 'Off']], 'Every fact must be answered right, written, to pass; the next-session check asks them all. Off: a shorter mix by group.']],
    configure: S => S.master ? { ideas: FACT_IDEAS } : {},
    text: it => `1 ${T(it)[3]} = ? ${T(it)[1]} (${it.how === 'mc' ? 'choice' : 'written'})`,
    speak: it => `1 ${T(it)[3]} equals how many ${T(it)[1]}?`,
    ask(el, it, submit) {
      
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
    cheat: U.cheatHTML(),
    // first visit: the table to know
    tutorial(stage, api) {
      
      api.step(0, 1); api.caption('The ones to know.');
      stage.innerHTML = `<div class="fq">${U.tableHTML()}<div class="tbtns"><button type="button" class="tb" aria-label="Start">›</button></div></div>`;
      stage.querySelector('.tb').addEventListener('click', () => { if (api.alive()) { api.step(1, 1); api.done(); } }, { once: true });
    }
  });
})();
