# Geometry: what the test still needs (G9–G13 + additions) — plan, awaiting approval

Status: built and live (2026-10-15): G9–G13 and the additions · Source: Ch. 4 Test A · Builds on specs/geometry-lines.md

Test answers, checked: Q2 Δ(3, 12) → √153 = 3√17 · Q16 M(−1, −2), segment slope −1 → bisector y = x − 1; 16B (5, 4) · Q17 y² = 27 → 3√3 · Q18 3√2 squares × 1.5 ≈ 6.4 mi · Q20 all sides √65, slopes ⅛ and −7/4 (no right angle) → rhombus; HL = √65 · Q5 answer A (1 and 1); distractors: sign only, perpendicular, flip only.

## Coverage map

| Test Q | Missing | Covered by |
|---|---|---|
| 2 exact length (MC of roots) | √, simplifying | G9 Simplify Roots → G10 Distance `numbers`/`num-neg`; G13 |
| 16A graph the ⟂ bisector | drawing; midpoint + ⟂ together | G11 `draw` (`draw-steps`, `draw`), `hv` late |
| 16B equidistant point | on the bisector ⇔ same distance | G11 `equi` + the strings tutorial |
| 17 equilateral, exact y | distance backwards | G10 late `back` (`iso`, `equi`) |
| 18 map distance to a tenth | scale, rounding | G10 late `map` |
| 20B exact HL | distance from coordinates | G10 `numbers`; G12 uses lengths |
| 20C classify HJKL | ∥ pairs, ⟂ corner, equal sides → name | G12 (the "equal sides, different legs" rhombus is the test's trap) |
| 4, 8 line given by two points | chaining two-points into Write the Line | Write the Line: idea `from` (`pts-steps`, `pts-line`) |
| 7 line given as a graph | slope from a graph inside the chain | Write the Line: `graph-line` |
| 5 parallelogram sides, mixed forms | std vs slope-intercept | Parallel and Perpendicular: hard kind `mixed`, late idea `pgram`, one new fact |
| all | unscaffolded mix | G13 Lines Review |

Order: … G7 Write the Line → G8 Midpoint → **G9 → G10 → G11 → G12 → G13**.

Every new exercise: `defaults: { fix: 1 }`, `nextOnRight`, tap mode; multi-step items grade first-try mistakes (fix in place, like Write the Line); `mode === 'warm'` forces lvl 0; letters on the grid, coordinates in the legend, run blue / rise green, "?" while counting; its own CSS file.

## G9 Simplify Roots (`geo-roots`)
Learns: √n = a√b with the biggest square out (√72 = 6√2), or nothing comes out.
Thinking: know the squares → biggest one dividing n → n = square × rest → the square leaves as its root → check: a² × b = n.

| Idea | Easy | Hard | Wrong rule |
|---|---|---|---|
| `pull` one square inside | √12, √18, √20, √27, √45, √50 | √28, √63, √75, √8 | square out whole (16√3); swapped (3√4) |
| `biggest` | `pull` | √72, √48, √32, √80, √96 | stops at a small square (2√18) |
| `none` (late) | √36…√100 | √15, √21, √30, √35, √42 | splits non-squares; 7√1 |

Opening: √12 = 2√3 and √48 = 4√3 (same rest, bigger square), lvl 2.
lvl 2: "Which square goes into 48?" square chips 4 9 16 25 36 49 → √48 = √(16 · [ ]) → [ ]√[ ] → pair animation (16 → 4·4, the pair leaves as one 4). lvl 1: the root box only (radical open). lvl 0: one box, type "r" for √.
Grading: unsimplified-but-equal **is** graded here; a decimal gets a nudge "Exact: keep the root."
Feedback (cue: the answer squared back, wrong part boxed): small "12 still has a square in it (4): 2√12 = 4√3." · whole "16 comes out as its root: √16 = 4, so 4√3." · swap "The square comes out and the rest stays in: 4√3." · back "Square it back: 3² × 5 = 45, not 48." · one (nudge) "√1 is 1: just 7." · kept "49 is 7 × 7: √49 = 7." · chip not a factor "48 ÷ 9 isn't whole." · chip not biggest "4 goes in, but so does 16, which is bigger."
Rules: "Pairs animation". Check: `big`, `none` at lvl 0. Numbers: radicands ≤ 100. ~8 answers.

## G10 Distance (`geo-distance`)
Learns: segment length, exact or scaled and rounded; distance backwards.
Thinking: the segment is the slope triangle's slanted side → legs = run, rise (signs vanish when squared) → d² = run² + rise² → d = √, simplified → map: × scale, round → backwards: leg² = d² − other².

| Idea | Easy | Hard | Wrong rule |
|---|---|---|---|
| `grid` | 3-4-5 (lvl 1) | (2,4) → 2√5, (3,3) → 3√2 (lvl 0) | adding legs; no root |
| `numbers` | all positive | A(−2, 5), B(1, −1) → 3√5 | (−6)² = −36; √(a²+b²) = a+b |
| `map` (late) | 5 squares × 0.5 mi | (3,3), 2 mi/square → 8.5 | no scale; truncating; walking the legs |
| `back` (late) | A(0,0), B(6,0), C(3,y), AC = 5 → 4 | equilateral sides 2, 4, 6 → √3, 2√3, 3√3 | y = half the side; adding; y² unrooted |

Opening: A(1,−1)→B(4,5) on the grid and A(−2,5)→B(1,−1) as numbers: both 3√5 (one up, one down, same length).
Tutorial: "Square the legs" — squares grow on the legs in the legend's mini triangle (9 + 16), then the slanted square grows to 25; then A(0,0), B(1,2) → √5.
lvl 2 grid: run/rise (either sign) → d² → d. lvl 2 numbers: drag into d = √(([x₂] − [x₁])² + ([y₂] − [y₁])²) (pair order free) → d² → d. lvl 1: d², d. lvl 0: d only. Map: "□ = 2 mi", d in squares, optional ≈ help computed from the student's own exact d, then miles. Backwards: "ABC is equilateral: all sides are equal." → AB → mini triangle run 2, rise y, d 4 → y² → y (squares animation in reverse).
Answers: root box; unsimplified equal → "Simplify." nudge (not graded); decimal for exact → "Exact: keep the root."; tenth → nudge unless one decimal.
Feedback: add "√(9 + 36) isn't 3 + 6: add the squares first, then the root: √45." · nosq "Square each leg first: 3² + 6² = 45." · negsq "(−6)² is +36: a square is never negative." · noroot "45 is d²; d is √45 = 3√5." · simp "Square it back: 5² × 3 = 75, not 45." · mix "−2 is A's x, so it goes with the x's." · count "Across from 1 to 4 is 3." · noscale "4.2 is in squares; each square is 2 mi: about 8.5 mi." · trunc "8.485 rounds up: the next digit is 8, so 8.5." · walk "That walks along the legs; straight across is shorter." · half "2 is across, half of AB; C is higher: y² = 16 − 4 = 12." · sum "4 is the slanted side, the longest, so subtract." · side "4 is the slanted side AC; straight up is shorter: √12 = 2√3."
Rules: Squares animation; Decimal help; Map distances. Check: `num-neg`, `map-root`, `equi`. Numbers: legs ≤ 6, d² ≤ 72; scales 0.5, 2, 3 (1.5 only in G13). ~10 answers.

## G11 Perpendicular Bisector (`geo-bisector`)
Learns: draw it; its points are equally far from both ends.

| Idea | Easy | Hard | Wrong rule |
|---|---|---|---|
| `draw` | slope ±1 (lvl 1) | slopes ±2, ±½, ±⅓ (lvl 0) | segment's own slope; sign only; flip only; through an end |
| `equi` | bisector drawn | not drawn | "closest-looking" point; an endpoint |
| `hv` (late) | flat/vertical segments | | ⟂ to flat is flat |

Opening: A(−3, 2), B(1, −2): M(−1, 0), y = x + 1; then equi on the same AB with (0,0), (−3,0), (1,−2), (3,4) → (3,4).
Tutorial: tap a point on the dashed bisector → equal dashed strings to A and B ("PA √40 · PB √40"); tap off it → unequal.
lvl 2: "Where is the middle of AB?" (tap M) → "Tap one more point on the perpendicular bisector." → the line draws through M → the half-triangle at M turns 90°, right-angle mark. lvl 1: no turn unless missed. lvl 0: tap any two points.
Feedback (cue: student's line red, right line faint green, M ringed): mid "M is halfway: the average of the x's and of the y's, (−1, 0)." · along "That runs along AB; the bisector crosses it at a right angle." · sign "Only the sign changed: turned 90°, rise and run swap too." · flip "Only flipped: the sign changes too." · slope "Perpendicular to ½ is −2: from M, 1 across and 2 down." · end "That one goes through A; a bisector cuts AB in half, through M." · miss "At a right angle to AB, but it misses the middle." · equi picks: "(0, 0) is √13 from A but √5 from B: not the same." / "That's B itself: 0 from B but √32 from A."
Rules: Equal-strings animation. Check: `draw` lvl 0, `equi`, `hv`. Numbers: A, B in −5..5, Δ even. ~8 answers.

## G12 Classify the Quadrilateral (`geo-quad`)
One picture, three tests: ∥ = same triangle; ⟂ = triangle turned 90° (product −1); equal sides = equal d (legs may differ: (5,0) vs (3,4)). Tree: 2 ∥ pairs → parallelogram (+⟂ rectangle, +equal rhombus, both square); exactly 1 pair → trapezoid.

| Idea | Easy | Hard | Wrong rule |
|---|---|---|---|
| `angle` | rectangle | rhombus with (2,1)/(1,2) (swapped, not turned) | "looks square"; flip-only taken for ⟂ |
| `sides` | square | rhombus with (5,0)/(3,4) | different legs ⇒ different lengths |
| `pairs` | parallelogram | trapezoid | one pair called a parallelogram |

Opening: rhombus A(−2,−1), B(0,0), C(1,2), D(−1,1) vs square A(−2,−1), B(0,0), C(−1,2), D(−3,1) — only the turn differs.
lvl 2: tap sides to see their triangles → "Are both pairs of opposite sides parallel?" → "A right angle at B?" → "AB and BC the same length?" → "So ABCD is a…". lvl 1: tap-to-compare then the name. lvl 0: vertices as text (like Q20), the name only.
Name feedback names the first deciding property the pick gets wrong, e.g. Rhombus picked as Square: "AB and BC aren't at a right angle: ½ × 2 isn't −1, so not a square." · Square picked as Rhombus: "It has right angles too (½ × −2 = −1): a rhombus with right angles is a square." · Rectangle as Square: "AB is √5 but BC is √20: the sides aren't all equal." · any for a Trapezoid: "Only AB and DC are parallel; AD and BC have slopes 3 and −2."
Rules: "Parallelogram as a choice" (Off = the test's 4 choices). Check: coordinates-only rhombus and trapezoid. ~8 answers.

## G13 Lines Review (`geo-review`)
One tricky probe per idea (slope, ∥/⟂ line incl. two points and graph, flat/vertical, parallelogram pair, midpoint, distance incl. map 1.5, bisector, quadrilateral, facts); 9–12 questions, unscaffolded, reusing each exercise's own generators and feedback through `Apparatus.defs` (no engine change). Multiple choice only where choosing is the skill (Q5, Q16B, Q20C).

## Additions to existing exercises
- **Write the Line:** given-line forms `pts` ("the line through A(−3, 2) and B(1, 1)") and `graph` (tap two lattice points at lvl 2); when P is on the y-axis: "The perpendicular line crosses the y-axis at (0, 4)." New idea `from` (after `perp`). Sentences: "Subtract in the same order: (1 − 2)/(1 − (−3)) = −1/4." / "Down 2 for every 1 across: −2."
- **Parallel and Perpendicular:** hard kind `mixed` (2x − 4y = 8 vs y = ½x + 3); late idea `pgram` (four stacked equation pairs, Q5's format, cue: each slope written under its equation); fact "Opposite sides of a parallelogram are parallel."

## Shared building blocks (geometry/lib)
- `root.js` (new): `Root.split/of/eq/simplified/html/text`, `Root.box(name)` (one box; "r" or "√" opens the radical [3]√[17], backspace closes it), `Root.wire(host, { want, strict, exact, tenth, onSubmit, say })`.
- `grid.js` additions (one owner): `poly`, triangle `hyp`/`d`, `squares` animation in the legend triangle (animate after the last draw — `layout()` rewrites the legend), `pickTwo` (lifted from Rise and Run), `drawLine` (tap two points, extended; tap again to remove), `remove`, `rightMark`, `strings`.
- `pick.js` (new): choice buttons with keys 1–n (lifted from parallel-perp).
- `steps.js` (new): Write the Line's step chain generalised (`text`, `boxes`, `drag`, `pick`, `tap` steps; first-try grading; fix in place).
- `lines.js`: given-line helpers (`si | std | h | v | pts | graph`) shared by Write the Line, Slope from an Equation, Parallel and Perpendicular.
- No engine changes. analytics.html: new ids in `FILE`, new libs in `LIBS`; for `geo-review`, `FILE` entries become lists.

## Open questions (with recommendations)
1. Typing a root: "r" (also "√", "sqrt") opens the radical, like "/" opens a fraction; no √ button. *(Alt: a √ key on touch screens only.)*
2. Unsimplified root in Distance (√45): "Simplify." nudge, not graded; G9 grades simplifying.
3. Map distances need a decimal for √18: "Decimal help" (≈ of the student's own exact d) with a tutor toggle; scales 0.5, 2, 3 (1.5 only in the Review).
4. G12 choices: 5 buttons including Parallelogram, most specific name wins; trapezoid = exactly one ∥ pair; tutor rule drops Parallelogram.
5. Writing the bisector's equation (not on the test): leave it out.
6. Simplify Roots as its own page (vs a first idea in Distance): own page.
7. Signs of run/rise in Distance: accept either sign silently.
8. G13 format: mostly typed and unscaffolded, MC only for Q5/Q16B/Q20C.

## Build order
0. Specs per exercise from this plan; user approval.
1. Libraries in parallel by file: root.js · pick.js + steps.js · grid.js additions (one owner) · lines.js helpers.
2. Exercises in parallel, each owning its files: G9 · G10 · G11 · G12 · (Write the Line + Parallel and Perpendicular additions).
3. G13 after the rest is live. One integrator does index.html, exercises.html, analytics.html, specs and docs; bump `?v=N`; deploy; review each page.

## As built (notes from the builders)
- G9: the next-session check also has `pull-0` (the engine asks one item per idea); 3√16 counts as swap; a√1 is a nudge even in strict mode.
- G10: extra hard kinds `grid-simp`, `num-simp` (a square to take out, e.g. 2√13) to reach ~10 answers; run/rise accept either sign; drag order within a pair free.
- G11: `both` sentence: "It misses the middle of AB, and it isn't at a right angle to AB."; flat/vertical segments say "vertical: straight up and down through M" / "flat: straight across".
- G12: errors are `<shape>><pick>` and `q-pairs|q-perp|q-eq>y|n`; the "Parallelogram as a choice" rule Off turns the pairs idea into trap/trap0.
- Write the Line `from`: graph scaffolding fades within a session (tap two points → slope only → whole line); y-axis points skip the substitution drag ("It crosses the y-axis at (0, 4), so b = 4.").
- Parallel and Perpendicular: `mixed` sometimes pairs y = x + 2 with x − 3y = 6 (the x-number trap); `pgram` sentences e.g. "Slopes −3/2 and 3/2 only differ in sign: not parallel."
- Shared: steps.js marks finished rows `.st-done` (not the engine's `.done`) and allows HTML in its sentences; lines.js has `Lines.given` and `Lines.plain`.
- G13 (geometry/review.js): 9 ideas, one tricky probe each (defaults tricky 1, fix 1, no opening); each question is asked by its source exercise in 'warm' mode (lvl 0) and graded/explained by it; errors are "source:error"; analytics loads the list of source files (FILE entries may be arrays).
- G10 numbers, lvl 2: after the drag, "Subtract." d = √([Δx]² + [Δy]²) (checked in the order the student placed the numbers), then "Square." d = √([Δx²] + [Δy²]), then d², then d. New errors diff, sqr; (−6)² = −36 is negsq. The radical sign stretches to meet its bar.
- G12 redesigned (user: "incredibly cluttered"): no tapping sides; the grid zooms to the shape; one comparison per question ("Is AB parallel to DC?", "Is AD parallel to BC?", the angle at B, AB vs BC) with only those two sides lit and their slope triangles side by side under the question (never on the grid); answered questions fold into one findings line (AB ∥ DC · AD ∥ BC · no right angle · AB = BC); the legend holds only the corners' coordinates. A wrong name lights the deciding sides and shows their triangles.
- G12 starts by eye (idea `look`, first in the opening: a rectangle, then a rhombus diamond; hard kind tilted, e.g. a square turned 45°): a plain drawing, no grid or numbers; a miss draws the standard markings (equal-side ticks, parallel arrows, right-angle boxes) + "Its corners aren't square: it's a rhombus." Then the first coordinates-only item (lvl 'v') walks the method in the student's numbers: the slope of each side (AB BC CD DA), "Is AB parallel to CD?", "Is BC parallel to DA?", the angle at B, the lengths of AB and BC (root boxes), same length?, then the name; later coordinates-only items ask only for the name.
- Shared: inline stacked fractions sit centred on the text line (geo.css `.frs { vertical-align: middle }`).
- G11 equi (hard, no line drawn) is two parts: first the perpendicular bisector (tap M, then a point; fixed in place), then "Which point is the same distance from A and B?" with the bisector drawn, so the answer is the choice on the line. Finished prompts fold away. The easy equi (line already drawn) is unchanged.
- G11: after the line (right on the guided item, or any miss), the why is stepped with ›, one idea at a time, each clearing the last: "It goes through the middle of AB." (M ringed) → "It crosses AB at a right angle." (the half-triangle turns 90°) → "Any point on it is the same distance from A and B." (one point, equal strings). It replaced an automatic sequence that was too fast and cluttered.
