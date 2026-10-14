# The exercise engine

`engine/exercise.js` + `engine/exercise.css`. The engine owns the shell, question choice, mastery rules, progress bar, feedback flow, next-session check, answer log, tutor rules and the analytics page. An exercise supplies only **content**. Change the engine when a need is shared by more than one exercise; keep this file in step with it.

## Files for one exercise

```
exercises/<id>.js     the definition (Apparatus.define({...}))
exercises/<id>.html   thin page: fonts, engine CSS, the exercise's own <style> (item visuals and cues), scripts, Apparatus.mount('<id>')
specs/<id>.md         the spec (spec-template.md)
```

Copy `exercises/sci-form.html` for the page and change the `<style>` and script names. Link the new page from `index.html` (Scientific Notation section or a new section of the new set) and `exercises.html`.

## The definition

```js
Apparatus.define({
  id: 'sci-form',            // URL-safe; storage keys and analytics.html#<id> use it
  version: 2,                // optional; storage key is apparatus.<id>.v<version> — bump to start everyone fresh
  title: 'Scientific or Not',

  choices: [                 // the answer buttons, in display order; keys 1..n always work, plus optional letters
    { id: 'dec', label: 'Decimal', keys: ['d'] }, …
  ],
  ideas: {                   // mastery groups; key order = the order tricky probes interleave in
    dec: { name: 'Decimal', easy: ['dec-whole', …], hard: ['dec-one', 'dec-small'] }, …
  },
  kinds: {                   // every kind: which idea it tests, and a random generator
    'dec-whole': { idea: 'dec', make: () => item }, …
  },
  answer: (item, kind) => choiceId,   // optional; default: the kind's idea id (when ideas = choices)
  // ideas[i].late: true → that idea's tricky probes come after all the others (twists)
  opening: [{ kind, item }, …],       // optional fixed contrast set

  render: (item, cue) => html,        // the item; with a cue class when showing feedback (and in the key)
  text: item => 'plain text',         // for the log and analytics (use Unicode superscripts etc.)
  speak: item => 'spoken text',       // optional; screen readers (defaults to text)
  feedback: (item, want, picked, kind) => [cueClass, sentenceHtml],   // every (want, picked) pair — see feedback.md
  diagnose: (want, picked, kind) => [whatItMeans, whatToDo],          // analytics advice — see misconceptions.md
  key: [{ item, cue, label }, …],     // optional ? popover
  defaults: { fix: 2, … }             // optional overrides of RULE_DEFAULTS (and defaults for the exercise's own rules)
  rules: [['div', 'Dividing', [[false, 'Off'], [true, 'On']], 'help text']],   // optional: the exercise's own tutor rules
  configure(SET) { return { ideas, opening } },  // optional: content overrides for the current settings (e.g. drop ÷ ideas)
  nextOnRight: true,                  // optional: a right answer waits for a Next click instead of moving on
});
```

Helpers: `Apparatus.util.r(a, b)` (random integer), `any(array)`, `shuffle(array)`.

## Tap mode (the exercise draws its own answer area)

Instead of `choices`, an exercise can answer by tapping/dragging in its own area (first used by `point-move`):

```js
  ask(el, item, submit, { mode }),    // draw the question + answer area into el; call submit(answer) once
  correct: item => answer,            // the right answer (compared with ===, or define isRight(item, answer))
  classify: (item, answer, kind) => errorType,     // for a wrong answer: what kind of error it is
  feedback: (item, want, answer, kind, errorType) => [cue, sentenceHtml],
  reveal(el, item, answer, { right, cue, err, slow }),   // show the outcome on the item (animations are the exercise's)
  revealMs: 1100,                     // how long a right answer stays before moving on (default 900)
  errors: { dir: 'moved the wrong way', … },       // labels for error types (analytics)
  diagnose: (errorType, kind) => [whatItMeans, whatToDo],
  keyHTML: '…',                       // the ? key as HTML (instead of key: [...])
```

The log stores the error type as `chose` ('right' when right) and the raw answer as `pick`; analytics group misses by error type. Keyboard support is the exercise's job in tap mode (e.g. arrows + Enter).

## Tutorial mode

