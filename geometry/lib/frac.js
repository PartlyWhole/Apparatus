// Frac — exact fractions for slopes (including "undefined"), and the answer box:
//   [ 3 ]        one box for a whole number (or a decimal: 0.5); the student decides when it's a fraction —
//                typing "/" opens a stacked fraction; "?" or "undefined" means undefined:
//   [ top ]      a minus is typed in either box ("-" or "−"); backspace in an empty bottom closes it again;
//   ───────      a 0 on the bottom means undefined (vertical lines: no run), and the word shows under the boxes;
//   [ bottom ]   an equal but unsimplified answer gets a nudge ("Simplify.") instead of being graded.
// Spec: specs/geometry-lines.md. Styles: geo.css.
(function () {
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  // a value: { n, d } with d > 0, in lowest terms; or { undef: true }
  const UNDEF = { undef: true };
  const of = (n, d = 1) => { if (d === 0) return UNDEF; if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); return { n: n / g, d: d / g }; };
  const eq = (a, b) => !!a && !!b && (a.undef || b.undef ? !!a.undef && !!b.undef : a.n === b.n && a.d === b.d);
  const neg = a => a.undef ? a : of(-a.n, a.d);
  const recip = a => a.undef ? of(0) : a.n === 0 ? UNDEF : of(a.d, a.n);
  const perp = a => a.undef ? of(0) : a.n === 0 ? UNDEF : of(-a.d, a.n);
  // arithmetic on finite fractions
  const add = (a, b) => of(a.n * b.d + b.n * a.d, a.d * b.d);
  const sub = (a, b) => add(a, of(-b.n, b.d));
  const mul = (a, b) => of(a.n * b.n, a.d * b.d);
  const div = (a, b) => of(a.n * b.d, a.d * b.n);
  // a decimal or whole number as a fraction: −8.5 → −17/2
  const fromDec = x => { const s = String(x), k = (s.split('.')[1] || '').length, p = Math.pow(10, k); return of(Math.round(x * p), p); };
  const num = a => a.undef ? NaN : a.n / a.d;
  // as text: −1/4, 3, 0, undefined; as HTML: a stacked fraction
  const text = a => a.undef ? 'undefined' : a.d === 1 ? String(a.n).replace('-', '−') : `${a.n < 0 ? '−' : ''}${Math.abs(a.n)}/${a.d}`;
  const html = a => a.undef ? 'undefined' : a.d === 1 ? String(a.n).replace('-', '−')
    : `<span class="frs">${a.n < 0 ? '−' : ''}<span class="fr"><span>${Math.abs(a.n)}</span><span>${a.d}</span></span></span>`;
  // an integer (or decimal, for b) typed in a box: "-3", "−3", "3", "2.5"
  const readNum = s => { const t = String(s).trim().replace('−', '-').replace(/\s/g, ''); return /^-?\d+(\.\d+)?$/.test(t) ? parseFloat(t) : null; };

  // "?" or the word (or its start, "und…") means undefined
  const isUndef = s => /^\s*(\?|und(e(f(i(n(ed?)?)?)?)?)?)\s*$/i.test(s);
  // the stacked boxes: box(name) → HTML; wire(el, { want(name) → value for the simplify nudge, onSubmit(values), say })
  const box = name => `<span class="sf" data-n="${name}"><input class="sf-t" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${name}: top"><span class="sf-bar"></span><input class="sf-b" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${name}: bottom"><span class="sf-u" aria-live="polite"></span></span>`;
  function wire(host, o) {
    const boxes = Array.from(host.querySelectorAll('.sf'));
    const go = host.querySelector('.go'), say = o.say || host.querySelector('.say');
    boxes.forEach(b => {
      // a 0 on the bottom: say "undefined" under the boxes as they type
      const u = b.querySelector('.sf-u'), bot = b.querySelector('.sf-b'), top = b.querySelector('.sf-t');
      const note = () => { const z = (b.classList.contains('frac') && readNum(bot.value) === 0) || isUndef(top.value); u.textContent = z ? 'undefined' : ''; b.classList.toggle('is-undef', z); };
      bot.addEventListener('input', note);
      // whole number ↔ fraction: "/" in the box opens it, backspace in an empty bottom closes it
      top.addEventListener('input', note);
      const frac = on => { b.classList.toggle('frac', on); if (!on) { bot.value = ''; note(); } (on ? bot : top).focus(); };
      top.addEventListener('keydown', e => { if (e.key === '/') { e.preventDefault(); frac(true); } });
      top.addEventListener('input', () => { const k = top.value.indexOf('/'); if (k < 0) return; const rest = top.value.slice(k + 1).replace('/', ''); top.value = top.value.slice(0, k); frac(true); bot.value = rest; note(); });
      bot.addEventListener('keydown', e => { if (e.key === 'Backspace' && bot.value === '') { e.preventDefault(); frac(false); } });
      b.querySelectorAll('input').forEach(i => {
        i.addEventListener('input', () => { b.classList.remove('bad'); if (say) say.textContent = ''; });
        i.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
      });
    });
    const read = b => {
      // "?" or "undefined" in the single box
      if (!b.classList.contains('frac') && isUndef(b.querySelector('.sf-t').value)) return { v: UNDEF, raw: 'undefined', reduced: true };
      const t = readNum(b.querySelector('.sf-t').value), bt = b.classList.contains('frac') ? b.querySelector('.sf-b').value.trim() : '', d = bt === '' ? 1 : readNum(bt);
      // a decimal in the single box: 0.5 = 1/2
      if (t != null && bt === '' && !Number.isInteger(t)) return { v: fromDec(t), raw: { n: t, d: 1 }, reduced: true };
      if (t == null || d == null || !Number.isInteger(t) || !Number.isInteger(d)) return null;
      if (d === 0) return t === 0 ? null : { v: UNDEF, raw: 'undefined', reduced: true };
      return { v: of(t, d), raw: { n: t, d }, reduced: d !== 0 && gcd(t, d) === 1 };
    };
    const shake = b => { b.classList.remove('bad'); void b.offsetWidth; b.classList.add('bad'); b.querySelector('input').focus(); };
    function check() {
      const vals = {};
      for (const b of boxes) {
        const r = read(b);
        if (!r) return shake(b);
        // equal to the answer but not in lowest terms: nudge, don't grade
        const w = o.want && o.want(b.dataset.n);
        if (w && !r.v.undef && eq(r.v, w) && !r.reduced) { if (say) say.innerHTML = 'Simplify.'; return shake(b); }
        vals[b.dataset.n] = r;
      }
      host.querySelectorAll('.sf input').forEach(x => { x.disabled = true; }); if (go) go.disabled = true;
      o.onSubmit(vals);
    }
    if (go) go.addEventListener('click', check);
    setTimeout(() => { const f = host.querySelector('.sf-t'); f && f.focus({ preventScroll: true }); }, 30);
    return { mark: (name, ok) => { const b = host.querySelector(`.sf[data-n="${name}"]`); b && b.classList.add(ok ? 'ok' : 'no'); } };
  }

  window.Frac = { gcd, of, UNDEF, eq, neg, recip, perp, add, sub, mul, div, fromDec, num, text, html, readNum, box, wire };
})();
