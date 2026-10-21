// Vectors and Translations (T1) — a slide is a run and a rise: ⟨a, b⟩ = a across (right +, left −), b up or down (up +, down −).
// Read it (an arrow; a point and its image: image − start), apply it (a point; a whole figure, plotted by tapping its image),
// words → a vector (a route of blocks; northeast as in the test's Q8), back from the image to the start, and the fact
// behind the test's Q10: every point moves the same distance, the vector's length.
// Scaffolding fades with item.lvl: 2 = the vector's legs drawn (run blue, rise green) · 1 = the arrow or the points only ·
// 0 = coordinates only (the next-session check asks lvl 0). After a miss on the grid the legs come back, labelled.
// Spec: specs/geometry-transformations.md (T1). Uses lib/grid.js (+ grid-extra.css), lib/plot.js, lib/frac.js, lib/pick.js;
// styles lib/vectors.css.
(function () {
  const G = Grid, F = Frac, s = G.sgn;
  const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), any = a => a[r(0, a.length - 1)];
  const nz = (a, b) => { let v = 0; while (v === 0) v = r(a, b); return v; };
  const add = (p, v) => [p[0] + v[0], p[1] + v[1]], sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
  const same = (p, q) => p[0] === q[0] && p[1] === q[1];
  const pt = p => `(${s(p[0])}, ${s(p[1])})`, vec = v => `⟨${s(v[0])}, ${s(v[1])}⟩`, paren = n => n < 0 ? `(${s(n)})` : s(n);
  const fits = (p, m = 5) => Math.abs(p[0]) <= m && Math.abs(p[1]) <= m;
  const len2 = v => v[0] * v[0] + v[1] * v[1];
  const cap = w => w[0].toUpperCase() + w.slice(1);
  // in words: 4 right and 1 down · 4 right, then 1 down
  const across = n => n > 0 ? `${n} right` : `${-n} left`, updown = n => n > 0 ? `${n} up` : `${-n} down`;
  const one = (c, n) => c ? updown(n) : across(n);
  const desc = (v, j = ' and ') => [v[0] && across(v[0]), v[1] && updown(v[1])].filter(Boolean).join(j);
  // a vector: both parts non-zero, of different sizes (so a swap shows), at least one negative when neg
  function rvec(m, neg) {
    for (;;) { const v = [nz(-m, m), nz(-m, m)]; if (Math.abs(v[0]) !== Math.abs(v[1]) && (!neg || v[0] < 0 || v[1] < 0)) return v; }
  }
  // a small triangle on the grid, and a vector that keeps its image on the grid too
  function triAnd(m, neg) {
    for (let k = 0; k < 2000; k++) {
      const A = [r(-5, 5), r(-5, 5)], B = add(A, [r(2, 4), r(-2, 1)]), C = add(A, [r(0, 3), r(2, 4)]), V = [A, B, C];
      const u = sub(B, A), w = sub(C, A);
      if (u[0] * w[1] - u[1] * w[0] === 0 || !V.every(p => fits(p))) continue;
      const v = rvec(m, neg), W = V.map(p => add(p, v));
      // the image clear of the preimage (their boxes apart), so each corner's move reads on its own
      const box = P => [Math.min(...P.map(p => p[0])), Math.max(...P.map(p => p[0])), Math.min(...P.map(p => p[1])), Math.max(...P.map(p => p[1]))];
      const b1 = box(V), b2 = box(W), apart = b1[1] < b2[0] || b2[1] < b1[0] || b1[3] < b2[2] || b2[3] < b1[2];
      if (W.every(p => fits(p)) && apart) return { V, v };
    }
    return { V: [[-5, -4], [-2, -3], [-4, -1]], v: [5, 3] };
  }

  // ---- the items: { t, lvl, … } ----
  //   read:  { P, v } an arrow from P · { fig: true, V, v } ABC and A′B′C′ · { A, B } coordinates only (B = A′)
  //   apply: { A, v, n } A + v · back: { B, v } B = A′, find A · fig: { V, v } plot the image
  //   keep:  { V, v, st } a fact about the slide · compass: { dir, k, start } · route: { legs: [[dir, n]…] }
  function arrowItem(lvl, neg) {
    for (;;) { const v = rvec(5, neg), P = [r(-5, 5), r(-5, 5)]; if (fits(add(P, v))) return { t: 'read', lvl, P, v }; }
  }
  function ptsItem() {
    for (;;) {
      const A = [r(-6, 6), r(-6, 6)], v = rvec(8, true), B = add(A, v);
      if ((A[0] < 0 || A[1] < 0) && fits(B, 9) && !A.includes(0)) return { t: 'read', lvl: 0, A, B, v };
    }
  }
  function applyItem(lvl) {
    for (;;) {
      if (lvl === 2) { const A = [r(-5, 5), r(-5, 5)], v = rvec(4, true); if (fits(add(A, v)) && !A.includes(0)) return { t: 'apply', lvl, A, v, n: 'A' }; continue; }
      const A = [nz(-7, 7), nz(-7, 7)], v = rvec(6, true);
      if (A[0] < 0 || A[1] < 0) return { t: 'apply', lvl, A, v, n: 'A' };
    }
  }
  // the test's Q1: (95, 71) + ⟨2, −4⟩, still mental
  const bigItem = () => ({ t: 'apply', lvl: 0, A: [r(81, 97), r(61, 89)], v: rvec(5, true), n: 'B', big: true });
  function backItem(lvl) {
    for (;;) {
      if (lvl === 2) { const B = [r(-5, 5), r(-5, 5)], v = rvec(4, true); if (fits(sub(B, v))) return { t: 'back', lvl, B, v }; continue; }
      const B = [nz(-7, 7), nz(-7, 7)], v = rvec(6, true);
      if (B[0] < 0 || B[1] < 0) return { t: 'back', lvl, B, v };
    }
  }
  const figItem = lvl => Object.assign({ t: 'fig', lvl }, triAnd(5, true));
  const figReadItem = () => Object.assign({ t: 'read', lvl: 1, fig: true }, triAnd(5, true));

  // the Q10 facts: every corner moves the vector's length; the shape keeps its size
  const FACTS = [
    { txt: 'AA′, BB′ and CC′ are all the same length.', truth: true, no: 'A slide moves every point the same distance.' },
    { txt: 'Each corner moves as far as the arrow is long.', truth: true, arrow: true, no: 'Every corner moves along the vector, so each moves the vector’s length.' },
    { txt: 'BB′ is as long as the arrow.', truth: true, arrow: true, no: 'B moves along the vector, so BB′ is the vector’s length.' },
    { txt: 'A′B′ is as long as AB.', truth: true, no: 'A slide doesn’t stretch anything: A′B′ is AB, moved.' },
    { txt: 'CC′ is longer than AA′.', truth: false, no: 'Every corner moves the same distance: CC′ and AA′ are equal.' },
    { txt: 'AA′ is as long as AB.', truth: false, side: true, no: 'AA′ is the slide and AB is a side; here they aren’t the same length.' },
    { txt: 'A′B′C′ is bigger than ABC.', truth: false, no: 'A slide moves a shape without changing its size.' }
  ];
  function keepItem() {
    for (;;) {
      const it = Object.assign({ t: 'keep', lvl: 1 }, triAnd(4, false)), f = r(0, FACTS.length - 1), st = FACTS[f];
      if (st.side && len2(it.v) === len2(sub(it.V[1], it.V[0]))) continue;
      it.f = f;
      // the arrow somewhere free on the grid (none of the six corners on it)
      if (st.arrow) {
        const pts = it.V.concat(it.V.map(p => add(p, it.v)));
        for (let k = 0; k < 400 && !it.P; k++) {
          const P = [r(-6, 6), r(-6, 6)], Q = add(P, it.v);
          if (fits(Q, 6) && !pts.some(p => same(p, P) || same(p, Q))) it.P = P;
        }
        if (!it.P) continue;
      }
      return it;
    }
  }

  const DIRS = { northeast: [1, 1], northwest: [-1, 1], southeast: [1, -1], southwest: [-1, -1] };
  const STEP = { north: [0, 1], south: [0, -1], east: [1, 0], west: [-1, 0] };
  function compassItem() {
    const dir = any(Object.keys(DIRS)), k = any([200, 300, 400, 500, 600, 800]);
    return { t: 'compass', lvl: 0, dir, k, start: [r(2, 9) * 50, r(2, 9) * 50], v: DIRS[dir].map(x => x * k) };
  }
  // a route of blocks: one across, one up/down (the up/down part told first half the time: the swap trap);
  // three legs (late): two on the same axis
  function routeItem(three) {
    for (;;) {
      const h = any(['east', 'west']), u = any(['north', 'south']);
      let legs = Math.random() < 0.5 ? [[u, r(2, 8)], [h, r(2, 8)]] : [[h, r(2, 8)], [u, r(2, 8)]];
      if (three) {
        const ax = any([h, u]), extra = [any(ax === h ? ['east', 'west'] : ['north', 'south']), r(1, 5)];
        if (extra[0] === legs[1][0]) continue;                    // not "2 east, then 3 east"
        legs = legs.concat([extra]);
      }
      const v = legs.reduce((a, [d, n]) => add(a, STEP[d].map(x => x * n)), [0, 0]);
      if (v[0] && v[1] && Math.abs(v[0]) !== Math.abs(v[1])) return { t: 'route', lvl: 0, legs, v };
    }
  }

  // ---- what each item wants, and how a wrong answer relates to it ----
  // how(d, w): d is the move the student used, w the right one
  function how(d, w) {
    if (same(d, w)) return 'right';
    if (d[0] === -w[0] && d[1] === -w[1]) return 'opp';
    if (Math.abs(w[0]) !== Math.abs(w[1]) && Math.abs(d[0]) === Math.abs(w[1]) && Math.abs(d[1]) === Math.abs(w[0])) return 'swap';
    if (Math.abs(d[0]) === Math.abs(w[0]) && Math.abs(d[1]) === Math.abs(w[1])) return 'sign';
    return 'other';
  }
  const signAt = (d, w) => d[0] !== w[0] ? 0 : 1;                // the part with the wrong sign
  const images = it => it.V.map(p => add(p, it.v));
  const want = it => it.t === 'apply' ? add(it.A, it.v) : it.t === 'back' ? sub(it.B, it.v) : it.v;
  function judge(it, a) {
    if (it.t === 'keep') return a.pick === (FACTS[it.f].truth ? 't' : 'f') ? null : FACTS[it.f].truth ? 'k-true' : 'k-false';
    if (it.t === 'compass') return a.pick === 'ok' ? null : a.pick === 'flip' ? 'w-dir' : 'w-half';
    if (it.t === 'fig') {
      const W = images(it), P = a.pts;
      if (P.every((p, i) => same(p, W[i]))) return null;
      if (P.every(p => W.some(q => same(p, q)))) return 'f-name';
      const i = P.findIndex((p, k) => !same(p, W[k]));
      if (W.some(q => same(P[i], q))) return 'f-name';
      const h = how(sub(P[i], it.V[i]), it.v);
      return 'f-' + (h === 'right' ? 'other' : h);
    }
    const p = a.v;
    if (same(p, want(it))) return null;
    if (it.t === 'read') return 'r-' + how(p, it.v);
    if (it.t === 'route') { const h = how(p, it.v); return 'w-' + (h === 'opp' ? 'sign' : h); }
    if (it.t === 'apply') { if (same(p, it.v)) return 'a-vec'; return 'a-' + how(sub(p, it.A), it.v); }
    const h = how(sub(it.B, p), it.v);                          // back: the move from their A to A′
    return h === 'opp' ? 'b-fwd' : 'b-' + h;
  }

  // ---- drawing ----
  const NS = 'http://www.w3.org/2000/svg';
  // an arrow from P to Q: a segment and a head at Q (the head is the segment's child record, removed with it)
  function arrow(g, P, Q, cls = 'sg vec') {
    const ln = g.seg(P, Q, cls), x1 = g.X(P[0]), y1 = g.Y(P[1]), x2 = g.X(Q[0]), y2 = g.Y(Q[1]);
    const l = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / l, uy = (y2 - y1) / l, L = 10, W = 5.5;
    const head = g.el('polygon', { points: `${x2},${y2} ${x2 - ux * L - uy * W},${y2 - uy * L + ux * W} ${x2 - ux * L + uy * W},${y2 - uy * L - ux * W}`, class: 'vhead' + (/ok/.test(cls) ? ' ok' : '') });
    return { ln, head, remove() { g.remove(ln); head.remove(); } };
  }
  const tri = (g, V, cls, names) => { const n = g.poly(V, cls); V.forEach((p, i) => g.dot(p, 'pt', names ? names[i] : undefined)); return n; };
  const ABC = ['A', 'B', 'C'], ABC1 = ['A′', 'B′', 'C′'];
  const named = (V, N) => V.map((p, i) => N[i] + pt(p));

  // the answer boxes: ⟨□, □⟩ for a vector, A′(□, □) for a point (the shared answer box)
  const vecBoxes = () => `<span class="vbr">⟨</span>${F.box('a')}<span class="vcm">,</span>${F.box('b')}<span class="vbr">⟩</span>`;
  const ptBoxes = n => `<span class="vnm">${n}</span><span class="vpa">(</span>${F.box('a')}<span class="vcm">,</span>${F.box('b')}<span class="vpa">)</span>`;
  function wireBoxes(el, submit) {
    el._f = F.wire(el, { onSubmit: v => submit({ v: [F.num(v.a.v), F.num(v.b.v)] }) });
  }
  const rose = () => `<svg class="vrose" viewBox="-30 -30 60 60" width="64" height="64" aria-hidden="true"><path d="M0 -17 L4 -4 L17 0 L4 4 L0 17 L-4 4 L-17 0 L-4 -4 Z"/><text x="0" y="-21">N</text><text x="0" y="29">S</text><text x="24" y="4">E</text><text x="-24" y="4">W</text></svg>`;
  const shell = (body, go = true) => `<div class="gq vx">${body}<p class="say" aria-live="polite"></p>${go ? '<button type="button" class="go">Check</button>' : ''}<div class="work" aria-live="polite"></div></div>`;
  const gridbox = '<div class="gridbox"></div>';
  const legsOf = (g, P, Q, labels) => g.triangle(P, Q, { labels: labels ? true : false });

  function askRead(el, it, lvl, submit) {
    if (it.fig) {
      el.innerHTML = shell(`${gridbox}<div class="q small">ABC → A′B′C′</div><div class="q vq">${vecBoxes()}</div>`);
      const g = el._g = G.make(el.querySelector('.gridbox'));
      tri(g, it.V, 'pg', ABC); tri(g, images(it), 'pg faint', ABC1);
      return wireBoxes(el, submit);
    }
    if (it.A) {
      el.innerHTML = shell(`<div class="q vpts"><span>A${pt(it.A)}</span><span class="vto">→</span><span>A′${pt(it.B)}</span></div><div class="q vq">${vecBoxes()}</div>`);
      return wireBoxes(el, submit);
    }
    // an arrow: its legs drawn at first (lvl 2), then the arrow alone
    el.innerHTML = shell(`${gridbox}<div class="q vq">${vecBoxes()}</div>`);
    const g = el._g = G.make(el.querySelector('.gridbox')), Q = add(it.P, it.v);
    if (lvl >= 2) el._legs = legsOf(g, it.P, Q, false);
    el._arrow = arrow(g, it.P, Q);
    wireBoxes(el, submit);
  }
  function askApply(el, it, lvl, submit) {
    if (lvl >= 2) {
      el.innerHTML = shell(`${gridbox}<div class="q vq"><span>A + ${vec(it.v)} =</span><span class="vbx">${ptBoxes('A′')}</span></div>`);
      const g = el._g = G.make(el.querySelector('.gridbox'));
      g.dot(it.A, 'pt', 'A' + pt(it.A));
      el._legs = legsOf(g, it.A, add(it.A, it.v), false);
    } else el.innerHTML = shell(`<div class="q vq"><span>${it.n}${pt(it.A)} + ${vec(it.v)} =</span><span class="vbx">${ptBoxes(it.n + '′')}</span></div>`);
    wireBoxes(el, submit);
  }
  function askBack(el, it, lvl, submit) {
    if (lvl >= 2) {
      el.innerHTML = shell(`${gridbox}<div class="q vq"><span class="vbx">${ptBoxes('A')}</span><span>+ ${vec(it.v)} = A′</span></div>`);
      const g = el._g = G.make(el.querySelector('.gridbox'));
      g.dot(it.B, 'pt', 'A′' + pt(it.B));
      el._legs = legsOf(g, sub(it.B, it.v), it.B, false);
    } else el.innerHTML = shell(`<div class="q vq"><span class="vbx">${ptBoxes('A')}</span><span>+ ${vec(it.v)} = A′${pt(it.B)}</span></div>`);
    wireBoxes(el, submit);
  }
  // plot the image by tapping A′, B′, C′ (lib/plot.js); Check once all three are down
  function askFig(el, it, lvl, submit) {
    el.innerHTML = `<div class="gq vx"><div class="q vq">ABC + ${vec(it.v)}</div>${gridbox}<p class="say" aria-live="polite">Tap A′, B′ and C′.</p><button type="button" class="go" disabled>Check</button><div class="work" aria-live="polite"></div></div>`;
    const g = el._g = G.make(el.querySelector('.gridbox')), go = el.querySelector('.go'), say = el.querySelector('.say');
    g.poly(it.V, 'pg'); it.V.forEach((p, i) => g.dot(p, 'pt', ABC[i] + pt(p)));
    if (lvl >= 2) el._legs = legsOf(g, it.V[0], add(it.V[0], it.v), false);
    const pl = el._plot = Plot.wire(g, { names: ABC1, closed: true, onChange: pts => { go.disabled = pts.length < 3; if (pts.length) say.textContent = ''; } });
    go.addEventListener('click', () => { if (!pl.done()) return; pl.stop(); go.disabled = true; submit({ pts: pl.points() }); });
  }
  function askKeep(el, it, submit) {
    const st = FACTS[it.f];
    el.innerHTML = `<div class="gq vx">${gridbox}<div class="q small vst">${st.txt}</div><div class="vpick"></div><div class="work" aria-live="polite"></div></div>`;
    const g = el._g = G.make(el.querySelector('.gridbox'));
    tri(g, it.V, 'pg', ABC); tri(g, images(it), 'pg', ABC1);
    if (it.P) arrow(g, it.P, add(it.P, it.v));
    Pick.ask(el.querySelector('.vpick'), [['t', 'True'], ['f', 'False']], id => submit({ pick: id }), { cols: 2 });
  }
  // the test's Q8: northeast, four vectors to choose from
  const compassChoices = it => {
    const [sx, sy] = DIRS[it.dir], k = it.k;
    return { ok: [sx * k, sy * k], x: [sx * k, 0], y: [0, sy * k], flip: [-sx * k, sy * k] };
  };
  function askCompass(el, it, submit) {
    const C = compassChoices(it), order = ['ok', 'x', 'y', 'flip'].sort(() => Math.random() - 0.5);
    el.innerHTML = `<div class="gq vx">${rose()}<div class="q small vst">The station is <b>${it.dir}</b> of the hiker at <b>${pt(it.start)}</b>.</div><div class="vpick"></div><div class="work" aria-live="polite"></div></div>`;
    Pick.ask(el.querySelector('.vpick'), order.map(k => [k, `<b>${vec(C[k])}</b>`]), id => submit({ pick: id }), { cols: 2 });
  }
  const routeText = it => it.legs.map(([d, n], i) => `${i ? (i === it.legs.length - 1 ? ', then ' : ', ') : ''}${n} block${n > 1 ? 's' : ''} <b>${d}</b>`).join('');
  function askRoute(el, it, submit) {
    el.innerHTML = shell(`${rose()}<div class="q small vst">${routeText(it)}</div><div class="q vq">${vecBoxes()}</div>`);
    wireBoxes(el, submit);
  }

  // ---- the work line after a miss ----
  function work(it) {
    if (it.t === 'read' && it.A) return `⟨${s(it.B[0])} − ${paren(it.A[0])}, ${s(it.B[1])} − ${paren(it.A[1])}⟩ = ${vec(it.v)}`;
    if (it.t === 'apply') { const w = want(it); return `(${s(it.A[0])} + ${paren(it.v[0])}, ${s(it.A[1])} + ${paren(it.v[1])}) = ${pt(w)}`; }
    if (it.t === 'back') { const w = want(it); return `(${s(it.B[0])} − ${paren(it.v[0])}, ${s(it.B[1])} − ${paren(it.v[1])}) = ${pt(w)}`; }
    if (it.t === 'route') {
      const part = c => { const xs = it.legs.filter(([d]) => STEP[d][c]).map(([d, n]) => STEP[d][c] * n); return xs.length > 1 ? xs.map((x, i) => i ? (x < 0 ? ` − ${-x}` : ` + ${x}`) : s(x)).join('') + ` = ${s(it.v[c])}` : s(xs[0]); };
      return `across ${part(0)} · up ${part(1)}`;
    }
    return '';
  }
  // the two parts of a route, in words: "4 east and 1 west is 3 east"
  function routeSay(it) {
    const c = it.legs.filter(([d]) => STEP[d][0]).length > 1 ? 0 : it.legs.filter(([d]) => STEP[d][1]).length > 1 ? 1 : -1;
    if (c < 0) return `${it.legs.map(([d, n]) => `${n} ${d}`).join(' and ')}: ${vec(it.v)}.`;
    const xs = it.legs.filter(([d]) => STEP[d][c]), net = it.v[c], word = c ? (net > 0 ? 'north' : 'south') : (net > 0 ? 'east' : 'west');
    return `${xs.map(([d, n]) => `${n} ${d}`).join(' and ')} is ${Math.abs(net)} ${word}: ${vec(it.v)}.`;
  }
  const dirWord = (c, n) => c ? (n > 0 ? 'north' : 'south') : (n > 0 ? 'east' : 'west');

  function feedback(it, a, err) {
    const v = it.v, w = want(it);
    switch (err) {
      case 'r-opp': return it.A || it.fig ? `From A to A′ is ${desc(v)}: ${vec(v)}.` : `From the tail to the tip is ${desc(v)}: ${vec(v)}.`;
      case 'r-swap': return `The across part comes first: ${vec(v)}.`;
      case 'r-sign': { const c = signAt(a.v, v); return `${cap(c ? (v[c] < 0 ? 'down' : 'up') : (v[c] < 0 ? 'left' : 'right'))} is ${v[c] < 0 ? 'negative' : 'positive'}: ${vec(v)}.`; }
      case 'r-other': return it.A ? 'Image minus start, part by part.' : `Count the squares: ${desc(v)}: ${vec(v)}.`;
      case 'a-opp': return `${vec(v)} moves ${desc(v)}.`;
      case 'a-swap': return `The first number is across: ${desc(v, ', then ')}.`;
      case 'a-sign': { const c = signAt(sub(a.v, it.A), v); return `${s(v[c])} is ${one(c, v[c])}.`; }
      case 'a-vec': return `That’s the slide itself. Add it to ${it.n}.`;
      case 'a-other': return 'Add the vector to the point, part by part.';
      case 'b-fwd': return 'Adding goes further on. To go back, subtract.';
      case 'b-swap': return 'The first number is across, so it goes with x.';
      case 'b-sign': { const c = signAt(sub(it.B, a.v), v); return v[c] < 0 ? `Minus a negative is plus: ${s(it.B[c])} − ${paren(v[c])} = ${s(w[c])}.` : `Go back on both: ${s(it.B[c])} − ${v[c]} = ${s(w[c])}.`; }
      case 'b-other': return 'Subtract the vector, part by part.';
      case 'f-opp': { const i = firstWrong(it, a); return `${vec(v)} is ${desc(v)}; ${ABC1[i]} went the other way.`; }
      case 'f-swap': return `The first number is across: ${desc(v, ', then ')}.`;
      case 'f-sign': { const i = firstWrong(it, a), c = signAt(sub(a.pts[i], it.V[i]), v); return `${s(v[c])} is ${one(c, v[c])}; ${ABC1[i]} went ${c ? (v[c] < 0 ? 'up' : 'down') : (v[c] < 0 ? 'right' : 'left')}.`; }
      case 'f-name': return 'A′ goes with A, B′ with B, and C′ with C.';
      case 'f-other': return `Every corner moves the same: ${desc(v)}.`;
      case 'k-true': case 'k-false': return FACTS[it.f].no;
      case 'w-half': { const [sx, sy] = DIRS[it.dir]; return `${cap(it.dir)} is both ${sx > 0 ? 'east' : 'west'} and ${sy > 0 ? 'north' : 'south'}: ${vec(v)}.`; }
      case 'w-dir': { const sx = DIRS[it.dir][0]; return `${sx > 0 ? 'East is positive' : 'West is negative'}: ${vec(v)}.`; }
      case 'w-swap': return `The across part comes first: ${vec(v)}.`;
      case 'w-sign': {
        // "West is negative" · "West and south are negative" · "East is positive and south is negative"
        const bad = [0, 1].filter(c => a.v[c] !== v[c]), sg = c => v[c] < 0 ? 'negative' : 'positive';
        const say = bad.length === 2 && sg(0) === sg(1) ? `${dirWord(0, v[0])} and ${dirWord(1, v[1])} are ${sg(0)}`
          : bad.map(c => `${dirWord(c, v[c])} is ${sg(c)}`).join(' and ');
        return `${cap(say)}: ${vec(v)}.`;
      }
      case 'w-other': return cap(routeSay(it));
    }
    return '';
  }
  const firstWrong = (it, a) => { const W = images(it); return a.pts.findIndex((p, k) => !same(p, W[k])); };

  // ---- what a miss means, for the tutor ----
  const DIAG = {
    'r-opp': ['Subtracts the wrong way round (start − image), so both signs flip.', 'A vector goes from the start to the image: image minus start. Trace it with a finger from A to A′.'],
    'r-swap': ['Writes the up/down part first.', 'Like a point, across comes first: ⟨across, up⟩. Say “run, then rise”.'],
    'r-sign': ['Loses a sign: left and down are negative.', 'Point along the arrow: right and up are +, left and down are −.'],
    'r-other': ['Miscounts the squares, or slips subtracting.', 'Count the run (blue) and the rise (green) one square at a time; with coordinates, image minus start.'],
    'a-opp': ['Moves the point the opposite way (subtracts the vector).', 'The vector says where to go: add it. ⟨4, −1⟩ means 4 right and 1 down.'],
    'a-swap': ['Adds the across part to y and the up part to x.', 'The first number changes x, the second changes y. Write x + a, y + b.'],
    'a-sign': ['Loses a sign on one part (adds −1 as +1).', 'Say each part in words first: −1 is “1 down”.'],
    'a-vec': ['Gives the vector as the answer, not the moved point.', 'The vector is the move; the answer is where the point lands: point + vector.'],
    'a-other': ['Slips in the adding (often with big numbers or negatives).', 'One part at a time: x + a, then y + b. Big numbers are still small steps: 95 + 2.'],
    'f-opp': ['Moves the corners the opposite way.', 'Count the move from each corner: the vector’s first number across, the second up or down.'],
    'f-swap': ['Moves across by the second number and up by the first.', 'The first number is across. Draw the run (blue) and rise (green) from A before plotting.'],
    'f-sign': ['Loses a sign on one part of the move.', 'Right/up are +, left/down are −. Say the move in words before tapping.'],
    'f-name': ['Plots the right points but under the wrong letters.', 'A′ is A moved, B′ is B moved. Move one corner at a time, in order.'],
    'f-other': ['Moves the corners by different amounts.', 'Every corner moves the same way, the same distance. Draw the move from each corner.'],
    'k-true': ['Doesn’t trust that a slide moves every point the same.', 'Draw AA′, BB′ and CC′: they’re the same arrow, so the same length; the shape doesn’t change.'],
    'k-false': ['Thinks a slide can change lengths, or mixes a side (AB) with a move (AA′).', 'A slide is a rigid motion: sides keep their length, and every point moves the vector’s length.'],
    'w-half': ['Reads northeast as only east (or only north).', 'Northeast is halfway between: some east AND some north, so both parts are non-zero.'],
    'w-dir': ['Gets a compass sign wrong (west or south positive).', 'East and north are +, west and south are −, like right and up on the grid.'],
    'w-swap': ['Writes the parts in the order they were told.', 'Across (east/west) always comes first, whatever order the words say.'],
    'w-sign': ['Makes west or south positive.', 'West is left (−) and south is down (−).'],
    'w-other': ['Adds up a route’s blocks wrong (often two legs the same way, or opposite ways).', 'Add the east/west blocks on their own (west takes away), then the north/south blocks.'],
    'b-fwd': ['Adds the vector to the image instead of going back.', 'The image is the start moved forward; to go back, subtract the vector (or move the opposite way).'],
    'b-swap': ['Subtracts the across part from y.', 'x goes with the first number, y with the second.'],
    'b-sign': ['Slips with a negative going back (5 − (−2)).', 'Going back flips the move: ⟨3, −2⟩ back is 3 left and 2 up. Minus a negative is plus.'],
    'b-other': ['Slips in the subtracting.', 'One part at a time: x − a, then y − b. Check by moving forward again.']
  };
  const ERR = {
    'r-opp': 'reversed (start − image)', 'r-swap': 'swapped ⟨up, across⟩', 'r-sign': 'a sign (left/down negative)', 'r-other': 'miscounted',
    'a-opp': 'moved the opposite way', 'a-swap': 'swapped the parts', 'a-sign': 'a sign on one part', 'a-vec': 'gave the vector, not the point', 'a-other': 'arithmetic',
    'f-opp': 'figure moved the opposite way', 'f-swap': 'figure: parts swapped', 'f-sign': 'figure: a sign', 'f-name': 'figure: letters mixed up', 'f-other': 'figure: corners moved unevenly',
    'k-true': 'said a true fact is false', 'k-false': 'believed a false claim',
    'w-half': 'northeast as one direction', 'w-dir': 'a compass sign', 'w-swap': 'parts in the order told', 'w-sign': 'west/south made positive', 'w-other': 'added the route wrong',
    'b-fwd': 'added instead of going back', 'b-swap': 'going back: parts swapped', 'b-sign': 'going back: a sign', 'b-other': 'going back: arithmetic'
  };

  const mk = (idea, f) => ({ idea, make: f });
  const lvlOf = (it, ctx) => ctx && ctx.mode === 'warm' ? 0 : it.lvl;

  Apparatus.define({
    id: 'geo-vectors',
    title: 'Vectors and Translations',
    ideas: {
      read:   { name: 'Read a vector', easy: ['arrow'], hard: ['fig-read', 'pts'], check: 'pts' },
      apply:  { name: 'Slide a point', easy: ['apply-legs'], hard: ['apply', 'big'], check: 'apply' },
      figure: { name: 'Slide a figure (tap it)', easy: ['fig-legs'], hard: ['fig'], check: 'fig' },
      words:  { name: 'Words to a vector', easy: ['route'], hard: ['compass', 'route3'], late: true, check: 'compass' },
      back:   { name: 'Back to the start', easy: ['back-grid'], hard: ['back'], late: true, check: 'back' },
      keep:   { name: 'Every point moves the same', easy: ['keep'], hard: ['keep'], late: true, check: 'keep' }
    },
    kinds: {
      'arrow-legs': mk('read', () => arrowItem(2, false)),
      arrow:        mk('read', () => arrowItem(1, true)),
      'fig-read':   mk('read', figReadItem),
      pts:          mk('read', ptsItem),
      'apply-legs': mk('apply', () => applyItem(2)),
      apply:        mk('apply', () => applyItem(0)),
      big:          mk('apply', bigItem),
      'fig-legs':   mk('figure', () => figItem(2)),
      fig:          mk('figure', () => figItem(1)),
      route:        mk('words', () => routeItem(false)),
      route3:       mk('words', () => routeItem(true)),
      compass:      mk('words', compassItem),
      'back-grid':  mk('back', () => backItem(2)),
      back:         mk('back', () => backItem(0)),
      keep:         mk('keep', keepItem)
    },
    // the legs drawn, then the arrow alone (left: negative), then a slide with its legs drawn from A
    opening: [
      { kind: 'arrow-legs', item: { t: 'read', lvl: 2, P: [-4, -2], v: [5, 3] } },
      { kind: 'arrow', item: { t: 'read', lvl: 1, P: [3, -3], v: [-4, 2] } },
      { kind: 'apply-legs', item: { t: 'apply', lvl: 2, A: [-4, 3], v: [5, -2], n: 'A' } }
    ],
    defaults: { fix: 1 },
    text(it) {
      switch (it.t) {
        case 'read': return it.fig ? `ABC → A′B′C′ by ${vec(it.v)} (grid)` : it.A ? `A${pt(it.A)} → A′${pt(it.B)}` : `arrow ${vec(it.v)}${it.lvl >= 2 ? ' (legs drawn)' : ''}`;
        case 'apply': return `${it.n}${pt(it.A)} + ${vec(it.v)}${it.lvl >= 2 ? ' (grid, legs drawn)' : ''}`;
        case 'back': return `A + ${vec(it.v)} = A′${pt(it.B)}${it.lvl >= 2 ? ' (grid, legs drawn)' : ''}`;
        case 'fig': return `plot ABC + ${vec(it.v)}${it.lvl >= 2 ? ' (legs drawn)' : ''}`;
        case 'keep': return `true/false: ${FACTS[it.f].txt}`;
        case 'compass': return `${it.dir}, ${it.k} each way`;
        case 'route': return routeText(it).replace(/<[^>]+>/g, '');
      }
      return '';
    },
    speak(it) {
      switch (it.t) {
        case 'read': return it.fig ? 'Triangle ABC slides onto A′B′C′. What vector?' : it.A ? `A is at ${pt(it.A)} and its image A′ is at ${pt(it.B)}. What vector?` : 'An arrow on the grid. What vector is it?';
        case 'apply': return `Slide ${it.n} ${pt(it.A)} by ${vec(it.v)}. Where does it land?`;
        case 'back': return `A slid by ${vec(it.v)} lands on ${pt(it.B)}. Where was A?`;
        case 'fig': return `Slide triangle ABC by ${vec(it.v)}. Tap A′, B′ and C′.`;
        case 'keep': return `True or false: ${FACTS[it.f].txt}`;
        case 'compass': return `The station is ${it.dir} of the hiker. Which vector could be the path?`;
        case 'route': return `${routeText(it).replace(/<[^>]+>/g, '')}. What vector?`;
      }
      return '';
    },
    ask(el, it, submit, ctx) {
      const lvl = lvlOf(it, ctx);
      el._g = el._legs = el._plot = el._f = null;             // the question area is reused: nothing from the last item
      if (it.t === 'read') return askRead(el, it, lvl, submit);
      if (it.t === 'apply') return askApply(el, it, lvl, submit);
      if (it.t === 'back') return askBack(el, it, lvl, submit);
      if (it.t === 'fig') return askFig(el, it, lvl === 0 ? 1 : it.lvl, submit);
      if (it.t === 'keep') return askKeep(el, it, submit);
      if (it.t === 'compass') return askCompass(el, it, submit);
      return askRoute(el, it, submit);
    },
    correct(it) {
      if (it.t === 'fig') return images(it).map((p, i) => ABC1[i] + pt(p)).join(' ');
      if (it.t === 'keep') return FACTS[it.f].truth ? 'True' : 'False';
      if (it.t === 'apply') return it.n + '′' + pt(want(it));
      if (it.t === 'back') return 'A' + pt(want(it));
      return vec(it.v);
    },
    isRight: (it, a) => judge(it, a) === null,
    classify: (it, a) => judge(it, a),
    feedback(it, w, a, kind, err) {
      const cue = it.t === 'fig' || it.t === 'keep' ? 'legs' : it.t === 'compass' ? '' : 'work';
      // a vector never breaks across lines
      return [cue, feedback(it, a, err).replace(/⟨[^⟩]*⟩/g, m => `<span class="vnw">${m}</span>`)];
    },
    reveal(el, it, a, o) {
      const g = el._g;
      if (it.t === 'keep' || it.t === 'compass') {
        const right = it.t === 'keep' ? (FACTS[it.f].truth ? 't' : 'f') : 'ok';
        Pick.mark(el, right, a.pick, o.right);
        // every corner's move: the same legs from A, B and C
        if (!o.right && g) it.V.forEach(p => g.triangle(p, add(p, it.v), { labels: false }));
        return;
      }
      if (it.t === 'fig') {
        const W = images(it), oks = a.pts.map((p, i) => same(p, W[i]));
        el._plot && el._plot.mark(oks);
        if (o.right) return;
        // the student's sides fade; the right image dashed in green; the first wrong corner's move, labelled
        if (el._legs) { g.remove(el._legs); el._legs = null; }
        el.querySelectorAll('.pl-seg').forEach(n => n.classList.add('vfade'));
        g.poly(W, 'pg ok vdash');
        W.forEach((p, i) => { if (!oks[i]) g.dot(p, 'pt ok'); });
        const i = oks.indexOf(false);
        g.triangle(it.V[i], W[i], { labels: true });
        return;
      }
      const w = want(it);
      [0, 1].forEach(c => el._f && el._f.mark('ab'[c], a.v[c] === w[c]));
      if (o.right) return;
      // the legs again, labelled (the legend shows run and rise); off the grid, the work
      if (g && it.t === 'read') {
        if (el._legs) g.remove(el._legs);
        if (it.fig) g.triangle(it.V[0], add(it.V[0], it.v), { labels: true });
        else g.triangle(it.P, add(it.P, it.v), { labels: true });
        return;
      }
      if (g && it.t === 'apply') { if (el._legs) g.remove(el._legs); g.dot(w, 'pt ok', 'A′' + pt(w)); g.triangle(it.A, w, { labels: true }); return; }
      if (g && it.t === 'back') { if (el._legs) g.remove(el._legs); g.dot(w, 'pt ok', 'A' + pt(w)); g.triangle(w, it.B, { labels: true }); return; }
      const wk = el.querySelector('.work'); if (wk) wk.textContent = work(it);
    },
    errors: ERR,
    diagnose: err => DIAG[err] || ['', ''],
    cheatRule: '⟨a, b⟩: a across (right +, left −), then b up or down (up +, down −).',
    get cheat() {
      const host = document.createElement('div'), g = G.make(host, { min: -1, max: 5 });
      g.dot([0, 1], 'pt', 'A(0, 1)'); g.dot([4, 3], 'pt', 'A′(4, 3)'); g.triangle([0, 1], [4, 3], { labels: true }); arrow(g, [0, 1], [4, 3]);
      return `<div class="gk vk"><div class="gridbox">${host.innerHTML}</div><div>A → A′: <b>⟨4, 2⟩</b> = image − start</div>
        <div>A + ⟨4, 2⟩ = A′</div><div>A′ − ⟨4, 2⟩ = A</div><div class="vk-c">NE ⟨+, +⟩ · NW ⟨−, +⟩</div><div class="vk-c">SE ⟨+, −⟩ · SW ⟨−, −⟩</div></div>`;
    }
  });
})();
