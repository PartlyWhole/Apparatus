# House style

What the student sees and does. These rules come from the user; when they change, update this file and `decisions.md`.

## The look

- **Minimal, elegant, intuitive.** One item, centered and large. Answer controls under it. Nothing else on screen during a question.
- **Visual over text.** If something can be shown on the item itself (a box around digits, an underline, a crossed-out slot), show it instead of saying it.
- **Text only when truly necessary.** No instructions if the layout makes the task obvious. No titles on the exercise page, no "Choose one:", no intro screen. Button labels are the vocabulary being learned (e.g. "Decimal / Scientific / Neither").
- **When text is needed:** one short sentence, plain words a 12-year-old reads instantly, about *this* item ("There are 2 digits (45) before the point."). No jargon, no exclamation marks, no praise.
- Tokens, fonts and the shell come from `engine/exercise.css` (Atkinson Hyperlegible for text, JetBrains Mono for numbers; light and dark). Exercise-specific visuals go in the exercise's own `<style>`.

## The interaction

| Moment | What happens |
|---|---|
| Question appears | Item + answer buttons. Keys 1–n (and letters if set) also answer. |
| **Right** | The picked button turns green with ✓. No explanation, no cue. Moves on by itself after ~0.9 s. |
| **Right but too slow** (only if the tutor turned speed on) | The button shows ⏱ in grey instead of ✓. Doesn't count yet; the item comes back later. Never treated as a miss. |
| **Wrong** | The picked button turns red; the right one turns green. **One cue** appears on the item and **one sentence** explains why the *picked* answer is wrong (see `feedback.md`). The student clicks **OK** (or Enter) to continue. Answer buttons are locked until then. |
| Progress bar | Grows smoothly on a right answer. **On a miss it takes a hit:** drops at once, the lost piece stays red briefly then drains away, and the bar thickens for a moment. Elegant, no flourish. |
| Finished | A ✓ with **Again** and **Done**. |
| Tutorial (if the exercise has one) | First visit only. The student does each step on the real visual; a short caption appears after the action; progress dots and Skip below. Replay from the ? key. |

## Chrome

- **Top bar:** ← (back to the library), the progress bar, and **?** if the exercise has a key.
- **? key:** a small popover with one example of each answer, its deciding feature lit up. Always available, never pushed. Opening it during a question is noted in the log.
- **Analytics:** a faint dot in the bottom-right corner opens `analytics.html#<id>`. Not labeled; meant for the tutor.
- No reset on the student page (it's on the analytics page).

## Accessibility (non-negotiable)

- Keyboard: every answer by key; Enter for OK; Esc closes the key.
- Screen readers: the item is spoken (`speak`), results are announced.
- `prefers-reduced-motion`: no animation beyond fades.
- Touch targets ≥ 44 px; works at 320 px wide with no horizontal scroll; light and dark.

## Things we deliberately don't do

- Hints that give away the answer, or "try again" on the same item (we explain, then move on and come back later).
- Points, streak counters, confetti, timers shown to the student.
- Long sets of the same kind of problem.
