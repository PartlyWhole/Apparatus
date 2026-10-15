// Steps — a chain of small steps, one row at a time (Write the Line's pattern, generalised).
// A right step gets ✓ and the next row appears. A wrong step shows one plain sentence in the shared .say line,
// then (after retryMs, 1.6 s) the row rebuilds in place and the student fixes it. Only each step's FIRST-try
// mistake is recorded: errs = [{ type, text, step }]. When every step is done, the finished line shows and done(errs).
//
//   Steps.run(el, steps, { done(errs), final?, say?, grid?, retryMs? }) → { errs, values, stop() }
//     el: where the chain is drawn (its content is replaced: .gq.steps > .st-list, .say, .q.final).
//     final: HTML (or (errs, values) → HTML) shown in green when all steps are done.
//     say: an existing .say element to use instead of the chain's own. grid: passed to tap steps.
//   A step is an object, or a function (values) → step, called when its turn comes (values so far, see below).
//   Any step may have `text` (a plain-words line above it; HTML allowed). A step with only `text` is just the line.
//   Every step may have `onRight(value, row)` (draw on the grid, etc.) and `cls` (extra class on its row).
//     { boxes: [[name, want, err]], kind: 'frac' | 'root' | 'dec', before, after, join, eq, opts, why?(name, value) }
//         answer boxes: before [box] join [box] … after, or eq: HTML with {name} where each box goes.
//         frac: lib/frac.js (want: a Frac value). dec: a number typed in a Frac box (want: a number).
//         root: lib/root.js (want: a Root value; opts go to Root.wire: strict, exact, tenth; strict also grades an
//         equal but unsimplified root as wrong). Without Root loaded it falls back to a Frac box compared by value
//         (fine when the root is whole) and warns once.
//         The first wrong box decides: why(name, value) → [err, sentence] (or a sentence: err is the box's);
//         without why the step's `say` sentence is used. value is what the box read ({ v, raw, … }).
//     { drag: [[key, html]], eq, want: { slot: key }, err, why?(placed) → sentence | [err, sentence], point?, say }
//         chips dragged (or tapped) into slots made by Steps.slot(name, placeholder) inside eq (lib/drag.js).
//         point: the two chips are written as P( x , y ) (point: 'A' names it).
//     { pick: [[id, html]], want, err, why(picked) → sentence | [err, sentence], cols }
//         choice buttons (lib/pick.js); a wrong pick stays faded when the row rebuilds.
//     { tap: (grid, row, tries) → Promise<{ ok, err, sentence, value }> }
//         a custom (grid) interaction; on a miss it's called again after retryMs with tries + 1.
//   values: { [box name]: value read, [slot name]: chip key, [step.name || 'pick' + i]: id, [step.name || 'tap' + i]: value }
// Styles: steps.css (on top of geo.css). Needs lib/frac.js; lib/drag.js, lib/pick.js, lib/root.js for those step types.
(function () {
  const slot = (name, ph) => `<span class="dslot" data-s="${name}" data-ph="${ph}" role="button" tabindex="0"><span class="dn">${ph}</span></span>`;
  const chip = ([k, h]) => `<button type="button" class="dchip" data-k="${k}">${h}</button>`;
  const GO = '<button type="button" class="go">Check</button>';
  let warned = false;

  // the kind of box: its HTML, its wiring, and when a value equals the wanted one
  function kindOf(k, o = {}) {
    // root, strict (G9): equal but unsimplified (2√12 for 4√3) counts as wrong
    if (k === 'root' && window.Root) return { box: Root.box, wire: Root.wire, eq: (r, w) => Root.eq(r.v, w) && (!o.strict || r.simplified), nudge: true };
    if (k === 'root' && !warned) { warned = true; console.warn('Steps: lib/root.js is not loaded; root boxes fall back to Frac boxes.'); }
    const num = w => w && w.a != null ? w.a * Math.sqrt(w.b) : w && w.n != null ? Frac.num(w) : +w;
    if (k === 'dec' || k === 'root') return { box: Frac.box, wire: Frac.wire, eq: (r, w) => !r.v.undef && Math.abs(Frac.num(r.v) - num(w)) < 1e-9, nudge: false };
    return { box: Frac.box, wire: Frac.wire, eq: (r, w) => Frac.eq(r.v, w), nudge: true };
  }
  // why() may give a sentence or [err, sentence]
  const reason = (r, err, fallback) => Array.isArray(r) ? [r[0] || err, r[1]] : [err, r || fallback || ''];

  function boxRow(row, st, ctx) {
    const K = kindOf(st.kind || 'frac', st.opts), want = nm => st.boxes.find(b => b[0] === nm)[1];
    const html = st.eq ? st.eq.replace(/\{(\w+)\}/g, (m, n) => st.boxes.some(b => b[0] === n) ? K.box(n) : m)
      : `${st.before || ''}${st.boxes.map(([n], k) => (k ? (st.join ?? ' ') : '') + K.box(n)).join('')}${st.after || ''}`;
    row.innerHTML = `${html} ${GO}`;
    const f = K.wire(row, Object.assign({}, st.opts, { say: ctx.say, want: K.nudge ? want : undefined, onSubmit: v => {
      st.boxes.forEach(([n, w]) => { f.mark && f.mark(n, K.eq(v[n], w)); ctx.values[n] = v[n]; });
      const bad = st.boxes.find(([n, w]) => !K.eq(v[n], w));
      if (!bad) return ctx.right(v);
      const [err, text] = reason(st.why && st.why(bad[0], v[bad[0]]), bad[2], st.say);
      ctx.wrong(err, text);
    } }));
  }

  function dragRow(row, st, ctx) {
    row.classList.add('drag');
    const chips = st.drag, P = st.point === true ? 'P' : st.point;
    row.innerHTML = `<div class="st-chips">${P ? `<span class="dpt"><b>${P}</b>(${chip(chips[0])},&nbsp;${chip(chips[1])})</span>` : chips.map(chip).join('')}</div>
      <div class="st-eq">${st.eq}</div><button type="button" class="go" disabled>Check</button>`;
    const go = row.querySelector('.go'), need = Object.keys(st.want).length, html = Object.fromEntries(chips);
    const d = Drag.wire({
      chips: Array.from(row.querySelectorAll('.dchip')), slots: Array.from(row.querySelectorAll('.dslot')),
      show: (s, k) => { s.innerHTML = k ? html[k] : `<span class="dn">${s.dataset.ph}</span>`; },
      onChange: placed => { go.disabled = Object.keys(placed).length < need; }
    });
    go.addEventListener('click', () => {
      d.disable(); go.disabled = true;
      const placed = Object.assign({}, d.placed), bad = Object.keys(st.want).filter(k => placed[k] !== st.want[k]);
      row.querySelectorAll('.dslot').forEach(s => s.classList.add(bad.includes(s.dataset.s) ? 'no' : 'ok'));
      Object.assign(ctx.values, placed);
      if (!bad.length) return ctx.right(placed);
      const [err, text] = reason(st.why && st.why(placed), st.err, st.say);
      ctx.wrong(err, text);
    });
  }

  function pickRow(row, st, ctx) {
    row.classList.add('pick');
    row.innerHTML = '';
    const tried = ctx.tried || (ctx.tried = []);
    Pick.ask(row, st.pick, id => {
      const right = id === String(st.want);
      Pick.mark(row, null, id, right);
      ctx.values[st.name || 'pick' + ctx.i] = id;
      if (right) return ctx.right(id);
      tried.push(id);
      const [err, text] = reason(st.why && st.why(id), st.err, st.say);
      ctx.wrong(err, text);
    }, { cols: st.cols, off: tried });
  }

  function tapRow(row, st, ctx) {
    const tries = ctx.tries = (ctx.tries ?? -1) + 1;
    Promise.resolve(st.tap(ctx.grid, row, tries)).then(r => {
      r = r || {};
      if (r.ok) { ctx.values[st.name || 'tap' + ctx.i] = r.value; return ctx.right(r.value); }
      ctx.wrong(r.err || st.err, r.sentence || st.say || '');
    });
  }

  function run(el, steps, o = {}) {
    const errs = [], values = {}, wait = o.retryMs ?? 1600;
    let i = 0, timer = 0, stopped = false;
    el.innerHTML = `<div class="gq steps"><div class="st-list"></div>${o.say ? '' : '<p class="say" aria-live="polite"></p>'}<div class="q final"></div></div>`;
    const list = el.querySelector('.st-list'), sayEl = o.say || el.querySelector('.say');
    const quiet = () => { sayEl.textContent = ''; sayEl.classList.remove('bad'); };
    function next() {
      if (stopped) return;
      if (i === steps.length) {
        const fin = typeof o.final === 'function' ? o.final(errs, values) : o.final;
        if (fin) el.querySelector('.final').innerHTML = `<span class="ok">${fin}</span>`;
        quiet();
        return o.done && o.done(errs);
      }
      const st = typeof steps[i] === 'function' ? steps[i](values) : steps[i];
      if (st.text) { const t = document.createElement('div'); t.className = 'q small st-text'; t.innerHTML = st.text; list.appendChild(t); }
      const build = st.boxes ? boxRow : st.drag ? dragRow : st.pick ? pickRow : st.tap ? tapRow : null;
      if (!build) { i++; return next(); }
      const row = document.createElement('div'); row.className = 'q step' + (st.cls ? ' ' + st.cls : ''); list.appendChild(row);
      const ctx = {
        i, say: sayEl, grid: o.grid, values,
        right(v) {
          if (stopped) return;
          const g = row.querySelector('.go'); g && g.remove();
          row.classList.add('st-done'); quiet();
          st.onRight && st.onRight(v, row);
          i++; next();
        },
        wrong(type, text) {
          if (stopped) return;
          if (!errs.some(e => e.step === ctx.i)) errs.push({ type, text, step: ctx.i });
          sayEl.innerHTML = text; sayEl.classList.add('bad');
          // the row again, in the same place; the sentence stays until they change something
          timer = setTimeout(() => { if (!stopped && el.isConnected) { row.classList.remove('drag'); build(row, st, ctx); } }, wait);
        }
      };
      build(row, st, ctx);
    }
    next();
    return { errs, values, stop() { stopped = true; clearTimeout(timer); } };
  }

  window.Steps = { run, slot };
})();
