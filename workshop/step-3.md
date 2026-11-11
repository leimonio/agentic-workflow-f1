# Step 3: the board in the middle (35 min, likely over)

**Goal:** the same state machine, now on a monday board. The tracker is a transport; skills never know which one.

## Do

1. `Tracker` interface: `list, get, update, log, handoff`. Adapters: local (`.agent/items/<id>.json`) and monday. Select with `AGENT_TRACKER=local|monday`.
2. `npm run board:setup` (idempotent: second run changes nothing). Needs `MONDAY_API_TOKEN` in `.env`.
3. `board:read` and `board:write` are thin CLIs over `Tracker`.
4. `npm run dispatch` does one pass: the pure `nextStage(item)` decides each item's stage, dispatch runs it. `-- --watch` repeats every 60 s (demo only).
5. `plan` skill: idea "Driver profile page" becomes 2–3 tasks. Each task has one responsibility statement, files to touch (max 15 per task), acceptance criteria and a test. A script validates this schema (2 retries). A plan-review agent judges single responsibility.
6. **Human gate:** you set `Plan approved`. The agent never does.
7. `build-feature` now picks up Ready tasks and writes Build columns through `Tracker`.

## Split

| Script | Agent |
|---|---|
| `board:*`, `dispatch`, `nextStage`, schema validation, retry count | splits the idea, reviews the plan, builds the task |

## Done when

- `nextStage` and schema-validation tests pass.
- Running `board:setup` twice changes nothing.
- One task is built and its PR is open.
