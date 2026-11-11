---
name: plan-review
description: Review a task plan for single responsibility (one concern per PR, nothing bundled that could land on its own) and for broken in-between states. Read-only, one pass. Use when a script calls /plan-review or the user asks to review a plan.
---

# plan-review

You get an idea and the plan for it. You judge it once and return `ok` or `failed` with reasons. The schema check (files, criteria, tests, cycles) already passed; do not repeat it.

## Check each task

1. **One responsibility.** One concern per PR. If a task bundles something that could land on its own, fail it and name what to split out.
2. **No broken in-between state.** After each task, in dependency order, the app builds and its tests pass. A task that needs a later task to work is a fail.
3. **Fits the idea.** Nothing the idea did not ask for. Nothing the idea needs is missing.
4. **Files are real.** Read the repo: files to change exist; new files follow the project map in `CLAUDE.md`.

## Verdict

- `ok` with a one-line summary when all four hold.
- `failed` with `reasons`: one line per problem, each naming the task key and the fix ("t2 bundles the nav link with the data helper: move the helper to its own task").

Be strict about 1 and 2 and lenient about wording. Do not fail a plan for style.
