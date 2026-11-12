import { describe, expect, it } from 'vitest'
import { mergeBlockers, readChecks, verifyAction, type PrStatus } from './pr.ts'

const run = (name: string, status: string, conclusion = '') => ({ __typename: 'CheckRun' as const, name, status, conclusion })
const ui = (state: string) => ({ __typename: 'StatusContext' as const, context: 'UI Tests', state, description: '', targetUrl: '' })

describe('readChecks', () => {
  it('reports Pending while anything runs, Failing on a red check, Green otherwise', () => {
    expect(readChecks([]).ci).toBe('Pending')
    expect(readChecks([run('gate', 'IN_PROGRESS'), run('lint', 'COMPLETED', 'FAILURE')]).ci).toBe('Pending')
    expect(readChecks([run('gate', 'COMPLETED', 'FAILURE')]).ci).toBe('Failing')
    expect(readChecks([run('gate', 'COMPLETED', 'SUCCESS'), run('x', 'COMPLETED', 'SKIPPED')]).ci).toBe('Green')
  })

  it('reads Chromatic statuses as the visual state, never as CI', () => {
    expect(readChecks([run('gate', 'COMPLETED', 'SUCCESS')]).visual).toBe('not-run')
    expect(readChecks([ui('PENDING')]).visual).toBe('Pending review')
    expect(readChecks([run('gate', 'COMPLETED', 'SUCCESS'), ui('FAILURE')])).toMatchObject({ ci: 'Green', visual: 'Rejected' })
    expect(readChecks([ui('SUCCESS')]).visual).toBe('Accepted')
  })
})

describe('verifyAction', () => {
  const s = { ci: 'Green' as const, necessary: 0, discussions: 0, rounds: 0, ciWaitMin: 0 }
  it('fixes necessary threads and red CI, within the round bound', () => {
    expect(verifyAction({ ...s, necessary: 1 })).toEqual({ do: 'fix' })
    expect(verifyAction({ ...s, ci: 'Failing', rounds: 2 })).toEqual({ do: 'fix' })
    expect(verifyAction({ ...s, necessary: 1, rounds: 3 })).toMatchObject({ do: 'escalate' })
  })
  it('escalates discussions and long CI waits, and is stable only when green with nothing open', () => {
    expect(verifyAction({ ...s, discussions: 1 })).toMatchObject({ do: 'escalate' })
    expect(verifyAction({ ...s, ci: 'Pending', ciWaitMin: 14 })).toEqual({ do: 'wait' })
    expect(verifyAction({ ...s, ci: 'Pending', ciWaitMin: 15 })).toMatchObject({ do: 'escalate' })
    expect(verifyAction(s)).toEqual({ do: 'stable' })
  })
})

describe('mergeBlockers', () => {
  const pr = { state: 'OPEN', ci: 'Green', unresolved: 0, mergeable: 'MERGEABLE' } as PrStatus
  const item = { id: 'a', title: 'a', type: 'Task' as const, description: '', visual: 'Accepted' as const, humanReview: 'Approved' as const }
  it('merges only when every condition holds', () => {
    expect(mergeBlockers(item, pr)).toEqual([])
    expect(mergeBlockers({ ...item, humanReview: 'Waiting', visual: undefined }, { ...pr, ci: 'Failing', unresolved: 2, mergeable: 'CONFLICTING' })).toEqual([
      'CI is Failing',
      '2 unresolved thread(s)',
      'Visual is not set (needs Accepted)',
      'Human review is Waiting (needs Approved)',
      'GitHub says mergeable = CONFLICTING',
    ])
  })
})
