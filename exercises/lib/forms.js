// Forms — multiple choice and written answers for the prefix and unit exercises (styles: forms.css).
// Needs lib/places.js (parsing, the sign toggle).
(function () {
  const P = window.Places;
  const num = (name, wide) => `<input class="f${wide ? ' wide' : ''}" data-n="${name}" inputmode="decimal" autocomplete="off" aria-label="${name}">`;
  // 10^[±][ ] — the exponent's sign is a toggle, the field digits only
  const pow = name => `<span class="pow">10<span class="up"><button type="button" class="sg"></button><input class="f exp" data-n="${name}" data-pow="1" inputmode="numeric" autocomplete="off" aria-label="${name}"></span></span>`;

  // wire the fields in el: a Check button (and Enter) reads them; empty/invalid fields shake and nothing is sent.
  // onSubmit(values): { name: { sig, pos, raw } for numbers, name: integer for powers }
  function wire(el, onSubmit) {
    const fields = Array.from(el.querySelectorAll('input.f'));
    const readers = {};
    fields.forEach(f => {
      if (f.dataset.pow) { const sg = f.parentNode.querySelector('.sg'); readers[f.dataset.n] = P.signToggle(sg, f); }
      f.addEventListener('input', () => f.classList.remove('bad'));
      f.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
    });
    const go = el.querySelector('.go');
    function check() {
      const vals = {}, bad = [];
      fields.forEach(f => {
        if (f.dataset.pow) { const v = readers[f.dataset.n](); if (v == null) bad.push(f); else vals[f.dataset.n] = v; }
        else { const v = P.parseDecimal(f.value); if (!v) bad.push(f); else vals[f.dataset.n] = Object.assign(v, { raw: f.value }); }
      });
      if (bad.length) { bad.forEach(f => { f.classList.remove('bad'); void f.offsetWidth; f.classList.add('bad'); }); bad[0].focus(); return; }
      fields.forEach(f => { f.disabled = true; }); el.querySelectorAll('.sg').forEach(b => { b.disabled = true; }); if (go) go.disabled = true;
      onSubmit(vals);
    }
    if (go) go.addEventListener('click', check);
    setTimeout(() => fields[0] && fields[0].focus({ preventScroll: true }), 30);
    return { mark: ok => fields.forEach(f => f.classList.add(ok ? 'ok' : 'no')) };
  }

  // four (or so) choices; keys 1–4 also pick. onPick(index)
  function choices(el, opts, onPick) {
    const box = el.querySelector('.mc');
    box.innerHTML = opts.map((o, i) => `<button type="button" data-i="${i}">${o}</button>`).join('');
    const btns = Array.from(box.children);
    const send = i => { document.removeEventListener('keydown', keys); btns.forEach(b => { b.disabled = true; }); onPick(i); };
    const keys = e => { if (/^[1-9]$/.test(e.key) && +e.key <= btns.length && el.isConnected) { e.preventDefault(); send(+e.key - 1); } };
    btns.forEach(b => b.addEventListener('click', () => send(+b.dataset.i)));
    document.addEventListener('keydown', keys);
    return { mark: (picked, right) => btns.forEach((b, i) => { b.className = i === right ? (picked === right ? 'ok' : 'want') : i === picked ? 'no' : ''; }) };
  }

  // a value { sig, pos } as a power of ten, or null if it isn't one (1, 10, 0.01 …)
  const powerOf = v => v && v.sig === '1' ? v.pos - 1 : null;

  window.Forms = { num, pow, wire, choices, powerOf };
})();
