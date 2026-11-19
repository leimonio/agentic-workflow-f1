import { describe, expect, it } from 'vitest'
import { nextStage } from './stage.ts'
import type { Item } from './tracker.ts'

const idea = (f: Partial<Item> = {}): Item => ({ id: 'i', title: 'Idea', type: 'Idea', description: 'd', ...f })
const task = (f: Partial<Item> = {}): Item => ({ id: 't', title: 'Task', type: 'Task', description: 'd', ...f })

describe('nextStage', () => {
  it('plans a new idea and waits for the human plan gate', () => {
    expect(nextStage(idea(), [])).toEqual({ stage: 'plan' })
    expect(nextStage(idea({ plan: 'Awaiting approval' }), [])).toEqual({
      wait: 'Plan approved (human) → read npm run item -- show i, then npm run item -- approve i',
    })
    expect(nextStage(idea({ plan: 'Awaiting approval', planApproved: true }), [])).toEqual({ stage: 'queue' })
    expect(nextStage(idea({ plan: 'Approved', planApproved: true }), [])).toBeNull()
  })

  it('builds a queued task only when its dependencies are done', () => {
    const dep = task({ id: 'a', build: 'In progress' })
    const t = task({ id: 'b', build: 'Queued', dependsOn: ['a'] })
    expect(nextStage(t, [dep, t])).toEqual({ wait: 'depends on a' })
    expect(nextStage(t, [{ ...dep, build: 'Done' }, t])).toEqual({ stage: 'build' })
    expect(nextStage(t, [{ ...dep, merge: 'Merged' }, t])).toEqual({ stage: 'build' })
    expect(nextStage(task({ build: 'Failed' }), [])).toBeNull()
  })

  it('treats a missing dependency as not done', () => {
    expect(nextStage(task({ build: 'Queued', dependsOn: ['ghost'] }), [])).toEqual({ wait: 'depends on ghost' })
  })

  it('verifies an open PR until stable green, then waits for both human gates', () => {
    const pr = { pr: 'https://x/1', build: 'Done' as const }
    expect(nextStage(task({ ...pr, verify: 'Watching' }), [])).toEqual({ stage: 'verify' })
    expect(nextStage(task(pr), [])).toEqual({ stage: 'verify' })
    expect(nextStage(task({ ...pr, verify: 'Stable green', visual: 'Accepted' }), [])).toEqual({
      wait: 'Human review = Approved (human) → npm run item -- review t approved|changes',
    })
    expect(nextStage(task({ ...pr, verify: 'Stable green', visual: 'Accepted', humanReview: 'Approved' }), [])).toEqual({ stage: 'merge' })
    expect(nextStage(task({ ...pr, merge: 'Merged', verify: 'Stable green' }), [])).toBeNull()
  })

  it('opens the PR for a task dispatch built without --pr', () => {
    expect(nextStage(task({ build: 'Done', branch: 'agent/t' }), [])).toEqual({ stage: 'pr' })
    expect(nextStage(task({ build: 'Done', branch: 'main' }), [])).toBeNull() // built by hand in step 2
  })

  it('merges the bottom of a stack first', () => {
    const ready = { pr: 'https://x/2', build: 'Done' as const, verify: 'Stable green' as const, visual: 'Accepted' as const, humanReview: 'Approved' as const }
    const dep = task({ id: 'a', pr: 'https://x/1', build: 'Done' })
    const t = task({ id: 'b', dependsOn: ['a'], ...ready })
    expect(nextStage(t, [dep, t])).toEqual({ wait: 'merge a first' })
    expect(nextStage(t, [{ ...dep, merge: 'Merged' }, t])).toEqual({ stage: 'merge' })
  })

  it('never moves an item that is waiting for a human', () => {
    expect(nextStage(task({ build: 'Queued', needsHuman: 'Which API?' }), [])).toEqual({
      wait: 'needs human: Which API? → read .agent/items/t.handoff.md, then npm run item -- reset t build',
    })
    expect(nextStage(task({ pr: 'https://x/1', verify: 'Needs human', needsHuman: 'q' }), [])).toEqual({
      wait: 'needs human: q → read .agent/items/t.handoff.md, then npm run item -- reset t verify',
    })
  })
})
