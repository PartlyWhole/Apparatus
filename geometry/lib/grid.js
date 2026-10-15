// Grid — the coordinate plane for the geometry exercises: an SVG grid with lines, points, the slope triangle
// (run arrow, then rise arrow, signed labels), tapping lattice points, and the 90° turn (why perpendicular slopes flip).
// Spec: specs/geometry-lines.md. Styles: geo.css.
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent && parent.appendChild(e); return e; };
  const sgn = n => (n < 0 ? '−' + -n : String(n));

  // make(host, { min, max, step }) → a grid drawn into host; units run min..max on both axes
  function make(host, o = {}) {
    const min = o.min ?? -6, max = o.max ?? 6, U = 20, size = (max - min) * U;
    const X = x => (x - min) * U, Y = y => (max - y) * U;
    host.innerHTML = '';
    // label layout: every label tries a few spots and takes the one that overlaps least (other labels, dots, lines,
    // the grid's edge); a tick number under a label is hidden. Text sizes are estimated (the svg may not be on screen).
    const ticks = [], segs = [], dots = [], labels = [], legend = [];
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
    const g = {
      min, max, svg, X, Y,
      clear() { layer.innerHTML = ''; top.innerHTML = ''; segs.length = dots.length = labels.length = legend.length = 0; layout(); },
      line(p, q, cls = 'ln') { const [a, b] = clip(p, q); segs.push([X(a[0]), Y(a[1]), X(b[0]), Y(b[1])]); layout(); return el('line', { x1: X(a[0]), y1: Y(a[1]), x2: X(b[0]), y2: Y(b[1]), class: cls }, layer); },
      seg(p, q, cls = 'sg') { segs.push([X(p[0]), Y(p[1]), X(q[0]), Y(q[1])]); layout(); return el('line', { x1: X(p[0]), y1: Y(p[1]), x2: X(q[0]), y2: Y(q[1]), class: cls }, layer); },
      dot(p, cls = 'pt', label) {
        const d = el('circle', { cx: X(p[0]), cy: Y(p[1]), r: 4.5, class: cls }, top);
        dots.push([X(p[0]), Y(p[1])]);
        if (label) {
          // "A(2, 3)": just the letter on the grid; the coordinates go in the legend beside it
          const m = /^([A-Z])(\(.*\))?$/.exec(label), name = m ? m[1] : label;
          const t = el('text', { class: 'pl' + (m ? ' pn' : '') }, top); t.textContent = name;
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
      triangle(p, q, o2 = {}) {
        const grp = el('g', { class: 'tri' + (o2.cls ? ' ' + o2.cls : '') }, layer);
        const c = [q[0], p[1]], run = q[0] - p[0], rise = q[1] - p[1];
        if (run) { el('line', { x1: X(p[0]), y1: Y(p[1]), x2: X(c[0]), y2: Y(c[1]), class: 'run' }, grp); segs.push([X(p[0]), Y(p[1]), X(c[0]), Y(c[1])]); }
        if (rise) { el('line', { x1: X(c[0]), y1: Y(c[1]), x2: X(q[0]), y2: Y(q[1]), class: 'rise' }, grp); segs.push([X(c[0]), Y(c[1]), X(q[0]), Y(q[1])]); }
        if (o2.labels !== false) {
          const dash = /turned/.test(o2.cls || '') ? ' dash' : '';
          legend.push({ node: grp, html: `<span class="lg-run${dash}"><i></i>run ${sgn(run)}</span>` });
          legend.push({ node: grp, html: `<span class="lg-rise${dash}"><i></i>rise ${sgn(rise)}</span>` });
        }
        layout();
        return grp;
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
      el: (tag, attrs) => el(tag, attrs, layer)
    };
    return g;
  }
  window.Grid = { make, sgn };
})();
