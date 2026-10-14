# Analytics and tutor rules

`analytics.html#<id>`, opened from the faint corner dot on the exercise. Built by the engine (`Apparatus.analytics`). The audience is a tutor **who may have no training in this pedagogy**, or the student's parent: everything must be readable at a glance and say what to *do*.

## Sections

1. **Status:** Not started / In progress (answered, about how many to go) / ✓ Passed (date, and the next-session check: pending, passed, had a miss, or off) / check or extra practice in progress.
2. **By idea:** one row per idea: a dot per answer (green right, red wrong, amber right-but-slow, ringed = next-session check, faded = key was open), then "N more" if it still needs fixing, or ✓ with the typical time.
3. **What to do:** misses grouped by (right answer, picked answer) — or by error type in tap mode — newest example shown, with the definition's `diagnose` text: what it usually means, and one concrete thing to try. Marked "since fixed" after two right answers on that idea. Plus automatic notes: likely guessing (≥ 40% wrong in the last 8+), answers with the cheat sheet open, right-but-slow, ready for the next step.
4. **Adjust:** More <idea> (adds `fix` questions on it), Show tutorial again (if any), Mark passed, Start over (both confirm).
5. **Rules:** the tutor rules below, with "N questions with no misses" and a Defaults link once changed.
6. **Every answer:** a collapsed table: item, pick, time, flags, date.

## Tutor rules

| Rule | Options | Default | Effect |
|---|---|---|---|
| Opening examples | On / Off | On | the contrast set at the start (only if the exercise has one) |
| Tricky questions | 1 … max per idea | 2 | the probes that count as passing |
| Miss penalty | 1–5 | 4 | after a miss: this many more right answers on that idea (only penalty questions count), and the bar drops as much |
| Speed | Off / 10 s / 6 s | Off | a slower right answer doesn't count yet and comes back |
| Next-session check | On / Off | On | the short check 8+ hours after passing |
| Cheat sheet | Shown / Hidden | Shown | only if the exercise has one |
| Tutorial | On / Off | On | runs once on the first visit (only if the exercise has one) |

Loosening a rule applies to the current run at once; tightening applies from the next run (Again / Start over).

## Writing `diagnose` text

- For each (right, picked) pair: **what it usually means** (one sentence, the likely wrong rule) and **what to do** (one concrete action the tutor can take in 30 seconds: cover something, point at something, ask one question).
- Plain words, no pedagogy terms. "Sees × 10ⁿ and stops looking." not "Over-generalizes the exponent cue."
- May branch on the kind when the same pick means different things (negative power vs. no decimal point).
- Collect patterns in `misconceptions.md` so other exercises can reuse them.

## The answer log (one entry per answer)

`{ at, kind, idea, want, pick, txt, chose, right, ms, mode: open|probe|fix|warm, key, slow }` (tap mode: `chose` = error type or 'right', `pick` = the raw answer) in `S.log`. Keep it append-only; analytics derive everything from it plus `S.run`.
