---
name: build-exercise
description: Build an approved Apparatus exercise spec on the shared engine (exercises/<id>.js + .html), test it with simulations and in the browser, link it, and deploy. Use after a spec in specs/ is approved.
---

# Build an exercise

1. **Read:** the spec `specs/<id>.md`, `docs/design/engine.md`, `qa-checklist.md`, and `exercises/sci-form.js` / `.html` as the pattern.
2. **Definition** `exercises/<id>.js`: `Apparatus.define({...})` with choices, ideas (key order = interleave order), kinds with generators, opening, render(item, cue), text, speak, feedback, diagnose, key. Comment the non-obvious bits, matching sci-form's density.
3. **Page** `exercises/<id>.html`: copy sci-form.html; replace the `<style>` with this exercise's item visuals and cue classes; script names; `Apparatus.mount('<id>')`.
4. **If the engine must change** (a new answer mode, a new rule): change `engine/exercise.js`/`.css` generically, update `docs/design/engine.md`, bump `?v=` everywhere they're loaded, and re-test sci-form.
5. **Test** (`qa-checklist.md`): generators 200×; perfect student; student with misses; next-session check; every rule; every feedback cell clicked in the browser; analytics for each scenario; phone width, dark, keyboard.
   - Local preview: serve the repo root over HTTP (e.g. `python3 -m http.server`) — pages load scripts, so `file://` won't do. If the preview tool can't read the folder, copy the site to the scratchpad and serve that.
   - Screenshots in the preview pane lag; verify timing-based visuals (the progress hit) by sampling in JS.
6. **Link** from `index.html` and `exercises.html`; update `skill-map.md` (status live) and the spec status.
7. **Deploy** with the `deploy` skill. Report what the student sees, the question count, and what you verified — briefly.
