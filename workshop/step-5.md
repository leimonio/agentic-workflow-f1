# Step 5: merge gate (stretch, 15 min)

**Goal:** the merge is one more gate, not a judgment.

## Do

1. `merge` skill runs a script that checks: CI green, 0 open threads, `Visual = Accepted`, `Human review = Approved`, PR mergeable.
2. If all hold: `gh pr merge --squash`. Otherwise it escalates with what is missing.
3. Branch protection requires only the `gate` check. `npm run doctor` tells you if it is missing; `-- --fix` sets it.

## Done when

- The babysat PR is merged and the item is Done.
- You can name the one condition you would add for your own repo.

## What changed on `step-5-solution`

| File | What |
|---|---|
| `scripts/merge.ts` | `npm run merge -- <item-id>`. No agent. Re-reads the PR live, runs `mergeBlockers`, then `gh pr merge --squash` and checks GitHub says MERGED, or sets Merge = Blocked with a handoff listing every blocker. Keeps the branch (stacked tasks use it as their base). |
| `.claude/skills/merge/SKILL.md` | Runs the script and quotes it. Never `gh pr merge` directly, never sets a gate. |
| `scripts/dispatch.ts` | The `merge` stage runs `merge`. `nextStage` only reaches it when Verify = Stable green, Visual = Accepted and Human review = Approved. |
| `scripts/item.ts` | `reset <id> merge`: Merge = Waiting, clears Needs human. |

Branch protection: `npm run doctor` checks that the default branch requires the `gate` check (and that Actions and auto-merge are on); `-- --fix` sets it with `gh api … /branches/main/protection`. It requires no approving review on purpose: you cannot approve your own PR, and the merge permission is `Human review` = Approved in the tracker. Public repos (or GitHub Pro) only; GitHub Free silently ignores protection on private repos.

### Try it

```bash
npm run item -- review <item-id> changes
npm run merge -- <item-id>                 # blocked: Human review is Changes requested
npm run item -- review <item-id> approved
npm run item -- reset <item-id> merge
npm run dispatch                           # → merge → merged PR #N
```
