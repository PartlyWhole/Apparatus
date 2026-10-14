---
name: update-design-docs
description: Keep Apparatus's design docs evergreen — when the user changes a preference, corrects a design, or a new pattern proves itself, update the right doc in place and log the decision. Use whenever a user correction or a new rule comes up, and after any engine change.
---

# Update the design docs

1. **Find the rule behind the change.** "Make the bar flash red" → the rule is about how a miss is signaled. Capture the rule and one example, not just the fix.
2. **Edit in place** the doc that owns it (see `docs/design/README.md`): style → `house-style.md`; flow/numbers → `phase-anatomy.md`; feedback → `feedback.md`; engine API → `engine.md`; analytics/rules → `analytics.md`; tests → `qa-checklist.md`; sequence → `skill-map.md`; research → `evidence.md`. Remove text that's no longer true.
3. **Log it:** one dated line at the top of `docs/design/decisions.md` — what changed, why, and "(user)" or "(user correction: …)" when it came from the user.
4. **Check for contradictions** across `CLAUDE.md`, the docs, the skills and existing specs; fix them in the same change.
5. **Check the code matches.** If the docs now describe something the code doesn't do, either change the code or say so to the user.
6. Commit with the code change it belongs to (docs aren't published to the site; they live in the repo).
