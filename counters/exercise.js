// Exercise panel for the counter pages. The counter page exposes window.__ctr (load, read, step, lock, typing);
// window.EXERCISE_KIND picks the problems: 'times10', 'times10dec', 'mpTimes', 'mpDivide' or 'sci'.
(function () {
  const KIND = window.EXERCISE_KIND;
  const C = window.__ctr;
  const $ = id => document.getElementById(id);
  const wait = ms => new Promise(r => setTimeout(r, ms));

  // ---------- decimal strings (no floating point) ----------
  function norm(s) {
    s = String(s).replace(/[,\s ]/g, '');
    if (!/^\d*\.?\d*$/.test(s) || s === '' || s === '.') return null;
    let [i, f = ''] = s.split('.');
    i = i.replace(/^0+/, '') || '0';
    f = f.replace(/0+$/, '');
    return f ? i + '.' + f : i;
  }
  // s × 10^n
  function shift(s, n) {
    const [i, f = ''] = s.split('.');
    let d = i + f, p = i.length + n;
    if (p < 0) { d = '0'.repeat(-p) + d; p = 0; }
    if (p > d.length) d += '0'.repeat(p - d.length);
    return norm(d.slice(0, p) + '.' + d.slice(p));
  }
  const pretty = s => { const [i, f] = s.split('.'); const g = i.length > 4 ? i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : i; return f ? g + '.' + f : g; };
  const minus = n => String(n).replace('-', '−');
  const pow = n => `10<sup>${minus(n)}</sup>`;
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const nz = () => String(ri(1, 9));
  const dg = () => String(ri(0, 9));
  // a run of k digits starting and ending with a nonzero digit
  function digitsRun(k) { let s = nz(); for (let j = 1; j < k; j++) s += j === k - 1 ? nz() : dg(); return s; }
  // a decimal with ip whole-number digits and fl decimal places (last decimal nonzero)
  function decimal(ip, fl) {
    const i = ip ? nz() + Array.from({ length: ip - 1 }, dg).join('') : '0';
    let f = Array.from({ length: fl - 1 }, dg).join('') + nz();
    if (!ip && fl > 1 && Math.random() < 0.4) f = '0' + f.slice(1);  // sometimes 0.0…
    return norm(fl ? i + '.' + f : i);
  }

  // ---------- problem sets ----------
  const SHIFT = {
    times10: { up: true, gen() { const s = digitsRun(ri(1, 3)); return { s, n: ri(1, Math.min(5, 8 - s.length)) }; } },
    times10dec: { up: true, gen() { return { s: decimal(ri(0, 2), ri(1, 3)), n: ri(1, 5) }; } },
    mpTimes: { up: true, gen() { return { s: decimal(ri(0, 3), ri(1, 4)), n: ri(1, 5) }; } },
    mpDivide: {
      up: false,
      gen() { const fl = Math.random() < 0.6 ? 0 : ri(1, 2); const s = fl ? decimal(ri(1, 3), fl) : digitsRun(ri(1, 4)); return { s, n: ri(1, Math.min(5, 7 - fl)) }; }
    }
  };

  let mode, prob, steps, scored, done, showing = false;
  let right = 0, total = 0, streak = 0;
  const q = $('exQ'), ans = $('exAnswer'), fb = $('exFb');
  const retryBtn = $('exRetry'), showBtn = $('exShow'), checkBtn = $('exCheck'), nextBtn = $('exNext');

  function say(html, cls) { fb.innerHTML = html; fb.className = 'ex-fb' + (cls ? ' ' + cls : ''); }
  function score(ok) {
    if (scored) return;
    scored = true; total++;
    if (ok) { right++; streak++; } else streak = 0;
    $('exScore').textContent = `${right}/${total}`;
  }
  function busy(on) {
    [retryBtn, showBtn, checkBtn, nextBtn].forEach(b => { b.disabled = on; });
    ans.querySelectorAll('input').forEach(i => { i.disabled = on; });
  }
  async function stepUnlocked(dir) {
    const was = window.__ctrLocked;
    window.__ctrLocked = false;
    await C.step(dir);
    window.__ctrLocked = was;
  }

  // ---------- ×10 / ÷10 counters ----------
  const cfg = SHIFT[KIND];
  const op = cfg && (cfg.up ? '×' : '÷');
  const verb = cfg && (cfg.up ? 'multiply' : 'divide');
  function target() { return shift(prob.s, cfg.up ? prob.n : -prob.n); }
  function chain() {
    const t = pretty(target());
    return prob.n <= 6
      ? `${pretty(prob.s)}${` ${op} 10`.repeat(prob.n)} = ${t}`
      : `${pretty(prob.s)} ${op} ${pow(prob.n)} = ${t}`;
  }
  function loadShift() {
    steps = 0; done = false;
    C.load(prob.s);
    C.lock(mode === 'count');
  }
  window.__ctrStep = () => {
    if (showing || !cfg || mode !== 'make' || done) return;
    steps++;
    say('');
  };

  // ---------- scientific notation ----------
  function genSci() {
    const sig = ri(1, 3);
    const m = sig === 1 ? nz() : nz() + '.' + Array.from({ length: sig - 2 }, dg).join('') + nz();
    const exps = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7].filter(e => (sig - 1) - e <= 8);
    const e = exps[ri(0, exps.length - 1)];
    return { m: norm(m), e, plain: shift(norm(m), e) };
  }
  function loadSci() {
    done = false;
    if (mode === 'make') C.load(prob.plain, 0);
    else C.load(prob.plain, prob.e);
  }
  function sciLine() { return `${pretty(prob.plain)} = ${prob.m} × ${pow(prob.e)}`; }

  // ---------- one problem ----------
  function newProblem() {
    showing = false; scored = false; done = false;
    say('');
    retryBtn.hidden = false; showBtn.hidden = false;
    if (cfg) {
      prob = cfg.gen();
      const s = `<b>${pretty(prob.s)}</b>`, t = `<b>${pretty(target())}</b>`;
      if (mode === 'make') {
        q.innerHTML = `${s} → ${t}`;
        ans.hidden = true; checkBtn.hidden = false;
      } else {
        q.innerHTML = `${s} → ${t}<span class="ex-sub">How many ${op}10?</span>`;
        ans.hidden = false; checkBtn.hidden = false; retryBtn.hidden = true;
        ans.innerHTML = `<input id="exN" type="text" inputmode="numeric" autocomplete="off" aria-label="How many times" style="width:5ch">`;
      }
      loadShift();
    } else {
      prob = genSci();
      ans.hidden = false; checkBtn.hidden = false; retryBtn.hidden = false;
      if (mode === 'make') {
        q.innerHTML = `<b>${pretty(prob.plain)}</b> =`;
        ans.innerHTML = `<input id="exM" type="text" inputmode="decimal" autocomplete="off" aria-label="Number between 1 and 10"> <span class="pow">× 10 <input id="exE" class="exp" type="text" inputmode="numeric" autocomplete="off" aria-label="Power of ten"></span>`;
      } else {
        q.innerHTML = `<b>${prob.m} × ${pow(prob.e)}</b> =`;
        ans.innerHTML = `<input id="exD" type="text" inputmode="decimal" autocomplete="off" aria-label="Your answer" style="width:14ch">`;
      }
      loadSci();
    }
    ans.querySelectorAll('input').forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); check(); } }));
    const first = ans.querySelector('input');
    if (first && !ans.hidden) first.focus({ preventScroll: true });
  }

  function check() {
    if (showing || done) return;
    if (cfg && mode === 'make') {
      const v = C.read().value, t = target();
      if (steps === prob.n) {
        done = true; C.lock(true); score(true);
        say(`✓ ${chain()}`, 'good');
        retryBtn.hidden = true; showBtn.hidden = true; checkBtn.hidden = true;
      } else if (steps < prob.n) {
        say('Not yet', 'bad');
      } else {
        score(false); C.lock(true);
        say('Too far', 'bad');
      }
      return;
    }
    if (cfg) {
      const v = $('exN').value.trim();
      if (!/^\d+$/.test(v)) return;
      if (+v === prob.n) {
        score(true);
        say(`✓ ${chain()}`, 'good');
        show(false);
      } else {
        score(false);
        say('Try again', 'bad');
      }
      return;
    }
    if (mode === 'make') {
      const m = norm($('exM').value), e = parseInt($('exE').value.replace('−', '-'), 10);
      if (!m || isNaN(e)) return;
      if (m === prob.m && e === prob.e) { done = true; score(true); say(`✓ ${sciLine()}`, 'good'); return; }
      score(false);
      if (shift(m, e) === prob.plain) say('Equal, but the first number must be from 1 to 10', 'bad');
      else say('Try again', 'bad');
    } else {
      const d = norm($('exD').value);
      if (!d) return;
      if (d === prob.plain) { done = true; score(true); say(`✓ ${sciLine()}`, 'good'); return; }
      score(false);
      say('Try again', 'bad');
    }
  }

  // Replay the answer on the counter.
  async function show(reveal) {
    if (showing) return;
    showing = true; busy(true);
    if (reveal) score(false);
    if (cfg) {
      steps = 0;
      C.load(prob.s);
      await wait(700);
      for (let k = 0; k < prob.n; k++) { await stepUnlocked(); await wait(350); }
      if (reveal) say(chain());
      C.lock(true);
    } else {
      loadSci();
      await wait(700);
      // 'make': factor out 10s (dir -1) for a positive power; 'count': undo the power the other way
      const n = Math.abs(prob.e);
      const dir = (mode === 'make') === (prob.e > 0) ? -1 : 1;
      for (let k = 0; k < n; k++) { await stepUnlocked(dir); await wait(250); }
      if (reveal) say(sciLine());
    }
    done = true; showing = false; busy(false);
    retryBtn.hidden = true; showBtn.hidden = true; checkBtn.hidden = true;
    nextBtn.focus({ preventScroll: true });
  }

  // ---------- wiring ----------
  const tabs = [...document.querySelectorAll('.ex-tabs button')];
  function setMode(m) {
    mode = m;
    tabs.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
    newProblem();
  }
  tabs.forEach(b => b.addEventListener('click', () => { if (!showing) setMode(b.dataset.mode); }));
  nextBtn.addEventListener('click', newProblem);
  checkBtn.addEventListener('click', check);
  showBtn.addEventListener('click', () => show(true));
  retryBtn.addEventListener('click', () => {
    if (showing) return;
    if (cfg) { if (done && fb.classList.contains('good')) return; say(''); loadShift(); }
    else loadSci();
  });

  C.typing(false);
  setMode('make');
})();
