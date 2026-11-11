// Read the tracker (local files or the monday board, per AGENT_TRACKER). JSON out, for agents and scripts.
//   npm run -s board:read            all items
//   npm run -s board:read -- <id>    one item
import { trackerFromEnv } from '../lib/tracker-from-env.ts'

const id = process.argv[2]
const t = trackerFromEnv()
console.log(JSON.stringify(id ? await t.get(id) : await t.list(), null, 2))
