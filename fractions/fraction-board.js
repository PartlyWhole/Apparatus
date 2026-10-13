/* Fraction Board: a reusable workspace for a product of fractions.
 *
 *   const board = FractionBoard(containerEl, { onChange, onHint, isOne });
 *   board.load(['3 5 7 / 5 2', '10 / 10']);   // each string is one fraction: "top factors / bottom factors"
 *
 * Factors are written as:  12   2.54   10^3   10^-2   in   m^2
 * What a person can do, and why the value never changes:
 *   - drag a factor along its own side, or into another fraction's same side   (order doesn't matter)
 *   - drop a factor on an equal factor across the bar to cancel them           (a/a = 1)
 *   - drop a factor on a neighbour on the same side to multiply them           (10² · 10³ = 10⁽²⁺³⁾)
 *   - tap a power of ten or a decimal to rewrite it (1000 → 10³, 10⁵ → 10 · 10⁴, 2.54 → 254 · 10⁻²) or to move a power of ten
 *     across the bar; whole numbers are never factored (12 offers nothing)
 *   - tap "= 1" on a fraction whose top equals its bottom to remove it
 * Options: isOne(fraction) lets a host treat other fractions as 1 (e.g. 12 in / 1 ft for unit conversions).
 *   fracClass(fr), fracTag(fr)   extra class / small tag for a fraction (e.g. "draft", "≠ 1")
 *   locked(fr)                   no new factors may be dropped into this fraction
 *   crossMove: false             factors stay inside their own fraction (they can still cancel across)
 *   canCancel(frA, frB)          veto a cancel; cancelHint is shown when vetoed
 *   canRemove(f, fr)             a factor dragged off the board is removed
 *   canEdit(f, fr)               tapping a number (or a blank "#") lets the person type into it
 *   split: false                 no menu for breaking a factor apart
 *   trash: true                  a trash can in the corner; factors dropped on it are removed (if canRemove allows)
 *   canFlip(fr, isOne)           which fractions a tap on the bar may flip (default: those equal to 1)
 *   typeIn: true | fn(fr)        a tap in a row beside its factors (not on one) puts a new number there, typed in place
 * board.dragExternal(spec, pointerEvent, sourceEl) and board.arm(spec, sourceEl) let a host page feed in new factors
 * (drag from a tray, or tap a tray piece then tap a spot on the board).
 * board.idle() resolves once an animated change (a cancel, a "= 1" removal) has landed on the board.
 */
