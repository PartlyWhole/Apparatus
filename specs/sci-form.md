# Scientific or Not  (`sci-form`)

Status: live · Skill map position: first in the new set · Code: `exercises/sci-form.js`, `exercises/sci-form.html`

## What the student learns
Tell at a glance whether a number is a plain decimal, in scientific notation, or neither (a "fake" with more than one digit before the point).

## Ideas
- `dec`: no power of ten → a decimal (any plain number, with or without a point)
- `sci`: exactly one digit (1–9) before the point, times a power of ten → scientific notation
- `none`: a power of ten, but more than one digit before the point → neither

## Answers
Decimal · Scientific · Neither (keys 1–3, or d / s / n)

## Kinds
| Kind | Idea | Easy/Tricky | Example | Wrong rule it catches |
|---|---|---|---|---|
| dec-whole | dec | easy | 4,560 | — |
| dec-point | dec | easy | 45.6 | — |
| dec-one | dec | tricky | 3.25 | "one digit before the point → scientific" |
| dec-small | dec | tricky | 0.004 | "small numbers aren't decimals" |
| sci-big | sci | easy | 4.56 × 10³ | — |
| sci-small | sci | tricky | 6.2 × 10⁻⁴ | "negative powers don't count" |
| sci-bare | sci | tricky | 7 × 10⁵ | "the front needs a point" |
| fake-big | none | easy | 45.6 × 10² | — |
| fake-ten | none | tricky | 10.5 × 10³ | "10 is like one digit" |
| fake-small | none | tricky | 320 × 10⁻⁵ | "× 10ⁿ → scientific" with a negative power |

Generator notes: no trailing zeros after the point; first digit never 0 (except 0.00x decimals); whole decimals over 999 get commas; scientific exponents 2–9 (or −2…−8).

## Opening contrast set
4.56 × 10³ · 45.6 × 10² · 4,560 (same digits; only the form changes)

## Feedback matrix
| Right | Picked | Cue (class) | Sentence |
|---|---|---|---|
| none | dec | × 10ⁿ underlined green (`why-pow`) | It has × 10⁴, so it's not a decimal. |
| none | sci | digits before the point boxed red (`why-fake`) | There are 3 digits (849) before the point. Scientific notation has just one. |
| sci | dec | × 10ⁿ underlined green (`why-pow`) | It has × 10³, so it's not a decimal. |
| sci | none | the one digit boxed green, × 10ⁿ underlined (`why-sci`) | One digit (4) before the point, then × 10³. That's scientific notation. |
| dec | sci | crossed-out "× 10?" slot (`why-dec`) | There's no × 10ⁿ, so it's not scientific notation. |
| dec | none | crossed-out "× 10?" slot (`why-dec`) | There's no × 10ⁿ. A plain number is a decimal. |

## Diagnose
See `diagnose` in `exercises/sci-form.js` and the Scientific notation table in `docs/design/misconceptions.md`.

## ? key
4,560 → Decimal (`why-dec`), 4.56 × 10³ → Scientific (`why-sci`), 45.6 × 10² → Neither (`why-fake`).

## Rules
Engine defaults (opening on, 2 tricky, 2 after a miss, speed off, check on, key shown).

## The bar
9 questions with no misses (3 opening + 6 tricky). Guessing through: (1/3)⁹ ≈ 0.005%. "× 10ⁿ → scientific" fails fake-ten and fake-small; "one digit → scientific" fails dec-one; "needs a point" fails sci-bare.

## Open questions
- Should 0.45 × 10³ appear (as "neither", per the standard 1–9 rule)? Not decided; left out.
