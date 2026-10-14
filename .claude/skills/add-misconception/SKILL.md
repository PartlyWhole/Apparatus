---
name: add-misconception
description: Turn an observed or reported miss pattern into feedback, analytics advice and a misconception-library entry for an Apparatus exercise. Use when the user reports what a student did wrong, or shares a screenshot of a wrong answer.
---

# Add a misconception

1. Identify the (right answer, picked answer, kind) and the **likely wrong rule** behind it.
2. **Feedback:** check that the exercise's cue + sentence for that pair addresses why the *picked* answer is wrong (`docs/design/feedback.md`). Fix the `feedback` function and the spec's matrix if not.
3. **Diagnose:** update `diagnose` for that pair — what it usually means + one 30-second tutor move, in plain words. Branch on the kind if the same pick means different things.
4. **Tricky kind:** if no tricky kind catches this wrong rule, propose one to the user.
5. **Library:** add or update the row in `docs/design/misconceptions.md`; mark it **seen** with the date when it came from a real student or the user's test.
6. Deploy (`deploy`), and add a line to `docs/design/decisions.md` if a rule changed.
