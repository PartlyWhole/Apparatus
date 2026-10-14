// Rates — convert two units at once (60 mi/hr → m/s): one fraction for the top unit, one for the bottom.
// Spec: specs/units.md (3). Uses lib/chain.js, lib/units.js.
(function () {
  const U = Units;
  const K = (idea, kind) => ({ idea, make: () => ({ pr: U.rateProblem(kind) }) });
  const LEVEL = { open: 0, probe: 1, fix: 1, warm: 2 };
  Apparatus.define({
    id: 'unit-rates',
    title: 'Rates',
    ideas: {
      speed: { name: 'Speed (mi/hr → m/s)', easy: ['kmh'], hard: ['mph', 'ms', 'fts'] },
      flow:  { name: 'Flow (L/min → mL/s)', easy: ['lmin'], hard: ['lmin', 'cms'] }
    },
    kinds: { kmh: K('speed', 'kmh'), mph: K('speed', 'mph'), ms: K('speed', 'ms'), fts: K('speed', 'fts'), lmin: K('flow', 'lmin'), cms: K('flow', 'cms') },
    opening: [{ kind: 'kmh', item: { pr: Object.assign(U.rateProblem('kmh'), { qty: 90 }) } }],
    nextOnRight: true,
    text: it => U.chainText(it.pr),
    speak: it => `Convert ${U.chainText(it.pr).replace(' = ?', ' to')}.`,
    ask(el, it, submit, ctx) { U.cheatSheet(); Chain.mount(el, it.pr, { level: LEVEL[ctx.mode] ?? 1, onDone: submit }); },
    correct: () => 0,
    isRight: (it, errs) => errs.length === 0,
    classify: (it, errs) => errs[0].type,
    feedback: (it, want, errs) => ['', errs[0].text],
    reveal() {},
    errors: U.CHAIN_ERRORS,
    diagnose: err => U.CHAIN_DIAG[err] || ['', ''],
    keyHTML: U.tableHTML()
  });
})();
