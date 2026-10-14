---
name: deploy
description: Commit, push and verify an Apparatus change is live on GitHub Pages. Use whenever work on the site is ready — the user wants changes live as they land.
---

# Deploy

1. Bump `?v=N` on every changed CSS/JS URL in the pages that load it (engine files are loaded by `exercises/*.html` and `analytics.html`).
2. `git add` only the files you changed; commit with a one-line summary (what the user will notice), ending with the session's co-author line.
3. `git push`. If the network fails, say so and retry when asked.
4. Wait until the live page shows the change: `until curl -s https://partlywhole.github.io/Apparatus/<path> | grep -q '<a marker unique to this change>'; do sleep 5; done` (run with a timeout).
5. Report the live URL and, in a sentence or two, what changed and what you verified.
