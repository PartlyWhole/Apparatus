# Feedback after a miss

## The rule

**Explain why the answer the student picked is wrong**, not why the right answer is right. One cue on the item, one plain sentence. The right answer is already shown by the green button.

> The correction that set this rule: on 849.2 × 10⁴ the student picked **Decimal**, and the page boxed the three digits ("too many digits for scientific"). That answers a question the student didn't ask. The student's mistake was missing the power of ten, so the cue should underline × 10⁴ and say "It has × 10⁴, so it's not a decimal."

## The feedback matrix

Every exercise spec lists **every (right answer, picked answer) pair** with its cue and sentence. With k choices there are k × (k − 1) cells; none may be left to a default. Example (`sci-form`):

| Right | Picked | Cue on the item | Sentence |
|---|---|---|---|
| Neither | Decimal | × 10ⁿ underlined green | It has × 10⁴, so it's not a decimal. |
| Neither | Scientific | digits before the point boxed red | There are 3 digits (849) before the point. Scientific notation has just one. |
| Scientific | Decimal | × 10ⁿ underlined green | It has × 10³, so it's not a decimal. |
| Scientific | Neither | the one digit boxed green, × 10ⁿ underlined | One digit (4) before the point, then × 10³. That's scientific notation. |
| Decimal | Scientific | crossed-out "× 10?" slot | There's no × 10ⁿ, so it's not scientific notation. |
| Decimal | Neither | crossed-out "× 10?" slot | There's no × 10ⁿ. A plain number is a decimal. |

## Tap answers: an error-type matrix

When the student taps or drags instead of picking a button, list **error types** instead of (right, picked) pairs: every way an answer can be wrong, how to detect it (`classify`), the cue, and the sentence. Example (`point-move`):

| Error | Detected when | Sentence |
|---|---|---|
| dir | positive power, moved the wrong way | × 10² makes it bigger, so the point moves right. |
| sign | negative power, moved as if positive | 10⁻² means ÷ 10², so the point moves left. / Dividing by 10⁻² is × 10², so the point moves right. |
| count | right way (or no move), wrong number of places | × 10³ moves the point 3 places, not 2. |
| zero | 10⁰, but moved | 10⁰ is 1, so the point doesn't move. |

The cue for every error is the same: the correct hops animate (numbered arcs under the digits, the point dipping along them) and the tapped spot is marked red; for negative and zero powers the operator's "flip" (× 10⁻² = ÷ 10²) appears under the question.

## Cues

A cue is a CSS class on the item that lights up exactly one deciding feature. Keep a small, consistent vocabulary:

| Meaning | Look |
|---|---|
| "This part is the problem" | red outline + light red fill on the part (each digit boxed separately, so it can be counted) |
| "This part is present / fine" | green underline or green outline |
| "Something is missing here" | a dashed ghost slot where it would be, struck through in red |

Rules: one feature per cue; never cover the item; works in light and dark; no motion beyond a short fade.

## Sentences

- One sentence (two short ones at most). Name the actual digits or numbers from this item.
- Pattern: *[the feature they missed], so [why the pick fails].* "It has × 10⁴, so it's not a decimal."
- Plain words, present tense, no "you", no "Oops", no "Remember…".
- Don't explain the whole rule; the next items do the teaching.

## Right answers

No cue, no sentence. The button turns green with ✓ and the page moves on (`house-style.md`).
