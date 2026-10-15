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
    // the slot under the pointer, or the nearest one within 36 px (a drop just outside still lands)
    const slotAt = ev => {
      const t = document.elementFromPoint(ev.clientX, ev.clientY), hit = t ? slots.find(sl => sl.contains(t)) : null;
      if (hit) return hit;
      let best = null, bd = 36;
      slots.forEach(sl => { const r = sl.getBoundingClientRect(), dx = Math.max(r.left - ev.clientX, 0, ev.clientX - r.right), dy = Math.max(r.top - ev.clientY, 0, ev.clientY - r.bottom), d = Math.hypot(dx, dy); if (d < bd) { bd = d; best = sl; } });
      return best;
    };
    slots.forEach(sl => sl.addEventListener('click', () => {
      if (sl.disabled) return;
      if (sel) put(sel, sl); else if (placed[sl.dataset.s]) { delete placed[sl.dataset.s]; refresh(); }
    }));
    chips.forEach(c => {
      c.addEventListener('click', () => { if (c._dragged) { c._dragged = false; return; } sel = sel === c ? null : c; refresh(); });
      c.addEventListener('pointerdown', e => {
        if (c.disabled || e.button > 0) return;
        const x0 = e.clientX, y0 = e.clientY; let ghost = null, last = e, over = false;
        try { c.setPointerCapture(e.pointerId); } catch (_) {}
        const move = ev => {
          last = ev;
          if (!ghost && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 6) return;
          if (!ghost) { ghost = c.cloneNode(true); ghost.className = 'dchip ghost'; document.body.appendChild(ghost); }
          ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px';
          slots.forEach(sl => sl.classList.toggle('over', sl === slotAt(ev)));
        };
        // the drag always ends: pointer up anywhere, cancel, losing the capture, or the window losing focus
        const end = (ev, drop) => {
          if (over) return; over = true;
          c.removeEventListener('pointermove', move); window.removeEventListener('pointermove', move);
          ['pointerup', 'pointercancel'].forEach(t => { c.removeEventListener(t, up); window.removeEventListener(t, up); });
          c.removeEventListener('lostpointercapture', lost); window.removeEventListener('blur', blur);
          slots.forEach(sl => sl.classList.remove('over'));
          if (!ghost) return;
          ghost.remove(); c._dragged = true; setTimeout(() => { c._dragged = false; }, 0);
          const sl = drop && slotAt(ev && ev.clientX != null ? ev : last); if (sl) put(c, sl); else refresh();
        };
        const up = ev => end(ev, ev.type === 'pointerup'), lost = ev => end(last, true), blur = () => end(last, false);
        c.addEventListener('pointermove', move); window.addEventListener('pointermove', move);
        ['pointerup', 'pointercancel'].forEach(t => { c.addEventListener(t, up); window.addEventListener(t, up); });
        c.addEventListener('lostpointercapture', lost); window.addEventListener('blur', blur);
      });
    });
    refresh();
    return { placed, disable() { chips.concat(slots).forEach(b => { b.disabled = true; }); } };
  }
  window.Drag = { wire };
})();
