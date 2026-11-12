# F1 2025 — workshop app

A small React app (race calendar, race results, home) built for the workshop
"Autonomous, Verifiable Agentic Workflows with Human in the Loop".

## The rule: deterministic versus delegated

| Deterministic (scripts: same output every time, no model) | Delegated (you: judgment) |
|---|---|
| Loops, attempt counters, bounds, gates, every tracker write | Reading the task, writing code and tests, reading failures, deciding what to change |

- A script owns every loop and counter. You never count your own retries.
- You never set a human gate (`Plan approved`, `Human review`, accepting a visual change).
- **Never say "verified", "done" or "passing" unless you ran `npm run gate` in this session and quote its last line.**
  Reading your own code is not verification.

## Scripts (all take `--json`; prefer `npm run -s <name> -- --json` for clean stdout)

| Script | What it does |
|---|---|
| `npm run doctor [-- --fix]` | Checks Node, git, gh, claude, Playwright, tokens and repo settings. `--fix` applies what it can. |
| `npm run verify` | lint, types, unit, stories, e2e. Writes `.agent/verify.json` (`{check,id,status,message}[]`). Exits 1 if anything fails. |
| `npm run baseline` | Runs verify on the merge base in a clean worktree. Writes `.agent/baseline.json`. |
| `npm run gate` | Runs verify, diffs against the baseline. Exits 1 only on NEW failures. Reports new, pre-existing and fixed. |
| `npm run visual:status` | Reads Chromatic's PR statuses for HEAD. Writes `.agent/visual.json`. |
| `npm run build:loop -- <id>` | The build loop: one agent call per attempt, gate after each, max 3. Escalates with a handoff. |
| `npm run plan:loop -- <id>` | Plan agent, schema check, plan-review agent, 2 retries. Writes the task items. |
| `npm run dispatch [-- --watch] [-- --pr]` | One pass over the tracker; runs whatever stage each item is at. |
| `npm run pr:status -- <id>` / `babysit -- <id>` | PR checks and threads; one verify tick (triage, fix, reply, resolve or escalate). |
| `npm run merge -- <id>` | The merge gate: CI green, 0 threads, Visual Accepted, Human review Approved, mergeable → squash-merge. Else Blocked + handoff. |
| `npm run item -- idea\|add\|approve\|reset\|show` | Human CLI for the tracker. `approve` is the human plan gate. |
| `npm run board:setup` / `board:read` / `board:write` | monday board: create or complete it (idempotent), read items, write non-human fields. |
| `npm run data:fetch` | Author-only. Re-downloads the season snapshot. The app and tests never use the network. |

Workflow for any change: `npm run baseline` once, edit, `npm run gate` until it reports 0 new failures.

## Project map

- `src/data/season-2025.json`: committed snapshot (races, results, sprints, drivers, constructors). `src/data/season.ts` exposes it.
- `src/lib/standings.ts`: pure functions `driverStandings` and `constructorStandings` (races in, ranked rows out).
- `src/lib/dates.ts`: `formatRaceDate`.
- `src/pages/*Page.tsx`: routes (registered in `src/App.tsx`). `src/components/`: Layout, shared components, `ui/` (shadcn style).
- `src/test/`: test helpers (`renderAt(path)`, `withRouter` story decorator).
- `scripts/`: the deterministic scripts. `scripts/lib/` holds the pure, unit-tested parts.
- `.agent/`: generated state (git-ignored). Do not edit by hand.
- `workshop/step-N.md`: the instructions for each workshop step.

## Conventions

- Every page or component ships with: a unit test (Testing Library, `*.test.tsx`), a story (`*.stories.tsx`) and, for pages, an e2e test in `e2e/`.
- New pages: add the route in `src/App.tsx` and the link in `navItems` in `src/components/Layout.tsx`.
- Team colours are hex values. No official F1 or team logos.
- TypeScript is strict. No `any`.

## Known failure (on purpose)

`src/lib/dates.test.ts` "keeps the circuit calendar date for a viewer in Los Angeles" fails on `main`.
It is recorded in the baseline, so `gate` reports it as pre-existing. Do not fix it unless asked.
