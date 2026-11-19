# F1 2025: agentic workflow workshop starter

Starter repo for "Creating Autonomous, Verifiable Agentic Workflows with Human in the Loop".

Runs on macOS and Linux. On Windows, use WSL2 (Ubuntu) and clone inside it. You need nvm (or Node 24+), git, the GitHub CLI and Claude Code; `npm run doctor` prints the install command for anything missing.

```bash
nvm use            # Node 26 (>= 24 works)
npm ci
npm run doctor     # tells you exactly what is missing; `-- --fix` applies repo settings
npm run verify     # expect 1 known failure (see CLAUDE.md)
npm run dev
```

Start with [workshop/step-0.md](workshop/step-0.md). Create your copy with **Include all branches** ticked. Didn't finish a step? Switch to the solution branch of the step before; steps 4 and 5 also need `seed`, which recreates the board items and the task PR that git can't hold:

| To start step | Run |
|---|---|
| 2 | `git switch step-1-solution` |
| 3 | `git switch step-2-solution` |
| 4 | `git switch step-3-solution && npm run seed -- --step 4` |
| 5 | `git switch step-4-solution && npm run seed -- --step 5` |

Each step's "Behind?" line has the full command (with `git stash -u`, `npm ci` and the baseline). Task PRs then target the solution branch you are on, not `main`: that is expected.

Secrets live in `.env` (copy `.env.example`). Never commit it.
