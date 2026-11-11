// Deterministic: reads Chromatic's commit statuses for HEAD via gh and writes .agent/visual.json.
// The agent judges whether a change is intended. A human accepts or rejects it in Chromatic.
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { flag, option } from './lib/args.ts'
import { summarize } from './lib/visual.ts'

const out = (cmd: string, ...a: string[]) => execFileSync(cmd, a, { encoding: 'utf8' }).trim()
const sha = option('sha') ?? out('git', 'rev-parse', 'HEAD')
const slug = out('gh', 'repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner')
const { statuses } = JSON.parse(out('gh', 'api', `repos/${slug}/commits/${sha}/status`))
const report = { sha, ...summarize(statuses) }

mkdirSync('.agent', { recursive: true })
writeFileSync('.agent/visual.json', JSON.stringify(report, null, 2) + '\n')
if (flag('json')) console.log(JSON.stringify(report, null, 2))
else {
  console.log(`visual: ${report.visual} (${sha.slice(0, 7)})`)
  for (const c of report.checks) console.log(`  ${c.context}: ${c.state} ${c.description} ${c.target_url}`)
}
