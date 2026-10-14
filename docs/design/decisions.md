# Decisions log

Newest first. One line per decision: date — what — why (and who asked). When a decision is reversed, add a new line; don't delete the old one. The other docs describe only the current state.

- 2026-10-14 — Factor Out: after the opening the power is hidden while moving; once the point is right the student writes the power (× 10^[ ]), so they must count, not just click the right spot. (user)
- 2026-10-14 — Places rows: a previewed number is one color (new zeros look like the digits, so 0.00045 reads as one number); the original trailing zeros that end up after the point are ghosted (4.5 + ghosted 00), not hidden. Light zeros remain only for a wrong pick's zeros and in pictures. Same in Moving the Point. (user, refining "trailing zeros should disappear")
- 2026-10-14 — Factor Out / Factor In / Conversions: move the point with an equals sign kept and the power of ten counting hops (each hop moves one 10 between number and power); Factor In shows the live power only in the tutorial and opening. Conversions: 4 multiple-choice options (answer, one place off same way, both mirrored the wrong way), then written answers (decimal field; number + exponent fields). Two intro pages + one mixed page; no fake-notation twist. (user)
- 2026-10-14 — Finish screen: "More practice" (a fresh round of tricky questions) replaces "Again"; ↺ restarts from the beginning. (user)
- 2026-10-14 — Bigger penalty for wrong answers, to discourage guessing: "Miss penalty" rule (1–4, default 3, was "After a miss", default 2). Only penalty questions pay it off; the bar drops by the penalty. (user: "wrong answers to have more penalty… allow tutor to adjust")
- 2026-10-14 — Moving the Point: tutor rule "Dividing" (default off) — no ÷ questions, tutorial and wording without division; engine gained exercise-specific rules (`rules` + `configure`). (user)
- 2026-10-14 — Moving the Point: hops drawn under the digits (the point dips along them). (user)
- 2026-10-14 — Moving the Point: a right answer stays until Next (engine option `nextOnRight`), so the result can be seen. (user)
- 2026-10-14 — Moving the Point: once the point is moved (preview) or committed, the original point fades to ~10%. (user)
- 2026-10-14 — Moving the Point: no placeholder zeros anywhere (not even in the tutorial or opening); a zero shows only where the point's position adds one. Replaces "faint zeros, then fade". (user)
- 2026-10-14 — ↺ reset back on the exercise page, next to ?, asking once ("Reset?"); keeps the log and tutorial status. Reverses "no reset on the student page". (user)
- 2026-10-14 — Moving the Point: moving the point previews the zeros it would need (light), so it never floats; placeholder dots removed. Answers commit on release, so dragging on touch previews too. (user: "Moving the dot should spawn 0s so it doesn't look like a floating dot")
- 2026-10-14 — Moving the Point: hop numbers sit above their arcs, clear of the digits. (user correction)
- 2026-10-14 — Moving the Point (`point-move`): tap where the point lands; the point moves (not the digits); faint zeros in the tutorial and opening, then faded to dots (scaffold fading); ÷ 10⁻ⁿ and 10⁰ included as a late "twist" idea, taught by the operator "flip" (× 10⁻² = ÷ 10²). (user: "Tap to answer, include them elegantly, fade zeros, point moves")
- 2026-10-14 — Engine: tap mode (exercise draws its answer area; feedback and analytics by error type), tutorial mode (first visit, Skip, Replay, can't be failed), late ideas. (needed by point-move; user asked for "a tutorial mode with the kind of guidance we looked at earlier")

- 2026-10-14 — Shared engine (`engine/`), exercise definitions (`exercises/`), generic `analytics.html#<id>`, design docs and skills created so future exercises follow the same rules. `counters/sci-form.html` redirects to `exercises/sci-form.html`. (user: "evergreen" docs and skills)
- 2026-10-14 — Tutor-adjustable rules on the analytics page: opening, tricky count, after-a-miss, speed, next-session check, ? key. Loosening applies now, tightening next run. Settings survive Start over. (user)
- 2026-10-14 — A miss hits the progress bar like losing HP: instant drop, red piece drains, bar thickens briefly. Every miss lowers the bar (credit −1). (user: "stronger tell… elegant, minimal")
- 2026-10-14 — Feedback explains why the **picked** answer is wrong, not why the right one is right. (user correction: picking Decimal on 849.2 × 10⁴ showed the digit count instead of the power of ten)
- 2026-10-14 — Analytics page behind a faint corner dot (not called "tutor view"), with plain-language advice for untrained tutors. (user)
- 2026-10-14 — Must work for self-study too, so the bar must hold without a tutor asking "why": tricky probes + 2 right after a miss + next-session check. (user)
- 2026-10-14 — Tutor-led context: fewer problems; hard items vouch for easy ones (~9 questions); next-session check instead of day-based spaced repetition. (user: "don't turn my student's brain into mush"; "an instructor/tutor… is the vision")
- 2026-10-14 — Right answer: just ✓ and move on. Wrong: visual cue + one plain sentence + OK. (user)
- 2026-10-14 — The new exercises are a separate, parallel set; not part of the older progressions. (user)
- 2026-10-14 — First exercise: decimal vs. scientific vs. "fake" scientific (more than one digit before the point). Numbers like 0.45 × 10³ left out for now (standard rule requires 1–9 before the point; user hasn't decided).
