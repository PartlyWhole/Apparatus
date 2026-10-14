// Conversions — decimal ↔ scientific notation without the hop tool: first multiple choice, then written answers.
// Spec: specs/conversions.md. Shared visual (for feedback): lib/places.js. Engine: docs/design/engine.md.
(function () {
  const { r, any, shuffle } = Apparatus.util, P = Places, PAD = P.PAD;
  const nz = () => String(r(1, 9));
  const dig = n => nz() + Array.from({ length: n - 2 }, () => r(0, 9)).join('') + (n > 1 ? nz() : '');

  // an item: { to: 'sci' | 'dec', how: 'mc' | 'ty', d: significant digits, n: the power, opts?: [...], ans?: index }
  //   to 'sci': shown as a decimal (the point n + 1 places into d); the answer is d[0].d[1..] × 10ⁿ
  //   to 'dec': shown as d[0].d[1..] × 10ⁿ; the answer is the decimal
  const mant = it => P.fmt(it.d, 1);
  const decOf = (d, n) => P.fmt(d, 1 + n);
  const sciHTML = (d, n) => `${P.fmt(d, 1)} ${P.powHTML(n)}`;
  const question = it => it.to === 'sci' ? `${decOf(it.d, it.n)} =` : `${sciHTML(it.d, it.n)} =`;

  // four choices: the answer, a close one the same way (one place off), and the same two the wrong way
  function withChoices(it) {
    const n = it.n, s = Math.sign(n);
    const near = Math.abs(n) === 1 ? n + s : n + s * any([-1, 1]);
    const exps = [[n, 'right'], [near, 'count'], [-n, 'dir'], [-near, 'dir']];
    const opts = shuffle(exps.map(([k, err]) => ({ k, err, html: it.to === 'sci' ? sciHTML(it.d, k) : decOf(it.d, k) })));
    return Object.assign(it, { opts, ans: opts.findIndex(o => o.err === 'right') });
  }
  const make = (to, how, d, n) => how === 'mc' ? withChoices({ to, how, d, n }) : { to, how, d, n };
  const bigN = () => r(2, 4), smallN = () => -r(2, 4);
  const KIND = (to, sign, how) => ({ idea: (to === 'sci' ? 's' : 'd') + sign, make: () => make(to, how, dig(r(2, 3)), sign === '+' ? bigN() : smallN()) });

  // ---- reading answers ----
  function judge(it, a) {
    const want = P.canon(it.d, 1);
    if (it.how === 'mc') return it.opts[a].err;
    if (it.to === 'dec') {
      const got = P.parseDecimal(a.v);
      if (got.sig !== want.sig) return 'digits';
      const moved = got.pos - 1;
      if (moved === it.n) return 'right';
      return moved !== 0 && Math.sign(moved) !== Math.sign(it.n) ? 'dir' : 'count';
    }
    const m = P.parseDecimal(a.m), x = P.parseInt10(a.x);
    if (m.sig !== want.sig) return 'digits';
    if (m.pos !== 1) return 'form';
    if (x === it.n) return 'right';
    return x !== 0 && Math.sign(x) !== Math.sign(it.n) ? 'dir' : 'count';
  }

  // the picture shown after a miss: the hops between the two forms
  function picture(it) {
    return it.to === 'sci'
      ? P.staticHops(it.d, 1 + it.n, PAD + 1, it.n)          // from the decimal's point to one digit, with the power
      : P.staticHops(it.d, 1, PAD + 1 + it.n, 0);              // from one digit to the decimal's point
  }

  const D = Apparatus.define({
    id: 'conversions',
    title: 'Conversions',

    // each idea: a multiple-choice question first, then a written one (tricky round 1 = choices, round 2 = writing)
    ideas: {
      's+': { name: 'Big → scientific',   easy: ['mc-s+'], hard: ['mc-s+', 'ty-s+'] },
      'd+': { name: 'Scientific → big',   easy: ['mc-d+'], hard: ['mc-d+', 'ty-d+'] },
      's-': { name: 'Small → scientific', easy: ['mc-s-'], hard: ['mc-s-', 'ty-s-'] },
      'd-': { name: 'Scientific → small', easy: ['mc-d-'], hard: ['mc-d-', 'ty-d-'] }
    },
    kinds: {
      'mc-s+': KIND('sci', '+', 'mc'), 'ty-s+': KIND('sci', '+', 'ty'),
      'mc-d+': KIND('dec', '+', 'mc'), 'ty-d+': KIND('dec', '+', 'ty'),
      'mc-s-': KIND('sci', '-', 'mc'), 'ty-s-': KIND('sci', '-', 'ty'),
      'mc-d-': KIND('dec', '-', 'mc'), 'ty-d-': KIND('dec', '-', 'ty')
    },

    text: it => `${question(it).replace(/<sup>(.*?)<\/sup>/g, (_, x) => P.sup(x.replace('−', '-')))} ? (${it.how === 'mc' ? 'choice' : 'written'})`,
    speak: it => it.to === 'sci' ? `${decOf(it.d, it.n)}. Write it in scientific notation.` : `${mant(it)} times 10 to the ${it.n < 0 ? 'minus ' + -it.n : it.n}. Write it as a decimal.`,

    ask(el, it, submit) {
      if (it.how === 'mc') {
        el.innerHTML = `<div class="pq"><div class="q">${question(it)}</div>
          <div class="cv-opts">${it.opts.map((o, i) => `<button type="button" data-i="${i}">${o.html}</button>`).join('')}</div><div class="pic"></div></div>`;
        const btns = Array.from(el.querySelectorAll('.cv-opts button'));
        const send = i => { document.removeEventListener('keydown', keys); btns.forEach(b => { b.disabled = true; }); submit(i); };
        const keys = e => { if (/^[1-4]$/.test(e.key) && el.isConnected) { e.preventDefault(); send(+e.key - 1); } };
        btns.forEach(b => b.addEventListener('click', () => send(+b.dataset.i)));
        document.addEventListener('keydown', keys);
        return;
      }
      // written: one field for a decimal; a number field and an exponent field for scientific notation
      el.innerHTML = it.to === 'dec'
        ? `<div class="pq"><div class="q">${question(it)}</div><div class="cv-ty"><input class="v" inputmode="decimal" autocomplete="off" aria-label="Decimal"></div>
           <button type="button" class="cv-go">Check</button><div class="pic"></div></div>`
        : `<div class="pq"><div class="q">${question(it)}</div><div class="cv-ty"><input class="m" inputmode="decimal" autocomplete="off" aria-label="Number">
           <span>× 10</span><span class="ex"><input class="x" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Exponent"></span></div>
           <button type="button" class="cv-go">Check</button><div class="pic"></div></div>`;
      const q = s => el.querySelector(s), go = q('.cv-go');
      const readX = () => P.parseInt10(q('.x').value);    // a minus is typed ("-" or "−")
      const fields = Array.from(el.querySelectorAll('input'));
      fields.forEach(f => f.addEventListener('input', () => f.classList.remove('bad')));
      const check = () => {
        const bad = it.to === 'dec' ? [P.parseDecimal(q('.v').value) ? null : q('.v')]
          : [P.parseDecimal(q('.m').value) ? null : q('.m'), readX() != null ? null : q('.x')];
        const missing = bad.filter(Boolean);
        if (missing.length) { missing.forEach(f => { f.classList.remove('bad'); void f.offsetWidth; f.classList.add('bad'); }); missing[0].focus(); return; }
        fields.forEach(f => { f.disabled = true; }); go.disabled = true;
        submit(it.to === 'dec' ? { v: q('.v').value } : { m: q('.m').value, x: String(readX()) });
      };
      go.addEventListener('click', check);
      fields.forEach(f => f.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); check(); } }));
      setTimeout(() => fields[0].focus({ preventScroll: true }), 30);
    },
    correct: it => it.how === 'mc' ? it.ans : 'right',
    isRight: (it, a) => judge(it, a) === 'right',
    classify: (it, a) => judge(it, a),
    feedback(it, want, a, kind, err) {
      const dec = decOf(it.d, it.n), sci = sciHTML(it.d, it.n), k = Math.abs(it.n), hops = `${k} place${k === 1 ? '' : 's'}`;
      if (err === 'digits') return ['pic', `The digits stay ${it.d.split('').join(', ')}; only the point moves.`];
      if (err === 'form') return ['pic', `Scientific notation has one digit before the point: ${mant(it)}.`];
      if (err === 'dir') return ['pic', it.to === 'sci'
        ? (it.n > 0 ? `${dec} is big, so the power is positive.` : `${dec} is small, so the power is negative.`)
        : (it.n > 0 ? `${P.powHTML(it.n)} makes it bigger: the point moves right.` : `${P.powHTML(it.n)} makes it smaller: the point moves left.`)];
      return ['pic', it.to === 'sci' ? `The point hops ${hops}: ${dec} = ${sci}.` : `${P.powHTML(it.n)} moves the point ${hops}: ${dec}.`];
    },
    revealMs: 1100,
    reveal(el, it, a, o) {
      const answer = it.to === 'sci' ? sciHTML(it.d, it.n) : decOf(it.d, it.n);
      if (it.how === 'mc') {
        el.querySelectorAll('.cv-opts button').forEach((b, i) => { b.className = i === it.ans ? (o.right ? 'ok' : 'want') : i === a ? 'no' : ''; });
      } else {
        el.querySelectorAll('input').forEach(f => f.classList.add(o.right ? 'ok' : 'no'));
      }
      if (!o.right) el.querySelector('.pic').innerHTML = `${it.how === 'ty' ? `<div class="res">= ${answer}</div>` : ''}${picture(it)}`;
    },

    errors: { dir: 'power the wrong way (sign)', count: 'wrong number of places', digits: 'changed the digits', form: 'not one digit before the point' },
    diagnose(err, kind) {
      const toSci = /-s/.test(kind);
      if (err === 'dir') return toSci
        ? ['Gets the sign of the power backwards.', 'Ask first: is the number big or small? Big → positive power; small → negative.']
        : ['Moves the point the wrong way for the sign.', 'Ask: does × 10⁻³ make it bigger or smaller? Smaller → the point moves left.'];
      if (err === 'digits') return ['Changes the digits instead of only moving the point.', 'Show that the digits stay the same; only the point moves.'];
      if (err === 'form') return ['Writes the front number with more (or fewer) than one digit before the point.', 'One digit from 1 to 9 before the point, then the power.'];
      return ['Counts the places wrong.', 'Draw the hops under the number and count them.'];
    },

    get keyHTML() {
      const ex = [{ d: '45', n: 4 }, { d: '35', n: -3 }];
      return `<div class="pkey">${ex.map(it => `<div class="kx">${decOf(it.d, it.n)} =</div>${P.staticHops(it.d, 1 + it.n, PAD + 1, it.n)}`).join('')}</div>`;
    }
  });
})();
