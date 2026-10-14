# Moving the Point  (`point-move`)

Status: live · Skill map position: after Scientific or Not (`sci-form`); before factoring out powers of ten · Code: `exercises/point-move.js`, `exercises/point-move.html`

Decided with the user (2026-10-14): tutor rule **Dividing**, off by default — off means only × 10ⁿ, × 10⁻ⁿ and × 10⁰ (7 questions; the opening is 3.52 × 10², 3.52 × 10⁻²; the tutorial moves left with × 10⁻¹; no "flip" and no division wording), on adds the ÷ ideas (11 questions). Hops are drawn under the digits. A right answer waits for Next. Tap to answer; the point moves (not the digits); faint zeros fade to dots after the tutorial and opening; ÷ 10⁻ⁿ and 10⁰ included as a late twist, taught by the operator "flip".

## What the student learns
Multiplying or dividing by a power of ten moves the decimal point: × 10ⁿ moves it n places right, ÷ 10ⁿ moves it n places left, and × 10⁻ⁿ is the same as ÷ 10ⁿ (left). Empty places become zeros; a whole number's point is at its end.

## The visual model (used in the tutorial and every question)
The number sits on a row of place slots. Its digits are solid; empty slots on both sides show faint zeros. The decimal point sits in a gap between slots. Multiplying or dividing makes the point **hop** gap by gap (one arc per hop, numbered 1, 2, 3). Faint zeros the point passes become solid. Digits never change; only the point moves.

```
  ·  ·  3 . 5  2  ·  ·          3.52
  ·  ·  3   5  2 .·  ·          × 10² → point hops 2 → 352
  · 0 . 0 3  5  2  ·  ·          ÷ 10² → point hops 2 left → 0.0352
```

## Part 1: Tutorial (interactive, ~2 minutes)
The student presses the real buttons; each step advances when they do it. One short caption (≤ 8 words) appears *after* the action, naming what they just saw. Progress dots, Skip, and "Replay" from the cheat sheet.

| Step | Student does | Sees | Caption after |
|---|---|---|---|
| 1 | Presses **× 10** (pulsing), three times | 3.52 → 35.2 → 352 → 3,520; the last hop turns a faint 0 solid | "× 10: the point moves one place right." |
| 2 | Presses **÷ 10**, five times | back down to 3.52 → 0.352 → 0.0352; leading 0s turn solid | "÷ 10: one place left." |
| 3 | Presses **× 10³** once | three hops, counted 1 2 3 | "× 10³ = three hops right." |
| 4 | Presses **× 10⁻²** once | the button flips to show "÷ 10²", then two hops left | "A negative power moves it left." |
| 5 | Taps where the point lands for 3.52 × 10² | the answer interaction used in Part 2; a miss shows the hops | — |

## Part 2: Exercises

**Question:** "3.52 × 10² =" above the slot row. The point sits at its start. The student **taps the gap where the point ends up**. The result appears as a normal number (= 352).

**Ideas**
- `right`: × 10ⁿ moves the point n places right
- `left`: ÷ 10ⁿ moves it n places left
- `neg`: × 10⁻ⁿ moves it n places left (a negative power is a division)
- `twist` (late): ÷ 10⁻ⁿ moves it right; × or ÷ 10⁰ doesn't move it

**Kinds**
| Kind | Idea | Easy/Tricky | Example | Wrong rule it catches |
|---|---|---|---|---|
| r-in | right | easy | 3.52 × 10 → 35.2 | — |
| r-past | right | tricky | 3.5 × 10³ → 3,500 | "× 10 adds a zero" / doesn't know empty places become 0 |
| r-whole | right | tricky | 45 × 10² → 4,500 | doesn't know a whole number's point is at its end |
| l-in | left | easy | 35.2 ÷ 10 → 3.52 | — |
| l-past | left | tricky | 3.5 ÷ 10² → 0.035 | stops at the front; misses the leading zeros |
| l-whole | left | tricky | 450 ÷ 10³ → 0.45 | same hidden-point issue, going left |
| n-in | neg | easy | 35.2 × 10⁻¹ → 3.52 | — |
| n-past | neg | tricky | 3.5 × 10⁻³ → 0.0035 | reads 10⁻³ like 10³ (moves right) |
| n-whole | neg | tricky | 4,500 × 10⁻² → 45 | same, starting from a whole number |
| t-divneg | twist (late) | tricky | 5.8 ÷ 10⁻² → 580 | "÷ always moves left" (ignores the minus sign) |
| t-zero | twist (late) | easy + tricky | 2.4 ÷ 10⁰ → 2.4 | "10⁰ is 10 (or 0)" |

