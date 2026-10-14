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
  opening: [{ kind, item }, …],       // optional fixed contrast set

  render: (item, cue) => html,        // the item; with a cue class when showing feedback (and in the key)
  text: item => 'plain text',         // for the log and analytics (use Unicode superscripts etc.)
  speak: item => 'spoken text',       // optional; screen readers (defaults to text)
  feedback: (item, want, picked, kind) => [cueClass, sentenceHtml],   // every (want, picked) pair — see feedback.md
  diagnose: (want, picked, kind) => [whatItMeans, whatToDo],          // analytics advice — see misconceptions.md
  key: [{ item, cue, label }, …],     // optional ? popover
  defaults: { fix: 2, … }             // optional overrides of RULE_DEFAULTS
});
```

Helpers: `Apparatus.util.r(a, b)` (random integer), `any(array)`, `shuffle(array)`.

## What the engine does (so definitions don't)

- **Choosing:** opening → tricky probes (interleaved by idea) → fixing ideas after a miss (easy kind, then the missed kind; never the same idea twice in a row when something else is pending) → next-session check (one tricky kind per idea).
- **Grading:** a miss sets that idea's need to `fix`; right answers count it down. A slow right answer (speed rule) re-queues the item and changes nothing else.
- **Progress:** `credit / (credit + remaining)`; a right answer +1 credit, a miss −1, so a miss always lowers the bar (the "hit").
- **Persistence:** `localStorage` `apparatus.<id>.v<version>` (state and log) and `apparatus.<id>.settings` (tutor rules, kept by Start over).
- **Debug:** `?debug` exposes `window.ex` = `{ S(), cur(), def, start(), SET() }` for simulations (`qa-checklist.md`).

## Limits (extend when an exercise needs it)

- Answers are **buttons** (choice mode). Typed answers, counters or boards need an engine extension: an exercise-provided `ask(item, area, submit)` that calls `submit(picked, right)`. Add it with the first exercise that needs it, and document it here.
- One state per browser (no student accounts). A shared device shares progress.
