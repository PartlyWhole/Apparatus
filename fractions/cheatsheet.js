// A small "Cheat sheet" button with conversions students don't need to memorize.
// window.cheatsheet.show(false) hides it (pages show it only during conversion problems).
(function () {
  const FACTS = [['1 ft', '0.3048 m'], ['1 mi', '1.609 km'], ['1 mi', '1,609 m'], ['1 gal', '3.785 L']];
  const css = document.createElement('style');
  css.textContent = `
.cs-btn { position: fixed; right: 16px; bottom: 16px; z-index: 20; height: 36px; padding: 0 14px; border-radius: 999px; border: 0;
  background: var(--surface); color: var(--muted); box-shadow: 0 0 0 1px var(--line); font: 600 0.85rem var(--f-body, system-ui); cursor: pointer; }
.cs-btn:hover, .cs-btn[aria-expanded="true"] { color: var(--accent); box-shadow: 0 0 0 1.5px var(--accent); }
.cs-panel { position: fixed; right: 16px; bottom: 60px; z-index: 20; margin: 0; padding: 12px 16px; border-radius: 14px; background: var(--surface);
  box-shadow: 0 0 0 1px var(--line), 0 10px 30px rgba(10, 20, 40, 0.12); display: grid; grid-template-columns: auto auto auto; gap: 6px 10px;
  font-family: var(--f-mono, monospace); font-size: 0.95rem; color: var(--ink); }
.cs-panel span:nth-child(3n+2) { color: var(--muted); }
.cs-btn[hidden], .cs-panel[hidden], .cs-room[hidden] { display: none; }
.cs-room { height: 56px; }
@media (min-width: 1280px) { .cs-room { display: none; } }`;
  document.head.appendChild(css);
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'cs-btn'; btn.textContent = 'Cheat sheet'; btn.setAttribute('aria-expanded', 'false');
  const panel = document.createElement('div');
  panel.className = 'cs-panel'; panel.hidden = true; panel.setAttribute('role', 'note');
  panel.innerHTML = FACTS.map(([a, b]) => `<span>${a}</span><span>=</span><span>${b}</span>`).join('');
  // room at the end of the page, so the button never sits on top of the last thing there
  const room = document.createElement('div');
  room.className = 'cs-room'; room.setAttribute('aria-hidden', 'true');
  btn.addEventListener('click', () => { panel.hidden = !panel.hidden; btn.setAttribute('aria-expanded', String(!panel.hidden)); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) btn.click(); });
  document.body.append(room, panel, btn);
  window.cheatsheet = { show(on) { btn.hidden = room.hidden = !on; if (!on) { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); } } };
})();
