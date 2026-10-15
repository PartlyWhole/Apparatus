// Name the Coordinates (G2a) — two points; drag each number to its name: x₁, y₁, x₂, y₂ (the names come scrambled).
// Tap a number then a name works too. A point is (x, y): x first. With P₁ and P₂ written, the ₁s come from P₁, wherever
// it is (the late twist lists P₂ first). With no names on the points, either point can be 1 — but both its numbers
// must be: the ₁s from one point, the ₂s from the other. Then the rise alone (y₂ − y₁) and the run alone (x₂ − x₁), in
// your head. Spec: specs/geometry-lines.md (G2a). Uses lib/grid.js, lib/lines.js, lib/frac.js.
(function () {
  const G = Grid, L = Lines, { r, any } = L;
  const s = G.sgn, SUB = { 1: '₁', 2: '₂' };
  const SLOTS = ['x1', 'y1', 'x2', 'y2'];
  const nameOf = k => `${k[0]}${SUB[k[1]]}`;                     // 'x1' → x₁
  // an item: { p1: [x, y], p2: [x, y], order: the names' scrambled order, rev: P₂ written first, free: no names on the
  // points } — four different numbers; or { p1, p2, q: 'rise' | 'run' } for the change alone
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
    return `<span class="dpt">${it.free ? '' : `<b>P${SUB[n]}</b>`}(${chip('x' + n)},&nbsp;${chip('y' + n)})</span>`;
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

  // which point is 1: P₁ when named; with free points, whichever the student made 1 (the assignment that fits best)
  const swap = k => k[0] + (k[1] === '1' ? '2' : '1');
  const assign = (it, a) => {
    if (!it.free) return k => k;
    const fit = f => SLOTS.filter(k => a[k] === f(k)).length;
    return fit(swap) > fit(k => k) ? swap : k => k;
  };
  // the first wrong name (in x₁ y₁ x₂ y₂ order): which number went there
  const firstWrong = (it, a) => { const f = assign(it, a); return SLOTS.find(k => a[k] !== f(k)); };
  const pickedFor = (it, a) => { const k = firstWrong(it, a); return { slot: k, chip: a[k], f: assign(it, a) }; };
  // rise or run alone, P₁ to P₂
  const ch = it => it.q === 'rise' ? it.p2[1] - it.p1[1] : it.p2[0] - it.p1[0];
  const paren = n => n < 0 ? `(${s(n)})` : s(n);
  const changeWork = it => { const c = it.q === 'rise' ? 1 : 0, v = c ? 'y' : 'x'; return `${it.q} = ${v}₂ − ${v}₁ = ${s(it.p2[c])} − ${paren(it.p1[c])} = ${s(ch(it))}`; };
  function changeItem(q, negs) {
    for (;;) {
      const it = make(negs ? -9 : 1, 9, false); it.q = q;
      const c = q === 'rise' ? 1 : 0, d = ch(it), o = q === 'rise' ? it.p2[0] - it.p1[0] : it.p2[1] - it.p1[1];
      // the change and the other change differ (so a mix-up shows), and with negatives, one subtracts a negative
      if (Math.abs(d) !== Math.abs(o) && Math.abs(d) <= 12 && (!negs || it.p1[c] < 0)) return it;
    }
  }
  const F = Frac;

  Apparatus.define({
    id: 'geo-coords',
    title: 'Name the Coordinates',
    ideas: {
      xy:     { name: 'x first, then y', easy: ['pos'], hard: ['neg'] },
      free:   { name: 'Unnamed points: keep each point together', easy: ['free'], hard: ['free'] },
      change: { name: 'Rise and run alone, in your head', easy: ['rise'], hard: ['run', 'rise-neg', 'run-neg'] },
      rev:    { name: 'P₁ and P₂, whichever comes first', easy: ['rev'], hard: ['rev'], late: true }
    },
    kinds: {
      pos: mk('xy', () => make(1, 9, false)),
      neg: mk('xy', () => make(-9, 9, false)),
      free: mk('free', () => Object.assign(make(-9, 9, false), { free: true })),
      rise: mk('change', () => changeItem('rise', false)),
      run: mk('change', () => changeItem('run', false)),
      'rise-neg': mk('change', () => changeItem('rise', true)),
      'run-neg': mk('change', () => changeItem('run', true)),
      rev: mk('rev', () => make(-9, 9, true))
    },
    opening: [{ kind: 'pos', item: { p1: [2, 5], p2: [7, 3], order: ['y1', 'x2', 'x1', 'y2'], rev: false } }],
    defaults: { fix: 1 },
    text: it => it.q ? `${it.q} from P₁(${s(it.p1[0])}, ${s(it.p1[1])}) to P₂(${s(it.p2[0])}, ${s(it.p2[1])})`
      : it.free ? `(${s(it.p1[0])}, ${s(it.p1[1])}) and (${s(it.p2[0])}, ${s(it.p2[1])}), unnamed`
      : `P₁(${s(it.p1[0])}, ${s(it.p1[1])}) and P₂(${s(it.p2[0])}, ${s(it.p2[1])})`,
    speak: it => it.q ? `P1 and P2. What is the ${it.q}?` : `Two points. Put each number with its name: x1, y1, x2, y2.`,
    ask(el, it, submit) {
      const named = n => `<span class="dpt"><b>P${SUB[n]}</b>(${s(val(it, 'x' + n))},&nbsp;${s(val(it, 'y' + n))})</span>`;
      if (it.q) {
        const v = it.q === 'rise' ? 'y' : 'x';
        el.innerHTML = `<div class="gq"><div class="q dpts">${named(1)}${named(2)}</div>
          <div class="q"><span class="${it.q === 'rise' ? 'qrise' : 'qrun'}">${it.q}</span> = ${v}₂ − ${v}₁ = ${F.box('ch')}</div>
          <p class="say" aria-live="polite"></p><button type="button" class="go">Check</button><div class="work" aria-live="polite"></div></div>`;
        el._f = F.wire(el, { want: () => F.of(ch(it)), onSubmit: v => submit(v.ch) });
        return;
      }
      const pts = it.rev ? [2, 1] : [1, 2];
      el.innerHTML = `<div class="gq"><div class="q dpts">${pts.map(n => pointHTML(it, n)).join('')}</div>
        <div class="dslots">${it.order.map(k => `<button type="button" class="dslot" data-s="${k}"><span class="dn">${nameOf(k)}</span><span class="dv"></span></button>`).join('')}</div>
        <button type="button" class="go" disabled>Check</button></div>`;
      wire(el, it, submit);
    },
    correct: it => it.q ? s(ch(it)) : SLOTS.map(k => `${nameOf(k)} = ${s(val(it, k))}`).join(', ') + (it.free ? ' (or the points the other way round)' : ''),
    isRight: (it, a) => it.q ? F.eq(a.v, F.of(ch(it))) : !firstWrong(it, a),
    classify(it, a) {
      if (it.q) {
        const v = a.v, o = it.q === 'rise' ? it.p2[0] - it.p1[0] : it.p2[1] - it.p1[1];
        if (v.undef) return 'other';
        if (F.eq(v, F.of(-ch(it)))) return 'order';
        if (F.eq(v, F.of(o)) || F.eq(v, F.of(-o))) return 'axis';
        return 'other';
      }
      const { slot, chip, f } = pickedFor(it, a), want = f(slot);
      const sameAxis = want[0] === chip[0], samePoint = want[1] === chip[1];
      return samePoint ? 'xy' : sameAxis ? (it.free ? 'split' : 'pt') : 'both';
    },
    feedback(it, want, a, kind, err) {
      if (it.q) {
        const v = it.q === 'rise' ? 'y' : 'x';
        if (err === 'order') return ['work', `${v}₂ first: P₂’s ${v} minus P₁’s ${v}.`];
        if (err === 'axis') return ['work', it.q === 'rise' ? 'Rise is up and down: the y’s.' : 'Run is across: the x’s.'];
        return ['work', (it.q === 'rise' ? it.p1[1] : it.p1[0]) < 0 ? 'Minus a negative is plus.' : `P₂’s ${v} minus P₁’s ${v}.`];
      }
      const { chip, f } = pickedFor(it, a), first = chip[0] === 'x' ? 'first' : 'second';
      if (it.free) {
        const named = f(chip);                                   // what this number is, with the student's own choice of 1 and 2
        return ['names', err === 'xy' ? `${s(val(it, chip))} is the ${first} number of its point, so it’s ${named[0]}.`
          : `${s(val(it, chip))} is from the other point: ${nameOf(named)}. Keep each point’s numbers together.`];
      }
      return ['names', `${s(val(it, chip))} is ${nameOf(chip)}: the ${first} number of P${SUB[chip[1]]}.`];
    },
    reveal(el, it, a, o) {
      if (it.q) { el._f && el._f.mark('ch', o.right); if (!o.right) el.querySelector('.work').textContent = changeWork(it); return; }
      const f = assign(it, a);
      el.querySelectorAll('.dslot').forEach(sl => {
        const want = f(sl.dataset.s), ok = a[sl.dataset.s] === want; sl.classList.add(ok ? 'ok' : 'no');
        if (!ok) sl.querySelector('.dv').innerHTML = `<s>${s(val(it, a[sl.dataset.s]))}</s> ${s(val(it, want))}`;
      });
      // after a miss, each number is named where it sits (with free points, the way the student chose 1 and 2)
      if (!o.right) el.querySelectorAll('.dchip').forEach(c => { c.setAttribute('data-name', nameOf(f(c.dataset.k))); c.classList.add('named'); });
    },
    errors: { xy: 'mixed up x and y', pt: 'mixed up P₁ and P₂', split: 'split a point between 1 and 2', both: 'mixed up x/y and the point', order: 'subtracted the wrong way round (sign)', axis: 'used x for rise (or y for run)', other: 'arithmetic' },
    diagnose(err) {
      return ({
        xy: ['Mixes up x and y inside a point.', 'A point is (x, y): across first, then up. Say “x, y” while pointing at each number.'],
        pt: ['Mixes up which point is 1 and which is 2.', 'The little 1 means “from P₁”, wherever P₁ is written. Circle P₁’s numbers first.'],
        split: ['Takes x₁ from one point and y₁ from the other.', 'Pick which point is 1 and write a small 1 over it; both its numbers get ₁.'],
        both: ['Mixes up both x/y and the points.', 'Label the points first (1, 2), then each number inside them (x, y).'],
        order: ['Subtracts P₁ minus P₂, so the sign flips.', 'Always “2 minus 1”: the second point’s number first.'],
        axis: ['Mixes up rise (the y’s) and run (the x’s).', 'Rise is up and down, the second numbers; run is across, the first numbers.'],
        other: ['Slips with negatives in the head.', 'Say “minus a negative is plus” out loud, then count on.']
      })[err] || ['', ''];
    },
    keyHTML: `<div class="gk"><div class="q dpts"><span class="dpt"><b>P₁</b>(<span class="dchip named" data-name="x₁">2</span>,&nbsp;<span class="dchip named" data-name="y₁">5</span>)</span><span class="dpt"><b>P₂</b>(<span class="dchip named" data-name="x₂">7</span>,&nbsp;<span class="dchip named" data-name="y₂">3</span>)</span></div><div>(x, y): x first · ₁ from P₁, ₂ from P₂</div></div>`
  });
})();
