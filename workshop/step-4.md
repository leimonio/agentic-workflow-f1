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
