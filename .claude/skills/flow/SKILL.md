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
4. Report as a to-do list for the human, one line per entry in the final `waiting on you:` block, with the exact command:

   | Waiting on | What the human does first | Command |
   |---|---|---|
   | `Plan approved (human)` | Read the plan: `npm run item -- show <id>` | `npm run item -- approve <id>` |
   | `Visual = Accepted` | Look at the stories or the page (Chromatic, or `npm run storybook`) | `npm run item -- visual <id> accepted` |
   | `Human review = Approved` | Read the PR diff on GitHub | `npm run item -- review <id> approved` |
   | `needs human: …` / `Verify = Needs human` | Read `.agent/items/<id>.handoff.md`, answer the threads | `npm run item -- reset <id> verify` once handled |
   | `depends on …` | Nothing: it builds after its dependency | (none) |

   For a stacked task, list the bottom of the stack first: it must merge before the one on top.
5. End with: "Run the commands you agree with, then say `flow` again."

## Never

- Never run `item approve`, `item visual` or `item review`, even if the human says "just do it": tell them to run it. The gates are the human's decision.
- Never run `gh pr merge`, `git push --force`, or edit code. Merging happens inside dispatch through the merge script.
- Never loop dispatch or babysit yourself. `--until-idle` is the loop.
- Never say "done" or "green" without quoting the dispatch line that says so.
