/* Fraction Path: a ramped sequence of fraction-board and unit-conversion skills with spaced repetition.
 *
 * Skills unlock one at a time. A new skill is mastered after MASTER correct answers in a row; it then enters
 * Leitner box 1. Mastered skills come back for review when GAP[box] problems have been answered since, or
 * DAYS[box] days have passed, whichever is first. Reviews are interleaved with new material (at most one review
 * between new problems while a skill is being learned). A correct review moves the skill up a box (max 5);
 * a wrong one sends it back to box 1. An answer counts as wrong if any Check failed, or if the problem was skipped.
 * Within a skill, difficulty (level 0–2) follows the current streak while learning, and the box while reviewing.
 */
(function () {
  'use strict';
  const MASTER = 4;
  const GAP = [0, 3, 6, 12, 24, 48];
  const DAYS = [0, 1, 2, 4, 8, 16];
  const LEARN_LEVEL = [0, 1, 1, 2];
  const KEY = 'apparatus.fraction-path.v1';

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
  function checkCancel(st) {
    const both = unitsOnBothSides(st);
    if (both.length) return [false, `<i>${both.join(', ')}</i> can still cancel.`];
    const t = totals(st), g = bgcd(t.n, t.d);
    if (g > 1n) return [false, `Top and bottom share a factor of ${g}.`];
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
  // 3. cancel that needs a split first (4 over 6)
  function genSplit(l) {
    if (l < 2) {
      for (;;) {
        const [a, b] = coprime(l === 0 ? [1, 2, 3] : [1, 2, 3, 4, 5]);
        const m = pick(l === 0 ? [2, 3] : [2, 3, 4, 5, 6]);
        if (a * m < 4 && b * m < 4) continue;
        const fr = [{ num: [a * m], den: [b * m] }];
        if (l === 1) { const u = pick(UN); fr[0].num.push(u); fr[0].den.push(u); }
        return { spec: join(fr) };
      }
    }
    const S = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21];
    for (;;) {
      const t = [pick(S), pick(S)], b = [pick(S), pick(S)];
      if (t.some(x => b.includes(x)) || gcd(t[0] * t[1], b[0] * b[1]) === 1) continue;
      const fr = [{ num: [t[0]], den: [b[0]] }, { num: [t[1]], den: [b[1]] }];
      place(fr, pick(UN), 2);
      return { spec: join(fr) };
    }
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
      return { spec: [`${a * m} / ${b * m}`], goal: [a, b] };
    }
    let p = ri(2, 5), q = ri(2, 5); while (p === q) q = ri(2, 5);
    if (l === 0) return { spec: [`${a} / ${b}`], goal: Math.random() < 0.5 ? [a * p, b] : [a, b * q] };
    if (l === 1) return { spec: [`${a} / ${b}`], goal: [a * p, b * q] };
    let m = ri(2, 3); while (m === p || m === q) m++;
    return { spec: [`${a * m} / ${b * m}`], goal: [a * p, b * q] };
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
    imperial: [['12.5 in', 'cm']],
    two: [['560 mi', 'm'], ['55 min', 'yr'], ['4500 s', 'hr'], ['9.950 yr', 's']],
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
    const hard = [['mi', 'ft', 5280], ['yr', 'dy', 365], ['in', 'cm', 2.54], ['gal', 'L', 3.785], ['yd', 'in', 36]];
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
      [['mi', 'm'], ['mi', 'km'], ['yr', 'hr'], ['yr', 'min'], ['gal', 'mL'], ['ft', 'm']]
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

  // ================= the skills, in order =================
  const SKILLS = [
    { id: 'num', name: 'Cancel', type: 'cancel', gen: genNum, tip: 'Drag a number onto its match across the bar.' },
    { id: 'unit', name: 'Units', type: 'cancel', gen: genUnit },
    { id: 'split', name: 'Split', type: 'cancel', gen: genSplit, tip: 'Tap a number to split it.' },
    { id: 'mixed', name: 'Mixed', type: 'cancel', gen: genMixed },
    { id: 'p10', name: '10ⁿ', type: 'pow', gen: l => genPow('p10', l), tip: 'Tap a power of ten to split it or move it across. Drop one on a neighbour to multiply.' },
    { id: 'forms', name: '1,000', type: 'pow', gen: l => genPow('forms', l), tip: 'Tap a number to rewrite it as 10ⁿ.' },
    { id: 'neg', name: '10⁻ⁿ', type: 'pow', gen: l => genPow('neg', l) },
    { id: 'up', name: 'Build up', type: 'goal', gen: l => genGoal('up', l), tip: 'Type a factor, then ↑ top or ↓ bottom.' },
    { id: 'down', name: 'Reduce', type: 'goal', gen: l => genGoal('down', l) },
    { id: 'any', name: 'Any', type: 'goal', gen: l => genGoal('any', l) },
    { id: 'metric', name: 'Metric', type: 'conv', gen: genMetric, tip: 'Drag pieces onto the board. Tap # to type.' },
    { id: 'imperial', name: 'Imperial', type: 'conv', gen: genImperial },
    { id: 'two', name: 'Two steps', type: 'conv', gen: genTwo },
    { id: 'rate', name: 'Rates', type: 'conv', gen: genRate },
    { id: 'cubic', name: 'Cubic', type: 'conv', gen: genCubic }
  ];
  const TYPES = {
    cancel: { task: () => 'Simplify', check: checkCancel },
    pow: { task: () => 'Write as 10ⁿ', check: checkPowers },
    goal: { task: p => `<span class="w">Make</span>${fracHTML(p.goal[0], p.goal[1])}`, check: checkGoal }
  };

  // ================= progress and spaced repetition =================
  function fresh() { return { n: 0, front: 0, lastId: null, lastReview: false, sk: {} }; }
  function loadP() {
    try {
      const x = JSON.parse(localStorage.getItem(KEY));
      if (x && typeof x.n === 'number' && x.sk) return x;
    } catch (_) {}
    return fresh();
  }
  function saveP() { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (_) {} }
  let P = loadP();
  const S = id => P.sk[id] || (P.sk[id] = { box: 0, streak: 0, due: 0, t: 0, seen: 0, ok: 0 });
  const idx = id => SKILLS.findIndex(s => s.id === id);
  function isDue(id, now) {
    const s = S(id);
    return s.box > 0 && (P.n >= s.due || now - s.t >= DAYS[s.box] * 864e5);
  }
  // which skill comes next, and whether it's a review
  function nextSkill(now) {
    now = now || Date.now();
    const mastered = SKILLS.slice(0, P.front).map(s => s.id);
    let due = mastered.filter(id => isDue(id, now)).sort((a, b) => (S(a).due - S(b).due) || (S(a).box - S(b).box));
    if (due.length > 1) due = due.filter(id => id !== P.lastId);
    const learning = P.front < SKILLS.length ? SKILLS[P.front].id : null;
    if (due.length && (!learning || !P.lastReview)) return { id: due[0], review: true };
    if (learning) return { id: learning, review: false };
    // everything mastered and nothing due: the one coming due soonest
    let rest = mastered.slice().sort((a, b) => S(a).due - S(b).due);
    if (rest.length > 1) rest = rest.filter(id => id !== P.lastId);
    return { id: rest[0], review: true };
  }
  function level(id) {
    const s = S(id);
    return s.box === 0 ? LEARN_LEVEL[Math.min(s.streak, LEARN_LEVEL.length - 1)] : Math.min(2, s.box);
  }
  // record one answer; returns true when it masters a new skill
  function grade(id, ok, review, now) {
    now = now || Date.now();
    const s = S(id);
    P.n++; s.seen++; s.t = now; if (ok) s.ok++;
    P.lastId = id; P.lastReview = !!review;
    let mastered = false;
    if (s.box === 0) {
      s.streak = ok ? s.streak + 1 : 0;
      if (s.streak >= MASTER) {
        s.box = 1; s.streak = 0; s.due = P.n + GAP[1]; mastered = true;
        P.front = Math.max(P.front, idx(id) + 1);
      }
    } else {
      s.box = ok ? Math.min(5, s.box + 1) : 1;
      s.due = P.n + GAP[s.box];
    }
    saveP();
    return mastered;
  }

  // ================= boards =================
  const hintEl = $('hint');
  let hintTimer = null;
  function hint(t, ms) { hintEl.textContent = t; clearTimeout(hintTimer); hintTimer = setTimeout(() => { hintEl.textContent = ''; }, ms || 2400); }

  const boardF = FractionBoard($('boardF'), { onHint: t => hint(t), onChange: changed });

  let givenId = null;
  const isGiven = fr => { if (givenId === null) givenId = fr.id; return fr.id === givenId; };
  function needsUnit(fr) {
    if (isGiven(fr)) return false;
    const all = [...fr.num, ...fr.den];
    return all.some(f => f.t === 'n' || f.t === 'b') && !all.some(f => f.t === 'u');
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
    boardC.state.fracs.forEach(fr => { fr.num.forEach(f => { if (f.t === 'u') top.push(f); }); fr.den.forEach(f => { if (f.t === 'u') bot.push(f); }); });
    return { top, bot };
  }
  const sameKeys = (a, b) => { const x = a.map(key).sort(), y = b.map(key).sort(); return x.length === y.length && x.every((v, i) => v === y[i]); };
  function unitsMatch() {
    const now = boardUnits(), fr = boardC.state.fracs;
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
    const v = boardC.value();
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

  // ================= the loop =================
  let cur = null;            // { id, review, level, type, spec | q,to,target, goal, solved, wrong, graded }
  const board = () => (cur && cur.type === 'conv' ? boardC : boardF);
  const fbk = $('fbk');
  function say(t, cls) { fbk.innerHTML = t; fbk.className = 'fb-feedback' + (cls ? ' ' + cls : ''); }

  function changed(b) {
    if (!cur || b !== board()) return;
    $('undo').disabled = !b.canUndo();
    $('combine').hidden = cur.type === 'conv' || b.fractionCount() < 2;
    if (!cur.solved && fbk.classList.contains('bad')) say('');
    if (cur.type === 'conv') {
      const m = unitsMatch();
      const u = $('units');
      u.classList.toggle('match', m.ok);
      u.innerHTML = `<span class="now">${unitsFracHTML(m.now.top, m.now.bot)}</span><span>→</span><span class="want">${unitsFracHTML(cur.target.top, cur.target.bot)}</span>`;
      if (!cur.solved) $('go').disabled = !m.ok;
    }
  }

  // generate one problem for a skill at a level (and make sure it isn't already solved)
  function make(skill, l) {
    if (skill.type === 'conv') return skill.gen(l);
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
    const l = forced && forced.level != null ? forced.level : level(skill.id);
    const g = make(skill, l);
    cur = Object.assign({ id: skill.id, review: pickd.review, level: l, type: skill.type, solved: false, wrong: false, graded: false }, g);
    const conv = cur.type === 'conv';
    $('cardF').hidden = conv; $('cardC').hidden = !conv;
    $('tray').hidden = !conv; $('units').hidden = !conv;
    $('build').hidden = cur.type !== 'goal';
    $('combine').hidden = true;
    const s = S(skill.id);
    const tip = skill.tip && s.seen < 2 && !cur.review ? skill.tip : '';
    $('tip').textContent = tip; $('tip').hidden = !tip;
    hintEl.textContent = '';
    say('');
    $('go').textContent = 'Check'; $('go').disabled = false;
    boardC.disarm();
    if (conv) {
      cur.target = sides(cur.to);
      $('task').innerHTML = `${quantityHTML(cur.q)} <span class="arrow">→</span> ${unitsFracHTML(cur.target.top, cur.target.bot)}`;
      fillTray(cur);
      givenId = null;
      boardC.load([cur.q]);
    } else {
      $('task').innerHTML = TYPES[cur.type].task(cur);
      boardF.load(cur.spec);
    }
    drawDots();
  }

  function finish(ok) {
    if (cur.graded) return false;
    cur.graded = true;
    return grade(cur.id, ok, cur.review);
  }
  function check() {
    if (!cur || cur.solved) return;
    const [ok, msg] = cur.type === 'conv' ? checkConv() : TYPES[cur.type].check(board().state, cur);
    if (!ok) { cur.wrong = true; say(msg, 'bad'); return; }
    cur.solved = true;
    const up = finish(!cur.wrong);
    say('✓' + (msg ? ' ' + msg : ''), 'good');
    $('go').textContent = 'Next →'; $('go').disabled = false; $('go').focus();
    drawDots(up ? idx(cur.id) : -1);
  }
  $('go').addEventListener('click', () => { if (cur && cur.solved) newProblem(); else check(); });
  $('skip').addEventListener('click', () => { if (cur && !cur.solved) finish(false); newProblem(); });
  $('undo').addEventListener('click', () => board().undo());
  $('reset').addEventListener('click', () => board().reset());
  $('combine').addEventListener('click', () => board().combine());
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.target.closest('input')) { e.preventDefault(); board().undo(); }
  });
  const factor = $('factor');
  function addTo(row) {
    const v = factor.value.trim();
    if (!v) { factor.focus(); return; }
    if (!/^\d+$/.test(v) || !boardF.add(v, row)) { say('Use a whole number.', 'bad'); return; }
    factor.value = ''; factor.focus();
  }
  document.querySelectorAll('[data-add]').forEach(b => b.addEventListener('click', () => addTo(b.dataset.add)));
  $('build').addEventListener('submit', e => { e.preventDefault(); addTo('num'); });
  $('wipe').addEventListener('click', () => {
    if (!window.confirm('Reset progress?')) return;
    P = fresh(); saveP(); newProblem();
  });

  // ---------- progress dots ----------
  const dots = $('dots');
  SKILLS.forEach(s => { const d = document.createElement('i'); d.className = 'dot'; d.title = s.name; dots.appendChild(d); });
  function drawDots(popAt) {
    [...dots.children].forEach((d, i) => {
      const s = S(SKILLS[i].id);
      d.className = 'dot';
      if (s.box > 0) { d.classList.add('done'); d.style.setProperty('--b', 40 + s.box * 12); }
      else if (i === P.front) { d.classList.add('now'); d.style.setProperty('--p', Math.round(100 * s.streak / MASTER)); }
      if (cur && SKILLS[i].id === cur.id) d.classList.add('cur');
      if (i === popAt) d.classList.add('pop');
    });
    dots.setAttribute('aria-label', `${Math.min(P.front, SKILLS.length)} of ${SKILLS.length} mastered`);
  }

  if (/[?&]debug\b/.test(location.search)) {
    window.prog = { get P() { return P; }, set P(x) { P = x; }, get cur() { return cur; }, SKILLS, boardF, boardC, nextSkill, grade, level, make, newProblem, check, isDue, saveP, loadConv: specs => { givenId = null; boardC.load(specs); }, constants: { MASTER, GAP, DAYS } };
  }
  newProblem();
})();
