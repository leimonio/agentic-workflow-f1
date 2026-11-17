# Step 3: the board in the middle (35 min)

**Goal:** an idea goes on a monday board, an agent plans it, **you** approve the plan on the board, and dispatch builds the first task. The scripts are ready; you write the two planning skills.

Behind? `git checkout step-2-solution`.

## Scripts you use now

| Command | What it does |
|---|---|
| `npm run board:setup` | Creates the agent's own empty board and saves its id in `.agent/board.json`. Safe to rerun: the second run says "nothing changed". |
| `npm run item -- idea <label> "<title>" "<idea>"` | Adds an Idea and prints the id to use from then on. |
| `npm run dispatch [-- --pr]` | One pass over the board: plans, queues or builds each item. Its first line names the tracker. `--pr` opens a PR for what it builds. |
| `npm run item -- show <id>` | One item, with its plan. |

`dispatch` runs `plan:loop` for an idea: your plan skill → schema check (2–3 tasks, max 15 files) → your plan-review skill, 2 retries. Then it waits for you.

## Do

1. **Connect the board.** Put `MONDAY_API_TOKEN` in `.env` and set `AGENT_TRACKER=monday` there. Run `npm run board:setup` twice and open the URL it prints.
   No monday account? Keep `AGENT_TRACKER=local` and use `npm run item -- approve <id>` where step 4 says "tick".
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

## Split

| Script | Agent | You |
|---|---|---|
| board, `nextStage`, schema check, retry count, every board write | splits the idea, reviews the plan, builds the task | approve the plan |

## Done when

- The second `board:setup` run prints "nothing changed" and the same URL.
- The board shows 2–3 tasks under the idea, and you ticked Plan approved.
- One task is built and its PR is open.
