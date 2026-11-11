# F1 2025: agentic workflow workshop starter

Starter repo for "Creating Autonomous, Verifiable Agentic Workflows with Human in the Loop".

```bash
nvm use            # Node 26 (>= 24 works)
npm ci
npm run doctor     # tells you exactly what is missing; `-- --fix` applies repo settings
npm run verify     # expect 1 known failure (see CLAUDE.md)
npm run dev
```

Start with [workshop/step-0.md](workshop/step-0.md). Behind? `git checkout step-N-solution` (after adding the template as a remote), then `npm run seed -- --step N`.

Secrets live in `.env` (copy `.env.example`). Never commit it.
