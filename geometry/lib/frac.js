// Frac — exact fractions for slopes (including "undefined"), and the stacked answer boxes:
//   [ top ]      a minus is typed in either box ("-" or "−"); an empty bottom means 1;
//   ───────      "undefined" is a chip under the boxes (vertical lines);
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
  const num = a => a.undef ? NaN : a.n / a.d;
  // as text: −1/4, 3, 0, undefined; as HTML: a stacked fraction
  const text = a => a.undef ? 'undefined' : a.d === 1 ? String(a.n).replace('-', '−') : `${a.n < 0 ? '−' : ''}${Math.abs(a.n)}/${a.d}`;
  const html = a => a.undef ? 'undefined' : a.d === 1 ? String(a.n).replace('-', '−')
    : `<span class="frs">${a.n < 0 ? '−' : ''}<span class="fr"><span>${Math.abs(a.n)}</span><span>${a.d}</span></span></span>`;
  // an integer (or decimal, for b) typed in a box: "-3", "−3", "3", "2.5"
  const readNum = s => { const t = String(s).trim().replace('−', '-').replace(/\s/g, ''); return /^-?\d+(\.\d+)?$/.test(t) ? parseFloat(t) : null; };

  // the stacked boxes: box(name) → HTML; wire(el, { want(name) → value for the simplify nudge, onSubmit(values), undef: offer the chip })
  const box = (name, o = {}) => `<span class="sf" data-n="${name}"><input class="sf-t" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${name}: top"><span class="sf-bar"></span><input class="sf-b" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${name}: bottom">${o.undef ? `<button type="button" class="sf-u" aria-pressed="false">undefined</button>` : ''}</span>`;
  function wire(host, o) {
    const boxes = Array.from(host.querySelectorAll('.sf'));
    const go = host.querySelector('.go'), say = host.querySelector('.say');
    boxes.forEach(b => {
      const u = b.querySelector('.sf-u');
      if (u) u.addEventListener('click', () => { const on = u.getAttribute('aria-pressed') !== 'true'; u.setAttribute('aria-pressed', String(on)); b.classList.toggle('is-undef', on); if (!on) b.querySelector('.sf-t').focus(); });
      b.querySelectorAll('input').forEach(i => {
        i.addEventListener('input', () => { b.classList.remove('bad'); if (say) say.textContent = ''; });
        i.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
      });
    });
    const read = b => {
      if (b.classList.contains('is-undef')) return { v: UNDEF, raw: 'undefined' };
      const t = readNum(b.querySelector('.sf-t').value), bt = b.querySelector('.sf-b').value.trim(), d = bt === '' ? 1 : readNum(bt);
      if (t == null || d == null || !Number.isInteger(t) || !Number.isInteger(d)) return null;
      return { v: of(t, d), raw: { n: t, d }, reduced: d !== 0 && gcd(t, d) === 1 && d > 0 };
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
      host.querySelectorAll('.sf input, .sf-u').forEach(x => { x.disabled = true; }); if (go) go.disabled = true;
      o.onSubmit(vals);
    }
    if (go) go.addEventListener('click', check);
    setTimeout(() => { const f = host.querySelector('.sf-t'); f && f.focus({ preventScroll: true }); }, 30);
    return { mark: (name, ok) => { const b = host.querySelector(`.sf[data-n="${name}"]`); b && b.classList.add(ok ? 'ok' : 'no'); } };
  }

  window.Frac = { gcd, of, UNDEF, eq, neg, recip, perp, num, text, html, readNum, box, wire };
})();
