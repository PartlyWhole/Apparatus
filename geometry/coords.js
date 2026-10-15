// Name the Coordinates (G2a) — two points P₁ and P₂; drag each number to its name: x₁, y₁, x₂, y₂ (the names come
// scrambled). Tap a number then a name works too. A point is (x, y): x first. The ₁s come from P₁, the ₂s from P₂,
// whichever is written first (the late twist lists P₂ first). Spec: specs/geometry-lines.md (G2a). Uses lib/grid.js, lib/lines.js.
(function () {
  const G = Grid, L = Lines, { r, any } = L;
  const s = G.sgn, SUB = { 1: '₁', 2: '₂' };
  const SLOTS = ['x1', 'y1', 'x2', 'y2'];
  const nameOf = k => `${k[0]}${SUB[k[1]]}`;                     // 'x1' → x₁
  // an item: { p1: [x, y], p2: [x, y], order: the names' scrambled order, rev: P₂ written first }; four different numbers
  const val = (it, k) => (k[1] === '1' ? it.p1 : it.p2)[k[0] === 'x' ? 0 : 1];
  function scramble() { let o; do { o = SLOTS.slice().sort(() => Math.random() - 0.5); } while (o.join() === SLOTS.join()); return o; }
  function make(lo, hi, rev) {
    for (;;) {
      const v = [r(lo, hi), r(lo, hi), r(lo, hi), r(lo, hi)];
      if (new Set(v).size === 4 && !v.includes(0)) return { p1: [v[0], v[1]], p2: [v[2], v[3]], order: scramble(), rev };
    }
  }
  const mk = (idea, f) => ({ idea, make: f });
  const pointHTML = (it, n) => {
    const p = n === 1 ? it.p1 : it.p2, chip = k => `<button type="button" class="dchip" data-k="${k}">${s(val(it, k))}</button>`;
    return `<span class="dpt"><b>P${SUB[n]}</b>(${chip('x' + n)},&nbsp;${chip('y' + n)})</span>`;
  };

  // drag (mouse or touch) or tap-then-tap; a filled name can be tapped to empty it
  function wire(el, it, submit) {
    const chips = Array.from(el.querySelectorAll('.dchip')), slots = Array.from(el.querySelectorAll('.dslot')), go = el.querySelector('.go');
    const placed = {};                                            // slot → chip key
    let sel = null;
    const refresh = () => {
      slots.forEach(sl => { const k = placed[sl.dataset.s]; sl.querySelector('.dv').textContent = k ? s(val(it, k)) : ''; sl.classList.toggle('full', !!k); });
      chips.forEach(c => { c.classList.toggle('used', Object.values(placed).includes(c.dataset.k)); c.classList.toggle('sel', c === sel); });
      go.disabled = Object.keys(placed).length < 4;
    };
    const put = (chip, slot) => {
      for (const k in placed) if (placed[k] === chip.dataset.k) delete placed[k];
      placed[slot.dataset.s] = chip.dataset.k; sel = null; refresh();
    };
    slots.forEach(sl => sl.addEventListener('click', () => {
      if (sel) put(sel, sl); else if (placed[sl.dataset.s]) { delete placed[sl.dataset.s]; refresh(); }
    }));
    chips.forEach(c => {
      c.addEventListener('click', () => { if (c._dragged) { c._dragged = false; return; } sel = sel === c ? null : c; refresh(); });
      c.addEventListener('pointerdown', e => {
        if (c.disabled) return;
        const x0 = e.clientX, y0 = e.clientY; let ghost = null;
        try { c.setPointerCapture(e.pointerId); } catch (_) {}
        const move = ev => {
          if (!ghost && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 6) return;
          if (!ghost) { ghost = c.cloneNode(true); ghost.className = 'dchip ghost'; document.body.appendChild(ghost); }
          ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px';
          slots.forEach(sl => sl.classList.toggle('over', sl === slotAt(ev)));
        };
        const end = (ev, drop) => {
          c.removeEventListener('pointermove', move); c.removeEventListener('pointerup', up); c.removeEventListener('pointercancel', cancel);
          if (!ghost) return;
          ghost.remove(); c._dragged = true; setTimeout(() => { c._dragged = false; }, 0); slots.forEach(sl => sl.classList.remove('over'));
          const sl = drop && slotAt(ev); if (sl) put(c, sl); else refresh();
        };
        const up = ev => end(ev, true), cancel = ev => end(ev, false);
        c.addEventListener('pointermove', move); c.addEventListener('pointerup', up); c.addEventListener('pointercancel', cancel);
      });
    });
    const slotAt = ev => { const t = document.elementFromPoint(ev.clientX, ev.clientY); return t && t.closest ? slots.find(sl => sl.contains(t)) : null; };
    go.addEventListener('click', () => {
      if (Object.keys(placed).length < 4) return;
      chips.concat(slots).forEach(b => { b.disabled = true; }); go.disabled = true;
      submit(Object.assign({}, placed));
    });
    refresh();
  }

  // the first wrong name (in x₁ y₁ x₂ y₂ order): which number went there
  const firstWrong = (it, a) => SLOTS.find(k => a[k] !== k);
  const pickedFor = (it, a) => { const k = firstWrong(it, a); return { slot: k, chip: a[k] }; };

  Apparatus.define({
    id: 'geo-coords',
    title: 'Name the Coordinates',
    ideas: {
      xy:  { name: 'x first, then y', easy: ['pos'], hard: ['neg'] },
      rev: { name: 'P₁ and P₂, whichever comes first', easy: ['rev'], hard: ['rev'], late: true }
    },
    kinds: {
      pos: mk('xy', () => make(1, 9, false)),
      neg: mk('xy', () => make(-9, 9, false)),
      rev: mk('rev', () => make(-9, 9, true))
    },
    opening: [{ kind: 'pos', item: { p1: [2, 5], p2: [7, 3], order: ['y1', 'x2', 'x1', 'y2'], rev: false } }],
    defaults: { fix: 1 },
    text: it => `P₁(${s(it.p1[0])}, ${s(it.p1[1])}) and P₂(${s(it.p2[0])}, ${s(it.p2[1])})`,
    speak: it => `Two points, P1 and P2. Put each number with its name: x1, y1, x2, y2.`,
    ask(el, it, submit) {
      const pts = it.rev ? [2, 1] : [1, 2];
      el.innerHTML = `<div class="gq"><div class="q dpts">${pts.map(n => pointHTML(it, n)).join('')}</div>
        <div class="dslots">${it.order.map(k => `<button type="button" class="dslot" data-s="${k}"><span class="dn">${nameOf(k)}</span><span class="dv"></span></button>`).join('')}</div>
        <button type="button" class="go" disabled>Check</button></div>`;
      wire(el, it, submit);
    },
    correct: it => SLOTS.map(k => `${nameOf(k)} = ${s(val(it, k))}`).join(', '),
    isRight: (it, a) => !firstWrong(it, a),
    classify(it, a) {
      const { slot, chip } = pickedFor(it, a);
      const sameAxis = slot[0] === chip[0], samePoint = slot[1] === chip[1];
      return samePoint ? 'xy' : sameAxis ? 'pt' : 'both';
    },
    feedback(it, want, a, kind, err) {
      const { chip } = pickedFor(it, a), n = chip[1], first = chip[0] === 'x' ? 'first' : 'second';
      return ['names', `${s(val(it, chip))} is ${nameOf(chip)}: the ${first} number of P${SUB[n]}.`];
    },
    reveal(el, it, a, o) {
      el.querySelectorAll('.dslot').forEach(sl => {
        const ok = a[sl.dataset.s] === sl.dataset.s; sl.classList.add(ok ? 'ok' : 'no');
        if (!ok) sl.querySelector('.dv').innerHTML = `<s>${s(val(it, a[sl.dataset.s]))}</s> ${s(val(it, sl.dataset.s))}`;
      });
      // after a miss, each number is named where it sits
      if (!o.right) el.querySelectorAll('.dchip').forEach(c => { c.setAttribute('data-name', nameOf(c.dataset.k)); c.classList.add('named'); });
    },
    errors: { xy: 'mixed up x and y', pt: 'mixed up P₁ and P₂', both: 'mixed up x/y and the point' },
    diagnose(err) {
      return ({
        xy: ['Mixes up x and y inside a point.', 'A point is (x, y): across first, then up. Say “x, y” while pointing at each number.'],
        pt: ['Mixes up which point is 1 and which is 2.', 'The little 1 means “from P₁”, wherever P₁ is written. Circle P₁’s numbers first.'],
        both: ['Mixes up both x/y and the points.', 'Label the points first (P₁, P₂), then each number inside them (x, y).']
      })[err] || ['', ''];
    },
    keyHTML: `<div class="gk"><div class="q dpts"><span class="dpt"><b>P₁</b>(<span class="dchip named" data-name="x₁">2</span>,&nbsp;<span class="dchip named" data-name="y₁">5</span>)</span><span class="dpt"><b>P₂</b>(<span class="dchip named" data-name="x₂">7</span>,&nbsp;<span class="dchip named" data-name="y₂">3</span>)</span></div><div>(x, y): x first · ₁ from P₁, ₂ from P₂</div></div>`
  });
})();
