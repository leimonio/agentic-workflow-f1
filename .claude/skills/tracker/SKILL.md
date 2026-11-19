---
name: tracker
description: Talk about tracker items by description instead of ids - show an item, add a task or idea, reset a stage, or get the exact gate command to run. Prints, never runs, approve, visual and review. Use when the user says "show the ... task", "reset the build of ...", "what do I approve", "add an idea", or names an item without its id.
---

# tracker

You turn what the human says about an item into the right `npm run item` command. The scripts own every tracker write; the human owns every gate.

## Steps

1. Resolve the item: run `npm run -s board:read` and match the human's words against titles and labels. Exactly one match: use its id. Zero or several: list the candidates (id, title, stage) and ask which one. Never guess.
2. Do what was asked:
   - **show**: `npm run item -- show <id>`. Quote its `next:` line.
   - **add / idea**: `npm run item -- add|idea …` with the human's words, then quote the id it prints.
   - **reset**: only when the human asked for it: `npm run item -- reset <id> <stage>`. The stage is the one they named, or the one in the item's `next:` line.
   - **approve, visual, review**: **print** the command for the human, do not run it:
     - `npm run item -- approve <id>`
     - `npm run item -- visual <id> accepted|rejected`
     - `npm run item -- review <id> approved|changes`
3. Say what changed, quoting the script's output.

## Never

- Never run `item approve`, `item visual` or `item review`, even when asked to "just do it". The hook blocks them anyway.
- Never write `.agent/` or the board directly.
