// Midpoint (G8) — halfway between two points: the average of the x's and the average of the y's.
// The picture: the slope triangle from one end to the other, cut in half at the midpoint. Answers are (x, y), decimals allowed (6.5).
// Spec: specs/geometry-lines.md (G8). Uses lib/grid.js, lib/lines.js.
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
  const work = (it, c) => `(${s(it.a[c])} + ${paren(it.b[c])}) ÷ 2 = ${s(it.a[c] + it.b[c])} ÷ 2 = ${s(mid(it)[c])}`;
  const PLACES = [['the gate', 'the bench'], ['the school', 'the library'], ['the dock', 'the lighthouse']];
  function words() {
    const [p, q] = any(PLACES), a = [nz(-6, 6), nz(-6, 6)];
    let b; do { b = [nz(-6, 8), nz(-6, 8)]; } while ((a[0] + b[0]) % 2 === 0 && (a[1] + b[1]) % 2 === 0 || b[0] === a[0] || b[1] === a[1]);
    return { a, b, words: [p, q] };
  }
  function picture(host, it, showMid) {
    const g = G.make(host), m = mid(it);
    g.seg(it.a, it.b);
    const d = [it.b[0] - it.a[0], it.b[1] - it.a[1]];
    g.dot(it.a, 'pt', 'A' + pt(it.a), d); g.dot(it.b, 'pt', 'B' + pt(it.b), d);
    if (showMid) { g.dot(m, 'pt ok', 'M' + pt(m), d); g.triangle(it.a, it.b, { labels: false, cls: 'ghost' }); g.triangle(it.a, m, { labels: true }); }
    return g;
  }

  Apparatus.define({
    id: 'geo-midpoint',
    title: 'Midpoint',
    ideas: {
      grid:  { name: 'On the grid', easy: ['grid'], hard: ['grid-neg'] },
      half:  { name: 'Halves (odd sums)', easy: ['half'], hard: ['half', 'big'] },
      words: { name: 'Halfway, in words', easy: ['words'], hard: ['words'], late: true }
    },
    kinds: {
      'grid':     mk('grid', () => gridPair(true, false)),
      'grid-neg': mk('grid', () => gridPair(true, true)),
      'half':     mk('half', () => gridPair(false, false)),
      'big':      mk('half', () => { const a = [r(-6, -1), r(2, 8)]; return { a, b: [a[0] + r(3, 9), a[1] - r(3, 9)] }; }),
      'words':    mk('words', words)
    },
    opening: [
      { kind: 'grid', item: { a: [-4, 1], b: [2, 5] } },
      { kind: 'big', item: { a: [1, 4], b: [6, -3] } }
    ],
    nextOnRight: true,
    defaults: { fix: 1 },
    text: it => it.words ? `halfway from ${it.words[0]} ${pt(it.a)} to ${it.words[1]} ${pt(it.b)}` : `midpoint of A${pt(it.a)} and B${pt(it.b)}`,
    speak: it => it.words ? `${it.words[0]} is at ${pt(it.a)} and ${it.words[1]} is at ${pt(it.b)}. What point is halfway?` : `What is the midpoint of ${pt(it.a)} and ${pt(it.b)}?`,
    ask(el, it, submit) {
      const box = c => `<input class="mp" data-c="${c}" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="${c ? 'y' : 'x'}">`;
      const head = it.words
        ? `<div class="q small">${it.words[0]} ${pt(it.a)}</div><div class="q small">${it.words[1]} ${pt(it.b)}</div><div class="q small">halfway?</div>`
        : onGrid(it) ? '' : `<div class="q two"><span>A${pt(it.a)}</span><span>B${pt(it.b)}</span></div>`;
      el.innerHTML = `<div class="gq">${!it.words && onGrid(it) ? '<div class="gridbox"></div>' : ''}${head}
        <div class="q mpq">M(${box(0)}, ${box(1)})</div><p class="say" aria-live="polite"></p><button type="button" class="go">Check</button><div class="work" aria-live="polite"></div></div>`;
      if (el.querySelector('.gridbox')) picture(el.querySelector('.gridbox'), it, false);
      const ins = Array.from(el.querySelectorAll('.mp')), go = el.querySelector('.go');
      const check = () => {
        const v = ins.map(i => read(i.value)), k = v.findIndex(x => x == null);
        if (k >= 0) { const i = ins[k]; i.classList.remove('bad'); void i.offsetWidth; i.classList.add('bad'); return i.focus(); }
        ins.forEach(i => { i.disabled = true; }); go.disabled = true; submit(v);
      };
      ins.forEach(i => { i.addEventListener('input', () => i.classList.remove('bad')); i.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); check(); } }); });
      go.addEventListener('click', check);
      setTimeout(() => ins[0].focus({ preventScroll: true }), 30);
    },
    errors: { diff: 'half the difference', nohalf: 'added but didn’t halve', swap: 'swapped x and y', other: 'arithmetic' },
    correct: it => pt(mid(it)),
    isRight: (it, a) => a[0] === mid(it)[0] && a[1] === mid(it)[1],
    classify(it, a) {
      const m = mid(it), c = a[0] !== m[0] ? 0 : 1, v = a[c];
      if (a[0] === m[1] && a[1] === m[0]) return 'swap';
      if (Math.abs(v) === Math.abs((it.b[c] - it.a[c]) / 2)) return 'diff';
      if (v === it.a[c] + it.b[c]) return 'nohalf';
      return 'other';
    },
    feedback(it, want, a, kind, err) {
      const m = mid(it), c = a[0] !== m[0] ? 0 : 1, xy = c ? 'y' : 'x';
      if (err === 'swap') return ['work', 'x comes first, then y.'];
      if (err === 'diff') return ['work', `Halfway is the average: add the ${xy}’s, don’t subtract.`];
      if (err === 'nohalf') return ['work', `Add the ${xy}’s, then halve.`];
      return ['work', `Add the ${xy}’s, then halve; an odd sum gives .5.`];
    },
    reveal(el, it, a, o) {
      const m = mid(it);
      el.querySelectorAll('.mp').forEach(i => i.classList.add(+i.value.replace('−', '-') === m[+i.dataset.c] ? 'ok' : 'no'));
      if (o.right) return;
      el.querySelector('.work').innerHTML = `<div>x: ${work(it, 0)}</div><div>y: ${work(it, 1)}</div>`;
      const gb = el.querySelector('.gridbox'); if (gb) { gb.innerHTML = ''; picture(gb, it, true); }
    },
    diagnose(err) {
      return ({
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
