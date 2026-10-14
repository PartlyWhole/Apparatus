# Factor Out  (`factor-out`)

Status: live · Skill map: after Moving the Point; before Conversions · Code: `exercises/factor-out.js` (+ `lib/places.js`)

## What the student learns
Rewrite a decimal in scientific notation by moving the point to just after the first non-zero digit; each hop left takes a 10 out into the power (× 10¹ more), each hop right a 10⁻¹. The equals sign stays: it's the same number.

## The visual
"4,500 =" above; the number on its row of places; the power of ten rides at the end of the row and counts live as the point is previewed. Trailing zeros that end up after the point fade away (4500. → 45. → 4.5), so the row always reads as written on paper ("4.5 × 10³"). The student drags/taps the point where it belongs and commits. Matches paper: draw hop arcs under the number to after the first digit, count them, write × 10 to that count (positive if the number got smaller).

## Ideas and kinds
| Idea | Easy | Tricky |
|---|---|---|
| big (10ⁿ) | 45 → 4.5 × 10¹ | 4,500 → 4.5 × 10³ (whole, zeros); 352.7 → 3.527 × 10² |
| small (10⁻ⁿ) | 0.35 → 3.5 × 10⁻¹ | 0.0035 → 3.5 × 10⁻³; 0.0408 → 4.08 × 10⁻² |
| ready (late twist) | 6.2 → 6.2 × 10⁰ (commit without moving) | same |

Opening: 4,500 and 0.0045 (same digits). 7 questions with no misses.

## Feedback (error types)
| Error | Sentence |
|---|---|
| many: 2+ digits before the point | There are 2 digits (45) before the point. Scientific notation has just one. |
| zero: 0 before the point | Now there's a 0 before the point. Scientific notation needs one digit from 1 to 9 there. |

Cue: the picked point (red, with its light zeros), then the right move replays: hops under the digits, a "10" sliding into the power each hop, the power ticking up; then "= 4.5 × 10³". Right answers wait for Next.

## Tutorial (4 steps)
Drag left (caption: "Each hop left takes out a 10.") → make it 4.5 ("4,500 = 4.5 × 10³") → drag right ("Each hop right takes out a 10⁻¹.") → make it 4.5 ("0.0045 = 4.5 × 10⁻³").
