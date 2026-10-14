// Two-Step Conversions — a chain of conversion fractions, built step by step (2 day × 24 hr/1 day × 60 min/1 hr).
// Spec: specs/units.md (2). Uses lib/chain.js, lib/units.js.
(function () {
  const U = Units;
  const K = kind => ({ idea: kind.split('-')[0], make: () => ({ pr: U.chainProblem(kind) }) });
  // the opening: units given, numbers only; then guided (captions); the next-session check on their own
  const LEVEL = { open: 0, probe: 1, fix: 1, warm: 2 };
  Apparatus.define({
    id: 'unit-chain',
    title: 'Two-Step Conversions',
    ideas: {
      up:   { name: 'To a smaller unit (day → min)', easy: ['up-time'], hard: ['up-time', 'up-other'] },
      down: { name: 'To a bigger unit (s → hr)',     easy: ['down-time'], hard: ['down-time', 'down-other'] }
    },
    kinds: { 'up-time': K('up-time'), 'up-other': K('up-other'), 'down-time': K('down-time'), 'down-other': K('down-other') },
    opening: [{ kind: 'up-time', item: { pr: U.chainProblem('up-time', ['day', 'hr', 'min']) } }],
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
