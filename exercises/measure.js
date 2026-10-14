// What It Measures — which quantity a unit measures (cm³ → volume), and the reverse (which of these measures volume?).
// Spec: specs/vocab.md. Uses lib/forms.js.
(function () {
  const F = Forms, { shuffle, any } = Apparatus.util;
  const Q = {
    length: ['m', 'cm', 'mm', 'km', 'in', 'ft', 'yd', 'mi'],
    volume: ['mL', 'cm³', 'L', 'm³', 'gal'],
    mass: ['g', 'kg', 'mg'],
    time: ['s', 'min', 'hr', 'day', 'yr'],
    base: [['K', 'temperature'], ['A', 'electric current'], ['mol', 'amount of substance'], ['cd', 'luminous intensity']],
    derived: [['N', 'force'], ['J', 'energy']]
  };
  // the quantity a unit measures, and every quantity name
  const WHAT = {};
  ['length', 'volume', 'mass', 'time'].forEach(q => Q[q].forEach(u => { WHAT[u] = q; }));
  Q.base.concat(Q.derived).forEach(([u, q]) => { WHAT[u] = q; });
  const QUANTITIES = [...new Set(Object.values(WHAT))];
  // the tempting wrong answers for each quantity (mass ↔ weight, cm³ ↔ length/area …)
  const TRAP = { mass: ['weight', 'force'], volume: ['area', 'length'], length: ['area', 'volume'], time: ['speed'], force: ['mass', 'energy'], energy: ['force', 'power'],
    temperature: ['energy', 'heat'], 'electric current': ['energy', 'voltage'], 'amount of substance': ['mass', 'volume'], 'luminous intensity': ['energy', 'temperature'] };
  const units = idea => Array.isArray(Q[idea][0]) ? Q[idea].map(x => x[0]) : Q[idea];

  // unit → quantity: the answer, its traps, and other quantities
  function whatItem(idea) {
    const u = any(units(idea)), q = WHAT[u];
    const wrong = shuffle(TRAP[q] || []).slice(0, 2);
    const rest = shuffle(QUANTITIES.filter(x => x !== q && !wrong.includes(x)));
    const opts = shuffle([q].concat(wrong, rest).slice(0, 4));
    return { how: 'what', u, q, opts, ans: opts.indexOf(q) };
  }
  // quantity → unit: one unit of it, three of other quantities (one look-alike when there is one: cm vs cm³, m vs m³, mL vs mm)
  const LOOK = { 'cm³': 'cm', 'm³': 'm', mL: 'mm', cm: 'cm³', m: 'm³', mm: 'mL', g: 'gal', kg: 'km', mg: 'mL', K: 'km', N: 'mm' };
  function whichItem(idea) {
    const u = any(units(idea)), q = WHAT[u];
    const others = Object.keys(WHAT).filter(x => WHAT[x] !== q);
    const look = LOOK[u] && WHAT[LOOK[u]] !== q ? [LOOK[u]] : [];
    const opts = shuffle([u].concat(look, shuffle(others.filter(x => !look.includes(x))).slice(0, 3 - look.length)));
    return { how: 'which', u, q, opts, ans: opts.indexOf(u) };
  }
  const ideas = {}, kinds = {};
  const NAMES = { length: 'Length (m, ft, mi…)', volume: 'Volume (mL, cm³, L…)', mass: 'Mass (g, kg)', time: 'Time (s, hr, yr…)', base: 'Other base units (K, A, mol, cd)', derived: 'Derived (N, J)' };
  Object.keys(Q).forEach(idea => {
    ideas[idea] = { name: NAMES[idea], easy: ['w-' + idea], hard: ['w-' + idea, 'h-' + idea] };
    kinds['w-' + idea] = { idea, make: () => whatItem(idea) };
    kinds['h-' + idea] = { idea, make: () => whichItem(idea) };
  });

  Apparatus.define({
    id: 'measure',
    title: 'What It Measures',
    ideas, kinds,
    text: it => it.how === 'what' ? `${it.u} measures ?` : `Which measures ${it.q}?`,
    speak: it => it.how === 'what' ? `What does ${it.u} measure?` : `Which unit measures ${it.q}?`,
    ask(el, it, submit) {
      el.innerHTML = it.how === 'what'
        ? `<div class="fq vocab"><div class="q"><span class="sym">${it.u}</span> measures…</div><div class="mc words"></div></div>`
        : `<div class="fq vocab"><div class="vq">Which one measures <b>${it.q}</b>?</div><div class="mc"></div></div>`;
      el._mc = F.choices(el, it.opts, submit);
    },
    correct: it => it.ans,
    isRight: (it, a) => a === it.ans,
    classify(it, a) {
      const got = it.opts[a];
      if (it.how === 'what') return (TRAP[it.q] || []).includes(got) ? 'trap' : 'wrong';
      return LOOK[it.u] === got ? 'trap' : 'wrong';
    },
    feedback(it, want, a, kind, err) {
      const got = it.opts[a];
      if (it.how === 'what') {
        if (it.q === 'mass' && got === 'weight') return ['', `${it.u} measures mass. Weight is a force, measured in newtons (N).`];
        return ['', `${it.u} measures ${it.q}.`];
      }
      return ['', `${got} measures ${WHAT[got]}; ${it.u} measures ${it.q}.`];
    },
    reveal(el, it, a) { el._mc.mark(a, it.ans); },
    errors: { trap: 'a tempting mix-up (mass/weight, cm/cm³…)', wrong: 'wrong quantity' },
    diagnose: err => err === 'trap'
      ? ['Falls for a close one: mass vs weight, cm vs cm³, length vs volume.', 'Point to the little ³: a cube is a volume. And kilograms are mass; weight is a force (newtons).']
      : ['Doesn’t know what this unit measures yet.', 'Group the units by what they measure together: length, volume, mass, time.']
  });
})();
