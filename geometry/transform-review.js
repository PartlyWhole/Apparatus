// Transformations Review (T8) — one tricky question per idea from the Module 5 exercises, no scaffolding: the test's mix.
// Nothing new is written here: each question is made, asked, graded and explained by the exercise it comes from
// (its def in Apparatus.defs), asked as in that exercise's next-session check (mode 'warm' → its lvl 0).
// Errors are kept per source as "source:error", so the tutor sees the source exercise's own advice.
// review.html loads every source exercise first. Spec: specs/geometry-transformations.md (T8).
(function () {
  const D = Apparatus.defs;
  // short names → source exercise ids
  const SRC = { ve: 'geo-vectors', ro: 'geo-rotate', rf: 'geo-reflect', na: 'geo-name-it', tw: 'geo-two-moves', sy: 'geo-symmetry' };
  // review kind → [source, source kind]
  const K = {
    'vec-apply': ['ve', 'apply'], 'vec-pts': ['ve', 'pts'], 'vec-compass': ['ve', 'compass'],
    'rot-90': ['ro', 'q90'], 'rot-cw': ['ro', 'cw270cw'], 'rot-keep': ['ro', 'fact'], 'rot-clock': ['ro', 'clock'],
    'ref-axis': ['rf', 'ax-0'], 'ref-diag': ['rf', 'dg-0'], 'ref-line': ['rf', 'ln-0'],
    'name-turn': ['na', 'turn-1'], 'name-flip': ['na', 'flip-1'], 'name-slide': ['na', 'slide-1'],
    'two-rr': ['tw', 'rr-num'], 'two-axes': ['tw', 'axes-num'], 'two-tr': ['tw', 'tr-num'],
    'sym-ngon': ['sy', 'ngon-pick'], 'sym-comp': ['sy', 'comp-pick'], 'sym-back': ['sy', 'back']
  };
  const src = it => D[SRC[it.s]];
  const kinds = {};
  Object.entries(K).forEach(([k, [s, sk]]) => { kinds[k] = { idea: null, make: () => ({ s, k: sk, it: D[SRC[s]].kinds[sk].make() }) }; });
  const ideas = {
    vec:  { name: 'Vectors and translations', easy: ['vec-apply'], hard: ['vec-pts', 'vec-compass'] },
    rot:  { name: 'Rotations about the origin', easy: ['rot-90'], hard: ['rot-cw', 'rot-keep'] },
    ref:  { name: 'Reflections', easy: ['ref-axis'], hard: ['ref-diag', 'ref-line'] },
    name: { name: 'Name the transformation', easy: ['name-turn'], hard: ['name-flip', 'name-slide'] },
    two:  { name: 'Two in a row', easy: ['two-rr'], hard: ['two-axes', 'two-tr'] },
    sym:  { name: 'Symmetry', easy: ['sym-ngon'], hard: ['sym-comp', 'sym-back'] },
    turn: { name: 'How far it turned (clock)', easy: ['rot-clock'], hard: ['rot-clock'], late: true }
  };
  Object.entries(ideas).forEach(([id, i]) => i.easy.concat(i.hard).forEach(k => { kinds[k].idea = id; }));
  // every source's errors, named "source:error"
  const errors = {};
  Object.entries(SRC).forEach(([s, id]) => { const e = (D[id] && D[id].errors) || {}; Object.keys(e).forEach(k => { errors[`${s}:${k}`] = `${D[id].title}: ${e[k]}`; }); });
  const split = err => { const i = String(err).indexOf(':'); return [String(err).slice(0, i), String(err).slice(i + 1)]; };

  Apparatus.define({
    id: 'geo-transform-review',
    title: 'Transformations Review',
    ideas, kinds,
    opening: [],
    defaults: { fix: 1, tricky: 1, intro: false },
    nextOnRight: true,
    text: it => src(it).text ? src(it).text(it.it) : '',
    speak: it => src(it).speak ? src(it).speak(it.it) : '',
    // as in the source's next-session check: no scaffolding
    ask(el, it, submit, ctx) { src(it).ask(el, it.it, submit, Object.assign({}, ctx, { mode: 'warm' })); },
    correct: it => src(it).correct(it.it),
    isRight: (it, a) => src(it).isRight(it.it, a),
    classify: (it, a) => `${it.s}:${src(it).classify ? src(it).classify(it.it, a) : 'other'}`,
    feedback: (it, want, a, kind, err) => src(it).feedback(it.it, want, a, it.k, split(err)[1]),
    reveal(el, it, a, o) { const r = src(it).reveal; if (r) r.call(src(it), el, it.it, a, Object.assign({}, o, o.err ? { err: split(o.err)[1] } : {})); },
    errors,
    diagnose(err) { const [s, e] = split(err), d = D[SRC[s]]; return d && d.diagnose ? d.diagnose(e) : ['', '']; },
    keyHTML: `<div class="gk">
      <div>slide by ⟨a, b⟩: (x + a, y + b)</div>
      <div>turn 90° counterclockwise: (−y, x) · 180°: (−x, −y) · 90° clockwise: (y, −x)</div>
      <div>flip across the x-axis: (x, −y) · the y-axis: (−x, y) · y = x: (y, x) · y = −x: (−y, −x)</div>
      <div>a regular n-gon: n lines of symmetry, smallest turn 360° ÷ n</div>
    </div>`
  });
})();