(function () {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SUP = n => String(n).replace('-', '−');
  const wait = ms => new Promise(r => setTimeout(r, reduceMotion ? 0 : ms));
  const zeros = k => '0'.repeat(Math.max(0, k));
  let uid = 0;
  const nid = () => 'fb' + (++uid);

  // ---------- factors ----------
  // { t: 'n', d: digit string, s: decimal places }   { t: 'p', e: exponent }   { t: 'u', u: unit name, k: power }
  function normN(d, s) {
    d = String(d).replace(/^0+(?=\d)/, '');
    while (s > 0 && d.length > 1 && d.endsWith('0')) { d = d.slice(0, -1); s--; }
    if (/^0+$/.test(d)) { d = '0'; s = 0; }
    return { d, s };
  }
  function N(str) {
    const [ip, fp = ''] = String(str).split('.');
    const x = normN((ip || '0') + fp, fp.length);
    return { id: nid(), t: 'n', d: x.d, s: x.s };
  }
  const P = e => ({ id: nid(), t: 'p', e });
  const U = (u, k) => ({ id: nid(), t: 'u', u, k: k == null ? 1 : k });
  function parseFactor(str) {
    str = String(str).trim();
    let m;
    if (str === '#') return { id: nid(), t: 'b' };
    if ((m = /^10\^\(?(-?\d+)\)?$/.exec(str))) return P(parseInt(m[1], 10));
    if (/^\d+(\.\d+)?$|^\.\d+$/.test(str)) return N(str);
    if ((m = /^([A-Za-zµ°Ω]+)(?:\^\(?(-?\d+)\)?)?$/.exec(str))) return U(m[1], m[2] ? parseInt(m[2], 10) : 1);
    return null;
  }
  function parseFraction(str) {
    const [top, bot = ''] = String(str).split('/');
    const list = s => s.split(/[\s·*×]+/).filter(Boolean).map(parseFactor).filter(Boolean);
    return { id: nid(), num: list(top), den: list(bot) };
  }
  function fmtN(f) {
    if (!f.s) return f.d;
    const p = f.d.padStart(f.s + 1, '0');
    return p.slice(0, p.length - f.s) + '.' + p.slice(p.length - f.s);
  }
  function fmtC(f) {
    const [ip, fp] = fmtN(f).split('.');
    const i = ip.length >= 4 ? ip.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ip;
    return fp != null ? i + '.' + fp : i;
  }
  function html(f) {
    if (f.t === 'b') return '#';
    if (f.t === 'n') return fmtC(f);
    if (f.t === 'p') return f.e === 1 ? '10' : `10<sup>${SUP(f.e)}</sup>`;
    return f.k === 1 ? f.u : `${f.u}<sup>${SUP(f.k)}</sup>`;
  }
  function plain(f) {
    if (f.t === 'b') return 'blank number, tap to type';
    if (f.t === 'n') return fmtN(f);
    if (f.t === 'p') return `10 to the ${f.e}`;
    return f.k === 1 ? f.u : `${f.u} to the ${f.k}`;
  }
  // exact value of a number-like factor as [numerator, denominator] BigInts
  function ratio(f) {
    if (f.t === 'n') return [BigInt(f.d), 10n ** BigInt(f.s)];
    if (f.t === 'p') return f.e >= 0 ? [10n ** BigInt(f.e), 1n] : [1n, 10n ** BigInt(-f.e)];
    return [1n, 1n];
  }
  function pow10Of(f) {                       // the exponent if this factor is exactly a power of ten, else null
    if (f.t === 'p') return f.e;
    if (f.t !== 'n') return null;
    if (f.s === 0 && /^10*$/.test(f.d)) return f.d.length - 1;
    if (f.s > 0 && f.d === '1') return -f.s;
    return null;
  }
  function same(a, b) {
    if (a.t === 'b' || b.t === 'b') return false;
    if (a.t === 'u' || b.t === 'u') return a.t === b.t && a.u === b.u && a.k === b.k;
    const [an, ad] = ratio(a), [bn, bd] = ratio(b);
    return an * bd === bn * ad;
  }
  // multiply two factors into one, or null if they don't combine into a single factor
  function product(a, b) {
    if (a.t === 'b' || b.t === 'b') return null;
    if (a.t === 'u' || b.t === 'u') {
      if (!(a.t === 'u' && b.t === 'u' && a.u === b.u)) return null;
      const k = a.k + b.k;
      return { f: k ? U(a.u, k) : N('1'), expr: `${html(a)}·${html(b)}` };
    }
    if (a.t === 'p' || b.t === 'p') {
      const ea = pow10Of(a), eb = pow10Of(b);
      if (ea === null || eb === null) return null;
      return { f: P(ea + eb), expr: `10<sup>(${SUP(ea)}${eb < 0 ? '' : '+'}${SUP(eb)})</sup>` };
    }
    const x = normN((BigInt(a.d) * BigInt(b.d)).toString(), a.s + b.s);
    return { f: { id: nid(), t: 'n', d: x.d, s: x.s }, expr: `${fmtC(a)}·${fmtC(b)}` };
  }
  // ways to split a factor (each returns a list of new factors), shown when it is tapped
  function splits(f, row) {
    const out = [];
    const label = list => list.map(html).join('<span class="fb-dot">·</span>');
    const add = (make, lbl, extra) => { const sample = make(); out.push(Object.assign({ make, label: lbl || label(sample) }, extra || {})); };
    if (f.t === 'n') {
      const k = pow10Of(f);
      if (f.s === 0) {
        const v = BigInt(f.d);
        if (k !== null && k >= 1) {
          add(() => [P(k)]);
          if (k >= 2) add(() => [N('10'), N('1' + zeros(k - 1))]);
        }
      } else {
        // a decimal is a whole number times a power of ten: 2.54 = 254 · 10⁻²
        add(() => [N(f.d), P(-f.s)]);
        if (k !== null) add(() => [P(k)]);
      }
    } else if (f.t === 'p') {
      const e = f.e;
      if (e > 1) add(() => [P(1), P(e - 1)]);
      if (e < -1) add(() => [P(-1), P(e + 1)]);
      if (e >= 3 && e <= 5) add(() => Array.from({ length: e }, () => P(1)));   // (for 10² that's the split above)
      if (e >= 0 && e <= 6) add(() => [N('1' + zeros(e))]);
      if (e < 0 && e >= -6) add(() => [N('0.' + zeros(-e - 1) + '1')]);
      // 10ⁿ on one side is 10⁻ⁿ on the other
      out.push({ flip: true, label: `${row === 'num' ? '↓' : '↑'} 10<sup>${SUP(-e)}</sup>` });
    }
    return out;
  }

  // ---------- the board ----------
  function FractionBoard(root, opts) {
    opts = opts || {};
    root.classList.add('fb');
    if (opts.bareFactors) root.classList.add('fb-bare');
    let state = { fracs: [] };
    let history = [];
    let initial = [];
    let busy = false;
    let gen = 0;                                 // bumped by load(): async work started before it is dropped
    let idleWaiters = [];
    function setBusy(v) {
      busy = v;
      if (!v && idleWaiters.length) { const w = idleWaiters; idleWaiters = []; w.forEach(r => r()); }
    }
    let pend = null;                             // a blank put in only for typing (typeIn): not part of the work until a number is typed
    const strip = (s, id) => { s.fracs.forEach(fr => ['num', 'den'].forEach(r => { fr[r] = fr[r].filter(f => f.id !== id); })); return s; };
    let selected = null;                         // token id
    const listeners = [];
    const hint = t => { if (opts.onHint) opts.onHint(t); };

    const clone = s => JSON.parse(JSON.stringify(s));
    function find(id) {
      for (const fr of state.fracs) for (const row of ['num', 'den']) {
        const i = fr[row].findIndex(f => f.id === id);
        if (i >= 0) return { fr, row, i, f: fr[row][i] };
      }
      return null;
    }
    function isOne(fr) {
      if (opts.isOne) { const r = opts.isOne(fr); if (r != null) return r; }
      if (!fr.num.length || fr.num.length !== fr.den.length) return false;
      const left = fr.den.slice();
      for (const f of fr.num) { const i = left.findIndex(g => same(f, g)); if (i < 0) return false; left.splice(i, 1); }
      return true;
    }

    // ---------- value (shown by the host; it never changes) ----------
    function value() {
      let n = 1n, d = 1n;
      const units = {};
      for (const fr of state.fracs) {
        for (const f of fr.num) { if (f.t === 'u') units[f.u] = (units[f.u] || 0) + f.k; else { const [a, b] = ratio(f); n *= a; d *= b; } }
        for (const f of fr.den) { if (f.t === 'u') units[f.u] = (units[f.u] || 0) - f.k; else { const [a, b] = ratio(f); n *= b; d *= a; } }
      }
      const g = gcd(n, d); n /= g; d /= g;
      return { n, d, units };
    }
    function gcd(a, b) { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a || 1n; }
    function bigHTML(x) {
      const s = x.toString();
      if (/^10{3,}$/.test(s)) return `10<sup>${s.length - 1}</sup>`;
      return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    function valueHTML() {
      const v = value();
      const up = [], down = [];
      Object.keys(v.units).sort().forEach(u => {
        const k = v.units[u];
        if (k > 0) up.push(k === 1 ? u : `${u}<sup>${k}</sup>`);
        if (k < 0) down.push(k === -1 ? u : `${u}<sup>${-k}</sup>`);
      });
      const top = [bigHTML(v.n), ...up.map(u => `<i>${u}</i>`)].join(' ');
      if (v.d === 1n && !down.length) return top;
      const bot = [v.d === 1n ? '' : bigHTML(v.d), ...down.map(u => `<i>${u}</i>`)].filter(Boolean).join(' ') || '1';
      const t = v.d === 1n && up.length === 0 && v.n === 1n ? '1' : top;
      return `<span class="fb-vfrac"><span>${t}</span><span>${bot}</span></span>`;
    }

    // ---------- rendering ----------
    function tokEl(f, row, fid) {
      const el = document.createElement('span');
      el.className = 'fb-tok' + (f.t === 'u' ? ' fb-u' : f.t === 'p' ? ' fb-p' : f.t === 'b' ? ' fb-b' : '');
      el.dataset.id = f.id; el.dataset.row = row; el.dataset.fid = fid;
      el.tabIndex = 0;
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', `${plain(f)}, ${row === 'num' ? 'top' : 'bottom'}`);
      el.innerHTML = html(f);
      return el;
    }
    function rowEl(fr, row) {
      const r = document.createElement('div');
      r.className = 'fb-row fb-' + row;
      r.dataset.row = row; r.dataset.fid = fr.id;
      if (!fr[row].length && !(row === 'den' && opts.bareFactors)) {
        const e = document.createElement('span');
        e.className = 'fb-empty'; e.textContent = '1';
        r.appendChild(e);
      }
      fr[row].forEach((f, i) => {
        if (i) { const d = document.createElement('span'); d.className = 'fb-dot'; d.textContent = '·'; r.appendChild(d); }
        r.appendChild(tokEl(f, row, fr.id));
      });
      return r;
    }
    function render() {
      if (editing) {
        const ed = editing; editing = null; ed.inp.remove();
        if (pend && pend.id === ed.id) { strip(state, pend.id); pend = null; }
      }
      closePop();
      root.innerHTML = '';
      if (!state.fracs.length) {
        const one = document.createElement('span');
        one.className = 'fb-one-alone'; one.textContent = '1';
        root.appendChild(one);
      }
      state.fracs.forEach((fr, i) => {
        if (i) { const t = document.createElement('span'); t.className = 'fb-times'; t.textContent = '·'; root.appendChild(t); }
        const el = document.createElement('div');
        el.className = 'fb-frac';
        el.dataset.fid = fr.id;
        el.appendChild(rowEl(fr, 'num'));
        const hit = document.createElement('div');
        hit.className = 'fb-barhit';
        hit.innerHTML = '<div class="fb-bar"></div>';
        hit.title = 'Flip';
        hit.addEventListener('click', e => { e.stopPropagation(); flipFraction(fr.id); });
        el.appendChild(hit);
        el.appendChild(rowEl(fr, 'den'));
        if (isOne(fr)) {
          el.classList.add('fb-is-one');
          const tag = document.createElement('button');
          tag.type = 'button'; tag.className = 'fb-onetag'; tag.textContent = '= 1';
          tag.setAttribute('aria-label', 'This fraction equals 1. Remove it.');
          tag.addEventListener('click', e => { e.stopPropagation(); removeOne(fr.id); });
          el.appendChild(tag);
        } else if (opts.fracTag) {
          const t = opts.fracTag(fr);
          if (t) { const tag = document.createElement('span'); tag.className = 'fb-drafttag'; tag.textContent = t; el.appendChild(tag); }
        }
        if (opts.fracClass) { const c = opts.fracClass(fr); if (c) c.split(/\s+/).forEach(k => k && el.classList.add(k)); }
        // bare factors: the bar and bottom only appear (as a drop spot) while something is being dragged
        if (opts.bareFactors && !fr.den.length) el.classList.add('fb-noden');
        if (opts.locked && opts.locked(fr)) el.classList.add('fb-locked');
        root.appendChild(el);
      });
      if (opts.trash) {
        const t = document.createElement('div');
        t.className = 'fb-trash';
        t.title = 'Drag here to remove';
        t.setAttribute('aria-hidden', 'true');
        t.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/><path d="M9 7V4h6v3"/></svg>';
        root.appendChild(t);
      }
      const nf = document.createElement('div');
      nf.className = 'fb-newfrac';
      nf.setAttribute('aria-hidden', 'true');
      // an empty fraction, joined by the multiplication dot (dropping here starts a new fraction)
      nf.innerHTML = opts.bareFactors
        ? `${state.fracs.length ? '<span class="fb-times">·</span>' : ''}<span class="fb-ghostfrac"><span class="fb-slot fb-slot-num"></span><span class="fb-ghostbar" style="visibility:hidden"></span></span>`
        : `${state.fracs.length ? '<span class="fb-times">·</span>' : ''}<span class="fb-ghostfrac"><span class="fb-slot fb-slot-num"></span><span class="fb-ghostbar"></span><span class="fb-slot fb-slot-den"></span></span>`;
      root.appendChild(nf);
      if (selected && root.querySelector(`[data-id="${selected}"]`)) select(selected, true); else selected = null;
    }
    // keep everything on one line: shrink the board's font until the product fits its width
    const MIN_FS = 11;
    function fit(withZone) {
      const W = root.clientWidth - 24;
      if (W <= 0) return;
      const items = [...root.children].filter(el => !el.classList.contains('fb-pop') && !el.classList.contains('fb-caret') && !el.classList.contains('fb-edit') && el.getClientRects().length && getComputedStyle(el).position !== 'absolute');
      if (!items.length) return;
      root.style.removeProperty('--fb-fs');
      let fs = parseFloat(getComputedStyle(root).fontSize);
      const width = () => {
        const a = items[0].getBoundingClientRect(), b = items[items.length - 1].getBoundingClientRect();
        let w = b.right - a.left;
        if (withZone && !items.some(i => i.classList.contains('fb-newfrac'))) w += fs * 2.6;
        return w;
      };
      for (let i = 0; i < 5; i++) {
        const w = width();
        if (w <= W) break;
        const next = Math.max(MIN_FS, fs * (W / w) * 0.98);
        if (next >= fs - 0.1) break;
        fs = next;
        root.style.setProperty('--fb-fs', fs.toFixed(2) + 'px');
      }
    }
    if ('ResizeObserver' in window) new ResizeObserver(() => fit(root.classList.contains('fb-on-drag'))).observe(root);
    function rects() {
      const m = {};
      root.querySelectorAll('.fb-tok').forEach(el => { m[el.dataset.id] = el.getBoundingClientRect(); });
      return m;
    }
    // FLIP: every token glides from where it was to where it is now
    function flip(before, spawn) {
      if (reduceMotion) return;
      root.querySelectorAll('.fb-tok').forEach(el => {
        const id = el.dataset.id;
        const b = before[id] || (spawn && spawn[id]);
        if (!b) { el.animate([{ opacity: 0, transform: 'scale(0.6)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'ease-out' }); return; }
        const a = el.getBoundingClientRect();
        const dx = b.left - a.left, dy = b.top - a.top, sx = b.width / a.width, sy = b.height / a.height;
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(sx - 1) < 0.01) return;
        el.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` }, { transform: 'none' }],
          { duration: 460, easing: 'cubic-bezier(.2,.8,.2,1)' });
      });
      root.querySelectorAll('.fb-dot, .fb-times, .fb-empty, .fb-bar').forEach(el => el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 }));
    }
    function commit(next, spawn, before) {
      before = before || rects();
      history.push(pend ? strip(clone(state), pend.id) : clone(state));
      if (pend) { strip(next, pend.id); pend = null; }
      if (history.length > 200) history.shift();
      // a fraction with nothing on either side is 1/1: drop it
      next.fracs = next.fracs.filter(fr => fr.num.length || fr.den.length);
      state = next;
      render();
      fit(false);
      flip(before, spawn);
      emit();
    }
    function emit() { listeners.forEach(fn => fn(api)); if (opts.onChange) opts.onChange(api); }

    // ---------- typing a number in place ----------
    let editing = null;
    function canEdit(id) {
      const loc = find(id);
      return !!(loc && opts.canEdit && (loc.f.t === 'b' || loc.f.t === 'n') && opts.canEdit(loc.f, loc.fr));
    }
    function editToken(id) {
      const el = root.querySelector(`[data-id="${id}"]`);
      const loc = find(id);
      if (!el || !loc) return;
      deselect();
      const inp = document.createElement('input');
      inp.className = 'fb-edit'; inp.type = 'text'; inp.inputMode = 'decimal';
      inp.autocomplete = 'off'; inp.spellcheck = false;
      inp.setAttribute('aria-label', 'Type a number');
      inp.value = loc.f.t === 'n' ? fmtN(loc.f) : '';
      const fit = () => { inp.style.width = Math.max(1, inp.value.length) + 0.3 + 'ch'; };
      fit();
      el.classList.add('fb-editing');
      el.textContent = '';
      el.appendChild(inp);
      editing = { id, inp, el };
      inp.addEventListener('input', () => { inp.value = inp.value.replace(/[^0-9.,]/g, ''); fit(); });
      inp.addEventListener('keydown', e => {
        e.stopPropagation();
        if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); finishEdit(true); }
        else if (e.key === 'Escape') { e.preventDefault(); finishEdit(false); }
      });
      inp.addEventListener('blur', () => finishEdit(true));
      inp.addEventListener('pointerdown', e => e.stopPropagation());
      inp.focus({ preventScroll: true });
      setTimeout(() => { try { inp.select(); } catch (_) {} }, 0);
    }
    function finishEdit(save) {
      if (!editing) return;
      const { id, inp, el } = editing;
      editing = null;
      const v = inp.value.replace(/,/g, '').trim().replace(/\.$/, '');
      const loc = find(id);
      // put the tile back as it was; a change below redraws it anyway
      inp.remove();
      el.classList.remove('fb-editing');
      if (loc) el.innerHTML = html(loc.f);
      if (pend && pend.id === id) {
        // a number typed into a new spot: one step of work if it's a number, otherwise the spot just goes away
        pend = null;
        strip(state, id);
        const ok = save && loc && /^\d*\.?\d+$/.test(v) && /[1-9]/.test(v);
        if (!ok) { if (save && v !== '') hint('Type a number.'); render(); fit(false); return; }
        const n = N(v);
        const next = clone(state);
        const fr = next.fracs.find(x => x.id === loc.fr.id);
        if (!fr) { render(); fit(false); return; }
        fr[loc.row].splice(loc.i, 0, { id, t: 'n', d: n.d, s: n.s });
        commit(next);
        return;
      }
      if (!save || !loc) return;
      let f;
      if (v === '') { if (loc.f.t === 'b') return; f = { id, t: 'b' }; }
      else if (/^\d*\.?\d+$/.test(v)) { const n = N(v); f = { id, t: 'n', d: n.d, s: n.s }; }
      else { hint('Type a number.'); return; }
      if (loc.f.t === f.t && (f.t === 'b' || (loc.f.d === f.d && loc.f.s === f.s))) return;
      const next = clone(state);
      next.fracs.forEach(fr => ['num', 'den'].forEach(r => { fr[r] = fr[r].map(g => g.id === id ? f : g); }));
      commit(next);
      const nel = root.querySelector(`[data-id="${id}"]`);
      if (nel && !reduceMotion) nel.animate([{ transform: 'scale(1.12)' }, { transform: 'none' }], { duration: 220, easing: 'ease-out' });
    }

    // ---------- selection + split menu ----------
    let pop = null;
    let viaKey = false;
    function closePop() { if (pop) { pop.remove(); pop = null; } }
    function deselect() {
      closePop();
      root.querySelectorAll('.fb-sel').forEach(el => el.classList.remove('fb-sel'));
      selected = null;
    }
    function select(id, quiet) {
      deselect();
      const el = root.querySelector(`[data-id="${id}"]`);
      if (!el) return;
      selected = id;
      el.classList.add('fb-sel');
      const loc = find(id);
      const choices = opts.split === false ? [] : splits(loc.f, loc.row);
      if (!choices.length) return;
      pop = document.createElement('div');
      pop.className = 'fb-pop';
      choices.forEach(c => {
        const b = document.createElement('button');
        b.type = 'button'; b.innerHTML = c.label;
        b.addEventListener('pointerdown', e => e.stopPropagation());
        b.addEventListener('click', e => { e.stopPropagation(); c.flip ? flipAcross(id) : splitInto(id, c.make()); });
        pop.appendChild(b);
      });
      root.appendChild(pop);
      const r = el.getBoundingClientRect(), R = root.getBoundingClientRect();
      let x = r.left + r.width / 2 - R.left;
      pop.style.left = x + 'px'; pop.style.top = (r.top - R.top - 8) + 'px';
      // keep the menu inside the board: below the factor if there's no room above, and never past the sides
      if (pop.getBoundingClientRect().top < R.top + 2) { pop.classList.add('fb-below'); pop.style.top = (r.bottom - R.top + 8) + 'px'; }
      const pr = pop.getBoundingClientRect();
      if (pr.left < R.left + 4) pop.style.left = (x + (R.left + 4 - pr.left)) + 'px';
      if (pr.right > R.right - 4) pop.style.left = (x - (pr.right - R.right + 4)) + 'px';
      // from the keyboard, step straight into the menu (a tap leaves focus where it is)
      if (!quiet && viaKey) { const first = pop.querySelector('button'); if (first && document.activeElement === el) first.focus({ preventScroll: true }); }
    }

    // ---------- actions ----------
    function splitInto(id, parts) {
      const before = rects();
      const src = before[id];
      const next = clone(state);
      const loc = (function () { for (const fr of next.fracs) for (const row of ['num', 'den']) { const i = fr[row].findIndex(f => f.id === id); if (i >= 0) return { fr, row, i }; } })();
      loc.fr[loc.row].splice(loc.i, 1, ...parts);
      const spawn = {};
      parts.forEach(p => { spawn[p.id] = src; });
      selected = null;
      commit(next, spawn, before);
    }
    function flipAcross(id) {
      const before = rects();
      const next = clone(state);
      for (const fr of next.fracs) for (const row of ['num', 'den']) {
        const i = fr[row].findIndex(f => f.id === id);
        if (i >= 0) {
          const [f] = fr[row].splice(i, 1);
          f.e = -f.e;
          fr[row === 'num' ? 'den' : 'num'].push(f);
          selected = null;
          commit(next, null, before);
          return;
        }
      }
    }
    async function cancel(aId, bId) {
      if (busy) return;
      setBusy(true);
      const g = gen;
      deselect();
      const els = [aId, bId].map(id => root.querySelector(`[data-id="${id}"]`));
      els.forEach(el => el.classList.add('fb-x'));
      await wait(380);
      if (g !== gen) return;
      els.forEach(el => { el.classList.remove('fb-x'); el.classList.add('fb-asone'); el.textContent = '1'; });
      if (!reduceMotion) els.forEach(el => el.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 220 }));
      await wait(520);
      if (g !== gen) return;
      if (!reduceMotion) await Promise.all(els.map(el => el.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.3)' }], { duration: 260, fill: 'forwards' }).finished.catch(() => {})));
      if (g !== gen) return;
      const before = rects();
      const next = clone(state);
      next.fracs.forEach(fr => ['num', 'den'].forEach(row => { fr[row] = fr[row].filter(f => f.id !== aId && f.id !== bId); }));
      setBusy(false);
      commit(next, null, before);
    }
    async function merge(dragId, targetId, ghostRect) {
      const a = find(dragId).f, b = find(targetId).f;
      const p = product(b, a);
      if (!p) return false;
      deselect();
      const target = root.querySelector(`[data-id="${targetId}"]`);
      const before = rects();
      if (ghostRect) before[dragId] = ghostRect;
      const next = clone(state);
      next.fracs.forEach(fr => ['num', 'den'].forEach(row => {
        fr[row] = fr[row].filter(f => f.id !== dragId).map(f => f.id === targetId ? Object.assign(p.f, { id: targetId }) : f);
      }));
      commit(next, null, before);
      // show the multiplication for a moment, then its result
      const el = root.querySelector(`[data-id="${targetId}"]`);
      if (el && !reduceMotion) {
        setBusy(true);
        const g = gen;
        const final = el.innerHTML;
        el.innerHTML = p.expr;
        await wait(800);
        if (g !== gen) return true;
        await el.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(0.1)' }], { duration: 140, easing: 'ease-in' }).finished.catch(() => {});
        if (g !== gen) return true;
        el.innerHTML = final;
        await el.animate([{ transform: 'scaleY(0.1)' }, { transform: 'scaleY(1)' }], { duration: 160, easing: 'ease-out' }).finished.catch(() => {});
        if (g !== gen) return true;
        setBusy(false);
      }
      return true;
    }
    function moveTo(id, fid, row, index, ghostRect) {
      const before = rects();
      if (ghostRect) before[id] = ghostRect;
      const next = clone(state);
      let moving = null, fromFid = null, fromRow = null, fromI = -1;
      next.fracs.forEach(fr => ['num', 'den'].forEach(r => {
        const i = fr[r].findIndex(f => f.id === id);
        if (i >= 0) { moving = fr[r][i]; fromFid = fr.id; fromRow = r; fromI = i; fr[r].splice(i, 1); }
      }));
      let target;
      if (fid === '__new') {
        target = { id: nid(), num: [], den: [] };
        next.fracs.push(target);
      } else target = next.fracs.find(fr => fr.id === fid);
      if (fromFid === fid && fromRow === row && fromI < index) index--;
      target[row].splice(Math.max(0, Math.min(index, target[row].length)), 0, moving);
      commit(next, null, before);
    }
    async function removeOne(fid) {
      if (busy) return;
      setBusy(true);
      const g = gen;
      deselect();
      const el = root.querySelector(`.fb-frac[data-fid="${fid}"]`);
      if (el && !reduceMotion) {
        await el.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.5)' }], { duration: 380, easing: 'ease-in', fill: 'forwards' }).finished.catch(() => {});
      }
      if (g !== gen) return;
      const before = rects();
      const next = clone(state);
      next.fracs = next.fracs.filter(fr => fr.id !== fid);
      setBusy(false);
      commit(next, null, before);
    }
    function canFlip(fr) { return opts.canFlip ? opts.canFlip(fr, isOne(fr)) : isOne(fr); }
    function flipFraction(fid) {
      if (busy) return;
      const fr = state.fracs.find(x => x.id === fid);
      if (!fr) return;
      if (!canFlip(fr)) {
        shake(root.querySelector(`.fb-frac[data-fid="${fid}"]`));
        hint('Only a fraction equal to 1 can be flipped. Flipping anything else changes its value.');
        return;
      }
      deselect();
      const next = clone(state);
      const f2 = next.fracs.find(x => x.id === fid);
      [f2.num, f2.den] = [f2.den, f2.num];
      commit(next);
    }
    function combine() {
      if (state.fracs.length < 2 || busy) return;
      deselect();
      const next = clone(state);
      const one = { id: next.fracs[0].id, num: [], den: [] };
      next.fracs.forEach(fr => { one.num.push(...fr.num); one.den.push(...fr.den); });
      next.fracs = [one];
      commit(next);
    }
    function allowCancel(aId, bId) {
      if (!opts.canCancel) return true;
      const A = find(aId), B = find(bId);
      return !A || !B || opts.canCancel(A.fr, B.fr);
    }
    function shake(...els) {
      els.filter(Boolean).forEach(el => { el.classList.remove('fb-shake'); void el.offsetWidth; el.classList.add('fb-shake'); });
    }

    // ---------- pointer: tap to select / split / cancel, drag to move, cancel, multiply ----------
    let drag = null;
    let caret = null;
    function clearTargets() {
      root.querySelectorAll('.fb-t-cancel, .fb-t-merge, .fb-t-bad').forEach(el => el.classList.remove('fb-t-cancel', 'fb-t-merge', 'fb-t-bad'));
      root.querySelectorAll('.fb-hot').forEach(el => el.classList.remove('fb-hot'));
      if (caret) { caret.remove(); caret = null; }
    }
    function showCaret(rowEl, index, skipId) {
      const toks = [...rowEl.querySelectorAll('.fb-tok')].filter(t => t.dataset.id !== skipId);
      const R = root.getBoundingClientRect(), rr = rowEl.getBoundingClientRect();
      let x;
      if (!toks.length) x = rr.left + rr.width / 2;
      else if (index >= toks.length) x = toks[toks.length - 1].getBoundingClientRect().right + 3;
      else x = toks[index].getBoundingClientRect().left - 3;
      caret = document.createElement('div');
      caret.className = 'fb-caret';
      caret.style.left = (x - R.left - 1.5) + 'px';
      caret.style.top = (rr.top - R.top + 8) + 'px';
      caret.style.height = (rr.height - 16) + 'px';
      root.appendChild(caret);
    }
    // what would happen if the drag ended at (x, y)
    function targetAt(x, y) {
      const hit = document.elementFromPoint(x, y);
      if (opts.trash && hit && hit.closest && hit.closest('.fb-trash')) return { kind: 'trash', el: hit.closest('.fb-trash') };
      const t = rawTargetAt(x, y);
      if (t && opts.crossMove === false) {
        if (t.kind === 'new' || ((t.kind === 'move' || t.kind === 'merge') && (t.fid || (t.el && t.el.dataset.fid)) !== drag.fid)) return { kind: 'nomove' };
      }
      return t;
    }
    function rawTargetAt(x, y) {
      const el = document.elementFromPoint(x, y);
      if (!el || !root.contains(el)) return null;
      const tok = el.closest('.fb-tok');
      if (tok && tok.dataset.id !== drag.id) {
        const sameSide = tok.dataset.row === drag.row;
        if (!sameSide) return { kind: 'cancel', el: tok, ok: same(find(drag.id).f, find(tok.dataset.id).f) };
        const r = tok.getBoundingClientRect(), rel = (x - r.left) / r.width;
        if (rel > 0.28 && rel < 0.72) return { kind: 'merge', el: tok, ok: !!product(find(tok.dataset.id).f, find(drag.id).f) };
        const rowEl = tok.closest('.fb-row');
        const toks = [...rowEl.querySelectorAll('.fb-tok')].filter(t => t.dataset.id !== drag.id);
        let index = toks.indexOf(tok) + (rel >= 0.5 ? 1 : 0);
        return { kind: 'move', rowEl, fid: rowEl.dataset.fid, row: rowEl.dataset.row, index };
      }
      if (el.closest('.fb-newfrac')) return { kind: 'new', el: el.closest('.fb-newfrac') };
      const rowEl = el.closest('.fb-row') || (el.closest('.fb-frac') && (y < el.closest('.fb-frac').querySelector('.fb-bar').getBoundingClientRect().top ? el.closest('.fb-frac').querySelector('.fb-num') : el.closest('.fb-frac').querySelector('.fb-den')));
      if (rowEl) {
        if (rowEl.dataset.row !== drag.row) return { kind: 'wrongside', el: rowEl };
        const toks = [...rowEl.querySelectorAll('.fb-tok')].filter(t => t.dataset.id !== drag.id);
        let index = toks.findIndex(t => { const r = t.getBoundingClientRect(); return x < r.left + r.width / 2; });
        if (index < 0) index = toks.length;
        return { kind: 'move', rowEl, fid: rowEl.dataset.fid, row: rowEl.dataset.row, index };
      }
      return null;
    }
    function startDrag(e, tok) {
      const r = tok.getBoundingClientRect();
      drag.started = true;
      drag.offX = e.clientX - r.left; drag.offY = e.clientY - r.top;
      drag.ghost = tok.cloneNode(true);
      drag.ghost.classList.add('fb-ghost');
      drag.ghost.classList.remove('fb-sel');
      drag.ghost.style.width = r.width + 'px';
      drag.ghost.style.transform = `translate(${r.left}px, ${r.top}px)`;
      drag.ghost.style.fontSize = getComputedStyle(tok).fontSize;
      document.body.appendChild(drag.ghost);
      tok.classList.add('fb-dragging');
      root.classList.add('fb-on-drag');
      fit(true);
      deselect();
    }
    root.addEventListener('pointerdown', e => {
      tiDown = null;
      if (busy) return;
      let tok = e.target.closest('.fb-tok');
      if (!tok) {
        // a tap on empty space beside a row may start typing a new number there (on click), unless it is closing something
        if (opts.typeIn && !selected && !pop && e.isPrimary && (e.pointerType !== 'mouse' || e.button === 0)) tiDown = { x: e.clientX, y: e.clientY };
        if (!e.target.closest('.fb-pop')) deselect();
        return;
      }
      if (editing) {
        // finish the number being typed first; the board redraws, so find the factor again
        const id = tok.dataset.id;
        finishEdit(true);
        tok = root.querySelector(`.fb-tok[data-id="${id}"]`);
        if (!tok || busy) return;
      }
      e.preventDefault();
      tok.focus({ preventScroll: true });
      drag = { id: tok.dataset.id, row: tok.dataset.row, fid: tok.dataset.fid, x0: e.clientX, y0: e.clientY, started: false, tok, pid: e.pointerId };
      try { root.setPointerCapture(e.pointerId); } catch (_) {}
    });
    root.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.pid) return;
      if (!drag.started) {
        if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
        startDrag(e, drag.tok);
      }
      drag.ghost.style.transform = `translate(${e.clientX - drag.offX}px, ${e.clientY - drag.offY}px)`;
      clearTargets();
      const t = targetAt(e.clientX, e.clientY);
      drag.target = t;
      if (!t) return;
      if (t.kind === 'cancel') t.el.classList.add(t.ok ? 'fb-t-cancel' : 'fb-t-bad');
      else if (t.kind === 'merge') t.el.classList.add(t.ok ? 'fb-t-merge' : 'fb-t-bad');
      else if (t.kind === 'move') showCaret(t.rowEl, t.index, drag.id);
      else if (t.kind === 'trash') t.el.classList.add('fb-hot');
      else if (t.kind === 'new') {
        t.el.classList.add('fb-hot');
        const slot = t.el.querySelector(drag.row === 'num' ? '.fb-slot-num' : '.fb-slot-den');
        if (slot) slot.classList.add('fb-hot');
      }
    });
    async function endDrag(e) {
      if (!drag || e.pointerId !== drag.pid) return;
      const d = drag; drag = null;
      const g = gen;
      try { root.releasePointerCapture(e.pointerId); } catch (_) {}
      if (!d.started) { tap(d.id); return; }
      clearTargets();
      root.classList.remove('fb-on-drag');
      fit(false);
      const ghostRect = d.ghost.getBoundingClientRect();
      const t = e.type === 'pointercancel' ? null : d.target;
      const putBack = async () => {
        const home = d.tok.getBoundingClientRect();
        if (!reduceMotion) await d.ghost.animate([{ transform: d.ghost.style.transform }, { transform: `translate(${home.left}px, ${home.top}px)` }], { duration: 260, easing: 'ease-out' }).finished.catch(() => {});
        d.ghost.remove();
        d.tok.classList.remove('fb-dragging');
      };
      if (!t) {
        const R = root.getBoundingClientRect();
        const outside = e.clientX < R.left || e.clientX > R.right || e.clientY < R.top || e.clientY > R.bottom;
        const loc = find(d.id);
        if (outside && loc && opts.canRemove && opts.canRemove(loc.f, loc.fr)) {
          if (!reduceMotion) await d.ghost.animate([{ opacity: 1 }, { opacity: 0, transform: d.ghost.style.transform + ' scale(0.6)' }], { duration: 220, fill: 'forwards' }).finished.catch(() => {});
          d.ghost.remove();
          if (g !== gen) return;
          const next = clone(state);
          next.fracs.forEach(fr => ['num', 'den'].forEach(r => { fr[r] = fr[r].filter(f => f.id !== d.id); }));
          commit(next);
          return;
        }
        await putBack();
        return;
      }
      if (t.kind === 'cancel') {
        if (t.ok && !allowCancel(d.id, t.el.dataset.id)) { await putBack(); shake(t.el, d.tok); hint(opts.cancelHint || 'That can\'t cancel yet.'); return; }
        if (t.ok) { d.ghost.remove(); d.tok.classList.remove('fb-dragging'); cancel(d.id, t.el.dataset.id); }
        else { await putBack(); shake(t.el, d.tok); hint('Only equal factors cancel.'); }
        return;
      }
      if (t.kind === 'merge') {
        if (t.ok) { d.ghost.remove(); await merge(d.id, t.el.dataset.id, ghostRect); }
        else { await putBack(); shake(t.el, d.tok); hint('These two don\'t combine into one factor.'); }
        return;
      }
      if (t.kind === 'wrongside') { await putBack(); shake(d.tok); hint('Keep top factors on top and bottom factors on the bottom.'); return; }
      if (t.kind === 'nomove') { await putBack(); shake(d.tok); hint(opts.crossMoveHint || 'Keep each factor in its own fraction.'); return; }
      if (t.kind === 'trash') {
        const loc = find(d.id);
        if (!loc || !opts.canRemove || !opts.canRemove(loc.f, loc.fr)) { await putBack(); shake(d.tok, t.el); hint(opts.removeHint || 'That one stays.'); return; }
        const tr = t.el.getBoundingClientRect();
        if (!reduceMotion) await d.ghost.animate([
          { transform: d.ghost.style.transform, opacity: 1 },
          { transform: `translate(${tr.left + tr.width / 2 - ghostRect.width * 0.15}px, ${tr.top + tr.height / 2 - ghostRect.height * 0.15}px) scale(0.3)`, opacity: 0 }
        ], { duration: 260, easing: 'ease-in', fill: 'forwards' }).finished.catch(() => {});
        d.ghost.remove();
        if (g !== gen) return;
        const next = clone(state);
        next.fracs.forEach(fr => ['num', 'den'].forEach(r => { fr[r] = fr[r].filter(f => f.id !== d.id); }));
        commit(next);
        return;
      }
      d.ghost.remove();
      if (t.kind === 'new') { moveTo(d.id, '__new', d.row, 0, ghostRect); return; }
      moveTo(d.id, t.fid, t.row, t.index, ghostRect);
    }
    root.addEventListener('pointerup', endDrag);
    root.addEventListener('pointercancel', endDrag);

    // where a new factor would land at (x, y): any side of any unlocked fraction, or a new fraction
    function insertTargetAt(x, y) {
      const el = document.elementFromPoint(x, y);
      if (!el || !root.contains(el)) return null;
      if (el.closest('.fb-trash')) return { kind: 'trash', el: el.closest('.fb-trash') };
      const nf = el.closest('.fb-newfrac');
      if (nf) {
        const bar = nf.querySelector('.fb-ghostbar').getBoundingClientRect();
        return { kind: 'new', el: nf, row: opts.bareFactors || y < bar.top + bar.height / 2 ? 'num' : 'den' };
      }
      const fracEl = el.closest('.fb-frac');
      if (!fracEl) {
        // anywhere else on the board starts a new fraction; above the middle line it goes on top
        const zone = root.querySelector('.fb-newfrac');
        if (!zone) return null;
        const bar = zone.querySelector('.fb-ghostbar').getBoundingClientRect();
        return { kind: 'new', el: zone, row: opts.bareFactors || y < bar.top + bar.height / 2 ? 'num' : 'den' };
      }
      const fr = state.fracs.find(f => f.id === fracEl.dataset.fid);
      if (opts.locked && fr && opts.locked(fr)) return { kind: 'locked', el: fracEl };
      let rowEl = el.closest('.fb-row');
      if (!rowEl) rowEl = y < fracEl.querySelector('.fb-bar').getBoundingClientRect().top ? fracEl.querySelector('.fb-num') : fracEl.querySelector('.fb-den');
      const toks = [...rowEl.querySelectorAll('.fb-tok')];
      let index = toks.findIndex(t => { const r = t.getBoundingClientRect(); return x < r.left + r.width / 2; });
      if (index < 0) index = toks.length;
      return { kind: 'insert', rowEl, fid: rowEl.dataset.fid, row: rowEl.dataset.row, index };
    }
    function showInsert(t) {
      if (!t) return;
      if (t.kind === 'trash') { t.el.classList.add('fb-hot'); return; }
      if (t.kind === 'insert') showCaret(t.rowEl, t.index, null);
      else if (t.kind === 'new') {
        t.el.classList.add('fb-hot');
        const slot = t.el.querySelector(t.row === 'num' ? '.fb-slot-num' : '.fb-slot-den');
        if (slot) slot.classList.add('fb-hot');
      }
    }
    function insertFactor(f, t, fromRect) {
      const next = clone(state);
      if (t.kind === 'new') next.fracs.push({ id: nid(), num: t.row === 'num' ? [f] : [], den: t.row === 'den' ? [f] : [] });
      else {
        const fr = next.fracs.find(x => x.id === t.fid);
        if (!fr) return;
        fr[t.row].splice(t.index, 0, f);
      }
      const spawn = {};
      if (fromRect) spawn[f.id] = fromRect;
      commit(next, spawn);
      // a blank number asks to be typed in right away
      if (f.t === 'b' && canEdit(f.id)) editToken(f.id);
    }
    function externalDrag(spec, e, sourceEl, cb) {
      if (busy || !parseFactor(spec)) return;
      cb = cb || {};
      const f0 = parseFactor(spec);
      const ghost = document.createElement('span');
      ghost.className = 'fb-tok fb-ghost' + (f0.t === 'u' ? ' fb-u' : f0.t === 'b' ? ' fb-b' : '');
      ghost.innerHTML = html(f0);
      ghost.style.opacity = '0';
      ghost.style.fontSize = getComputedStyle(root).fontSize;
      document.body.appendChild(ghost);
      const g = ghost.getBoundingClientRect();
      const src = sourceEl ? sourceEl.getBoundingClientRect() : null;
      // keep the spot that was grabbed under the pointer
      const offX = src ? Math.min(g.width - 6, Math.max(6, e.clientX - src.left)) : g.width / 2;
      const offY = src ? Math.min(g.height - 6, Math.max(6, e.clientY - src.top)) : g.height / 2;
      const pos = (x, y) => { ghost.style.transform = `translate(${x - offX}px, ${y - offY}px)`; };
      pos(e.clientX, e.clientY);
      let moved = false;
      let target = null;
      const move = ev => {
        if (ev.pointerId !== e.pointerId) return;
        ev.preventDefault();
        if (!moved) {
          if (Math.hypot(ev.clientX - e.clientX, ev.clientY - e.clientY) < 5) return;
          moved = true;
          disarm();
          ghost.style.opacity = '';
          if (sourceEl) sourceEl.classList.add('fb-lifted');
          root.classList.add('fb-on-drag');
          fit(true);
        }
        pos(ev.clientX, ev.clientY);
        clearTargets();
        root.querySelectorAll('.fb-frac-bad').forEach(x => x.classList.remove('fb-frac-bad'));
        target = insertTargetAt(ev.clientX, ev.clientY);
        if (target && target.kind === 'locked') target.el.classList.add('fb-frac-bad');
        else showInsert(target);
      };
      const up = async ev => {
        if (ev.pointerId !== e.pointerId) return;
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        document.removeEventListener('pointercancel', up);
        if (sourceEl) sourceEl.classList.remove('fb-lifted');
        if (!moved) { ghost.remove(); if (ev.type !== 'pointercancel' && cb.onTap) cb.onTap(); return; }
        clearTargets();
        root.querySelectorAll('.fb-frac-bad').forEach(x => x.classList.remove('fb-frac-bad'));
        root.classList.remove('fb-on-drag');
        fit(false);
        const gr = ghost.getBoundingClientRect();
        if (ev.type === 'pointercancel' || !target || target.kind === 'locked' || target.kind === 'trash') {
          if (target && target.kind === 'locked') { shake(target.el); hint(opts.lockedHint || 'That fraction is finished.'); }
          if (!reduceMotion) await ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' }).finished.catch(() => {});
          ghost.remove();
          return;
        }
        ghost.remove();
        insertFactor(f0, target, gr);
      };
      document.addEventListener('pointermove', move, { passive: false });
      document.addEventListener('pointerup', up);
      document.addEventListener('pointercancel', up);
    }
    // tap a tray piece, then tap a spot on the board
    let armed = null;
    function arm(spec, sourceEl) {
      if (!parseFactor(spec)) return;
      deselect();
      armed = { spec, sourceEl };
      root.classList.add('fb-on-drag', 'fb-armed');
      fit(true);
    }
    function disarm() {
      if (!armed) return;
      armed = null;
      root.classList.remove('fb-on-drag', 'fb-armed');
      fit(false);
      clearTargets();
      if (opts.onDisarm) opts.onDisarm();
    }
    root.addEventListener('pointerdown', e => {
      if (!armed) return;
      tiDown = null;
      e.preventDefault();
      e.stopImmediatePropagation();
      const t = insertTargetAt(e.clientX, e.clientY);
      const a = armed;
      disarm();
      if (!t || t.kind === 'trash') return;
      if (t.kind === 'locked') { shake(t.el); hint(opts.lockedHint || 'That fraction is finished.'); return; }
      insertFactor(parseFactor(a.spec), t, a.sourceEl ? a.sourceEl.getBoundingClientRect() : null);
    }, true);
    root.addEventListener('pointermove', e => {
      if (!armed || e.pointerType !== 'mouse') return;
      clearTargets();
      showInsert(insertTargetAt(e.clientX, e.clientY));
    });

    // ---------- typeIn: tap beside the factors in a row to type a new number there ----------
    let tiDown = null;
    const typeInOn = fr => !!opts.typeIn && (typeof opts.typeIn !== 'function' || !!opts.typeIn(fr)) && !(opts.locked && opts.locked(fr));
    function typeInAt(x, y) {
      let best = null, bd = Infinity;
      root.querySelectorAll('.fb-frac').forEach(el => {
        const fr = state.fracs.find(f => f.id === el.dataset.fid);
        if (!fr || !typeInOn(fr)) return;
        const r = el.getBoundingClientRect();
        const dx = x < r.left ? r.left - x : x > r.right ? x - r.right : 0;
        const dy = y < r.top ? r.top - y : y > r.bottom ? y - r.bottom : 0;
        if (dy > 24 || dx > 56) return;                 // close beside a fraction (in px, a finger's reach)
        if (dx < bd) { bd = dx; best = el; }
      });
      if (!best) return null;
      const den = best.querySelector(':scope > .fb-den');
      const bar = best.querySelector('.fb-bar').getBoundingClientRect();
      const row = den && den.getClientRects().length && y >= bar.top + bar.height / 2 ? 'den' : 'num';
      const rowEl = best.querySelector(':scope > .fb-' + row);
      const toks = [...rowEl.querySelectorAll('.fb-tok')];
      let index = toks.findIndex(t => { const r = t.getBoundingClientRect(); return x < r.left + r.width / 2; });
      if (index < 0) index = toks.length;
      return { fid: best.dataset.fid, row, index, rowEl };
    }
    function startTypeIn(t) {
      const fr = state.fracs.find(x => x.id === t.fid);
      if (!fr) return;
      deselect();
      clearTargets();
      root.classList.remove('fb-typein-hot');
      const f = { id: nid(), t: 'b' };
      fr[t.row].splice(Math.min(t.index, fr[t.row].length), 0, f);
      pend = { id: f.id };
      render();
      fit(false);
      editToken(f.id);
    }
    root.addEventListener('click', e => {
      const d = tiDown; tiDown = null;
      if (!d || busy || armed || drag || !opts.typeIn) return;
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 10) return;
      if (e.target.closest('.fb-tok, .fb-barhit, .fb-onetag, .fb-pop, .fb-trash')) return;
      if (editing) finishEdit(true);            // (a tap doesn't always blur the number being typed)
      if (busy) return;
      const t = typeInAt(e.clientX, e.clientY);
      if (t) startTypeIn(t);
    });
    // with a mouse, a faint caret shows where a click would type
    root.addEventListener('pointermove', e => {
      if (!opts.typeIn || e.pointerType !== 'mouse' || drag || armed || busy || editing) return;
      clearTargets();
      const over = e.target.closest && e.target.closest('.fb-tok, .fb-barhit, .fb-onetag, .fb-pop, .fb-trash');
      const t = over ? null : typeInAt(e.clientX, e.clientY);
      root.classList.toggle('fb-typein-hot', !!t);
      if (t) { showCaret(t.rowEl, t.index, null); caret.classList.add('fb-caret-soft'); }
    });
    root.addEventListener('pointerleave', () => {
      if (!opts.typeIn || drag || armed) return;
      root.classList.remove('fb-typein-hot');
      if (caret && caret.classList.contains('fb-caret-soft')) clearTargets();
    });

    function tap(id) {
      if (busy) return;
      if (!selected && canEdit(id)) { editToken(id); return; }
      if (selected === id) { deselect(); return; }
      if (selected) {
        const a = find(selected), b = find(id);
        if (a && b && a.row !== b.row) {
          if (same(a.f, b.f) && !allowCancel(a.f.id, b.f.id)) {
            shake(root.querySelector(`[data-id="${a.f.id}"]`), root.querySelector(`[data-id="${b.f.id}"]`));
            hint(opts.cancelHint || 'That can\'t cancel yet.');
            deselect();
            return;
          }
          if (same(a.f, b.f)) { cancel(a.f.id, b.f.id); return; }
          shake(root.querySelector(`[data-id="${a.f.id}"]`), root.querySelector(`[data-id="${b.f.id}"]`));
          hint('Only equal factors cancel.');
          deselect();
          return;
        }
      }
      select(id);
    }
    root.addEventListener('keydown', e => {
      const tok = e.target.closest && e.target.closest('.fb-tok');
      if (tok && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); viaKey = true; try { tap(tok.dataset.id); } finally { viaKey = false; } }
      if (e.key === 'Escape') {
        // leaving the menu puts focus back on its factor
        const back = pop && pop.contains(e.target) && selected && root.querySelector(`[data-id="${selected}"]`);
        deselect(); disarm();
        if (back) back.focus({ preventScroll: true });
      }
    });
    document.addEventListener('pointerdown', e => { if (!root.contains(e.target)) deselect(); });

    // ---------- public ----------
    const api = {
      load(spec) {
        gen++;
        setBusy(false);
        pend = null;
        initial = spec.slice();
        history = [];
        selected = null;
        state = { fracs: spec.map(parseFraction) };
        render();
        fit(false);
        if (!reduceMotion) root.querySelectorAll('.fb-tok').forEach((el, i) => el.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 360, delay: i * 40, easing: 'ease-out', fill: 'backwards' }));
        emit();
      },
      reset() { api.load(initial); },
      undo() {
        if (!history.length || busy) return;
        const before = rects();
        state = history.pop();
        render();
        fit(false);
        flip(before);
        emit();
      },
      canUndo: () => history.length > 0,
      combine,
      fractionCount: () => state.fracs.length,
      add(str, row, fid) {
        const f = parseFactor(str);
        if (!f) return false;
        const next = clone(state);
        let fr = fid ? next.fracs.find(x => x.id === fid) : next.fracs[next.fracs.length - 1];
        if (!fr) { fr = { id: nid(), num: [], den: [] }; next.fracs.push(fr); }
        fr[row === 'den' ? 'den' : 'num'].push(f);
        commit(next);
        return true;
      },
      addFraction(str, fromEl) {
        const next = clone(state);
        const fr = parseFraction(str || '');
        next.fracs.push(fr);
        let spawn = null;
        if (fromEl) {
          const r = fromEl.getBoundingClientRect();
          spawn = {};
          [...fr.num, ...fr.den].forEach(f => { spawn[f.id] = r; });
        }
        commit(next, spawn);
        return fr.id;
      },
      flip: flipFraction,
      dragExternal: externalDrag,
      arm, disarm,
      isOne,
      value, valueHTML,
      get state() { return pend ? strip(clone(state), pend.id) : clone(state); },
      idle: () => busy ? new Promise(r => idleWaiters.push(r)) : Promise.resolve(),
      on(fn) { listeners.push(fn); }
    };
    return api;
  }
  FractionBoard.parseFactor = parseFactor;
  FractionBoard.internals = { product, splits, same, parseFraction, pow10Of };
  FractionBoard.html = html;
  window.FractionBoard = FractionBoard;
})();
