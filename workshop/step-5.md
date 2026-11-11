# Step 5: merge gate (stretch, 15 min)

**Goal:** the merge is one more gate, not a judgment.

## Do

1. `merge` skill runs a script that checks: CI green, 0 open threads, `Visual = Accepted`, `Human review = Approved`, PR mergeable.
2. If all hold: `gh pr merge --squash`. Otherwise it escalates with what is missing.
3. Branch protection requires only the `gate` check. `npm run doctor` tells you if it is missing; `-- --fix` sets it.

## Done when

- The babysat PR is merged and the item is Done.
- You can name the one condition you would add for your own repo.
