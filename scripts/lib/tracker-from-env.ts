import { localTracker } from './local-tracker.ts'
import type { Tracker } from './tracker.ts'

export function trackerFromEnv(): Tracker {
  const kind = process.env.AGENT_TRACKER ?? 'local'
  if (kind === 'local') return localTracker()
  throw new Error(`AGENT_TRACKER=${kind} is not supported yet (local only)`)
}
