// One pass over the tracker: nextStage() decides, this script runs the stage. No model here.
//   npm run dispatch [-- --watch] [-- --pr]
// --pr pushes the build branch and opens a PR. Without it the branch stays local.
import { execFileSync, spawnSync } from 'node:child_process'
import { nextStage } from './lib/stage.ts'
import { logLine, type Item } from './lib/tracker.ts'
import { trackerFromEnv } from './lib/tracker-from-env.ts'

const args = process.argv.slice(2)
const BASE = process.env.AGENT_BASE_BRANCH ?? 'main'
const tracker = trackerFromEnv()
const git = (...a: string[]) => execFileSync('git', a, { encoding: 'utf8' }).trim()
const run = (script: string, id: string) => spawnSync('npm', ['run', '-s', script, '--', id], { stdio: 'inherit' }).status === 0

async function queue(idea: Item, all: Item[]) {
  const tasks = all.filter((t) => t.parent === idea.id && t.type === 'Task')
  for (const t of tasks) await tracker.update(t.id, { build: 'Queued', attempts: 0 })
  await tracker.update(idea.id, { plan: 'Approved' })
  await tracker.log(idea.id, logLine('Plan', `Approved, ${tasks.length} tasks queued`))
  console.log(`[dispatch ${idea.id}] approved: queued ${tasks.map((t) => t.id).join(', ')}`)
}

async function build(item: Item, all: Item[]) {
  if (git('status', '--porcelain')) return console.log(`[dispatch ${item.id}] skipped build: the working tree is not clean`)
  // Stack on an unmerged dependency's branch, else start from the base branch.
  const dep = all.find((d) => item.dependsOn?.includes(d.id) && d.branch && d.merge !== 'Merged')
  const from = dep?.branch ?? BASE
  const branch = `agent/${item.id}`
  const back = git('branch', '--show-current')
  git('switch', '-C', branch, from)
  if (!run('build:loop', item.id)) {
    process.exitCode = 1
    return console.log(`[dispatch ${item.id}] build escalated. Left on ${branch} with its changes for the human; switch back with \`git switch ${back}\`.`)
  }
  try {
    git('add', '-A')
    git('commit', '-m', `${item.title}\n\nBuilt by the build loop for ${item.id}. Gate output is in the tracker log.`)
    await tracker.update(item.id, { branch })
    if (!args.includes('--pr')) return console.log(`[dispatch ${item.id}] committed on ${branch}. PR skipped (pass --pr).`)
    git('push', '-u', 'origin', branch)
    const pr = execFileSync('gh', ['pr', 'create', '--head', branch, '--base', from, '--title', item.title, '--body', `${item.description}\n\n${item.planDetails ?? ''}`], { encoding: 'utf8' }).trim()
    await tracker.update(item.id, { pr, ci: 'Pending', verify: 'Watching', merge: 'Waiting' })
    await tracker.log(item.id, logLine('Build', `PR opened ${pr}`))
    console.log(`[dispatch ${item.id}] PR ${pr}`)
  } finally {
    git('switch', back)
  }
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

await pass()
// shortcut: a fixed 60 s poll, fine for one workshop board; use monday webhooks for more.
if (args.includes('--watch')) setInterval(() => void pass(), 60_000)
