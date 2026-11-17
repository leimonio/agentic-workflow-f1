# Step 0: setup and tour (10 min)

**Goal:** a working checkout, and a clear picture of what is a script and what is the agent.

Every script is already in the repo (`CLAUDE.md` lists them by step). You will not write scripts today: you write the agent side (skills, hooks, one decision function) and run the scripts. Each step starts with the scripts it uses.

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

1. Click **Use this template** on GitHub and make your copy **public** (on GitHub Free, private repos get no branch protection or auto-merge, which step 5 needs). Clone it and `cd` into it.
2. `nvm use && npm ci`. On Linux, if Playwright cannot start Chromium, doctor tells you to run `sudo npx playwright install-deps chromium` (system libraries; `--fix` never runs sudo).
3. `npm run doctor`. Every failure prints the exact fix. `npm run doctor -- --fix` applies the repo settings (Actions, auto-merge, branch protection) on your repo.
4. `npm run verify`. It runs lint, format (`prettier --check`), types, unit, stories and e2e. **Exactly one test fails, on purpose.**
5. `npm run baseline && npm run gate`. The gate says `PASS (0 new, 1 pre-existing)`.
6. Open `CLAUDE.md`. Find the rule about "verified".
7. `npm run dev` and click through Home, Calendar and a race.

## The line you will keep drawing

| Script (deterministic) | Agent (delegated) |
|---|---|
| `doctor`, `verify`, `baseline`, `gate` | nothing yet |

## Done when

- `npm run doctor` shows no ✘.
- `npm run gate` exits 0 and says 1 pre-existing.
- You can say why the gate passes although a test fails (the baseline remembers it; only NEW failures count).
