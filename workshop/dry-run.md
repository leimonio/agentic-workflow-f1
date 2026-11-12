# Dry run (builder, 2026-11-11)

Each step was built with that step's own skill and scripts (`claude -p`, model `sonnet`, hooks off).
"Agent" is wall-clock and cost of the agent calls. "Human" is my estimate for an attendee who follows `workshop/step-N.md`.

| Step | Box | Agent | Human estimate | Fits? | Failures seen |
|---|---|---|---|---|---|
| 0 Setup | 15 | – | 10–15 (npm ci, Playwright, doctor, template copy made public) | yes, tight on slow networks | CI could not reach Ubuntu apt mirrors with `--with-deps`; dropped it |
| 1 Skill | 25 | 44 s, 12 turns, $0.21 | ~16 (write skill 10, run 1, check 5) | yes | 1 permission denial (heredoc via Bash), agent fell back to Write. Agent did not run gate (not in the step-1 skill, by design) |
| 2 Loop | 25 | constructors: 1 attempt, 89 s total (agent 51 s, $0.31), stable green. Escalation demo: 1 attempt, 39 s, $0.12 | ~25 (loop script 12, skill edit 3, run 2, escalation demo 5, check 3) | just, if attendees start from the given `decide` tests | none. The agent returned `needs_human` on the impossible test instead of faking data, so the "same failure twice" stop was only exercised by unit tests |
| 3 Board | 35 | plan: 1 attempt, plan + review 24 s, 3 tasks. Build task 1: 1 attempt, 74 s total (agent 32 s, $0.18), stable green | ~50 if attendees write the adapters; ~30 if they start from the given `Tracker`, `board-columns` and `nextStage` tests | **no**, not as written. Hand out the monday adapter and column map; attendees write `nextStage`, `validatePlan` and the plan skill | Agent put task 1 in `src/lib/drivers.ts`, not the planned `driverProfile.ts`: nothing compares plan files to the diff. Live monday (2026-11-12): `board:setup` created 23 (board, 3 groups, 19 columns) in 18 s; the second run created nothing in 0.7 s. Status, checkbox and number columns round-trip; `board:write` refuses `humanReview`. Bug found: `item idea|add` upserted a slug id, which monday rejects (`item_id must be a positive integer`); fixed to create and print the id |
