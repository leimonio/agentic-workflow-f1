# Step 1: first skill, `build-feature` (25 min)

**Goal:** turn "build X" into a repeatable skill. No loop yet: you re-prompt by hand.

**Where we are:** `main` from step 0, with the baseline recorded. No skills, no hooks.

**Why** (failure #3 in step 0): a prompt you retype is a prompt you forget. A skill turns "build a feature here" into a recipe that carries the repo's conventions (unit test, story, e2e). A hook covers whatever a rule can fix, like formatting, so the agent never has to remember it.

## How it works

```
you: /build-feature <task> ─► agent writes code + tests ─► agent runs verify ─► you read verify ─► re-prompt if needed
                 every Edit/Write ─► PostToolUse hook ─► prettier on that file
```

You are still the loop: you decide when to re-prompt.

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
6. **Commit and push to `main`.** Step 2 runs the loop in this checkout, and a clean tree shows exactly what the agent changed.

   ```bash
   git add -A && git commit -m "Step 1: build-feature skill and format hook" && git push
   ```

   No PR for this one: you are the reviewer, and the PR flow starts in step 3. After `doctor -- --fix`, the push prints `Required status check "gate" is expected`: that is GitHub noting your admin bypass, and the push went through.

## What you should see

- A new `DriverStandingsPage` with a unit test and a story, a route, a "Drivers" nav link and an e2e test. Norris leads with 423.
- `verify` shows only the planted failure, and never a `format:` failure.

## Split

| Script | Agent |
|---|---|
| `verify` runs the checks | reads the task, writes code, reads failures, fixes |
| the hook formats every file the agent edits | (nothing: it can't forget) |

## Notice

`verify` exits 1 on `main` because of the planted test. The agent can't tell "mine" from "already broken". And you counted the retries. That is step 2.

A hook is deterministic code inside the agent's session. Anything a rule can fix (formatting) belongs in a hook or a script, not in the prompt.

## Done when

- `/standings/drivers` renders 20+ drivers ordered by points.
- New unit test, story and e2e test exist.
- `npm run verify` shows no failure other than the planted one.
- Editing a file through Claude leaves it Prettier-formatted (the hook ran).
- Your work is committed and pushed to `main`.

**Next:** [step 2](step-2.md) hands the loop to a script.
