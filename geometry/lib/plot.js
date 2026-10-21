// Plot — tap lattice points to place a figure's image vertices, in order (A′, B′, C′ …); they join up as they're placed
// and close into a polygon when the last one lands. Tap a placed point to take it back (and the ones after it).
//   Plot.wire(g, { names: ["A′", "B′", "C′"], closed: true, cls, onChange(points) }) → { points(), done(), clear(), stop(), mark(oks) }
//   points(): [[x, y] | undefined, …] in name order · done(): every name placed · mark([true, false, …]): green/red dots
// Also: Plot.mirror(g, line, cls) draws a mirror line: { x: a } | { y: b } | { m: 1 } (y = x) | { m: -1 } (y = −x).
// Uses lib/grid.js (dots carry the names on the grid and the coordinates in the legend). Spec: specs/geometry-transformations.md.
(function () {
  const same = (p, q) => p && q && p[0] === q[0] && p[1] === q[1];
  function wire(g, o = {}) {
    const names = o.names || ['A′', 'B′', 'C′'], pts = [], dots = [], segs = [];
    let poly = null, off = false;
    const sg = (p, q) => g.seg(p, q, o.cls || 'sg pl-seg');
    const redraw = () => {
      segs.splice(0).forEach(n => g.remove(n)); if (poly) { g.remove(poly); poly = null; }
      for (let i = 1; i < pts.length; i++) segs.push(sg(pts[i - 1], pts[i]));
      if (o.closed !== false && pts.length === names.length && pts.length > 2) segs.push(sg(pts[pts.length - 1], pts[0]));
      o.onChange && o.onChange(pts.slice());
    };
    const label = (n, p) => `${n}(${G.sgn(p[0])}, ${G.sgn(p[1])})`;
    const G = window.Grid;
    const stop = g.onTap(q => {
      if (off) return;
      const i = pts.findIndex(p => same(p, q));
      if (i >= 0) { pts.splice(i).forEach(() => g.remove(dots.pop())); return redraw(); }
      if (pts.length >= names.length) return;
      pts.push(q); dots.push(g.dot(q, 'pt pick', label(names[pts.length - 1], q))); redraw();
    });
    return {
      points: () => names.map((_, i) => pts[i]),
      done: () => pts.length === names.length,
      clear() { pts.splice(0); dots.splice(0).forEach(d => g.remove(d)); redraw(); },
      stop() { off = true; stop(); },
      mark(oks) { dots.forEach((d, i) => d.setAttribute('class', 'pt ' + (oks[i] ? 'ok' : 'no'))); }
    };
  }
  function mirror(g, line, cls = 'ln mirror') {
    const lo = g.min, hi = g.max;
    if (line.x != null) return g.line([line.x, lo], [line.x, hi], cls);
    if (line.y != null) return g.line([lo, line.y], [hi, line.y], cls);
    return g.line([0, 0], [1, line.m], cls);
  }
  window.Plot = { wire, mirror };
})();
