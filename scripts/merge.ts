// The merge gate. No agent: re-read the PR live, check every condition, squash-merge or escalate.
//   npm run merge -- <item-id>
import { execFileSync } from 'node:child_process'
import { fetchPr } from './lib/github.ts'
import { mergeBlockers } from './lib/pr.ts'
import { logLine } from './lib/tracker.ts'
import { trackerFromEnv } from './lib/tracker-from-env.ts'

const id = process.argv[2] ?? ''
if (!id) {
  console.error('usage: npm run merge -- <item-id>')
  process.exit(2)
}
const tracker = trackerFromEnv()
const item = await tracker.get(id)
if (!item.pr) throw new Error(`${id} has no PR`)
const say = (s: string) => console.log(`[merge ${id}] ${s}`)

const pr = fetchPr(item.pr)
if (pr.state === 'MERGED') {
  await tracker.update(id, { merge: 'Merged' })
  say(`PR #${pr.number} was already merged`)
  process.exit(0)
}
// The tracker's gates are read now, not trusted from the last babysit tick.
const blockers = mergeBlockers(item, pr)
if (blockers.length) {
  await tracker.update(id, { merge: 'Blocked' })
  await tracker.log(id, logLine('Merge', `blocked: ${blockers.join('; ')}`))
  await tracker.handoff(id, {
    stage: 'Merge',
    attempts: 1,
    failing: blockers,
    tried: [`checked PR #${pr.number} live`],
    question: `PR #${pr.number} cannot merge: ${blockers.join('; ')}. Fix these, or reset the stage that should fix them.`,
    resume: `Fix the blockers, then \`npm run item -- reset ${id} merge\` (or set Merge = Waiting and clear Needs human on the board).`,
  })
  say(`blocked: ${blockers.join('; ')}`)
  process.exit(1)
}

// shortcut: no head-SHA pin, so a push between this check and the merge is not caught; pass --match-head-commit if that matters.
// The branch is kept: tasks stacked on it still need it as their base.
execFileSync('gh', ['pr', 'merge', String(pr.number), '--squash'], { stdio: 'inherit' })
const after = fetchPr(item.pr)
if (after.state !== 'MERGED') throw new Error(`gh pr merge returned but PR #${pr.number} is ${after.state}`)
await tracker.update(id, { merge: 'Merged' })
await tracker.log(id, logLine('Merge', `squash-merged PR #${pr.number}`))
say(`merged PR #${pr.number} into ${pr.base}`)
