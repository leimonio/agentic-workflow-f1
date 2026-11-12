---
name: babysit
description: Triage one PR review thread (necessary or discussion) or fix the necessary ones. Called by the babysit script once per thread or once per fix round. Use when a script calls /babysit or the user asks to triage review comments.
---

# babysit

The script owns the loop: it counts rounds (max 3), limits replies (1 per thread), waits for CI (max 15 min), posts every reply, resolves threads and writes the tracker. You do one job per call and return JSON.

## MODE: triage (read-only)

Decide whether the thread is **necessary**:

- a real defect you can point to (file and line, or a test that fails),
- a broken acceptance criterion of this task (quote it), or
- a repo rule you can cite (`CLAUDE.md` or a lint rule).

Everything else is **discussion**: taste, scope questions, "what about…", anything you would need the human to decide. When unsure, it is discussion.

Return `verdict`, `evidence` (empty for discussion) and `reply`:
- necessary: the reply to post after the fix, one or two sentences on what changed.
- discussion: a draft reply for the human to edit and post. Do not promise a change.

## MODE: fix

Fix exactly the necessary threads and the failing checks you were given. Nothing else.
Run `npm run -s gate -- --json` and quote it in `summary`. Return `needs_human` if the fix needs a decision.

## Never

- Never post, reply or resolve on GitHub. The script does.
- Never touch code in triage mode.
- Never dismiss or "resolve" a human's comment by calling it discussion to avoid work, or necessary to avoid asking.
- Never set Visual or Human review.
