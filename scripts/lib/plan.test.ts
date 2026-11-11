import { describe, expect, it } from 'vitest'
import { validatePlan, type PlanTask } from './plan.ts'

const t = (key: string, f: Partial<PlanTask> = {}): PlanTask => ({
  key,
  title: `Task ${key}`,
  responsibility: 'One thing',
  files: [`src/${key}.ts`],
  acceptance: ['works'],
  test: `src/${key}.test.ts`,
  dependsOn: [],
  ...f,
})

describe('validatePlan', () => {
  it('accepts a well-formed plan', () => {
    expect(validatePlan([t('t1'), t('t2', { dependsOn: ['t1'] })])).toEqual([])
  })

  it('rejects an empty plan', () => {
    expect(validatePlan([])).toEqual(['the plan has no tasks'])
    expect(validatePlan(undefined)).toEqual(['the plan has no tasks'])
  })

  it('names each missing part of a task', () => {
    expect(validatePlan([t('t1', { responsibility: ' ', files: [], acceptance: [], test: '' })])).toEqual([
      'task t1: no responsibility statement',
      'task t1: no files to touch',
      'task t1: no acceptance criteria',
      'task t1: no test',
    ])
  })

  it('caps the plan at 15 distinct files', () => {
    const files = Array.from({ length: 16 }, (_, i) => `f${i}`)
    expect(validatePlan([t('t1', { files })])).toEqual(['the plan touches 16 files (max 15)'])
    expect(validatePlan([t('t1', { files: files.slice(0, 15) }), t('t2', { files: files.slice(0, 15) })])).toEqual([])
  })

  it('rejects unknown dependencies, duplicate keys and cycles', () => {
    expect(validatePlan([t('t1', { dependsOn: ['t9'] })])).toEqual(['task t1: depends on unknown task t9'])
    expect(validatePlan([t('t1'), t('t1')])).toContain('task t1: duplicate key')
    expect(validatePlan([t('a', { dependsOn: ['c'] }), t('b', { dependsOn: ['a'] }), t('c', { dependsOn: ['b'] })])).toEqual(['circular dependency: a → c → b → a'])
    expect(validatePlan([t('a', { dependsOn: ['a'] })])).toEqual(['circular dependency: a → a'])
  })
})
