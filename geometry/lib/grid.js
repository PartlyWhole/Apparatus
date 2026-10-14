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
    const svg = el('svg', { viewBox: `-14 -14 ${size + 28} ${size + 28}`, class: 'grid', role: 'img', 'aria-label': 'Coordinate grid' }, host);
    const base = el('g', { class: 'g-base' }, svg);
    for (let v = min; v <= max; v++) {
      el('line', { x1: X(v), y1: 0, x2: X(v), y2: size, class: v === 0 ? 'axis' : 'gl' }, base);
      el('line', { x1: 0, y1: Y(v), x2: size, y2: Y(v), class: v === 0 ? 'axis' : 'gl' }, base);
      if (v !== 0 && v % 2 === 0) {
        el('text', { x: X(v), y: Y(0) + 13, class: 'gn' }, base).textContent = sgn(v);
        el('text', { x: X(0) - 5, y: Y(v) + 3.5, class: 'gn gy' }, base).textContent = sgn(v);
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
    const g = {
      min, max, svg, X, Y,
      clear() { layer.innerHTML = ''; top.innerHTML = ''; },
      line(p, q, cls = 'ln') { const [a, b] = clip(p, q); return el('line', { x1: X(a[0]), y1: Y(a[1]), x2: X(b[0]), y2: Y(b[1]), class: cls }, layer); },
      seg(p, q, cls = 'sg') { return el('line', { x1: X(p[0]), y1: Y(p[1]), x2: X(q[0]), y2: Y(q[1]), class: cls }, layer); },
      dot(p, cls = 'pt', label) {
        const d = el('circle', { cx: X(p[0]), cy: Y(p[1]), r: 4.5, class: cls }, top);
        if (label) el('text', { x: X(p[0]) + 7, y: Y(p[1]) - 7, class: 'pl' }, top).textContent = label;
        return d;
      },
      // the slope triangle from p to q: run (across) first, then rise (up/down); labels show signed run and rise
      triangle(p, q, o2 = {}) {
        const grp = el('g', { class: 'tri' + (o2.cls ? ' ' + o2.cls : '') }, layer);
        const c = [q[0], p[1]], run = q[0] - p[0], rise = q[1] - p[1];
        if (run) el('line', { x1: X(p[0]), y1: Y(p[1]), x2: X(c[0]), y2: Y(c[1]), class: 'run' }, grp);
        if (rise) el('line', { x1: X(c[0]), y1: Y(c[1]), x2: X(q[0]), y2: Y(q[1]), class: 'rise' }, grp);
        if (o2.labels !== false) {
          if (run) el('text', { x: (X(p[0]) + X(c[0])) / 2, y: Y(p[1]) + (rise > 0 ? 14 : -7), class: 'tl run-l' }, grp).textContent = (o2.words ? 'run ' : '') + sgn(run);
          if (rise) el('text', { x: X(c[0]) + (run >= 0 ? 7 : -7), y: (Y(c[1]) + Y(q[1])) / 2 + 4, class: 'tl rise-l' + (run >= 0 ? '' : ' end') }, grp).textContent = (o2.words ? 'rise ' : '') + sgn(rise);
        }
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
