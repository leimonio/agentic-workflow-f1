// Deterministic: the PR as JSON (checks, threads, visual) plus the tracker's human gates.
//   npm run pr:status -- <item-id | pr-number | pr-url> [--json]
import { flag } from './lib/args.ts'
import { fetchPr } from './lib/github.ts'
import { trackerFromEnv } from './lib/tracker-from-env.ts'

const ref = process.argv.slice(2).find((a) => !a.startsWith('--'))
if (!ref) {
  console.error('usage: npm run pr:status -- <item-id | pr-number | pr-url> [--json]')
  process.exit(2)
}
const item = /^\d+$|^https:/.test(ref) ? undefined : await trackerFromEnv().get(ref)
if (item && !item.pr) {
  console.error(`${ref} has no PR yet`)
  process.exit(2)
}
const pr = fetchPr(item?.pr ?? ref)
const report = { ...pr, humanReview: item?.humanReview ?? null, visualGate: item?.visual ?? null }

if (flag('json')) console.log(JSON.stringify(report, null, 2))
else {
  console.log(`PR #${pr.number} ${pr.state} ${pr.head} → ${pr.base} (mergeable: ${pr.mergeable})`)
  console.log(`CI: ${pr.ci}  ${pr.checks.map((c) => `${c.name}=${c.state}`).join(' ')}`)
  console.log(`Chromatic: ${pr.visual}   Visual gate: ${report.visualGate ?? 'not set'}   Human review: ${report.humanReview ?? 'not set'}`)
  console.log(`Threads: ${pr.unresolved} unresolved of ${pr.threads.length}`)
  for (const t of pr.threads.filter((t) => !t.resolved)) console.log(`  - ${t.path}:${t.line ?? '?'} ${(t.body.split('\n')[0] ?? '').slice(0, 100)}`)
}
