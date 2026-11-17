import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { localTracker } from './local-tracker.ts'
import { renderHandoff } from './tracker.ts'

describe('local tracker', () => {
  it('merges updates and writes the handoff', async () => {
    const root = mkdtempSync(join(tmpdir(), 'trk-'))
    const t = localTracker(join(root, 'items'))
    await t.update('7', { title: 'T', type: 'Task', description: 'd', build: 'Queued' })
    await t.update('7', { build: 'In progress', attempts: 1 })
    expect(await t.get('7')).toMatchObject({ title: 'T', build: 'In progress', attempts: 1 })
    expect(await t.list()).toHaveLength(1)
    await t.handoff('7', { stage: 'Build', attempts: 1, failing: ['unit:x'], tried: ['a'], question: 'Q?', resume: 'r' })
    expect((await t.get('7')).needsHuman).toBe('Q?')
    expect(readFileSync(join(root, 'handoff.md'), 'utf8')).toContain('## Question\nQ?')
  })

  it('creates items with a slug id that never overwrites', async () => {
    const t = localTracker(join(mkdtempSync(join(tmpdir(), 'trk-')), 'items'))
    const a = await t.create({ title: 'Driver profile: header', type: 'Task', description: 'd' })
    const b = await t.create({ title: 'Driver profile: header', type: 'Task', description: 'e' })
    expect([a, b]).toEqual(['driver-profile-header', 'driver-profile-header-2'])
    expect((await t.get(b)).description).toBe('e')
  })
})

describe('renderHandoff', () => {
  it('has the four fixed sections', () => {
    const md = renderHandoff({ stage: 'Build', attempts: 2, failing: [], tried: ['x', 'y'], question: 'Q', resume: 'R' })
    expect(md.match(/^## /gm)).toHaveLength(4)
    expect(md).toContain('2. y')
  })
})
