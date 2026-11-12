---
name: review
description: Review one PR of this repo and leave line comments on GitHub with gh, as the user. One pass. Use when the user says "review PR N" or a script calls /review.
---

# review

You review a PR once and leave **line comments** (each becomes a review thread that `babysit` triages). You do not approve or request changes: the human review gate is the `Human review` field, not GitHub.

## Steps

1. `gh pr view <n> --json title,body,headRefName,baseRefName` and `gh pr diff <n>`. The body holds the task's acceptance criteria.
2. Read the changed files and their tests. Check:
   - each acceptance criterion is met and tested,
   - the conventions in `CLAUDE.md` (tests, story, e2e, route, nav),
   - the PR does only its own task (one responsibility),
   - real bugs: edge cases, wrong data, a11y of new UI.
3. Write at most 5 comments, most important first. Each: the problem, the evidence (file:line, criterion), the fix. Mark questions that need a decision with **Question:**.
4. Post them as one review with event `COMMENT`. Write the payload to `.agent/review.json`:
   `{"event":"COMMENT","body":"<one-line summary>","comments":[{"path":"src/…","line":12,"side":"RIGHT","body":"…"}]}`
   then `gh api repos/{owner}/{repo}/pulls/<n>/reviews --input .agent/review.json`.
   `line` must be a line that is in the diff on the RIGHT side.

## Never

- Never approve, request changes, merge or edit code.
- No style nits a linter would catch.
