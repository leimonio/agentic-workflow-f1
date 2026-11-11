import type { Result } from './types.ts'

export interface GateReport {
  newFailures: Result[]
  preExisting: Result[]
  fixed: { id: string }[]
  passed: number
}

/** Only NEW failures break the gate. A failure that is also in the baseline is pre-existing. */
export function diff(baseline: Result[], current: Result[]): GateReport {
  const baseFailed = new Set(baseline.filter((r) => r.status === 'fail').map((r) => r.id))
  const nowFailed = new Set(current.filter((r) => r.status === 'fail').map((r) => r.id))
  const fails = current.filter((r) => r.status === 'fail')
  return {
    newFailures: fails.filter((r) => !baseFailed.has(r.id)),
    preExisting: fails.filter((r) => baseFailed.has(r.id)),
    fixed: [...baseFailed].filter((id) => !nowFailed.has(id)).map((id) => ({ id })),
    passed: current.filter((r) => r.status === 'pass').length,
  }
}
