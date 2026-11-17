# Step 2: the script owns the loop (25 min)

**Goal:** the build loop is a script. The agent is called once per attempt and returns a verdict; one small pure function decides what happens next. You write that function.

Behind? `git checkout step-1-solution`.

## Scripts you use now

| Command | What it does |
|---|---|
| `npm run item -- add <id> "<title>" "<task>"` | Puts a task on the local tracker (`.agent/items/`). |
| `npm run build:loop -- <id>` | Baseline, then per attempt: one agent call (your `build-feature` skill), then the gate. Max 3 attempts. Escalates with `.agent/handoff.md`. |
| `npm run item -- show <id>` / `reset <id> build` | Read the item; run its build again. |
| `npm run visual:status` | Chromatic's verdict for HEAD. Visual changes wait for a human. |

## Do

1. **Write `decide()`** in `scripts/lib/loop.ts`. The comment above it lists the rules; `npx vitest run scripts/lib/loop.test.ts` checks each one. The point: the agent's own "ok" never counts, only the gate does.
2. **Add "Inside the build loop" to `build-feature`.** When the prompt says it runs inside a script-owned loop, the skill must: use `npm run -s gate -- --json` instead of verify (only `newFailures` are yours), never ask in text (return `needs_human` with the question), and treat its JSON verdict as the report.
3. **Run it.**

   ```bash
   npm run item -- add constructors "Constructor standings" "Add Constructor standings at /standings/constructors and put the leader's points on the Home page."
   npm run build:loop -- constructors
   ```

   The Home change alters an existing story on purpose: after you push, `npm run visual:status` shows it waiting for a human.
4. **Force an escalation.** Add a test that cannot pass (the leader has 999 points), then:

   ```bash
   npm run item -- add escalate "Escalation demo" "Make the gate pass. You may not edit any test file or src/data/."
   npm run build:loop -- escalate
   ```

   Read `.agent/handoff.md`, delete the test, `npm run item -- reset escalate build`.

## Split

| Script | Agent | You |
|---|---|---|
| baseline, gate, attempt counter, `decide()`, handoff file, tracker writes | fixes only new failures, returns a verdict | read the handoff, decide |

## Done when

- `scripts/lib/loop.test.ts` passes.
- `build:loop -- constructors` ends with 2 gate passes in a row.
- The escalation demo stops early and `.agent/handoff.md` has one question for you.

## What changed on `step-2-solution`

| File | What |
|---|---|
| `scripts/lib/loop.ts` | `decide()` written: done on 2 gate passes in a row; escalate when the agent asks, the same failures repeat, or attempts run out; else attempt again. |
| `.claude/skills/build-feature/SKILL.md` | The "Inside the build loop" section: use the gate, return the verdict, never ask in text. |
| `src/pages/ConstructorStandingsPage*`, `HomePage.tsx`, `App.tsx`, `Layout.tsx`, `e2e/site.spec.ts` | Written by the agent through the loop. |
