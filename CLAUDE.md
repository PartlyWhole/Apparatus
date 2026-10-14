# Apparatus

A static site of math "toys" and exercises (GitHub Pages: https://partlywhole.github.io/Apparatus/, repo `PartlyWhole/Apparatus`, deploys from `main`). No build step: plain HTML, CSS and JS.

## Two generations of exercises

- **The new set** (`exercises/`, built on `engine/`): short, adaptive, tutor-supported exercises. All new exercises go here. Design docs: `docs/design/`.
- **Older pages** (`counters/`, `fractions/`, the progressions): left as they are unless asked. Don't move new work into them, and don't link the new set into the old progressions.

## Before designing or building an exercise

Read `docs/design/README.md`; it says what to read for each task. The short version of the house rules (details in `docs/design/house-style.md`):

1. **Minimal, visual, intuitive.** Text only when it's truly needed; when needed, short and plain.
2. **Right answer:** show it's correct (✓) and move on. No explanation.
3. **Wrong answer:** one visual cue on the item + one plain sentence about why the answer the student **picked** is wrong, then **OK** to continue. The progress bar takes a visible hit.
4. **Few problems.** Never drill. Hard items vouch for easy ones; extra practice only where a miss shows it's needed.
5. **Tutor-supported, self-study capable.** Analytics behind a faint corner dot explain misses in plain words for an untrained tutor; tutors can change the rules.

## Keep the docs evergreen

The design docs record decisions that will change. When the user changes a preference, corrects a design, or a new pattern proves itself, update the docs in the same piece of work (use the `update-design-docs` skill) and add a line to `docs/design/decisions.md`. Never leave the docs describing something the code no longer does.

## Workflow

- Skills: `design-exercise` → `build-exercise` → `review-exercise`; `add-misconception`; `update-design-docs`; `deploy`.
- Deploy as work lands (the user wants changes live): commit, push, wait for the live URL to show the change. Bump `?v=N` on changed CSS/JS URLs.
- Commit messages end with the co-author line the session specifies.
