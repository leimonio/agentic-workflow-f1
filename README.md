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

Start with [workshop/step-0.md](workshop/step-0.md). Behind at the start of step N? `git checkout step-(N-1)-solution` (after adding the template as a remote). For steps 4 and 5, also run `npm run seed -- --step N`: it creates the tracker items and the task PR that git can't restore. Step 3 makes its own items.

Secrets live in `.env` (copy `.env.example`). Never commit it.
