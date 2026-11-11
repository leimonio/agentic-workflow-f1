// Deterministic: runs verify, diffs against the baseline, exits 1 only on NEW failures.
// "Verified" may only be claimed from this script's output.
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { flag } from './lib/args.ts'
import { diff } from './lib/gate.ts'
import type { Result } from './lib/types.ts'

if (!existsSync('.agent/baseline.json')) {
  console.error('gate: no .agent/baseline.json. Run `npm run baseline` first.')
  process.exit(2)
}
const read = (f: string): Result[] => JSON.parse(readFileSync(f, 'utf8'))
spawnSync('npx', ['tsx', 'scripts/verify.ts', '--json'], { stdio: ['ignore', 'ignore', 'inherit'] })
const report = diff(read('.agent/baseline.json'), read('.agent/verify.json'))
// Visual diffs live in Chromatic (cloud). `npm run visual:status` writes .agent/visual.json; we only pass it through.
const visual = existsSync('.agent/visual.json') ? JSON.parse(readFileSync('.agent/visual.json', 'utf8')) : null
const ok = report.newFailures.length === 0

if (flag('json')) console.log(JSON.stringify({ ok, ...report, visual }, null, 2))
else {
  for (const f of report.newFailures) console.log(`NEW FAILURE  ${f.id}\n             ${f.message}`)
  for (const f of report.preExisting) console.log(`pre-existing ${f.id}`)
  for (const f of report.fixed) console.log(`fixed        ${f.id}`)
  console.log(`gate: ${ok ? 'PASS' : 'FAIL'} (${report.newFailures.length} new, ${report.preExisting.length} pre-existing, ${report.fixed.length} fixed, ${report.passed} passed)`)
}
process.exit(ok ? 0 : 1)
