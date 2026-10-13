// Powers-of-ten progression: ramped skills on the place-value counters, with Leitner-style spaced repetition.
// Each counter is an embed-*.html page in a same-origin iframe exposing window.__ctr = { load, read, step, lock, typing }.
(function () {
  const $ = id => document.getElementById(id);
  // animation speed (scrubber + Instant), shared with every embedded counter; replays scale with it too
  let speed = 1, instant = false;
  const rate = () => instant ? 1000 : speed;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const beat = ms => wait(ms / rate());

  // ---------- decimal strings (no floating point) ----------
  function norm(s) {
    s = String(s).replace(/[,\s ]/g, '');
    if (!/^\d*\.?\d*$/.test(s) || s === '' || s === '.') return null;
    let [i, f = ''] = s.split('.');
    i = i.replace(/^0+/, '') || '0';
    f = f.replace(/0+$/, '');
    return f ? i + '.' + f : i;
  }
  function shift(s, n) {                     // s × 10^n
    const [i, f = ''] = s.split('.');
    let d = i + f, p = i.length + n;
    if (p < 0) { d = '0'.repeat(-p) + d; p = 0; }
    if (p > d.length) d += '0'.repeat(p - d.length);
    return norm(d.slice(0, p) + '.' + d.slice(p));
  }
  const pretty = s => { const [i, f] = s.split('.'); const g = i.length > 4 ? i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : i; return f ? g + '.' + f : g; };
  const minus = n => String(n).replace('-', '−');
  const pow = n => `10<sup>${minus(n)}</sup>`;
  const tenTo = n => pretty('1' + '0'.repeat(n));
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const one = a => a[ri(0, a.length - 1)];
  const nz = () => String(ri(1, 9));
  const dg = () => String(ri(0, 9));
  const intDigits = s => s.split('.')[0] === '0' ? 0 : s.split('.')[0].length;
  const fracDigits = s => (s.split('.')[1] || '').length;
  // k digits, first and last nonzero
  function run(k) { let s = nz(); for (let j = 1; j < k; j++) s += j === k - 1 ? nz() : dg(); return s; }
  // a whole number that may end in or contain zeros: 40, 305, 120, 2,050
  function wholeZ(k) { let s = nz(); for (let j = 1; j < k; j++) s += Math.random() < 0.45 ? '0' : dg(); return s; }
  // ip whole-number digits, fl decimal places (last decimal nonzero); sometimes 0.0… when ip = 0
  function decimal(ip, fl) {
    const i = ip ? nz() + Array.from({ length: ip - 1 }, dg).join('') : '0';
    if (!fl) return norm(i);
    let f = Array.from({ length: fl - 1 }, dg).join('') + nz();
    if (!ip && fl > 1 && Math.random() < 0.4) f = '0' + f.slice(1);
    return norm(i + '.' + f);
  }
  // a number from 1 to 10 with k significant digits
  function mant(k) { return k === 1 ? nz() : norm(nz() + '.' + Array.from({ length: k - 2 }, dg).join('') + nz()); }

  // ---------- skills ----------
  // tier: importance. 0 = core, always in; 1 = in from pace 1/3; 2 = in from pace 2/3 (see pacing below)
  // ctr: w ×10 whole, d ×10 decimal, mt moving point ×10, md moving point ÷10, sci × 10ⁿ
  // types: reach (press until you get there), count (how many presses), calc (type the result), toSci, fromSci
  const shiftP = (type, ctr, dir, s, n) => ({ type, ctr, dir, s, n, t: shift(s, dir * n) });
  const sciP = (type, k, e) => { const m = mant(k); return { type, ctr: 'sci', m, e, plain: shift(m, e) }; };
  const genW = type => lvl => lvl === 0 ? shiftP(type, 'w', 1, nz(), ri(1, 2))
    : lvl === 1 ? shiftP(type, 'w', 1, run(2), ri(2, 3))
    : (s => shiftP(type, 'w', 1, s, ri(3, Math.min(5, 8 - s.length))))(wholeZ(ri(2, 3)));
  const genD = type => lvl => lvl === 0 ? shiftP(type, 'd', 1, one([nz() + '.' + nz(), '0.' + nz()]), 1)
    : lvl === 1 ? shiftP(type, 'd', 1, decimal(ri(0, 1), ri(1, 2)), ri(1, 3))
    : shiftP(type, 'd', 1, decimal(ri(0, 2), ri(2, 3)), ri(2, 5));
  function genCalc(lvl) {
    const dir = one([1, -1]), ctr = dir > 0 ? 'mt' : 'md';
    if (lvl === 0) return shiftP('calc', ctr, dir, one([run(ri(1, 2)), decimal(1, 1)]), ri(1, 2));
    if (lvl === 1) { const ip = ri(0, 2); return shiftP('calc', ctr, dir, decimal(ip, ri(ip ? 0 : 1, 2)), ri(1, 3)); }
    const ip = ri(0, 3), s = decimal(ip, ri(dir > 0 || !ip ? 1 : 0, 3));
    return shiftP('calc', ctr, dir, s, ri(2, dir > 0 ? 4 : Math.min(4, 7 - fracDigits(s))));
  }
  const SKILLS = [
    { id: 'w-reach', tier: 0, quick: true, gen: genW('reach') },                       // 3 → 300
    { id: 'w-count', tier: 2, quick: true, gen: genW('count') },                       // 3 → 300: how many ×10?
    { id: 'd-reach', tier: 0, quick: true, gen: genD('reach') },                       // 0.45 → 45
    { id: 'd-count', tier: 2, quick: true, gen: genD('count') },
    { id: 'mp-times', tier: 0, quick: true, gen: lvl => lvl === 0 ? shiftP('reach', 'mt', 1, decimal(1, ri(1, 2)), ri(1, 2))
        : lvl === 1 ? shiftP('reach', 'mt', 1, decimal(ri(0, 2), ri(2, 3)), ri(2, 3))
        : shiftP('count', 'mt', 1, decimal(ri(0, 3), ri(1, 4)), ri(2, 5)) },
    { id: 'mp-divide', tier: 1, quick: true, gen: lvl => lvl === 0 ? shiftP('reach', 'md', -1, wholeZ(ri(2, 3)), ri(1, 2))
        : lvl === 1 ? shiftP('reach', 'md', -1, one([wholeZ(ri(1, 4)), decimal(ri(1, 2), 1)]), ri(2, 3))
        : shiftP('count', 'md', -1, run(ri(1, 3)), ri(3, 5)) },
    { id: 'mixed', tier: 0, gen: genCalc },                               // 3.6 × 100 = ?   45 ÷ 1000 = ?
    // scaffold: tap where the point goes so the number is from 1 to 10 (2.6, not 26. or .26)
    { id: 'sci-point', tier: 0, quick: true, gen: lvl => lvl === 0 ? sciP('point', 2, ri(1, 3))
        : lvl === 1 ? sciP('point', 3, one([ri(2, 5), -ri(1, 3)])) : sciP('point', ri(3, 4), one([ri(3, 7), -ri(2, 5)])) },
    { id: 'sci-big', tier: 0, gen: lvl => lvl === 0 ? sciP('toSci', 1, ri(1, 3)) : lvl === 1 ? sciP('toSci', 2, ri(2, 5)) : sciP('toSci', ri(2, 3), ri(3, 7)) },
    { id: 'sci-small', tier: 0, gen: lvl => lvl === 0 ? sciP('toSci', 1, ri(-2, -1)) : lvl === 1 ? sciP('toSci', 2, ri(-3, -1)) : sciP('toSci', ri(2, 3), ri(-5, -2)) },
    { id: 'sci-back', tier: 0, gen: lvl => lvl === 0 ? sciP('fromSci', ri(1, 2), one([1, 2, 3, -1, -2]))
        : lvl === 1 ? sciP('fromSci', 2, one([1, 2, 3, 4, -1, -2, -3, -4]))
        : sciP('fromSci', ri(2, 3), one([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7])) },
    { id: 'sci-mixed', tier: 1, gen: lvl => one([genCalc, ...['sci-big', 'sci-small', 'sci-back'].map(id => SKILLS.find(k => k.id === id).gen)])(Math.max(1, lvl)) }
  ];
  const NAMES = { 'w-reach': '×10 · reach', 'w-count': '×10 · how many', 'd-reach': '×10 decimals · reach', 'd-count': '×10 decimals · how many',
    'mp-times': 'Moving point ×10', 'mp-divide': 'Moving point ÷10', mixed: '× and ÷ by 10ⁿ', 'sci-point': 'Where the point goes', 'sci-big': 'Big → scientific',
    'sci-small': 'Small → scientific', 'sci-back': 'Scientific → decimal', 'sci-mixed': 'Mixed' };
  // ?skill=<id>: practice one skill on its own; saved progress is left alone
  const ONLY_ID = new URLSearchParams(location.search).get('skill');
  const PR = { lvl: 0, streak: 0 };
  function practiced(ok) {
    if (ok) { if (++PR.streak >= 2) { PR.streak = 0; PR.lvl = Math.min(2, PR.lvl + 1); } }
    else { PR.streak = 0; PR.lvl = Math.max(0, PR.lvl - 1); }
  }
  let ONLY = SKILLS.find(k => k.id === ONLY_ID) || null;

  // ---------- pacing: one knob, 0 = cram … 1 = full ----------
  // ?pace=0.35 sets any value; the Cram · Full control sets 0 or 1. Shared with the other paths, and remembered.
  // Every tuning constant below is derived from PACE, in tune(), by piecewise-linear interpolation through three
  // anchors (cram 0, middle 0.5, full 1); counts are rounded. Each is monotonic in pace. The middle is the original tuning.
  const PACE_KEY = 'apparatus.pace';
  const clamp01 = x => Math.min(1, Math.max(0, x));
  let PACE = 1;
  try { const v = parseFloat(localStorage.getItem(PACE_KEY)); if (isFinite(v)) PACE = clamp01(v); } catch (_) {}
  { const v = parseFloat(new URLSearchParams(location.search).get('pace'));
    if (isFinite(v)) { PACE = clamp01(v); try { localStorage.setItem(PACE_KEY, String(PACE)); } catch (_) {} } }
  let T;
  function tune() {
    const at = (c, m, f) => PACE <= 0.5 ? c + (m - c) * PACE * 2 : m + (f - m) * (PACE - 0.5) * 2;
    const n = (c, m, f) => Math.round(at(c, m, f));
    const ns = (c, m, f) => c.map((_, i) => n(c[i], m[i], f[i]));
    T = {
      // which skills are in: tier 0 always, tier 1 from pace 1/3, tier 2 from pace 2/3
      tiers: Math.floor(PACE * 3 + 1e-9),
      // first-try right answers in a row to pass each level (easy, medium, hard); 0 skips that level.
      // cram skips the easy level; full asks for 2–3 per level
      up: ns([0, 1, 1], [1, 2, 2], [2, 3, 3]),
      // quick skills (warm-up counters): stay quick (no hard level) below pace 0.75; easy level skipped below 0.25
      quickUp: ns([0, 1, 0], [1, 1, 0], [1, 1, 1]),
      // a quick skill's first review starts in this box
      quickBox: 3,
      // review gaps per box, in problems and in days (whichever comes first): cram is dense, full is long-term
      gap: ns([0, 2, 4, 8, 14, 25], [0, 3, 8, 20, 50, 120], [0, 4, 12, 30, 80, 200]),
      days: [0, 0, 1, 3, 7, 21].map((m, i) => at([0, 0, 0, 1, 2, 4][i], m, [0, 1, 3, 7, 21, 60][i])),
      // while something is still being learned: new problems needed before a review, and most reviews in a row
      newGap: n(2, 1, 1),
      revRun: n(1, 1, 2)
    };
  }
  tune();
  const active = k => k.tier <= T.tiers;
  const ACTIVE = () => SKILLS.filter(active);

  // ---------- spaced repetition (Leitner boxes per skill) ----------
  // box 0: learning, through the levels by first-try right answers in a row (T.up); passing the last level masters
  // it (box 1; quick skills box T.quickBox). A mastered skill returns after T.gap[box] problems, or after T.days[box]
  // days, whichever comes first. Right on review: box + 1 (max 5). Wrong: back to box 1. With nothing due and nothing
  // new, the soonest-due skill comes early; that keeps its box when right.
  const upFor = k => k.quick ? T.quickUp : T.up;
  const KEY = 'apparatus.counters.progression.v1';
  // at: SKILLS index where learning resumes (› moves it on); visit: a mastered skill served again via ‹ ›, on its own
  // levels {id, lvl, streak}, never touching its box
  const fresh = () => ({ n: 0, newRun: 0, revRun: 0, last: null, at: 0, visit: null, sk: {} });
  let st = fresh();
  try { const raw = localStorage.getItem(KEY); if (raw) { const o = JSON.parse(raw); if (o && typeof o === 'object' && o.sk) { st = Object.assign(fresh(), o); if (o.lastReview) st.revRun = 1; delete st.lastReview; } } } catch (_) {}
  SKILLS.forEach(k => { st.sk[k.id] = Object.assign({ lvl: 0, streak: 0, box: 0, dueAt: 0, dueTime: 0 }, st.sk[k.id]); });
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (_) {} }

  function schedule(s) {
    s.dueAt = st.n + T.gap[s.box];
    s.dueTime = T.days[s.box] ? Date.now() + T.days[s.box] * 864e5 : 0;
  }
  // a learning skill sits on its first level that isn't skipped at this pace; past the last one it is mastered
  function settle(k) {
    const s = st.sk[k.id], u = upFor(k);
    if (s.box) return;
    while (s.lvl < 3 && !u[s.lvl]) { s.lvl++; s.streak = 0; }
    if (s.lvl > 2) { s.lvl = 2; s.streak = 0; s.box = k.quick ? T.quickBox : 1; schedule(s); }
  }
  const settleAll = () => SKILLS.forEach(settle);
  settleAll();
  const isDue = (s, now) => s.box > 0 && (s.dueAt <= st.n || (s.dueTime > 0 && now >= s.dueTime));
  const byId = id => SKILLS.find(k => k.id === id);
  const visiting = () => st.visit && active(byId(st.visit.id)) ? byId(st.visit.id) : null;
  // the skill being learned: the first unmastered one from the cursor on, then any skipped earlier
  function learnSkill() {
    const open = ACTIVE().filter(k => st.sk[k.id].box === 0);
    return open.find(k => SKILLS.indexOf(k) >= st.at) || open[0] || null;
  }
  function pick() {
    if (ONLY) return { skill: ONLY, review: false };
    const now = Date.now(), list = ACTIVE(), vis = visiting();
    const learn = vis || learnSkill();
    const due = list.filter(k => k !== vis && isDue(st.sk[k.id], now)).sort((a, b) => st.sk[a.id].dueAt - st.sk[b.id].dueAt);
    if (due.length > 1 && due[0].id === st.last) due.push(due.shift());
    // reviews interleave with new material: while something is still being learned, a review needs T.newGap new
    // problems before it, and at most T.revRun reviews come in a row
    const room = !learn || (st.revRun ? st.revRun < T.revRun : st.newRun >= T.newGap);
    if (due.length && room) return { skill: due[0], review: true };
    if (learn) return { skill: learn, review: false, visit: learn === vis };
    const soonest = list.filter(k => k.id !== st.last).sort((a, b) => st.sk[a.id].dueAt - st.sk[b.id].dueAt)[0] || list[0];
    return { skill: soonest, review: true, early: true };
  }
  function record(skill, review, early, ok, visit) {
    if (ONLY) { practiced(ok); return; }
    const s = st.sk[skill.id], v = st.visit;
    st.n++;
    if (visit && v && v.id === skill.id) {            // its own ramp; done after the last level
      const u = upFor(skill);
      if (ok) { if (++v.streak >= u[v.lvl]) { v.lvl++; v.streak = 0; } } else { v.streak = 0; v.lvl = Math.max(0, v.lvl - 1); }
      while (v.lvl < 3 && !u[v.lvl]) v.lvl++;
      if (v.lvl > 2) st.visit = null;
    }
    else if (review) { s.box = !ok ? 1 : early ? s.box : Math.min(5, s.box + 1); schedule(s); }
    else if (s.box) {}                                // mastered meanwhile (pace switched mid-problem)
    else if (ok) {
      if (++s.streak >= upFor(skill)[s.lvl]) { s.lvl++; s.streak = 0; }
    } else { s.streak = 0; s.lvl = Math.max(0, s.lvl - 1); }
    settle(skill);
    if (review) { st.revRun++; st.newRun = 0; } else { st.newRun++; st.revRun = 0; }
    st.last = skill.id;
    save(); dots();
  }

  // ---------- progress dots ----------
  const dotsEl = $('dots');
  dotsEl.innerHTML = SKILLS.map(k => `<i title="${NAMES[k.id]}"></i>`).join('');
  function dots() {
    if (ONLY) return;
    const list = ACTIVE(), learn = visiting() || learnSkill();
    [...dotsEl.children].forEach((d, i) => {
      const k = SKILLS[i], s = st.sk[k.id], u = upFor(k);
      d.hidden = !active(k);
      d.className = s.box ? 'm' : k === learn ? 'l' : '';
      d.style.setProperty('--p', s.box ? (0.45 + 0.11 * s.box).toFixed(2) : ((u.slice(0, s.lvl).reduce((a, b) => a + b, 0) + s.streak) / (u[0] + u[1] + u[2])).toFixed(3));
      d.toggleAttribute('data-now', !!cur && cur.skill === k);
    });
    const done = list.filter(k => st.sk[k.id].box).length;
    dotsEl.setAttribute('aria-label', `${done} of ${list.length} learned`);
  }

  // ---------- counters ----------
  const SRC = { w: 'embed-times-10.html', d: 'embed-times-10-decimal.html', mt: 'embed-times-10-moving-point.html', md: 'embed-divide-10-moving-point.html', sci: 'embed-times-10-to-the-n.html' };
  const box = $('ctr'), frames = {};
  function frame(key) {
    if (frames[key]) return frames[key];
    const el = document.createElement('iframe');
    el.src = SRC[key]; el.className = 'off'; el.title = 'Counter';
    const f = { el, ready: null };
    f.ready = new Promise(res => el.addEventListener('load', () => {
      const w = el.contentWindow, stage = w.document.querySelector('.stage');
      const fit = () => { if (!el.classList.contains('off')) el.style.height = Math.ceil(stage.getBoundingClientRect().height) + 'px'; };
      f.fit = fit;
      try { new w.ResizeObserver(fit).observe(stage); } catch (_) {}
      w.__ctrStep = onStep;
      w.document.addEventListener('keydown', e => {   // Enter in the counter checks / moves on, like everywhere else
        if (e.key !== 'Enter' || e.target.closest('input, textarea, [contenteditable]')) return;
        e.preventDefault(); e.stopPropagation(); onEnter();
      }, true);
      w.__ctr.speed(speed, instant);
      res(w);
    }, { once: true }));
    box.appendChild(el);
    return (frames[key] = f);
  }
  Object.keys(SRC).forEach(frame);
  const speedIn = $('speed'), speedOut = $('speedOut'), instIn = $('instant');
  function applySpeed() {
    speed = parseFloat(speedIn.value); instant = instIn.checked;
    speedOut.textContent = (Math.round(speed * 100) / 100) + '×'; speedIn.disabled = instant;
    Object.values(frames).forEach(f => f.ready.then(w => w.__ctr.speed(speed, instant)));
  }
  speedIn.addEventListener('input', applySpeed);
  instIn.addEventListener('change', applySpeed);           // load all five up front so switching is instant
  let C = null, W = null;
  async function useCounter(key) {
    const f = frame(key);
    W = await f.ready; C = W.__ctr;
    const changed = f.el.classList.contains('off');
    Object.entries(frames).forEach(([k, g]) => g.el.classList.toggle('off', k !== key));
    f.fit();
    if (changed && !instant && !matchMedia('(prefers-reduced-motion: reduce)').matches && f.el.animate)
      f.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
    return C;
  }
  async function stepUnlocked(dir) {           // the flip counters' step ignores the lock; the moving-point ones need it lifted
    if (!/^m/.test(cur.p.ctr)) return C.step(dir);
    const was = W.__ctrLocked;
    W.__ctrLocked = false;
    await C.step(dir);
    W.__ctrLocked = was;
  }

  // ---------- one problem ----------
  const q = $('q'), ans = $('ans'), fb = $('fb'), checkBtn = $('check'), nextBtn = $('next');
  let cur = null, token = 0, lastKey = '';
  function say(html, cls) { fb.innerHTML = html; fb.className = 'fb' + (cls ? ' ' + cls : ''); }
  const opSym = p => p.dir > 0 ? '×' : '÷';
  function line(p) {
    if (p.type === 'toSci' || p.type === 'fromSci' || p.type === 'point') return `${pretty(p.plain)} = ${p.m} × ${pow(p.e)}`;
    return `${pretty(p.s)} ${opSym(p)} ${tenTo(p.n)} = ${pretty(p.t)}`;
  }
  const input = (id, mode, label, cls) => `<input id="${id}" type="text" inputmode="${mode}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${label}" aria-describedby="q"${cls ? ` class="${cls}"` : ''}>`;

  async function newProblem() {
    const my = ++token;
    const { skill, review, early = false, visit = false } = pick();
    const s = st.sk[skill.id];
    const lvl = ONLY ? PR.lvl : visit ? st.visit.lvl : review ? (s.box === 1 ? 1 : 2) : s.lvl;
    let p, key, k = 0;
    do { p = skill.gen(lvl); key = JSON.stringify(p); } while (key === lastKey && ++k < 20);
    lastKey = key;
    cur = { skill, review, early, visit, lvl, p, tries: 0, scored: false, done: false, steps: 0, showing: false };
    dots();
    say(''); nextBtn.hidden = true; checkBtn.hidden = false; checkBtn.disabled = false;
    const S = `<b>${pretty(p.s || '')}</b>`, T = `<b>${pretty(p.t || '')}</b>`;
    ans.innerHTML = '';
    if (p.type === 'reach') q.innerHTML = `${S} → ${T}`;
    else if (p.type === 'count') {
      q.innerHTML = `${S} → ${T}<span class="sub">How many ${opSym(p)}10?</span>`;
      ans.innerHTML = input('a', 'numeric', 'How many', 'n');
    } else if (p.type === 'calc') {
      q.innerHTML = `<b>${pretty(p.s)} ${opSym(p)} ${tenTo(p.n)}</b> =`;
      ans.innerHTML = input('a', 'decimal', 'Answer', 'wide');
    } else if (p.type === 'point') {
      // the digits with a tappable gap before, between and after them
      q.innerHTML = `<b>${pretty(p.plain)}</b><span class="sub">Where does the point go?</span>`;
      const d = p.m.replace('.', '');
      ans.innerHTML = '<span class="digits">' + [...d].map((c, i) => `<button type="button" class="gap" data-i="${i}" aria-label="Point before digit ${i + 1}"></button><span>${c}</span>`).join('')
        + `<button type="button" class="gap" data-i="${d.length}" aria-label="Point after the last digit"></button></span>`;
      ans.querySelectorAll('.gap').forEach(b => b.addEventListener('click', () => {
        if (!cur || cur.done || cur.showing) return;
        ans.querySelectorAll('.gap.bad').forEach(x => x.classList.remove('bad'));
        if (+b.dataset.i === 1) return success();
        b.classList.add('bad');
        fail('Try again');
      }));
    } else if (p.type === 'toSci') {
      q.innerHTML = `<b>${pretty(p.plain)}</b> =`;
      ans.innerHTML = `${input('m', 'decimal', 'Number from 1 to 10')} <span class="pow">× 10 ${input('e', 'text', 'Power of ten', 'exp')}</span>`;
    } else {
      q.innerHTML = `<b>${p.m} × ${pow(p.e)}</b> =`;
      ans.innerHTML = input('a', 'decimal', 'Answer', 'wide');
    }
    ans.hidden = !ans.innerHTML;
    checkBtn.hidden = p.type === 'point';
    await useCounter(p.ctr);
    if (my !== token) return;
    if (p.ctr === 'sci') C.load(p.plain, p.type === 'fromSci' ? p.e : 0);
    else { C.load(p.s); C.lock(p.type !== 'reach'); }
    const first = ans.querySelector('input');
    if (first) first.focus({ preventScroll: true });
    else checkBtn.focus({ preventScroll: true });
  }

  function onStep() {
    if (!cur || cur.showing || cur.done || cur.p.type !== 'reach') return;
    cur.steps++;
    say('');
    if (cur.steps > cur.p.n) { C.lock(true); fail('Too far'); }
  }

  function check() {
    if (!cur || cur.done || cur.showing) return;
    const p = cur.p;
    if (p.type === 'reach') {
      if (cur.counting) {                      // reached it: now say how many presses it took
        const v = $('a').value.trim();
        if (!/^\d+$/.test(v)) return;
        return +v === p.n ? success() : fail('Try again');
      }
      if (cur.steps === p.n) return askCount();
      if (cur.steps < p.n) return say('Not yet', 'bad');
      return;
    }
    if (p.type === 'count') {
      const v = $('a').value.trim();
      if (!/^\d+$/.test(v)) return;
      return +v === p.n ? success() : fail('Try again');
    }
    if (p.type === 'toSci') {
      const m = norm($('m').value), e = parseInt($('e').value.replace(/[−–]/, '-').replace(/\s/g, ''), 10);
      if (!m || isNaN(e)) return;
      if (m === p.m && e === p.e) return success();
      return fail(shift(m, e) === p.plain ? 'Equal, but 1 ≤ first number < 10' : 'Try again');
    }
    const v = norm($('a').value);
    if (!v) return;
    const want = p.type === 'calc' ? p.t : p.plain;
    return v === want ? success() : fail('Try again');
  }

  // is this answer box right on its own? (toSci has two)
  function right(i) {
    const p = cur.p;
    if (i.id === 'e') return parseInt(i.value.replace(/[−–]/, '-').replace(/\s/g, ''), 10) === p.e;
    if (i.id === 'm') return norm(i.value) === p.m;
    if (p.type === 'count' || p.type === 'reach') return /^\d+$/.test(i.value.trim()) && +i.value.trim() === p.n;
    return norm(i.value) === (p.type === 'calc' ? p.t : p.plain);
  }
  function askCount() {
    const p = cur.p;
    cur.counting = true;
    C.lock(true);
    say('');
    q.insertAdjacentHTML('beforeend', `<span class="sub">How many ${opSym(p)}10?</span>`);
    ans.innerHTML = input('a', 'numeric', 'How many', 'n');
    ans.hidden = false;
    $('a').focus({ preventScroll: true });
  }
  function score(ok) { if (cur.scored) return; cur.scored = true; record(cur.skill, cur.review, cur.early, ok, cur.visit); }
  function success() {
    score(true);
    finish(`✓ ${line(cur.p)}`, 'good', cur.p.type !== 'reach');
  }
  function fail(msg) {
    score(false);
    cur.tries++;
    if (cur.tries >= 2) return finish(line(cur.p), 'show', true);
    say(msg, 'bad');
    const p = cur.p, my = token;
    if (p.type === 'reach' && !cur.counting) wait(900).then(() => { if (my === token && !cur.done) { cur.steps = 0; C.load(p.s); C.lock(false); } });
    else { const i = [...ans.querySelectorAll('input')].find(i => !right(i)) || ans.querySelector('input'); if (i) { i.select(); i.focus({ preventScroll: true }); } }
  }
  // Show the answer line, replay it on the counter, then offer Next.
  async function finish(html, cls, replay) {
    const my = token, p = cur.p;
    cur.done = true;
    say(html, cls);
    ans.querySelectorAll('.gap').forEach(b => { b.disabled = true; b.classList.toggle('good', b.dataset.i === '1'); });
    ans.querySelectorAll('input').forEach(i => { i.disabled = true; if (i.value.trim()) i.classList.add(right(i) ? 'good' : 'bad'); });
    checkBtn.hidden = true; nextBtn.hidden = false;
    nextBtn.focus({ preventScroll: true });
    if (p.ctr !== 'sci') C.lock(true);
    if (!replay) return;
    cur.showing = true;
    if (p.ctr === 'sci') {
      C.load(p.plain, p.type === 'fromSci' ? p.e : 0);
      await beat(600);
      const dir = (p.type !== 'fromSci') === (p.e > 0) ? -1 : 1;
      for (let k = 0; k < Math.abs(p.e) && my === token; k++) { await C.step(dir); await beat(220); }
    } else {
      C.load(p.s);
      await beat(600);
      for (let k = 0; k < p.n && my === token; k++) { await stepUnlocked(); await beat(320); }
      if (my === token) C.lock(true);
    }
    if (my === token) cur.showing = false;
  }

  // ---------- wiring ----------
  checkBtn.addEventListener('click', check);
  nextBtn.addEventListener('click', newProblem);
  function onEnter() { if (cur && cur.done) newProblem(); else check(); }
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.target.closest('button, a')) { e.preventDefault(); onEnter(); return; }
    // the counter's own keys (↑ ×10, ↓ ÷10) work from anywhere outside a text box
    if (W && /^(ArrowUp|ArrowDown|x|\*|\/)$/.test(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey && !e.target.closest('input, textarea, select')) {
      e.preventDefault();
      W.document.body.dispatchEvent(new W.KeyboardEvent('keydown', { key: e.key, bubbles: true, cancelable: true }));
    }
  });
  const resetBtn = $('reset'), paceEl = $('pace');
  const showOnly = () => { dotsEl.textContent = NAMES[ONLY.id]; dotsEl.classList.add('only'); resetBtn.hidden = true; paceEl.hidden = true; };
  if (ONLY) showOnly();
  // ‹ › : previous / next included skill. Practice mode switches skill; otherwise › moves learning past the current skill
  // (no credit, no penalty; skipped skills come back after the rest) and ‹ serves the previous skill now.
  function go(d) {
    const list = ACTIVE();
    const here = ONLY || visiting() || learnSkill() || (cur && cur.skill) || list[0];
    const pos = SKILLS.indexOf(here);                  // wraps around at either end
    const k = d > 0 ? list.find(k => SKILLS.indexOf(k) > pos) || list[0]
      : [...list].reverse().find(k => SKILLS.indexOf(k) < pos) || list[list.length - 1];
    if (ONLY) {
      ONLY = k; PR.lvl = 0; PR.streak = 0; showOnly();
      const u = new URL(location.href); u.searchParams.set('skill', k.id); history.replaceState(null, '', u);
    } else {
      st.at = SKILLS.indexOf(k);
      const u = upFor(k); let lvl = 0; while (lvl < 2 && !u[lvl]) lvl++;
      st.visit = st.sk[k.id].box ? { id: k.id, lvl, streak: 0 } : null;
      st.revRun = T.revRun; st.newRun = 0;             // the chosen skill comes first, before any review
      save();
    }
    newProblem();
  }
  $('prev').addEventListener('click', () => go(-1));
  $('skip').addEventListener('click', () => go(1));
  const paceBtns = [...paceEl.querySelectorAll('button')];
  const showPace = () => paceBtns.forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.pace === PACE)));
  // switching pace re-derives the tuning; mastered skills stay mastered, learning ones move to a level that's still in
  function setPace(v) {
    PACE = clamp01(v);
    try { localStorage.setItem(PACE_KEY, String(PACE)); } catch (_) {}
    const u = new URL(location.href);
    if (u.searchParams.has('pace')) { u.searchParams.delete('pace'); history.replaceState(null, '', u); }
    tune(); settleAll(); if (!ONLY) save(); showPace(); dots();
    if (!ONLY && cur && !cur.done && (!active(cur.skill) || (!cur.review && st.sk[cur.skill.id].box))) newProblem();
  }
  paceBtns.forEach(b => b.addEventListener('click', () => { if (+b.dataset.pace !== PACE) setPace(+b.dataset.pace); }));
  showPace();
  let armed = null;
  resetBtn.addEventListener('click', () => {
    if (!armed) {
      resetBtn.classList.add('armed'); resetBtn.textContent = 'Reset?';
      armed = setTimeout(() => { armed = null; resetBtn.classList.remove('armed'); resetBtn.textContent = '↺'; }, 3000);
      return;
    }
    clearTimeout(armed); armed = null; resetBtn.classList.remove('armed'); resetBtn.textContent = '↺';
    st = fresh();
    SKILLS.forEach(k => { st.sk[k.id] = { lvl: 0, streak: 0, box: 0, dueAt: 0, dueTime: 0 }; });
    settleAll();
    try { localStorage.removeItem(KEY); } catch (_) {}
    newProblem();
  });
  window.addEventListener('resize', () => Object.values(frames).forEach(f => f.fit && f.fit()));

  // for testing: inspect state, or record an answer for the current problem without the UI
  window.__prog = {
    state: () => JSON.parse(JSON.stringify(st)), current: () => cur && { skill: cur.skill.id, review: cur.review, lvl: cur.lvl, p: cur.p },
    skills: SKILLS.map(k => k.id), pace: () => PACE, setPace, tuning: () => JSON.parse(JSON.stringify(Object.assign({ skills: ACTIVE().map(k => k.id) }, T))), setState(o) { st = Object.assign(fresh(), o); SKILLS.forEach(k => { st.sk[k.id] = Object.assign({ lvl: 0, streak: 0, box: 0, dueAt: 0, dueTime: 0 }, st.sk[k.id]); }); settleAll(); save(); dots(); }, sim(ok) { score(ok); return newProblem(); }, next: () => newProblem()
  };

  dots();
  newProblem();
})();
