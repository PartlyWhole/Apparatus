// Apparatus exercise engine — shared by every exercise in the new set.
// An exercise is a definition (exercises/<id>.js) plus a thin page (exercises/<id>.html).
// The engine owns: the page shell, choosing questions, mastery rules, the progress bar,
// feedback after a miss, the next-session check, the answer log, tutor rules, and the analytics page.
// Two answer modes: buttons (def.choices) or the exercise's own tap/drag area (def.ask). Optional interactive tutorial (def.tutorial).
// Documentation: docs/design/engine.md. Keep that file in step with this one.
(function () {
  const A = window.Apparatus = window.Apparatus || {};
  A.defs = A.defs || {};
  A.define = def => { A.defs[def.id] = def; return def; };

  // ---------- small helpers (also used by definitions) ----------
  const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const any = a => a[r(0, a.length - 1)];
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = r(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  A.util = { r, any, shuffle };

  // ---------- storage ----------
  const stateKey = def => `apparatus.${def.id}.v${def.version || 1}`;
  const setKey = def => `apparatus.${def.id}.settings`;
  const read = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const drop = k => { try { localStorage.removeItem(k); } catch (e) {} };

  // ---------- rules a tutor can change (analytics page) ----------
  //   intro:  start with the opening contrast set        fix:   right answers needed on an idea after a miss
  //   tricky: tricky questions per idea                   speed: seconds; slower right answers don't count yet (0 = off)
  //   check:  a short check next session                  key:   show the ? key
  //   tutorial: run the tutorial on the first visit (only if the exercise has one)
  //   fix is the miss penalty: right answers needed on that idea after a miss, and how far the bar drops (default 3, to discourage guessing)
  const RULE_DEFAULTS = { intro: true, tricky: 2, fix: 3, speed: 0, check: true, key: true, tutorial: true };
  A.RULE_DEFAULTS = RULE_DEFAULTS;
  A.loadSettings = def => Object.assign({}, RULE_DEFAULTS, def.defaults || {}, read(setKey(def)) || {});
  A.saveSettings = (def, s) => write(setKey(def), s);
  const WARM_AFTER = 8 * 3600e3;
  // an exercise may have its own rules (def.rules) that change its content: def.configure(SET) returns overrides
  // (e.g. fewer ideas, a different opening) for the current settings
  A.configured = (base, SET) => base.configure ? Object.assign(Object.create(base), base.configure(SET) || {}) : base;        // "next session" = 8+ hours after the last finish

  const ideaIds = def => Object.keys(def.ideas);
  const answerOf = (def, kind, item) => def.answer ? def.answer(item, kind) : def.kinds[kind].idea;
  function probeList(def, n) {
    // tricky kinds, interleaved across ideas: round 1 of every idea, then round 2…; ideas marked late (twists) come after all the others
    const out = [], ids = ideaIds(def);
    [ids.filter(i => !def.ideas[i].late), ids.filter(i => def.ideas[i].late)].forEach(group => {
      for (let k = 0; k < n; k++) group.forEach(i => { const h = def.ideas[i].hard[k]; if (h) out.push(h); });
    });
    return out;
  }
  const maxTricky = def => Math.max(...ideaIds(def).map(i => def.ideas[i].hard.length));
  const newRun = (def, SET) => ({
    open: SET.intro && def.opening ? 0 : (def.opening || []).length,
    probe: probeList(def, SET.tricky),
    need: Object.fromEntries(ideaIds(def).map(i => [i, 0])),
    missed: {}, answers: 0, credit: 0
  });
  function loadState(def, SET) {
    let S = read(stateKey(def));
    if (!S || !S.run) S = { run: newRun(def, SET), warm: null, done: false, doneAt: null, checkedAt: null, log: [] };
    // rules changed since this run began: loosening applies now, tightening from the next run
    const R = S.run, allowed = probeList(def, SET.tricky), nOpen = (def.opening || []).length;
    R.probe = R.probe.filter(k => allowed.includes(k));
    if (!SET.intro && R.open < nOpen) R.open = nOpen;
    ideaIds(def).forEach(i => { R.need[i] = Math.min(R.need[i] || 0, SET.fix); });
    Object.keys(R.need).forEach(i => { if (!def.ideas[i]) delete R.need[i]; });          // ideas switched off by a rule
    const live = new Set(ideaIds(def).flatMap(i => def.ideas[i].easy.concat(def.ideas[i].hard)));
    if (S.warm) S.warm = S.warm.filter(k => live.has(k));
    if (!SET.check && S.warm) S.warm = null;
    return S;
  }
  const remaining = (def, S) => { const R = S.run; return Math.max(0, (def.opening || []).length - R.open) + R.probe.length + (S.warm ? S.warm.length : 0) + Object.values(R.need).reduce((a, b) => a + b, 0); };

  // =====================================================================
  // The exercise page
  // =====================================================================
  A.mount = function (id, opts) {
    const base = A.defs[id], root = (opts && opts.root) || '../';
    let def = base;                                  // re-made from the settings at each start (def.configure)
    document.title = def.title;
    document.body.innerHTML = `
<div class="page">
  <div class="top">
    <a href="${root}index.html" aria-label="Apparatus">←</a>
    <div class="bar" role="progressbar" aria-label="Progress" aria-valuemin="0" aria-valuemax="100" id="barWrap"><i id="bar"></i><b id="hit"></b></div>
    <button type="button" class="icon" id="help" aria-label="Key" aria-expanded="false" aria-controls="key" hidden>?</button>
    <button type="button" class="icon" id="reset" aria-label="Start this exercise again">↺</button>
    <div class="key" id="key" role="dialog" aria-label="Key" hidden></div>
  </div>
  <div class="card" id="card">
    <div id="q"></div>
    <div class="opts" id="opts" role="group" aria-label="Answer"></div>
    <div class="fix"><p id="why" aria-live="polite"></p><button type="button" class="ok-btn" id="okBtn" hidden>OK</button></div>
    <div class="tut" id="tut" hidden><p id="cap" aria-live="polite"></p><div class="tut-foot"><span class="tdots" id="tdots" aria-hidden="true"></span><button type="button" class="skip" id="skip">Skip</button></div></div>
    <p class="sr" id="say" aria-live="polite"></p>
  </div>
  <div class="card" id="fin" hidden>
    <div class="done"><div class="mark" aria-hidden="true">✓</div>
      <nav><button type="button" class="again" id="again">Again</button><a class="go" href="${root}index.html">Done</a></nav></div>
  </div>
  <a class="corner" href="${root}analytics.html#${def.id}" aria-label="Analytics"></a>
</div>`;
    const $ = x => document.getElementById(x);
    const TAP = typeof def.ask === 'function';      // the exercise draws its own answer area
    const choices = def.choices || [];
    $('opts').hidden = TAP;
    $('opts').style.gridTemplateColumns = `repeat(${choices.length}, minmax(0, 1fr))`;
    $('opts').innerHTML = choices.map(c => `<button type="button" data-a="${c.id}">${c.label}</button>`).join('');
    const btns = Array.from($('opts').children);

    let SET, S, cur = null, lastIdea = null, shown = null;
    let state = 'ask', tick = 0, shownAt = 0, keyUsed = false;   // ask → right: wait → next | wrong: fix → OK → next
    const save = () => write(stateKey(def), S);

    // ---- choosing the next question ----
    function pick() {
      const R = S.run;
      if (R.open < (def.opening || []).length) { const o = def.opening[R.open]; return { kind: o.kind, item: o.item, mode: 'open' }; }
      const make = k => ({ kind: k, item: def.kinds[k].make() });
      const fixKind = i => R.need[i] >= 2 ? any(def.ideas[i].easy.length ? def.ideas[i].easy : def.ideas[i].hard) : (R.missed[i] || any(def.ideas[i].hard));
      // a missed idea first, unless it was just asked and something else can go between
      const needy = ideaIds(def).filter(i => R.need[i] > 0);
      const other = (S.warm && S.warm.length) || R.probe.length;
      const idea = needy.find(i => i !== lastIdea) || (needy.length && !other ? needy[0] : null);
      if (idea) return Object.assign(make(fixKind(idea)), { mode: 'fix' });
      if (S.warm && S.warm.length) return Object.assign(make(S.warm[0]), { mode: 'warm' });
      if (R.probe.length) return Object.assign(make(R.probe[0]), { mode: 'probe' });
      if (needy.length) return Object.assign(make(fixKind(needy[0])), { mode: 'fix' });
      return null;
    }

    // ---- grading; returns true when a right answer was too slow to count ----
    // chose: the picked choice id (buttons) or the error type ('right' when right) for tap answers
    function grade(chose, right, ms, want, pick) {
      const R = S.run, idea = def.kinds[cur.kind].idea;
      const slow = right && SET.speed > 0 && ms > SET.speed * 1000 && cur.mode !== 'open';
      S.log.push({ at: Date.now(), kind: cur.kind, idea, want, pick, txt: def.text(cur.item), chose, right, ms, mode: cur.mode, key: keyUsed, slow });
      R.answers++; lastIdea = idea;
      if (cur.mode === 'open') R.open++;
      if (slow) {                                   // ask this kind again later; nothing gained or lost
        if (cur.mode === 'probe') R.probe = R.probe.filter(k => k !== cur.kind).concat(cur.kind);
        if (cur.mode === 'warm') S.warm.push(S.warm.shift());
        save(); return true;
      }
      if (cur.mode === 'probe') R.probe = R.probe.filter(k => k !== cur.kind);
      if (cur.mode === 'warm') S.warm.shift();
      // progress = right answers against what's left; a miss costs as much as the penalty, so the bar visibly drops
      R.credit = Math.max(0, (R.credit || 0) + (right ? 1 : -SET.fix));
      if (right) { if (cur.mode === 'fix' && R.need[idea] > 0) R.need[idea]--; }   // only the penalty questions pay it off
      else { R.need[idea] = SET.fix; R.missed[idea] = cur.kind; }
      save(); return false;
    }

    // ---- progress bar; a drop shows as a red piece that drains away (like losing HP) ----
    function progress() {
      const done = S.run.credit || 0, left = remaining(def, S);
      const pct = done + left ? 100 * done / (done + left) : 100;
      const bar = $('bar'), hit = $('hit'), wrap = $('barWrap');
      if (shown !== null && pct < shown - 0.5) {
        bar.style.transition = 'none';
        hit.className = ''; hit.style.left = pct + '%'; hit.style.width = (shown - pct) + '%';
        hit.style.setProperty('--lost', (shown - pct) + '%');
        void hit.offsetWidth;
        hit.className = 'drain'; hit.style.width = '0';
        wrap.classList.add('hurt'); clearTimeout(progress.t);
        progress.t = setTimeout(() => wrap.classList.remove('hurt'), 900);
      }
      bar.style.width = pct + '%'; void bar.offsetWidth; bar.style.transition = '';
      shown = pct; wrap.setAttribute('aria-valuenow', Math.round(pct));
    }

    function finish() {
      const now = Date.now();
      if (!S.done) { S.done = true; S.doneAt = now; }
      if (S.warm) {
        // a clean check is final; a check with a miss runs again next session
        const missed = S.log.slice(-S.run.answers).some(x => x.mode !== 'open' && !x.right);
        S.warm = null; S.warmAt = now;
        if (missed) S.checkMissed = true; else { S.checkedAt = now; S.checkMissed = false; }
      }
      save(); progress();
      $('card').hidden = true; $('fin').hidden = false; $('again').focus();
    }
    function next() {
      progress();
      cur = pick();
      if (!cur) return finish();
      $('card').hidden = false; $('fin').hidden = true;
      if (TAP) def.ask($('q'), cur.item, respond, { mode: cur.mode });
      else $('q').innerHTML = def.render(cur.item);
      $('say').textContent = def.speak ? def.speak(cur.item) : def.text(cur.item);
      btns.forEach(b => { b.disabled = false; b.className = ''; });
      $('why').textContent = ''; $('okBtn').hidden = true;
      state = 'ask'; shownAt = performance.now(); keyUsed = !$('key').hidden;
    }
    // a = a choice id (buttons) or whatever the exercise's answer area submits (tap mode)
    function respond(a) {
      if (state !== 'ask') return;
      const want = TAP ? def.correct(cur.item) : answerOf(def, cur.kind, cur.item);
      const right = def.isRight ? def.isRight(cur.item, a) : a === want;
      const err = right ? null : TAP ? def.classify(cur.item, a, cur.kind) : a;
      const slow = grade(TAP ? (right ? 'right' : err) : a, right, Math.round(performance.now() - shownAt), want, TAP ? a : undefined);
      progress();
      if (right) {                                  // right: just say so, then move on
        state = 'wait';
        if (TAP) def.reveal($('q'), cur.item, a, { right: true, slow });
        else btns.forEach(b => { b.disabled = true; if (b.dataset.a === a) b.className = slow ? 'ok slow' : 'ok'; });
        $('say').textContent = slow ? 'Correct, but slow. It will come back.' : 'Correct.';
        if (def.nextOnRight) {                      // this exercise lets the result sit until the student clicks Next
          state = 'fix'; $('okBtn').textContent = 'Next'; $('okBtn').hidden = false; $('okBtn').focus();
        } else {
          const t = ++tick;
          setTimeout(() => { if (t === tick) next(); }, (TAP && def.revealMs) || 900);
        }
      } else {                                      // wrong: one cue + one sentence on why THIS pick is wrong, then OK
        state = 'fix';
        const [cue, say] = def.feedback(cur.item, want, a, cur.kind, err);
        if (TAP) def.reveal($('q'), cur.item, a, { right: false, cue, err });
        else {
          btns.forEach(b => { b.disabled = true; b.className = b.dataset.a === a ? 'no' : b.dataset.a === want ? 'want' : ''; });
          $('q').innerHTML = def.render(cur.item, cue);
        }
        $('why').innerHTML = say;
        $('okBtn').textContent = 'OK'; $('okBtn').hidden = false; $('okBtn').focus();
      }
    }

    btns.forEach(b => b.addEventListener('click', () => respond(b.dataset.a)));
    $('okBtn').addEventListener('click', () => { if (state === 'fix') next(); });
    const KEYMAP = {};
    choices.forEach((c, i) => [String(i + 1)].concat(c.keys || []).forEach(k => { KEYMAP[k.toLowerCase()] = c.id; }));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !$('key').hidden) { toggleKey(false); $('help').focus(); return; }
      if (e.metaKey || e.ctrlKey || e.altKey || !$('fin').hidden || state === 'tut') return;
      const a = KEYMAP[e.key.toLowerCase()];
      if (a) { e.preventDefault(); respond(a); }
    });

    // ---- the ? key (optional; opening it during a question is noted in the log) ----
    function buildKey() {
      $('key').innerHTML = (def.keyHTML || (def.key ? def.key.map(k => def.render(k.item, k.cue) + `<b>${k.label}</b>`).join('') : ''))
        + (def.tutorial ? '<button type="button" class="replay" id="replay">Replay tutorial</button>' : '');
      if (def.tutorial) $('replay').addEventListener('click', () => { toggleKey(false); runTutorial(); });
    }
    function configure() { SET = A.loadSettings(base); def = A.configured(base, SET); buildKey(); }
    function toggleKey(on) {
      $('key').hidden = !on; $('help').setAttribute('aria-expanded', String(on));
      if (on && state === 'ask') keyUsed = true;
    }
    $('help').addEventListener('click', e => { e.stopPropagation(); toggleKey($('key').hidden); });
    document.addEventListener('click', e => { if (!$('key').hidden && !$('key').contains(e.target)) toggleKey(false); });

    // a fresh pass; the answer log (analytics) and "tutorial seen" are kept
    function restart() { tick++; configure(); S.run = newRun(def, SET); S.warm = null; lastIdea = null; shown = null; save(); next(); }
    $('again').addEventListener('click', restart);
    // ↺ asks once ("Reset?") before it acts
    let armT;
    $('reset').addEventListener('click', () => {
      const b = $('reset');
      if (!b.classList.contains('armed')) {
        b.classList.add('armed'); b.textContent = 'Reset?';
        armT = setTimeout(() => { b.classList.remove('armed'); b.textContent = '↺'; }, 3000);
        return;
      }
      clearTimeout(armT); b.classList.remove('armed'); b.textContent = '↺';
      if (state === 'tut') { tutTick++; S.tut = S.tut || 'skipped'; $('tut').hidden = true; $('why').parentNode.hidden = false; $('opts').hidden = TAP; }
      restart();
    });

    // ---- tutorial: the exercise runs its own interactive steps in the question area; the engine gives
    //      a caption line, progress dots, Skip, and remembers it was seen (replay from the ? key) ----
    let tutTick = 0;
    function runTutorial() {
      tick++; const t = ++tutTick; state = 'tut';
      $('card').hidden = false; $('fin').hidden = true; $('opts').hidden = true;
      $('why').textContent = ''; $('okBtn').hidden = true; $('cap').innerHTML = ''; $('tut').hidden = false; $('why').parentNode.hidden = true;
      const api = {
        alive: () => state === 'tut' && t === tutTick,
        caption: html => { if (api.alive()) $('cap').innerHTML = html || ''; },
        step: (i, n) => { $('tdots').innerHTML = Array.from({ length: n }, (_, k) => `<i class="${k < i ? 'd' : k === i ? 'c' : ''}"></i>`).join(''); },
        done: () => endTutorial(false)
      };
      def.tutorial($('q'), api);
    }
    function endTutorial(skipped) {
      if (state !== 'tut') return;
      tutTick++; S.tut = skipped ? 'skipped' : 'done'; save();
      $('tut').hidden = true; $('why').parentNode.hidden = false; $('opts').hidden = TAP; state = 'ask';
      if (S.done && remaining(def, S) === 0) { progress(); $('card').hidden = true; $('fin').hidden = false; return; }
      next();
    }
    $('skip').addEventListener('click', () => endTutorial(true));

    function start() {
      tick++; configure(); S = loadState(def, SET); lastIdea = null; shown = null;
      $('help').hidden = !((def.key || def.keyHTML) && SET.key) && !def.tutorial; if ($('help').hidden) toggleKey(false);
      if (def.tutorial && SET.tutorial && !S.tut) { progress(); return runTutorial(); }
      // a later session after finishing: a quick check, one tricky kind per idea
      const since = Math.max(S.doneAt || 0, S.warmAt || 0);
      if (SET.check && S.done && !S.checkedAt && !S.warm && remaining(def, S) === 0 && Date.now() - since > WARM_AFTER) {
        S.warm = shuffle(ideaIds(def).map(i => any(def.ideas[i].hard)));
        S.run.answers = 0; S.run.credit = 0; save();
      }
      if (S.done && remaining(def, S) === 0) { progress(); $('card').hidden = true; $('fin').hidden = false; return; }
      next();
    }
    start();
    window.addEventListener('pageshow', e => { if (e.persisted) start(); });   // back from analytics
    if (/[?&]debug\b/.test(location.search)) window.ex = { S: () => S, cur: () => cur, get def() { return def; }, start, SET: () => SET, respond, state: () => state };
  };

  // =====================================================================
  // The analytics page (analytics.html#<id>)
  // =====================================================================
  A.analytics = function (base, el, back) {
    let def = base;                                  // re-made from the settings at each render (def.configure)
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const day = t => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const secs = ms => (ms / 1000).toFixed(ms < 10000 ? 1 : 0) + 's';
    const median = a => { if (!a.length) return null; const b = a.slice().sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
    const TAP = typeof def.ask === 'function', choices = def.choices || [];
    // what a pick is called: a button label, or (tap mode) the error type's label
    const NAME = Object.assign(Object.fromEntries(choices.map(c => [c.id, c.label])), def.errors || {});
    const IDEA = i => ((def.ideas[i] || base.ideas[i] || {}).name) || NAME[i] || i;
    let order = [];
    const ordered = () => choices.map(c => c.id).filter(i => def.ideas[i]).concat(ideaIds(def).filter(i => !choices.some(c => c.id === i)));
    let S, SET;

    el.innerHTML = `
  <div class="top"><a id="back" href="${back}" aria-label="Back">←</a><h1>${esc(def.title)}</h1></div>
  <section><div class="status" id="status"></div><div class="sub" id="sub"></div></section>
  <section><h2>By idea</h2><div class="ideas" id="ideas"></div>
    <div class="legend"><span><i></i>right</span><span><i class="no"></i>wrong</span><span><i class="slow"></i>right but slow</span><span><i class="warm"></i>next-session check</span><span><i class="key"></i>key was open</span></div></section>
  <section><h2>What to do</h2><ul class="notes" id="notes"></ul></section>
  <section><h2>Adjust</h2><div class="actions" id="actions"></div></section>
  <section><h2>Rules</h2><div class="rules" id="rules"></div></section>
  <details><summary>Every answer</summary><table id="log"></table></details>`;
    const $ = x => document.getElementById(x);
    if (document.referrer && document.referrer.includes(back.replace(/^\.\.?\//, ''))) $('back').addEventListener('click', e => { e.preventDefault(); history.back(); });
    const save = () => { if (S) write(stateKey(def), S); };

    function render() {
      SET = A.loadSettings(base); def = A.configured(base, SET); order = ordered(); S = read(stateKey(def));
      // ideas a rule has switched off still show if they have answers
      ((S && S.log) || []).forEach(x => { if (!order.includes(x.idea) && base.ideas[x.idea]) order.push(x.idea); });
      const log = (S && S.log) || [];
      if (!S || !log.length) {
        $('status').textContent = 'Not started'; $('status').className = 'status'; $('sub').textContent = '';
        $('ideas').innerHTML = ''; $('notes').innerHTML = '<li class="empty">Nothing yet.</li>'; $('log').innerHTML = '';
        actions(); rules(); return;
      }
      const R = S.run, needy = ideaIds(def).filter(i => R.need[i] > 0);
      Object.keys(R.need).forEach(i => { if (!def.ideas[i]) delete R.need[i]; });     // ideas switched off by a rule
      const left = remaining(def, S);

      // ---- status ----
      if (S.done && !left) {
        $('status').textContent = '✓ Passed'; $('status').className = 'status ok';
        $('sub').textContent = `${day(S.doneAt)} · ` + (S.checkedAt ? `next-session check passed ${day(S.checkedAt)}`
          : S.checkMissed ? `next-session check had a miss (${day(S.warmAt)}) · it runs again next session`
          : SET.check ? 'next-session check opens next time (8+ hours later)' : 'next-session check is off')
          + (def.tutorial ? ` · tutorial ${S.tut || 'not yet'}` : '');
      } else if (S.done) {
        $('status').textContent = S.warm && S.warm.length ? 'Next-session check in progress' : 'Extra practice in progress'; $('status').className = 'status';
        $('sub').textContent = `Passed ${day(S.doneAt)} · ${left} to go`;
      } else {
        $('status').textContent = 'In progress'; $('status').className = 'status';
        $('sub').textContent = `${log.length} answered · about ${left} to go` + (def.tutorial ? ` · tutorial ${S.tut || 'not yet'}` : '');
      }

      // ---- by idea ----
      $('ideas').innerHTML = order.map(i => {
        const xs = log.filter(x => x.idea === i);
        const dots = xs.slice(-24).map(x => `<i class="${x.right ? (x.slow ? 'slow' : '') : 'no'}${x.mode === 'warm' ? ' warm' : ''}${x.key ? ' key' : ''}" title="${esc(x.txt)}${x.right ? '' : ' → ' + esc(NAME[x.chose])}"></i>`).join('');
        const med = median(xs.filter(x => x.right).map(x => x.ms));
        const st = !def.ideas[i] ? '<span class="st">off</span>' : R.need[i] > 0 ? `<span class="st no">${R.need[i]} more</span>` : xs.length ? `<span class="st ok">✓${med ? ' · ' + secs(med) : ''}</span>` : '<span class="st">—</span>';
        return `<div class="idea"><b>${esc(IDEA(i))}</b><div class="dots">${dots}</div>${st}</div>`;
      }).join('');

      // ---- what to do: misses grouped by (right answer, pick), explained in plain words ----
      const notes = [], groups = {};
      log.filter(x => !x.right).forEach(x => { const k = TAP ? x.chose : (x.want || x.idea) + '>' + x.chose; (groups[k] = groups[k] || []).push(x); });
      Object.values(groups).sort((a, b) => b.length - a.length).forEach(g => {
        const x = g[g.length - 1], want = x.want || x.idea;
        // diagnose(want, picked, kind) for buttons; diagnose(errorType, kind) for tap answers
        const [what, todo] = def.diagnose ? (TAP ? def.diagnose(x.chose, x.kind) : def.diagnose(want, x.chose, x.kind)) : ['', ''];
        const after = log.filter(y => y.idea === x.idea && y.at > x.at).slice(-2);
        const fixed = after.length >= 2 && after.every(y => y.right);
        notes.push(`<li${fixed ? ' class="ok"' : ''}><span class="n">${esc(x.txt)}</span> → ${TAP ? '' : 'picked '}<b>${esc(NAME[x.chose] || x.chose)}</b>${g.length > 1 ? ` (${g.length}×)` : ''}${fixed ? ' · since fixed' : ''}
          ${what ? `<p>${what}</p>` : ''}${todo ? `<p class="do">${todo}</p>` : ''}</li>`);
      });
      const recent = log.slice(-12);
      if (recent.length >= 8 && recent.filter(x => !x.right).length / recent.length >= 0.4)
        notes.unshift('<li><b>Many misses in a row.</b><p>This may be guessing. Stop and ask “why?” after each answer, or go through the ? key together.</p></li>');
      const keyed = log.filter(x => x.key).length;
      if (keyed >= 2) notes.push(`<li><b>Answered ${keyed} with the key open.</b><p class="do">Those answers don’t show what they remember. Try a few with the key closed.</p></li>`);
      const med = median(log.filter(x => x.right).map(x => x.ms));
      if (S.done && med > 8000) notes.push(`<li><b>Right, but slow (typical ${secs(med)}).</b><p class="do">Fine to move on. Speed comes from later practice.</p></li>`);
      if (S.done && !left && S.checkMissed) notes.unshift('<li><b>Missed something on the next-session check.</b><p class="do">It was practiced right away and will be checked again next session. See below for what was missed.</p></li>');
      else if (S.done && !left) notes.unshift(`<li class="ok"><b>Ready for the next step.</b>${S.checkedAt || !SET.check ? '' : '<p class="do">A short check opens automatically next session.</p>'}</li>`);
      else if (!Object.keys(groups).length) notes.push('<li class="empty">No misses yet.</li>');
      $('notes').innerHTML = notes.join('');

      // ---- every answer ----
      $('log').innerHTML = log.slice().reverse().map(x =>
        `<tr><td class="n">${esc(x.txt)}</td><td class="${x.right ? '' : 'no'}">${TAP ? (x.right ? '✓' : '✗ ' + esc(NAME[x.chose] || x.chose)) : x.right ? '✓ ' + esc(NAME[x.chose]) : '✗ ' + esc(NAME[x.chose]) + ' (' + esc(NAME[x.want || x.idea] || '') + ')'}</td><td class="t">${secs(x.ms)}${x.slow ? ' · slow' : ''}${x.mode === 'warm' ? ' · check' : ''}${x.key ? ' · key' : ''}</td><td class="t">${day(x.at)}</td></tr>`).join('');
      actions(); rules();
    }

    // ---- adjustments ----
    function actions() {
      const a = $('actions'); a.innerHTML = '';
      const add = (label, fn, confirm) => {
        const b = document.createElement('button'); b.type = 'button'; b.textContent = label;
        b.addEventListener('click', () => {
          if (confirm && !b.classList.contains('armed')) { b.classList.add('armed'); b.textContent = label + '?'; setTimeout(() => { b.classList.remove('armed'); b.textContent = label; }, 3000); return; }
          fn(); save(); render();
        });
        a.appendChild(b);
      };
      if (S && S.run) {
        order.filter(i => def.ideas[i]).forEach(i => add('More ' + IDEA(i), () => { S.run.need[i] = SET.fix; S.run.missed[i] = S.run.missed[i] || any(def.ideas[i].hard); }));
        if (def.tutorial && S.tut) add('Show tutorial again', () => { S.tut = null; });
        if (!S.done) add('Mark passed', () => {
          S.done = true; S.doneAt = Date.now(); S.run.open = (def.opening || []).length; S.run.probe = [];
          ideaIds(def).forEach(i => { S.run.need[i] = 0; }); S.warm = null;
        }, true);
      }
      add('Start over', () => { S = null; drop(stateKey(def)); }, true);
    }

    // ---- rules (kept apart from progress; Start over leaves them alone) ----
    function rules() {
      const T = maxTricky(def), D = Object.assign({}, RULE_DEFAULTS, def.defaults || {});
      const RULES = [
        def.opening && ['intro', 'Opening examples', [[true, 'On'], [false, 'Off']], 'The contrast examples at the start.'],
        T > 1 && ['tricky', 'Tricky questions', Array.from({ length: T }, (_, k) => [k + 1, String(k + 1)]), 'Per idea. These are what count as passing.'],
        ['fix', 'Miss penalty', [[1, '1'], [2, '2'], [3, '3'], [4, '4']], 'After a miss: this many more right answers on that idea, and the progress bar drops as much. Higher discourages guessing.'],
        ['speed', 'Speed', [[0, 'Off'], [10, '10 s'], [6, '6 s']], 'A slower right answer doesn’t count yet and comes back later.'],
        ['check', 'Next-session check', [[true, 'On'], [false, 'Off']], 'A few quick questions the next time the page is opened.'],
        (def.key || def.keyHTML) && ['key', '? key', [[true, 'Shown'], [false, 'Hidden']], 'Examples to look back at.'],
        def.tutorial && ['tutorial', 'Tutorial', [[true, 'On'], [false, 'Off']], 'Runs once on the first visit. It can be replayed from the ? key.']
      ].concat(base.rules || []).filter(Boolean);           // the exercise's own rules: [key, label, [[value, text]…], help]
      const qs = (SET.intro && def.opening ? def.opening.length : 0) + probeList(def, SET.tricky).length;
      const same = RULES.every(([k]) => SET[k] === D[k]);
      $('rules').innerHTML = RULES.map(([k, label, opts, help]) =>
        `<div class="rule"><span>${label}</span><span class="seg" role="group" aria-label="${label}">${opts.map(([v, t]) =>
          `<button type="button" data-k="${k}" data-v='${JSON.stringify(v)}' aria-pressed="${SET[k] === v}">${t}</button>`).join('')}</span><small>${help}</small></div>`).join('') +
        `<div class="sum"><span>${qs} questions with no misses</span>${same ? '' : '<button type="button" id="defaults">Defaults</button>'}</div>`;
    }
    $('rules').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const D = Object.assign({}, RULE_DEFAULTS, def.defaults || {});
      SET = b.id === 'defaults' ? D : Object.assign(SET, { [b.dataset.k]: JSON.parse(b.dataset.v) });
      A.saveSettings(def, SET); render();
    });

    render();
    window.addEventListener('pageshow', e => { if (e.persisted) render(); });
  };
})();
