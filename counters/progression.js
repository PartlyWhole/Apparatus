// Powers-of-ten progression: ramped skills on the place-value counters, with Leitner-style spaced repetition.
// Each counter is an embed-*.html page in a same-origin iframe exposing window.__ctr = { load, read, step, lock, typing }.
(function () {
  const $ = id => document.getElementById(id);
  const wait = ms => new Promise(r => setTimeout(r, ms));

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
    { id: 'w-reach', quick: true, gen: genW('reach') },                       // 3 → 300
    { id: 'w-count', quick: true, gen: genW('count') },                       // 3 → 300: how many ×10?
    { id: 'd-reach', quick: true, gen: genD('reach') },                       // 0.45 → 45
    { id: 'd-count', quick: true, gen: genD('count') },
    { id: 'mp-times', quick: true, gen: lvl => lvl === 0 ? shiftP('reach', 'mt', 1, decimal(1, ri(1, 2)), ri(1, 2))
        : lvl === 1 ? shiftP('reach', 'mt', 1, decimal(ri(0, 2), ri(2, 3)), ri(2, 3))
        : shiftP('count', 'mt', 1, decimal(ri(0, 3), ri(1, 4)), ri(2, 5)) },
    { id: 'mp-divide', quick: true, gen: lvl => lvl === 0 ? shiftP('reach', 'md', -1, wholeZ(ri(2, 3)), ri(1, 2))
        : lvl === 1 ? shiftP('reach', 'md', -1, one([wholeZ(ri(1, 4)), decimal(ri(1, 2), 1)]), ri(2, 3))
        : shiftP('count', 'md', -1, run(ri(1, 3)), ri(3, 5)) },
    { id: 'mixed', gen: genCalc },                               // 3.6 × 100 = ?   45 ÷ 1000 = ?
    { id: 'sci-big', gen: lvl => lvl === 0 ? sciP('toSci', 1, ri(1, 3)) : lvl === 1 ? sciP('toSci', 2, ri(2, 5)) : sciP('toSci', ri(2, 3), ri(3, 7)) },
    { id: 'sci-small', gen: lvl => lvl === 0 ? sciP('toSci', 1, ri(-2, -1)) : lvl === 1 ? sciP('toSci', 2, ri(-3, -1)) : sciP('toSci', ri(2, 3), ri(-5, -2)) },
    { id: 'sci-back', gen: lvl => lvl === 0 ? sciP('fromSci', ri(1, 2), one([1, 2, 3, -1, -2]))
        : lvl === 1 ? sciP('fromSci', 2, one([1, 2, 3, 4, -1, -2, -3, -4]))
        : sciP('fromSci', ri(2, 3), one([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7])) },
    { id: 'sci-mixed', gen: lvl => one([genCalc, SKILLS[7].gen, SKILLS[8].gen, SKILLS[9].gen])(Math.max(1, lvl)) }
  ];

  // ---------- spaced repetition (Leitner boxes per skill) ----------
  // box 0: learning. Levels 0→1→2 after 2 first-try right in a row; 3 in a row at level 2 masters it (box 1).
  // A mastered skill returns after GAP[box] problems, or after DAYS[box] days, whichever comes first.
  // Right on review: box + 1 (max 5). Wrong: back to box 1. With nothing due and nothing new, the soonest-due skill
  // comes early; that keeps its box when right.
  const UP = [2, 2, 3];
  // quick skills (the warm-up counters): one right per level, and their first review starts further out
  const QUICK_UP = [1, 1, 1], QUICK_BOX = 3;
  const upFor = k => k.quick ? QUICK_UP : UP;
  const GAP = [0, 3, 8, 20, 50, 120];
  const DAYS = [0, 0, 1, 3, 7, 21];
  const KEY = 'apparatus.counters.progression.v1';
  const fresh = () => ({ n: 0, lastReview: false, last: null, sk: {} });
  let st = fresh();
  try { const raw = localStorage.getItem(KEY); if (raw) { const o = JSON.parse(raw); if (o && typeof o === 'object' && o.sk) st = Object.assign(fresh(), o); } } catch (_) {}
  SKILLS.forEach(k => { st.sk[k.id] = Object.assign({ lvl: 0, streak: 0, box: 0, dueAt: 0, dueTime: 0 }, st.sk[k.id]); });
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (_) {} }

  function schedule(s) {
    s.dueAt = st.n + GAP[s.box];
    s.dueTime = DAYS[s.box] ? Date.now() + DAYS[s.box] * 864e5 : 0;
  }
  const isDue = (s, now) => s.box > 0 && (s.dueAt <= st.n || (s.dueTime > 0 && now >= s.dueTime));
  function pick() {
    const now = Date.now();
    const learn = SKILLS.find(k => st.sk[k.id].box === 0);
    const due = SKILLS.filter(k => isDue(st.sk[k.id], now)).sort((a, b) => st.sk[a.id].dueAt - st.sk[b.id].dueAt);
    if (due.length > 1 && due[0].id === st.last) due.push(due.shift());
    // reviews interleave with new material: never two reviews in a row while something is still being learned
    if (due.length && (!learn || !st.lastReview)) return { skill: due[0], review: true };
    if (learn) return { skill: learn, review: false };
    const soonest = SKILLS.filter(k => k.id !== st.last).sort((a, b) => st.sk[a.id].dueAt - st.sk[b.id].dueAt)[0];
    return { skill: soonest, review: true, early: true };
  }
  function record(skill, review, early, ok) {
    const s = st.sk[skill.id];
    st.n++;
    if (review) { s.box = !ok ? 1 : early ? s.box : Math.min(5, s.box + 1); schedule(s); }
    else if (ok) {
      s.streak++;
      if (s.streak >= upFor(skill)[s.lvl]) { s.streak = 0; if (s.lvl < 2) s.lvl++; else { s.box = skill.quick ? QUICK_BOX : 1; schedule(s); } }
    } else { s.streak = 0; s.lvl = Math.max(0, s.lvl - 1); }
    st.last = skill.id; st.lastReview = review;
    save(); dots();
  }

  // ---------- progress dots ----------
  const dotsEl = $('dots');
  dotsEl.innerHTML = SKILLS.map(() => '<i></i>').join('');
  function dots() {
    const learn = SKILLS.findIndex(k => st.sk[k.id].box === 0);
    [...dotsEl.children].forEach((d, i) => {
      const s = st.sk[SKILLS[i].id];
      d.className = s.box ? 'm' : i === learn ? 'l' : '';
      d.style.setProperty('--p', s.box ? (0.45 + 0.11 * s.box).toFixed(2) : (() => { const u = upFor(SKILLS[i]); return ((u.slice(0, s.lvl).reduce((a, b) => a + b, 0) + s.streak) / (u[0] + u[1] + u[2])).toFixed(3); })());
      d.toggleAttribute('data-now', !!cur && cur.skill === SKILLS[i]);
    });
    const done = SKILLS.filter(k => st.sk[k.id].box).length;
    dotsEl.setAttribute('aria-label', `${done} of ${SKILLS.length}`);
  }

  // ---------- counters ----------
  const SRC = { w: 'embed-times-10.html', d: 'embed-times-10-decimal.html', mt: 'embed-times-10-moving-point.html', md: 'embed-divide-10-moving-point.html', sci: 'embed-times-10-to-the-n.html' };
  const box = $('ctr'), frames = {};
  function frame(key) {
    if (frames[key]) return frames[key];
    const el = document.createElement('iframe');
    el.src = SRC[key]; el.className = 'off'; el.title = 'Counter'; el.setAttribute('tabindex', '-1');
    const f = { el, ready: null };
    f.ready = new Promise(res => el.addEventListener('load', () => {
      const w = el.contentWindow, stage = w.document.querySelector('.stage');
      const fit = () => { if (!el.classList.contains('off')) el.style.height = Math.ceil(stage.getBoundingClientRect().height) + 'px'; };
      f.fit = fit;
      try { new w.ResizeObserver(fit).observe(stage); } catch (_) {}
      w.__ctrStep = onStep;
      res(w);
    }, { once: true }));
    box.appendChild(el);
    return (frames[key] = f);
  }
  Object.keys(SRC).forEach(frame);           // load all five up front so switching is instant
  let C = null, W = null;
  async function useCounter(key) {
    const f = frame(key);
    W = await f.ready; C = W.__ctr;
    Object.entries(frames).forEach(([k, g]) => g.el.classList.toggle('off', k !== key));
    f.fit();
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
    if (p.type === 'toSci' || p.type === 'fromSci') return `${pretty(p.plain)} = ${p.m} × ${pow(p.e)}`;
    return `${pretty(p.s)} ${opSym(p)} ${tenTo(p.n)} = ${pretty(p.t)}`;
  }
  const input = (id, mode, label, cls) => `<input id="${id}" type="text" inputmode="${mode}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${label}"${cls ? ` class="${cls}"` : ''}>`;

  async function newProblem() {
    const my = ++token;
    const { skill, review, early = false } = pick();
    const s = st.sk[skill.id];
    const lvl = review ? (s.box === 1 ? 1 : 2) : s.lvl;
    let p, key, k = 0;
    do { p = skill.gen(lvl); key = JSON.stringify(p); } while (key === lastKey && ++k < 20);
    lastKey = key;
    cur = { skill, review, early, lvl, p, tries: 0, scored: false, done: false, steps: 0, showing: false };
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
    } else if (p.type === 'toSci') {
      q.innerHTML = `<b>${pretty(p.plain)}</b> =`;
      ans.innerHTML = `${input('m', 'decimal', 'Number from 1 to 10')} <span class="pow">× 10 ${input('e', 'text', 'Power of ten', 'exp')}</span>`;
    } else {
      q.innerHTML = `<b>${p.m} × ${pow(p.e)}</b> =`;
      ans.innerHTML = input('a', 'decimal', 'Answer', 'wide');
    }
    ans.hidden = !ans.innerHTML;
    await useCounter(p.ctr);
    if (my !== token) return;
    if (p.ctr === 'sci') C.load(p.plain, p.type === 'toSci' ? 0 : p.e);
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
      if (cur.steps === p.n) return success();
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

  function score(ok) { if (cur.scored) return; cur.scored = true; record(cur.skill, cur.review, cur.early, ok); }
  function success() {
    score(true);
    finish(`✓ ${line(cur.p)}`, 'good', cur.p.type !== 'reach');
  }
  function fail(msg) {
    score(false);
    cur.tries++;
    if (cur.tries >= 2) return finish(line(cur.p), '', true);
    say(msg, 'bad');
    const p = cur.p, my = token;
    if (p.type === 'reach') wait(900).then(() => { if (my === token && !cur.done) { cur.steps = 0; C.load(p.s); C.lock(false); } });
    else { const i = ans.querySelector('input'); if (i) { i.select(); i.focus({ preventScroll: true }); } }
  }
  // Show the answer line, replay it on the counter, then offer Next.
  async function finish(html, cls, replay) {
    const my = token, p = cur.p;
    cur.done = true;
    say(html, cls);
    ans.querySelectorAll('input').forEach(i => { i.disabled = true; });
    checkBtn.hidden = true; nextBtn.hidden = false;
    nextBtn.focus({ preventScroll: true });
    if (p.ctr !== 'sci') C.lock(true);
    if (!replay) return;
    cur.showing = true;
    if (p.ctr === 'sci') {
      C.load(p.plain, p.type === 'toSci' ? 0 : p.e);
      await wait(600);
      const dir = (p.type === 'toSci') === (p.e > 0) ? -1 : 1;
      for (let k = 0; k < Math.abs(p.e) && my === token; k++) { await C.step(dir); await wait(220); }
    } else {
      C.load(p.s);
      await wait(600);
      for (let k = 0; k < p.n && my === token; k++) { await stepUnlocked(); await wait(320); }
      if (my === token) C.lock(true);
    }
    if (my === token) cur.showing = false;
  }

  // ---------- wiring ----------
  checkBtn.addEventListener('click', check);
  nextBtn.addEventListener('click', newProblem);
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || e.target.closest('button, a')) return;
    e.preventDefault();
    if (cur && cur.done) newProblem(); else check();
  });
  const resetBtn = $('reset');
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
    try { localStorage.removeItem(KEY); } catch (_) {}
    newProblem();
  });
  window.addEventListener('resize', () => Object.values(frames).forEach(f => f.fit && f.fit()));

  // for testing: inspect state, or record an answer for the current problem without the UI
  window.__prog = {
    state: () => JSON.parse(JSON.stringify(st)), current: () => cur && { skill: cur.skill.id, review: cur.review, lvl: cur.lvl, p: cur.p },
    skills: SKILLS.map(k => k.id), setState(o) { st = Object.assign(fresh(), o); save(); dots(); }, sim(ok) { score(ok); return newProblem(); }, next: () => newProblem()
  };

  dots();
  newProblem();
})();
