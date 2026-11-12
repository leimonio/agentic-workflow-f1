---
name: merge
description: Merge one task's PR through the merge gate script. Use when the user says "merge item X" or dispatch reaches the merge stage.
---

# merge

The merge is a gate, not a judgment. The script decides; you run it and report.

1. `npm run -s merge -- <item-id>`.
2. Quote its last line. On `merged PR #N`, say so. On `blocked: …`, list the blockers and the resume line from the handoff.

The gate (in `scripts/lib/pr.ts`, `mergeBlockers`): PR open, CI green, 0 unresolved threads, `Visual` = Accepted, `Human review` = Approved, GitHub says mergeable.

## Never

- Never run `gh pr merge` yourself, or `--admin`, or anything that skips the script.
- Never set `Visual`, `Human review` or `Merge` to make the gate pass.
