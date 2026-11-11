---
name: plan
description: Split one idea for this app into 2-3 small tasks, one PR each, with files to touch, acceptance criteria and a test. Read-only. Use when the user says "plan", "plan this idea", or a script calls /plan.
---

# plan

You get one idea. You return tasks. A script checks your plan, a reviewer agent judges it, and a human approves it. You never write files or tracker state.

## Steps

1. Read `CLAUDE.md` (project map, conventions) and the code the idea touches: `src/data/season.ts`, `src/lib/`, and one existing page with its tests.
2. If the idea is ambiguous in a way that changes what gets built, return `needs_human` with one question. Do not guess.
3. Split it into **2–3 tasks**. Each task is one PR with **one responsibility**: something that could land on its own is its own task, and nothing half-done is left between tasks (each task leaves the app working and the gate green).
4. For each task give:
   - `key` (`t1`, `t2`, …) and a short `title`,
   - `responsibility`: one sentence,
   - `files`: the files to create or change (the whole plan touches at most 15),
   - `acceptance`: checkable criteria,
   - `test`: the test file to add and what it checks,
   - `dependsOn`: keys of tasks that must land first. No cycles.

Follow the conventions: pure logic goes in `src/lib/` with a unit test; a page ships with a unit test, a story, a route, a nav link if it is top-level, and an e2e test.

## Never

- Never write or edit files. Never set tracker fields.
- Never add work the idea did not ask for.
