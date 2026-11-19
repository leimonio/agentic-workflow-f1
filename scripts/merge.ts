// The merge gate. No agent: re-read the PR live, check every condition, squash-merge or escalate.
//   npm run merge -- <item-id>
import { execFileSync } from 'node:child_process'
import { AGENT_ENV } from './lib/agent.ts'
import { fetchPr } from './lib/github.ts'
import { mergeBlockers } from './lib/pr.ts'
import { handoffPath, logLine } from './lib/tracker.ts'
import { trackerFromEnv } from './lib/tracker-from-env.ts'

const id = process.argv[2] ?? ''
if (!id) {
  console.error('usage: npm run merge -- <item-id>')
  process.exit(2)
}
if (process.env[AGENT_ENV]) {
  console.error(`refused: merge is run by dispatch or a human, not by an agent (${AGENT_ENV} is set).`)
  process.exit(1)
}
const tracker = trackerFromEnv()
const item = await tracker.get(id)
const all = await tracker.list()
if (!item.pr) throw new Error(`${id} has no PR`)
const say = (s: string) => console.log(`[merge ${id}] ${s}`)

const pr = fetchPr(item.pr)
if (pr.state === 'MERGED') {
  await tracker.update(id, { merge: 'Merged' })
  say(`PR #${pr.number} was already merged`)
  process.exit(0)
}
// The tracker's gates are read now, not trusted from the last babysit tick.
// A stacked PR targets its dependency's branch: merging it first would land it there, not on the real base.
const stackedOn = all.find((d) => d.id !== id && d.branch === pr.base && d.merge !== 'Merged')
const blockers = [...mergeBlockers(item, pr), ...(stackedOn ? [`stacked on ${stackedOn.id} (${pr.base}), which is not merged yet: merge it first`] : [])]
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
  say(`blocked: ${blockers.join('; ')}. See ${handoffPath(id)}`)
  process.exit(1)
}

// --match-head-commit: GitHub refuses if anyone pushed after the checks above.
// shortcut: a push by hand after you approved is not caught (only babysit's pushes re-open the gates); store the approved sha if that matters.
// The URL, not the number: with a second remote gh could pick the wrong repo.
execFileSync('gh', ['pr', 'merge', pr.url, '--squash', '--match-head-commit', pr.sha], { stdio: 'inherit' })
const after = fetchPr(item.pr)
if (after.state !== 'MERGED') throw new Error(`gh pr merge returned but PR #${pr.number} is ${after.state}`)
await tracker.update(id, { merge: 'Merged' })
await tracker.log(id, logLine('Merge', `squash-merged PR #${pr.number}`))
say(`merged PR #${pr.number} into ${pr.base}`)

// GitHub only retargets a stacked PR when its base branch is deleted, and the branch is kept here.
// So move each PR stacked on this one to the base this one landed on.
// shortcut: the moved PR still holds this PR's commits (squash made new ones); its diff shows them until rebased.
for (const d of all.filter((d) => d.pr && d.merge !== 'Merged')) {
  if (fetchPr(d.pr!).base !== pr.head) continue
  execFileSync('gh', ['pr', 'edit', d.pr!, '--base', pr.base], { stdio: 'inherit' })
  await tracker.log(d.id, logLine('Merge', `base moved from ${pr.head} to ${pr.base} after ${id} merged`))
  say(`moved ${d.id}'s PR onto ${pr.base}`)
}
