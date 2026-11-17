# Step 1: first skill, `build-feature` (25 min)

**Goal:** turn "build X" into a repeatable skill. No loop yet: you re-prompt by hand.

## Scripts you use now

| Command | What it does |
|---|---|
| `npm run verify -- --json` | The checks, as JSON the agent can read. |

## Do

1. Create `.claude/skills/build-feature/SKILL.md`. It must tell the agent to: read the task, read `CLAUDE.md`, write code **and** a unit test, a story and (for pages) an e2e test, run `npm run verify -- --json`, fix what it broke, and report.
2. Task: "Add a **Driver standings** page at `/standings/drivers`. Use `driverStandings` from `src/lib/standings.ts`. Add it to the nav."
3. Run `claude`, then `/build-feature <task>`.
4. Look at `verify`'s output yourself. If it reports a failure the agent missed, re-prompt.
5. **Hook: format every edit.** `verify` fails on unformatted files (`format:<file>`). Instead of letting the agent find that out later, make it impossible: add a Claude Code `PostToolUse` hook in `.claude/settings.json` that runs Prettier on the file the agent just edited.
   - Matcher: `Edit|Write|MultiEdit`.
   - The hook gets JSON on stdin; the edited path is `tool_input.file_path`.
   - Use `"$CLAUDE_PROJECT_DIR"` in the command path so it works from any directory. Prefer a small `node` script over `jq`: Node is already installed on every machine here.
   - Test it without Claude: `echo '{"tool_input":{"file_path":"src/App.tsx"}}' | node .claude/hooks/format.mjs`.
   - Then ask the agent to make an edit and check `npm run verify` shows no `format:` failure.

## Split

| Script | Agent |
|---|---|
| `verify` runs the checks | reads the task, writes code, reads failures, fixes |
| the hook formats every file the agent edits | (nothing: it can't forget) |

## Notice

`verify` exits 1 on `main` because of the planted test. The agent can't tell "mine" from "already broken". That is step 2.

A hook is deterministic code inside the agent's session. Anything a rule can fix (formatting) belongs in a hook or a script, not in the prompt.

## Done when

- `/standings/drivers` renders 20+ drivers ordered by points.
- New unit test, story and e2e test exist.
- `npm run verify` shows no failure other than the planted one.
- Editing a file through Claude leaves it Prettier-formatted (the hook ran).

## What changed on `step-1-solution`

- `.claude/skills/build-feature/SKILL.md`: the skill.
- `src/pages/DriverStandingsPage.{tsx,test.tsx,stories.tsx}`, the route in `src/App.tsx`, the "Drivers" nav link, one e2e test. All written by the skill (dogfood run: 44 s, 12 turns, $0.21 on sonnet).
- `.claude/settings.json` + `.claude/hooks/format.mjs`: the PostToolUse hook that runs Prettier on each edited file.
- Check: `git diff main --stat`, then `npm run baseline && npm run gate` → `PASS (0 new, 1 pre-existing)`. Norris leads with 423.
