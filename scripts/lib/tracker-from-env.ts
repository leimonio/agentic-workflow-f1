import { existsSync, readFileSync } from 'node:fs'
import { localTracker } from './local-tracker.ts'
import { boardConfig } from './monday.ts'
import { mondayTracker } from './monday-tracker.ts'
import type { Tracker } from './tracker.ts'

// Read here, not only in monday.ts: AGENT_TRACKER in .env must win over "local" for every script.
if (existsSync('.env')) {
  const fromShell = process.env.AGENT_TRACKER
  const lines = readFileSync('.env', 'utf8').match(/^\s*AGENT_TRACKER\s*=.*$/gm) ?? []
  process.loadEnvFile('.env')
  for (const w of envWarnings(lines, fromShell)) console.error(`warning: ${w}`)
}

/** Why the tracker may not be the one .env seems to say. Both were real mix-ups in a rehearsal. */
export function envWarnings(lines: string[], fromShell?: string): string[] {
  const last = lines.at(-1)?.split('=')[1]?.trim()
  return [
    lines.length > 1 && `.env sets AGENT_TRACKER ${lines.length} times; the last one (${last}) wins. Keep one.`,
    fromShell && last && fromShell !== last && `AGENT_TRACKER=${fromShell} from your shell overrides .env (${last}). Run: unset AGENT_TRACKER`,
  ].filter((w): w is string => !!w)
}

export const trackerKind = () => process.env.AGENT_TRACKER ?? 'local'

/** One line saying where items live, so a local/monday mix-up shows at once. */
export const trackerLabel = (kind: string, boardId?: string) =>
  kind === 'monday' ? `monday (https://monday.com/boards/${boardId ?? '?'})` : `${kind} (.agent/items)`

export const currentTrackerLabel = () => {
  const kind = trackerKind()
  return trackerLabel(kind, kind === 'monday' && existsSync('.agent/board.json') ? boardConfig().boardId : undefined)
}

// Switching to the board is this one setting: AGENT_TRACKER=monday (in .env or the shell).
export function trackerFromEnv(): Tracker {
  const kind = trackerKind()
  if (kind === 'local') return localTracker()
  if (kind === 'monday') return mondayTracker()
  throw new Error(`AGENT_TRACKER=${kind}: use local or monday`)
}
