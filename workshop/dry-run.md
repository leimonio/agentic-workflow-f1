# Dry run (builder, 2026-11-11)

Each step was built with that step's own skill and scripts (`claude -p`, model `sonnet`, hooks off).
"Agent" is wall-clock and cost of the agent calls. "Human" is my estimate for an attendee who follows `workshop/step-N.md`.

| Step | Box | Agent | Human estimate | Fits? | Failures seen |
|---|---|---|---|---|---|
| 0 Setup | 15 | – | 10–15 (npm ci, Playwright, doctor, template copy made public) | yes, tight on slow networks | CI could not reach Ubuntu apt mirrors with `--with-deps`; dropped it |
| 1 Skill | 25 | 44 s, 12 turns, $0.21 | ~16 (write skill 10, run 1, check 5) | yes | 1 permission denial (heredoc via Bash), agent fell back to Write. Agent did not run gate (not in the step-1 skill, by design) |
| 2 Loop | 25 | constructors: 1 attempt, 89 s total (agent 51 s, $0.31), stable green. Escalation demo: 1 attempt, 39 s, $0.12 | ~25 (loop script 12, skill edit 3, run 2, escalation demo 5, check 3) | just, if attendees start from the given `decide` tests | none. The agent returned `needs_human` on the impossible test instead of faking data, so the "same failure twice" stop was only exercised by unit tests |
| 3 Board | 35 | plan: 1 attempt, plan + review 24 s, 3 tasks. Build task 1: 1 attempt, 74 s total (agent 32 s, $0.18), stable green | ~50 if attendees write the adapters; ~30 if they start from the given `Tracker`, `board-columns` and `nextStage` tests | **no**, not as written. Hand out the monday adapter and column map; attendees write `nextStage`, `validatePlan` and the plan skill | Agent put task 1 in `src/lib/drivers.ts`, not the planned `driverProfile.ts`: nothing compares plan files to the diff. Live monday (2026-11-12): `board:setup` created 23 (board, 3 groups, 19 columns) in 18 s; the second run created nothing in 0.7 s. Status, checkbox and number columns round-trip; `board:write` refuses `humanReview`. Bug found: `item idea|add` upserted a slug id, which monday rejects (`item_id must be a positive integer`); fixed to create and print the id |
| 4 Babysit | 30 | task PR via `dispatch --pr`: 2 attempts (type errors, then green), 127 s, $0.35. `review`: 4 threads, 29 s, $0.23. Babysit tick 1: 4 triage calls + 1 fix round (3 threads), **631 s**. Tick 2: escalated the discussion, a few seconds. After the human answer (keep the link) and `reset … verify`: tick 3 → Stable green; `item visual`/`item review` set; dispatch → merge | ~45: pr:status 8, babysit script 15, skills 7, a fix round ~10 of waiting, triage/escalation 5 | **no**. The fix round alone is 10 min (baseline + agent + gate twice with e2e). Hand out `github.ts` and `pr.ts`; have attendees write `verifyAction` and the triage skill, and run babysit once | Prompt starting with `---` was parsed as a flag by `claude` (fixed: stdin). A failed triage was cached as discussion (fixed: retried next tick). Triage rated a reviewer's **Question:** about file names as necessary. The task-2 agent bundled task 3's link, which the review caught |
| 5 Merge | 15 | no agent. Blocked run (Human review = Changes requested): ~2 s, handoff, dispatch waits. After approve + `reset merge`: dispatch → squash-merged PR #1 in 6 s | ~12: merge script 6 (reusing `mergeBlockers` from step 4), skill 2, doctor check 2, run 2 | yes, if `mergeBlockers` was written in step 4 | none. PR #1 targets `step-4-solution`, so branch protection on `main` was not exercised by this merge |

## Seed (`npm run seed -- --step N`, live monday, 2026-11-12)

| Step | From | Time | Result |
|---|---|---|---|
| 3 | `step-3-solution` | ~8 s per run | Run 1 created 4 items (idea Approved, task 1 Queued, tasks 2-3 waiting on links); run 2 updated the same 4. `dispatch` read the Depends on links correctly |
| 4 | `step-3-solution` | 16 s | Pushed `seed/task-pr`, opened PR #2 (6 files); a rerun reused it. Task 2 → verify stage |
| 5 | `step-4-solution` | 15 s | Retargeted PR #2 to `step-4-solution`; dispatch: task 2 waits only on Visual = Accepted and Human review = Approved |

Bug found: `pr:status -- <monday item id>` read the numeric id as a PR number; fixed to try the tracker first.
