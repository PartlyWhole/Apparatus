// Lines Review (G13) — one tricky question per idea from the lines exercises, no scaffolding: the test's mix.
// Nothing new is written here: each question is made, asked, graded and explained by the exercise it comes from
// (its def in Apparatus.defs), asked as in that exercise's next-session check (mode 'warm' → its lvl 0).
// Errors are kept per source as "source:error", so the tutor sees the source exercise's own advice.
// review.html loads every source exercise first. Spec: specs/geometry-next.md (G13).
(function () {
  const D = Apparatus.defs;
  // short names → source exercise ids
  const SRC = { tp: 'geo-two-points', eq: 'geo-equation', wl: 'geo-write-line', pp: 'geo-parallel-perp', mp: 'geo-midpoint', di: 'geo-distance', bi: 'geo-bisector', qu: 'geo-quad' };
  // review kind → [source, source kind]
  const K = {
    'slope-pts': ['tp', 'negs'], 'slope-eq': ['eq', 'std-frac'],
    'line-par': ['wl', 'par-line'], 'line-perp': ['wl', 'perp-line'], 'line-pts': ['wl', 'pts-line'], 'line-graph': ['wl', 'graph-line'],
    'line-hv': ['wl', 'hv-line'],
    'pgram': ['pp', 'pgram'],
    'mid': ['mp', 'big'], 'mid-words': ['mp', 'words'],
    'dist': ['di', 'num-neg'], 'dist-map': ['di', 'map-root'],
    'bis-draw': ['bi', 'draw'], 'bis-equi': ['bi', 'equi'],
    'quad-legs': ['qu', 'legs'], 'quad-trap': ['qu', 'trap'],
    'fact': ['pp', 'fact']
  };
  const src = it => D[SRC[it.s]];
  const kinds = {};
  Object.entries(K).forEach(([k, [s, sk]]) => { kinds[k] = { idea: null, make: () => ({ s, k: sk, it: D[SRC[s]].kinds[sk].make() }) }; });
  const ideas = {
    slope: { name: 'Slope (two points, an equation)', easy: ['slope-pts'], hard: ['slope-eq'] },
    line:  { name: 'Write a parallel or perpendicular line', easy: ['line-par'], hard: ['line-perp', 'line-pts', 'line-graph'] },
    mid:   { name: 'Midpoint', easy: ['mid'], hard: ['mid-words'] },
    dist:  { name: 'Distance (exact, on a map)', easy: ['dist'], hard: ['dist-map'] },
    bis:   { name: 'Perpendicular bisector', easy: ['bis-draw'], hard: ['bis-equi'] },
    quad:  { name: 'Classify the quadrilateral', easy: ['quad-legs'], hard: ['quad-trap'] },
    hv:    { name: 'Flat and vertical lines', easy: ['line-hv'], hard: ['line-hv'], late: true },
    pgram: { name: 'Opposite sides of a parallelogram', easy: ['pgram'], hard: ['pgram'], late: true },
    facts: { name: 'True or false', easy: ['fact'], hard: ['fact'], late: true }
  };
  Object.entries(ideas).forEach(([id, i]) => i.easy.concat(i.hard).forEach(k => { kinds[k].idea = id; }));
  // every source's errors, named "source:error"
  const errors = {};
  Object.entries(SRC).forEach(([s, id]) => { const e = (D[id] && D[id].errors) || {}; Object.keys(e).forEach(k => { errors[`${s}:${k}`] = `${D[id].title}: ${e[k]}`; }); });
  const split = err => { const i = String(err).indexOf(':'); return [String(err).slice(0, i), String(err).slice(i + 1)]; };

  Apparatus.define({
    id: 'geo-review',
    title: 'Lines Review',
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
      <div>slope = rise ÷ run = (y₂ − y₁) ÷ (x₂ − x₁)</div>
      <div>∥ the same slope · ⟂ flip and change the sign</div>
      <div>b: put the point into y = mx + b</div>
      <div>midpoint: the average of the x's and of the y's</div>
      <div>distance: √(run² + rise²), simplified</div>
      <div>⟂ bisector: through the midpoint, at a right angle</div>
    </div>`
  });
})();
