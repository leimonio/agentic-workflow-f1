# Step 1: first skill, `build-feature` (25 min)

**Goal:** turn "build X" into a repeatable skill. No loop yet: you re-prompt by hand.

## Do

1. Create `.claude/skills/build-feature/SKILL.md`. It must tell the agent to: read the task, read `CLAUDE.md`, write code **and** a unit test, a story and (for pages) an e2e test, run `npm run verify -- --json`, fix what it broke, and report.
2. Task: "Add a **Driver standings** page at `/standings/drivers`. Use `driverStandings` from `src/lib/standings.ts`. Add it to the nav."
3. Run `claude`, then `/build-feature <task>`.
4. Look at `verify`'s output yourself. If it reports a failure the agent missed, re-prompt.

## Split

| Script | Agent |
|---|---|
| `verify` runs the checks | reads the task, writes code, reads failures, fixes |

## Notice

`verify` exits 1 on `main` because of the planted test. The agent can't tell "mine" from "already broken". That is step 2.

## Done when

- `/standings/drivers` renders 20+ drivers ordered by points.
- New unit test, story and e2e test exist.
- `npm run verify` shows no failure other than the planted one.
