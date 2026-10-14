# The evidence behind the design

A condensed digest of the research we drew on, graded so agents know what's solid. Sources: the guidance-design reference set and the Math Academy research notes (the user's folders), plus a few well-known studies (marked "outside source").

Grades: **A** controlled studies / meta-analyses · **B** standards, platform guidelines, strong expert consensus · **C** vendor or company data (large but uncontrolled) · **D** practitioner craft.

| Principle | How we use it | Grade |
|---|---|---|
| Retrieval beats re-reading (testing effect) | The student answers from memory; explanations only after a miss | A |
| Spacing beats massing | The next-session check | A |
| Interleaving trains discrimination between categories | Ideas are mixed; never the same idea twice in a row | A |
| Massed practice inflates confidence | A streak today isn't passing; the delayed check confirms | A |
| Doing beats reading; people skip instructions | No intro screen; learn from the items | A (NN/g, Carroll) |
| Front-loaded tutorials don't help, and can hurt perception | No tour, no instructions; the ? key is pull-only | A (NN/g n=70; Andersen n>45k) |
| Tutorial value grows with novelty/complexity | Guidance only where it's needed (after a miss) | A (Andersen) |
| Contrasting cases highlight the deciding feature | The opening set: same digits, different forms | A/B |
| Mastery learning: prove each prerequisite before moving on | Per-idea mastery; passing = baseline mastery, not automaticity | A (Bloom; Kulik) / C (Math Academy) |
| Never lower the bar; remediate the weak component | No answer-giving hints; extra practice on the missed idea | C (Math Academy) |
| Order matters: late errors mean slipping | Only answers after the latest miss count | C (Math Academy) |
| Hard items exercise the easy skills inside them | Tricky probes vouch for easy kinds (FIRe, inside one exercise) | C (Math Academy; no formal study) |
| Few correct recalls + later relearning beats many now | Few questions + the next-session check | A (Rawson & Dunlosky — outside source) |
| Simple "N right in a row" rules work about as well as statistical models | Fixed, transparent rules a tutor can adjust | B (Pelánek — outside source) |
| Overlearning has diminishing returns | Few problems; no drilling | A (Rohrer & Taylor) |
| Time only once a student is accurate untimed | Speed rule off by default; times shown to the tutor only | B (IES guide) |
| Self-explanation helps learning | Tutor asks "why?" (prompted by analytics) | A |
| Help should be pulled, not pushed; re-findable | ? key, analytics; nothing pops up | B (NN/g) |
| Short words, one idea at a time | One sentence per miss; ≤ ~8 words on screen otherwise | D (game UX) |

## Deliberately not used (and why)

- **Timed quizzes, XP, leagues, streaks:** conflict with "don't drill", and a tutor makes them less necessary.
- **Long-term spaced review of every exercise:** later exercises should review earlier ones implicitly (`skill-map.md`) instead of separate drills.
- **A/B tests with holdouts:** not practical at this scale; watch the analytics instead.

## Confidence in our numbers

The structure is well supported. The specific numbers (2 tricky per idea, 2 after a miss, 8 hours, the 3-question check) are defaults to tune.
