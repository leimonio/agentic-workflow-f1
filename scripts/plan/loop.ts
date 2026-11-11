// The plan loop: plan agent → schema check → plan-review agent, at most 2 retries. Then the human plan gate.
// The script, not the agent, creates the task items.
//   npm run plan:loop -- <idea-id>
import { runAgent } from '../lib/agent.ts'
import { PLAN_RETRIES, PLAN_SCHEMA, renderTask, REVIEW_SCHEMA, validatePlan, type PlanVerdict, type ReviewVerdict } from '../lib/plan.ts'
import { logLine } from '../lib/tracker.ts'
import { trackerFromEnv } from '../lib/tracker-from-env.ts'

const id = process.argv[2]
if (!id) {
  console.error('usage: npm run plan:loop -- <idea-id>')
  process.exit(2)
}
const tracker = trackerFromEnv()
const idea = await tracker.get(id)
const say = (s: string) => console.log(`[plan ${id}] ${s}`)
const READ_ONLY = ['Read', 'Glob', 'Grep']

await tracker.update(id, { plan: 'Planning' })
await tracker.log(id, logLine('Plan', 'Planning'))

const tried: string[] = []
let feedback: string[] = []
let question = ''
let accepted: PlanVerdict | undefined
for (let n = 1; n <= 1 + PLAN_RETRIES && !accepted && !question; n++) {
  say(`attempt ${n}/${1 + PLAN_RETRIES}: plan`)
  const plan = runAgent<PlanVerdict>(
    [`/plan ${idea.title}: ${idea.description}`, feedback.length ? `\nYour previous plan was rejected. Fix exactly these:\n${feedback.map((f) => `- ${f}`).join('\n')}` : ''].join('\n'),
    { schema: PLAN_SCHEMA, tools: READ_ONLY, budgetUsd: 1.5 },
  ).verdict
  if (plan.status === 'needs_human') {
    question = plan.question ?? plan.summary
    tried.push(`plan: needs human (${plan.summary})`)
    break
  }
  const errors = plan.status === 'failed' ? [plan.summary] : validatePlan(plan.tasks)
  if (errors.length) {
    say(`schema check failed: ${errors.join('; ')}`)
    tried.push(`plan rejected by the schema check: ${errors.join('; ')}`)
    feedback = errors
    continue
  }
  say(`schema ok (${plan.tasks!.length} tasks). plan-review`)
  const review = runAgent<ReviewVerdict>(`/plan-review\n\nIdea: ${idea.title}: ${idea.description}\n\nPlan:\n${JSON.stringify(plan.tasks, null, 2)}`, {
    schema: REVIEW_SCHEMA,
    tools: READ_ONLY,
    budgetUsd: 1,
  }).verdict
  if (review.status === 'ok') accepted = plan
  else {
    feedback = review.reasons?.length ? review.reasons : [review.summary]
    say(`plan-review objects: ${feedback.join('; ')}`)
    tried.push(`plan-review objected: ${feedback.join('; ')}`)
  }
}

if (!accepted) {
  await tracker.update(id, { plan: 'Needs human' })
  await tracker.handoff(id, {
    stage: 'Plan',
    attempts: tried.length,
    failing: feedback,
    tried,
    question: question || 'The plan still fails its checks after the retries. Should the idea be narrowed, or the objections overruled?',
    resume: `Answer here or edit the idea, then \`npm run item -- reset ${id} plan\` (or set Plan = Not started on the board).`,
  })
  await tracker.log(id, logLine('Plan', 'Needs human'))
  say('escalated: see the handoff')
  process.exit(1)
}

const tasks = accepted.tasks!
const ids = new Map<string, string>()
for (const t of tasks) ids.set(t.key, await tracker.create({ title: t.title, type: 'Task', description: t.responsibility, parent: id, planDetails: renderTask(t) }))
for (const t of tasks) if (t.dependsOn.length) await tracker.update(ids.get(t.key)!, { dependsOn: t.dependsOn.map((k) => ids.get(k)!) })
await tracker.update(id, { plan: 'Awaiting approval', planDetails: `${accepted.summary}\n\n${tasks.map((t) => `- ${ids.get(t.key)}: ${t.title}`).join('\n')}` })
await tracker.log(id, logLine('Plan', `Awaiting approval (${tasks.length} tasks)`))
say(`${tasks.length} tasks written: ${[...ids.values()].join(', ')}. Waiting for a human to tick Plan approved.`)