Generator notes: 2–3 significant digits, first and last not 0; exponents 1–3; 4 empty places on each side; a power of 1 shows as "× 10". Empty places are invisible everywhere (tutorial included); a zero shows only where the point's position adds one. Moving the point (hover, drag, arrow keys) previews the zeros it would need in a lighter shade, so the point never floats in empty space; committing (release / Enter) makes them real. After a miss, the picked point keeps its light zeros and the correct landing shows solid ones.

**Opening contrast set:** the same number three ways, so ÷ 10² and × 10⁻² visibly land in the same place:
3.52 × 10² · 3.52 ÷ 10² · 3.52 × 10⁻²

## Feedback (by error type; the student taps a gap, so there are no fixed answer pairs)
The cue is always the same: the correct hops animate from the start (numbered arcs), and the gap the student tapped is marked red. The sentence depends on the error.

| Error | Example | Sentence |
|---|---|---|
| wrong direction on × | tapped left of start for × 10² | "× 10² makes it bigger, so the point moves right." |
| wrong direction on ÷ | tapped right for ÷ 10² | "÷ 10² makes it smaller, so the point moves left." |
| negative power read as positive | tapped right for × 10⁻² | "10⁻² means ÷ 100, so the point moves left." |
| right direction, too few or too many places | 2 hops for × 10³ | "× 10³ moves the point 3 places, not 2." |
| 10⁰, but moved | 2.4 × 10⁰, tapped elsewhere | "10⁰ is 1, so the point doesn't move." |
| ÷ 10⁻ⁿ read as ÷ 10ⁿ (a sign error) | 5.8 ÷ 10⁻², tapped left | "Dividing by 10⁻² is × 10², so the point moves right." |

For negative and zero powers, the operator's flip (÷ 10⁻² = × 10²; × 10⁰ = × 1) appears under the question. (Whole numbers always show their point at the end in the row, so "started from the wrong place" shows up as a wrong number of places.)

## Diagnose (analytics)
| Error | What it usually means | What a tutor can do |
|---|---|---|
| wrong direction (× or ÷) | Hasn't linked "bigger/smaller" to "right/left" | Ask first: "Will the answer be bigger or smaller?" |
| negative read as positive | Reads the exponent's number and ignores the sign | Cover the number: "10⁻² means ÷ 100. Bigger or smaller?" |
| wrong number of places | Counts zeros or digits instead of hops | Count the hops aloud with a finger, one per place |
| wrong number of places, whole number | Started from the wrong place, or counted digits | Find the point first (in 45 it's after the 5), then count hops |
| 10⁰ moved | Thinks 10⁰ is 10 (or 0) | 10⁰ = 1, and multiplying or dividing by 1 changes nothing |
| ÷ 10⁻ⁿ moved left | Treats ÷ 10⁻ⁿ like ÷ 10ⁿ | Dividing by 10⁻² is × 10². Bigger or smaller? |

## Cheat sheet
Rule: × 10ⁿ moves the point n places right; a negative power moves it left. Three rows, each a tiny slot row with its hops: × 10² (2 right), ÷ 10² (2 left), × 10⁻² (2 left, "= ÷ 10²"). Plus **Replay tutorial**.

## Rules
Engine defaults. The tutorial runs on first visit only; the tutor can replay it.

## The bar
11 questions with no misses (3 opening + 8 tricky, the twist last). The next-session check is 4 questions. With ~10 gaps per question, guessing through is essentially impossible.
- "× 10 adds a zero" fails r-past and r-whole.
- "the point stops at the front" fails l-past and l-whole.
- "ignore the minus sign" fails n-past and n-whole.

## Engine work (built with this exercise)
1. **Tap answers** (`ask` mode): the exercise draws its own answer area (the slot row) and reports what was tapped.
2. **Error types:** feedback and analytics grouped by *kind of error* (`classify(item, tapped)`) instead of (right, picked) button pairs.
3. **Tutorial mode:** a list of interactive steps that run before the exercise on first visit; skippable, replayable from the cheat sheet, progress dots.

## Open questions
None.
