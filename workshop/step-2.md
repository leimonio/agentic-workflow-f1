# Step 2: the script owns the loop (25 min)

**Goal:** the build loop is a script. The agent is called once per attempt and returns a verdict; one small pure function decides what happens next. You write that function.

**Where we are:** the `build-feature` skill, the format hook and the Driver standings page from step 1, committed on `main`. Behind?

```bash
git stash -u && git checkout -b step-1-solution template/step-1-solution && npm ci && npm run baseline -- --base HEAD
```

**Why** (failure #4 in step 0): in step 1 *you* were the loop. You ran the skill, read `verify`, and decided whether to re-prompt. That has three problems:

- **The agent grades itself.** It says "done" when it *thinks* it is done.
- **Nobody counts.** It could retry forever or give up after one try, and you can't tell which.
- **There is no clean stop.** When it is stuck, you get a long chat instead of one clear question.

**What a loop is:** a script that repeats one attempt until a stop rule fires. Each turn is one agent call, then an independent check (the gate). The *script* holds the counter and the rules, so the same input always gives the same decision.

## How it works

```
build:loop <id>
  baseline (once)
  ┌─► attempt N: one agent call (build-feature, "inside the build loop") ─► verdict JSON
  │   gate, twice (two passes in a row = stable, catches flaky tests)
  │   decide(attempts):
  │     stable green               ─► done
  │     agent asked (needs_human)  ─► escalate
  │     same failures twice        ─► escalate
  │     3 attempts used            ─► escalate
  └──── otherwise                  ─► attempt again
  escalate ─► .agent/items/<id>.handoff.md: what failed, what was tried, one question for you
```

The agent's "ok" is advisory only: `decide()` reads the gate.

**The tracker (local for now).** The loop reads the task from, and writes its state to, `.agent/items/<id>.json`. `item` is the human side of the tracker:

| Command | What it does |
|---|---|
| `npm run item -- add <id> "<title>" "<task>"` | Creates a task with Build = Queued, ready for `build:loop`. |
| `npm run item -- show <id>` | Prints the item (Build, attempts, `needsHuman`, log) and a `next:` line with what comes next. |
| `npm run item -- reset <id> build` | Sets Build back to Queued and attempts to 0. **The only way to re-run a stage:** scripts never re-run one on their own. |

## Scripts you use now

| Command | What it does |
|---|---|
| `npm run item -- add` / `show` / `reset` | The tracker, above. |
| `npm run build:loop -- <id>` | Baseline, then per attempt: one agent call (your `build-feature` skill), then the gate. Max 3 attempts. Escalates with `.agent/items/<id>.handoff.md`. |
| `npm run visual:status` | Chromatic's verdict for HEAD. Visual changes wait for a human. |

## Do

1. **Write `decide()`** in `scripts/lib/loop.ts` and change `describe.skip` to `describe` in `scripts/lib/loop.test.ts`. The comment above `decide()` lists the rules; `npx vitest run scripts/lib/loop.test.ts` checks each one.
2. **Add "Inside the build loop" to `build-feature`.** When the prompt says it runs inside a script-owned loop, the skill must:
   - run `npm run format`, then `npm run -s gate -- --json` instead of verify. Only `newFailures` are its own. (Loop agents run with **your hooks off**, to keep each attempt cheap and quiet, so the format hook does not run there.)
   - never ask in text: return `needs_human` with the question.
   - treat its JSON verdict as the report.
3. **Commit first** if you have not: run by hand, the loop edits *this* checkout.
4. **Run it.**

   ```bash
   npm run item -- add constructors "Constructor standings" "Add Constructor standings at /standings/constructors and put the leader's points on the Home page."
   npm run build:loop -- constructors
   npm run item -- show constructors
   ```

   The Home change alters an existing story on purpose: after you push, `npm run visual:status` shows it waiting for a human.
5. **Force an escalation.** Add a test that cannot pass to the end of `src/lib/standings.test.ts`:

   ```ts
   it('escalation demo: leader has 999 points', () => {
     expect(driverStandings(season.races)[0]?.points).toBe(999)
   })
   ```

   ```bash
   npm run item -- add escalate "Escalation demo" "Make the gate pass. You may not edit any test file or src/data/."
   npm run build:loop -- escalate
   cat .agent/items/escalate.handoff.md
   ```

   Delete the test, then `npm run item -- reset escalate build`.

## What you should see

- `loop.test.ts`: 9 tests pass.
- `constructors`: typically one attempt, then `gate PASS` twice. `item show` gives `"build": "Done"`. A new page, a nav link and a Home change.
- `escalate`: it stops early. The agent returns `needs_human` instead of faking data, and the handoff has one question.

## Split

| Script | Agent | You |
|---|---|---|
| baseline, gate, attempt counter, `decide()`, handoff file, tracker writes | fixes only new failures, returns a verdict | read the handoff, decide |

## Done when

- `scripts/lib/loop.test.ts` passes.
- `build:loop -- constructors` ends with 2 gate passes in a row.
- The escalation demo stops early and its handoff has one question for you.
- You can say who decided to stop: `decide()`, not the agent.

**Next:** the loop builds a task, but you still wrote the task by hand. In [step 3](step-3.md) an agent plans the tasks from an idea, and you approve the plan first.
