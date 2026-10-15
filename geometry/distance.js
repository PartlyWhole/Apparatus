// Distance (G10) — the length of a segment: it is the slanted side of the slope triangle, so d² = run² + rise² and
// d = √(d²), simplified (3√5). Later: map distances (× the scale, to a tenth) and distance backwards (an equilateral
// triangle's height: y² = side² − half²).
// Scaffolding fades with the level: grid 2 = run and rise typed (either sign), then d², then d; numbers 2 = A's and B's
// numbers dragged into d = √((x₂ − x₁)² + (y₂ − y₁)²) (either order in a pair), then d², then d; 1 = d², d; 0 = d only.
// The squares grow on the legend triangle once d² is found (tutor rule). First-try mistakes are graded and fixed in place.
// Spec: specs/geometry-next.md (G10). Uses lib/grid.js (+ grid-extra.css), lib/root.js, lib/steps.js, lib/drag.js,
// lib/frac.js; styles lib/distance.css.
(function () {
  const G = Grid, F = Frac, R = Root, { r, any } = Lines;
  const s = G.sgn, pt = p => `(${s(p[0])}, ${s(p[1])})`, paren = n => n < 0 ? `(${s(n)})` : s(n);
  const GO = '<button type="button" class="go">Check</button>';
  let ANIM = true, DHELP = true;   // tutor rules (configure)

  // ---- items: { t: 'grid' | 'num' | 'map' | 'back', a, b, lvl, sc (map), h, d2, c (back) } ----
  const legsOf = it => [it.b[0] - it.a[0], it.b[1] - it.a[1]];
  const sqOf = it => { const [x, y] = legsOf(it); return x * x + y * y; };
  const isSq = n => Number.isInteger(Math.sqrt(n));
  // the answer: d (a root, simplified); backwards: y
  const want = it => it.t === 'back' ? R.split(it.d2 - it.h * it.h) : R.split(sqOf(it));
  const round1 = x => Math.round(x * 10) / 10;
  const miles = it => R.num(want(it)) * it.sc;
  const fmt = x => String(x).replace('-', '−');
  const near = (a, b, e = 1e-6) => Math.abs(a - b) < e;
  const sq2 = v => v.dec != null ? v.dec * v.dec : Math.sign(v.a) * v.a * v.a * v.b;   // a²b, what the answer squares back to
  // sentences are plain text (Steps writes them with textContent): √45, 3√5
  const rootOf = n => R.text(R.of(1, n));

  // legs ≤ 6, d² ≤ 72
  const LEGS = [];
  for (let x = 1; x <= 6; x++) for (let y = 1; y <= 6; y++) if (x * x + y * y <= 72) LEGS.push([x, y]);
  // '345': 3 and 4 · 'root': d isn't whole · 'simp': a square comes out (2√5) · 'any'
  const POOL = {
    root: LEGS.filter(([x, y]) => !isSq(x * x + y * y) && x + y >= 3),
    simp: LEGS.filter(([x, y]) => !isSq(x * x + y * y) && Root.split(x * x + y * y).a > 1),
    any: LEGS.filter(([x, y]) => x + y >= 3),
    345: [[3, 4], [4, 3]]
  };
  const pickLegs = m => {
    const [x, y] = any(POOL[m]);
    return [x * any([1, -1]), y * any([1, -1])];
  };
  // a segment that fits the −6..6 grid
  function onGrid(lvl, m, t = 'grid', extra = {}) {
    const [dx, dy] = pickLegs(m), at = d => r(Math.max(-6, -6 - d), Math.min(6, 6 - d));
    const a = [at(dx), at(dy)];
    return Object.assign({ t, a, b: [a[0] + dx, a[1] + dy], lvl }, extra);
  }
  // numbers only (no grid): coordinates −9..9, four different numbers (so a chip's value says whose it is)
  function numbers(lvl, neg, m = neg ? 'root' : 'any') {
    for (let k = 0; k < 400; k++) {
      const [dx, dy] = pickLegs(m), a = neg ? [r(-6, 6), r(-6, 6)] : [r(1, 8), r(1, 8)], b = [a[0] + dx, a[1] + dy];
      const v = a.concat(b);
      if (v.some(n => Math.abs(n) > 9) || new Set(v).size < 4 || v.includes(0)) continue;
      if (!neg && v.some(n => n < 1)) continue;
      if (neg && v.filter(n => n < 0).length < 2) continue;
      return { t: 'num', a, b, lvl };
    }
    return { t: 'num', a: [-2, 5], b: [1, -1], lvl };
  }
  // a map: legs on the grid, "□ = 2 mi"; irrational answers round clearly (not near a .x5)
  function map(lvl, root) {
    for (let k = 0; k < 400; k++) {
      const it = onGrid(lvl, root ? 'root' : '345', 'map', { sc: any([0.5, 2, 3]) }), x = miles(it) * 10;
      if (root && (Math.abs(x - Math.round(x)) < 1e-9 || Math.abs((x % 1) - 0.5) < 0.08)) continue;
      return it;
    }
    return { t: 'map', a: [-2, -1], b: [1, 2], sc: 2, lvl };
  }
  // backwards: A and B on the x-axis, C above the middle. iso: AC = BC given; equi: all sides = AB
  function back(equi) {
    if (equi) {
      const h = r(1, 3); let a0; do a0 = r(-6, 6 - 2 * h); while (a0 + h === 0);
      return { t: 'back', equi: true, h, d2: 4 * h * h, a: [a0, 0], b: [a0 + 2 * h, 0], c: [a0 + h, h * Math.sqrt(3)], lvl: 1 };
    }
    const [h, y, d2] = any([[3, 4, 25], [4, 3, 25], [2, 3, 13], [1, 4, 17]]);
    let a0; do a0 = r(-6, 6 - 2 * h); while (a0 + h === 0);   // C off the y-axis (its rise would hide under it)
    return { t: 'back', equi: false, h, d2, a: [a0, 0], b: [a0 + 2 * h, 0], c: [a0 + h, y], lvl: 1 };
  }
  const dText = it => R.text(R.split(it.d2));           // AC as text: "5", "√13", "4"
  const dHTML = it => R.html(R.split(it.d2));

  // ---- why a typed value is wrong: [err, sentence] ----
  // d² (legs p, q as the student sees them; neg: a negative difference was in play, so −36 is a possible slip)
  function d2Why(it, v, neg) {
    const [x, y] = legsOf(it), p = Math.abs(x), q = Math.abs(y), D = p * p + q * q;
    if (Math.abs(v) === p + q || Math.abs(v) === Math.abs(x + y)) return ['nosq', `Square each leg first: ${p}² + ${q}² = ${D}.`];
    if (neg && (v === p * p - q * q || v === q * q - p * p || v === -D)) {
      const L = v === p * p - q * q ? q : p;
      return ['negsq', `(−${L})² is +${L * L}: a square is never negative.`];
    }
    return ['other', `${p}² + ${q}² = ${p * p} + ${q * q} = ${D}.`];
  }
  // d (a root value)
  function dWhy(it, v, neg) {
    const [x, y] = legsOf(it), p = Math.abs(x), q = Math.abs(y), D = p * p + q * q, W = want(it), v2 = sq2(v);
    const eqW = isSq(D) ? ` = ${W.a}` : W.a > 1 ? ` = ${R.text(W)}` : '';
    if (near(v2, (p + q) * (p + q))) return ['add', `√(${p * p} + ${q * q}) isn’t ${p} + ${q}: add the squares first, then the root: ${rootOf(D)}.`];
    if (near(v2, D * D)) return ['noroot', `${D} is d²; d is ${rootOf(D)}${eqW}.`];
    if (near(v2, p + q)) return ['nosq', `Square each leg first: ${p}² + ${q}² = ${D}.`];
    if (neg && near(v2, Math.abs(p * p - q * q))) { const L = y < 0 ? q : x < 0 ? p : Math.max(p, q); return ['negsq', `(−${L})² is +${L * L}: a square is never negative.`]; }
    if (v.dec == null && v.b > 1 && Math.abs(v.a) > 1) return ['simp', `Square it back: ${Math.abs(v.a)}² × ${v.b} = ${v2}, not ${D}.`];
    return ['other', `${p}² + ${q}² = ${D}, so d = ${rootOf(D)}${eqW}.`];
  }
  // miles (a number)
  function milesWhy(it, v) {
    const [x, y] = legsOf(it), dn = R.num(want(it)), m = miles(it), M = round1(m), cut = Math.floor(m * 10 + 1e-9) / 10;
    if (near(v, dn, 0.051) || near(v, Math.floor(dn * 10) / 10)) return ['noscale', `${fmt(v)} is in squares; each square is ${fmt(it.sc)} mi: about ${fmt(M)} mi.`];
    if (!near(cut, M) && near(v, cut)) return ['trunc', `${fmt(+m.toFixed(3))} rounds up: the next digit is ${Math.floor(m * 100 + 1e-9) % 10}, so ${fmt(M)}.`];
    if (near(v, (Math.abs(x) + Math.abs(y)) * it.sc, 0.051)) return ['walk', 'That walks along the legs; straight across is shorter.'];
    return ['other', `d ≈ ${fmt(+dn.toFixed(2))} squares × ${fmt(it.sc)} ≈ ${fmt(M)} mi.`];
  }
  // backwards: y² and y
  function y2Why(it, v) {
    const h = it.h, Y2 = it.d2 - h * h;
    if (v === it.d2 + h * h) return ['sum', `${dText(it)} is the slanted side, the longest, so subtract.`];
    if (v === h * h || v === h) return ['half', `${h} is across, half of AB; C is higher: y² = ${it.d2} − ${h * h} = ${Y2}.`];
    return ['other', `y² = ${it.d2} − ${h * h} = ${Y2}.`];
  }
  function yWhy(it, v) {
    const h = it.h, Y2 = it.d2 - h * h, W = want(it), v2 = sq2(v), Wh = isSq(Y2) ? `${rootOf(Y2)} = ${W.a}` : W.a > 1 ? `${rootOf(Y2)} = ${R.text(W)}` : rootOf(Y2);
    if (near(v2, h * h)) return ['half', `${h} is across, half of AB; C is higher: y² = ${it.d2} − ${h * h} = ${Y2}.`];
    if (near(v2, it.d2)) return ['side', `${dText(it)} is the slanted side AC; straight up is shorter: ${Wh}.`];
    if (near(v2, Y2 * Y2)) return ['noroot', `${Y2} is y²; y is ${Wh}.`];
    if (near(v2, it.d2 + h * h)) return ['sum', `${dText(it)} is the slanted side, the longest, so subtract.`];
    if (v.dec == null && v.b > 1 && Math.abs(v.a) > 1) return ['simp', `Square it back: ${Math.abs(v.a)}² × ${v.b} = ${v2}, not ${Y2}.`];
    return ['other', `y² = ${it.d2} − ${h * h} = ${Y2}, so y = ${Wh}.`];
  }

  // ---- the picture ----
  // grid/map: A, B (coordinates in the legend); the triangle with "?" from lvl 1, the bare segment at lvl 0.
  // back: triangle ABC, C(x, y) in the legend; the legend's slope triangle A → C (run = half of AB, rise y, d = AC)
  function picture(host, it, lvl) {
    const g = G.make(host), o = { g, tri: null };
    if (it.t === 'back') {
      g.poly([it.a, it.b, it.c]);
      g.dot(it.a, 'pt', 'A' + pt(it.a)); g.dot(it.b, 'pt', 'B' + pt(it.b)); g.dot(it.c, 'pt', `C(${s(it.c[0])}, y)`);
      if (!it.equi && lvl > 0) o.tri = backTri(g, it);
      return o;
    }
    g.dot(it.a, 'pt', 'A' + pt(it.a)); g.dot(it.b, 'pt', 'B' + pt(it.b));
    if (lvl > 0) o.tri = g.triangle(it.a, it.b, { labels: '?', hyp: true, d: '?' });
    else o.seg = g.seg(it.a, it.b);
    return o;
  }
  const backTri = (g, it) => g.triangle(it.a, it.c, { labels: true, hyp: true, legs: [null, 'y'], d: dText(it) });
  // the legend's "d ?" once d is known (after the squares, which repaint the legend while they grow)
  const setD = (el, text) => Promise.resolve(el._sq).then(() => { const t = el.querySelector('.glegend .m-dl'); if (t) t.textContent = 'd ' + text; });

  // ---- custom rows (Steps tap steps) ----
  // d = √( inner ), the sign stretching to meet its bar
  const radHTML = inner => `<div class="dfm"><span class="dfl">d&nbsp;=</span><span class="drad"><svg class="dsign" viewBox="0 0 10 40" preserveAspectRatio="none" aria-hidden="true"><path d="M0 26 L3 23 L6.5 40 L10 0.8"/></svg><span class="dover">${inner}</span></span></div>`;
  const sayOf = el => el.querySelector('.dsteps .say');
  // run and rise, either sign
  function legsRow(el, it) {
    return (g, row) => new Promise(res => {
      const [x, y] = legsOf(it);
      row.innerHTML = `<span class="dk run">run</span>${F.box('run')}<span class="dk rise">rise</span>${F.box('rise')} ${GO}`;
      const f = F.wire(row, { say: sayOf(el), onSubmit: v => {
        const ru = F.num(v.run.v), ri = F.num(v.rise.v), okR = Math.abs(ru) === Math.abs(x), okI = Math.abs(ri) === Math.abs(y);
        f.mark('run', okR); f.mark('rise', okI);
        if (okR && okI) return res({ ok: true, value: [ru, ri] });
        res({ ok: false, err: 'count', sentence: !okR ? `Across from ${s(it.a[0])} to ${s(it.b[0])} is ${Math.abs(x)}.`
          : `${y > 0 ? 'Up' : 'Down'} from ${s(it.a[1])} to ${s(it.b[1])} is ${Math.abs(y)}.` });
      } });
    });
  }
  // A's and B's numbers into d = √((x₂ − x₁)² + (y₂ − y₁)²); either order within a pair; the right ones stay on a retry
  const SUB = { 1: '₁', 2: '₂' };
  function dragRow(el, it) {
    let keep = {};
    const val = k => it[k[0]][k[1] === 'x' ? 0 : 1];
    return (g, row) => new Promise(res => {
      row.classList.add('drag');
      const chip = k => `<button type="button" class="dchip" data-k="${k}">${s(val(k))}</button>`;
      const slot = k => `<span class="dslot" data-s="${k}" role="button" tabindex="0"><span class="dn">${k[0]}${SUB[k[1]]}</span></span>`;
      const pair = c => `<span class="dpa">(</span>${slot(c + '2')}<span class="dop">−</span>${slot(c + '1')}<span class="dpa">)</span><sup>2</sup>`;
      row.innerHTML = `<div class="st-chips dpts"><span class="dpt"><b>A</b>(${chip('ax')},&nbsp;${chip('ay')})</span><span class="dpt"><b>B</b>(${chip('bx')},&nbsp;${chip('by')})</span></div>
        ${radHTML(`${pair('x')}<span class="dop">+</span>${pair('y')}`)}
        <button type="button" class="go" disabled>Check</button>`;
      const go = row.querySelector('.go'), slots = Array.from(row.querySelectorAll('.dslot')), chips = Array.from(row.querySelectorAll('.dchip'));
      const d = Drag.wire({
        chips, slots,
        show: (sl, k) => { sl.innerHTML = k ? (sl.dataset.s[1] === '1' ? paren(val(k)) : s(val(k))) : `<span class="dn">${sl.dataset.s[0]}${SUB[sl.dataset.s[1]]}</span>`; },
        onChange: placed => { go.disabled = Object.keys(placed).length < 4; }
      });
      for (const sl in keep) { chips.find(c => c.dataset.k === keep[sl]).click(); slots.find(x => x.dataset.s === sl).click(); }
      go.addEventListener('click', () => {
        if (Object.keys(d.placed).length < 4) return;
        d.disable(); go.disabled = true;
        const placed = Object.assign({}, d.placed), bad = slots.filter(sl => placed[sl.dataset.s][1] !== sl.dataset.s[0]);
        slots.forEach(sl => sl.classList.add(bad.includes(sl) ? 'no' : 'ok'));
        if (!bad.length) return res({ ok: true, value: placed });
        keep = {}; slots.forEach(sl => { if (!bad.includes(sl)) keep[sl.dataset.s] = placed[sl.dataset.s]; });
        const k = placed[bad[0].dataset.s];
        res({ ok: false, err: 'mix', sentence: `${s(val(k))} is ${k[0].toUpperCase()}’s ${k[1]}, so it goes with the ${k[1]}’s.` });
      });
    });
  }

  // after the drag, one thing at a time: the subtractions, √([Δx]² + [Δy]²), then the squares, √([Δx²] + [Δy²])
  // (in the order the student placed the numbers, so their own subtraction is what's checked)
  function diffRow(el, it, order) {
    const val = k => it[k[0]][k[1] === 'x' ? 0 : 1];
    return (g, row) => new Promise(res => {
      const o = order(), [x2, x1, y2, y1] = ['x2', 'x1', 'y2', 'y1'].map(k => val(o[k])), dx = x2 - x1, dy = y2 - y1;
      row.classList.add('drag');
      row.innerHTML = `${radHTML(`${F.box('dx')}<sup>2</sup><span class="dop">+</span>${F.box('dy')}<sup>2</sup>`)} ${GO}`;
      const f = F.wire(row, { say: sayOf(el), onSubmit: v => {
        const a = F.num(v.dx.v), b = F.num(v.dy.v), okA = a === dx, okB = b === dy;
        f.mark('dx', okA); f.mark('dy', okB);
        if (okA && okB) return res({ ok: true, value: [dx, dy] });
        res({ ok: false, err: 'diff', sentence: !okA ? `${s(x2)} − ${paren(x1)} = ${s(dx)}.` : `${s(y2)} − ${paren(y1)} = ${s(dy)}.` });
      } });
    });
  }
  function squaresRow(el, it, diffs) {
    return (g, row) => new Promise(res => {
      const [dx, dy] = diffs();
      row.classList.add('drag');
      row.innerHTML = `${radHTML(`${F.box('sx')}<span class="dop">+</span>${F.box('sy')}`)} ${GO}`;
      const f = F.wire(row, { say: sayOf(el), onSubmit: v => {
        const a = F.num(v.sx.v), b = F.num(v.sy.v), okA = a === dx * dx, okB = b === dy * dy;
        f.mark('sx', okA); f.mark('sy', okB);
        if (okA && okB) return res({ ok: true });
        const [d, got] = !okA ? [dx, a] : [dy, b];
        res(got === -d * d ? { ok: false, err: 'negsq', sentence: `${paren(d)}² is +${d * d}: a square is never negative.` }
          : { ok: false, err: 'sqr', sentence: `${paren(d)}² = ${paren(d)} × ${paren(d)} = ${d * d}.` });
      } });
    });
  }

  // then add, still under the root: d = √[45]
  function addRow(el, it, diffs) {
    return (g, row) => new Promise(res => {
      const [dx, dy] = diffs(), D = dx * dx + dy * dy;
      row.classList.add('drag');
      row.innerHTML = `${radHTML(F.box('d2'))} ${GO}`;
      const f = F.wire(row, { say: sayOf(el), onSubmit: v => {
        const n = F.num(v.d2.v), ok = n === D; f.mark('d2', ok);
        if (ok) return res({ ok: true });
        const [err, sentence] = d2Why(it, n, true); res({ ok: false, err, sentence });
      } });
    });
  }

  // ---- the chain of steps for an item at a level ----
  function chain(el, it, lvl) {
    const pic = el._pic, W = want(it), D = it.t === 'back' ? 0 : sqOf(it);
    let typedNeg = it.t === 'num';
    const d2 = {
      boxes: [['d2', F.of(D), 'other']], kind: 'frac', before: 'd² = ',
      why: (n, v) => d2Why(it, F.num(v.v), typedNeg),
      onRight: () => { if (ANIM && pic && pic.tri) el._sq = pic.g.squares(pic.tri, { sum: true }); }
    };
    const dq = {
      boxes: [['d', W, 'other']], kind: 'root', opts: { exact: true }, before: 'd = ',
      after: it.t === 'map' ? ' <span class="dsq" aria-label="squares"></span>' : '',
      why: (n, v) => dWhy(it, v.v, typedNeg),
      onRight: () => { if (pic && pic.tri) setD(el, R.text(W)); }
    };
    if (it.t === 'grid') {
      const legs = { tap: legsRow(el, it), onRight: v => {
        typedNeg = v[0] < 0 || v[1] < 0;
        pic.g.remove(pic.tri); pic.tri = pic.g.triangle(it.a, it.b, { labels: true, hyp: true, d: '?' });
      } };
      return lvl === 2 ? [legs, d2, dq] : lvl === 1 ? [d2, dq] : [dq];
    }
    if (it.t === 'num') {
      let placed = null, diffs = null;
      const walk = [
        { tap: dragRow(el, it), onRight: v => { placed = v; } },
        { text: 'Subtract.', tap: diffRow(el, it, () => placed), onRight: v => { diffs = v; } },
        { text: 'Square.', tap: squaresRow(el, it, () => diffs) },
        { text: 'Add.', tap: addRow(el, it, () => diffs) }
      ];
      return lvl === 2 ? [...walk, { ...dq, text: 'Simplify.' }] : lvl === 1 ? [d2, dq] : [dq];
    }
    if (it.t === 'map') {
      const m = miles(it), whole = near(m * 10, Math.round(m * 10));
      return [dq, {
        text: DHELP && W.b > 1 ? '<button type="button" class="dhelp" aria-label="Decimal help">≈</button>' : '',
        boxes: [['mi', { dec: round1(m) }, 'other']], kind: 'root', opts: whole ? {} : { tenth: true }, after: ' mi',
        why: (n, v) => milesWhy(it, R.num(v.v))
      }];
    }
    // back
    const h = it.h, Y2 = it.d2 - h * h;
    const ab = {
      boxes: [['ab', F.of(2 * h), 'count']], kind: 'frac', before: 'AB = ',
      why: () => ['count', `Across from ${s(it.a[0])} to ${s(it.b[0])} is ${2 * h}.`],
      onRight: () => { pic.tri = backTri(pic.g, it); }
    };
    const y2 = {
      boxes: [['y2', F.of(Y2), 'other']], kind: 'frac', before: 'y² = ',
      why: (n, v) => y2Why(it, F.num(v.v)),
      onRight: () => { if (ANIM && pic.tri) el._sq = pic.g.squares(pic.tri, { back: true, areas: [h * h, Y2, it.d2], sum: true }); }
    };
    const yq = { boxes: [['y', W, 'other']], kind: 'root', opts: { exact: true }, before: 'y = ', why: (n, v) => yWhy(it, v.v) };
    return lvl === 0 ? [yq] : it.equi ? [ab, y2, yq] : [y2, yq];
  }
  const finalHTML = it => it.t === 'map' ? `d ${near(miles(it) * 10, Math.round(miles(it) * 10)) ? '=' : '≈'} ${fmt(round1(miles(it)))} mi` : `${it.t === 'back' ? 'y' : 'd'} = ${R.html(want(it))}`;

  function mount(el, it, lvl, submit) {
    const head = it.t === 'num' ? (lvl === 2 ? '' : `<div class="q two"><span>A${pt(it.a)}</span><span>B${pt(it.b)}</span></div>`)
      : it.t === 'map' ? `<div class="q small dscale"><span class="dsq"></span>&nbsp;= ${fmt(it.sc)} mi</div>`
      : it.t === 'back' ? `<div class="q small">${it.equi ? 'ABC is equilateral: all sides are equal.' : `AC = BC = ${dHTML(it)}`}</div>` : '';
    el.innerHTML = `<div class="gq dist">${head}${it.t === 'num' ? '' : '<div class="gridbox"></div>'}<div class="dsteps"></div><div class="work" aria-live="polite"></div></div>`;
    el._pic = it.t === 'num' ? null : picture(el.querySelector('.gridbox'), it, lvl);
    el._sq = null;
    const steps = chain(el, it, lvl);
    el._steps = Steps.run(el.querySelector('.dsteps'), steps, { final: finalHTML(it), done: errs => submit({ errs, lvl }) });
    // Decimal help: the decimal of the exact d the student just found
    el.onclick = e => {
      const b = e.target.closest('.dhelp'); if (!b) return;
      const W = want(it); b.outerHTML = `<span class="dhv">${R.html(W)} ≈ ${fmt(+R.num(W).toFixed(3))}</span>`;
    };
  }

  // the worked line for a miss on a numbers item
  const work = it => {
    const [x, y] = legsOf(it), D = x * x + y * y;
    return `(${s(it.b[0])} − ${paren(it.a[0])})² + (${s(it.b[1])} − ${paren(it.a[1])})² = ${x * x} + ${y * y} = ${D}`;
  };

  const IDEAS = {
    grid:    { name: 'On the grid', easy: ['grid-345'], hard: ['grid-root', 'grid-simp'] },
    numbers: { name: 'From coordinates', easy: ['num-pos'], hard: ['num-neg', 'num-simp'], check: 'num-neg' },
    map:     { name: 'Map distances (scale, nearest tenth)', easy: ['map-345'], hard: ['map-root'], late: true, check: 'map-root' },
    back:    { name: 'Backwards (equilateral height)', easy: ['iso'], hard: ['equi'], late: true, check: 'equi' }
  };
  const mk = (idea, f) => ({ idea, make: f });

  Apparatus.define({
    id: 'geo-distance',
    title: 'Distance',
    ideas: IDEAS,
    kinds: {
      'grid-345':  mk('grid', () => onGrid(1, '345')),
      'grid-root': mk('grid', () => onGrid(0, 'root')),
      'grid-simp': mk('grid', () => onGrid(0, 'simp')),
      'num-pos':   mk('numbers', () => numbers(1, false)),
      'num-neg':   mk('numbers', () => numbers(0, true)),
      'num-simp':  mk('numbers', () => numbers(0, true, 'simp')),
      'map-345':   mk('map', () => map(1, false)),
      'map-root':  mk('map', () => map(0, true)),
      'iso':       mk('back', () => back(false)),
      'equi':      mk('back', () => back(true))
    },
    // one up, one down: the same length, 3√5
    opening: [
      { kind: 'grid-root', item: { t: 'grid', a: [1, -1], b: [4, 5], lvl: 2 } },
      { kind: 'num-neg', item: { t: 'num', a: [-2, 5], b: [1, -1], lvl: 2 } }
    ],
    nextOnRight: true,
    defaults: { fix: 1, anim: true, dhelp: true, map: true },
    rules: [
      ['anim', 'Squares animation', [[true, 'On'], [false, 'Off']], 'Once d² is found, squares grow on the legs and on the slanted side (9 + 36 = 45).'],
      ['dhelp', 'Decimal help', [[true, 'On'], [false, 'Off']], 'Map questions: an ≈ button gives the decimal of the exact distance (Off: the student needs a calculator).'],
      ['map', 'Map distances', [[true, 'On'], [false, 'Off']], 'Include map questions (a scale like □ = 2 mi, answer to the nearest tenth).']
    ],
    configure(S) {
      ANIM = S.anim !== false; DHELP = S.dhelp !== false;
      if (S.map !== false) return {};
      const { map: _, ...rest } = IDEAS;
      return { ideas: rest };
    },
    text: it => it.t === 'back' ? `${it.equi ? 'equilateral' : `AC = BC = ${dText(it)}`}: A${pt(it.a)} B${pt(it.b)} C(${s(it.c[0])}, y)`
      : `d from A${pt(it.a)} to B${pt(it.b)}${it.t === 'grid' ? ' (grid)' : it.t === 'map' ? `, □ = ${fmt(it.sc)} mi` : ''}${it.lvl === 2 ? ' (steps)' : ''}`,
    speak: it => it.t === 'back' ? (it.equi ? 'Triangle ABC is equilateral. Find y, the height of C.' : `AC and BC are both ${dText(it)}. Find y, the height of C.`)
      : it.t === 'map' ? `On the map each square is ${fmt(it.sc)} miles. How far is it from A to B, to the nearest tenth?`
      : `How far is it from A${pt(it.a)} to B${pt(it.b)}?`,
    ask(el, it, submit, ctx) { mount(el, it, ctx.mode === 'warm' ? 0 : it.lvl ?? 1, submit); },
    correct: it => it.t === 'map' ? `${fmt(round1(miles(it)))} mi` : R.text(want(it)),
    isRight: (it, a) => a.errs.length === 0,
    classify: (it, a) => a.errs[0].type,
    feedback: (it, w, a) => ['', a.errs[0].text],
    // the cue: a red dot by the step that was missed first; the triangle (lvl 0) or the worked line (numbers)
    reveal(el, it, a, o) {
      if (o.right) return;
      const rows = el.querySelectorAll('.st-list > .step'), row = rows[a.errs[0].step];
      if (row) row.classList.add('dmiss');
      if (it.t === 'num') el.querySelector('.work').innerHTML = work(it);
      else if (it.t !== 'back' && el._pic && !el._pic.tri) {
        el._pic.g.remove(el._pic.seg);
        el._pic.tri = el._pic.g.triangle(it.a, it.b, { labels: true, hyp: true, d: R.text(want(it)) });
      }
    },
    errors: {
      add: 'added the legs (√(a² + b²) = a + b)', nosq: 'added the legs without squaring', negsq: 'squared a negative to a negative',
      noroot: 'stopped at d² (no root)', diff: 'subtracted wrong (in the formula)', sqr: 'squared wrong', simp: 'simplified the root wrong', mix: 'put an x with the y’s (formula)', count: 'miscounted a leg',
      noscale: 'left the map distance in squares', trunc: 'cut off instead of rounding', walk: 'walked along the legs',
      half: 'took the height as half the side', sum: 'added instead of subtracting (backwards)', side: 'took the height as the slanted side', other: 'arithmetic'
    },
    diagnose(err) {
      return ({
        add: ['Takes √(a² + b²) to be a + b: adds the legs.', 'The legs add up to a walk along two sides; the slanted side is shorter. Square, add, then take the root — and check it’s shorter than the two legs together.'],
        nosq: ['Adds the legs without squaring them.', 'Draw a square on each leg: its area is the leg squared. Add the areas, then take the root.'],
        negsq: ['Squares a negative difference to a negative ((−6)² = −36).', 'A number times itself is never negative: (−6) × (−6) = +36. Or use the distance (6) instead of the difference.'],
        noroot: ['Stops at d² and gives it as the length.', 'The squares give d²; one more step: d = √(d²). Ask “is this the area or the side?”'],
        simp: ['Takes the wrong square out of the root.', 'Square the answer back (a² × b) and compare it with d²; take out the biggest square that divides it.'],
        mix: ['Puts a y-number with the x’s in the formula (or an x with the y’s).', 'Say “x” or “y” at each number before placing it; the x’s are subtracted together, the y’s together.'],
        diff: ['Slips subtracting the coordinates, often with a negative.', 'Rewrite “minus a negative” as plus before working it out: 5 − (−1) = 5 + 1.'],
        sqr: ['Slips squaring a number.', 'A square is the number times itself: 6² = 6 × 6, not 6 × 2.'],
        count: ['Miscounts a leg: across from A to B, or up/down.', 'Count the squares along the bottom, then up the side; or subtract the x’s, then the y’s.'],
        noscale: ['Gives the map distance in squares, not miles.', 'Every square is a fixed distance: multiply by the scale at the end.'],
        trunc: ['Cuts the decimal off instead of rounding.', 'Look at the next digit: 5 or more rounds up.'],
        walk: ['Adds the two legs: the walk along the grid, not straight across.', 'Straight across is the slanted side: square the legs, add, root.'],
        half: ['Takes the height as half the side.', 'Half the side is the run, across. The height is the rise: height² = side² − half².'],
        sum: ['Adds the squares when working backwards.', 'The slanted side is the longest: the leg’s square is the slanted square minus the other one.'],
        side: ['Takes the height as the slanted side.', 'Straight up is shorter than the slanted side; use height² = side² − half².'],
        other: ['Slips in the arithmetic.', 'Write each square on its own line, then add.']
      })[err] || ['', ''];
    },
    get keyHTML() {
      const host = document.createElement('div');
      const g = G.make(host, { min: -1, max: 6 });
      g.dot([0, 1], 'pt', 'A(0, 1)'); g.dot([3, 5], 'pt', 'B(3, 5)'); g.triangle([0, 1], [3, 5], { labels: true, hyp: true, d: '5' });
      return `<div class="gk"><div class="gridbox">${host.innerHTML}</div><div>d² = run² + rise²: 3² + 4² = 25 · d = √25 = 5</div>`
        + `<div>d = √((x₂ − x₁)² + (y₂ − y₁)²)</div><div>type r for √ · simplify: √45 = 3√5</div><div>map: d × the scale, to a tenth</div></div>`;
    },

    // ---- tutorial: square the legs (9 + 16 = 25 → 5), then type √5 ----
    tutorial(stage, api) {
      const draw = (a, b) => {
        stage.innerHTML = `<div class="gq dist"><div class="gridbox"></div><div class="tbtns"><button type="button" class="tb wide">Square the legs</button></div><div class="dtut"></div></div>`;
        const g = G.make(stage.querySelector('.gridbox'), { min: -1, max: 6 });
        g.dot(a, 'pt', 'A' + pt(a)); g.dot(b, 'pt', 'B' + pt(b));
        return { g, tri: g.triangle(a, b, { labels: true, hyp: true, d: '?' }), btn: stage.querySelector('.tb') };
      };
      const nextBtn = (btn, then) => { btn.textContent = '›'; btn.classList.remove('wide'); btn.disabled = false; btn.setAttribute('aria-label', 'Next'); btn.addEventListener('click', () => { if (api.alive()) then(); }, { once: true }); btn.focus(); };
      const typeIt = () => {
        api.step(1, 2); api.caption('');
        const p = draw([0, 0], [1, 2]);
        p.btn.addEventListener('click', () => {
          if (!api.alive()) return;
          p.btn.disabled = true;
          p.g.squares(p.tri, { sum: true }).then(() => {
            if (!api.alive()) return;
            p.btn.parentNode.hidden = true;
            api.caption('d² = 5. Type d: r makes √.');
            const box = stage.querySelector('.dtut');
            const ask = () => {
              box.innerHTML = `<div class="q">d = ${R.box('d')} ${GO}</div>`;
              R.wire(box, { exact: true, want: () => R.of(1, 5), onSubmit: v => {
                if (!api.alive()) return;
                const ok = R.eq(v.d.v, R.of(1, 5));
                box.querySelector('.rb').classList.add(ok ? 'ok' : 'no');
                if (!ok) { api.caption('1 + 4 = 5, so d = √5: type r, then 5.'); return setTimeout(() => api.alive() && ask(), 1400); }
                setD(stage, '√5'); api.caption('d = √5.');
                box.querySelector('.go') && box.querySelector('.go').remove();
                p.btn.parentNode.hidden = false; nextBtn(p.btn, () => { api.step(2, 2); api.done(); });
              } });
            };
            ask();
          });
        }, { once: true });
      };
      api.step(0, 2); api.caption('');
      const p = draw([1, 1], [4, 5]);
      p.btn.addEventListener('click', () => {
        if (!api.alive()) return;
        p.btn.disabled = true;
        p.g.squares(p.tri, { sum: true }).then(() => {
          if (!api.alive()) return;
          setD(stage, '5'); api.caption('9 + 16 = 25, so d = √25 = 5.');
          nextBtn(p.btn, typeIt);
        });
      }, { once: true });
    }
  });
})();
