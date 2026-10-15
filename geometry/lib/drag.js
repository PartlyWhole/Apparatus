// Drag — number chips dragged (mouse or touch) into slots, or tap a chip then a slot; tapping a filled slot empties it.
// Chips: buttons with data-k (class .dchip). Slots: elements with data-s (class .dslot). Each chip fills one slot at a time.
//   Drag.wire({ chips, slots, show(slot, key | null), onChange(placed) }) → { placed, disable() }
//   placed: { slotName: chipKey }. show() draws a slot's content (the engine-free part is up to the exercise).
// Used by coords.js (Name the Coordinates). Styles: geo.css (.dchip, .dslot, .ghost, .sel, .used, .full, .over).
(function () {
  function wire(o) {
    const chips = o.chips, slots = o.slots, placed = {};
    let sel = null;
    const refresh = () => {
      slots.forEach(sl => { const k = placed[sl.dataset.s] || null; o.show(sl, k); sl.classList.toggle('full', !!k); });
      chips.forEach(c => { c.classList.toggle('used', Object.values(placed).includes(c.dataset.k)); c.classList.toggle('sel', c === sel); });
      o.onChange && o.onChange(placed);
    };
    const put = (chip, slot) => {
      for (const k in placed) if (placed[k] === chip.dataset.k) delete placed[k];
      placed[slot.dataset.s] = chip.dataset.k; sel = null; refresh();
    };
    const slotAt = ev => { const t = document.elementFromPoint(ev.clientX, ev.clientY); return t ? slots.find(sl => sl.contains(t)) || null : null; };
    slots.forEach(sl => sl.addEventListener('click', () => {
      if (sl.disabled) return;
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
    refresh();
    return { placed, disable() { chips.concat(slots).forEach(b => { b.disabled = true; }); } };
  }
  window.Drag = { wire };
})();
