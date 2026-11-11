import { describe, expect, it } from 'vitest'
import { COLUMNS, fromColumnValues, toColumnValues } from './board-columns.ts'

describe('board column mapping', () => {
  it('writes each column type in the shape monday expects', () => {
    expect(toColumnValues({ build: 'Queued', attempts: 2, planDetails: 'x', planApproved: true, pr: 'https://g/1', dependsOn: ['1', '2'], branch: 'b' })).toEqual({
      agent_build: { label: 'Queued' },
      agent_attempts: '2',
      agent_plan_details: { text: 'x' },
      agent_plan_approved: { checked: 'true' },
      agent_pr: { url: 'https://g/1', text: 'PR' },
      agent_depends_on: '1,2',
      agent_branch: 'b',
    })
  })

  it('clears a status with an empty string and skips undefined fields', () => {
    expect(toColumnValues({ build: undefined, needsHuman: '' })).toEqual({ agent_needs_human: { text: '' } })
  })

  it('reads back what it wrote', () => {
    const back = fromColumnValues([
      { id: 'agent_build', text: 'Done', value: '{"index":2}' },
      { id: 'agent_attempts', text: '3', value: '"3"' },
      { id: 'agent_plan_approved', text: 'v', value: '{"checked":true}' },
      { id: 'agent_pr', text: 'PR - https://g/1', value: '{"url":"https://g/1","text":"PR"}' },
      { id: 'agent_depends_on', text: '1, 2', value: '"1, 2"' },
      { id: 'agent_branch', text: '', value: null },
      { id: 'other', text: 'x', value: null },
    ])
    expect(back).toEqual({ build: 'Done', attempts: 3, planApproved: true, pr: 'https://g/1', dependsOn: ['1', '2'] })
  })

  it('has unique, valid column ids', () => {
    const ids = COLUMNS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z_]{1,20}$/)
  })
})
