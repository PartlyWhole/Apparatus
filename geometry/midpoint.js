// Midpoint (G8) — halfway between two points: the average of the x's and the average of the y's.
// The picture: the slope triangle from one end to the other, cut in half at the midpoint. Answers are (x, y), decimals allowed (6.5).
// The first items scaffold it: drag A's and B's numbers into M = ((x₁ + x₂)/2, (y₁ + y₂)/2) (an x into a y slot is fixed
// in place; first tries are graded), type M, then watch it: x₁ and x₂ drop to the x-axis and meet halfway, y₁ and y₂ on the
// y-axis, and the two guide lines meet at M. Later items drop the formula.
// Spec: specs/geometry-lines.md (G8). Uses lib/grid.js, lib/lines.js, lib/drag.js; styles lib/midpoint.css.
(function () {
  const G = Grid, L = Lines, { r, any } = L;
  const nz = (a, b) => { let v = 0; while (v === 0) v = r(a, b); return v; };
  const s = G.sgn, pt = p => `(${s(p[0])}, ${s(p[1])})`, paren = n => n < 0 ? `(${s(n)})` : String(n);
  // an item: { a, b, words? }
  const mid = it => [(it.a[0] + it.b[0]) / 2, (it.a[1] + it.b[1]) / 2];
  const onGrid = it => [it.a, it.b].every(p => Math.abs(p[0]) <= 6 && Math.abs(p[1]) <= 6);
  const mk = (idea, f) => ({ idea, make: f });
  const read = v => { const t = String(v).trim().replace(/−/g, '-').replace(/\s/g, ''); return /^-?(\d+(\.\d*)?|\.\d+)$/.test(t) ? parseFloat(t) : null; };
  // two grid points; even: both sums even (a whole-number midpoint)
  function gridPair(even, neg) {
    for (let k = 0; k < 300; k++) {
      const a = [r(-6, 6), r(-6, 6)], b = [r(-6, 6), r(-6, 6)], sx = a[0] + b[0], sy = a[1] + b[1];
      if (Math.abs(a[0] - b[0]) < 2 || Math.abs(a[1] - b[1]) < 2) continue;
      if (even ? sx % 2 || sy % 2 : !(sx % 2 || sy % 2)) continue;
      if (neg && !(a[0] < 0 || b[0] < 0) ) continue;
      return { a, b };
    }
    return { a: [-4, 1], b: [2, 5] };
  }
  // the scaffold: four different numbers, none 0 (each drops to its axis), and M off the axes (each guide has a length)
  function formPair(even) {
    for (let k = 0; k < 300; k++) {
      const it = gridPair(even, false), v = it.a.concat(it.b);
      if (new Set(v).size === 4 && !v.includes(0) && !mid(it).includes(0)) return Object.assign(it, { sc: true });
    }
    return even ? { a: [-4, 1], b: [2, 5], sc: true } : { a: [-3, 1], b: [2, 4], sc: true };
  }
  const work = (it, c) => `(${s(it.a[c])} + ${paren(it.b[c])}) ÷ 2 = ${s(it.a[c] + it.b[c])} ÷ 2 = ${s(mid(it)[c])}`;
  const PLACES = [['the gate', 'the bench'], ['the school', 'the library'], ['the dock', 'the lighthouse']];
  function words() {
    const [p, q] = any(PLACES), a = [nz(-6, 6), nz(-6, 6)];
    let b; do { b = [nz(-6, 8), nz(-6, 8)]; } while ((a[0] + b[0]) % 2 === 0 && (a[1] + b[1]) % 2 === 0 || b[0] === a[0] || b[1] === a[1]);
    return { a, b, words: [p, q] };
  }
  // the scaffold's drag step: A's and B's numbers into the formula's slots; an x must go with the x's
  const SL = ['x1', 'x2', 'y1', 'y2'], SUB = { 1: '₁', 2: '₂' };
  const chipVal = (it, k) => it[k[0]][k[1] === 'x' ? 0 : 1];       // 'ax' → A's x
  const misplaced = placed => SL.filter(sl => placed[sl] && placed[sl][1] !== sl[0]);
  const dragSay = (it, k) => `${s(chipVal(it, k))} is ${k[0].toUpperCase()}’s ${k[1]}, so it goes with the ${k[1]}’s.`;
  function scaffold(el, it, then) {
    const chip = k => `<button type="button" class="dchip" data-k="${k}">${s(chipVal(it, k))}</button>`;
    const slot = k => `<button type="button" class="dslot" data-s="${k}"><span class="dn">${k[0]}${SUB[k[1]]}</span><span class="dv"></span></button>`;
    const fr = c => `<span class="mfr"><span class="nu">${slot(c + '1')}<span>+</span>${slot(c + '2')}</span><span class="de">2</span></span>`;
    const box = el.querySelector('.mps');
    box.innerHTML = `<div class="q dpts"><span class="dpt"><b>A</b>(${chip('ax')},&nbsp;${chip('ay')})</span><span class="dpt"><b>B</b>(${chip('bx')},&nbsp;${chip('by')})</span></div>
      <div class="q mpf"><span>M&nbsp;=</span><span class="pa">(</span>${fr('x')}<span class="cm">,</span>${fr('y')}<span class="pa">)</span></div>
      <button type="button" class="go" disabled>Check</button>`;
    const go = box.querySelector('.go'), sayEl = el.querySelector('.say'), slots = Array.from(box.querySelectorAll('.dslot'));
    let err = null;
    const d = Drag.wire({
      chips: Array.from(box.querySelectorAll('.dchip')), slots,
      show: (sl, k) => { sl.querySelector('.dv').textContent = k ? s(chipVal(it, k)) : ''; },
      onChange: placed => { go.disabled = Object.keys(placed).length < 4; slots.forEach(sl => sl.classList.remove('no')); }
    });
    go.addEventListener('click', () => {
      if (Object.keys(d.placed).length < 4) return;
      const bad = misplaced(d.placed);
      if (!bad.length) {
        d.disable(); go.remove(); slots.forEach(sl => sl.classList.add('ok'));
        sayEl.textContent = ''; sayEl.classList.remove('bad');
        return then(err);
      }
      // explained in place, then those slots empty for another go; the first miss is what's graded
      const text = dragSay(it, d.placed[bad[0]]);
      if (!err) err = { type: 'mix', text };
      sayEl.textContent = text; sayEl.classList.add('bad');
      bad.forEach(sl => slots.find(x => x.dataset.s === sl).classList.add('no'));
      go.disabled = true; box.classList.add('wait');
      setTimeout(() => {
        box.classList.remove('wait');
        box.querySelectorAll('.dchip.sel').forEach(c => c.click());
        bad.forEach(sl => slots.find(x => x.dataset.s === sl).click());
      }, 1600);
    });
  }

  // the scaffold's picture, after M is typed: x₁ and x₂ drop to the x-axis and meet halfway, a guide rises from there;
  // the same for the y's on the y-axis; the guides meet at M
  const NS = 'http://www.w3.org/2000/svg';
  const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mkEl = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
  const tween = (ms, f) => new Promise(res => {
    if (reduced()) { f(1); return res(); }
    const t0 = performance.now();
    (function frame(t) { const k = Math.min(1, Math.max(0, (t - t0) / ms)), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; f(e); if (k < 1) requestAnimationFrame(frame); else res(); })(t0);
  });
  const pause = ms => new Promise(res => setTimeout(res, reduced() ? 0 : ms));
  async function halfway(g, it) {
    const m = mid(it), X = g.X, Y = g.Y, svg = g.svg;
    const grp = document.createElementNS(NS, 'g'); grp.setAttribute('class', 'mpa'); svg.insertBefore(grp, svg.querySelector('.g-top'));
    const lerp = (a, b, k) => a + (b - a) * k;
    for (const c of [0, 1]) {
      const cls = c ? 'y' : 'x', on = p => c ? [X(0), Y(p[1])] : [X(p[0]), Y(0)], P = [it.a, it.b].map(p => [X(p[0]), Y(p[1])]), A = [it.a, it.b].map(on);
      const drops = P.map(p => mkEl('line', { x1: p[0], y1: p[1], x2: p[0], y2: p[1], class: 'mpa-drop' }, grp));
      await tween(350, k => drops.forEach((l, i) => { l.setAttribute('x2', lerp(P[i][0], A[i][0], k)); l.setAttribute('y2', lerp(P[i][1], A[i][1], k)); }));
      const span = mkEl('line', { x1: A[0][0], y1: A[0][1], x2: A[1][0], y2: A[1][1], class: 'mpa-span ' + cls }, grp);
      const marks = A.map(a => mkEl('circle', { cx: a[0], cy: a[1], r: 4, class: 'mpa-m ' + cls }, grp));
      await pause(200);
      const H = on(m);
      await tween(550, k => marks.forEach((d, i) => { d.setAttribute('cx', lerp(A[i][0], H[0], k)); d.setAttribute('cy', lerp(A[i][1], H[1], k)); }));
      marks[1].remove(); span.classList.add('done');
      valueLabel(g, c, m);
      const M = [X(m[0]), Y(m[1])], guide = mkEl('line', { x1: H[0], y1: H[1], x2: H[0], y2: H[1], class: 'mpa-guide ' + cls }, grp);
      await tween(450, k => { guide.setAttribute('x2', lerp(H[0], M[0], k)); guide.setAttribute('y2', lerp(H[1], M[1], k)); });
      drops.forEach(l => l.classList.add('done'));
    }
    const d = g.dot(m, 'pt ok', 'M'); d.classList.add('mpa-pop');
  }
  // the halfway number on its axis, where the tick numbers sit (a tick under it is hidden), or on the axis's other side
  // when the guide to M would run through it
  function valueLabel(g, c, m) {
    const X = g.X, Y = g.Y, t = document.createElementNS(NS, 'text'), v = m[c], flip = m[1 - c] < 0;
    t.setAttribute('class', 'mpa-v ' + (c ? 'y' : 'x') + (flip ? ' flip' : ''));
    if (c) { t.setAttribute('x', X(0) + (flip ? 5 : -5)); t.setAttribute('y', Y(v) + 3.5); } else { t.setAttribute('x', X(v)); t.setAttribute('y', Y(0) + (flip ? -5 : 13)); }
    t.textContent = s(v); g.svg.querySelector('.g-top').appendChild(t);
    g.svg.querySelectorAll('.g-base text.gn').forEach(tk => {
      if (tk.classList.contains('gy') !== !!c) return;
      const near = c ? Math.abs(+tk.getAttribute('y') - 3.5 - Y(v)) < 14 : Math.abs(+tk.getAttribute('x') - X(v)) < 18;
      if (near) tk.style.visibility = 'hidden';
    });
  }

  function picture(host, it, showMid) {
    const g = G.make(host), m = mid(it);
    g.seg(it.a, it.b);
    const d = [it.b[0] - it.a[0], it.b[1] - it.a[1]];
    g.dot(it.a, 'pt', 'A' + (it.sc ? '' : pt(it.a)), d); g.dot(it.b, 'pt', 'B' + (it.sc ? '' : pt(it.b)), d);
    if (showMid) { g.dot(m, 'pt ok', 'M' + pt(m), d); g.triangle(it.a, it.b, { labels: false, cls: 'ghost' }); g.triangle(it.a, m, { labels: true }); }
    return g;
  }

  // the M(x, y) boxes: Check once both read as numbers
  function answer(el, done) {
    const ins = Array.from(el.querySelectorAll('.mp')), go = el.querySelector('.go');
    const check = () => {
      const v = ins.map(i => read(i.value)), k = v.findIndex(x => x == null);
      if (k >= 0) { const i = ins[k]; i.classList.remove('bad'); void i.offsetWidth; i.classList.add('bad'); return i.focus(); }
      ins.forEach(i => { i.disabled = true; }); go.disabled = true; done(v);
    };
    ins.forEach(i => { i.addEventListener('input', () => i.classList.remove('bad')); i.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); check(); } }); });
    go.addEventListener('click', check);
    setTimeout(() => ins[0].focus({ preventScroll: true }), 30);
  }

  Apparatus.define({
    id: 'geo-midpoint',
    title: 'Midpoint',
    ideas: {
      formula: { name: 'Into the formula', easy: ['form'], hard: ['form-half'] },
      grid:  { name: 'On the grid', easy: ['grid'], hard: ['grid-neg'] },
      half:  { name: 'Halves (odd sums)', easy: ['half'], hard: ['half', 'big'] },
      words: { name: 'Halfway, in words', easy: ['words'], hard: ['words'], late: true }
    },
    kinds: {
      'form':      mk('formula', () => formPair(true)),
      'form-half': mk('formula', () => formPair(false)),
      'grid':     mk('grid', () => gridPair(true, false)),
      'grid-neg': mk('grid', () => gridPair(true, true)),
      'half':     mk('half', () => gridPair(false, false)),
      'big':      mk('half', () => { const a = [r(-6, -1), r(2, 8)]; return { a, b: [a[0] + r(3, 9), a[1] - r(3, 9)] }; }),
      'words':    mk('words', words)
    },
    // scaffolded first (the formula), then it fades: the points and M only
    opening: [{ kind: 'form', item: { a: [-4, 1], b: [2, 5], sc: true } }],
    nextOnRight: true,
    defaults: { fix: 1 },
    text: it => it.words ? `halfway from ${it.words[0]} ${pt(it.a)} to ${it.words[1]} ${pt(it.b)}` : `midpoint of A${pt(it.a)} and B${pt(it.b)}${it.sc ? ' (formula)' : ''}`,
    speak: it => it.sc ? 'Put A’s and B’s numbers into the formula, then find the midpoint.' : it.words ? `${it.words[0]} is at ${pt(it.a)} and ${it.words[1]} is at ${pt(it.b)}. What point is halfway?` : `What is the midpoint of ${pt(it.a)} and ${pt(it.b)}?`,
    ask(el, it, submit) {
      if (it.sc) {
        el.innerHTML = `<div class="gq"><div class="gridbox"></div><div class="mps"></div><p class="say" aria-live="polite"></p><div class="mpc"></div><div class="work" aria-live="polite"></div></div>`;
        el._g = picture(el.querySelector('.gridbox'), it, false);
        scaffold(el, it, err => {
          const c = el.querySelector('.mpc');
          c.innerHTML = `<div class="q mpq">M(<input class="mp" data-c="0" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="x">, <input class="mp" data-c="1" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="y">)</div><button type="button" class="go">Check</button>`;
          answer(c, v => submit({ v, drag: err }));
        });
        return;
      }
      const box = c => `<input class="mp" data-c="${c}" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="${c ? 'y' : 'x'}">`;
      const head = it.words
        ? `<div class="q small">${it.words[0]} ${pt(it.a)}</div><div class="q small">${it.words[1]} ${pt(it.b)}</div><div class="q small">halfway?</div>`
        : onGrid(it) ? '' : `<div class="q two"><span>A${pt(it.a)}</span><span>B${pt(it.b)}</span></div>`;
      el.innerHTML = `<div class="gq">${!it.words && onGrid(it) ? '<div class="gridbox"></div>' : ''}${head}
        <div class="q mpq">M(${box(0)}, ${box(1)})</div><p class="say" aria-live="polite"></p><button type="button" class="go">Check</button><div class="work" aria-live="polite"></div></div>`;
      if (el.querySelector('.gridbox')) picture(el.querySelector('.gridbox'), it, false);
      answer(el, v => submit({ v, drag: null }));
    },
    errors: { mix: 'put an x with the y’s (formula)', diff: 'half the difference', nohalf: 'added but didn’t halve', swap: 'swapped x and y', other: 'arithmetic' },
    correct: it => pt(mid(it)),
    isRight: (it, a) => !a.drag && a.v[0] === mid(it)[0] && a.v[1] === mid(it)[1],
    // a wrong M is what shows at the end, so it's named first; a fixed drag miss otherwise
    classify(it, ans) {
      const a = ans.v, m = mid(it);
      if (a[0] === m[0] && a[1] === m[1]) return ans.drag.type;
      const c = a[0] !== m[0] ? 0 : 1, v = a[c];
      if (a[0] === m[1] && a[1] === m[0]) return 'swap';
      if (Math.abs(v) === Math.abs((it.b[c] - it.a[c]) / 2)) return 'diff';
      if (v === it.a[c] + it.b[c]) return 'nohalf';
      return 'other';
    },
    feedback(it, want, ans, kind, err) {
      if (err === 'mix') return ['', ans.drag.text];
      const a = ans.v, m = mid(it), c = a[0] !== m[0] ? 0 : 1, xy = c ? 'y' : 'x';
      if (err === 'swap') return ['work', 'x comes first, then y.'];
      if (err === 'diff') return ['work', `Halfway is the average: add the ${xy}’s, don’t subtract.`];
      if (err === 'nohalf') return ['work', `Add the ${xy}’s, then halve.`];
      return ['work', `Add the ${xy}’s, then halve; an odd sum gives .5.`];
    },
    reveal(el, it, ans, o) {
      const m = mid(it);
      el.querySelectorAll('.mp').forEach(i => i.classList.add(ans.v[+i.dataset.c] === m[+i.dataset.c] ? 'ok' : 'no'));
      if (it.sc) {
        if (ans.v[0] !== m[0] || ans.v[1] !== m[1]) el.querySelector('.work').innerHTML = `<div>x: ${work(it, 0)}</div><div>y: ${work(it, 1)}</div>`;
        return el._g && halfway(el._g, it);
      }
      if (o.right) return;
      el.querySelector('.work').innerHTML = `<div>x: ${work(it, 0)}</div><div>y: ${work(it, 1)}</div>`;
      const gb = el.querySelector('.gridbox'); if (gb) { gb.innerHTML = ''; picture(gb, it, true); }
    },
    diagnose(err) {
      return ({
        mix: ['Puts a y-number with the x’s in the formula (or an x with the y’s).', 'A point is (x, y): the first number is x. Point at each number and say “x” or “y” before placing it.'],
        diff: ['Takes half the distance instead of the halfway point.', 'Halfway is the average: add the two x’s and halve; same for y.'],
        nohalf: ['Adds the coordinates but forgets to halve.', 'Say “add, then halve” for each coordinate.'],
        swap: ['Writes (y, x).', 'Do x first, then y, and label them.'],
        other: ['Slips with negatives or halves.', 'Write each sum on its own; a sum that’s odd gives .5.']
      })[err] || ['', ''];
    },
    get keyHTML() {
      const host = document.createElement('div');
      picture(host, { a: [-4, 1], b: [2, 5] }, true);
      return `<div class="gk"><div class="gridbox">${host.innerHTML}</div><div>( (x₁ + x₂) ÷ 2 , (y₁ + y₂) ÷ 2 )</div></div>`;
    }
  });
})();
