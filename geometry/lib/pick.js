// Pick — a row of choice buttons (the .gmc styles in geo.css); keys 1–n pick too.
//   Pick.ask(host, [[id, html]], submit(id), { cols, off }) → { el, buttons, stop() }
//     appends <div class="gmc"> to host; a click or key 1–n sends the id once and disables the buttons.
//     cols: grid columns (default: one per choice). off: ids shown faded and disabled (already tried).
//     Keys are ignored while typing in a box, and once host leaves the page.
//   Pick.mark(host, want, picked, right) — the picked button ✓ (right) or red (wrong); want, when given and
//     not right, turns green (a reveal). Pass want = null to mark only the pick (fixing in place: don't reveal).
// Lifted from parallel-perp.js (askPick / reveal). Used by steps.js and the G12 name.
(function () {
  function ask(host, choices, submit, o = {}) {
    const off = (o.off || []).map(String);
    const el = document.createElement('div');
    el.className = 'gmc';
    el.style.setProperty('--k', o.cols || choices.length);
    el.innerHTML = choices.map(([id, h]) => `<button type="button" data-a="${id}"${off.includes(String(id)) ? ' class="tried" disabled' : ''}>${h}</button>`).join('');
    host.appendChild(el);
    const buttons = Array.from(el.querySelectorAll('button'));
    let live = true;
    const stop = () => { live = false; document.removeEventListener('keydown', keys); };
    const send = id => { if (!live) return; stop(); buttons.forEach(b => { b.disabled = true; }); submit(id); };
    function keys(e) {
      if (!el.isConnected) return stop();
      if (e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      const b = buttons[+e.key - 1];
      if (b && !b.disabled) { e.preventDefault(); send(b.dataset.a); }
    }
    buttons.forEach(b => b.addEventListener('click', () => send(b.dataset.a)));
    document.addEventListener('keydown', keys);
    return { el, buttons, stop };
  }
  function mark(host, want, picked, right) {
    picked = picked == null ? picked : String(picked);
    host.querySelectorAll('.gmc button').forEach(b => {
      const a = b.dataset.a;
      b.classList.remove('ok', 'want', 'no');
      if (a === picked) b.classList.add(right ? 'ok' : 'no');
      else if (want != null && a === String(want) && !right) b.classList.add('want');
    });
  }
  window.Pick = { ask, mark };
})();
