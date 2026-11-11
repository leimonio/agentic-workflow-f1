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
