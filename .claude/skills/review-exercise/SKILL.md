---
name: review-exercise
description: Audit an Apparatus exercise against the house style, the feedback-matrix rule, the flow, and interaction-order bugs; report findings before fixing. Use when asked to review, check, or look for bugs in an exercise.
---

# Review an exercise

1. **Read:** `docs/design/qa-checklist.md`, `feedback.md`, `house-style.md`, the exercise's spec and code.
2. **Feedback matrix first** (the most common real bug): for every (right, picked) pair, is the cue and sentence about why the *picked* answer is wrong? Click each cell in the browser.
3. **Generators:** run each kind 200×; every item must belong to its kind.
4. **Flow:** simulate perfect, with misses, next-session check, each rule (`?debug` → `window.ex`).
5. **Interaction order:** double answers, keys during auto-advance, Enter/Esc, back from analytics, Again during a pending advance.
6. **Look:** 320/375 px, dark, reduced motion, keyboard, screen-reader text; text kept to the minimum (`house-style.md`).
7. **Report** findings ranked by severity with a concrete failure for each, then fix what the user approves (or fix obvious bugs directly if they asked you to). Deploy fixes with `deploy`; record any new rule with `update-design-docs`.
