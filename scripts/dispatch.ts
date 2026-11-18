// One pass over the tracker: nextStage() decides, this script runs the stage. No model here.
//   npm run dispatch [-- --watch | --until-idle] [-- --pr]
// --pr pushes the build branch (and its base) and opens a PR. Without it the branch stays local.
import { execFileSync, spawnSync } from 'node:child_process'
import { nextStage } from './lib/stage.ts'
import { handoffPath, logLine, type Item } from './lib/tracker.ts'
import { currentTrackerLabel, trackerFromEnv } from './lib/tracker-from-env.ts'
import { openWorktree, removeWorktree, worktreeChanges } from './lib/worktree.ts'

const args = process.argv.slice(2)
const tracker = trackerFromEnv()
const git = (...a: string[]) => execFileSync('git', a, { encoding: 'utf8' }).trim()
const run = (script: string, id: string, env = process.env) => spawnSync('npm', ['run', '-s', script, '--', id], { stdio: 'inherit', env }).status

async function queue(idea: Item, all: Item[]) {
  const tasks = all.filter((t) => t.parent === idea.id && t.type === 'Task')
  for (const t of tasks) await tracker.update(t.id, { build: 'Queued', attempts: 0 })
  await tracker.update(idea.id, { plan: 'Approved' })
  await tracker.log(idea.id, logLine('Plan', `Approved, ${tasks.length} tasks queued`))
  console.log(`[dispatch ${idea.id}] approved: queued ${tasks.map((t) => `${t.id} (${t.title})`).join(', ')}`)
}

async function build(item: Item, all: Item[]) {
  const rel = `.agent/worktrees/${item.id}`
  // Never wipe what an escalated build left for you to read or finish.
  if (worktreeChanges(item.id))
    return console.log(
      `[dispatch ${item.id}] skipped build: ${rel} has uncommitted changes. Keep them (commit there) or drop them: git worktree remove --force ${rel}`,
    )
  // Stack on an unmerged dependency's branch, else start from the branch dispatch runs on (your earlier work is not on main).
  const dep = all.find((d) => item.dependsOn?.includes(d.id) && d.branch && d.merge !== 'Merged')
  const from = dep?.branch ?? process.env.AGENT_BASE_BRANCH ?? git('branch', '--show-current')
  const branch = `agent/${item.id}`
  const dir = openWorktree(item.id, from, branch)
  // The baseline must come from the same base, or its failures get blamed on the agent.
  const code = run('build:loop', item.id, { ...process.env, AGENT_BASE_BRANCH: from, AGENT_WORKDIR: dir })
  if (code !== 0) {
    process.exitCode = 1
    const leave = `The changes are in ${rel} (branch ${branch}); your checkout did not move.`
    // A loop that escalates writes needsHuman. Without it the loop crashed, and the handoff file is stale.
    if ((await tracker.get(item.id)).needsHuman) return console.log(`[dispatch ${item.id}] build escalated, see ${handoffPath(item.id)}. ${leave}`)
    const reason = `build loop exited ${code} without a handoff (crashed before escalating): read the output above`
    await tracker.update(item.id, { build: 'Failed', needsHuman: reason })
    await tracker.log(item.id, logLine('Build', reason))
    return console.log(`[dispatch ${item.id}] ${reason}. ${leave}`)
  }
  git('-C', dir, 'add', '-A')
  git('-C', dir, 'commit', '-m', `${item.title}\n\nBuilt by the build loop for ${item.id}. Gate output is in the tracker log.`)
  // Committed: the branch holds the work, and you can now `git switch ${branch}` to look at it.
  removeWorktree(item.id)
  await tracker.update(item.id, { branch })
  if (!args.includes('--pr')) return console.log(`[dispatch ${item.id}] committed on ${branch}. PR skipped (pass --pr).`)
  // The PR's base must exist on GitHub: push it too (a no-op when it is already there).
  git('push', 'origin', from)
  git('push', '-u', 'origin', branch)
  const pr = execFileSync(
    'gh',
    ['pr', 'create', '--head', branch, '--base', from, '--title', item.title, '--body', `${item.description}\n\n${item.planDetails ?? ''}`],
    { encoding: 'utf8' },
  ).trim()
  await tracker.update(item.id, { pr, ci: 'Pending', verify: 'Watching', merge: 'Waiting' })
  await tracker.log(item.id, logLine('Build', `PR opened ${pr}`))
  console.log(`[dispatch ${item.id}] PR ${pr}`)
}

async function pass() {
  const all = await tracker.list()
  for (const item of all) {
    const next = nextStage(item, all)
    if (!next) continue
    if ('wait' in next) {
      console.log(`[dispatch ${item.id}] waiting: ${next.wait}`)
      continue
    }
    console.log(`[dispatch ${item.id}] → ${next.stage}`)
    if (next.stage === 'plan') run('plan:loop', item.id)
    else if (next.stage === 'queue') await queue(item, all)
    else if (next.stage === 'build') await build(item, await tracker.list())
    else if (next.stage === 'verify') run('babysit', item.id)
    else run('merge', item.id)
  }
}

console.log(`tracker: ${currentTrackerLabel()}`)
await pass()
// --until-idle: repeat passes while a pass changes the tracker (a stage moved), bounded. Stops at the
// first pass that changes nothing, e.g. every item waits on a human or on CI.
if (args.includes('--until-idle')) {
  const MAX_PASSES = 10
  let before = JSON.stringify(await tracker.list())
  for (let i = 1; i < MAX_PASSES; i++) {
    await pass()
    const after = JSON.stringify(await tracker.list())
    if (after === before) break
    before = after
  }
}
// shortcut: a fixed 60 s poll, fine for one workshop board; use monday webhooks for more.
if (args.includes('--watch')) setInterval(() => void pass(), 60_000)
