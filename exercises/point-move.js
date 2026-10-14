// Moving the Point — what × / ÷ 10ⁿ (and × 10⁻ⁿ) do to a decimal: the point hops.
// Spec: specs/point-move.md. Engine API: docs/design/engine.md (tap mode + tutorial).
(function () {
  const { r, any } = Apparatus.util;
  const PAD = 4;                                  // empty places on each side of the digits
  const HOP_MS = 380;
  const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- items ----------
  // { d: the digits, p: where the point is (digits to its left), op: '×' | '÷', e: exponent }
  const nz = () => String(r(1, 9));
  const dig = n => nz() + Array.from({ length: n - 2 }, () => r(0, 9)).join('') + (n > 1 ? nz() : '');   // first and last digit not 0
  const move = it => (it.op === '×' ? 1 : -1) * it.e;            // + = right
  const start = it => PAD + it.p;
  const target = it => start(it) + move(it);
  const slots = it => PAD + it.d.length + PAD;

  const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  const sup = e => String(e).split('').map(c => SUP[c]).join('');
  const commas = s => s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const numStr = (d, p) => p >= d.length ? commas(d + '0'.repeat(p - d.length)) : p <= 0 ? '0.' + '0'.repeat(-p) + d : commas(d.slice(0, p)) + '.' + d.slice(p);
  // the value once the point sits at gap g (zeros fill in as needed)
  function valueAt(it, g) {
    const full = '0'.repeat(PAD) + it.d + '0'.repeat(PAD);
    const int = full.slice(0, g).replace(/^0+/, '') || '0', frac = full.slice(g).replace(/0+$/, '');
    return commas(int) + (frac ? '.' + frac : '');
  }
  // × 10 for a power of 1 (as in the tutorial); otherwise the exponent
  const opHTML = it => it.e === 1 ? `${it.op} 10` : `${it.op} 10<sup>${it.e < 0 ? '−' + -it.e : it.e}</sup>`;
  const opText = it => it.e === 1 ? `${it.op} 10` : `${it.op} 10${sup(it.e)}`;
  // what a negative or zero power "really" is: × 10⁻² = ÷ 10², ÷ 10⁻² = × 10², 10⁰ = 1
  const flipHTML = it => it.e === 0 ? '× 1' : `${it.op === '×' ? '÷' : '×'} 10<sup>${-it.e}</sup>`;

  // ---------- the slot row ----------
  // empty places are invisible; a zero shows only where the point's position adds one
  // filled: when the point is at gap `filled`, which empty places it has turned into zeros
  const isFill = (it, g, i) => { const a = PAD, b = PAD + it.d.length; return (g > b && i >= b && i < g) || (g <= a && i >= g - 1 && i < a); };
  function rowHTML(it, faint, filled) {
    const n = slots(it);
    let h = '';
    for (let i = 0; i < n; i++) {
      const j = i - PAD, isDig = j >= 0 && j < it.d.length;
      h += isDig ? `<span class="s">${it.d[j]}</span>` : `<span class="s pad${filled != null && isFill(it, filled, i) ? ' fill' : ''}">0</span>`;
    }
    return `<div class="row${faint ? ' faint' : ''}" style="--n:${n}" aria-hidden="true">${h}<span class="pt start" style="--g:${start(it)}"></span></div>`;
  }
  // solid zeros between the digits and a point at gap g (and the 0 before a leading point)
  // cls 'fill' = solid zeros (committed); 'prev' = light zeros previewing an uncommitted point (null g clears)
  function setFills(row, it, g, cls = 'fill') {
    row.querySelectorAll('.s').forEach((s, i) => s.classList.toggle(cls, g != null && isFill(it, g, i) && s.classList.contains('pad')));
  }
  const addPoint = (row, cls, g) => { const p = document.createElement('span'); p.className = 'pt ' + cls; p.style.setProperty('--g', g); row.appendChild(p); return p; };
  // hop a point from gap a to gap b, one place at a time, drawing numbered arcs
  function hop(row, pt, it, a, b, done, arcs = true) {
    const dir = Math.sign(b - a); let g = a, k = 0;
    if (!dir) { done && done(); return; }
    const stepMs = reduced() ? 160 : HOP_MS;
    (function step() {
      if (!row.isConnected) return;
      const from = g; g += dir; k++;
      if (arcs) {
        const arc = document.createElement('span');
        arc.className = 'arc'; arc.style.setProperty('--g', Math.min(from, g)); arc.dataset.n = k;
        row.appendChild(arc);
      }
      pt.style.setProperty('--g', g);
      pt.classList.remove('hop'); void pt.offsetWidth; pt.classList.add('hop');
      setFills(row, it, g);
      if (g !== b) setTimeout(step, stepMs); else setTimeout(() => done && done(), stepMs);
    })();
  }
  function gapFromX(row, it, clientX) {
    const rc = row.getBoundingClientRect(), n = slots(it);
    return Math.max(1, Math.min(n - 1, Math.round((clientX - rc.left) / (rc.width / n))));
  }

  // ---------- question ----------
  function questionHTML(it, faint) {
    return `<div class="pm"><div class="expr"><span class="num">${numStr(it.d, it.p)}</span> ${opHTML(it)} <span class="eq">=</span></div>
      ${rowHTML(it, faint)}<div class="res" aria-live="polite"></div><div class="flip"></div></div>`;
  }

  const D = Apparatus.define({
    id: 'point-move',
    title: 'Moving the Point',

    ideas: {
      right: { name: '× 10ⁿ (right)', easy: ['r-in'], hard: ['r-past', 'r-whole'] },
      left:  { name: '÷ 10ⁿ (left)',  easy: ['l-in'], hard: ['l-past', 'l-whole'] },
      neg:   { name: '× 10⁻ⁿ (left)', easy: ['n-in'], hard: ['n-past', 'n-whole'] },
      twist: { name: '÷ 10⁻ⁿ and 10⁰', easy: ['t-zero'], hard: ['t-divneg', 't-zero'], late: true }
    },
    kinds: {
      'r-in':     { idea: 'right', make: () => ({ d: dig(3), p: 1, op: '×', e: 1 }) },
      'r-past':   { idea: 'right', make: () => ({ d: dig(2), p: 1, op: '×', e: r(2, 3) }) },
      'r-whole':  { idea: 'right', make: () => ({ d: dig(2), p: 2, op: '×', e: r(1, 3) }) },
      'l-in':     { idea: 'left',  make: () => ({ d: dig(3), p: 2, op: '÷', e: 1 }) },
      'l-past':   { idea: 'left',  make: () => ({ d: dig(2), p: 1, op: '÷', e: r(2, 3) }) },
      'l-whole':  { idea: 'left',  make: () => ({ d: dig(2) + '0', p: 3, op: '÷', e: r(2, 3) }) },
      'n-in':     { idea: 'neg',   make: () => ({ d: dig(3), p: 2, op: '×', e: -1 }) },
      'n-past':   { idea: 'neg',   make: () => ({ d: dig(2), p: 1, op: '×', e: -r(2, 3) }) },
      'n-whole':  { idea: 'neg',   make: () => ({ d: dig(2) + '00', p: 4, op: '×', e: -r(1, 2) }) },
      't-divneg': { idea: 'twist', make: () => ({ d: dig(2), p: 1, op: '÷', e: -r(1, 3) }) },
      't-zero':   { idea: 'twist', make: () => ({ d: dig(r(2, 3)), p: 1, op: any(['×', '÷']), e: 0 }) }
    },
    // the same number three ways: ÷ 10² and × 10⁻² land in the same place
    opening: [
      { kind: 'r-in',   item: { d: '352', p: 1, op: '×', e: 2 } },
      { kind: 'l-past', item: { d: '352', p: 1, op: '÷', e: 2 } },
      { kind: 'n-past', item: { d: '352', p: 1, op: '×', e: -2 } }
    ],

    text: it => `${numStr(it.d, it.p)} ${opText(it)}`,
    speak: it => `${numStr(it.d, it.p)} ${it.op === '×' ? 'times' : 'divided by'} 10 to the ${it.e < 0 ? 'minus ' + -it.e : it.e}. Where does the point go?`,

    // ---- tap mode ----
    ask(el, it, submit, ctx) {
      el.innerHTML = questionHTML(it, ctx.mode === 'open');
      const row = el.querySelector('.row');
      row.setAttribute('tabindex', '0'); row.setAttribute('role', 'slider'); row.removeAttribute('aria-hidden');
      row.setAttribute('aria-label', 'Where the point goes');
      const ghost = addPoint(row, 'ghost', start(it));
      let g = start(it), live = true;
      const say = () => { row.setAttribute('aria-valuetext', valueAt(it, g)); };
      // moving the point (hover, drag, arrows) previews it, with the zeros it would need, so it never floats in empty space;
      // releasing (or Enter) commits
      const show = x => { g = x; ghost.style.setProperty('--g', g); ghost.classList.add('on'); setFills(row, it, g, 'prev'); say(); };
      const clear = () => { ghost.classList.remove('on'); setFills(row, it, null, 'prev'); };
      const send = x => { if (!live) return; live = false; ghost.remove(); submit(x); };
      let down = false;
      row.addEventListener('pointerdown', e => { if (!live) return; down = true; try { row.setPointerCapture(e.pointerId); } catch (_) {} show(gapFromX(row, it, e.clientX)); });
      row.addEventListener('pointermove', e => { if (live && (down || e.pointerType === 'mouse')) show(gapFromX(row, it, e.clientX)); });
      row.addEventListener('pointerup', e => { if (!live || !down) return; down = false; send(gapFromX(row, it, e.clientX)); });
      row.addEventListener('pointercancel', () => { down = false; if (live) clear(); });
      row.addEventListener('pointerleave', () => { if (live && !down) clear(); });   // after answering, the picked point keeps its zeros
      row.addEventListener('keydown', e => {
        if (!live) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); show(Math.max(1, Math.min(slots(it) - 1, g + (e.key === 'ArrowRight' ? 1 : -1)))); }
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); send(g); }
      });
      say();
    },
    correct: it => target(it),
    // what kind of error a tap is
    classify(it, g) {
      const m = move(it), d = g - start(it);
      if (it.e === 0) return 'zero';
      if (d !== 0 && Math.sign(d) !== Math.sign(m)) return it.e < 0 ? 'sign' : 'dir';
      return 'count';
    },
    feedback(it, want, g, kind, err) {
      const m = Math.abs(move(it)), d = Math.abs(g - start(it)), places = n => `${n} place${n === 1 ? '' : 's'}`;
      if (err === 'zero') return ['hops', `10<sup>0</sup> is 1, so the point doesn’t move.`];
      if (err === 'dir') return ['hops', it.op === '×' ? `${opHTML(it)} makes it bigger, so the point moves right.` : `${opHTML(it)} makes it smaller, so the point moves left.`];
      if (err === 'sign') return ['hops', it.op === '×' ? `10<sup>−${-it.e}</sup> means ÷ 10<sup>${-it.e}</sup>, so the point moves left.` : `Dividing by 10<sup>−${-it.e}</sup> is × 10<sup>${-it.e}</sup>, so the point moves right.`];
      return ['hops', d === 0 ? `${opHTML(it)} moves the point ${places(m)}.` : `${opHTML(it)} moves the point ${places(m)}, not ${d}.`];
    },
    revealMs: 1100,
    reveal(el, it, g, o) {
      const row = el.querySelector('.row'), T = target(it), res = el.querySelector('.res');
      row.classList.add('answered'); row.removeAttribute('tabindex');
      if (o.right) {
        addPoint(row, 'pick ok', g); setFills(row, it, g);
        res.textContent = '= ' + valueAt(it, g); res.className = 'res ok';
        return;
      }
      if (g !== start(it)) addPoint(row, 'pick no', g);
      if (it.e <= 0) { const f = el.querySelector('.flip'); f.innerHTML = `${opHTML(it)} = ${flipHTML(it)}`; f.classList.add('on'); }
      const run = addPoint(row, 'run', start(it));
      const finish = () => { res.textContent = '= ' + valueAt(it, T); res.className = 'res'; };
      if (T === start(it)) { run.classList.add('stay'); finish(); }
      else setTimeout(() => hop(row, run, it, start(it), T, finish), 250);
    },

    errors: { dir: 'moved the wrong way', sign: 'ignored the minus sign', count: 'wrong number of places', zero: 'moved the point for 10⁰' },
    diagnose(err, kind) {
      if (err === 'dir') return ['Hasn’t linked bigger/smaller to right/left.', 'Before tapping, ask: “Will the answer be bigger or smaller?”'];
      if (err === 'sign') return kind === 't-divneg'
        ? ['Treats ÷ 10⁻ⁿ like ÷ 10ⁿ.', 'Dividing by 10⁻² is the same as × 10². Ask: bigger or smaller?']
        : ['Reads the exponent’s number and ignores the minus sign.', 'Cover the number: “10⁻² means ÷ 100. Bigger or smaller?”'];
      if (err === 'zero') return ['Thinks 10⁰ is 10 (or 0).', '10⁰ = 1, and multiplying or dividing by 1 changes nothing.'];
      return /whole/.test(kind)
        ? ['Started from the wrong place, or counted digits instead of hops.', 'Find the point first (in 45 it’s after the 5), then count hops with a finger.']
        : ['Counts zeros or digits instead of hops.', 'Count the hops aloud with a finger, one per place.'];
    },

    // ---- the ? key: the three moves, drawn ----
    get keyHTML() {
      const ex = [{ d: '352', p: 1, op: '×', e: 2 }, { d: '352', p: 1, op: '÷', e: 2 }, { d: '352', p: 1, op: '×', e: -2 }];
      return `<div class="pmkey">${ex.map(it => {
        const T = target(it), lo = Math.min(start(it), T);
        const arcs = Array.from({ length: Math.abs(move(it)) }, (_, k) => `<span class="arc" style="--g:${lo + k}"></span>`).join('');
        const row = rowHTML(it, false, T).replace('</div>', `${arcs}<span class="pt run" style="--g:${T}"></span></div>`).replace('class="pt start"', 'class="pt start dim"');
        return `<div class="kx">${opHTML(it)}${it.e < 0 ? ` <small>= ${flipHTML(it)}</small>` : ''}</div>${row}`;
      }).join('')}</div>`;
    },

    // ---- the tutorial: press the real buttons; a caption names what just happened ----
    tutorial(stage, api) {
      const N = 5;
      let it, row, pt, busy = false;
      function setup(item, btnHTML, opts = {}) {
        it = item;
        stage.innerHTML = `<div class="pm tut-pm">${opts.expr ? `<div class="expr">${opts.expr}</div>` : ''}${rowHTML(it, true)}
          <div class="tbtns">${btnHTML ? `<button type="button" class="tb pulse">${btnHTML}</button>` : ''}</div></div>`;
        row = stage.querySelector('.row'); pt = row.querySelector('.pt.start'); pt.classList.add('live');
        setFills(row, it, start(it));
        return stage.querySelector('.tb');
      }
      let g;
      function press(steps, after) {           // move the live point; arcs only for multi-hop presses
        if (busy) return; busy = true;
        const to = g + steps;
        row.querySelectorAll('.arc').forEach(a => a.remove());
        hop(row, pt, it, g, to, () => { g = to; busy = false; after && after(); }, Math.abs(steps) > 1);
      }
      const base = () => ({ d: '352', p: 1, op: '×', e: 1 });

      function s1() {                          // × 10, three times: 3.52 → 35.2 → 352 → 3,520
        api.step(0, N); api.caption('');
        const b = setup(base(), '× 10'); g = start(it); let n = 0;
        b.addEventListener('click', () => press(1, () => {
          b.classList.remove('pulse');
          if (++n === 3) { api.caption('× 10: the point moves one place right.'); s2(); }
        }));
      }
      function s2() {                          // ÷ 10, four times: 3,520 → 0.352
        const holder = stage.querySelector('.tbtns');
        holder.innerHTML = '<button type="button" class="tb pulse">÷ 10</button>';
        const b = holder.firstChild; let n = 0;
        b.addEventListener('click', () => {
          if (!api.alive()) return;
          if (n === 0) api.step(1, N);
          press(-1, () => {
            b.classList.remove('pulse');
            if (++n === 4) { api.caption('÷ 10: one place left.'); s3(); }
          });
        });
      }
      function s3() {                          // × 10³ in one press: three hops
        const holder = stage.querySelector('.tbtns');
        holder.innerHTML = '<button type="button" class="tb pulse">× 10<sup>3</sup></button>';
        holder.firstChild.addEventListener('click', () => {
          if (!api.alive() || busy) return;
          api.step(2, N); api.caption('');
          setup(base()); g = start(it);
          press(3, () => { api.caption('× 10<sup>3</sup>: three hops right.'); s4(); });
        }, { once: true });
      }
      function s4() {                          // × 10⁻²: flips to ÷ 10², two hops left
        const holder = stage.querySelector('.tbtns');
        holder.innerHTML = '<button type="button" class="tb pulse">× 10<sup>−2</sup></button>';
        holder.firstChild.addEventListener('click', () => {
          if (!api.alive() || busy) return;
          api.step(3, N); api.caption('');
          const b = setup(base(), '× 10<sup>−2</sup>'); b.classList.remove('pulse'); b.disabled = true; g = start(it);
          setTimeout(() => {
            if (!api.alive()) return;
            b.classList.add('flipping');
            setTimeout(() => { b.innerHTML = '÷ 10<sup>2</sup>'; }, 180);
            setTimeout(() => press(-2, () => { api.caption('A negative power moves it left.'); s5btn(); }), 700);
          }, 250);
        }, { once: true });
      }
      function s5btn() {                       // a "›" to start the try-it step (so the caption can be read)
        const holder = stage.querySelector('.tbtns');
        holder.innerHTML = '<button type="button" class="tb next" aria-label="Next">›</button>';
        holder.firstChild.addEventListener('click', s5, { once: true });
        holder.firstChild.focus();
      }
      function s5() {                          // try it: tap where the point lands (can't be failed: wrong → watch, try again)
        if (!api.alive()) return;
        api.step(4, N); api.caption('Tap where the point lands.');
        const item = { d: '352', p: 1, op: '×', e: 2 };
        (function attempt() {
          if (!api.alive()) return;
          D.ask(stage, item, x => {
            const ok = x === target(item);
            D.reveal(stage, item, x, { right: ok });
            if (ok) { api.caption('✓'); setTimeout(() => api.alive() && (api.step(N, N), api.done()), 1300); }
            else { api.caption('Watch the hops, then try again.'); setTimeout(attempt, 2600); }
          }, { mode: 'open' });
          stage.querySelector('.row').focus({ preventScroll: true });
        })();
      }
      s1();
    }
  });
})();
