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
