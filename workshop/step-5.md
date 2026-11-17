# Step 5: merge and `/flow` (15 min, stretch)

**Goal:** merging is one more gate, not a judgment. Then one skill drives the whole board and stops at every gate with the command for you.

Behind? `git checkout step-4-solution && npm run seed -- --step 5` (a babysat PR waiting only for your gates).

## Scripts you use now

| Command | What it does |
|---|---|
| `npm run merge -- <id>` | No agent. CI green, 0 threads, Visual Accepted, Human review Approved, mergeable → squash-merge. Else Merge = Blocked with every blocker listed. Dispatch runs it for you. |
| `npm run dispatch -- --pr --until-idle` | Repeats passes until one changes nothing (max 10): everything left waits on a human. |
| `npm run item -- reset <id> merge` | Try the merge again. |

Branch protection requires only the `gate` check: `npm run doctor` tells you if it is missing, `-- --fix` sets it.

## Do

1. **See the merge gate refuse.**

   ```bash
   npm run item -- review <id> changes
   npm run merge -- <id>                    # Blocked: Human review is Changes requested
   npm run item -- review <id> approved
   npm run item -- reset <id> merge
   npm run dispatch                         # → merged PR, task moves to Done
   ```

2. **Write `flow`** (`.claude/skills/flow/SKILL.md`): run `npm run -s dispatch -- --pr --until-idle`, run `review-pr` once on each new PR, run dispatch again, then print one line per `waiting:` line with the exact command for the human. Never set a gate, never merge, never loop dispatch itself.
3. Add an idea to the board, then say `flow` in Claude Code. Run the gate commands it gives you, say `flow` again.

## Split

| Script | Agent | You |
|---|---|---|
| merge blockers, the merge, every board write, the pass loop | orders the scripts, reviews, reports | every gate |

## Done when

- A PR merged through `merge`, and its task is in Done on the board.
- `/flow` took a new idea to "waiting on you" without you typing a script.
- You can name the one merge condition you would add for your own repo.

## What changed on `step-5-solution`

| File | What |
|---|---|
| `.claude/skills/flow/SKILL.md` | `/flow`: dispatch until idle, review new PRs once, dispatch again, then the gate commands for you. Never sets a gate. |
| `.claude/skills/merge/SKILL.md` | Optional: runs `npm run merge` and quotes it. Never `gh pr merge`, never sets a gate. |
