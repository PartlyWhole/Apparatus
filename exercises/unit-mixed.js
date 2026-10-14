// Mixed Conversions — facts, two-step chains and rates together, on their own (no captions).
// Spec: specs/units.md (4). Uses lib/chain.js, lib/units.js, lib/forms.js.
(function () {
  const U = Units, F = Forms;
  const RATE_KINDS = Object.keys(U.RATES), CHAIN_KINDS = Object.keys(U.PATHS);
  // an item: { fact: index } for a written fact, or { pr } for a chain
  Apparatus.define({
    id: 'unit-mixed',
    title: 'Mixed Conversions',
    ideas: {
      facts:  { name: 'Facts (1 mi = ? ft)', easy: ['fact'], hard: ['fact', 'fact', 'fact'] },
      chains: { name: 'Two-step (day → min)', easy: ['chain'], hard: ['chain', 'chain', 'chain'] },
      rates:  { name: 'Rates (mi/hr → m/s)', easy: ['rate'], hard: ['rate', 'rate', 'rate'] }
    },
    kinds: {
      fact:  { idea: 'facts', make: () => ({ fact: U.ri(0, U.TABLE.length - 1) }) },
      chain: { idea: 'chains', make: () => ({ pr: U.chainProblem(U.pick(CHAIN_KINDS)) }) },
      rate:  { idea: 'rates', make: () => ({ pr: U.rateProblem(U.pick(RATE_KINDS)) }) }
    },
    defaults: { tricky: 3 },
    nextOnRight: true,
    text: it => it.pr ? U.chainText(it.pr) : `1 ${U.TABLE[it.fact][3]} = ? ${U.TABLE[it.fact][1]}`,
    speak: it => it.pr ? `Convert ${U.chainText(it.pr).replace(' = ?', ' to')}.` : `1 ${U.TABLE[it.fact][3]} equals how many ${U.TABLE[it.fact][1]}?`,
    ask(el, it, submit) {
      
      if (it.pr) return Chain.mount(el, it.pr, { level: 2, onDone: submit });
      const t = U.TABLE[it.fact];
      el.innerHTML = `<div class="fq"><div class="q">1 ${t[3]} = ${F.num('answer', true)} ${t[1]}</div><button type="button" class="go">Check</button><div class="ans"></div></div>`;
      el._form = F.wire(el, v => submit([].concat(Math.abs(parseFloat(v.answer.raw.replace(/,/g, '')) - t[0]) < 1e-9 ? [] : [{ type: 'fact', text: `1 ${t[3]} = ${U.fmtN(t[0])} ${t[1]}.` }])));
    },
    correct: () => 0,
    isRight: (it, errs) => errs.length === 0,
    classify: (it, errs) => errs[0].type,
    feedback: (it, want, errs) => ['', errs[0].text],
    reveal(el, it, errs, o) { el._form && !it.pr && el._form.mark(o.right); },
    errors: Object.assign({ fact: 'fact not known' }, U.CHAIN_ERRORS),
    diagnose: err => err === 'fact' ? ['Doesn’t know this fact yet.', 'Back to Unit Facts for a round.'] : (U.CHAIN_DIAG[err] || ['', '']),
    cheat: U.cheatHTML()
  });
})();
