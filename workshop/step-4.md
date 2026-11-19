# Step 4: babysit the PR (30 min)

**Goal:** after the PR opens, a script triages every review thread: the agent fixes what is necessary and hands you the rest. Then two gates are yours.

**Where we are:** a task PR is open from step 3. Didn't finish step 3? Switch to its solution branch; `seed` recreates the board items and a task PR to work on:

```bash
git stash -u && git switch step-3-solution && npm ci && npm run baseline -- --base HEAD && npm run seed -- --step 4
```

**Why** (failures #7 and #8 in step 0): an agent left alone with review comments "fixes" opinions and argues with real defects. And it opens PRs as you, so it could approve them as you. Triage needs evidence, discussions go to you, and the approvals are fields only you set.

## How it works

```
dispatch ─► babysit <id>, one tick:
   CI red?            ─► fix round (max 3)
   new threads?       ─► MODE: triage (read-only) ─► necessary | discussion
      necessary       ─► MODE: fix ─► gate ─► push ─► reply ─► resolve
      discussion      ─► Verify = Needs human, draft reply in the handoff
   all quiet, CI green ─► Verify = Stable green
YOU ─► Visual, Human review
```

The fix runs in `.agent/worktrees/<id>`, checked out from the PR's branch, and the worktree is removed after the tick. Bounds: 3 fix rounds, 1 reply per thread, 15 min for CI. Every write to GitHub and the tracker is the script's.

## Scripts you use now

| Command | What it does |
|---|---|
| `npm run pr:status -- <id>` | CI, Chromatic, unresolved threads, and the two human gates. |
| `npm run dispatch` | For an item with a PR, runs one babysit tick. |
| `npm run item -- visual <id> accepted\|rejected` | Your Visual gate (or accept the change in Chromatic). |
| `npm run item -- review <id> approved\|changes` | Your Human review gate. |
| `npm run item -- reset <id> verify` | Babysit again after you answered a thread. |

The `tracker` skill from step 3 works here too: "show the routing task" or "what do I approve next" prints these commands for you.

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

4. **Answer the discussion.** Resolving the thread on GitHub is **not enough**: Verify stays Needs human until babysit runs again, and only `reset` makes it run.

   ```bash
   # answer and resolve the thread on GitHub, then:
   npm run item -- reset <id> verify
   npm run dispatch                         # Verify = Stable green
   ```

5. **Set your gates.** **Visual** (accept in Chromatic, or `item visual`) and **Human review** (`item review`). GitHub approval is not used: the agent opens PRs as you, so you can't approve them. If babysit pushes another fix after that, it sets Human review back to Waiting (and Visual, unless Chromatic sets it): you approved the code before the push.

## What you should see

- The necessary thread: a commit on the PR, a reply quoting the gate, the thread resolved.
- The discussion thread: no commit, Verify = Needs human, and a draft reply in `.agent/items/<id>.handoff.md`. The Next block names the reset command.
- After the reset: Verify = Stable green, and the Next block asks for Visual and Human review.

## Split

| Script | Agent | You |
|---|---|---|
| threads, bounds, posting, resolving, every board write | reviews, triages with evidence, fixes | answer discussions, Visual, Human review |

## Done when

- `pr:status` shows CI green and 0 unresolved threads.
- The necessary thread was fixed and resolved; the discussion thread escalated with a draft reply and no code change.
- Visual and Human review are set, by you.

**Next:** every gate is set. [Step 5](step-5.md) turns the merge into one more script, and lets one skill drive the board.
