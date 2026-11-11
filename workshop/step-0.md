# Step 0: setup and tour (10 min)

**Goal:** a working checkout, and a clear picture of what is a script and what is the agent.

## Do

1. Click **Use this template** on GitHub and make your copy **public** (on GitHub Free, private repos get no branch protection or auto-merge, which step 5 needs). Clone it and `cd` into it.
2. `nvm use && npm ci`
3. `npm run doctor`. Every failure prints the exact fix. `npm run doctor -- --fix` applies the repo settings (Actions, auto-merge, branch protection) on your repo.
4. `npm run verify`. It runs lint, types, unit, stories and e2e. **Exactly one test fails, on purpose.**
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
