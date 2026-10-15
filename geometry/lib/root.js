// Root — exact square roots a√b (simplify roots, distance), and the answer box:
//   [ 3 ]           one box for a whole number (or a decimal: 4.2); the student decides when it's a root —
//   [3]√‾[17]‾      typing "r" (or "√", or "sqrt") opens the radical, cursor in the radicand; "r" first means no
//                   coefficient (√17); backspace in an empty radicand closes it again; a pasted "3√17" is parsed.
// Values: { a, b } meaning a√b, kept as typed (2√18 stays 2√18; compare with eq, tidy with simplify);
//   a whole number n is { a: n, b: 1 }; a decimal typed in the single box is { dec: 4.2 }.
//   split(n) → the biggest square out: split(72) = { a: 6, b: 2 }. of(a, b = 1) → { a, b }.
//   eq(x, y): a²b equal (same sign). simplified(x): nothing more comes out of b. simplify(x). num(x) → a·√b.
//   html(x) → 3√17 with an overline radical (inline in text); text(x) → "3√17", "√5", "4".
// box(name) → HTML; wire(host, { want(name), strict, exact, tenth, onSubmit(vals), say }) → { mark(name, ok) }:
//   Enter or .go checks every box; an unreadable box shakes. vals[name] = { v, raw, simplified, rad }
//   (raw: the text as typed, tidied: "2√18"; rad: the radical was open, so 7√1 isn't "simplified").
//   Not strict: equal to want(name) but unsimplified → "Simplify." (not submitted); strict (G9) grades it.
//   exact: a decimal → "Exact: keep the root." · tenth: anything but a one-decimal number →
//   "To the nearest tenth: one digit after the point." Nudges shake the box and aren't submitted.
// Spec: specs/geometry-next.md (root.js). Styles: root.css.
(function () {
  const split = n => {
    n = Math.round(Math.abs(n));
    if (n === 0) return { a: 0, b: 1 };
    for (let k = Math.floor(Math.sqrt(n)); k > 1; k--) if (n % (k * k) === 0) return { a: k, b: n / (k * k) };
    return { a: 1, b: n };
  };
  const of = (a, b = 1) => ({ a, b });
  const num = x => x.dec != null ? x.dec : x.a * Math.sqrt(x.b);
  const sq = x => Math.sign(x.a) * x.a * x.a * x.b; // a²b with a's sign
  const eq = (x, y) => !!x && !!y && (x.dec != null || y.dec != null ? Math.abs(num(x) - num(y)) < 1e-9 : sq(x) === sq(y));
  const simplified = x => x.dec != null || split(x.b).a === 1;
  const simplify = x => { if (x.dec != null) return x; const s = split(x.b); return s.b === 1 && s.a === 0 ? of(0) : of(x.a * s.a, s.b); };
  const minus = s => String(s).replace('-', '−');
  const text = x => x.dec != null ? minus(x.dec) : x.a === 0 ? '0' : x.b === 1 ? minus(x.a)
    : `${x.a === 1 ? '' : x.a === -1 ? '−' : minus(x.a)}√${x.b}`;
  // the radical sign: a tick stretched to the radicand's height; the radicand's top border is the overline
  const SIGN = '<svg class="rt-s" viewBox="0 0 10 24" preserveAspectRatio="none" aria-hidden="true"><path d="M0.6 14.5 L3 13 L6.2 23.4 L10 0"/></svg>';
  const html = x => {
    if (x.dec != null || x.b === 1 || x.a === 0) return text(x);
    const a = x.a === 1 ? '' : x.a === -1 ? '−' : minus(x.a);
    return `<span class="rt" aria-label="${text(x)}">${a}<span class="rt-r">${SIGN}<span class="rt-b">${x.b}</span></span></span>`;
  };

  // a whole number or decimal typed in a box: "-3", "−3", "3", "2.5"
  const readNum = s => { const t = String(s).trim().replace('−', '-').replace(/\s/g, ''); return /^-?\d+(\.\d+)?$/.test(t) ? parseFloat(t) : null; };
  // "3√17", "3 sqrt(17)", "3r17", "√17", "3*√17" → ['3', '17']; null when there's no root sign
  const RX = /^\s*(.*?)\s*[*·×]?\s*(?:√|sqrt|sqr|r)\s*\(?\s*([^)]*?)\s*\)?\s*$/i;
  const parse = s => { const m = String(s).match(RX); return m ? [m[1], m[2]] : null; };

  const box = name => `<span class="rb" data-n="${name}"><input class="rb-a" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${name}"><span class="rb-r">${SIGN}<span class="rb-o"><input class="rb-b" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${name}: under the root"></span></span></span>`;
  function wire(host, o) {
    const boxes = Array.from(host.querySelectorAll('.rb'));
    const go = host.querySelector('.go'), say = o.say || host.querySelector('.say');
    boxes.forEach(b => {
      const a = b.querySelector('.rb-a'), r = b.querySelector('.rb-b');
      // one box ↔ radical: "r" / "√" opens it (nothing typed yet: no coefficient), backspace in an empty radicand closes it
      const open = rest => {
        b.classList.add('rad'); b.classList.toggle('one', a.value.trim() === '');
        if (rest != null) r.value = rest;
        r.focus(); r.setSelectionRange(r.value.length, r.value.length);
      };
      const close = () => {
        b.classList.remove('rad', 'one'); r.value = '';
        a.focus(); a.setSelectionRange(a.value.length, a.value.length);
      };
      a.addEventListener('keydown', e => {
        if (e.key === 'r' || e.key === 'R' || e.key === '√') {
          e.preventDefault();
          if (!b.classList.contains('rad')) a.value = a.value.replace(/sq$/i, '');
          open();
        }
      });
      // typed on a keyboard that skips keydown, or pasted: split at the root sign
      a.addEventListener('input', () => {
        const p = parse(a.value); if (!p) return;
        a.value = p[0]; open(b.classList.contains('rad') && !p[1] ? null : p[1]);
      });
      // the "t" of "sqrt", brackets, and a second root sign don't belong under the root
      r.addEventListener('input', () => { const t = r.value.replace(/^t/i, '').replace(/[()√r]/gi, ''); if (t !== r.value) r.value = t; });
      r.addEventListener('keydown', e => { if (e.key === 'Backspace' && r.selectionStart === 0 && r.selectionEnd === 0 && r.value === '') { e.preventDefault(); close(); } });
      [a, r].forEach(i => {
        i.addEventListener('input', () => { b.classList.remove('bad'); if (say) say.textContent = ''; });
        i.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
      });
    });
    const read = b => {
      const at = b.querySelector('.rb-a').value.trim(), bt = b.querySelector('.rb-b').value.trim();
      if (!b.classList.contains('rad')) {
        const t = readNum(at); if (t == null) return null;
        const raw = minus(at.replace(/\s/g, ''));
        // "4.0" is still a decimal answer (one digit after the point), but its value is whole
        return /\./.test(at) ? { v: { dec: t }, raw, simplified: true, rad: false, dp: (at.split('.')[1] || '').length }
          : { v: of(t), raw, simplified: true, rad: false };
      }
      const c = at === '' ? 1 : readNum(at), n = readNum(bt);
      if (c == null || n == null || !Number.isInteger(c) || !Number.isInteger(n) || n < 0) return null;
      const v = of(c, n);
      return { v, raw: `${at === '' ? '' : minus(c)}√${n}`, simplified: simplified(v) && n > 1, rad: true };
    };
    const shake = b => { b.classList.remove('bad'); void b.offsetWidth; b.classList.add('bad'); (b.classList.contains('rad') ? b.querySelector('.rb-b') : b.querySelector('.rb-a')).focus(); };
    const nudge = (b, s) => { if (say) say.innerHTML = s; shake(b); };
    function check() {
      const vals = {};
      for (const b of boxes) {
        const r = read(b);
        if (!r) return shake(b);
        if (o.tenth) {
          if (r.dp !== 1) return nudge(b, 'To the nearest tenth: one digit after the point.');
        } else {
          if (o.exact && r.dp) return nudge(b, 'Exact: keep the root.');
          // equal to the answer but more comes out: nudge, don't grade
          const w = o.want && o.want(b.dataset.n);
          if (!o.strict && !r.simplified && (!w || eq(r.v, w))) return nudge(b, 'Simplify.');
        }
        delete r.dp;
        vals[b.dataset.n] = r;
      }
      host.querySelectorAll('.rb input').forEach(x => { x.disabled = true; }); if (go) go.disabled = true;
      o.onSubmit(vals);
    }
    if (go) go.addEventListener('click', check);
    setTimeout(() => { const f = host.querySelector('.rb-a'); f && f.focus({ preventScroll: true }); }, 30);
    return { mark: (name, ok) => { const b = host.querySelector(`.rb[data-n="${name}"]`); b && b.classList.add(ok ? 'ok' : 'no'); } };
  }

  window.Root = { split, of, eq, simplified, simplify, num, text, html, readNum, parse, box, wire };
})();
