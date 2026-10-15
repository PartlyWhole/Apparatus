// Grid — the coordinate plane for the geometry exercises: an SVG grid with lines, points, the slope triangle
// (run arrow, then rise arrow, signed labels), tapping lattice points, and the 90° turn (why perpendicular slopes flip).
// Spec: specs/geometry-lines.md, specs/geometry-next.md. Styles: geo.css; the additions marked + also need grid-extra.css.
//
// g = Grid.make(host, { min, max })        units min..max on both axes; the legend goes beside/below the grid
//   g.line(p, q, cls) · g.seg(p, q, cls)   a line through p and q to the grid's edges · a segment
//   g.dot(p, cls, 'A(1, 2)')               the letter on the grid, the coordinates in the legend
//   g.triangle(p, q, { labels: true | '?' | false, cls, hyp, d, legs })
//                                          run (blue) then rise (green); the legend gets a small copy.
//                                          + hyp: true draws the slanted side in ink; d: '?' | '3√5' labels it "d ?" in the
//                                          legend (null: no label); legs: [run, rise] texts override the leg values ('y').
//   g.turn(group, p, done)                 turn 90° about p (animated)
//   g.onTap(cb) → stop()                   tap a lattice point
//   + g.poly(pts, cls)                     a closed polygon (its sides keep labels off)
//   + g.squares(tri, { back, areas, sum }) → Promise: squares grow on the legend triangle's legs (blue, then green, area
//                                          inside), then the tilted square on the slanted side. back: the slanted square
//                                          first, then the known leg, then the rest (back: 'run' when run is unknown).
//                                          areas: [run, rise, d] texts override the numbers; sum: "9 + 16 = 25" underneath.
//   + g.pickTwo({ on(q) → bool, names: ['A','B'], labels, say, prompt, off }) → Promise<[a, b]> (a .tri on the array):
//                                          tap two lattice points on a line; the slope triangle appears between them.
//                                          say: an element or function for the hint line.
//   + g.drawLine({ onChange(p, q), cls, dot, names, start }) → { points(), clear(), stop() }: tap two lattice points and
//                                          the line through them is drawn to the edges; tap a placed point to remove it.
//   + g.remove(node)                       a dot (with its letter and legend entry), a triangle, a line, a polygon…
//   + g.rightMark(p, u, v, cls)            the small right-angle square at p between directions u and v
//   + g.strings(p, a, b, cls)              dashed strings from p to a and to b, ticked (the same ticks when equal)
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent && parent.appendChild(e); return e; };
  const sgn = n => (n < 0 ? '−' + -n : String(n));
  const r1 = n => Math.round(n * 10) / 10;

  // the slope triangle drawn small for the legend: run (blue) across, then rise (green) up or down, in the same
  // directions as on the grid, each leg labelled with its value ("?" while the student counts).
  // x (optional): { hyp, d, legs, sq } — the slanted side in ink and its "d" label, leg texts, the squares on the sides
  function mini(run, rise, hide, names = [], x = {}) {
    // units → pixels: the longer leg at most 84 px, 40 px per unit at most; a zero leg keeps its label (rise 0 on a flat line, run 0 on a vertical one)
    const big = Math.max(Math.abs(run), Math.abs(rise), 1), kk = Math.min(84 / big, 40), P = [0, 0], C = [run * kk, 0], Q = [run * kk, -rise * kk];
    const lt = (i, n) => x.legs && x.legs[i] != null ? x.legs[i] : hide ? '?' : sgn(n);
    const R = run >= 0 ? 1 : -1, U = rise > 0 ? 1 : -1;
    const t = (x, y, cls, anc, txt) => `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anc}">${txt}</text>`;
    const xs = [0, C[0]], ys = [0, Q[1]];
    // the squares (only when both legs are there): each on its side, outward, with its side length in px
    const sq = run && rise && x.sq, Lr = Math.abs(run) * kk, Li = Math.abs(rise) * kk, Lh = Math.hypot(Lr, Li);
    const nh = (() => { const h = [-Q[1] / Lh, Q[0] / Lh], m = [Q[0] / 2 - C[0], Q[1] / 2]; return h[0] * m[0] + h[1] * m[1] > 0 ? h : [-h[0], -h[1]]; })();
    const sides = sq ? {
      run: { a: P, b: C, n: [0, U], L: Lr, u: Math.abs(run), area: run * run },
      rise: { a: C, b: Q, n: [R, 0], L: Li, u: Math.abs(rise), area: rise * rise },
      hyp: { a: P, b: Q, n: nh, L: Lh, u: Math.sqrt(run * run + rise * rise), area: run * run + rise * rise }
    } : null;
    let h = '';
    if (sq) {
      // full-size corners set the bounds from the start, so the legend doesn't jump as the squares grow
      for (const k in sides) { const s = sides[k]; [s.a, s.b].forEach(c => { xs.push(c[0] + s.n[0] * s.L); ys.push(c[1] + s.n[1] * s.L); }); }
      const ar = { run: 0, rise: 1, hyp: 2 };
      const draw = (k, f) => {
        const s = sides[k], o = [s.n[0] * s.L * f, s.n[1] * s.L * f], pt = c => `${r1(c[0])},${r1(c[1])}`;
        let g = `<polygon points="${pt(s.a)} ${pt(s.b)} ${pt([s.b[0] + o[0], s.b[1] + o[1]])} ${pt([s.a[0] + o[0], s.a[1] + o[1]])}" class="m-sq m-sq-${k}" fill="none" stroke="currentColor"/>`;
        // unit tiles when the side is a whole number of units
        if (Math.abs(s.u - Math.round(s.u)) < 1e-9 && s.u > 1) {
          const u = Math.round(s.u), d = [(s.b[0] - s.a[0]) / u, (s.b[1] - s.a[1]) / u], st = s.L / u;
          for (let j = 1; j < u; j++) {
            const c = [s.a[0] + d[0] * j, s.a[1] + d[1] * j];
            g += `<line x1="${r1(c[0])}" y1="${r1(c[1])}" x2="${r1(c[0] + o[0])}" y2="${r1(c[1] + o[1])}" class="m-tile m-tile-${k}"/>`;
            if (j * st < s.L * f - 0.5) g += `<line x1="${r1(s.a[0] + s.n[0] * st * j)}" y1="${r1(s.a[1] + s.n[1] * st * j)}" x2="${r1(s.b[0] + s.n[0] * st * j)}" y2="${r1(s.b[1] + s.n[1] * st * j)}" class="m-tile m-tile-${k}"/>`;
          }
        }
        if (f >= 1) {
          const c = [(s.a[0] + s.b[0]) / 2 + s.n[0] * s.L / 2, (s.a[1] + s.b[1]) / 2 + s.n[1] * s.L / 2];
          g += t(r1(c[0]), r1(c[1] + 5), `m-ar m-ar-${k}`, 'middle', x.sq.areas && x.sq.areas[ar[k]] != null ? x.sq.areas[ar[k]] : s.area);
        }
        return g;
      };
      x.sq.done.forEach(k => { h += draw(k, 1); });
      if (x.sq.grow) h += draw(x.sq.grow, x.sq.k);
    }
    if (run && rise) h += `<line x1="${P[0]}" y1="${P[1]}" x2="${Q[0]}" y2="${Q[1]}" class="m-hyp${x.hyp ? ' m-d' : ''}"/>`;
    if (run) h += `<line x1="0" y1="0" x2="${C[0]}" y2="0" class="m-run"/>`;
    if (rise) h += `<line x1="${C[0]}" y1="0" x2="${Q[0]}" y2="${Q[1]}" class="m-rise"/>`;
    // with squares, each label rides on its square's far edge as it grows
    const f = k => !sq ? 0 : x.sq.done.includes(k) ? 1 : x.sq.grow === k ? x.sq.k : 0, pr = Lr * f('run'), pi = Li * f('rise'), ph = Lh * f('hyp');
    // run label: on the side of the run leg away from the rise (above on a flat line); "run 0" under A on a vertical line
    h += run ? t(C[0] / 2, rise > 0 ? 17 + pr : -8 - pr, 'm-rl', 'middle', `run ${lt(0, run)}`) : t(0, rise > 0 ? 20 : -10, 'm-rl', 'middle', `run ${lt(0, 0)}`);
    // rise label: beside the rise leg, outside; "rise 0" under the end of a flat line
    h += rise ? t(C[0] + (8 + pi) * R, Q[1] / 2 + 4, 'm-ri', R > 0 ? 'start' : 'end', `rise ${lt(1, rise)}`) : t(C[0], 18, 'm-ri', 'middle', `rise ${lt(1, 0)}`);
    // d label: off the middle of the slanted side, away from the right angle (beyond the square); on a flat or
    // vertical line, on the other side of the leg from its label
    if (x.d != null) {
      if (run && rise) {
        const m = [Q[0] / 2 + nh[0] * (14 + ph), Q[1] / 2 + nh[1] * (14 + ph)];
        h += t(r1(m[0]), r1(m[1] + 4), 'm-dl', nh[0] > 0.35 ? 'start' : nh[0] < -0.35 ? 'end' : 'middle', `d ${x.d}`);
      } else if (run) { ys.push(36); h += t(C[0] / 2, 36, 'm-dl', 'middle', `d ${x.d}`); }
      else if (rise) h += t(-8, Q[1] / 2 + 4, 'm-dl', 'end', `d ${x.d}`);
    }
    // names: A behind the start, B past the end (above/below it, or beyond a flat line's end)
    if (names[0]) h += run ? t(-9 * R, 5, 'm-nm', R > 0 ? 'end' : 'start', names[0]) : t(-9, 5, 'm-nm', 'end', names[0]);
    if (names[1]) h += rise ? t(Q[0], Q[1] - (U > 0 ? 9 : -19), 'm-nm', 'middle', names[1]) : t(Q[0] + 9 * R, 5, 'm-nm', R > 0 ? 'start' : 'end', names[1]);
    h += `<circle cx="0" cy="0" r="3" class="m-pt"/><circle cx="${Q[0]}" cy="${Q[1]}" r="3" class="m-pt"/>`;
    // bounds: the legs plus room for the labels
    let x0 = Math.min(...xs) - 58, x1 = Math.max(...xs) + 58, y0 = Math.min(...ys) - 26, y1 = Math.max(...ys) + 26;
    if (sq && x.sq.sum) {
      // "9 + 16 = 25" (back: "25 − 9 = 16") under it all, once every square is in
      const a = x.sq.areas || [], v = (i, n) => a[i] != null ? a[i] : n, A = v(0, run * run), B = v(1, rise * rise), D = v(2, run * run + rise * rise);
      const s = x.sq.back ? (x.sq.back === 'run' ? `${D} − ${B} = ${A}` : `${D} − ${A} = ${B}`) : `${A} + ${B} = ${D}`;
      if (!x.sq.grow && x.sq.done.length === 3) h += t(r1((x0 + x1) / 2), y1 + 8, 'm-sum', 'middle', s);
      y1 += 22;
    }
    // squares can make it large: shrink the drawing (not the bounds) to fit a phone's legend
    const w = x1 - x0, ht = y1 - y0, z = sq ? Math.min(1, 300 / w, 260 / ht) : 1;
    return `<svg viewBox="${x0} ${y0} ${w} ${ht}" width="${z < 1 ? r1(w * z) : w}" height="${z < 1 ? r1(ht * z) : ht}" aria-hidden="true">${h}</svg>`;
  }

  // make(host, { min, max, step }) → a grid drawn into host; units run min..max on both axes
  function make(host, o = {}) {
    const min = o.min ?? -6, max = o.max ?? 6, U = 20, size = (max - min) * U;
    const X = x => (x - min) * U, Y = y => (max - y) * U;
    host.innerHTML = '';
    // label layout: every label tries a few spots and takes the one that overlaps least (other labels, dots, lines,
    // the grid's edge); a tick number under a label is hidden. Text sizes are estimated (the svg may not be on screen).
    // segs and dots carry .node (what drew them) so remove() can take them out again.
    const ticks = [], segs = [], dots = [], labels = [], legend = [], names = {};
    const nameAt = p => names[p[0] + ',' + p[1]];
    const seg = (a, b, node) => { const s = [X(a[0]), Y(a[1]), X(b[0]), Y(b[1])]; s.node = node; segs.push(s); return s; };
    const axes = [[X(min), Y(0), X(max), Y(0)], [X(0), Y(min), X(0), Y(max)]];
    const leg = document.createElement('div'); leg.className = 'glegend';
    const svg = el('svg', { viewBox: `-14 -14 ${size + 28} ${size + 28}`, class: 'grid', role: 'img', 'aria-label': 'Coordinate grid' }, host);
    host.appendChild(leg);
    const base = el('g', { class: 'g-base' }, svg);
    for (let v = min; v <= max; v++) {
      el('line', { x1: X(v), y1: 0, x2: X(v), y2: size, class: v === 0 ? 'axis' : 'gl' }, base);
      el('line', { x1: 0, y1: Y(v), x2: size, y2: Y(v), class: v === 0 ? 'axis' : 'gl' }, base);
      if (v !== 0 && v % 2 === 0) {
        const w = sgn(v).length * 5.6;
        ticks.push({ e: el('text', { x: X(v), y: Y(0) + 13, class: 'gn' }, base), r: [X(v) - w / 2, Y(0) + 5, w, 10] });
        ticks.push({ e: el('text', { x: X(0) - 5, y: Y(v) + 3.5, class: 'gn gy' }, base), r: [X(0) - 5 - w, Y(v) - 5, w, 10] });
        ticks[ticks.length - 2].e.textContent = ticks[ticks.length - 1].e.textContent = sgn(v);
      }
    }
    const layer = el('g', { class: 'g-draw' }, svg);
    const top = el('g', { class: 'g-top' }, svg);
    const clip = (p, q) => {
      // the line through p and q, extended to the grid's edges
      const dx = q[0] - p[0], dy = q[1] - p[1];
      if (dx === 0) return [[p[0], min], [p[0], max]];
      const m = dy / dx, at = x => p[1] + m * (x - p[0]);
      const pts = [];
      [[min, at(min)], [max, at(max)]].forEach(c => { if (c[1] >= min - 1e-9 && c[1] <= max + 1e-9) pts.push(c); });
      if (m !== 0) [min, max].forEach(y => { const x = p[0] + (y - p[1]) / m; if (x > min && x < max) pts.push([x, y]); });
      pts.sort((a, b) => a[0] - b[0]);
      return [pts[0], pts[pts.length - 1]];
    };
    const rectOf = (L, c) => [(c[2] === 's' ? c[0] : c[2] === 'e' ? c[0] - L.w : c[0] - L.w / 2) - 2, c[1] - L.h * 0.8 - 2, L.w + 4, L.h + 4];
    const hit = (a, b) => a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3];
    const crosses = (r, sg) => { for (let k = 0; k <= 24; k++) { const x = sg[0] + (sg[2] - sg[0]) * k / 24, y = sg[1] + (sg[3] - sg[1]) * k / 24; if (x > r[0] && x < r[0] + r[2] && y > r[1] && y < r[1] + r[3]) return true; } return false; };
    function layout() {
      const done = [];
      // a label whose triangle was removed (the turned copy) drops out
      for (let i = labels.length - 1; i >= 0; i--) if (labels[i].t.ownerSVGElement !== svg) labels.splice(i, 1);
      labels.slice().sort((a, b) => a.pri - b.pri).forEach(L => {
        let best = null, bc = Infinity;
        L.at.forEach((c, i) => {
          const r = rectOf(L, c);
          let cost = i * 0.5;
          done.forEach(d => { if (hit(r, d)) cost += 100; });
          dots.forEach(d => { if (hit(r, [d[0] - 5, d[1] - 5, 10, 10])) cost += 60; });
          segs.forEach(sg => { if (crosses(r, sg)) cost += 25; });
          axes.forEach(sg => { if (crosses(r, sg)) cost += 40; });
          if (r[0] < -12 || r[1] < -12 || r[0] + r[2] > size + 12 || r[1] + r[3] > size + 12) cost += 80;
          ticks.forEach(tk => { if (hit(r, tk.r)) cost += 2; });
          if (cost < bc) { bc = cost; best = c; }
        });
        L.t.setAttribute('x', best[0]); L.t.setAttribute('y', best[1]);
        L.t.style.textAnchor = best[2] === 's' ? 'start' : best[2] === 'e' ? 'end' : 'middle';
        done.push(rectOf(L, best));
      });
      ticks.forEach(tk => { tk.e.style.visibility = done.some(r => hit(r, tk.r)) ? 'hidden' : ''; });
      for (let i = legend.length - 1; i >= 0; i--) if (legend[i].node.ownerSVGElement !== svg) legend.splice(i, 1);
      const pts = legend.filter(x => /lg-pt/.test(x.html)), rr = legend.filter(x => !/lg-pt/.test(x.html));
      leg.innerHTML = pts.map(x => x.html).join('') + (pts.length && rr.length ? '<span class="lg-br"></span>' : '') + rr.map((x, i) => (i && rr[i - 1].node !== x.node ? '<span class="lg-br"></span>' : '') + x.html).join('');
    }
    let uid = 0;
    const same = (a, b) => a[0] === b[0] && b[1] === a[1];
    const ptName = (n, p) => `${n}(${sgn(p[0])}, ${sgn(p[1])})`;
    const g = {
      min, max, svg, X, Y,
      clear() { layer.innerHTML = ''; top.innerHTML = ''; segs.length = dots.length = labels.length = legend.length = 0; for (const k in names) delete names[k]; layout(); },
      line(p, q, cls = 'ln') { const [a, b] = clip(p, q), s = seg(a, b); layout(); return (s.node = el('line', { x1: X(a[0]), y1: Y(a[1]), x2: X(b[0]), y2: Y(b[1]), class: cls }, layer)); },
      seg(p, q, cls = 'sg') { const s = seg(p, q); layout(); return (s.node = el('line', { x1: X(p[0]), y1: Y(p[1]), x2: X(q[0]), y2: Y(q[1]), class: cls }, layer)); },
      dot(p, cls = 'pt', label) {
        const d = el('circle', { cx: X(p[0]), cy: Y(p[1]), r: 4.5, class: cls }, top);
        const rec = [X(p[0]), Y(p[1])]; rec.node = d; dots.push(rec);
        if (label) {
          // "A(2, 3)": just the letter on the grid; the coordinates go in the legend beside it
          const m = /^([A-Z])(\(.*\))?$/.exec(label), name = m ? m[1] : label;
          if (m) names[p[0] + ',' + p[1]] = m[1];
          const t = el('text', { class: 'pl' + (m ? ' pn' : '') }, top); t.textContent = name;
          d._gl = { t, key: m ? p[0] + ',' + p[1] : null, name: m && m[1] };
          if (m && m[2]) legend.push({ node: d, html: `<span class="lg-pt ${cls.replace('pt', '').trim()}"><b>${m[1]}</b>${m[2].replace(/, /, ',&nbsp;')}</span>` });
          const w = name.length * (m ? 7.5 : 5.9) + 2, cx = X(p[0]), cy = Y(p[1]);
          // NE, NW, SE, SW, E, W, N, S
          labels.push({ t, pri: 1, w, h: 11, at: [[cx + 7, cy - 7, 's'], [cx - 7, cy - 7, 'e'], [cx + 7, cy + 15, 's'], [cx - 7, cy + 15, 'e'],
            [cx + 9, cy + 4, 's'], [cx - 9, cy + 4, 'e'], [cx, cy - 10, 'm'], [cx, cy + 19, 'm']] });
        }
        layout();
        return d;
      },
      // the slope triangle from p to q: run (across, blue) then rise (up/down, green). With labels, run and rise go in
      // the legend beside the grid in the same colors (dashed swatch for a turned triangle).
      // hyp: the slanted side in ink (drawn under the legs); d: its label in the legend; legs: [run, rise] label texts
      triangle(p, q, o2 = {}) {
        const grp = el('g', { class: 'tri' + (o2.cls ? ' ' + o2.cls : '') }, layer);
        const c = [q[0], p[1]], run = q[0] - p[0], rise = q[1] - p[1];
        if (o2.hyp && (run || rise)) { el('line', { x1: X(p[0]), y1: Y(p[1]), x2: X(q[0]), y2: Y(q[1]), class: 'hyp' }, grp); if (run && rise) seg(p, q, grp); }
        if (run) { el('line', { x1: X(p[0]), y1: Y(p[1]), x2: X(c[0]), y2: Y(c[1]), class: 'run' }, grp); seg(p, c, grp); }
        if (rise) { el('line', { x1: X(c[0]), y1: Y(c[1]), x2: X(q[0]), y2: Y(q[1]), class: 'rise' }, grp); seg(c, q, grp); }
        if (o2.labels !== false) {
          const dash = /turned/.test(o2.cls || '') ? ' dash' : '', nm = [nameAt(p), nameAt(q)], hide = o2.labels === '?';
          const mx = { hyp: o2.hyp, d: o2.d, legs: o2.legs, sq: null }, id = ++uid;
          // labels: '?' names the legs without their values (the student counts them). The html is rebuilt from mx
          // whenever the legend is redrawn, so the squares' state survives later draws.
          legend.push({ node: grp, id, mx, run, rise, get html() { return `<span class="lg-tri${dash}"${mx.sq ? ` data-lg="${id}"` : ''}>${mini(run, rise, hide, nm, mx)}</span>`; } });
        }
        layout();
        return grp;
      },
      // the squares on the legend triangle's sides, grown one by one; resolves when all are in
      squares(grp, o3 = {}) {
        const e = legend.find(x => x.node === grp);
        if (!e || !e.mx || !e.run || !e.rise) return Promise.resolve();
        const order = o3.back ? (o3.back === 'run' ? ['hyp', 'rise', 'run'] : ['hyp', 'run', 'rise']) : ['run', 'rise', 'hyp'];
        const st = e.mx.sq = { done: [], grow: null, k: 0, back: o3.back, areas: o3.areas, sum: o3.sum };
        if (reduced()) { st.done = order.slice(); layout(); return Promise.resolve(); }
        layout();
        const alive = () => grp.ownerSVGElement === svg && e.mx.sq === st;
        const paint = () => { const sp = leg.querySelector(`[data-lg="${e.id}"]`); if (sp) sp.outerHTML = e.html; };
        return new Promise(res => {
          let i = 0;
          const next = () => {
            if (!alive()) return res();
            if (i >= order.length) { st.grow = null; paint(); return res(); }
            st.grow = order[i++]; st.k = 0;
            const t0 = performance.now(), ms = 700;
            (function frame(tm) {
              if (!alive()) return res();
              const k = Math.min(1, (tm - t0) / ms);
              st.k = 1 - Math.pow(1 - k, 3);
              if (k >= 1) { st.done.push(st.grow); st.grow = null; }
              paint();
              if (k < 1) requestAnimationFrame(frame); else setTimeout(next, 350);
            })(t0);
          };
          next();
        });
      },
      // turn a group 90° counterclockwise about point p (animated): run and rise swap, one changes sign
      turn(grp, p, done) {
        const cx = X(p[0]), cy = Y(p[1]), t0 = performance.now(), ms = reduced() ? 1 : 900;
        (function frame(t) {
          const k = Math.min(1, (t - t0) / ms), a = -90 * (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
          grp.setAttribute('transform', `rotate(${a} ${cx} ${cy})`);
          if (k < 1) requestAnimationFrame(frame); else done && done();
        })(t0);
      },
      // tap a lattice point: cb([x, y]); returns stop()
      onTap(cb) {
        const h = e => {
          const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
          const sx = (e.clientX - r.left) / r.width * vb.width + vb.x, sy = (e.clientY - r.top) / r.height * vb.height + vb.y;
          const x = Math.round(sx / U + min), y = Math.round(max - sy / U);
          if (x >= min && x <= max && y >= min && y <= max) cb([x, y]);
        };
        svg.addEventListener('click', h); svg.classList.add('tappable');
        return () => { svg.removeEventListener('click', h); svg.classList.remove('tappable'); };
      },
      // a closed polygon through pts (grid units)
      poly(pts, cls = 'pg') {
        const n = el('polygon', { points: pts.map(p => X(p[0]) + ',' + Y(p[1])).join(' '), class: cls, fill: 'none', stroke: 'currentColor' }, layer);
        pts.forEach((p, i) => seg(p, pts[(i + 1) % pts.length], n));
        layout();
        return n;
      },
      // take something drawn off the grid: its lines and dots stop pushing labels; a dot's letter, name and legend entry go too
      remove(node) {
        if (!node) return;
        if (node._gl) { node._gl.t.remove(); if (node._gl.key && names[node._gl.key] === node._gl.name) delete names[node._gl.key]; }
        node.remove();
        for (let i = segs.length - 1; i >= 0; i--) if (segs[i].node === node) segs.splice(i, 1);
        for (let i = dots.length - 1; i >= 0; i--) if (dots[i].node === node) dots.splice(i, 1);
        layout();
      },
      // tap two points on a line (on(q) says which taps count) → the slope triangle between them → [a, b]
      pickTwo(o3 = {}) {
        const nm = o3.names === undefined ? ['A', 'B'] : o3.names;
        const say = s => { if (typeof o3.say === 'function') o3.say(s); else if (o3.say) o3.say.textContent = s; };
        let a = null, stop;
        say(o3.prompt || 'Tap two points on the line.');
        const pr = new Promise(res => {
          stop = g.onTap(q => {
            if (o3.on && !o3.on(q)) { say(o3.off || 'On the line, where it crosses grid corners.'); return; }
            if (!a) { a = q; g.dot(q, 'pt pick', nm && nm[0] ? ptName(nm[0], q) : undefined); return; }
            if (same(q, a)) return;
            stop(); g.dot(q, 'pt pick', nm && nm[1] ? ptName(nm[1], q) : undefined); say('');
            const ab = [a, q];
            ab.tri = g.triangle(a, q, { labels: o3.labels || false, hyp: o3.hyp, d: o3.d });
            res(ab);
          });
        });
        pr.stop = () => stop();
        return pr;
      },
      // tap two lattice points → the line through them, to the edges; tap a placed point to take it back
      drawLine(o3 = {}) {
        const pts = []; let ln = null;
        const free = () => o3.names && o3.names.find(n => !pts.some(x => x.n === n));
        const add = p => { const n = free(); pts.push({ p, n, d: g.dot(p, o3.dot || 'pt pick', n ? ptName(n, p) : undefined) }); };
        const redraw = () => {
          if (ln) { g.remove(ln); ln = null; }
          if (pts.length === 2) ln = g.line(pts[0].p, pts[1].p, o3.cls || 'ln');
          o3.onChange && o3.onChange(pts[0] ? pts[0].p : null, pts[1] ? pts[1].p : null);
        };
        (o3.start || []).slice(0, 2).forEach(add);
        if (pts.length === 2) { ln = g.line(pts[0].p, pts[1].p, o3.cls || 'ln'); }
        const stop = g.onTap(q => {
          const i = pts.findIndex(x => same(x.p, q));
          if (i >= 0) { g.remove(pts[i].d); pts.splice(i, 1); redraw(); return; }
          if (pts.length >= 2) return;
          add(q); redraw();
        });
        return {
          points: () => pts.map(x => x.p),
          clear() { pts.splice(0).forEach(x => g.remove(x.d)); redraw(); },
          stop
        };
      },
      // the small square marking a right angle at p, between directions u and v (grid units)
      rightMark(p, u, v, cls = 'rmark') {
        const s = 8, n = w => { const l = Math.hypot(w[0], w[1]); return [w[0] / l * s, -w[1] / l * s]; }, a = n(u), b = n(v), x = X(p[0]), y = Y(p[1]);
        const pt = (dx, dy) => `${r1(x + dx)},${r1(y + dy)}`;
        return el('polyline', { points: `${pt(a[0], a[1])} ${pt(a[0] + b[0], a[1] + b[1])} ${pt(b[0], b[1])}`, class: cls, fill: 'none', stroke: 'currentColor' }, layer);
      },
      // dashed strings from p to a and to b, ticked across the middle: one tick each when they're equal, one and two when not
      strings(p, a, b, cls) {
        const grp = el('g', { class: 'strs' + (cls ? ' ' + cls : '') }, layer);
        const d2 = q => (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2, la = d2(a), lb = d2(b);
        [[a, la === lb || la < lb ? 1 : 2], [b, la === lb || lb < la ? 1 : 2]].forEach(([q, nt]) => {
          if (same(p, q)) return;
          el('line', { x1: X(p[0]), y1: Y(p[1]), x2: X(q[0]), y2: Y(q[1]), class: 'str', stroke: 'currentColor', 'stroke-dasharray': '4 3' }, grp);
          seg(p, q, grp);
          const mx = (X(p[0]) + X(q[0])) / 2, my = (Y(p[1]) + Y(q[1])) / 2, dx = X(q[0]) - X(p[0]), dy = Y(q[1]) - Y(p[1]), l = Math.hypot(dx, dy);
          const ux = dx / l, uy = dy / l;
          for (let j = 0; j < nt; j++) {
            const o = (j - (nt - 1) / 2) * 5, cx = mx + ux * o, cy = my + uy * o;
            el('line', { x1: r1(cx - uy * 5), y1: r1(cy + ux * 5), x2: r1(cx + uy * 5), y2: r1(cy - ux * 5), class: 'tick', stroke: 'currentColor' }, grp);
          }
        });
        layout();
        return grp;
      },
      el: (tag, attrs) => el(tag, attrs, layer)
    };
    return g;
  }
  window.Grid = { make, sgn };
})();
