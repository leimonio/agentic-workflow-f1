import { describe, expect, it } from 'vitest'
import { seedItems, type Fixture } from './seed.ts'
import { nextStage } from './stage.ts'
import type { Item } from './tracker.ts'

const t = (title: string) => ({ title, type: 'Task' as const, description: title })
const fx: Fixture = { idea: { ...t('Idea'), type: 'Idea' }, t1: t('t1'), t2: t('t2'), t3: t('t3') }
// What the tracker holds after seeding, with the keys as ids.
const asItems = (step: number): Item[] => seedItems(step, fx, 'https://x/pull/9').map((s) => ({ ...s.fields, id: s.key, parent: s.parent, dependsOn: s.dependsOn }))
const next = (step: number) => {
  const all = asItems(step)
  return Object.fromEntries(all.map((i) => [i.id, nextStage(i, all)]))
}

describe('seedItems', () => {
  it('step 3: approved plan, task 1 ready to build, the rest wait on it', () => {
    expect(next(3)).toEqual({ idea: null, t1: { stage: 'build' }, t2: { wait: 'depends on t1' }, t3: { wait: 'depends on t2' } })
  })
  it('step 4: task 2 has an open PR to babysit', () => {
    expect(next(4).t2).toEqual({ stage: 'verify' })
    expect(asItems(4).find((i) => i.id === 't2')).toMatchObject({ pr: 'https://x/pull/9', branch: 'seed/task-pr' })
  })
  it('step 5: the PR is babysat and waits only for the two human gates', () => {
    expect(next(5).t2).toEqual({ wait: 'Visual = Accepted (human, in Chromatic), Human review = Approved (human)' })
  })
  it('never sets the PR gates', () => {
    for (const s of [3, 4, 5]) for (const i of asItems(s)) expect(i).not.toHaveProperty('humanReview')
    expect(() => seedItems(2, fx)).toThrow()
  })
})
