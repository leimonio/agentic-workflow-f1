// Tracker CLI for humans. `reset` is the only way to re-trigger a stage.
//   npm run item -- add <id> "<title>" "<what to build>"
//   npm run item -- reset <id> build|plan|verify
//   npm run item -- idea <id> "<title>" "<the idea>"
//   npm run item -- approve <id>
//   npm run item -- show <id>
import { trackerFromEnv } from './lib/tracker-from-env.ts'
import { logLine, type Item } from './lib/tracker.ts'

const [cmd, id, a, b] = process.argv.slice(2)
const t = trackerFromEnv()
const resets: Record<string, Partial<Item>> = {
  build: { build: 'Queued', attempts: 0, needsHuman: '' },
  plan: { plan: 'Not started', needsHuman: '' },
  verify: { verify: 'Watching', needsHuman: '' },
}

if (cmd === 'add' && id && a && b) await t.update(id, { title: a, type: 'Task', description: b, build: 'Queued', attempts: 0 })
else if (cmd === 'idea' && id && a && b) await t.update(id, { title: a, type: 'Idea', description: b, plan: 'Not started' })
// The human ticking "Plan approved". On monday you tick the checkbox instead.
else if (cmd === 'approve' && id) {
  await t.update(id, { planApproved: true })
  await t.log(id, logLine('Plan', 'approved by human'))
}
else if (cmd === 'reset' && id && a && resets[a]) {
  await t.update(id, resets[a])
  await t.log(id, logLine(a, 'reset by human'))
} else if (!(cmd === 'show' && id)) {
  console.error('usage: item add <id> "<title>" "<task>" | idea <id> "<title>" "<idea>" | approve <id> | reset <id> build|plan|verify | show <id>')
  process.exit(2)
}
console.log(JSON.stringify(await t.get(id), null, 2))
