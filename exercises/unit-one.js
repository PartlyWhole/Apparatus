// One-Step Conversions — one conversion fraction applied to an amount (3 mi × 5,280 ft / 1 mi = 15,840 ft):
// the first time a unit cancels. Spec: specs/units.md (1b). Uses lib/chain.js, lib/units.js.
(function () {
  const U = Units;
  // the table's facts by kind (not 1 mL = 1 cm³: nothing to convert)
  const FACTS = { time: [], len: [], vol: [] };
  U.TABLE.forEach(f => { if (f[0] === 1 && f[2] === 1) return; FACTS[{ t: 'time', l: 'len', v: 'vol' }[U.KIND[f[1]]]].push(f); });
  // up: big → small (start 1–5); down: small → big (pick the answer 1–5, work back to the start amount)
  function make(dir, group) {
    const [a, small, b, big] = U.pick(FACTS[group]), n = U.ri(1, 5);
    const from = dir === 'up' ? big : small, to = dir === 'up' ? small : big;
    const qty = dir === 'up' ? n : Math.round(n * a / b * 1000) / 1000;
    return { pr: { qty, num: from, den: null, steps: [{ from, to }], target: { num: to, den: null } } };
  }
  const K = (dir, group) => ({ idea: dir, make: () => make(dir, group) });
  const LEVEL = { open: 0, probe: 1, fix: 1, warm: 2 };
  Apparatus.define({
    id: 'unit-one',
    title: 'One-Step Conversions',
    ideas: {
      up:   { name: 'To a smaller unit (mi → ft)', easy: ['up-time'], hard: ['up-time', 'up-len', 'up-vol'] },
      down: { name: 'To a bigger unit (min → hr)', easy: ['down-time'], hard: ['down-time', 'down-len', 'down-vol'] }
    },
    kinds: { 'up-time': K('up', 'time'), 'up-len': K('up', 'len'), 'up-vol': K('up', 'vol'), 'down-time': K('down', 'time'), 'down-len': K('down', 'len'), 'down-vol': K('down', 'vol') },
    opening: [{ kind: 'up-len', item: { pr: { qty: 3, num: 'mi', den: null, steps: [{ from: 'mi', to: 'ft' }], target: { num: 'ft', den: null } } } }],
    defaults: { tricky: 3 },
    nextOnRight: true,
    text: it => U.chainText(it.pr),
    speak: it => `Convert ${U.chainText(it.pr).replace(' = ?', ' to')}.`,
    ask(el, it, submit, ctx) { Chain.mount(el, it.pr, { level: LEVEL[ctx.mode] ?? 1, onDone: submit }); },
    correct: () => 0,
    isRight: (it, errs) => errs.length === 0,
    classify: (it, errs) => errs[0].type,
    feedback: (it, want, errs) => ['', errs[0].text],
    reveal() {},
    errors: U.CHAIN_ERRORS,
    diagnose: err => U.CHAIN_DIAG[err] || ['', ''],
    cheat: U.cheatHTML()
  });
})();
