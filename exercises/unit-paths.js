// Another Way — the same conversion by a different path: a solved chain is shown; the student builds another route
// (any units connected by known facts) to the same answer. Spec: specs/units.md (Another Way). Uses lib/chain.js, lib/units.js.
(function () {
  const U = Units;
  // the path shown (from Two-Step Conversions or one step), and the kind of problem it makes ('up' = start 1–5, 'down' = work back)
  const SHOWN = {
    'short-up':   { idea: 'shorter',   path: ['hr', 'min', 's'],   kind: 'up-time' },     // → hr → s in one step
    'short-down': { idea: 'shorter',   path: ['s', 'min', 'hr'],   kind: 'down-time' },   // → s → hr in one step
    'diff-vol':   { idea: 'different', path: ['m³', 'L', 'mL'],    kind: 'up-other' },    // → m³ → cm³ → mL
    'diff-back':  { idea: 'different', path: ['mL', 'L', 'm³'],    kind: 'down-other' },  // → mL → cm³ → m³
    'diff-len':   { idea: 'different', path: ['ft', 'in', 'cm'],   kind: 'up-other' },    // → ft → m → cm (cheat sheet)
    'long-day':   { idea: 'longer',    path: ['day', 'hr', 's'],   kind: 'up-time' },     // → day → hr → min → s
    'long-hr':    { idea: 'longer',    path: ['hr', 's'],          kind: 'up-time' }      // → hr → min → s
  };
  const K = k => ({ idea: SHOWN[k].idea, make: () => ({ k, pr: U.chainProblem(SHOWN[k].kind, SHOWN[k].path) }) });
  const LEVEL = { open: 1, probe: 1, fix: 1, warm: 2 };

  Apparatus.define({
    id: 'unit-paths',
    title: 'Another Way',
    ideas: {
      shorter:   { name: 'A shorter way (hr → s)',        easy: ['short-up'], hard: ['short-up', 'short-down'] },
      different: { name: 'A different way (m³ → cm³ → mL)', easy: ['diff-vol'], hard: ['diff-vol', 'diff-back', 'diff-len'] },
      longer:    { name: 'A longer way (hr → min → s)',   easy: ['long-hr'],  hard: ['long-hr', 'long-day'] }
    },
    kinds: Object.fromEntries(Object.keys(SHOWN).map(k => [k, K(k)])),
    opening: [{ kind: 'short-up', item: { k: 'short-up', pr: U.chainProblem('up-time', ['hr', 'min', 's']) } }],
    nextOnRight: true,
    text: it => `${U.chainText(it.pr)} (not ${SHOWN[it.k].path.join(' → ')})`,
    speak: it => `${U.chainText(it.pr).replace(' = ?', ' to')}, a different way than the one shown.`,
    ask(el, it, submit, ctx) {
      
      Chain.mount(el, it.pr, {
        level: LEVEL[ctx.mode] ?? 1, free: { avoid: SHOWN[it.k].path }, onDone: submit,
        above: `${Chain.solvedHTML(it.pr)}<p class="another">Another way</p>`
      });
    },
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
