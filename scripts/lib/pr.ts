// Pure parts of the PR loop: read gh's JSON into one status, and decide the next verify action.
import type { Item } from './tracker.ts'
import { summarize, type Status } from './visual.ts'

export const MAX_FIX_ROUNDS = 3
export const CI_WAIT_MIN = 15

export type Ci = NonNullable<Item['ci']>
export interface Check { name: string; state: 'pending' | 'success' | 'failure' }
export interface Thread { id: string; resolved: boolean; path: string; line: number | null; author: string; body: string; url: string; replies: number }
export interface PrStatus {
  number: number
  url: string
  state: string
  head: string
  base: string
  mergeable: string
  ci: Ci
  checks: Check[]
  visual: Item['visual'] | 'not-run'
  threads: Thread[]
  unresolved: number
}

// gh's statusCheckRollup mixes check runs (Actions) and commit statuses (Chromatic).
type Rollup = { __typename: 'CheckRun'; name: string; status: string; conclusion: string } | { __typename: 'StatusContext'; context: string; state: string; description: string; targetUrl: string }

export function readChecks(rollup: Rollup[]): { ci: Ci; checks: Check[]; visual: PrStatus['visual'] } {
  const checks: Check[] = rollup.flatMap((r) =>
    r.__typename !== 'CheckRun' ? [] : [{ name: r.name, state: r.status !== 'COMPLETED' ? 'pending' : ['SUCCESS', 'SKIPPED', 'NEUTRAL'].includes(r.conclusion) ? 'success' : 'failure' }],
  )
  const ci: Ci = !checks.length || checks.some((c) => c.state === 'pending') ? 'Pending' : checks.some((c) => c.state === 'failure') ? 'Failing' : 'Green'
  const statuses = rollup.flatMap((r) =>
    r.__typename === 'StatusContext' ? [{ context: r.context, state: r.state.toLowerCase(), description: r.description, target_url: r.targetUrl } as Status] : [],
  )
  const v = summarize(statuses).visual
  const visual = v === 'not-run' ? 'not-run' : v === 'accepted' ? 'Accepted' : v === 'pending-review' ? 'Pending review' : 'Rejected'
  return { ci, checks, visual }
}

export type VerifyAction = { do: 'fix' } | { do: 'escalate'; why: string } | { do: 'wait' } | { do: 'stable' }

/** One babysit tick. `necessary` and `discussions` are unresolved threads after triage. */
export function verifyAction(s: { ci: Ci; necessary: number; discussions: number; rounds: number; ciWaitMin: number }): VerifyAction {
  const work = s.necessary > 0 || s.ci === 'Failing'
  if (work && s.rounds >= MAX_FIX_ROUNDS) return { do: 'escalate', why: `${MAX_FIX_ROUNDS} fix rounds used and the PR still needs work` }
  if (work) return { do: 'fix' }
  if (s.discussions > 0) return { do: 'escalate', why: `${s.discussions} thread(s) need a human answer` }
  if (s.ci === 'Pending') return s.ciWaitMin >= CI_WAIT_MIN ? { do: 'escalate', why: `CI still pending after ${CI_WAIT_MIN} min` } : { do: 'wait' }
  return { do: 'stable' }
}

/** Everything that stops a merge. Empty = merge. */
export function mergeBlockers(item: Item, pr: PrStatus): string[] {
  return [
    pr.state !== 'OPEN' && `PR is ${pr.state}`,
    pr.ci !== 'Green' && `CI is ${pr.ci}`,
    pr.unresolved > 0 && `${pr.unresolved} unresolved thread(s)`,
    item.visual !== 'Accepted' && `Visual is ${item.visual ?? 'not set'} (needs Accepted)`,
    item.humanReview !== 'Approved' && `Human review is ${item.humanReview ?? 'not set'} (needs Approved)`,
    pr.mergeable !== 'MERGEABLE' && `GitHub says mergeable = ${pr.mergeable}`,
  ].filter((b): b is string => !!b)
}
