import { describe, expect, it } from 'vitest'
import { summarize, type Status } from './visual.ts'

const s = (context: string, state: Status['state']): Status => ({ context, state, description: '', target_url: 'u' })

describe('visual summarize', () => {
  it('not-run when Chromatic posted nothing', () => expect(summarize([s('gate', 'success')]).visual).toBe('not-run'))
  it('pending-review while a change awaits a human', () =>
    expect(summarize([s('UI Tests', 'pending'), s('UI Review', 'pending')]).visual).toBe('pending-review'))
  it('accepted when every Chromatic check is green', () =>
    expect(summarize([s('UI Tests', 'success'), s('UI Review', 'success')]).visual).toBe('accepted'))
  it('rejected-or-error wins over pending', () =>
    expect(summarize([s('UI Tests', 'failure'), s('UI Review', 'pending')]).visual).toBe('rejected-or-error'))
})
