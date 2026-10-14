# Exercise design docs

How to design and build exercises in the new set (`exercises/`). These are **living documents**: they describe current decisions, and they change as we learn. See "Maintaining these docs" below.

## What to read for each task

| Task | Read | Then |
|---|---|---|
| Design a new exercise | `house-style.md`, `phase-anatomy.md`, `feedback.md` | fill `spec-template.md` → `specs/<id>.md` |
| Build it | `engine.md`, the spec | `qa-checklist.md` |
| Review or fix an exercise | `qa-checklist.md`, `feedback.md` | the exercise's spec |
| Add advice for a miss pattern | `misconceptions.md`, `feedback.md` | the exercise's `diagnose` |
| Justify a design choice | `evidence.md` | `decisions.md` |
| Place an exercise in the sequence | `skill-map.md` | |
| Change how analytics or rules work | `analytics.md`, `engine.md` | |

## Files

- `house-style.md` — the look and the interaction rules (what the student sees and does)
- `phase-anatomy.md` — how an exercise is structured: ideas, kinds, opening, tricky probes, fixing a miss, the next-session check, passing
- `feedback.md` — the feedback matrix: cue + sentence for every (right answer, picked answer) pair
- `misconceptions.md` — what a miss usually means, and what a tutor can do, by topic
- `engine.md` — the shared engine and how to write an exercise definition
- `analytics.md` — the analytics page, the answer log, tutor rules
- `qa-checklist.md` — what to test before deploying
- `spec-template.md` — the spec to fill in before writing code
- `skill-map.md` — the exercises in order and what each builds on
- `evidence.md` — the research behind the design, graded by strength
- `decisions.md` — dated log of decisions and user corrections (newest first)

Worked example: `specs/sci-form.md` + `exercises/sci-form.js` + `exercises/sci-form.html`.

## Maintaining these docs

- **They describe the present.** When a decision changes, edit the doc in place (don't append "update:" notes), and add one dated line to `decisions.md` saying what changed and why.
- **User corrections are the most valuable input.** When the user corrects a design ("the feedback should be about what I picked"), capture the *rule*, not just the fix, in the right doc, with the example.
- **Code and docs move together.** If the engine changes, `engine.md` changes in the same commit.
- **Keep them short.** Prefer a rule plus one example over paragraphs. Delete what's no longer true.
- **Mark confidence.** Numbers we chose (9 questions, 8 hours, 2 after a miss) are defaults to tune, not findings; say so.
