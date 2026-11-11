# Step 2: verification gate and bounded loop (25 min)

**Goal:** the script owns the loop. The agent is called once per attempt and returns a verdict.

## Do

1. Run `npm run baseline` (records failures that exist before your change).
2. Update `build-feature` to finish with `npm run gate -- --json`. Only **new** failures count.
3. Add the loop script `scripts/build/loop.ts`: up to **3 attempts**; each is one `claude -p --output-format json` call returning `{status, summary, question?}`. Stable green = **2 consecutive gate passes**. Stop early if 2 attempts in a row fail the same way (same failure ids).
4. On exhaustion the script writes `.agent/handoff.md`: what happened, one line per attempt, the one question, how to resume.
5. Task: "Add **Constructor standings** at `/standings/constructors` and put the leader's points on the Home page." The Home change intentionally alters an existing Chromatic snapshot.
6. Run `npm run visual:status` after pushing. Visual changes wait for a human to accept them in Chromatic.

## Split

| Script | Agent |
|---|---|
| baseline, gate diff, attempt counter, stable-green check, early stop, handoff file, visual status | fixes only new failures, judges whether a visual diff is intended |

## Done when

- `npm run gate` exits 0.
- The loop unit tests pass (bounds, early stop, stable green).
- You can force an escalation (break a test on purpose) and read `.agent/handoff.md`.

## What changed on `step-2-solution`

| File | What |
|---|---|
| `scripts/lib/tracker.ts` | The `Tracker` interface (`list`, `get`, `update`, `log`, `handoff`), the `Item` fields (same names as the board columns in step 3), `renderHandoff` |
| `scripts/lib/local-tracker.ts` | Local adapter: `.agent/items/<id>.json`, `<id>.log`, `<id>.handoff.md` and the latest handoff in `.agent/handoff.md` |
| `scripts/lib/loop.ts` | Pure `decide(attempts, max)`: done (2 gate passes in a row), escalate (agent asked, same failure twice, or max reached), or attempt again. Unit-tested in `loop.test.ts` |
| `scripts/lib/agent.ts` | `runAgent(prompt)`: one `claude -p --output-format json --json-schema …` call, returns `{status, summary, question?}` plus cost |
| `scripts/build/loop.ts` | `npm run build:loop -- <id>`: baseline, then per attempt one agent call and the gate (twice if it passes). Every tracker write is here |
| `scripts/item.ts` | `npm run item -- add|show|reset`. `reset` is the only way to re-run a stage |
| `.claude/skills/build-feature/SKILL.md` | New "Inside the build loop" section: use the gate, return the verdict, never ask in text |
| `src/pages/ConstructorStandingsPage*`, `HomePage.tsx`, `App.tsx`, `Layout.tsx`, `e2e/site.spec.ts` | Written by the agent through the loop |

Try it:

```bash
npm run item -- add constructors "Constructor standings" "Add /standings/constructors … and the leader's points on Home"
npm run build:loop -- constructors
```

To see an escalation, add a test that cannot pass (for example expect the leader to have 999 points), then
`npm run item -- add escalate "Escalation demo" "Make the gate pass. You may not edit any test file or src/data/."` and
`npm run build:loop -- escalate`. Read `.agent/handoff.md`, delete the test, and `npm run item -- reset escalate build`.
