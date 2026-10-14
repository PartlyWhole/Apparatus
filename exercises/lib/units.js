// Units — the conversion facts, unit sizes (for checking any equal pair), the table, and the cheat sheet.
// Spec: specs/units.md. Styles: chain.css (table, cheat sheet).
(function () {
  // how big each unit is, in one base unit per kind (seconds, meters, cubic meters): only used to check that two amounts are equal
  const SIZE = {
    s: 1, min: 60, hr: 3600, day: 86400, yr: 31536000,
    in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344, mm: 0.001, cm: 0.01, m: 1, km: 1000,
    'cm³': 1e-6, mL: 1e-6, L: 1e-3, 'm³': 1, gal: 3.785e-3
  };
  const KIND = { s: 't', min: 't', hr: 't', day: 't', yr: 't', in: 'l', ft: 'l', yd: 'l', mi: 'l', mm: 'l', cm: 'l', m: 'l', km: 'l', 'cm³': 'v', mL: 'v', L: 'v', 'm³': 'v', gal: 'v' };
  // facts: [a, small, b, big] means a small = b big. TABLE is to know; OPTIONAL is the cheat sheet; PREFIX facts were learned before.
  const TABLE = [
    [5280, 'ft', 1, 'mi'], [3, 'ft', 1, 'yd'], [2.54, 'cm', 1, 'in'],
    [60, 's', 1, 'min'], [60, 'min', 1, 'hr'], [24, 'hr', 1, 'day'], [365, 'day', 1, 'yr'], [3600, 's', 1, 'hr'],
    [1000, 'cm³', 1, 'L'], [1000000, 'cm³', 1, 'm³'], [1000, 'L', 1, 'm³'], [1, 'mL', 1, 'cm³']
  ];
  const OPTIONAL = [[0.3048, 'm', 1, 'ft'], [1.609, 'km', 1, 'mi'], [1609, 'm', 1, 'mi'], [3.785, 'L', 1, 'gal']];
  const PREFIXED = [[100, 'cm', 1, 'm'], [1000, 'm', 1, 'km'], [10, 'mm', 1, 'cm'], [1000, 'mL', 1, 'L']];

  const fmtN = n => { const s = String(n); const [i, f] = s.split('.'); return i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (f ? '.' + f : ''); };
  // are a·u and b·v the same amount (within 0.3%, so 1,609 m = 1 mi passes)?
  const equal = (a, u, b, v) => KIND[u] === KIND[v] && Math.abs(a * SIZE[u] - b * SIZE[v]) <= 0.003 * Math.max(a * SIZE[u], b * SIZE[v]);
  // the fact connecting two units, as { a, small, b, big }
  function fact(u, v) {
    for (const f of TABLE.concat(OPTIONAL, PREFIXED)) {
      if ((f[1] === u && f[3] === v) || (f[1] === v && f[3] === u)) return { a: f[0], small: f[1], b: f[2], big: f[3] };
    }
    return null;
  }
  const factText = f => `${fmtN(f.a)} ${f.small} = ${fmtN(f.b)} ${f.big}`;

  function tableHTML() {
    const row = f => `<span>${fmtN(f[0])} ${f[1]}</span><span>=</span><span>${fmtN(f[2])} ${f[3]}</span>`;
    return `<div class="utable">${TABLE.map(row).join('')}</div>`;
  }

  // the cheat sheet: a small button bottom-left; the facts students don't need to memorize
  function cheatSheet() {
    if (document.querySelector('.cs-btn')) return;
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'cs-btn'; btn.textContent = 'Cheat sheet'; btn.setAttribute('aria-expanded', 'false');
    const panel = document.createElement('div');
    panel.className = 'cs-panel'; panel.hidden = true; panel.setAttribute('role', 'note');
    panel.innerHTML = OPTIONAL.map(f => `<span>${fmtN(f[0])} ${f[1]}</span><span>=</span><span>${fmtN(f[2])} ${f[3]}</span>`).join('');
    btn.addEventListener('click', e => { e.stopPropagation(); panel.hidden = !panel.hidden; btn.setAttribute('aria-expanded', String(!panel.hidden)); });
    document.addEventListener('click', e => { if (!panel.hidden && !panel.contains(e.target) && e.target !== btn) { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); } });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); } });
    document.body.append(panel, btn);
  }

  // ---- problem banks (shared by the unit exercises) ----
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  // two-step chains: the path of units; 'up' ends in a smaller unit (bigger number), 'down' in a bigger one
  const PATHS = {
    'up-time':    [['day', 'hr', 'min'], ['hr', 'min', 's'], ['yr', 'day', 'hr'], ['day', 'hr', 's']],
    'up-other':   [['km', 'm', 'cm'], ['m³', 'L', 'mL'], ['mi', 'ft', 'yd']],
    'down-time':  [['s', 'min', 'hr'], ['min', 'hr', 'day'], ['hr', 'day', 'yr']],
    'down-other': [['cm', 'm', 'km'], ['mL', 'L', 'm³'], ['yd', 'ft', 'mi']]
  };
  // a chain problem from a path; up: start with 1–5; down: pick the answer (1–5) and work back to the start amount
  function chainProblem(kind, path) {
    path = path || pick(PATHS[kind]);
    const steps = path.slice(1).map((to, i) => ({ from: path[i], to }));
    const last = path[path.length - 1], first = path[0];
    let qty = ri(1, 5);
    if (/^down/.test(kind)) qty = Math.round(qty * SIZE[last] / SIZE[first]);
    return { qty, num: first, den: null, steps, target: { num: last, den: null } };
  }
  // rates: one step for the top unit, one for the bottom
  const RATES = {
    mph: { q: [30, 45, 60], num: 'mi', den: 'hr', to: ['m', 's'] },
    kmh: { q: [36, 72, 90], num: 'km', den: 'hr', to: ['m', 's'] },
    ms:  { q: [10, 20, 25], num: 'm', den: 's', to: ['km', 'hr'] },
    fts: { q: [44, 88], num: 'ft', den: 's', to: ['mi', 'hr'] },
    lmin: { q: [3, 6, 12], num: 'L', den: 'min', to: ['mL', 's'] },
    cms: { q: [250, 500], num: 'cm³', den: 's', to: ['L', 'min'] }
  };
  function rateProblem(kind) {
    const r = RATES[kind];
    return { qty: pick(r.q), num: r.num, den: r.den, steps: [{ from: r.num, to: r.to[0] }, { from: r.den, to: r.to[1] }], target: { num: r.to[0], den: r.to[1] } };
  }
  const chainText = pr => `${fmtN(pr.qty)} ${pr.num}${pr.den ? '/' + pr.den : ''} = ? ${pr.target.num}${pr.target.den ? '/' + pr.target.den : ''}`;
  // what a chain mistake usually means, for the analytics page
  const CHAIN_DIAG = {
    side: ['Puts the unit to cancel on the same side it already is.', 'Point to where the unit is now (top or bottom): to cancel, it goes on the other side.'],
    unit: ['Doesn’t see which unit comes next on the way to the answer.', 'Ask: what do you know that connects day to something smaller? That fact picks the next unit.'],
    number: ['Uses numbers that don’t make top and bottom equal.', 'Say the fact out loud first (24 hr = 1 day), then copy it into the fraction.'],
    flip: ['Puts the fact’s numbers on the wrong units (1 hr / 24 day).', 'Read the fraction as an equation: 24 hr = 1 day. The smaller unit gets the bigger number.'],
    answer: ['Sets the chain up right but multiplies or divides wrong.', 'Write out the numbers left after cancelling, then multiply the tops and divide by the bottoms.']
  };
  const CHAIN_ERRORS = { side: 'unit on the wrong side', unit: 'wrong next unit', number: 'top and bottom not equal', flip: 'numbers flipped', answer: 'arithmetic' };

  window.Units = { SIZE, KIND, TABLE, OPTIONAL, PREFIXED, fmtN, equal, fact, factText, tableHTML, cheatSheet, PATHS, chainProblem, RATES, rateProblem, chainText, CHAIN_DIAG, CHAIN_ERRORS, pick, ri };
})();
