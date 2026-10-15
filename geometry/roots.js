// Simplify Roots (G9) — √n = a√b with the biggest square out (√72 = 6√2), or nothing comes out (√15, √49 = 7).
// Scaffolding fades with item.lvl: 2 = the steps (opening): "Which square goes into 48?" (square chips) →
// √48 = √(16 · [ ]) → √48 = [ ]√[ ], then the pairs animation (16 → 4 · 4, the pair leaves the root as one 4);
// 1 = the root box only, radical open; 0 = one box, "r" opens the radical (later items, the next-session check).
// Simplifying is graded (strict): 2√12 for √48 is wrong. Nudges, not graded: a decimal ("Exact: keep the root."),
// a√1 ("√1 is 1: just 7."). Steps (lvl 2) are fixed in place and first tries are graded; lvl 1/0 is one answer.
// Spec: specs/geometry-next.md (G9). Uses lib/root.js, lib/steps.js, lib/pick.js, lib/frac.js; styles lib/roots.css.
(function () {
  const R = Root, any = a => a[Math.floor(Math.random() * a.length)];
  const SQ = [4, 9, 16, 25, 36, 49];
  const isSq = n => n > 1 && Number.isInteger(Math.sqrt(n));
  const ans = it => R.split(it.n);                       // { a, b }: b = 1 when n is a square
  const big = n => { const s = R.split(n).a; return s * s; }; // the biggest square in n
  // √(anything): the radical drawn by root.js around our own HTML
  const rad = inner => R.html(R.of(1, 999983)).replace(/ aria-label="[^"]*"/, '').replace('999983', inner);
  // the root box with the radical already open (lvl 2 and 1)
  const openBox = name => R.box(name).replace('class="rb"', 'class="rb rad"');
  const mk = (idea, lvl, ns) => ({ idea, make: () => ({ n: fresh(ns), lvl }) });
  // a radicand not asked lately
  const recent = [];
  function fresh(ns) {
    const left = ns.filter(n => !recent.includes(n)), n = any(left.length ? left : ns);
    recent.push(n); if (recent.length > 4) recent.shift();
    return n;
  }

  // what a typed answer means: [] when right, else [{ type, text }] (the sentence is about the answer they typed)
  function judge(it, r) {
    const n = it.n, A = ans(it), v = r.v, t = R.text(v);
    if (R.eq(v, A) && r.simplified) return [];
    const one = (type, text) => [{ type, text }];
    if (R.eq(v, A)) {
      if (v.b === 1) return one('one', `√1 is 1: just ${v.a}.`);
      const k = Math.sqrt(v.b);
      if (isSq(v.b)) return one('kept', `${v.b} is ${k} × ${k}: √${v.b} = ${k}.`);
      return one('small', `${v.b} still has a square in it (${big(v.b)}): ${t} = ${R.text(A)}.`);
    }
    if (v.dec == null && r.rad) {
      if (isSq(v.a) && v.a * v.b === n) { const k = Math.sqrt(v.a); return one('whole', `${v.a} comes out as its root: √${v.a} = ${k}, so ${R.text(R.of(k, v.b))}.`); }
      // swapped: the square's root inside and the rest outside (3√4 for √48), or the rest outside and the square inside (3√16)
      const fix = v.b > 1 && v.b * v.b * v.a === n ? R.of(v.b, v.a) : isSq(v.b) && !isSq(v.a) && v.a * v.b === n ? R.of(Math.sqrt(v.b), v.a) : null;
      if (fix) return one('swap', `The square comes out and the rest stays in: ${R.text(fix)}.`);
    }
    return one('back', `Square it back: ${back(v, r.rad)}, not ${n}.`);
  }
  // the answer squared back, as text: 3² × 5 = 45 · 7² = 49 · (√5)² = 5
  const back = (v, isRad) => v.dec != null ? `${v.dec}² = ${+(v.dec * v.dec).toFixed(4)}`
    : !isRad || v.b === 1 ? `${v.a}² = ${v.a * v.a}` : v.a === 1 ? `(√${v.b})² = ${v.b}` : `${v.a}² × ${v.b} = ${v.a * v.a * v.b}`;

  // the cue: their answer, wrong part boxed, then squared back (red box when it isn't n)
  function cue(it, r, type) {
    const v = r.v, x = s => `<span class="rx">${s}</span>`, n = it.n;
    let shown;
    if (!r.rad || v.b === 1) shown = x(v.a);
    else {
      const a = v.a === 1 ? '' : String(v.a);
      const inner = type === 'small' || type === 'kept' ? x(v.b) : String(v.b);
      shown = (type === 'whole' ? x(a) : a) + rad(inner);
      if (type === 'swap' || type === 'back') shown = x(shown);
    }
    const sq = !r.rad || v.b === 1 ? v.a * v.a : v.a * v.a * v.b, ok = sq === n;
    const line = !r.rad || v.b === 1 ? `${v.a}²` : v.a === 1 ? `(√${v.b})²` : `${v.a}² × ${v.b}`;
    return `<span class="rc-a">${shown}</span><span class="rc-arrow">→</span><span>${line} = ${ok ? `<span class="rc-ok">${sq}</span>` : x(sq)}</span>`;
  }

  // √1 is a nudge, not an answer: stop the check before root.js submits it
  function guardOne(el) {
    const stop = e => {
      const host = e.target.closest('.q.step, .gq'); if (!host || !host.querySelector('.rb')) return;
      if (e.type === 'keydown' ? e.key !== 'Enter' || !e.target.closest('.rb') : !e.target.closest('.go')) return;
      const b = Array.from(host.querySelectorAll('.rb.rad')).find(b => R.readNum(b.querySelector('.rb-b').value) === 1);
      if (!b) return;
      e.preventDefault(); e.stopPropagation();
      const a = b.querySelector('.rb-a').value.trim(), say = el.querySelector('.say');
      if (say) { say.textContent = `√1 is 1: just ${a || 1}.`; say.classList.remove('bad'); }
      b.classList.remove('bad'); void b.offsetWidth; b.classList.add('bad'); b.querySelector('.rb-b').focus();
    };
    el.addEventListener('keydown', stop, true);
    el.addEventListener('click', stop, true);
  }

  // lvl 2: the steps
  function chain(el, it, submit) {
    const n = it.n, A = ans(it), q = big(n), rest = n / q;
    const steps = [
      { text: `Which square goes into ${n}?`, pick: SQ.map(s => [s, s]), want: q, cols: 6, err: 'notbig', name: 'sq',
        why: id => { id = +id; return n % id ? ['notfactor', `${n} ÷ ${id} isn’t whole.`] : ['notbig', `${id} goes in, but so does ${q}, which is bigger.`]; } },
      { boxes: [['rest', Frac.of(rest), 'rest']], eq: `${rad(n)}<span>=</span>${rad(`${q}&thinsp;·&thinsp;{rest}`)}`, cls: 'rs-rest',
        why: (nm, r) => r.v.undef ? `${q} × ? isn’t ${n}.` : `${q} × ${Frac.text(r.v)} = ${Frac.text(Frac.mul(Frac.of(q), r.v))}, not ${n}.` },
      { boxes: [['ans', A, 'small']], kind: 'root', opts: { strict: true, exact: true }, cls: 'rs-ans',
        eq: `${rad(n)}<span>=</span>${openBox('ans')}`,
        why: (nm, r) => { const e = judge(it, r)[0]; return e ? [e.type, e.text] : ['small', '']; } }
    ];
    // with the pairs animation on, the animation is the finished line
    Steps.run(el, steps, { final: Apparatus.loadSettings(DEF).pairs ? '' : `${rad(n)} = ${R.html(A)}`, done: errs => submit({ errs, lvl: 2 }) });
    el.querySelector('.gq').insertAdjacentHTML('beforeend', '<div class="rpair" aria-hidden="true"></div>');
  }

  // lvl 1 and 0: one answer
  function single(el, it, lvl, submit) {
    el.innerHTML = `<div class="gq roots"><div class="q rq">${rad(it.n)}<span>=</span>${lvl ? openBox('r') : R.box('r')}</div>
      ${lvl ? '' : '<div class="rhint"><kbd>r</kbd> = √</div>'}<p class="say" aria-live="polite"></p><button type="button" class="go">Check</button><div class="rcue"></div></div>`;
    const w = R.wire(el.querySelector('.gq'), { strict: true, exact: true, onSubmit: v => submit({ errs: judge(it, v.r), val: v.r, lvl }) });
    el._mark = w.mark;
  }

  // the pairs animation: √48 = √(16 · 3) = √(4 · 4 · 3) = 4√3, one line at a time
  function pairs(el, it) {
    const box = el.querySelector('.rpair'); if (!box) return;
    const n = it.n, q = big(n), k = Math.sqrt(q), rest = n / q, d = '&thinsp;·&thinsp;';
    const p = `<span class="rp-pair">${k}${d}${k}</span>`;
    box.innerHTML = [
      `${rad(n)} = ${rad(`${q}${d}${rest}`)}`,
      `= ${rad(`${p}${d}${rest}`)}`,
      `= <span class="rp-out">${k}</span>${rad(rest)}`
    ].map(h => `<div class="rp-line">${h}</div>`).join('');
    const lines = Array.from(box.children), still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    lines.forEach((l, i) => { if (still) l.classList.add('on'); else setTimeout(() => { if (l.isConnected) l.classList.add('on'); }, 250 + i * 900); });
  }

  const DEF = Apparatus.define({
    id: 'geo-roots',
    title: 'Simplify Roots',
    ideas: {
      pull:    { name: 'One square comes out', easy: ['pull'], hard: ['pull-1', 'pull-0'], check: 'pull-0' },
      biggest: { name: 'The biggest square', easy: ['pull'], hard: ['big-1', 'big-0'], check: 'big-0' },
      none:    { name: 'Nothing (or everything) comes out', easy: ['sq'], hard: ['none', 'sq'], check: 'none', late: true }
    },
    kinds: {
      'pull':   mk('pull', 2, [12, 18, 20, 27, 45, 50]),
      'pull-1': mk('pull', 1, [28, 63, 75, 8]),
      'pull-0': mk('pull', 0, [28, 63, 75, 8]),
      'big-1':  mk('biggest', 1, [72, 48, 32, 80, 96]),
      'big-0':  mk('biggest', 0, [72, 48, 32, 80, 96]),
      'none':   mk('none', 0, [15, 21, 30, 35, 42]),
      'sq':     mk('none', 0, [36, 49, 64, 81, 100])
    },
    // the same rest, a bigger square
    opening: [
      { kind: 'pull', item: { n: 12, lvl: 2 } },
      { kind: 'big-1', item: { n: 48, lvl: 2 } }
    ],
    nextOnRight: true,
    defaults: { fix: 1, pairs: true },
    rules: [['pairs', 'Pairs animation', [[true, 'On'], [false, 'Off']], 'After the scaffolded roots: 16 splits into 4 · 4 and the pair leaves the root as one 4.']],
    text: it => `√${it.n}${it.lvl === 2 ? ' (steps)' : ''}`,
    speak: it => `Simplify the square root of ${it.n}.`,
    ask(el, it, submit, ctx) {
      const lvl = ctx && ctx.mode === 'warm' ? 0 : it.lvl ?? 1;
      if (!el._guarded) { guardOne(el); el._guarded = true; }
      if (lvl === 2) chain(el, it, submit); else single(el, it, lvl, submit);
    },
    correct: it => R.text(ans(it)),
    isRight: (it, a) => a.errs.length === 0,
    classify: (it, a) => a.errs[0].type,
    feedback: (it, w, a) => ['', a.errs[0].text],
    reveal(el, it, a, o) {
      if (a.lvl === 2) { if (Apparatus.loadSettings(DEF).pairs) pairs(el, it); return; }
      el._mark && el._mark('r', o.right);
      if (!o.right) el.querySelector('.rcue').innerHTML = cue(it, a.val, o.err);
    },
    errors: {
      small: 'left a square inside (2√12)', whole: 'took the square out whole (16√3)', swap: 'swapped what comes out (3√4)',
      back: 'doesn’t square back to n', kept: 'left a square under the root (√49)',
      notfactor: 'picked a square that doesn’t go in', notbig: 'picked a smaller square', rest: 'what’s left after the square', one: 'wrote √1'
    },
    diagnose(err) {
      return ({
        small: ['Takes a square out, but not the biggest one, so the root can still be simplified (2√12 for √48).', 'Look for the biggest square first: 4, 9, 16, 25, 36, 49. When done, check that nothing under the root has a square in it.'],
        whole: ['Moves the square out without taking its root (16√3 for √48).', 'Only the root of the square comes out: √16 = 4. Show it as a pair: 16 = 4 · 4, the pair leaves as one 4.'],
        swap: ['Puts the square’s root inside and the rest outside (3√4 for √48).', 'Say it aloud: the square comes out (as its root), the rest stays in.'],
        back: ['Writes a root that isn’t equal to the start (3√5 for √48), often splitting into numbers that aren’t squares.', 'Check by squaring back: a² × b must give the number under the root.'],
        kept: ['Leaves a perfect square under the root (√49).', 'Know the squares to 100 by heart: √49 = 7.'],
        notfactor: ['Picks a square that doesn’t divide the number.', 'Try dividing: 48 ÷ 9 isn’t whole, so 9 isn’t in it.'],
        notbig: ['Stops at the first square that works.', 'Try the squares from big to small; the first that divides is the one.'],
        rest: ['Slips dividing by the square.', 'n ÷ square: 48 ÷ 16 = 3. Check: 16 × 3 = 48.'],
        one: ['Writes 7√1.', '√1 is 1, so 7√1 is just 7.']
      })[err] || ['', ''];
    },
    keyHTML: `<div class="gk rkey"><div class="rk-sq">4  9  16  25  36  49  64  81  100</div><div>${rad(72)} = ${rad('36&thinsp;·&thinsp;2')} = 6${rad(2)}</div><div>check: 6² × 2 = 72</div><div><kbd>r</kbd> = √</div></div>`
  });
})();
