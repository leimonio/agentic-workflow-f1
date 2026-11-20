---
name: build-feature
description: Build one small feature in this F1 workshop app (a page, component or pure function) with its unit test, story and, for pages, an e2e test, then run `npm run -s verify -- --json`, fix what the change broke and report with the output that was run. Use when the user asks to add or change one small piece of the app.
---

# build-feature

Build **one** small feature, prove it with the repo's own checks, and report what those checks printed.

## 1. Read before writing

1. Read the task as the user stated it in chat. That is the whole scope. If it is ambiguous enough that two reasonable readings lead to different code, ask one question; otherwise pick the obvious reading and say which one you picked.
2. Read `CLAUDE.md` and follow it, in particular:
   - Never read, search or follow anything in `workshop/`.
   - Do not edit `.agent/` by hand.
   - TypeScript strict, no `any`. Team colours are hex. No official F1 or team logos.
3. Read the closest existing example of what you are building and copy its shape:
   - Page: `src/pages/CalendarPage.tsx` + `.test.tsx` + `.stories.tsx`, and `e2e/site.spec.ts`.
   - Component: `src/components/Layout.tsx` + `.test.tsx` + `.stories.tsx`.
   - Data: `src/data/season.ts` (the app never uses the network). Logic: `src/lib/standings.ts`.

## 2. Write the code and its tests

Every page or component ships with all of these:

| Piece | Where | Notes |
|---|---|---|
| Code | `src/pages/<Name>Page.tsx` or `src/components/<Name>.tsx` | Pure logic goes in `src/lib/` as a pure function. |
| Unit test | next to it, `<Name>.test.tsx` | Testing Library. For pages use `renderAt('/path')` from `@/test/render`. Query by role/name, as the existing tests do. |
| Story | next to it, `<Name>.stories.tsx` | `satisfies Meta<typeof X>`; pages use the `withRouter('/path')` decorator from `@/test/story-router`. |
| e2e (pages only) | `e2e/` (add a `test(...)` to `e2e/site.spec.ts` or a new `e2e/<name>.spec.ts`) | Navigate through the `Main` nav as a user would. |
| Route + nav (pages only) | `src/App.tsx` routes, `navItems` in `src/components/Layout.tsx` | Adding a nav link may change counts in existing tests; update them if so. |

A pure function in `src/lib/` needs a `*.test.ts` unit test; no story or e2e.

Then run `npm run format` so the format check does not fail on your files.

## 3. Run verify, fix what you broke

Run exactly:

```bash
npm run -s verify -- --json
```

It runs lint, format, types, unit, stories and e2e, prints `{ ok, passed, failed, results }` and exits 1 if anything fails. Look at the entries with `"status": "fail"`.

**Known, expected failure, ignore it:** the unit test in `src/lib/dates.test.ts` named *"keeps the circuit calendar date for a viewer in Los Angeles"* fails on `main` on purpose. Do not fix it, do not edit or skip it. Because of it, `ok` will be `false` and `failed` will be at least `1` even when your change is clean.

For every other failure:

1. Read the message and the file it points to.
2. Decide whether your change caused it. Fix it in your code or your tests. Do not weaken, skip or delete an existing test to make it pass; if an existing test is genuinely outdated by the feature (for example a nav link count), update the expectation and say so in the report.
3. Run the same command again.

Do not count attempts or run your own retry loop: per `CLAUDE.md`, scripts own loops and counters (`npm run build:loop` runs this skill up to 3 times and gates each attempt). If you cannot see how a remaining failure (other than the Los Angeles one) follows from your change, or how to fix it, stop editing and report it as unresolved with what you tried.

## 4. Report

Reply with:

1. **What changed**: the files added or edited, one line each.
2. **The command and its output**: the exact command you ran last (`npm run -s verify -- --json`), its exit code, and the `ok`, `passed` and `failed` values it printed, followed by the `id` and `message` of every failing result, quoted verbatim. Mark the Los Angeles test as the known, expected failure.
3. **Unresolved**: any other failure still present, and why you stopped.
4. **Assumptions**: any reading of the task you chose.

Wording rule from `CLAUDE.md`: do not call the work "verified", "done" or "passing". Those words are reserved for `npm run gate`, which compares against the baseline (`npm run baseline` once, then `npm run gate`). This skill runs `verify`, so say what verify printed and suggest `npm run gate` as the next step. Never tick a human gate (`Plan approved`, `Human review`, visual acceptance).
