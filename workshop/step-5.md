# Step 5: merge and `/flow` (15 min, stretch)

**Goal:** merging is one more gate, not a judgment. Then one skill drives the whole board and stops at every gate with the command for you.

**Where we are:** a babysat PR with Verify = Stable green. Behind? This also creates a PR waiting only for your gates:

```bash
git stash -u && git checkout -b step-4-solution template/step-4-solution && npm ci && npm run baseline -- --base HEAD && npm run seed -- --step 5
```

**Why** (failures #8 and #9 in step 0): an agent that can merge will merge its own work. And with five stages and three human gates, "what do I run next" becomes the hard part. The merge is a script with a fixed list of conditions, and every run tells you the next command.

## How it works

```
merge <id>: CI green, 0 threads, Visual Accepted, Human review Approved,
            no unmerged item below it in a stack, mergeable
   all true ─► squash-merge ─► retarget the PRs stacked on it ─► Merge = Merged
   else     ─► Merge = Blocked, every blocker listed, handoff written
```

**Stacks merge bottom first.** A task that depends on another is built on its branch, so its PR targets that branch. Dispatch waits with `merge <dep> first`; after that merge, `merge` points the stacked PR at the real base (`gh pr edit --base`), so it never lands in the dependency's branch.

**The Next block.** Every `dispatch` ends with one line per waiting item: what it waits for and, when it waits on you, the command (`→ npm run item -- review t2 approved`). `item show` prints the same as a `next:` line. When nothing waits on you, it says so.

## Scripts you use now

| Command | What it does |
|---|---|
| `npm run merge -- <id>` | No agent. Merges when every condition holds, else Merge = Blocked with every blocker listed. Dispatch runs it for you. |
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

2. **Write `flow`** (`.claude/skills/flow/SKILL.md`): run `npm run -s dispatch -- --pr --until-idle`, run `review-pr` once on each new PR, run dispatch again, then print the final **Next** block as it is: the commands are already in it. Never set a gate, never merge, never loop dispatch itself.
3. Add an idea to the board, then say `flow` in Claude Code. Run the gate commands it gives you, say `flow` again.

## What you should see

- `merge` with Changes requested: Merge = Blocked and the blocker named.
- After approval, reset and dispatch: the PR squash-merged, the task Done, and a PR stacked on it now targeting your branch.
- `/flow` ends with the Next block: one command per gate, none of them run.

## Split

| Script | Agent | You |
|---|---|---|
| merge blockers, the merge, retargeting, every board write, the pass loop | orders the scripts, reviews, reports | every gate |

## Done when

- A PR merged through `merge`, and its task is in Done on the board.
- `/flow` took a new idea to the Next block without you typing a script.
- You can name the one merge condition you would add for your own repo.

## What changed on `step-5-solution`

| File | What |
|---|---|
| `.claude/skills/flow/SKILL.md` | `/flow`: dispatch until idle, review new PRs once, dispatch again, then the gate commands for you. Never sets a gate. |
| `.claude/skills/merge/SKILL.md` | Optional: runs `npm run merge` and quotes it. Never `gh pr merge`, never sets a gate. |

**Next:** take it home. Pick the one failure from the table in step 0 that costs you most, and add only that piece to your own repo.
