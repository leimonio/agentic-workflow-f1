import { describe, expect, it } from 'vitest'
import { diff } from './gate.ts'
import type { Result } from './types.ts'

const r = (id: string, status: 'pass' | 'fail'): Result => ({ check: 'unit', id, status, message: status })

describe('gate diff', () => {
  it('classifies new, pre-existing and fixed', () => {
    const base = [r('a', 'fail'), r('b', 'fail'), r('c', 'pass')]
    const now = [r('a', 'fail'), r('b', 'pass'), r('c', 'fail'), r('d', 'pass')]
    const d = diff(base, now)
    expect(d.newFailures.map((x) => x.id)).toEqual(['c'])
    expect(d.preExisting.map((x) => x.id)).toEqual(['a'])
    expect(d.fixed).toEqual([{ id: 'b' }])
    expect(d.passed).toBe(2)
  })

  it('treats a failure that disappears from the results entirely as fixed', () => {
    expect(diff([r('a', 'fail')], []).fixed).toEqual([{ id: 'a' }])
  })

  it('has no new failures when the run equals the baseline', () => {
    const same = [r('a', 'fail'), r('b', 'pass')]
    expect(diff(same, same).newFailures).toEqual([])
  })

  it('counts a brand-new test that fails as a new failure', () => {
    expect(diff([], [r('x', 'fail')]).newFailures).toHaveLength(1)
  })
})
