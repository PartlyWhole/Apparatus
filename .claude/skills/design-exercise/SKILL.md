---
name: design-exercise
description: Design a new exercise for the Apparatus new set from the user's description — produce a spec (ideas, kinds, opening, feedback matrix, diagnose, rules, the bar) for approval before any code. Use when the user describes a new exercise, phase or tutorial.
---

# Design an exercise

1. **Read first:** `CLAUDE.md`, `docs/design/house-style.md`, `phase-anatomy.md`, `feedback.md`, `misconceptions.md`, `skill-map.md`, `decisions.md` (recent user preferences override older text), and the worked example `specs/sci-form.md`.
2. **Restate the skill** in one sentence: what the student can do after passing.
3. **Split into 2–4 ideas** (usually one per answer). If the answers aren't buttons (typing, counters, boards), note that the engine needs the `ask` extension (`engine.md` → Limits).
4. **Kinds:** for each idea, easy kinds and tricky kinds. For every tricky kind, name the wrong rule it catches. Ask: *what half-understood rule still gets the easy ones right?*
5. **Opening contrast set:** one item per idea, as alike as possible.
6. **Feedback matrix:** every (right, picked) pair → cue + one sentence about why the *picked* answer is wrong. No empty cells.
7. **Diagnose:** every pair → what it usually means + one 30-second tutor move. Reuse `misconceptions.md` entries; add new ones as "expected".
8. **The bar:** questions with no misses; chance of passing by guessing; which half-rules fail which tricky kinds.
9. Write `specs/<id>.md` from `docs/design/spec-template.md`, add the exercise to `skill-map.md` as "designing".
10. **Show the user the spec** (short summary + open questions). Visual first: describe what the student sees, not the code. Don't build until they approve; then use `build-exercise`.

Keep the user's style: minimal, visual, text only when truly necessary, few problems.
