# Step 3: the board in the middle (35 min)

**Goal:** an idea goes on a monday board, an agent plans it, **you** approve the plan on the board, and dispatch builds the first task. The scripts are ready; you write the two planning skills and a tracker skill.

**Where we are:** your step 2 work: `decide()` is written and `build-feature` knows it runs inside a loop. Behind?

```bash
git stash -u && git checkout -b step-2-solution template/step-2-solution && npm ci && npm run baseline -- --base HEAD
```

**Why** (failures #5 and #6 in step 0): real work starts as an idea, not a task. The board makes the agent's plan visible and gives you a gate before any code is written. And builds move out of your checkout.

## What changes from step 2

| | Step 2 | Step 3 |
|---|---|---|
| Input | one task you wrote | an **idea**, which the agent splits into 2–3 tasks |
| Tracker | local files in `.agent/items/` | a **monday board** (or the same local files) |
| Who runs what | you run `build:loop <id>` | `dispatch` reads the tracker and runs whatever stage each item is at |
| Human gate | none before code, only the escalation handoff | **Plan approved**, before any code is written |
| Where code is built | your checkout | `.agent/worktrees/<id>`, so your branch never moves |
| Output | a local change | a branch, and a **PR** with `--pr` |

## The tracker

One shape for every item (title, type, Plan, Build, Verify, Merge, Visual, Human review, `dependsOn`) behind one interface (`list`, `get`, `create`, `update`, `log`). Two implementations:

- `AGENT_TRACKER=local`: one JSON file per item in `.agent/items/`. Ids are the labels you type.
- `AGENT_TRACKER=monday`: the board `board:setup` creates, one column per field. monday assigns numeric ids, so `item idea` prints the id to use from then on.

The scripts don't care which one is active; `dispatch`'s first line names it. Plan approved, Visual and Human review are **human only**: the scripts read them and never write them (`board:write` refuses, and `item` refuses inside an agent's shell).

## How it works

```
item idea   ─► Idea, Plan = Not started
dispatch    ─► plan:loop: plan-tasks ─► schema check (2–3 tasks, ≤15 files) ─► plan-review (2 retries)
            ─► tasks on the tracker, Plan = Awaiting approval
YOU         ─► tick Plan approved (or item approve <id>)
dispatch    ─► tasks Queued; nextStage() checks dependsOn
dispatch --pr ─► build:loop for each ready task, in .agent/worktrees/<id> ─► commit on agent/<id> ─► PR
```

`dispatch` is one pass. For each item the pure function `nextStage()` (`scripts/lib/stage.ts`) returns a stage to run or what it waits for: the same idea as `decide()`, one level up. Every run ends with a **Next** block: one line per waiting item, with the command if it waits on you.

The worktree is removed after the commit (the branch keeps the work) and kept when the loop escalates, so you can read what the agent left. A task's base is the branch you run dispatch on, or its dependency's branch when that is not merged yet. On a solution branch, task PRs therefore target that branch, not `main`: expected.

## Scripts you use now

| Command | What it does |
|---|---|
| `npm run board:setup` | Creates the agent's own empty board and saves its id in `.agent/board.json`. Safe to rerun: the second run says "nothing changed". |
| `npm run -s board:read [-- <id>]` | Every item (or one) as JSON. |
| `npm run item -- idea <label> "<title>" "<idea>"` | Adds an Idea and prints the id to use from then on. |
| `npm run dispatch [-- --pr]` | One pass over the tracker. Without `--pr` a built task stays a local branch; the next `dispatch -- --pr` opens its PR. |
| `npm run item -- show <id>` | One item, with its plan and a `next:` line. |

## Do

1. **Connect the board.** Put `MONDAY_API_TOKEN` in `.env` and **change** the existing `AGENT_TRACKER=local` line to `AGENT_TRACKER=monday` (do not add a second line: the last one wins, and the scripts warn about it). Run `npm run board:setup` twice and open the URL it prints.
   No monday account? Keep `AGENT_TRACKER=local` and use `npm run item -- approve <id>` where this step says "tick".
2. **Write two read-only skills.**
   - `.claude/skills/plan-tasks/SKILL.md`: split one idea into 2–3 tasks, one PR and one responsibility each, with files, acceptance criteria, a test and `dependsOn`. Ask (`needs_human`) instead of guessing.
   - `.claude/skills/plan-review/SKILL.md`: one pass, judges single responsibility and broken in-between states.

   Call it `plan-tasks`, not `plan`: global skills often use that name. The script puts your file into the prompt, so a missing skill stops with "Write it first".
3. **Plan an idea.**

   ```bash
   npm run item -- idea driver-profile "Driver profile page" "A page per driver at /drivers/:id with name, team, points, wins and race results. Link driver names in the standings to it."
   npm run dispatch            # Plan = Awaiting approval, tasks on the board
   ```

4. **You approve.** Read the plan on the board, then tick **Plan approved**. The agent never does.

   ```bash
   npm run dispatch            # queues the tasks
   npm run dispatch -- --pr    # builds the first ready task and opens its PR
   ```

5. **Write a `tracker` skill** (`.claude/skills/tracker/SKILL.md`), so you can talk about items instead of typing ids: "show the driver profile idea", "reset the build of the routing task".
   - Resolve the id from the description with `npm run -s board:read`. Zero or several matches: list them and ask.
   - Run `item show`, `add`, `idea` and `reset` (only when asked).
   - **Print, never run,** the gate commands (`approve`, `visual`, `review`): the human runs them.
   - Back it with a `PreToolUse` hook on `Bash` in `.claude/settings.json` that blocks `npm run item -- approve|review|visual`, so the rule holds even when the prompt is ignored.

## What you should see

- `board:setup` run twice: "nothing changed" and the same URL.
- After the first `dispatch`: an idea with 2–3 tasks, each with files, acceptance criteria and `dependsOn`. Plan = Awaiting approval, and the Next block tells you to approve.
- After approval and `dispatch -- --pr`: one task with Build = Done and a PR link. `git branch --show-current` is unchanged.
- A task that depends on another waits for a later pass.

## Split

| Script | Agent | You |
|---|---|---|
| board, `nextStage`, schema check, retry count, every board write | splits the idea, reviews the plan, builds the task | approve the plan |

## Done when

- The second `board:setup` run prints "nothing changed" and the same URL.
- The board shows 2–3 tasks under the idea, and you ticked Plan approved.
- One task is built and its PR is open.
- Asking Claude to approve the plan prints the command instead of running it.

## What changed on `step-3-solution`

| File | What |
|---|---|
| `.claude/skills/plan-tasks`, `plan-review` | The two read-only skills. |
| `.claude/skills/tracker`, `.claude/hooks/human-gates.mjs` | Items by description; the PreToolUse hook blocks `item approve\|review\|visual` from Claude. |
| `src/lib/drivers.ts` | Task 1 of the driver profile plan, built by dispatch. |

`dispatch` uses the item list from the start of its pass, so a task that unblocks mid-pass is built on the next pass: that is why step 4 runs it twice.

**Next:** a PR is open, and PRs get review comments. [Step 4](step-4.md) triages them with evidence.
