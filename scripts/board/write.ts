// Write tracker fields. Refuses the human-only gates, so no agent or script can tick them.
//   npm run board:write -- <id> build=Done attempts=1 branch=agent/x
import { COLUMNS } from '../lib/board-columns.ts'
import { logLine, type Item } from '../lib/tracker.ts'
import { trackerFromEnv } from '../lib/tracker-from-env.ts'

export const HUMAN_ONLY: (keyof Item)[] = ['planApproved', 'humanReview']

const [id, ...pairs] = process.argv.slice(2)
if (!id || !pairs.length) {
  console.error('usage: board:write -- <id> field=value ...')
  process.exit(2)
}
const fields: Record<string, unknown> = {}
for (const p of pairs) {
  const [k = '', ...rest] = p.split('=')
  const col = COLUMNS.find((c) => c.field === k)
  if (!col && k !== 'title') throw new Error(`Unknown field ${k}. Known: title, ${COLUMNS.map((c) => c.field).join(', ')}`)
  if (HUMAN_ONLY.includes(k as keyof Item)) throw new Error(`${k} is a human gate. Only a person sets it, on the board or with \`npm run item\`.`)
  const v = rest.join('=')
  fields[k] = col?.type === 'numbers' ? Number(v) : k === 'dependsOn' ? v.split(',').filter(Boolean) : v
}
const t = trackerFromEnv()
await t.update(id, fields as Partial<Item>)
await t.log(id, logLine('write', pairs.join(' ')))
console.log(JSON.stringify(await t.get(id), null, 2))
