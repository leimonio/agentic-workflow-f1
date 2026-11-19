---
name: flow
description: Drive the agent board end to end in one go - run dispatch until every item waits on a human, review new PRs once, then print the exact gate commands for the human. Never sets a gate. Use when the user says "flow", "run the flow", "drive the board", or "move everything forward".
---

# flow

You save the human from typing dispatch, review and merge commands one by one. The scripts still own every loop, count and tracker write; you run them in order and report. The human still sets every gate.

## Steps

1. Run `npm run -s dispatch -- --pr --until-idle`. It repeats passes until a pass changes nothing (max 10). Do not loop it yourself.
2. For each `PR <url>` line in that output, run the `review-pr` skill on that PR once. Skip PRs you already reviewed in this session.
3. If step 2 posted any review, run `npm run -s dispatch -- --pr --until-idle` again so babysit triages the new threads.
4. Report the final `Next (waiting on you or on another item):` block from the last dispatch, one line per entry, as it is: each line already names what it waits for and, after `→`, the exact command. Before each command, say what the human looks at first:
   - `Plan approved`: the plan, `npm run item -- show <id>`.
   - `Visual`: the stories or the page (Chromatic, or `npm run storybook`).
   - `Human review`: the PR diff on GitHub.
   - `needs human` / `Verify = Needs human`: `.agent/items/<id>.handoff.md` and the threads.
   - `merge <id> first`, `depends on …`: nothing, it moves after the other item.

   If the block says nothing waits on you, say so and quote it.
5. End with: "Run the commands you agree with, then say `flow` again."

## Never

- Never run `item approve`, `item visual` or `item review`, even if the human says "just do it": tell them to run it. The gates are the human's decision.
- Never run `gh pr merge`, `git push --force`, or edit code. Merging happens inside dispatch through the merge script.
- Never loop dispatch or babysit yourself. `--until-idle` is the loop.
- Never say "done" or "green" without quoting the dispatch line that says so.
