// Tracker CLI for humans. `reset` is the only way to re-trigger a stage.
//   npm run item -- add <id> "<title>" "<what to build>"
//   npm run item -- reset <id> build|plan|verify|merge
//   npm run item -- idea <id> "<title>" "<the idea>"
//   npm run item -- approve <id>
//   npm run item -- review <id> approved|changes   (human gate)
//   npm run item -- visual <id> accepted|rejected  (human gate, when Chromatic is not set up)
//   npm run item -- show <id>
import { trackerFromEnv } from './lib/tracker-from-env.ts'
import { logLine, type Item } from './lib/tracker.ts'

const [cmd, label, a, b] = process.argv.slice(2)
let id = label
const t = trackerFromEnv()
const resets: Record<string, Partial<Item>> = {
  build: { build: 'Queued', attempts: 0, needsHuman: '' },
  plan: { plan: 'Not started', needsHuman: '' },
  verify: { verify: 'Watching', needsHuman: '' },
  merge: { merge: 'Waiting', needsHuman: '' },
}

// monday assigns numeric ids, so there <id> is only a label and the real id is printed.
const put = async (fields: Omit<Item, 'id'>) => {
  if (process.env.AGENT_TRACKER !== 'monday') return t.update(id ?? '', fields)
  id = await t.create(fields)
  console.log(`created monday item ${id}`)
}
if (cmd === 'add' && id && a && b) await put({ title: a, type: 'Task', description: b, build: 'Queued', attempts: 0 })
else if (cmd === 'idea' && id && a && b) await put({ title: a, type: 'Idea', description: b, plan: 'Not started' })
// The human ticking "Plan approved". On monday you tick the checkbox instead.
else if (cmd === 'approve' && id) {
  await t.update(id, { planApproved: true })
  await t.log(id, logLine('Plan', 'approved by human'))
}
// The two PR gates. Human review = Approved is the merge permission; visual is the fallback when Chromatic is not set up.
else if (cmd === 'review' && id && (a === 'approved' || a === 'changes')) {
  await t.update(id, { humanReview: a === 'approved' ? 'Approved' : 'Changes requested' })
  await t.log(id, logLine('Human review', `${a} by human`))
} else if (cmd === 'visual' && id && (a === 'accepted' || a === 'rejected')) {
  await t.update(id, { visual: a === 'accepted' ? 'Accepted' : 'Rejected' })
  await t.log(id, logLine('Visual', `${a} by human`))
}
else if (cmd === 'reset' && id && a && resets[a]) {
  await t.update(id, resets[a])
  await t.log(id, logLine(a, 'reset by human'))
} else if (!(cmd === 'show' && id)) {
  console.error('usage: item add <id> "<title>" "<task>" | idea <id> "<title>" "<idea>" | approve <id> | review <id> approved|changes | visual <id> accepted|rejected | reset <id> build|plan|verify|merge | show <id>')
  process.exit(2)
}
console.log(JSON.stringify(await t.get(id), null, 2))
