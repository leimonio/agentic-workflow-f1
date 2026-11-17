import { describe, expect, it } from 'vitest'
import { decide, type Attempt } from './loop.ts'

const pass = { pass: true, newFailures: [] }
const fail = (...ids: string[]) => ({ pass: false, newFailures: ids })
const attempt = (gates: Attempt['gates'], verdict: Attempt['verdict'] = 'ok'): Attempt => ({ summary: 's', verdict, gates })

describe('build loop decision', () => {
  it('starts with an attempt', () => expect(decide([])).toEqual({ kind: 'attempt' }))

  it('is done only on two passing gates in a row', () => {
    expect(decide([attempt([pass, pass])]).kind).toBe('done')
    expect(decide([attempt([pass])]).kind).toBe('attempt')
  })

  it('treats pass-then-fail as not stable (flaky)', () => {
    expect(decide([attempt([pass, fail('e2e:x')])]).kind).toBe('attempt')
  })

  it('stops early when two attempts in a row fail the same way', () => {
    const d = decide([attempt([fail('unit:a', 'lint:b')]), attempt([fail('lint:b', 'unit:a')])])
    expect(d).toMatchObject({ kind: 'escalate', reason: 'two attempts in a row failed the same way' })
  })

  it('keeps going when the failures change', () => {
    expect(decide([attempt([fail('unit:a')]), attempt([fail('unit:b')])]).kind).toBe('attempt')
  })

  it('escalates after the attempt bound', () => {
    const d = decide([attempt([fail('a')]), attempt([fail('b')]), attempt([fail('c')])])
    expect(d).toMatchObject({ kind: 'escalate', reason: '3 attempts used' })
  })

  it('a stable green on the last allowed attempt still wins', () => {
    expect(decide([attempt([fail('a')]), attempt([fail('b')]), attempt([pass, pass])]).kind).toBe('done')
  })

  it('escalates at once when the agent asks a question', () => {
    const d = decide([attempt([fail('a')], 'needs_human')])
    expect(d).toMatchObject({ kind: 'escalate', reason: 'the agent asked a question' })
  })

  it('does not trust an agent "ok" when the gate fails', () => {
    expect(decide([attempt([fail('a')], 'ok')]).kind).toBe('attempt')
  })
})
