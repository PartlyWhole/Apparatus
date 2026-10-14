// Vocabulary — the chapter's 13 terms, multiple choice two ways: a clue → the term, and a different (creative) question
// per term: a picture, a formula, a fraction drawn out, odd one out, a trap, a bit of history. Every term gated.
// Spec: specs/vocab.md. Uses lib/forms.js.
(function () {
  const F = Forms, { shuffle } = Apparatus.util;
  // pictures (line drawings in the text color)
  const CYL = `<svg class="vpic" viewBox="0 0 120 120" aria-label="a cylinder"><ellipse cx="60" cy="24" rx="40" ry="12" fill="none" stroke="currentColor" stroke-width="3"/><path d="M20 24 V96 A40 12 0 0 0 100 96 V24" fill="none" stroke="currentColor" stroke-width="3"/><path d="M20 96 A40 12 0 0 1 100 96" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="5 5" opacity=".5"/></svg>`;
  const BOX = `<svg class="vpic" viewBox="0 0 130 110" aria-label="a box"><path d="M15 35 L85 35 L85 100 L15 100 Z M15 35 L45 12 L115 12 L85 35 M115 12 L115 77 L85 100" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M15 100 L45 77 L115 77 M45 77 L45 12" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="5 5" opacity=".5"/></svg>`;
  const FRAC = `<span class="vfrac"><span>100 cm</span><span class="vbar"></span><span>1 m</span></span>`;

  // each term: its clue (doesn't give the word away) and its creative question [prompt, right, wrongs]
  const T = [
    { t: 'base unit', clue: 'One of the seven SI units that all other SI units are built from.',
      x: ['Which one is a base unit?', () => shuffle(['second', 'meter', 'kilogram', 'ampere'])[0], ['joule', 'newton', 'liter']] },
    { t: 'derived unit', clue: 'A unit made by combining base units, like the joule for energy.',
      x: ['Which one is a derived unit?', () => shuffle(['joule', 'newton'])[0], ['meter', 'second', 'kilogram']] },
    { t: 'International System of Units', clue: 'The full name of the system of units used in science today, published in 1960.',
      x: ['The International System of Units was published in…', () => '1960', ['1789', '1875', '2019']] },
    { t: 'kilogram', clue: 'The SI base unit of mass. On earth, one weighs about 2.2 pounds.',
      x: ['A kilogram measures…', () => 'mass', ['weight', 'force', 'volume']] },
    { t: 'liter', clue: 'A unit of volume used in science but not an official SI unit; 1,000 cm³.',
      x: ['Which one is NOT an official SI unit?', () => 'liter', ['meter', 'kilogram', 'second']] },
    { t: 'meter', clue: 'The SI base unit of distance, just a few inches longer than a yard.',
      x: ['A meter is…', () => 'a few inches longer than a yard', ['a little shorter than a foot', 'exactly 100 inches', 'about half a mile']] },
    { t: 'metric prefix', clue: 'A multiplier put on a unit to scale it up or down, like kilo– or milli–.',
      x: ['In “centimeter”, the centi– is a…', () => 'metric prefix', ['base unit', 'derived unit', 'unit conversion factor']] },
    { t: 'metric system', clue: 'What Americans often call the SI; it began during the French Revolution.',
      x: ['The metric system began in…', () => 'France', ['England', 'the United States', 'Germany']] },
    { t: 'right circular cylinder', clue: 'A shape with a circular base and a curved side at right angles to it.',
      x: [`${CYL}This shape is a…`, () => 'right circular cylinder', ['right rectangular solid', 'cone', 'sphere']], f: ['V = πr²h is the volume of a…', 'right circular cylinder'] },
    { t: 'right rectangular solid', clue: 'A solid made of rectangles and right angles; its volume is L · W · H.',
      x: [`${BOX}This shape is a…`, () => 'right rectangular solid', ['right circular cylinder', 'pyramid', 'cube']], f: ['V = L · W · H is the volume of a…', 'right rectangular solid'] },
    { t: 'second', clue: 'The SI base unit of time; its definition affects every other base unit’s definition except one.',
      x: ['Which base unit’s definition affects every other base unit’s except one?', () => 'second', ['meter', 'kilogram', 'mole']] },
    { t: 'SI System', clue: 'The usual short name for the International System of Units, run from Sèvres, France.',
      x: ['The SI System is run from…', () => 'Sèvres, France', ['London, England', 'Geneva, Switzerland', 'Washington, D.C.']] },
    { t: 'unit conversion factor', clue: 'A fraction whose top and bottom are the same amount written two ways: a convenient way of writing 1.',
      x: [`${FRAC}This is a…`, () => 'unit conversion factor', ['metric prefix', 'derived unit', 'base unit']] }
  ];
  // the three names for the SI never compete as answers to each other's clues
  const SAME = ['International System of Units', 'SI System', 'metric system'];
  const NEAR = { 'base unit': ['derived unit'], 'derived unit': ['base unit'], 'right circular cylinder': ['right rectangular solid'], 'right rectangular solid': ['right circular cylinder'], kilogram: ['meter', 'liter'], meter: ['kilogram', 'liter'], liter: ['meter', 'kilogram'] };

  function clueItem(i) {
    const term = T[i].t;
    // never offer a second right answer: the SI names for each other, and "base unit" for kilogram, meter and second
    const pool = T.map(x => x.t).filter(t => t !== term && !(SAME.includes(term) && SAME.includes(t)) && !(t === 'base unit' && ['kilogram', 'meter', 'second'].includes(term)));
    const near = (NEAR[term] || []).filter(t => pool.includes(t));
    const opts = shuffle([term].concat(near, shuffle(pool.filter(t => !near.includes(t)))).slice(0, 4));
    if (!opts.includes(term)) opts[0] = term;
    const o = shuffle(opts);
    return { i, how: 'clue', q: T[i].clue, opts: o, ans: o.indexOf(term) };
  }
  function creativeItem(i) {
    const x = T[i].f && Math.random() < 0.5 ? [T[i].f[0], () => T[i].f[1], T[i].x[2]] : T[i].x;
    const right = x[1](), o = shuffle([right].concat(x[2]));
    return { i, how: 'x', q: x[0], opts: o, ans: o.indexOf(right) };
  }

  const ideas = {}, kinds = {};
  T.forEach((x, i) => {
    ideas['t' + i] = { name: x.t, easy: ['c' + i], hard: ['c' + i, 'x' + i], check: 'c' + i };
    kinds['c' + i] = { idea: 't' + i, make: () => clueItem(i) };
    kinds['x' + i] = { idea: 't' + i, make: () => creativeItem(i) };
  });

  Apparatus.define({
    id: 'vocab',
    title: 'Vocabulary',
    ideas, kinds,
    nextOnRight: false,
    // the cheat sheet: every term with its clue, A to Z
    cheat: `<div class="vcheat">${T.slice().sort((a, b) => a.t.localeCompare(b.t)).map(x => `<p><b>${x.t}</b><span>${x.clue}</span></p>`).join('')}</div>`,
    text: it => it.how === 'clue' ? `clue → ${T[it.i].t}` : `${T[it.i].t}: ${it.q.replace(/<[^>]+>/g, '')}`,
    speak: it => it.q.replace(/<[^>]+>/g, ' '),
    ask(el, it, submit) {
      el.innerHTML = `<div class="fq vocab"><div class="vq">${it.q}</div><div class="mc words"></div></div>`;
      el._mc = F.choices(el, it.opts, submit);
    },
    correct: it => it.ans,
    isRight: (it, a) => a === it.ans,
    classify: (it, a) => {
      const got = it.opts[a];
      return T.some(x => x.t === got) && (NEAR[T[it.i].t] || []).includes(got) ? 'near' : 'wrong';
    },
    // a miss: the right answer, and for the creative questions the term's clue too
    feedback(it, want, a) {
      const right = it.opts[it.ans];
      return ['', it.how === 'clue' ? `It’s the ${right}.` : `The answer is “${right}”. ${T[it.i].clue}`];
    },
    reveal(el, it, a) { el._mc.mark(a, it.ans); },
    errors: { near: 'mixed up with a close term', wrong: 'wrong answer' },
    diagnose: err => err === 'near'
      ? ['Mixes up two close terms (base vs derived unit, cylinder vs rectangular solid…).', 'Ask what makes them different: base units stand alone; derived ones combine base units.']
      : ['Doesn’t know this term yet.', 'Read the clue together, then ask them to say it in their own words.']
  });
})();
