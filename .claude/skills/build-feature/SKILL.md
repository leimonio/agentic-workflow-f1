---
name: build-feature
description: Build one small feature in this repo from a task description - code, unit test, story and e2e test - then run verify and report. Use when the user says "build-feature", "build this task", or gives a feature task for this app.
---

# build-feature

You get one task. You write the code. Scripts decide whether it works.

## Steps

1. Read the task. Read `CLAUDE.md` (project map, conventions). Read the existing code you will touch, and one similar existing page and its tests as the pattern to copy.
2. If the task is ambiguous in a way that changes what you build, stop and ask one question. Do not guess.
3. Write the change, following the conventions in `CLAUDE.md`:
   - the code (reuse `src/lib` functions and `src/components/ui`; add nothing the task doesn't need),
   - a unit test next to it (`*.test.tsx`, Testing Library, use `renderAt` from `src/test/render.tsx`),
   - a story (`*.stories.tsx`, use the `withRouter` decorator),
   - for a page: the route in `src/App.tsx`, the link in `navItems`, and an e2e test in `e2e/`.
4. Run `npm run -s verify -- --json`. Read `.agent/verify.json`.
5. Fix failures your change caused. Leave failures that also exist on `main` alone (the planted date test is one).
6. Run verify again after your last edit.

## Report

End with exactly this, filled in from the last verify run, not from memory:

```
Task: <one line>
Files: <list>
Verify: <passed> passed, <failed> failed
Failures: <id> — mine | pre-existing, one per line (or "none")
```

## Never

- Never say "verified" or "done" without the verify output above.
- Never edit `.agent/`, the planted test, or a test just to make it pass.
