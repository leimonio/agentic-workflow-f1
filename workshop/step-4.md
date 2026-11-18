# Step 4: babysit the PR (30 min)

**Goal:** after the PR opens, a script triages every review thread: the agent fixes what is necessary and hands you the rest. Then two gates are yours.

Behind? `git checkout step-3-solution && npm run seed -- --step 4` (a task PR to work on).

## Scripts you use now

| Command | What it does |
|---|---|
| `npm run pr:status -- <id>` | CI, Chromatic, unresolved threads, and the two human gates. |
| `npm run dispatch` | For an item with a PR, runs `babysit`: one tick of triage → fix → reply → resolve, or escalate. Bounds: 3 fix rounds, 1 reply per thread, 15 min for CI. |
| `npm run item -- visual <id> accepted` / `review <id> approved` | Your two gates (or accept the change in Chromatic). |
| `npm run item -- reset <id> verify` | Babysit again after you answered a thread. |

## Do

1. **Write `review-pr`** (`.claude/skills/review-pr/SKILL.md`): review one PR once and post line comments with `gh`, as one `COMMENT` review. Never approve. **Nothing worth a comment? Post nothing and report `0 comments`:** an invented comment costs a fix round and your time. Call it `review-pr`, not `review`: Claude Code has a built-in `/review`.
2. **Write `babysit`** (`.claude/skills/babysit/SKILL.md`), with two sections the script selects:
   - `MODE: triage` (read-only): a thread is **necessary** only with evidence: a defect you can point to, a broken acceptance criterion (quoted), or a repo rule you can cite. Everything else is **discussion**: draft a reply, touch no code. When unsure, it is discussion.
   - `MODE: fix`: fix exactly the necessary threads, run the gate, quote it.
   - Never post, reply or resolve: the script does.
3. **Run it.**

   ```bash
   npm run dispatch -- --pr                 # builds the next task and opens its PR
   claude "/review-pr <pr-number>"          # or ask a neighbour to review
   ```

   Then add **two comments yourself** on the PR's Files tab, so both triage paths run even when the review found nothing:
   - **Necessary**, with evidence: a file outside the task's file list, or an acceptance criterion with no test (quote it). On the seed PR: the `Link` line in `src/pages/DriverStandingsPage.tsx`, "Linking the standings is task t3, and this file is not in this task's files: drop it from this PR."
   - **Discussion**, a question only you can decide. On the seed PR, on the results table in `DriverProfilePage.tsx`: "Should this table show sprint results too?"

   ```bash
   npm run dispatch                         # necessary threads: fixed, replied, resolved
   npm run dispatch                         # discussion threads: escalated with a draft reply
   ```

4. **You decide.** Answer the discussion on GitHub, resolve it, `npm run item -- reset <id> verify`, `npm run dispatch`. When Verify is Stable green, set your gates: **Visual** (Chromatic, or `item visual`) and **Human review** (`item review`). GitHub approval is not used: the agent opens PRs as you, so you can't approve them. If babysit pushes another fix after that, it sets Human review back to Waiting (and Visual, unless Chromatic sets it): you approved the code before the push.

## Split

| Script | Agent | You |
|---|---|---|
| threads, bounds, posting, resolving, every board write | reviews, triages with evidence, fixes | answer discussions, Visual, Human review |

## Done when

- `pr:status` shows CI green and 0 unresolved threads.
- The necessary thread was fixed and resolved; the discussion thread escalated with a draft reply and no code change.
- Visual and Human review are set, by you.

## What changed on `step-4-solution`

| File | What |
|---|---|
| `.claude/skills/review-pr`, `babysit` | `review-pr` posts line comments as you. `babysit` has a triage mode and a fix mode; it never posts. |
