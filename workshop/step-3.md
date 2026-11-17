# Step 3: the board in the middle (35 min, likely over)

**Goal:** the same state machine, now on a monday board. The tracker is a transport; skills never know which one.

## Do

1. `Tracker` interface: `list, get, update, log, handoff`. Adapters: local (`.agent/items/<id>.json`) and monday. Select with `AGENT_TRACKER=local|monday`.
   `AGENT_TRACKER` may live in `.env`: load `.env` before the line that reads it, or the setting is silently ignored and everything goes to the local tracker.
2. `npm run board:setup` (idempotent: second run changes nothing). Needs `MONDAY_API_TOKEN` in `.env`.
   - It **creates its own empty board** and saves the id in `.agent/board.json`. Never point it at a board you already use: one mistake mixes agent items with yours. `--adopt <id>` is for a human who chooses to.
   - It prints `Board: <name> <url>` on every run, so you know which board it changed.
   - Groups: **Ideas**, **Tasks** and **Done**. New items go to Ideas or Tasks by type; a task moves to Done when it is merged (step 5), so the board shows what is still in flight.
   - Every stage field, and Type (`Idea`, `Task`), is a **status column** with fixed labels: a human filters and clicks them, not types them.
   - Column order is reading order: Type, Needs human, then the stages in workflow order with the human gates among them (Plan, Plan approved, Build, CI, Verify, Visual, Human review, Merge), then PR and the bookkeeping columns, long text last. monday adds columns on the right, so create them in that order.
3. `board:read` and `board:write` are thin CLIs over `Tracker`.
4. `npm run dispatch` does one pass: the pure `nextStage(item)` decides each item's stage, dispatch runs it. `-- --watch` repeats every 60 s (demo only).
   Build branches (`agent/<id>`) start from the branch you run dispatch from (or an unmerged dependency's branch), not from `main`: your earlier steps are not on `main`. Pass that branch to the build loop as `AGENT_BASE_BRANCH` so the baseline matches it. If the loop exits without a handoff, it crashed: say so, don't send the human to an old handoff.
5. `plan-tasks` skill (not `plan`: that name collides with common global skills): idea "Driver profile page" becomes 2–3 tasks. Each task has one responsibility statement, files to touch (max 15 per task), acceptance criteria and a test. A script validates this schema (2 retries). A plan-review agent judges single responsibility.
6. **Human gate:** you set `Plan approved`. The agent never does.
7. `build-feature` now picks up Ready tasks and writes Build columns through `Tracker`.

## Split

| Script | Agent |
|---|---|
| `board:*`, `dispatch`, `nextStage`, schema validation, retry count | splits the idea, reviews the plan, builds the task |

## Done when

- `nextStage` and schema-validation tests pass.
- Running `board:setup` twice changes nothing, and both runs print the same board URL.
- One task is built and its PR is open.

## What changed on `step-3-solution`

| File | What |
|---|---|
| `scripts/lib/tracker.ts`, `local-tracker.ts` | `Tracker.create` (monday assigns ids, so tasks need it). Local ids are title slugs that never overwrite. |
| `scripts/lib/board-columns.ts` | The board's columns with fixed ids (`agent_*`), and the mapping between `Item` fields and monday column values. |
| `scripts/lib/monday.ts`, `monday-tracker.ts` | GraphQL client (reads `.env`) and the monday adapter. `handoff` also posts an update on the item. |
| `scripts/board/setup.ts` | Creates the board, or completes it: only missing groups and columns. `--adopt <id>` uses an existing board. |
| `scripts/board/read.ts`, `write.ts` | Thin CLIs over `Tracker`. `write` refuses `planApproved` and `humanReview`. |
| `scripts/lib/stage.ts` | `nextStage(item, all)`: the stage rules as one pure, tested function. |
| `scripts/lib/plan.ts` | The plan JSON schema and `validatePlan` (files, criteria, test, max 15 files, unknown deps, cycles). |
| `scripts/plan/loop.ts` | plan agent → schema check → plan-review agent, 2 retries, then `Awaiting approval` or a handoff. |
| `scripts/dispatch.ts` | One pass: `queue` is deterministic, `build` branches from the current branch (or stacks on an unmerged dependency), runs `build:loop` with that base for the baseline, commits. A loop that exits without a handoff is reported as a crash, not an escalation. `--pr` pushes and opens the PR. |
| `.claude/skills/plan`, `plan-review` | The two read-only skills. |
| `scripts/item.ts` | `idea` and `approve` (the local human plan gate). |
| `src/lib/drivers.ts` | Task 1 of the driver profile plan, built by dispatch. |

### Try it (local tracker)

```bash
export AGENT_TRACKER=local   # build branches start from the branch you are on (AGENT_BASE_BRANCH overrides)
npm run item -- idea driver-profile "Driver profile page" "A page per driver at /drivers/:id with name, team, points, wins and race results. Link driver names in the standings to it."
npm run dispatch            # plans: 2-3 tasks, Plan = Awaiting approval
npm run item -- approve driver-profile
npm run dispatch            # queues the tasks
npm run dispatch            # builds the first task whose dependencies are done
```

On monday: put `MONDAY_API_TOKEN` in `.env`, `npm run board:setup` (twice: the second run prints "nothing changed"), set `AGENT_TRACKER=monday`, and tick **Plan approved** on the board instead of `item approve`.
On monday, `item idea|add` print the id monday assigns (`created monday item 3353935995`); use that id afterwards, the `<id>` you typed is only a label.

`dispatch` uses the item list from the start of its pass, so a task that unblocks mid-pass is built on the next pass.
