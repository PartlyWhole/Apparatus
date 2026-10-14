// Places — the shared "point on a row of places" visual for Factor Out, Factor In and Conversions.
// A number is { d: its digits, p: how many digits are left of the point } (p can be ≤ 0 or ≥ d.length).
// The row shows the digits with invisible empty places on each side; a zero appears only where the point's
// position adds one. A power of ten (× 10ⁿ) can ride at the end of the row and count the hops.
// (Moving the Point predates this file and has its own copy of the row.)
(function () {
  const PAD = 4, HOP_MS = 420;
  const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  const sup = e => String(e).split('').map(c => SUP[c]).join('');
  const commas = s => s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const supHTML = e => `<sup>${e < 0 ? '−' + -e : e}</sup>`;
  const powHTML = e => `× 10${supHTML(e)}`;
  const powText = e => `× 10${sup(e)}`;

  // the number written normally, once the point sits at gap g of the row (zeros filled in, trailing zeros dropped after the point)
  function valueAt(d, g) {
    const full = '0'.repeat(PAD) + d + '0'.repeat(PAD);
    const int = full.slice(0, g).replace(/^0+/, '') || '0', frac = full.slice(g).replace(/0+$/, '');
    return commas(int) + (frac ? '.' + frac : '');
  }
  const numStr = (d, p) => valueAt(d, PAD + p);
  const slots = d => PAD + d.length + PAD;
  // which empty places are zeros when the point is at gap g
  const isFill = (d, g, i) => { const a = PAD, b = PAD + d.length; return (g > b && i >= b && i < g) || (g <= a && i >= g - 1 && i < a); };
  // zeros at the end of the digits that sit after the point aren't written (4.500 is 4.5): true for digit j with the point at g
  const isTrail = (d, g, j) => PAD + j >= g && /^0+$/.test(d.slice(j));
  // the last place that shows a digit or zero, with the point at g
  const lastShown = (d, g) => { let end = PAD + d.length; while (end - 1 >= g && end - 1 - PAD >= 0 && isTrail(d, g, end - 1 - PAD)) end--; return Math.max(end, g) - 1; };

  function rowHTML(d, p, o = {}) {
    const n = slots(d), g = o.at != null ? o.at : PAD + p;
    let h = '';
    for (let i = 0; i < n; i++) {
      const j = i - PAD, dig = j >= 0 && j < d.length;
      // also: the zeros the number had with its point somewhere else are kept, but light (they're where the hops came from)
      const filled = isFill(d, g, i), was = !filled && o.also != null && isFill(d, o.also, i);
      h += dig ? `<span class="s${isTrail(d, g, j) ? ' gone' : ''}">${d[j]}</span>` : `<span class="s pad${filled ? ' fill' : was ? ' prev' : ''}">0</span>`;
    }
    return `<div class="prow" style="--n:${n}" aria-hidden="true">${h}<span class="pt start" style="--g:${PAD + p}"></span><span class="pw" hidden></span></div>`;
  }
  // hide the number's own trailing zeros that are after the point at g
  function trail(row, d, g) {
    row.querySelectorAll('.s').forEach((s, i) => { const j = i - PAD; if (j >= 0 && j < d.length) s.classList.toggle('gone', isTrail(d, g, j)); });
  }
  function setFills(row, d, g, cls = 'fill') {
    if (cls === 'fill' && g != null) trail(row, d, g);
    row.querySelectorAll('.s').forEach((s, i) => s.classList.toggle(cls, g != null && isFill(d, g, i) && s.classList.contains('pad')));
  }
  // the power rides just after the last shown place; e = 0 hides it; '?' shows × 10^?
  function setPower(row, d, g, e) {
    const pw = row.querySelector('.pw');
    if (e === 0 || e == null) { pw.hidden = true; return; }
    pw.hidden = false;
    pw.style.setProperty('--g', lastShown(d, g) + 1);
    pw.innerHTML = `<span>${e === '?' ? `× 10<sup>?</sup>` : powHTML(e)}</span>`;   // the inner span is the smaller text; the outer keeps the row's em for positioning
  }
  // zeros for a point at g: solid where the starting number already had them (or all, once committed); light where the move adds them
  function paint(row, d, g, start, committed) {
    trail(row, d, g == null ? start : g);
    row.querySelectorAll('.s').forEach((s, i) => {
      if (!s.classList.contains('pad')) return;
      const need = g != null && isFill(d, g, i), had = isFill(d, start, i);
      s.classList.toggle('fill', g == null ? had : need && (committed || had));
      s.classList.toggle('prev', g != null && need && !committed && !had);
    });
  }
  // any number written normally: digits d with the point after pos digits (pos may be ≤ 0 or ≥ d.length)
  function fmt(d, pos) {
    let int, frac;
    if (pos >= d.length) { int = d + '0'.repeat(pos - d.length); frac = ''; }
    else if (pos <= 0) { int = '0'; frac = '0'.repeat(-pos) + d; }
    else { int = d.slice(0, pos); frac = d.slice(pos); }
    int = int.replace(/^0+(?=\d)/, ''); frac = frac.replace(/0+$/, '');
    return commas(int) + (frac ? '.' + frac : '');
  }
  const addPoint = (row, cls, g) => { const p = document.createElement('span'); p.className = 'pt ' + cls; p.style.setProperty('--g', g); row.appendChild(p); return p; };

  // hop a point from gap a to gap b, one place at a time: numbered arcs underneath; onStep(g) after each hop
  // (e.g. to tick the power and send a "10" token into it)
  function hop(row, pt, a, b, o = {}, done) {
    const dir = Math.sign(b - a); let g = a, k = 0;
    if (!dir) { done && done(); return; }
    const ms = reduced() ? 160 : HOP_MS;
    (function step() {
      if (!row.isConnected) return;
      const from = g; g += dir; k++;
      if (o.arcs !== false) {
        const arc = document.createElement('span');
        arc.className = 'arc'; arc.style.setProperty('--g', Math.min(from, g)); arc.dataset.n = k;
        row.appendChild(arc);
      }
      pt.style.setProperty('--g', g);
      pt.classList.remove('hop'); void pt.offsetWidth; pt.classList.add('hop');
      o.onStep && o.onStep(g, from);
      if (g !== b) setTimeout(step, ms); else setTimeout(() => done && done(), ms);
    })();
  }
  // a small "10" (or "10⁻¹") that slides from the hop into (or out of) the power
  function token(row, fromGap, toGap, label) {
    if (reduced()) return;
    const t = document.createElement('span');
    t.className = 'tok'; t.innerHTML = `<span>${label}</span>`; t.style.setProperty('--g', fromGap);
    row.appendChild(t);
    requestAnimationFrame(() => { t.style.setProperty('--g', toGap); t.classList.add('go'); });
    setTimeout(() => t.remove(), 520);
  }
  function gapFromX(row, d, x) {
    const rc = row.getBoundingClientRect(), n = slots(d);
    return Math.max(1, Math.min(n - 1, Math.round((x - rc.left) / (rc.width / n))));
  }
  // moving the point: hover / drag / arrows preview (onPreview), release / Enter commits (onCommit, once)
  function bind(row, d, g0, onPreview, onCommit) {
    row.setAttribute('tabindex', '0'); row.setAttribute('role', 'slider'); row.removeAttribute('aria-hidden');
    row.setAttribute('aria-label', 'Where the point goes');
    const ghost = addPoint(row, 'ghost', g0);
    let g = g0, live = true, down = false;
    const show = x => { g = x; ghost.style.setProperty('--g', g); ghost.classList.add('on'); row.classList.toggle('previewing', g !== g0); onPreview(g); row.setAttribute('aria-valuetext', valueAt(d, g)); };
    const clear = () => { ghost.classList.remove('on'); row.classList.remove('previewing'); onPreview(null); };
    const send = x => { if (!live) return; live = false; ghost.remove(); row.classList.add('answered'); row.removeAttribute('tabindex'); onCommit(x); };
    row.addEventListener('pointerdown', e => { if (!live) return; down = true; try { row.setPointerCapture(e.pointerId); } catch (_) {} show(gapFromX(row, d, e.clientX)); });
    row.addEventListener('pointermove', e => { if (live && (down || e.pointerType === 'mouse')) show(gapFromX(row, d, e.clientX)); });
    row.addEventListener('pointerup', e => { if (!live || !down) return; down = false; send(gapFromX(row, d, e.clientX)); });
    row.addEventListener('pointercancel', () => { down = false; if (live) clear(); });
    row.addEventListener('pointerleave', () => { if (live && !down) clear(); });
    row.addEventListener('keydown', e => {
      if (!live) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); show(Math.max(1, Math.min(slots(d) - 1, g + (e.key === 'ArrowRight' ? 1 : -1)))); }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); send(g); }
    });
    row.setAttribute('aria-valuetext', valueAt(d, g0));
    return { stop: () => { live = false; ghost.remove(); } };
  }

  // a finished picture: the point moved from p to gap T with its arcs, and a power at the end (for keys and feedback)
  function staticHops(d, p, T, e) {
    const a = PAD + p, lo = Math.min(a, T);
    const arcs = Array.from({ length: Math.abs(T - a) }, (_, k) => `<span class="arc" style="--g:${lo + k}"></span>`).join('');
    return rowHTML(d, p, { at: T, also: a }).replace('<span class="pw" hidden></span>',
      `${arcs}<span class="pt run" style="--g:${T}"></span>${e ? `<span class="pw" style="--g:${Math.max(lastShown(d, T), lastShown(d, a)) + 1}"><span>${powHTML(e)}</span></span>` : ''}`)
      .replace('class="pt start"', 'class="pt start dim"');
  }

  // ---- reading what a student typed (no floating point: compare digits and the point's place) ----
  // returns { sig: significant digits, pos: where the point is relative to them } or null if it isn't a number
  function parseDecimal(str) {
    const t = String(str).replace(/[\s,]/g, '').replace(/^\+/, '');
    if (!/^\d*\.?\d*$/.test(t) || !/\d/.test(t)) return null;
    const [i, f = ''] = t.split('.'), all = i + f;
    const lead = all.match(/^0*/)[0].length, sig = all.slice(lead).replace(/0+$/, '');
    if (!sig) return { sig: '0', pos: 1 };
    return { sig, pos: i.length - lead };
  }
  const parseInt10 = str => { const t = String(str).replace(/\s/g, '').replace('−', '-'); return /^-?\d+$/.test(t) ? parseInt(t, 10) : null; };
  // the significant digits and point place of a number {d, p}
  const canon = (d, p) => { const lead = d.match(/^0*/)[0].length; return { sig: d.slice(lead).replace(/0+$/, ''), pos: p - lead }; };

  window.Places = { PAD, paint, trail, fmt, sup, supHTML, powHTML, powText, commas, valueAt, numStr, slots, isFill, rowHTML, setFills, setPower, addPoint, hop, token, gapFromX, bind, staticHops, parseDecimal, parseInt10, canon, reduced };
})();
