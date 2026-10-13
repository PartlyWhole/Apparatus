/* Fraction Path: a ramped sequence of fraction-board and unit-conversion skills with spaced repetition.
 *
 * The included skills (see pace below) are learned in order. A new skill is mastered after T.master correct
 * answers in a row; it then enters Leitner box 1. Mastered skills come back for review when T.gap[box] problems
 * have been answered since, or T.days[box] days have passed, whichever is first. While a skill is being learned,
 * reviews are interleaved with new material (at least T.newBetween new problems between reviews). A correct review
 * moves the skill up a box (max 5); a wrong one sends it back to box 1. An answer counts as wrong if any Check
 * failed, or if the problem was skipped. Within a skill, difficulty (level 0–2) ramps with the streak while
 * learning, and follows the box while reviewing.
 */
(function () {
  'use strict';
  const QUICK_MASTER = 2, QUICK_LEVEL = [1, 2];   // the first skills: two in a row, starting at medium
  const masterFor = id => SKILLS.find(s => s.id === id).quick ? Math.min(QUICK_MASTER, T.master) : T.master;
  const KEY = 'apparatus.fraction-path.v2';

  // ================= pace: one knob from cram (0) to full (1) =================
  // Every tuning constant is derived here; each one moves monotonically with pace.
  //                               pace 0 (Cram)          0.5                     1 (Full)
  //   master   right in a row       2                      3                       5
  //   start    first level          1 (medium)             0.5                     0 (easy)
  //   step     level per right      1                      0.75                    0.5     (reaches level 2 on the last one)
  //   tier     skills included      core only              + extra practice        + all
  //   gap[b]   problems until review  2,3,5,8,13           3,5,10,17,31            4,8,16,32,64
  //   days[b]  days until review    3h,6h,12h,1d,2d        8.5h,19h,1.8,4,9 d      1,2.5,6.3,16,39 d
  //   newBetween  new problems between reviews while learning: 2 … 2 … 1
  const PACE_KEY = 'apparatus.pace';
  const lerp = (a, b, t) => a + (b - a) * t;
  function tune(p) {
    const master = Math.round(lerp(2, 4.5, p));
    const start = lerp(1, 0, p);
    const g1 = lerp(2, 4, p), gm = lerp(1.6, 2, p);           // review gap in problems: g1 · gm^(box−1)
    const d1 = 0.125 * Math.pow(8, p), dm = lerp(2, 2.5, p);  // review gap in days: d1 · dm^(box−1)
    const box = [1, 2, 3, 4, 5];
    return {
      pace: p,
      master,
      start,
      step: (2 - start) / Math.max(1, master - 1),
      tier: 1 + (p >= 1 / 3) + (p >= 2 / 3),
      gap: [0, ...box.map(b => Math.round(g1 * Math.pow(gm, b - 1)))],
      days: [0, ...box.map(b => d1 * Math.pow(dm, b - 1))],
      newBetween: Math.round(lerp(2, 1, p))
    };
  }
  function initialPace() {
    const u = parseFloat(new URLSearchParams(location.search).get('pace'));
    if (Number.isFinite(u)) { const p = Math.min(1, Math.max(0, u)); try { localStorage.setItem(PACE_KEY, String(p)); } catch (_) {} return p; }
    try { const s = parseFloat(localStorage.getItem(PACE_KEY)); if (Number.isFinite(s)) return Math.min(1, Math.max(0, s)); } catch (_) {}
    return 1;
  }
  let T = tune(initialPace());

  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[ri(0, a.length - 1)];
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = ri(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
  const pf = FractionBoard.parseFactor, fh = FractionBoard.html, parseFraction = FractionBoard.internals.parseFraction;
  const fracHTML = (t, b) => `<span class="fb-vfrac"><span>${t}</span><span>${b}</span></span>`;
  const $ = id => document.getElementById(id);

  // ================= fraction checks (from the exercises page) =================
  function ratio(f) {
    if (f.t === 'n') return [BigInt(f.d), 10n ** BigInt(f.s)];
    if (f.t === 'p') return f.e >= 0 ? [10n ** BigInt(f.e), 1n] : [1n, 10n ** BigInt(-f.e)];
    return [1n, 1n];
  }
  const isUnity = f => f.t !== 'u' && f.t !== 'b' && (() => { const [a, b] = ratio(f); return a === b; })();
  function totals(st) {
    let n = 1n, d = 1n; const units = {}; let count = 0;
    st.fracs.forEach(fr => {
      fr.num.forEach(f => { if (isUnity(f)) return; count++; if (f.t === 'u') units[f.u + '^' + f.k] = (units[f.u + '^' + f.k] || 0) + 1; else { const [a, b] = ratio(f); n *= a; d *= b; } });
      fr.den.forEach(f => { if (isUnity(f)) return; count++; if (f.t === 'u') units[f.u + '^' + f.k] = (units[f.u + '^' + f.k] || 0) - 1; else { const [a, b] = ratio(f); n *= b; d *= a; } });
    });
    return { n, d, units, count };
  }
  function unitsOnBothSides(st) {
    const top = new Set(), bot = new Set(), both = [];
    st.fracs.forEach(fr => { fr.num.forEach(f => f.t === 'u' && top.add(f.u + '^' + f.k)); fr.den.forEach(f => f.t === 'u' && bot.add(f.u + '^' + f.k)); });
    top.forEach(u => { if (bot.has(u)) both.push(u.replace(/\^1$/, '').replace(/\^(-?\d+)$/, '<sup>$1</sup>')); });
    return both;
  }
  const bgcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
  // factors that still have an equal partner across the bar (numbers, powers of ten, units)
  function cancelPairs(st) {
    const top = [], bot = [];
    st.fracs.forEach(fr => {
      fr.num.forEach(f => { if (f.t !== 'b' && !isUnity(f)) top.push(f); });
      fr.den.forEach(f => { if (f.t !== 'b' && !isUnity(f)) bot.push(f); });
    });
    const out = [];
    top.forEach(f => { const h = FractionBoard.html(f); if (bot.some(g => FractionBoard.internals.same(f, g)) && !out.includes(h)) out.push(h); });
    return out;
  }
  function checkCancel(st) {
    const c = cancelPairs(st);
    if (c.length) return [false, `${c.join(', ')} can still cancel.`];
    return [true, ''];
  }
  function checkPowers(st) {
    const t = totals(st);
    if (t.count > 1) return [false, 'Not one power of ten yet.'];
    if (t.count === 1) {
      const only = st.fracs.flatMap(fr => [...fr.num, ...fr.den]).find(f => !isUnity(f));
      if (only.t === 'n' && !(only.s === 0 && only.d === '10')) return [false, `Write ${fh(only)} as 10ⁿ.`];
    }
    return [true, ''];
  }
  function checkGoal(st, p) {
    const t = totals(st);
    if (st.fracs.length > 1) return [false, 'Combine into one fraction.'];
    const [gt, gb] = p.goal.map(BigInt);
    if (t.n === gt && t.d === gb) return [true, ''];
    if (t.n * gb === t.d * gt) return [false, 'Equal, but not the same form.'];
    return [false, `That's ${fracHTML(t.n, t.d)}`];
  }

  // ================= fraction generators =================
  const UN = ['m', 's', 'kg', 'g', 'hr', 'min', 'cm', 'L'];
  function coprime(list) {
    for (;;) { const a = pick(list), b = pick(list); if (a !== b && gcd(a, b) === 1) return [a, b]; }
  }
  const join = fr => fr.map(f => shuffle(f.num.slice()).join(' ') + ' / ' + shuffle(f.den.slice()).join(' '));
  const place = (fr, x, k) => { const a = ri(0, k - 1); let b = ri(0, k - 1); if (k > 1 && b === a) b = (a + 1) % k; fr[a].num.push(x); fr[b].den.push(x); };
  const blank = k => Array.from({ length: k }, () => ({ num: [], den: [] }));

  // 1. cancel matching numbers
  function genNum(l) {
    const k = l === 2 ? 2 : 1, fr = blank(k);
    const pairs = shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15]).slice(0, l === 0 ? 1 : 2);
    pairs.forEach(x => place(fr, x, k));
    const [a, b] = coprime([2, 3, 5, 7, 11].filter(x => !pairs.includes(x)));
    fr[0].num.push(a); fr[k - 1].den.push(b);
    return { spec: join(fr) };
  }
  // 2. cancel units (and numbers)
  function genUnit(l) {
    const k = l === 0 ? 1 : 2, fr = blank(k);
    const us = shuffle(UN.slice());
    us.slice(0, l === 2 ? 2 : 1).forEach(u => place(fr, u, k));
    if (l > 0) place(fr, pick([3, 4, 5, 6, 7, 8, 9]), k);
    const [a, b] = coprime([2, 3, 5, 7]);
    fr[0].num.push(a); fr[k - 1].den.push(b);
    if (l > 0) fr[ri(0, k - 1)][Math.random() < 0.5 ? 'num' : 'den'].push(us[3]);
    return { spec: join(fr) };
  }
  // 4. several fractions, everything mixed
  function genMixed(l) {
    const k = l === 0 ? 2 : ri(2, 3), fr = blank(k);
    const pairs = [...shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15]).slice(0, l === 0 ? 1 : ri(2, 3)), ...shuffle(UN.slice()).slice(0, l === 0 ? 1 : ri(1, 2))];
    pairs.forEach(x => place(fr, x, k));
    const lt = pick([4, 6, 8, 9, 3, 5, 7, 2]); let lb = pick([6, 9, 10, 3, 4, 5, 7, 2]); while (lb === lt) lb = pick([6, 9, 10, 3, 4, 5, 7, 2]);
    fr[ri(0, k - 1)].num.push(lt); fr[ri(0, k - 1)].den.push(lb);
    const u = pick(UN.filter(x => !pairs.includes(x)));
    fr[ri(0, k - 1)][Math.random() < 0.5 ? 'num' : 'den'].push(u);
    return { spec: join(fr) };
  }

  // powers of ten: exponents, then how each one is written
  const asDigits = e => e >= 0 ? '1' + '0'.repeat(e) : '0.' + '0'.repeat(-e - 1) + '1';
  function powSpec(fracs, form) {
    const sum = fracs.reduce((s, f) => s + f.num.reduce((a, b) => a + b, 0) - f.den.reduce((a, b) => a + b, 0), 0);
    if (sum === 0) return null;
    return fracs.map(f => ['num', 'den'].map(r => f[r].map(e => form(e)).join(' ')).join(' / '));
  }
  function genPow(kind, l) {
    for (;;) {
      let fr, form;
      const pos = () => ri(1, 5);
      if (l === 0) { const a = ri(2, 5); fr = [{ num: [a], den: [ri(1, a - 1)] }]; }
      else if (l === 1) { fr = [{ num: [pos(), pos()], den: [ri(1, 6)] }]; }
      else { fr = [{ num: [pos()], den: [pos()] }, { num: [pos(), pos()].slice(0, ri(1, 2)), den: [pos()] }]; }
      if (kind === 'p10') form = e => `10^${e}`;
      if (kind === 'forms') form = l === 0 ? (e => asDigits(e)) : (e => (Math.random() < 0.5 ? asDigits(e) : `10^${e}`));
      if (kind === 'neg') {
        const neg = e => (Math.random() < 0.5 ? -e : e);
        fr = fr.map(f => ({ num: f.num.map(neg), den: f.den.map(neg) }));
        if (![...fr.flatMap(f => [...f.num, ...f.den])].some(e => e < 0)) fr[0].den[0] = -fr[0].den[0];
        form = l === 0 ? (e => `10^${e}`) : (e => (Math.random() < 0.5 && e >= -3 ? asDigits(e) : `10^${e}`));
      }
      const spec = powSpec(fr, form);
      if (spec) return { spec };
    }
  }

  // goal fractions
  function genGoal(kind, l) {
    const a = ri(1, l === 0 ? 5 : 9), b = pick([2, 3, 4, 5, 6, 7, 8, 9].filter(x => x !== a && gcd(x, a) === 1));
    if (kind === 'up') {
      const m = l === 0 ? ri(2, 3) : l === 1 ? ri(2, 6) : ri(4, 12);
      return { spec: [`${a} / ${b}`], goal: [a * m, b * m] };
    }
    if (kind === 'down') {
      const m = l === 0 ? pick([2, 3]) : l === 1 ? ri(2, 6) : pick([6, 8, 9, 10, 12]);
      return { spec: [`${a} ${m} / ${b} ${m}`], goal: [a, b] };
    }
    let p = ri(2, 5), q = ri(2, 5); while (p === q) q = ri(2, 5);
    if (l === 0) return { spec: [`${a} / ${b}`], goal: Math.random() < 0.5 ? [a * p, b] : [a, b * q] };
    if (l === 1) return { spec: [`${a} / ${b}`], goal: [a * p, b * q] };
    let m = ri(2, 3); while (m === p || m === q) m++;
    return { spec: [`${a} ${m} / ${b} ${m}`], goal: [a * p, b * q] };
  }

  // ================= unit conversions =================
  const UNITS = {
    m: ['L', 1], km: ['L', 1e3], cm: ['L', 1e-2], mm: ['L', 1e-3], 'µm': ['L', 1e-6],
    in: ['L', 0.0254], ft: ['L', 0.3048], yd: ['L', 0.9144], mi: ['L', 1609.344],
    s: ['T', 1], min: ['T', 60], hr: ['T', 3600], dy: ['T', 86400], yr: ['T', 31536000],
    g: ['M', 1], kg: ['M', 1e3], mg: ['M', 1e-3], 'µg': ['M', 1e-6],
    L: ['L3', 1e-3], mL: ['L3', 1e-6], 'µL': ['L3', 1e-9], gal: ['L3', 0.003785411784],
    W: ['P', 1], kW: ['P', 1e3], MW: ['P', 1e6], J: ['E', 1], kJ: ['E', 1e3]
  };
  function family(u, k) {
    const d = UNITS[u] && UNITS[u][0];
    if (!d) return null;
    if (d === 'L3' || (d === 'L' && k === 3)) return 'volume';
    return { L: 'length', T: 'time', M: 'mass', P: 'power', E: 'energy' }[d];
  }
  const PIECES = {
    length: ['mi', 'yd', 'ft', 'in', 'km', 'm', 'cm', 'mm', 'µm'],
    time: ['yr', 'dy', 'hr', 'min', 's'],
    mass: ['kg', 'g', 'mg', 'µg'],
    volume: ['gal', 'm^3', 'L', 'mL', 'µL', 'cm^3'],
    power: ['MW', 'kW', 'W'],
    energy: ['kJ', 'J']
  };
  // Chapter 8's own problems, by skill
  const BOOK = {
    metric: [['358 g', 'kg'], ['10.6 µm', 'm'], ['61.77 m', 'mm'], ['0.97450 m', 'µm'], ['0.5677 kg', 'mg'], ['205 MW', 'W'], ['345 mg', 'kg'], ['370000 W', 'MW'], ['9.11 L', 'µL'], ['745 mm', 'cm']],
    imperial: [['12.5 in', 'cm'], ['560 mi', 'm']],
    two: [['55 min', 'yr'], ['4500 s', 'hr'], ['9.950 yr', 's']],
    rate: [['225 m / s', 'km / s'], ['3.17 gal / min', 'L / s'], ['7700 gal / min', 'L / s'], ['5.5 kg / min', 'g / s'], ['35 mi / hr', 'm / s'], ['14.4 cm / s', 'm / s'], ['62 g / hr', 'mg / s'], ['0.385 L / s', 'gal / min']],
    cubic: [['73 m^3', 'L'], ['2300 mL', 'cm^3'], ['350 L', 'cm^3'], ['67.2 L', 'm^3'], ['57900 cm^3', 'm^3']]
  };
  function amount(l) {
    if (l === 0) return String(ri(2, 20));
    if (l === 1) return String(Math.random() < 0.6 ? ri(2, 999) : ri(11, 999) / 10);
    return String(Math.random() < 0.4 ? ri(2, 9999) : ri(11, 9999) / pick([10, 100]));
  }
  const conv = (q, to) => ({ q, to });
  const dir = (pair, l) => (l === 0 || Math.random() < 0.5 ? pair : [pair[1], pair[0]]);
  function fromBook(kind, l) { return l === 2 && BOOK[kind] && Math.random() < 0.4 ? conv(...pick(BOOK[kind])) : null; }

  function genMetric(l) {
    const b = fromBook('metric', l); if (b) return b;
    const near = [['km', 'm'], ['m', 'cm'], ['m', 'mm'], ['cm', 'mm'], ['kg', 'g'], ['g', 'mg'], ['L', 'mL'], ['kW', 'W'], ['MW', 'kW']];
    const far = [['km', 'cm'], ['km', 'mm'], ['kg', 'mg'], ['MW', 'W'], ['m', 'µm'], ['mg', 'µg'], ['mL', 'µL']];
    const [a, c] = dir(pick(l === 2 ? near.concat(far) : near), l);
    return conv(`${amount(l)} ${a}`, c);
  }
  function genImperial(l) {
    const b = fromBook('imperial', l); if (b) return b;
    const easy = [['ft', 'in', 12], ['yd', 'ft', 3], ['hr', 'min', 60], ['min', 's', 60], ['dy', 'hr', 24]];
    const hard = [['mi', 'ft', 5280], ['yr', 'dy', 365], ['in', 'cm', 2.54], ['gal', 'L', 3.785], ['mi', 'm', 1609], ['mi', 'km', 1.609], ['ft', 'm', 0.3048]];
    const [a, c, k] = pick(l === 2 ? easy.concat(hard) : easy);
    if (l === 0) return conv(`${ri(2, 12)} ${a}`, c);
    if (Math.random() < 0.5) return conv(`${l === 1 ? ri(2, 40) : amount(2)} ${a}`, c);
    return conv(`${Number.isInteger(k) && l === 1 ? k * ri(2, 20) : amount(l)} ${c}`, a);
  }
  function genTwo(l) {
    const b = fromBook('two', l); if (b) return b;
    const L = [
      [['hr', 's'], ['dy', 'min'], ['yd', 'in'], ['km', 'mm']],
      [['ft', 'cm'], ['dy', 's'], ['in', 'm'], ['mi', 'in'], ['kg', 'mg']],
      [['yr', 'hr'], ['yr', 'min'], ['gal', 'mL'], ['dy', 's']]
    ];
    const [a, c] = dir(pick(l === 2 ? L[1].concat(L[2]) : L[l]), l);
    return conv(`${amount(l)} ${a}`, c);
  }
  function genRate(l) {
    const b = fromBook('rate', l); if (b) return b;
    const L = [
      [['m / s', 'km / s'], ['g / min', 'g / s'], ['km / hr', 'km / min'], ['L / min', 'L / hr'], ['cm / s', 'm / s'], ['mg / s', 'g / s']],
      [['km / hr', 'm / s'], ['g / min', 'mg / s'], ['m / s', 'km / hr'], ['L / s', 'mL / min'], ['kg / min', 'g / s'], ['cm / min', 'm / s']],
      [['mi / hr', 'm / s'], ['gal / min', 'L / s'], ['ft / s', 'm / s'], ['mi / hr', 'km / hr'], ['L / hr', 'gal / min'], ['m / s', 'mi / hr']]
    ];
    const [a, c] = pick(L[l]);
    return conv(`${amount(l)} ${a}`, c);
  }
  function genCubic(l) {
    const b = fromBook('cubic', l); if (b) return b;
    const L = [
      [['m^3', 'L'], ['cm^3', 'mL'], ['mL', 'cm^3']],
      [['L', 'cm^3'], ['cm^3', 'L'], ['L', 'm^3'], ['mL', 'm^3']],
      [['m^3', 'cm^3'], ['cm^3', 'm^3'], ['m^3', 'mL'], ['gal', 'm^3'], ['mL', 'm^3']]
    ];
    const [a, c] = pick(L[l]);
    return conv(`${amount(l)} ${a}`, c);
  }

  // ================= ratio cards: choose ready-made conversion factors =================
  // [a, b, k]: 1 a = k b. The memorized facts, then the cheat sheet's.
  const FACTS = [
    ['km', 'm', '1000'], ['m', 'cm', '100'], ['m', 'mm', '1000'], ['cm', 'mm', '10'], ['m', 'µm', '1000000'],
    ['kg', 'g', '1000'], ['g', 'mg', '1000'], ['mg', 'µg', '1000'], ['L', 'mL', '1000'], ['mL', 'µL', '1000'],
    ['kW', 'W', '1000'], ['MW', 'kW', '1000'], ['kJ', 'J', '1000'],
    ['ft', 'in', '12'], ['yd', 'ft', '3'], ['mi', 'ft', '5280'], ['in', 'cm', '2.54'],
    ['min', 's', '60'], ['hr', 'min', '60'], ['dy', 'hr', '24'], ['yr', 'dy', '365'],
    ['ft', 'm', '0.3048', 1], ['mi', 'km', '1.609', 1], ['mi', 'm', '1609', 1], ['gal', 'L', '3.785', 1]
  ];
  // tempting wrong numbers for a memorized fact (none for cheat-sheet facts)
  const WRONG = { '1000': ['100', '10'], '100': ['1000', '10'], '10': ['100'], '1000000': ['1000'], '60': ['100'], '24': ['12'], '12': ['10'], '3': ['36'], '5280': ['1760'], '2.54': ['25.4'] };
  const cardSpec = (a, b, k, flip) => (flip ? `1 ${a} / ${k} ${b}` : `${k} ${b} / 1 ${a}`);
  // the shortest chain of facts from unit a to unit c
  function chain(a, c) {
    if (a === c) return [];
    const prev = { [a]: null }, q = [a];
    while (q.length) {
      const u = q.shift();
      if (u === c) break;
      FACTS.forEach(f => {
        const v = f[0] === u ? f[1] : f[1] === u ? f[0] : null;
        if (v && !(v in prev)) { prev[v] = { u, f }; q.push(v); }
      });
    }
    const out = [];
    for (let v = c; prev[v]; v = prev[v].u) out.unshift(prev[v].f);
    return out;
  }
  const unitsOf = spec => { const s = sides(spec); return [...s.top, ...s.bot].map(f => f.u); };
  // a problem plus its tray: the cards on a right path, true cards that lead elsewhere, and (from level 1) a card that isn't 1
  function withCards(p, l) {
    const from = sides(p.q), to = sides(p.to);
    const steps = [];
    [['top', 'top'], ['bot', 'bot']].forEach(([s]) => from[s].forEach((f, i) => chain(f.u, to[s][i].u).forEach(x => steps.includes(x) || steps.push(x))));
    const near = new Set(steps.flatMap(f => [f[0], f[1]]).concat(unitsOf(p.q), unitsOf(p.to)));
    const cards = steps.map(f => cardSpec(f[0], f[1], f[2], Math.random() < 0.5));
    // metric problems get metric distractors only
    const metricOnly = [...near].every(u => FACTS.slice(0, 13).some(f => f[0] === u || f[1] === u));
    const others = shuffle(FACTS.filter(f => !steps.includes(f) && (near.has(f[0]) || near.has(f[1])) && (!metricOnly || FACTS.indexOf(f) < 13)));
    others.slice(0, l === 2 ? 2 : 1).forEach(f => cards.push(cardSpec(f[0], f[1], f[2], Math.random() < 0.5)));
    if (l > 0) {
      const f = shuffle(steps.filter(x => !x[3] && WRONG[x[2]]))[0];
      if (f) cards.push(cardSpec(f[0], f[1], pick(WRONG[f[2]]), Math.random() < 0.5));
    }
    return Object.assign(p, { cards: shuffle(cards), steps: steps.length });
  }
  const chainLen = (q, to) => sides(to).top.reduce((n, f, i) => n + chain(sides(q).top[i].u, f.u).length, 0) + sides(to).bot.reduce((n, f, i) => n + chain(sides(q).bot[i].u, f.u).length, 0);
  function bookPick(kind, l, lo, hi) {
    if (l !== 2 || Math.random() >= 0.4) return null;
    const ok = BOOK[kind].filter(([q, to]) => { const n = chainLen(q, to); return n >= lo && n <= hi; });
    return ok.length ? conv(...pick(ok)) : null;
  }
  function genPickMetric(l) {
    const b = bookPick('metric', l, 1, 1); if (b) return withCards(b, l);
    const L = [
      [['km', 'm'], ['m', 'cm'], ['kg', 'g'], ['L', 'mL'], ['kW', 'W'], ['g', 'mg']],
      [['cm', 'mm'], ['m', 'mm'], ['mg', 'µg'], ['MW', 'kW'], ['kJ', 'J'], ['mL', 'µL']],
      [['m', 'µm']]
    ];
    const [a, c] = dir(pick(L.slice(0, l + 1).flat()), l);
    return withCards(conv(`${l === 0 ? ri(2, 20) : amount(l)} ${a}`, c), l);
  }
  function genPickImperial(l) {
    const b = bookPick('imperial', l, 1, 1); if (b) return withCards(b, l);
    const L = [
      [['ft', 'in'], ['yd', 'ft'], ['hr', 'min'], ['min', 's'], ['dy', 'hr']],
      [['mi', 'ft'], ['yr', 'dy'], ['in', 'cm']],
      [['ft', 'm'], ['mi', 'km'], ['mi', 'm'], ['gal', 'L']]
    ];
    const [a, c] = dir(pick(L.slice(0, l + 1).flat()), l);
    return withCards(conv(`${l === 0 ? ri(2, 12) : amount(l)} ${a}`, c), l);
  }
  function genPickTwo(l) {
    const b = bookPick('two', l, 2, 4); if (b) return withCards(b, l);
    const L = [
      [['hr', 's'], ['yd', 'in'], ['dy', 'min'], ['km', 'cm'], ['kg', 'mg']],
      [['mi', 'in'], ['in', 'm'], ['yr', 'hr'], ['L', 'µL'], ['km', 'mm']],
      [['dy', 's'], ['yd', 'cm'], ['yr', 'min'], ['mg', 'kg']]
    ];
    const [a, c] = dir(pick(l === 2 ? L[1].concat(L[2]) : L[l]), l);
    return withCards(conv(`${amount(l)} ${a}`, c), l);
  }
  function genPickRate(l) {
    const b = bookPick('rate', l, 2, 4); if (b) return withCards(b, l);
    const L = [
      [['m / s', 'km / s'], ['g / min', 'g / s'], ['km / hr', 'km / min'], ['L / min', 'L / hr'], ['cm / s', 'm / s'], ['mg / s', 'g / s']],
      [['km / hr', 'm / min'], ['kg / min', 'g / s'], ['L / s', 'mL / min'], ['m / s', 'cm / min'], ['g / hr', 'mg / min']],
      [['km / hr', 'm / s'], ['mi / hr', 'ft / s'], ['m / s', 'km / hr'], ['mi / hr', 'km / hr'], ['ft / s', 'in / min'], ['mi / hr', 'm / s']]
    ];
    const [a, c] = pick(L[l]);
    return withCards(conv(`${amount(l)} ${a}`, c), l);
  }

  // ================= the skills, in order =================
  // tier: 1 core (always), 2 extra practice (pace ≥ 1/3), 3 nice to have (pace ≥ 2/3)
  const SKILLS = [
    { id: 'num', name: 'Cancel', tier: 1, quick: true, type: 'cancel', gen: genNum, tip: 'Drag a number onto its match across the bar.' },
    { id: 'unit', name: 'Units', tier: 1, quick: true, type: 'cancel', gen: genUnit },
    { id: 'mixed', name: 'Mixed', tier: 2, type: 'cancel', gen: genMixed },
    { id: 'p10', name: '10ⁿ', tier: 1, type: 'pow', gen: l => genPow('p10', l), tip: 'Tap a power of ten to split it or move it across. Drop one on a neighbour to multiply.' },
    { id: 'forms', name: '1,000', tier: 3, type: 'pow', gen: l => genPow('forms', l), tip: 'Tap a number to rewrite it as 10ⁿ.' },
    { id: 'neg', name: '10⁻ⁿ', tier: 1, type: 'pow', gen: l => genPow('neg', l) },
    { id: 'up', name: 'Build up', tier: 1, type: 'goal', gen: l => genGoal('up', l), tip: 'Tap beside a number to type.' },
    { id: 'down', name: 'Reduce', tier: 1, type: 'goal', gen: l => genGoal('down', l) },
    { id: 'any', name: 'Any', tier: 2, type: 'goal', gen: l => genGoal('any', l) },
    { id: 'pmetric', name: 'Pick: metric', tier: 1, type: 'ratio', gen: genPickMetric, tip: 'Tap a card to add it. Tap a bar to flip.' },
    { id: 'pimperial', name: 'Pick: US & time', tier: 1, type: 'ratio', gen: genPickImperial },
    { id: 'ptwo', name: 'Pick: two steps', tier: 1, type: 'ratio', gen: genPickTwo },
    { id: 'prate', name: 'Pick: rates', tier: 3, type: 'ratio', gen: genPickRate },
    { id: 'metric', name: 'Metric', tier: 1, type: 'conv', gen: genMetric, tip: 'Drag pieces onto the board. Tap # to type.' },
    { id: 'imperial', name: 'US & time', tier: 1, type: 'conv', gen: genImperial },
    { id: 'two', name: 'Two steps', tier: 1, type: 'conv', gen: genTwo },
    { id: 'rate', name: 'Rates', tier: 1, type: 'conv', gen: genRate },
    { id: 'cubic', name: 'Cubic', tier: 1, type: 'conv', gen: genCubic }
  ];
  const TYPES = {
    cancel: { task: () => 'Simplify', check: checkCancel },
    pow: { task: () => 'Write as 10ⁿ', check: checkPowers },
    goal: { task: p => `<span class="w">Make</span>${fracHTML(p.goal[0], p.goal[1])}`, check: checkGoal }
  };
  const isConv = t => t === 'conv' || t === 'ratio';
  let ACTIVE = SKILLS.filter(s => s.tier <= T.tier);

  // ?skill=<id>: practice one skill on its own; saved progress is left alone
  const ONLY_ID = new URLSearchParams(location.search).get('skill');
  const PR = { lvl: 0, streak: 0 };
  function practiced(ok) {
    if (ok) { if (++PR.streak >= 2) { PR.streak = 0; PR.lvl = Math.min(2, PR.lvl + 1); } }
    else { PR.streak = 0; PR.lvl = Math.max(0, PR.lvl - 1); }
  }
  let ONLY = SKILLS.some(s => s.id === ONLY_ID) ? ONLY_ID : null;

  // ================= progress and spaced repetition =================
  // at: a skill moved to with ‹ › (null: the front). atStreak: right in a row while practicing a mastered one.
  function fresh() { return { n: 0, at: null, atStreak: 0, sinceReview: 99, lastId: null, sk: {} }; }
  function loadP() {
    try {
      const x = JSON.parse(localStorage.getItem(KEY));
      if (x && typeof x.n === 'number' && x.sk) {
        if (!('sinceReview' in x)) {
          // saved before the ratio cards: whoever already learned the conversions doesn't need them
          if (x.sk.metric && x.sk.metric.box > 0) ['pmetric', 'pimperial', 'ptwo', 'prate'].forEach(id => { x.sk[id] = x.sk[id] || { box: 1, streak: 0, due: x.n + 3, t: Date.now(), seen: 0, ok: 0 }; });
          Object.assign(x, { at: null, atStreak: 0, sinceReview: x.lastReview ? 0 : 99 });
          delete x.front; delete x.lastReview;
        }
        return x;
      }
    } catch (_) {}
    return fresh();
  }
  function saveP() { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (_) {} }
  let P = loadP();
  const S = id => P.sk[id] || (P.sk[id] = { box: 0, streak: 0, due: 0, t: 0, seen: 0, ok: 0 });
  const idx = id => SKILLS.findIndex(s => s.id === id);
  const mastered = id => S(id).box > 0;
  // the skill being learned: the first included one not mastered (skipped ones wait until the rest are done)
  function front() {
    const s = ACTIVE.find(k => !mastered(k.id) && !S(k.id).skip) || ACTIVE.find(k => !mastered(k.id));
    return s ? s.id : null;
  }
  // where the student stands: the skill moved to with ‹ ›, else the front
  const here = () => (P.at && ACTIVE.some(s => s.id === P.at) ? P.at : front());
  function isDue(id, now) {
    const s = S(id);
    return s.box > 0 && (P.n >= s.due || now - s.t >= T.days[s.box] * 864e5);
  }
  // which skill comes next, and whether it's a review
  function nextSkill(now) {
    if (ONLY) return { id: ONLY, review: false };
    now = now || Date.now();
    const h = here();
    const done = ACTIVE.map(s => s.id).filter(mastered);
    let due = done.filter(id => id !== h && isDue(id, now)).sort((a, b) => (S(a).due - S(b).due) || (S(a).box - S(b).box));
    if (due.length > 1) due = due.filter(id => id !== P.lastId);
    if (due.length && (!h || P.sinceReview >= T.newBetween)) return { id: due[0], review: true };
    if (h) return { id: h, review: false };
    // everything mastered and nothing due: the one coming due soonest
    let rest = done.slice().sort((a, b) => S(a).due - S(b).due);
    if (rest.length > 1) rest = rest.filter(id => id !== P.lastId);
    return { id: rest[0], review: true };
  }
  function level(id, review) {
    if (ONLY) return PR.lvl;
    const s = S(id);
    if (review) return Math.min(2, s.box);
    const streak = s.box > 0 ? P.atStreak : s.streak;
    if (SKILLS[idx(id)].quick) return QUICK_LEVEL[Math.min(streak, QUICK_LEVEL.length - 1)];
    return Math.min(2, Math.floor(T.start + streak * T.step + 1e-9));
  }
  // record one answer; returns true when it masters a new skill
  function grade(id, ok, review, now) {
    if (ONLY) { practiced(ok); return false; }
    now = now || Date.now();
    const s = S(id);
    P.n++; s.seen++; s.t = now; if (ok) s.ok++;
    P.lastId = id; P.sinceReview = review ? 0 : P.sinceReview + 1;
    let up = false;
    if (review) {
      s.box = ok ? Math.min(5, s.box + 1) : 1;
      s.due = P.n + T.gap[s.box];
    } else if (s.box > 0) {
      // practicing a mastered skill (moved back to): never demoted; enough right in a row returns to the front
      P.atStreak = ok ? P.atStreak + 1 : 0;
      if (P.atStreak >= masterFor(id)) { P.at = null; P.atStreak = 0; }
    } else {
      s.streak = ok ? s.streak + 1 : 0;
      if (s.streak >= masterFor(id)) {
        s.box = 1; s.streak = 0; s.due = P.n + T.gap[1]; delete s.skip; up = true;
        if (P.at === id) P.at = null;
      }
    }
    saveP();
    return up;
  }
  // ‹ › : move to the previous or next skill. Moving on from an unmastered skill skips it (not wrong, not mastered).
  function neighbours() {
    const list = ONLY ? SKILLS.map(s => s.id) : ACTIVE.map(s => s.id);
    const h = ONLY || here();
    const i = h ? list.indexOf(h) : list.length;
    return { list, i, prev: i > 0 ? list[i - 1] : null, next: i < list.length - 1 ? list[i + 1] : null };
  }
  function move(d) {
    const nb = neighbours(), to = d < 0 ? nb.prev : nb.next;
    if (!to) return;
    if (ONLY) {
      ONLY = to; PR.lvl = 0; PR.streak = 0;
      const u = new URL(location.href); u.searchParams.set('skill', to); history.replaceState(null, '', u);
      dots.textContent = SKILLS[idx(ONLY)].name; dots.setAttribute('aria-label', dots.textContent);
      newProblem();
      return;
    }
    leave();
    const h = here();
    if (d > 0 && h && !mastered(h)) { S(h).skip = true; S(h).streak = 0; }
    P.at = to; P.atStreak = 0;
    saveP();
    newProblem({ id: to, review: false });
  }

  // ================= boards =================
  const hintEl = $('hint');
  let hintTimer = null;
  function hint(t, ms) { hintEl.textContent = t; clearTimeout(hintTimer); hintTimer = setTimeout(() => { hintEl.textContent = ''; }, ms || 2400); }

  const boardF = FractionBoard($('boardF'), { typeIn: () => !!cur && cur.type === 'goal' && !cur.solved, onHint: t => hint(t), onChange: changed });

  let givenId = null;
  const isGiven = fr => { if (givenId === null) givenId = fr.id; return fr.id === givenId; };
  // a fraction that has had a unit keeps its numbers when the units cancel away (60 min / 1 hr · 60 s / 1 min)
  const hadUnit = new Set();
  const noteUnits = fr => { if ([...fr.num, ...fr.den].some(f => f.t === 'u')) hadUnit.add(fr.id); };
  function needsUnit(fr) {
    if (isGiven(fr)) return false;
    noteUnits(fr);
    if (hadUnit.has(fr.id)) return false;
    const all = [...fr.num, ...fr.den];
    return all.some(f => f.t === 'n' || f.t === 'b');
  }
  // the amount being converted is the first fraction loaded; fixed now, so a tap on a card's bar can't claim it
  function loadGiven(go) {
    givenId = null;
    go();
    givenId = convBoard().state.fracs[0].id;
  }
  const boardC = FractionBoard($('boardC'), {
    isOne: () => false,
    bareFactors: true,
    trash: true,
    removeHint: 'The amount you\'re converting stays.',
    fracClass: fr => needsUnit(fr) ? 'fb-draft' : '',
    fracTag: fr => needsUnit(fr) ? 'needs a unit' : '',
    split: false,
    crossMove: false,
    crossMoveHint: 'Keep each factor in its own fraction.',
    locked: isGiven,
    lockedHint: 'Leave the amount as it is. Start a new fraction to its right.',
    canRemove: (f, fr) => !isGiven(fr),
    canEdit: (f, fr) => !isGiven(fr),
    canFlip: fr => !isGiven(fr),
    onHint: t => hint(t),
    onDisarm: () => document.querySelectorAll('.piece.armed').forEach(p => p.classList.remove('armed')),
    onChange: changed
  });
  // ratio cards: whole conversion factors are added from the tray; tap a bar to flip one, undo to take one back
  const boardR = FractionBoard($('boardR'), {
    isOne: () => false,
    bareFactors: true,
    split: false,
    crossMove: false,
    crossMoveHint: 'Keep each factor in its own fraction.',
    locked: () => true,
    canRemove: () => false,
    removeHint: 'Undo takes a card back.',
    canEdit: () => false,
    canFlip: fr => !isGiven(fr),
    onHint: t => hint(t),
    onChange: changed
  });
  const convBoard = () => (cur && cur.type === 'ratio' ? boardR : boardC);

  // ---------- conversion helpers ----------
  const unitHTML = f => `<i>${fh(f)}</i>`;
  const key = f => `${f.u}^${f.k}`;
  function sides(spec) {
    const [t, b = ''] = spec.split('/');
    const list = s => s.split(/\s+/).filter(Boolean).map(pf).filter(f => f && f.t === 'u');
    return { top: list(t), bot: list(b) };
  }
  function unitsFracHTML(top, bot) {
    const t = top.length ? top.map(unitHTML).join('·') : '1';
    if (!bot.length) return t;
    return `<span class="uf"><span>${t}</span><span>${bot.map(unitHTML).join('·')}</span></span>`;
  }
  function quantityHTML(spec) {
    const [t, b = ''] = spec.split('/');
    const parts = t.split(/\s+/).filter(Boolean).map(pf);
    const num = parts.filter(f => f.t !== 'u').map(fh).join(' ');
    const bot = b.split(/\s+/).filter(Boolean).map(pf);
    return `${num} ${unitsFracHTML(parts.filter(f => f.t === 'u'), bot)}`;
  }
  function siSize(spec) {
    const [t, b = ''] = spec.split('/');
    let v = 1;
    const go = (str, sgn) => str.split(/\s+/).filter(Boolean).map(pf).forEach(f => {
      if (f.t === 'u') v *= Math.pow(UNITS[f.u][1], sgn * f.k);
      else if (f.t === 'n') v *= Math.pow(Number(f.d) / 10 ** f.s, sgn);
    });
    go(t, 1); go(b, -1);
    return v;
  }
  function boardUnits() {
    const top = [], bot = [];
    convBoard().state.fracs.forEach(fr => { fr.num.forEach(f => { if (f.t === 'u') top.push(f); }); fr.den.forEach(f => { if (f.t === 'u') bot.push(f); }); });
    return { top, bot };
  }
  const sameKeys = (a, b) => { const x = a.map(key).sort(), y = b.map(key).sort(); return x.length === y.length && x.every((v, i) => v === y[i]); };
  function unitsMatch() {
    const now = boardUnits(), fr = convBoard().state.fracs;
    const blanks = fr.some(f => [...f.num, ...f.den].some(g => g.t === 'b'));
    return { now, ok: !blanks && !fr.some(needsUnit) && sameKeys(now.top, cur.target.top) && sameKeys(now.bot, cur.target.bot) };
  }
  const commas = s => { const [i, f] = s.split('.'); return i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (f ? '.' + f : ''); };
  function decimal(n, d) {
    let k = 0, dd = d;
    while (dd % 2n === 0n) { dd /= 2n; k++; }
    let j = 0; while (dd % 5n === 0n) { dd /= 5n; j++; }
    if (dd === 1n) {
      const places = Math.max(k, j);
      const s = (n * 10n ** BigInt(places) / d).toString().padStart(places + 1, '0');
      const out = places ? s.slice(0, s.length - places) + '.' + s.slice(s.length - places) : s;
      const sig = out.replace('.', '').replace(/^0+/, '').length;
      const trimmed = out.includes('.') ? out.replace(/0+$/, '').replace(/\.$/, '') : out;
      if (sig <= 10) return commas(trimmed);
    }
    const x = Number(n) / Number(d);
    const mag = Math.floor(Math.log10(Math.abs(x)));
    if (mag >= 3) return commas(String(Math.round(x / 10 ** (mag - 3)) * 10 ** (mag - 3)));
    return commas(x.toFixed(Math.max(0, 3 - mag)));
  }
  function checkConv() {
    const v = convBoard().value();
    const want = siSize(cur.q) / siSize('1 ' + cur.to);
    const got = Number(v.n) / Number(v.d);
    if (Math.abs(got / want - 1) < 0.01) return [true, `${decimal(v.n, v.d)} ${unitsFracHTML(cur.target.top, cur.target.bot)}`];
    return [false, 'A conversion factor isn\'t equal to 1.'];
  }

  // ---------- tray ----------
  const unitPieces = $('unitPieces');
  function fillTray(p) {
    const fams = new Set();
    [p.q, p.to].forEach(spec => { const s = sides(spec); [...s.top, ...s.bot].forEach(f => fams.add(family(f.u, f.k))); });
    unitPieces.innerHTML = '';
    Object.keys(PIECES).filter(f => fams.has(f)).forEach(f => PIECES[f].forEach(spec => {
      const el = document.createElement('span');
      el.className = 'piece u'; el.dataset.spec = spec;
      el.innerHTML = fh(pf(spec));
      el.tabIndex = 0; el.setAttribute('role', 'button'); el.setAttribute('aria-label', `Unit ${spec.replace('^', ' to the ')}`);
      wire(el);
      unitPieces.appendChild(el);
    }));
  }
  function wire(el) {
    el.addEventListener('pointerdown', e => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      e.preventDefault();
      boardC.dragExternal(el.dataset.spec, e, el, { onTap: () => toggleArm(el) });
    });
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleArm(el); } });
  }
  function toggleArm(el) {
    const was = el.classList.contains('armed');
    boardC.disarm();
    if (was) return;
    el.classList.add('armed');
    boardC.arm(el.dataset.spec, el);
  }
  wire($('numPiece'));

  // ---------- ratio cards ----------
  const cardsEl = $('cards');
  function cardHTML(spec) {
    const side = str => str.trim().split(/\s+/).map(pf).map(f => (f.t === 'u' ? `<i>${fh(f)}</i>` : fh(f))).join(' ');
    const [t, b] = spec.split('/');
    return `<span class="fb-vfrac"><span>${side(t)}</span><span>${side(b)}</span></span>`;
  }
  function fillCards(list) {
    cardsEl.innerHTML = '';
    list.forEach(spec => {
      const el = document.createElement('span');
      el.className = 'rc'; el.dataset.spec = spec; el.innerHTML = cardHTML(spec);
      el.tabIndex = 0; el.setAttribute('role', 'button'); el.setAttribute('aria-label', spec.replace('/', 'per'));
      wireCard(el);
      cardsEl.appendChild(el);
    });
  }
  const placeCard = (el, from) => { if (cur && !cur.solved) boardR.addFraction(el.dataset.spec, from || el); };
  // press a card and drag it onto the board, or just tap it
  function wireCard(el) {
    el.addEventListener('pointerdown', e => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      e.preventDefault();
      const r = el.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
      const card = $('cardR');
      const over = ev => { const R = card.getBoundingClientRect(); return ev.clientX >= R.left && ev.clientX <= R.right && ev.clientY >= R.top && ev.clientY <= R.bottom; };
      let ghost = null;
      const move = ev => {
        if (ev.pointerId !== e.pointerId) return;
        if (!ghost) {
          if (Math.hypot(ev.clientX - e.clientX, ev.clientY - e.clientY) < 5) return;
          ghost = el.cloneNode(true); ghost.classList.add('rc-ghost'); ghost.style.width = r.width + 'px';
          document.body.appendChild(ghost); el.classList.add('lifted');
        }
        ev.preventDefault();
        ghost.style.transform = `translate(${ev.clientX - dx}px, ${ev.clientY - dy}px)`;
        card.classList.toggle('hot', over(ev));
      };
      const up = ev => {
        if (ev.pointerId !== e.pointerId) return;
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        document.removeEventListener('pointercancel', up);
        el.classList.remove('lifted'); card.classList.remove('hot');
        if (!ghost) { if (ev.type !== 'pointercancel') placeCard(el); return; }
        if (ev.type !== 'pointercancel' && over(ev)) placeCard(el, ghost);
        ghost.remove();
      };
      document.addEventListener('pointermove', move, { passive: false });
      document.addEventListener('pointerup', up);
      document.addEventListener('pointercancel', up);
    });
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); placeCard(el); } });
  }

  // ================= the loop =================
  let cur = null;            // { id, review, level, type, spec | q,to,target, goal, solved, wrong, graded }
  const board = () => (cur && isConv(cur.type) ? convBoard() : boardF);
  const fbk = $('fbk');
  // the inputs rest once a problem is solved
  const RESTING = ['tray', 'cards', 'undo', 'reset', 'combine'];
  const rest = on => RESTING.forEach(id => { $(id).inert = on; });
  function say(t, cls) { fbk.innerHTML = t; fbk.className = 'fb-feedback' + (cls ? ' ' + cls : ''); }

  function changed(b) {
    if (!cur || b !== board()) return;
    $('undo').disabled = !b.canUndo();
    $('combine').hidden = isConv(cur.type) || b.fractionCount() < 2;
    if (!cur.solved && fbk.classList.contains('bad')) say('');
    if (isConv(cur.type)) {
      b.state.fracs.forEach(noteUnits);
      const m = unitsMatch();
      const u = $('units');
      u.classList.toggle('match', m.ok);
      u.innerHTML = `<span class="now">${unitsFracHTML(m.now.top, m.now.bot)}</span><span>→</span><span class="want">${unitsFracHTML(cur.target.top, cur.target.bot)}</span>`;
      if (!cur.solved) $('go').disabled = !m.ok;
    }
  }

  // generate one problem for a skill at a level (and make sure it isn't already solved)
  function make(skill, l) {
    if (isConv(skill.type)) return skill.gen(l);
    for (let i = 0; i < 300; i++) {
      const g = skill.gen(l);
      const st = { fracs: g.spec.map(s => parseFraction(s)) };
      // prefer fractions with something on both sides; never an empty one
      if (st.fracs.some(f => !f.num.length && !f.den.length)) continue;
      if (i < 60 && st.fracs.some(f => !f.num.length || !f.den.length)) continue;
      if (!TYPES[skill.type].check(st, g)[0]) return g;
    }
    return skill.gen(l);
  }

  function newProblem(forced) {
    const pickd = forced || nextSkill();
    const skill = SKILLS[idx(pickd.id)];
    const l = forced && forced.level != null ? forced.level : level(skill.id, pickd.review);
    const g = make(skill, l);
    cur = Object.assign({ id: skill.id, review: pickd.review, level: l, type: skill.type, solved: false, wrong: false, graded: false }, g);
    const conv = isConv(cur.type), ratio = cur.type === 'ratio';
    $('cardF').hidden = conv; $('cardC').hidden = !conv || ratio; $('cardR').hidden = !ratio;
    $('tray').hidden = !conv || ratio; cardsEl.hidden = !ratio; $('units').hidden = !conv;
    if (window.cheatsheet) window.cheatsheet.show(conv);
    $('combine').hidden = true;
    const s = S(skill.id);
    const tip = skill.tip && s.seen < 2 && !cur.review ? skill.tip : '';
    $('tip').textContent = tip; $('tip').hidden = !tip;
    hintEl.textContent = '';
    say('');
    $('go').textContent = 'Check'; $('go').disabled = false;
    rest(false);
    boardC.disarm();
    if (conv) {
      cur.target = sides(cur.to);
      $('task').innerHTML = `${quantityHTML(cur.q)} <span class="arrow">→</span> ${unitsFracHTML(cur.target.top, cur.target.bot)}`;
      if (ratio) fillCards(cur.cards); else fillTray(cur);
      hadUnit.clear();
      loadGiven(() => convBoard().load([cur.q]));
    } else {
      $('task').innerHTML = TYPES[cur.type].task(cur);
      boardF.load(cur.spec);
    }
    drawDots();
  }

  // walking away from a problem after a failed Check still counts it wrong
  function leave() { if (cur && !cur.solved && cur.wrong) finish(false); }
  function finish(ok) {
    if (cur.graded) return false;
    cur.graded = true;
    return grade(cur.id, ok, cur.review);
  }
  // a cancel (or an "= 1" fraction being removed) only changes the board once its animation ends: check what it leaves
  const settling = () => { const r = $(isConv(cur.type) ? (cur.type === 'ratio' ? 'boardR' : 'boardC') : 'boardF'); return !!r.querySelector('.fb-x, .fb-asone') || [...r.querySelectorAll('.fb-frac')].some(el => el.getAnimations().some(a => a.playState === 'running')); };
  let checkSoon = null;
  function check() {
    if (!cur || cur.solved) return;
    if (settling()) {
      const p = cur;
      clearTimeout(checkSoon);
      checkSoon = setTimeout(() => { if (cur === p) check(); }, 80);
      return;
    }
    const [ok, msg] = isConv(cur.type) ? checkConv() : TYPES[cur.type].check(board().state, cur);
    if (!ok) { cur.wrong = true; say(msg, 'bad'); return; }
    cur.solved = true;
    const up = finish(!cur.wrong);
    say('✓' + (msg ? ' ' + msg : ''), 'good');
    boardC.disarm();
    rest(true);
    $('go').textContent = 'Next →'; $('go').disabled = false; $('go').focus();
    drawDots(up ? idx(cur.id) : -1);
  }
  $('go').addEventListener('click', () => { if (cur && cur.solved) newProblem(); else check(); });
  $('prev').addEventListener('click', () => move(-1));
  $('next').addEventListener('click', () => move(1));
  $('undo').addEventListener('click', () => board().undo());
  // start over reloads the amount as a new fraction: it is still the given one
  $('reset').addEventListener('click', () => { if (cur && isConv(cur.type)) loadGiven(() => board().reset()); else board().reset(); });
  $('combine').addEventListener('click', () => board().combine());
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.target.closest('input')) { e.preventDefault(); if (cur && !cur.solved) board().undo(); }
  });
  // Enter anywhere that isn't a control: Check, then Next
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || e.defaultPrevented || e.repeat || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
    if (e.target.closest && e.target.closest('input, textarea, select, button, a, [role="button"], [tabindex], .fb-pop')) return;
    if (!$('go').disabled) { e.preventDefault(); $('go').click(); }
  });
  $('wipe').addEventListener('click', () => {
    if (!window.confirm('Reset progress?')) return;
    P = fresh(); saveP(); newProblem();
  });

  // ---------- progress dots (the skills included at this pace) ----------
  const dots = $('dots');
  function buildDots() {
    dots.innerHTML = '';
    ACTIVE.forEach(s => { const d = document.createElement('i'); d.className = 'dot'; d.title = s.name; dots.appendChild(d); });
  }
  buildDots();
  if (ONLY) { dots.textContent = SKILLS[idx(ONLY)].name; dots.setAttribute('aria-label', dots.textContent); dots.classList.add('only'); $('top').classList.add('solo'); $('wipe').hidden = true; $('pace').hidden = true; }
  function drawDots(popAt) {
    const nb = neighbours();
    $('prev').disabled = !nb.prev; $('next').disabled = !nb.next;
    if (ONLY) return;
    const h = here();
    [...dots.children].forEach((d, i) => {
      const id = ACTIVE[i].id, s = S(id);
      d.className = 'dot';
      if (s.box > 0) { d.classList.add('done'); d.style.setProperty('--b', 40 + s.box * 12); }
      else if (id === h) { d.classList.add('now'); d.style.setProperty('--p', Math.round(100 * s.streak / masterFor(id))); }
      if (cur && id === cur.id) d.classList.add('cur');
      if (idx(id) === popAt) d.classList.add('pop');
    });
    dots.setAttribute('aria-label', `${ACTIVE.filter(s => mastered(s.id)).length} of ${ACTIVE.length} mastered`);
  }

  // ---------- pace: Cram · Full ----------
  function paceUI() {
    document.querySelectorAll('[data-pace]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.pace) === T.pace)));
  }
  function setPace(p) {
    p = Math.min(1, Math.max(0, p));
    if (p === T.pace) return;
    T = tune(p);
    try { localStorage.setItem(PACE_KEY, String(T.pace)); } catch (_) {}
    ACTIVE = SKILLS.filter(s => s.tier <= T.tier);
    paceUI();
    if (ONLY) return;
    buildDots();
    if (cur && !cur.solved) { leave(); newProblem(); } else drawDots();
  }
  document.querySelectorAll('[data-pace]').forEach(b => b.addEventListener('click', () => {
    const u = new URL(location.href);
    if (u.searchParams.has('pace')) { u.searchParams.delete('pace'); history.replaceState(null, '', u); }
    setPace(Number(b.dataset.pace));
  }));
  paceUI();

  if (/[?&]debug\b/.test(location.search)) {
    window.prog = { get P() { return P; }, set P(x) { P = x; }, get cur() { return cur; }, get T() { return T; }, get ACTIVE() { return ACTIVE; }, SKILLS, boardF, boardC, boardR, fresh, front, here, nextSkill, grade, level, make, newProblem, check, isDue, saveP, setPace, tune, move, chain, loadConv: specs => loadGiven(() => convBoard().load(specs)) };
  }
  newProblem();
})();
