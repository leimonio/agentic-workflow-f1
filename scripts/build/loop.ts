// The build loop. This script owns the attempt counter, the bounds, the gate and every tracker write.
// The agent is called once per attempt and only returns a verdict.
//   npm run build:loop -- <item-id> [--max 3]
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { option } from '../lib/args.ts'
import { runAgent } from '../lib/agent.ts'
import { decide, MAX_ATTEMPTS, type Attempt } from '../lib/loop.ts'
import { runBaseline, runGate as gate } from '../lib/run-gate.ts'
import { logLine } from '../lib/tracker.ts'
import { trackerFromEnv } from '../lib/tracker-from-env.ts'

const id = process.argv[2]
if (!id || id.startsWith('--')) {
  console.error('usage: npm run build:loop -- <item-id> [--max N]')
  process.exit(2)
}
const max = Number(option('max') ?? MAX_ATTEMPTS)
const tracker = trackerFromEnv()
const item = await tracker.get(id)
const say = (s: string) => console.log(`[build ${id}] ${s}`)

say('baseline')
runBaseline()
await tracker.update(id, { build: 'In progress', attempts: 0, needsHuman: '' })
await tracker.log(id, logLine('Build', 'In progress'))

const attempts: Attempt[] = []
let lastMessages: string[] = []
let decision = decide(attempts, max)
while (decision.kind === 'attempt') {
  const n = attempts.length + 1
  const prompt = [
    `/build-feature ${item.description}`,
    '',
    `You are inside a script-owned loop. This is attempt ${n} of ${max}. Do not count attempts or retry on your own: make your best change once, run \`npm run -s gate -- --json\`, and return the verdict.`,
    lastMessages.length ? `The gate's NEW failures after the previous attempt (fix only these):\n${lastMessages.join('\n')}` : '',
    'Return status needs_human with one question only if a decision belongs to a human.',
  ].join('\n')
  say(`attempt ${n}/${max}: calling the agent`)
  const run = runAgent(prompt)
  say(`agent: ${run.verdict.status} · ${run.verdict.summary} ($${run.costUsd.toFixed(2)}, ${run.seconds}s)`)

  // Stable green: the gate must pass twice in a row. The agent's own "ok" is not evidence.
  const first = gate()
  const gates = first.pass ? [first, gate()] : [first]
  lastMessages = gates.at(-1)!.messages
  attempts.push({ summary: run.verdict.summary, verdict: run.verdict.status, question: run.verdict.question, gates })
  say(`gate: ${gates.map((g) => (g.pass ? 'PASS' : `FAIL (${g.newFailures.length} new)`)).join(', then ')}`)

  await tracker.update(id, { attempts: n })
  await tracker.log(id, logLine('Build', `attempt ${n}: ${gates.at(-1)!.pass ? 'pass' : 'fail'}`))
  decision = decide(attempts, max)
}

if (decision.kind === 'done') {
  const branch = spawnSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).stdout.trim()
  await tracker.update(id, { build: 'Done', branch })
  await tracker.log(id, logLine('Build', 'Done (stable green)'))
  say(`Done: stable green after ${attempts.length} attempt(s).`)
  process.stdout.write(spawnSync('npx', ['tsx', 'scripts/gate.ts'], { encoding: 'utf8' }).stdout)
  process.exit(0)
}

await tracker.update(id, { build: 'Failed' })
await tracker.handoff(id, {
  stage: 'Build',
  attempts: attempts.length,
  failing: attempts.at(-1)?.gates.at(-1)?.newFailures ?? [],
  tried: attempts.map((a) => `${a.summary} → gate ${a.gates.map((g) => (g.pass ? 'pass' : 'fail')).join('/')}`),
  question: decision.question,
  resume: `Answer here or change the task, then \`npm run item -- reset ${id} build\` and \`npm run build:loop -- ${id}\`.`,
})
await tracker.log(id, logLine('Build', `Failed: ${decision.reason}`))
say(`Escalated (${decision.reason}). .agent/handoff.md:\n`)
console.log(readFileSync('.agent/handoff.md', 'utf8'))
process.exit(1)
