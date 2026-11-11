import { localTracker } from './local-tracker.ts'
import { mondayTracker } from './monday-tracker.ts'
import type { Tracker } from './tracker.ts'

// Switching to the board is this one setting: AGENT_TRACKER=monday (in .env or the shell).
export function trackerFromEnv(): Tracker {
  const kind = process.env.AGENT_TRACKER ?? 'local'
  if (kind === 'local') return localTracker()
  if (kind === 'monday') return mondayTracker()
  throw new Error(`AGENT_TRACKER=${kind}: use local or monday`)
}
