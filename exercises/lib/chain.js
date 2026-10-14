// Chain — a conversion written as a chain of fractions, built step by step:
//   2 day × (24 hr / 1 day) × (60 min / 1 hr) = 2,880 min
// For each fraction: place the unit to cancel (tap top or bottom), pick the unit it turns into, fill the numbers so top
// and bottom are equal; then matching units strike through and the student writes the answer. Mistakes are explained in
// place and fixed before going on; the list of first-try mistakes is what gets graded.
// Spec: specs/units.md. Needs lib/units.js, lib/places.js. Styles: chain.css.
(function () {
  const U = window.Units, P = window.Places;
  const { shuffle } = Apparatus.util;

  // a problem: { qty, num: unit on top of the given, den: unit on its bottom (or null),
  //              steps: [{ from, to }] in order, target: { num, den } } — each step's numbers come from Units.fact(from, to)
  // the answer: qty × each step's factor
  // where each step's `from` is when the step starts: on top of the chain ('num') or underneath ('den')
  function sides(pr) {
    let num = pr.num, den = pr.den;
    return pr.steps.map(st => { if (st.from === num) { num = st.to; return 'num'; } if (st.from === den) { den = st.to; return 'den'; } return 'num'; });
  }
  function answer(pr) {
    const sd = sides(pr); let v = pr.qty;
    pr.steps.forEach((st, i) => { const per = U.SIZE[st.from] / U.SIZE[st.to]; v *= sd[i] === 'num' ? per : 1 / per; });
    return v;
  }
  // the right fraction for a step: the unit to cancel on the opposite side, numbers from the fact
  function fraction(st, side) {
    const f = U.fact(st.from, st.to), n = x => x === f.small ? f.a : f.b;
    return side === 'num' ? { tu: st.to, tn: n(st.to), bu: st.from, bn: n(st.from) } : { tu: st.from, tn: n(st.from), bu: st.to, bn: n(st.to) };
  }
  // ---- the facts as a graph (for free paths): which units connect directly, and can a unit still reach the target? ----
  const FACTS = () => U.TABLE.concat(U.OPTIONAL, U.PREFIXED);
  const neighbors = u => [...new Set(FACTS().filter(f => f[1] === u || f[3] === u).map(f => f[1] === u ? f[3] : f[1]))];
  function reaches(u, target, seen) {
    if (u === target) return true;
    return neighbors(u).some(v => !seen.has(v) && reaches(v, target, new Set([...seen, v])));
  }
  // is there a path from the end of `path` to target (no unit twice) that isn't `avoid`?
  function newPath(path, target, avoid) {
    const u = path[path.length - 1];
    if (u === target) return !avoid || path.join() !== avoid.join();
    return neighbors(u).some(v => !path.includes(v) && newPath(path.concat(v), target, avoid));
  }
  const valueOf = (qty, steps) => steps.reduce((v, st) => v * (st.side === 'num' ? U.SIZE[st.from] / U.SIZE[st.to] : U.SIZE[st.to] / U.SIZE[st.from]), qty);
  // a finished chain as a picture (no fields): given × fractions = answer, cancelled units struck
  function solvedHTML(pr) {
    const sd = sides(pr), last = pr.steps.length - 1;
    const fr = pr.steps.map((st, i) => { const f = fraction(st, sd[i]);
      return `<span class="op">×</span><span class="cf"><span class="ct"><b>${U.fmtN(f.tn)}</b> <u class="${i === last ? '' : 'gone'}">${f.tu}</u></span><span class="cbar"></span><span class="cb"><b>${U.fmtN(f.bn)}</b> <u class="gone">${f.bu}</u></span></span>`; }).join('');
    return `<div class="chain solved"><span class="cg"><b>${U.fmtN(pr.qty)}</b> <u class="gone">${pr.num}</u></span>${fr}<span class="op">=</span><span class="cg"><b>${nice(answer(pr))}</b> ${pr.target.num}</span></div>`;
  }
  const nice = v => { const r = Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 100) / 100; return U.fmtN(r); };
  const unitsOf = pr => pr.target.den ? `${pr.target.num}/${pr.target.den}` : pr.target.num;

  function givenHTML(pr) {
    return pr.den
      ? `<span class="cg frac2"><span class="ct"><b>${U.fmtN(pr.qty)}</b> <u data-u="${pr.num}" data-s="num">${pr.num}</u></span><span class="cbar"></span><span class="cb"><b>1</b> <u data-u="${pr.den}" data-s="den">${pr.den}</u></span></span>`
      : `<span class="cg"><b>${U.fmtN(pr.qty)}</b> <u data-u="${pr.num}" data-s="num">${pr.num}</u></span>`;
  }
  function fracHTML(i) {
    return `<span class="cf" data-i="${i}">
      <span class="ct"><input class="cn" data-i="${i}" data-s="t" inputmode="decimal" autocomplete="off" aria-label="Top number" disabled><button type="button" class="cu" data-i="${i}" data-s="t" disabled>?</button></span>
      <span class="cbar"></span>
      <span class="cb"><input class="cn" data-i="${i}" data-s="b" inputmode="decimal" autocomplete="off" aria-label="Bottom number" disabled><button type="button" class="cu" data-i="${i}" data-s="b" disabled>?</button></span></span>`;
  }

  // mount(el, pr, { level: 0 units given | 1 guided | 2 on your own, onDone(errors), say(text, bad) })
  function mount(el, pr, o) {
    // o.free: { avoid: [units of a path not to repeat] } — the student picks the path; fractions are added as they go
    const level = o.level, errs = [], free = o.free, sd = free ? [] : sides(pr);
    const steps = free ? [] : pr.steps.map((st, i) => Object.assign({}, st, { side: sd[i], frac: fraction(st, sd[i]) }));
    el.innerHTML = `<div class="chain-q">${o.above || ''}<div class="chain">${givenHTML(pr)}${steps.map((_, i) => `<span class="op">×</span>${fracHTML(i)}`).join('')}
        <span class="op eqop">=</span><span class="cans"><span class="cq">?</span> <span class="tu">${unitsOf(pr)}</span></span></div>
      <p class="csay" aria-live="polite"></p><div class="chips" aria-label="Units"></div><button type="button" class="go" hidden>Check</button></div>`;
    const $ = s => el.querySelector(s), $$ = s => Array.from(el.querySelectorAll(s));
    // the guidance line under the chain (a mistake shows in red there)
    const say = o.say || ((text, bad) => { const c = $('.csay'); c.innerHTML = text || ''; c.classList.toggle('bad', !!bad); });
    const go = $('.go'), chips = $('.chips');
    const miss = (type, text, node) => {
      if (!errs.some(e => e.step === cur.key)) errs.push({ type, text, step: cur.key });
      say(text, true);
      if (node) { node.classList.remove('shake'); void node.offsetWidth; node.classList.add('shake', 'wrong'); }
    };
    let cur = {};
    const guide = text => say(level < 2 ? text : '', false);      // captions in the opening and guided levels; none on your own
    const live = n => { $$('.live').forEach(x => x.classList.remove('live')); (Array.isArray(n) ? n : [n]).forEach(x => x && x.classList.add('live')); };

    // ---- 1. place the unit to cancel: tap top or bottom ----
    function placeFrom(i) {
      if (free && !steps[i]) {                       // a new fraction for the next hop of the student's own path
        steps[i] = { from: i === 0 ? pr.num : steps[i - 1].to, to: null, side: 'num' };
        $('.eqop').insertAdjacentHTML('beforebegin', `<span class="op">×</span>${fracHTML(i)}`);
      }
      const st = steps[i], f = st.frac, side = free ? 'b' : f.bu === st.from ? 'b' : 't';
      cur = { key: i + 'side' };
      if (level === 0) { fillUnit(i, 't', f.tu); fillUnit(i, 'b', f.bu); return numbers(i); }
      // the slot where the cancelling unit goes is active; the student picks WHICH unit goes there (not just top or bottom)
      const slot = $(`.cu[data-i="${i}"][data-s="${side}"]`), where = side === 'b' ? 'bottom' : 'top';
      guide(`What goes on the ${where}?`);
      const near = [pr.target.num, pr.target.den, pr.num, pr.den].concat(steps.slice(0, i).map(x => x.to));
      const others = [...new Set(near.concat(Object.keys(U.KIND).filter(u => U.KIND[u] === U.KIND[st.from])))].filter(u => u && u !== st.from);
      chips.innerHTML = shuffle([st.from].concat(shuffle(others).slice(0, 3))).map(u => `<button type="button" class="chip">${u}</button>`).join('');
      live(slot);
      chips.querySelectorAll('.chip').forEach(c => c.onclick = () => {
        if (c.textContent !== st.from) {
          const has = st.side === 'num' ? 'on top' : 'on the bottom';
          return miss('side', `${st.from} is ${has} now, so the ${where} needs ${st.from} to cancel it.`, c);
        }
        chips.innerHTML = '';
        fillUnit(i, side, st.from); pickTo(i, side === 'b' ? 't' : 'b');
      });
    }
    // ---- 2. pick the unit it turns into ----
    function pickTo(i, s) {
      const st = steps[i];
      cur = { key: i + 'unit' };
      const slot = $(`.cu[data-i="${i}"][data-s="${s}"]`);
      guide(`What does ${st.from} turn into?`);
      if (free) return pickFree(i, s, slot);
      const others = Object.keys(U.KIND).filter(u => U.KIND[u] === U.KIND[st.to] && u !== st.to && u !== st.from && u !== pr.target.num && u !== pr.target.den);
      const opts = shuffle([st.to].concat(shuffle(others).slice(0, 3)));
      chips.innerHTML = opts.map(u => `<button type="button" class="chip">${u}</button>`).join('');
      live(slot);
      chips.querySelectorAll('.chip').forEach(c => c.onclick = () => {
        if (c.textContent !== st.to) {
          const f = U.fact(st.from, c.textContent);
          return miss('unit', f ? `That works, but here ${st.from} turns into ${st.to} first.` : `${c.textContent} doesn’t connect to ${st.from} with a fact you know. Try ${st.to}.`, c);
        }
        chips.innerHTML = ''; fillUnit(i, s, st.to); numbers(i);
      });
    }
    // free path: any unit with a fact to this one that can still reach the target is right; the path shown above is nudged away
    function pickFree(i, s, slot) {
      const st = steps[i], target = pr.target.num, seen = new Set([pr.num].concat(steps.slice(0, i).map(x => x.to)));
      const prefix = [pr.num].concat(steps.slice(0, i).map(x => x.to));
      // offer every unused unit of this kind; only those that reach the target by a new route are right
      const ok = neighbors(st.from).filter(v => !seen.has(v) && newPath(prefix.concat(v), target, free.avoid));
      const all = Object.keys(U.KIND).filter(u => U.KIND[u] === U.KIND[st.from] && !seen.has(u));
      chips.innerHTML = shuffle(all).slice(0, 6).concat(ok.filter(v => !all.slice(0, 6).includes(v))).map(u => `<button type="button" class="chip">${u}</button>`).join('');
      live(slot);
      chips.querySelectorAll('.chip').forEach(c => c.onclick = () => {
        const v = c.textContent;
        if (!ok.includes(v)) {
          if (!U.fact(st.from, v)) return miss('unit', `${v} doesn’t connect to ${st.from} with a fact you know.`, c);
          if (newPath(prefix.concat(v), target, null)) { say('That’s the way above. Find another.', false); c.remove(); return; }   // only leads back to the route shown
          return miss('unit', `From ${v} there’s no way on to ${target} without going back.`, c);
        }
        st.to = v; st.frac = fraction(st, st.side);
        chips.innerHTML = ''; fillUnit(i, s, v); numbers(i);
      });
    }
    function fillUnit(i, s, u) {
      const b = $(`.cu[data-i="${i}"][data-s="${s}"]`);
      b.textContent = u; b.dataset.u = u; b.disabled = true; b.classList.add('set'); b.classList.remove('wrong');
    }
    // ---- 3. the numbers: any equal pair ----
    function numbers(i) {
      const st = steps[i], f = st.frac;
      cur = { key: i + 'num' };
      chips.innerHTML = '';
      const t = $(`.cn[data-i="${i}"][data-s="t"]`), b = $(`.cn[data-i="${i}"][data-s="b"]`);
      [t, b].forEach(x => { x.disabled = false; });
      live([t, b]);
      guide('Make the top and bottom equal.');
      go.hidden = false; t.focus({ preventScroll: true });
      const check = () => {
        const tv = parseFloat(t.value.replace(/,/g, '')), bv = parseFloat(b.value.replace(/,/g, ''));
        if (!(tv > 0)) return shake(t); if (!(bv > 0)) return shake(b);
        if (U.equal(tv, f.tu, bv, f.bu)) {
          [t, b].forEach(x => { x.disabled = true; x.classList.remove('wrong'); x.classList.add('set'); fit(x); });
          go.hidden = true; go.onclick = null; [t, b].forEach(x => { x.onkeydown = null; });
          if (free) return st.to === pr.target.num ? cancel() : placeFrom(i + 1);
          return i + 1 < steps.length ? placeFrom(i + 1) : cancel();
        }
        const fx = U.fact(f.tu, f.bu);
        if (U.equal(tv, f.bu, bv, f.tu)) return miss('flip', `${U.factText(fx)}: the ${fx.small} number is the big one. Swap them.`, t);
        miss('number', `${U.factText(fx)}: top and bottom must be equal.`, t);
      };
      go.onclick = check;
      [t, b].forEach(x => { x.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); check(); } }; x.oninput = () => x.classList.remove('wrong'); });
    }
    // number fields grow with what's typed (3,600; 1,000,000)
    function fit(x) { x.style.width = Math.max(4.6, x.value.length + 1.6) + 'ch'; }
    el.addEventListener('input', e => { if (e.target.matches('.cn, .ca')) fit(e.target); });
    const shake = n => { n.classList.remove('shake'); void n.offsetWidth; n.classList.add('shake'); n.focus(); };
    // ---- 4. cancel: matching units strike through, one pair at a time ----
    function cancel() {
      live([]); say('', false);
      const marks = [];
      // each step cancels its `from`: the one in the chain before it, and the one in its own fraction
      steps.forEach((st, i) => {
        const before = i === 0 ? el.querySelector(`.cg u[data-u="${st.from}"]`) : el.querySelector(`.cu[data-i="${i - 1}"][data-u="${st.from}"]`) || el.querySelector(`.cg u[data-u="${st.from}"]`);
        const mine = el.querySelector(`.cu[data-i="${i}"][data-u="${st.from}"]`);
        marks.push([before, mine]);
      });
      let k = 0;
      (function next() {
        if (!el.isConnected) return;
        if (k === marks.length) return result();
        marks[k].forEach(n => n && n.classList.add('gone'));
        k++; setTimeout(next, P.reduced() ? 80 : 380);
      })();
    }
    // ---- 5. the answer ----
    // ---- 5. the result: no hand calculation — everything combined into one fraction (numbers top and bottom, the units
    //         left over in their places), then its value; the student moves on with Next ----
    function result() {
      cur = { key: 'answer' };
      live([]); say('', false);
      const want = free ? valueOf(pr.qty, steps) : answer(pr);
      const tops = [U.fmtN(pr.qty)].concat(steps.map(st => U.fmtN(st.frac.tn)));
      const bots = (pr.den ? ['1'] : []).concat(steps.map(st => U.fmtN(st.frac.bn)));
      const T = pr.target;
      $('.cans').innerHTML = `<span class="cf comb"><span class="ct">${tops.join(' × ')} <u>${T.num}</u></span><span class="cbar"></span>
        <span class="cb">${bots.join(' × ')}${T.den ? ` <u>${T.den}</u>` : ''}</span></span><span class="op">=</span><span class="cres"><b>${nice(want)}</b> ${unitsOf(pr)}</span>`;
      setTimeout(() => o.onDone(errs.map(e => ({ type: e.type, text: e.text }))), P.reduced() ? 100 : 700);
    }
    placeFrom(0);
  }

  window.Chain = { mount, answer, fraction, sides, nice, solvedHTML, neighbors, reaches, newPath };
})();
