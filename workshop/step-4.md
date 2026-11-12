# Step 4: babysit the PR (30 min, likely over)

**Goal:** a PR loop with triage, and two human gates.

## Do

1. `npm run seed -- --step 4` gives you a task PR if you are behind.
2. `npm run pr:status -- --json`: checks, unresolved threads, visual state, human review state.
3. `review` skill: leaves comments with `gh`.
4. `babysit` skill, one pass per dispatch tick, for each thread:
   - **Necessary** (a real defect, a broken acceptance criterion, a repo rule it can cite): fix, reply, resolve.
   - **Anything else:** draft a reply, escalate, do not touch code. Never dismiss the human's comments silently.
5. Bounds, owned by the script: 3 fix rounds per PR, 1 reply per thread, 15 min waiting for CI.
6. Gates for you: accept the change in Chromatic (**Visual**), then review in GitHub and set `Human review = Approved` in the tracker (**Human review**). GitHub approval is not used: the agent opens PRs as you, so you can't approve them.

## Done when

- `pr:status` shows CI green, 0 unresolved threads.
- You triaged one thread as discussion and saw the escalation.

## What changed on `step-4-solution`

| File | What |
|---|---|
| `scripts/lib/pr.ts` | Pure and tested: `readChecks` (CI vs Chromatic from gh's rollup), `verifyAction` (fix / escalate / wait / stable, with the 3-round and 15-minute bounds), `mergeBlockers`. |
| `scripts/lib/github.ts` | The gh calls: PR + review threads (GraphQL), reply to a thread, resolve a thread. |
| `scripts/pr-status.ts` | `npm run pr:status -- <item-id\|pr>`: CI, checks, Chromatic, threads, and the tracker's two human gates. |
| `scripts/babysit.ts` | One tick: triage each new thread (one read-only agent call), then fix the necessary ones in one round (gate twice, push, reply, resolve) or escalate discussions with a drafted reply. State in `.agent/babysit/<id>.json`. |
| `.claude/skills/review`, `babysit` | `review` posts line comments as you. `babysit` has a triage mode and a fix mode; it never posts. |
| `scripts/item.ts` | `review <id> approved\|changes` and `visual <id> accepted\|rejected` (the human gates; `visual` is for when Chromatic is not set up). |
| `scripts/dispatch.ts` | The `verify` stage runs babysit. |
| `scripts/lib/agent.ts` | The prompt goes on stdin (a skill's `---` frontmatter was read as a CLI flag). |

### Try it

```bash
npm run dispatch -- --pr                 # builds the next task and opens its PR
claude "/review <pr-number>"             # or ask a neighbour to review
npm run pr:status -- <item-id>
npm run dispatch                         # verify → babysit: triage, fix, reply, resolve
npm run dispatch                         # discussion threads escalate with a drafted reply
```

Answer the discussion on GitHub, resolve it, then `npm run item -- reset <item-id> verify`. When CI is green and nothing is open, Verify becomes Stable green and dispatch waits for your two gates:
`npm run item -- visual <item-id> accepted` (or accept in Chromatic) and `npm run item -- review <item-id> approved`.
