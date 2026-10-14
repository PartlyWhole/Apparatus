# Anatomy of an exercise

How every exercise in the new set is structured, so that it uses **few problems** and still holds a **real bar** (one a lucky guesser or a half-understood rule can't pass). The engine implements all of this; a definition only supplies the content (`engine.md`).

## 1. Ideas

Split the skill into **2–4 ideas**: the separate things a student must get right. Usually one per answer choice.

> Scientific or Not: *no power of ten → decimal*; *one digit before the point → scientific*; *more than one → neither*.

Mastery is tracked per idea, not per question type.

## 2. Kinds (easy and tricky)

For each idea, list the **kinds** of item that test it, each with a random generator:

- **Easy kinds:** the clean, obvious case (4,560; 4.56 × 10³; 45.6 × 10²). Used only after a miss.
- **Tricky kinds:** the cases that catch a half-understood rule (3.25 looks like the front of scientific; 10.5 × 10³ almost passes; negative powers; 7 × 10⁵ with no point). **These are what passing means.**

Design tricky kinds by asking: *what wrong rule would still get the easy ones right?* Each tricky kind should catch one wrong rule.

## 3. The flow

0. **Tutorial** (optional; for genuinely new ideas): an interactive walk-through on the first visit, before the exercise. See section 3a.
1. **Opening contrast set** (optional, on by default): one item per idea, as similar as possible, so only the deciding feature differs (4.56 × 10³ / 45.6 × 10² / 4,560). This is the "safe introduction".
2. **Tricky probes:** each idea's tricky kinds, interleaved so the same idea never comes twice in a row. A right answer on a tricky kind vouches for that idea's easy kinds.
3. **After a miss on an idea:** that idea needs `fix` more right answers (default 2): first an easy kind, then the kind that was missed (with new numbers). Other ideas are interleaved in between when available.
4. **Passed** when the opening and every tricky probe are done, and no idea still needs fixing.
5. **Next-session check:** the first time the page is opened 8+ hours after passing, one quick question per idea (a tricky kind). Clean → final. A miss → practiced right away, and the check runs again next session.

With defaults a student who understands answers **opening + 2 × ideas** questions (9 for sci-form's three ideas, 11 for point-move's four).

**Twists:** an idea marked `late` (e.g. ÷ 10⁻ⁿ and 10⁰ in point-move) has its probes after everything else: the "twist" after the main ideas are solid.

## 3a. Tutorials

Use one only when the idea is new to the student (a tutorial adds nothing for conventional things; `evidence.md`). Rules, from the guidance research:
- **Do, don't read:** every step is an action on the real visual (press × 10, watch the point hop). Advance on the action, never on a timer.
- **Caption after the action**, naming what they just saw, ≤ 8 words ("× 10: the point moves one place right."). The only instruction allowed is for a non-obvious interaction ("Tap where the point lands.").
- **≤ 5 steps**, progress dots, Skip always visible, Replay from the ? key.
- **Can't be failed:** a wrong try shows the answer and lets them try again.
- The last step is the exercise's own answer interaction, so the exercise starts with no surprises.

**Fading scaffolds:** support shown in the tutorial and the opening (point-move's faint zeros) is removed for the tricky questions; what remains is a live preview of the student's own move (the zeros their point would need), never the answer.

## 4. Why this bar holds (guessing)

With k choices a guess is right 1/k of the time. To pass, a guesser must get the opening and every tricky probe right, and two in a row after any miss. For 3 choices and 9 questions that's (1/3)⁹ ≈ 0.005%. A student with a half-rule ("× 10ⁿ means scientific") fails the tricky kinds that target that rule. If you add an idea or change the probe count, redo this arithmetic in the spec.

## 5. Tutor rules

A tutor can change: opening on/off, tricky questions per idea, right answers needed after a miss (1–3), a speed limit (off / 10 s / 6 s), the next-session check, and the ? key (`analytics.md`). Defaults are in `engine/exercise.js` (`RULE_DEFAULTS`); an exercise may override them in its definition.

## 6. What's a default, not a finding

The *structure* (per-idea evidence, tricky probes, interleaving, a delayed check) is well supported (`evidence.md`). The *numbers* (2 tricky per idea, 2 after a miss, 8 hours, 3-question check) are reasonable choices to tune from real students' analytics.