```js
  tutorial(stage, api)    // interactive steps drawn into the question area
  // api.step(i, n)  progress dots     api.caption(html)  the line under the stage (≤ 8 words, after an action)
  // api.alive()     false once skipped (stop timers)     api.done()  finish → the exercise starts
```

The engine shows the caption, dots and **Skip**, runs the tutorial on the first visit (rule `tutorial`), remembers it (`S.tut` = done | skipped), and adds **Replay tutorial** to the ? key and **Show tutorial again** to analytics. Tutorial answers are never graded. Advance on the student's real actions; never on a timer.

## What the engine does (so definitions don't)

- **Choosing:** opening → tricky probes (interleaved by idea) → fixing ideas after a miss (easy kind, then the missed kind; never the same idea twice in a row when something else is pending) → next-session check (one tricky kind per idea).
- **Grading:** a miss sets that idea's need to `fix` (the miss penalty); right answers on penalty questions count it down (tricky probes don't). A kind can be queued twice; answering removes one copy. A slow right answer (speed rule) re-queues the item and changes nothing else.
- **Progress:** `credit / (credit + remaining)`; a right answer +1 credit, a miss −`fix`, so a miss always lowers the bar visibly (the "hit").
- **Own rules:** `rules` appear on the analytics page with the engine's; `configure(SET)` is applied at every start and every analytics render, and ideas it switches off are pruned from the run (their past answers still show in analytics, marked "off").
- **Reset (↺ in the top bar):** a fresh run; the log and `S.tut` are kept.
- **More practice (finish screen):** a run of `tricky` rounds, one random tricky kind per idea per round, ideas shuffled and never twice in a row; no opening; `done` unchanged.
- **Persistence:** `localStorage` `apparatus.<id>.v<version>` (state and log) and `apparatus.<id>.settings` (tutor rules, kept by Start over).
- **Debug:** `?debug` exposes `window.ex` = `{ S(), cur(), def, start(), SET(), respond(answer), state() }` for simulations (`qa-checklist.md`).

## Shared exercise libraries

`exercises/lib/places.js` + `places.css`: the row of places (digits, invisible empty places, zeros only where the point's position adds them), moving the point (preview/commit), hops with numbered arcs underneath, the power of ten riding at the end of the row, "10" tokens, static hop pictures, and exact parsing of typed decimals. Used by factor-out, factor-in and conversions (point-move predates it). `analytics.html` loads it before any definition. Sizes inside the row are in the row's em; put smaller text in an inner span so positions still line up.

More shared libraries (all loaded by `analytics.html`, in this order: places, forms, prefix, units, chain):
- `lib/forms.js` + `forms.css`: multiple choice (`Forms.choices`, keys 1–4) and written answers (`Forms.num`, `Forms.pow` for an exponent with a typed minus, `Forms.wire` with Check/Enter and shaking empty fields).
- `lib/prefix.js` + `prefix.css`: the prefix line by power of ten, hops along it, the Build Up / Break Down factory (`Prefix.updown`), shared prefix errors and sentences.
- `lib/units.js`: unit sizes, the facts table, the cheat sheet (bottom-left), problem banks for chains and rates, chain errors and advice.
- `lib/chain.js` + `chain.css`: a conversion written as a chain of fractions, built step by step (place the unit to cancel, pick the next unit, numbers, cancel, answer) at three levels (0 units given, 1 guided captions, 2 on your own). `free: { avoid }` lets the student choose the path (any unit with a known fact that can still reach the target by a route other than `avoid`); `solvedHTML(pr)` draws a finished chain. Mistakes are explained in place and fixed; the list of first-try mistakes is what's graded.

## Limits (extend when an exercise needs it)

- Typed answers aren't built yet; they would be a tap-mode exercise with an input in `ask`.
- Don't use engine class names for exercise visuals (`.done`, `.card`, `.key`, `.fix`, `.tut`, `.bar`, `.opts`…); they collide (`point-move` once used `.row.done` and its row turned vertical; `prefix-fraction` once used `.bar` for its fraction line and it vanished).
- Chains follow one fixed path of units; another valid path isn't accepted yet.
- One state per browser (no student accounts). A shared device shares progress.
