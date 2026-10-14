# Unit conversions: four exercises  (`unit-facts`, `unit-chain`, `unit-rates`, `unit-mixed`)

Status: live · Skill map: after Prefixes · Code: `exercises/lib/units.js` (facts), `exercises/lib/chain.js` (+ `chain.css`), `exercises/unit-*.js`

## The table (to know)
5,280 ft = 1 mi · 3 ft = 1 yd · 12 in = 1 ft · 2.54 cm = 1 in · 60 s = 1 min · 60 min = 1 hr · 24 hr = 1 day · 365 day = 1 yr · 3,600 s = 1 hr · 1,000 cm³ = 1 L · 1,000,000 cm³ = 1 m³ · 1,000 L = 1 m³ · 1 mL = 1 cm³
**Not to memorize** (on the cheat sheet): 0.3048 m = 1 ft · 1.609 km = 1 mi · 1,609 m = 1 mi · 3.785 L = 1 gal.
The cheat sheet (bottom-left) in every unit exercise is the whole table plus these, and the first screen of `unit-facts` (its tutorial).

## 1. Facts (`unit-facts`)
**Master every fact** (a rule for this exercise only, on by default): each fact is its own idea — multiple choice, then written — so passing means every fact answered right, written (26 questions with no misses); a missed fact comes back (penalty) spread among the others; the next-session check asks every fact, written. Analytics shows a row per fact. With the rule off, the shorter version below.
Ideas (rule off): length, time, volume. Each idea: two multiple-choice rounds ("1 mi = ?": 5,280 ft and three other table numbers with the same unit), then two written rounds ("1 mi = [ ] ft"). 12 questions with no misses. Errors: picked/typed the wrong number → "1 mi = 5,280 ft."

## 1b. One-Step Conversions (`unit-one`)
One fraction applied to an amount — 3 mi × (5,280 ft / 1 mi) = 15,840 ft — the first time a unit cancels. Same chain steps as below (the unit that cancels, what it turns into, equal numbers, cancel, the combined result). Ideas: to a smaller unit (start 1–5) and to a bigger one (worked back from a 1–5 answer), across time, length and volume facts (not 1 mL = 1 cm³). Opening: 3 mi → ft with the units given. 7 questions with no misses.

## 2. Two-step conversions (`unit-chain`): fractions
The chain, written the way it's written on paper:

```
2 day × [ ? hr  ] × [ ? min ] = [   ] min
        [ ? day ]   [ ? hr  ]
```
Step-by-step, one slot active at a time (it pulses), unit chips below to tap:
1. **Units:** the slot where the cancelling unit goes is active (the bottom, or the top when the unit is underneath, as in rates), and the student picks **which unit** goes there from chips (the one that cancels, among others from the problem); then the unit it turns into — every unit of that kind not already in the chain is offered: no fact → a mistake ("min doesn't connect to day…"); a dead end → a mistake ("From yr there's no way on to min…"); another valid route (hr → s directly) → redirected, not a mistake ("That works too, but here go through min."). Captions: "What goes on the bottom?" / "What does day turn into?"
2. **Numbers:** fill both numbers so top and bottom are equal (any equal pair: 24 hr / 1 day). Caption: "Make top and bottom equal."
3. **Cancel:** matching units on top and bottom strike through.
4. **Result (no hand calculation):** everything combines into one fraction — every number on its side, the units left over in their places (2 × 24 × 60 min / 1 × 1) — and its value is shown (= 2,880 min). Setting up the chain is the skill; then Next.
Scaffolding fades: in the opening the units are given (numbers only); then the captions guide each step; the next-session check and later questions have no captions. A wrong step shakes, turns red, and gets one sentence ("day is on top in 2 day, so put it on the bottom to cancel."); the student fixes it and goes on. Any first-try mistake makes the question a miss (penalty) — it's the step-level mistakes the tutor sees in analytics.
Problems: day→min, hr→s, yr→hr, day→s, mi→yd, yd→in, ft→cm (via in), km→cm, m³→mL; and back: s→hr, min→day, hr→yr, cm→km, mL→m³, yd→mi, in→yd (start amounts 1–5, or worked back from a 1–5 answer).

## 2b. Another Way (`unit-paths`): other valid paths
A solved chain is shown (quiet), labelled "Another way" below it; the student builds a different route to the same answer. Every unused unit of the same kind is offered; right is any unit connected by a known fact (table, cheat sheet, prefixes) that can still reach the target by a route other than the one shown. Otherwise: no fact → "yr doesn't connect to hr with a fact you know."; leads only back to the shown route → "That's the way above. Find another." (a nudge, not a mistake); a dead end → "From day there's no way on to s without going back." The chain grows a fraction per hop. Ideas: **shorter** (hr → s in one step; s → hr), **different** (m³ → cm³ → mL instead of → L →; mL → cm³ → m³; ft → m → cm with the cheat sheet), **longer** (hr → min → s instead of hr → s; day → hr → min → s). Same step checks and errors as the chains.

## 3. Rates (`unit-rates`): two units at once
"60 mi/hr = ? m/s": the given is itself a fraction; one factor converts the top unit, one the bottom (hr is on the bottom, so the factor has hr on top: 1 hr / 3,600 s). Same steps and guidance. Problems: mi/hr→m/s (cheat-sheet 1,609 m = 1 mi), km/hr→m/s, ft/s→mi/hr, m/s→km/hr, L/min→mL/s, cm³/s→L/min. Answers to about 3 digits (within 1%).

## 4. Mixed (`unit-mixed`)
Facts (written), two-step chains and rates, no captions. 9 questions.

## Errors (chains)
| Error | Sentence (example) |
|---|---|
| side | day is on top in 2 day, so put it on the bottom to cancel. |
| unit | That doesn't connect day to min. Day turns into hr first. |
| number | 24 hr = 1 day: top and bottom must be equal. |
| flip | 1 day is bigger than 1 hr: it's 24 hr on top, 1 day on the bottom. |
| (no answer step: the result is computed and shown) | |

## Interpretations to confirm
- Unit names: s, min, hr, day, yr; ft, yd, mi, in, cm; cm³, mL, L, m³, gal.
- 12 in = 1 ft added to the table (user, 2026-10-14).
- Two-Step Conversions and Rates follow one fixed path; other valid paths are their own page (Another Way), as the user asked.
