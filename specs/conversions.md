# Conversions  (`conversions`)

Status: live · Skill map: after Factor Out and Factor In · Code: `exercises/conversions.js` (+ `lib/places.js` for feedback pictures)

## What the student learns
Convert decimal ↔ scientific notation without the hop tool: first by recognizing the right answer, then by writing it.

## Ideas (both directions, big and small)
`s+` big → scientific, `d+` scientific → big, `s-` small → scientific, `d-` scientific → small. Each idea's tricky list is [multiple choice, written], so round 1 = four multiple-choice questions, round 2 = four written ones. 8 questions with no misses. A miss's penalty questions are multiple choice, then the missed kind.

## Multiple choice (4 options, decided with the user)
The answer, one close answer the same direction (one place off), and the same two the wrong direction (sign flipped). For 895: 8.95 × 10², 8.95 × 10¹, 8.95 × 10⁻², 8.95 × 10⁻¹. For 8.28 × 10³: 8,280, 828, 0.00828, 0.0828. Keys 1–4.

## Written
Scientific → decimal: one field. Decimal → scientific: a number field and an exponent field; the exponent's sign is a + / − toggle beside it (the field holds digits only; typing "-" flips the toggle). Check (or Enter); blank or non-numeric fields shake and aren't graded. Commas allowed; 4.50 = 4.5.

## Error types and feedback
| Error | Sentence |
|---|---|
| dir (sign) | 670 is big, so the power is positive. / × 10⁻³ makes it smaller: the point moves left. |
| count | The point hops 3 places: 4,500 = 4.5 × 10³. / × 10³ moves the point 3 places: 8,280. |
| digits | The digits stay 4, 5; only the point moves. |
| form (written) | Scientific notation has one digit before the point: 4.5. |

Cue: the right option turns green (picked one red), or the fields turn red with "= answer"; and a picture of the hops between the two forms (the original number's leftover zeros light).
