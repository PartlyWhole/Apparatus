# Spec template

Copy to `specs/<id>.md` and fill in **before writing code**. Show it to the user for approval. Keep it short; the worked example is `specs/sci-form.md`.

```markdown
# <Title>  (`<id>`)

Status: draft | approved | live    ·    Skill map position: after <exercise>

## What the student learns
One sentence. What they can do after passing that they couldn't before.

## Ideas
- <idea id>: <the thing to get right>   (usually one per answer)

## Answers
<labels on the buttons, in order>  (keys: 1..n, letters?)

## Kinds
| Kind | Idea | Easy/Tricky | Example | Wrong rule it catches |
|---|---|---|---|---|

Generator notes: ranges, edge cases to avoid (e.g. no trailing zeros; never 0 as the only digit).

## Opening contrast set
<one item per idea, as similar as possible>

## Feedback matrix (every right × picked pair)
| Right | Picked | Cue on the item | Sentence |
|---|---|---|---|

## Diagnose (for the analytics page)
| Right | Picked | What it usually means | What a tutor can do |
|---|---|---|---|

## Cheat sheet
<what a student would look up: a rule sentence + one example per answer, or a table>. Every exercise has one.

## Rules
Defaults (or overrides of RULE_DEFAULTS) and why.

## The bar
Questions with no misses: <n>. Chance of passing by guessing: <(1/k)^n>. Which half-rules fail which tricky kinds.

## Open questions for the user
```
