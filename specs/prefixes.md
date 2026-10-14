# Prefixes: four exercises  (`prefix-up`, `prefix-down`, `prefix-between`, `prefix-fraction`)

Status: live · Skill map: after Conversions (powers of ten) · Code: `exercises/lib/prefix.js` (+ `prefix.css`, `forms.css`), `exercises/prefix-*.js`

## The visual: the prefix line
One line of units for a base unit (m, L or g), placed by power of ten, with empty spots where there's no prefix:

```
Mm  ·  ·  km  hm  dam  m  dm  cm  mm  ·  ·  µm
10⁶          10³              10⁰              10⁻⁶
```
Each spot shows just the prefix (M k h da · d c m µ), with the base unit in the middle as a quiet pill (so meter's m isn't read as milli's m); empty spots are narrower so the prefixes get room. Hover, focus or tap shows the full name and the power from the base ("kilo · 10³"). The two units in a question are green, with their names underneath. Every step along the line is one power of ten, so going from one unit to another is the hop model from Moving the Point: the empty spots make the k–M and m–µ jumps (3 places) visible. After a miss the hops animate along the line (numbered arcs, ×10 or ÷10 each), ending on the answer.

## 1. Build up (`prefix-up`): 1 [bigger] = ? [smaller], one of them the base
"How many mL add up to 1 L?" → **1 L = [ ] mL** (typed; commas fine).
| Idea | Easy | Tricky (wrong rule caught) |
|---|---|---|
| small → base: 1 base = ? small | d (10), c (100) | m (1,000: "milli is 100"?), µ (1,000,000: "µ is next to m, so 10,000") |
| base → big: 1 big = ? base | da (10), h (100) | k (1,000), M (1,000,000: "M is next to k") |
Opening: 1 L = ? mL, 1 km = ? m. 6 questions. Tutorial (2 steps): tap a unit on the line and watch the hops ("1 kL = 1,000 L").

## 2. Break down (`prefix-down`): 1 [smaller] = ? [bigger], one of them the base
"How many km equal 1 m?" → **1 m = [ ] km** = 0.001. Mirror of 1 (base → big: 0.1 … 0.000001; small → base). Opening: 1 m = ? km, 1 cm = ? m. 6 questions.

## 3. Between two prefixes (`prefix-between`): neither is the base
"1 cm = ? µm" as a power of ten (**10^[±][ ]**), as a number (**[ ]**, commas), or both. Both directions (bigger → smaller is positive; smaller → bigger negative). Pairs across the gaps are the tricky ones (cm–µm 10⁴, km–cm 10⁵, km–mm 10⁶, Mm–km 10³, mm–µm 10³). Opening: 1 cm = ? µm (both). 7 questions.

## 4. Conversion fractions (`prefix-fraction`): no line
Tutorial: "1 m = 100 cm" turns into the fraction **1 m / 100 cm** — equal amounts on top and bottom make a conversion factor. Then: a fraction with units and blank numbers. First one number is given as 1 (**[1] m / [ ] cm**, **[ ] m / [1] cm** → 0.01), then both blank (any equal pair is right: 1 m / 100 cm or 0.01 m / 1 cm), then harder pairs where neither is the base (**[ ] cm / [ ] mm**, **[ ] km / [ ] cm**, **[ ] mL / [ ] µL**). 7 questions.

## Errors and feedback (all four)
| Error | Detected | Sentence (example) |
|---|---|---|
| dir | the answer goes the wrong way (bigger/smaller) | A liter is bigger than a milliliter, so 1 L is many mL: 1,000. |
| count | right way, wrong number of places | From L to mL is 3 places: 10 × 10 × 10 = 1,000. |
| other | not a power of ten | It's a power of ten: 1 L = 1,000 mL. |
| flip (fractions) | top and bottom swapped | 1 m is bigger than 1 cm, so it takes 100 cm to equal 1 m: 1 m / 100 cm. |

## Rules
Engine defaults (miss penalty 4). Right answers wait for Next.

## Interpretation to confirm
"Harder ones like ? cm / ? ml" read as pairs where neither unit is the base (cm/mm, km/cm, mL/µL); cm and mL measure different things, so they aren't paired.
