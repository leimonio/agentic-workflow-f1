# Step 0: setup and tour (10 min)

**Goal:** a working checkout, and a clear picture of what is a script and what is the agent.

**Where we are:** your template copy's `main`. It holds a small React app, every script for the day (`scripts/`, listed by step in `CLAUDE.md`) and no skills or hooks yet. `decide()` in `scripts/lib/loop.ts` is a stub (you write it in step 2), and its tests are skipped. One test fails on purpose: the Los Angeles date test.

You will not write scripts today. You write the agent side (skills, hooks, one decision function) and run the scripts.

## Why all these pieces

An agent that runs unattended still has to answer: how many retries, what counts as done, when to stop, who may approve, where the state lives. Without scripts the model answers them silently. Each piece today moves one answer out of the model into code you can read and re-run:

| # | Without it | The piece that prevents it | Step |
|---|---|---|---|
| 1 | The agent says "done" while tests fail | `gate`: verify against the baseline; "verified" means you quote its last line | 0 |
| 2 | Old failures hide new ones, or block everything | `baseline`: only new failures count | 0 |
| 3 | You retype the prompt and the agent forgets the conventions | a skill, plus a hook for what a rule can fix | 1 |
| 4 | It retries forever, or gives up silently | the build loop: max 3 attempts, then one question | 2 |
| 5 | Code gets written before anyone agreed on the plan | the tracker and the Plan approved gate | 3 |
| 6 | It works in your checkout and moves your branch | a worktree per item | 3 |
| 7 | It "fixes" opinions and argues with real defects | babysit: triage with evidence, discussions go to you | 4 |
| 8 | It approves or merges its own work | human-only gates and the merge script | 4–5 |
| 9 | Nobody knows which command comes next | every run ends with `Next`; `/flow` drives the rest | 5 |

When it is **not** worth it: one task, done interactively while you watch. Plain Claude Code is simpler there. This pays off when many items run unattended, in parallel or on a cheaper model, and you need to trust the result without watching.

## How it works

```
doctor ─► verify (lint, format, types, unit, stories, e2e) ─► baseline (failures on origin/main) ─► gate = verify − baseline
```

## Scripts you use now

| Command | What it does |
|---|---|
| `npm run doctor [-- --fix]` | Checks Node, git, gh, claude, Playwright and the repo settings. Every failure prints its fix. |
| `npm run verify` | lint, format, types, unit, stories, e2e. Exits 1 if anything fails. |
| `npm run baseline` | Records the failures that exist before your change. |
| `npm run gate` | verify, minus the baseline: fails only on **new** failures. |

## Before you start

Runs on macOS and Linux. On Windows, use WSL2 (Ubuntu) and clone inside it. You need nvm (or Node 24+), git, the GitHub CLI and Claude Code; `npm run doctor` prints the install command for anything missing.

## Do

1. Click **Use this template** on GitHub, tick **Include all branches** (the `step-N-solution` branches are your safety net if you fall behind), and make your copy **public** (on GitHub Free, private repos get no branch protection or auto-merge, which step 5 needs). Clone it and `cd` into it.
2. `nvm use && npm ci`. On Linux, if Playwright cannot start Chromium, doctor tells you to run `sudo npx playwright install-deps chromium` (system libraries; `--fix` never runs sudo).
3. `npm run doctor`. Every failure prints the exact fix. `npm run doctor -- --fix` applies the repo settings (Actions, auto-merge, branch protection) on your repo.
4. `npm run verify`. It runs lint, format (`prettier --check`), types, unit, stories and e2e. **Exactly one test fails, on purpose.**
5. `npm run baseline && npm run gate`. The gate says `PASS (0 new, 1 pre-existing)`.
6. Open `CLAUDE.md`. Find the rule about "verified".
7. `npm run dev` and click through Home, Calendar and a race.
8. **Behind at the start of a step?** Each step from 2 on has a "Behind?" line. Run it only if you did not finish the step before: it switches to that step's solution branch, which your copy already has.

   ```bash
   git stash -u && git switch step-1-solution && npm ci && npm run baseline -- --base HEAD   # the line in step 2
   ```

   `--base HEAD`: a solution branch may share no history with your `main`, so the baseline is taken from the branch itself. Steps 4 and 5 add `npm run seed`: it recreates the board items and the task PR, which git can't hold.

   Forgot to tick **Include all branches**? Fetch the one branch you need from the template and push it: `git fetch https://github.com/leimonio/agentic-workflow-f1.git step-1-solution:step-1-solution && git push -u origin step-1-solution`.

## What you should see

- `doctor`: all ✔. A `!` for the Node version or Chromatic is fine.
- `verify`: exits 1 with one failure, `unit:src/lib/dates.test.ts::…Los Angeles`.
- `gate`: `PASS (0 new, 1 pre-existing)`.

## The line you will keep drawing

| Script (deterministic) | Agent (delegated) |
|---|---|
| `doctor`, `verify`, `baseline`, `gate` | nothing yet |

## Done when

- `npm run doctor` shows no ✘.
- `npm run gate` exits 0 and says 1 pre-existing.
- `git branch -r` lists `origin/step-1-solution` to `origin/step-5-solution`.
- You can say why the gate passes although a test fails (the baseline remembers it; only NEW failures count).

**Next:** you have checks but no agent yet. [Step 1](step-1.md) gives the agent its first skill.
