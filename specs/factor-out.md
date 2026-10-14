# Factor Out  (`factor-out`)

Status: live · Skill map: after Moving the Point; before Conversions · Code: `exercises/factor-out.js` (+ `lib/places.js`)

## What the student learns
Rewrite a decimal in scientific notation by moving the point to just after the first non-zero digit; each hop left takes a 10 out into the power (× 10¹ more), each hop right a 10⁻¹. The equals sign stays: it's the same number.

## The visual
"4,500 =" above; the number on its row of places; the power of ten rides at the end of the row and counts live as the point is previewed. The previewed number is one color, so it reads as one number (0.00045, not "0.000" + "45"). The original trailing zeros that end up after the point stay visible but ghosted (4.5 + ghosted 00), since they're no longer part of the written number; the power sits after them. The student drags/taps the point where it belongs and commits. Matches paper: draw hop arcs under the number to after the first digit, count them, write × 10 to that count (positive if the number got smaller).

## Writing the power (after the opening)
In the tutorial and the two opening questions the power counts live. After that it's hidden while the point moves, so the student can't just click the right spot without counting: once the point is in the right place, the row shows **× 10^[+][ ]** and the student writes the power: a + / − toggle for the sign, digits in the field; Enter or Check. A wrong place is graded as before; a wrong power is a miss (sign or count) and replays the hops with the power counting.

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
| sign: power with the wrong sign | 8,900 got smaller (8.9), so the power is positive: × 10³. |
| count: power, wrong number of hops | The point hopped 3 places: × 10³. (6.2: The point didn't move, so it's × 10⁰.) |

Cue: the picked point (red, with its light zeros), then the right move replays: hops under the digits, a "10" sliding into the power each hop, the power ticking up; then "= 4.5 × 10³". Right answers wait for Next.

## Tutorial (4 steps)
Drag left (caption: "Each hop left takes out a 10.") → make it 4.5 ("4,500 = 4.5 × 10³") → drag right ("Each hop right takes out a 10⁻¹.") → make it 4.5 ("0.0045 = 4.5 × 10⁻³").
