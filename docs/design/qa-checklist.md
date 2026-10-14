# QA checklist

Run before every deploy of a new or changed exercise. Report anything that fails; don't ship around it.

## Content

- [ ] **Feedback matrix complete:** every (right, picked) pair has its own cue and sentence, and each one is about why the *picked* answer is wrong (`feedback.md`). Click through every cell in the browser, not just in code.
- [ ] Every generator produces only items of its kind (run each `make()` 200× and check: e.g. no "fake" with one digit before the point, no trailing zeros, no 0 as the only digit).
- [ ] Each tricky kind catches a specific wrong rule (written in the spec).
- [ ] `diagnose` covers every (right, picked) pair, in plain words, with one concrete tutor move.

## Flow (simulate with `?debug`, which exposes `window.ex`)

- [ ] Perfect student: question count = opening + tricky probes (9 for sci-form).
- [ ] Student with misses: each miss adds the right follow-ups; never the same idea twice in a row when something else is pending; finishes.
- [ ] Next-session check: age `doneAt` by 9 h and `start()`: clean → `checkedAt` set and no more checks; a miss → `checkMissed` and it runs again next session.
- [ ] Rules: each option changes behavior (opening off, 1 tricky, fix 1/3, speed on with a faked slow answer, check off, key hidden); loosening applies now.
- [ ] Analytics shows the right status, dots, notes and "since fixed" for each scenario; Start over and Mark passed confirm first.

Simulation sketch:

```js
const w = ms => new Promise(r => setTimeout(r, ms)), want = c => ex.def.answer ? ex.def.answer(c.item, c.kind) : ex.def.kinds[c.kind].idea;
for (let i = 0; i < 40 && document.getElementById('fin').hidden; i++) {
  const c = ex.cur(), a = want(c);                       // or pick a wrong answer to test misses
  document.querySelector(`#opts button[data-a="${a}"]`).click();
  await w(950);                                          // after a miss: click #okBtn instead
}
```

## Interaction order (bugs we've hit before)

- [ ] Answering twice quickly, pressing keys during the 0.9 s after a right answer, Enter on OK, Esc with the cheat sheet open.
- [ ] Back from analytics (bfcache) shows the current state, not a stale one.
- [ ] Again / Start over during a pending auto-advance.

## Tutorial (if any)

- [ ] Walk every step with real clicks (not just JS): each advances on the action; captions appear after the action; Skip works mid-animation; Replay from ? and "Show tutorial again" in analytics work; a wrong try in the last step lets them try again.

## Look

- [ ] No exercise class name collides with an engine class (`.done`, `.card`, `.key`, `.fix`, `.tut`, `.bar`, `.opts`…).

- [ ] Phone width (375 px, and 320 px): no horizontal scroll; the longest item plus its cue fits.
- [ ] Light and dark; reduced motion; keyboard only; screen reader text sensible.
- [ ] The progress hit is visible (red piece drains; bar thickens), and it never flashes on Again.

## Deploy

- [ ] `?v=N` bumped on any changed CSS/JS URL (engine and exercise).
- [ ] Linked from `index.html` and `exercises.html`.
- [ ] Live URL shows the change (curl for a marker string) before reporting done.
- [ ] Docs updated if behavior or a rule changed (`update-design-docs`).
