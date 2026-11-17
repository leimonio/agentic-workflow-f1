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

1. **Write `review-pr`** (`.claude/skills/review-pr/SKILL.md`): review one PR once and post line comments with `gh`, as one `COMMENT` review. Never approve. Call it `review-pr`, not `review`: Claude Code has a built-in `/review`.
2. **Write `babysit`** (`.claude/skills/babysit/SKILL.md`), with two sections the script selects:
   - `MODE: triage` (read-only): a thread is **necessary** only with evidence: a defect you can point to, a broken acceptance criterion (quoted), or a repo rule you can cite. Everything else is **discussion**: draft a reply, touch no code. When unsure, it is discussion.
   - `MODE: fix`: fix exactly the necessary threads, run the gate, quote it.
   - Never post, reply or resolve: the script does.
3. **Run it.**

   ```bash
   npm run dispatch -- --pr                 # builds the next task and opens its PR
   claude "/review-pr <pr-number>"          # or ask a neighbour to review
   npm run dispatch                         # necessary threads: fixed, replied, resolved
   npm run dispatch                         # discussion threads: escalated with a draft reply
   ```

4. **You decide.** Answer the discussion on GitHub, resolve it, `npm run item -- reset <id> verify`, `npm run dispatch`. When Verify is Stable green, set your gates: **Visual** (Chromatic, or `item visual`) and **Human review** (`item review`). GitHub approval is not used: the agent opens PRs as you, so you can't approve them.

## Split

| Script | Agent | You |
|---|---|---|
| threads, bounds, posting, resolving, every board write | reviews, triages with evidence, fixes | answer discussions, Visual, Human review |

## Done when

- `pr:status` shows CI green and 0 unresolved threads.
- One thread was triaged as discussion and you saw the escalation.
- Visual and Human review are set, by you.
