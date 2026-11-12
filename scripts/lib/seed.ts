// What a latecomer's tracker should hold at the start of step N. Pure; scripts/seed.ts writes it.
import type { Item } from './tracker.ts'

export type SeedKey = 'idea' | 't1' | 't2' | 't3'
export type Fixture = Record<SeedKey, Pick<Item, 'title' | 'type' | 'description' | 'planDetails'>>
export interface SeedItem { key: SeedKey; parent?: SeedKey; dependsOn?: SeedKey[]; fields: Omit<Item, 'id' | 'parent' | 'dependsOn'> }

export const SEED_BRANCH = 'seed/task-pr'

/** step 3: the planned, approved idea. 4: task 1 merged, task 2 has an open PR. 5: that PR is babysat (Stable green). */
export function seedItems(step: number, fx: Fixture, pr = ''): SeedItem[] {
  if (step < 3 || step > 5) throw new Error(`seed covers steps 3 to 5, got ${step}`)
  const queued = { build: 'Queued', attempts: 0 } as const
  const t2 =
    step === 3
      ? queued
      : { build: 'Done', attempts: 1, branch: SEED_BRANCH, pr, ci: 'Pending', verify: step === 5 ? 'Stable green' : 'Watching', merge: 'Waiting' } as const
  return [
    { key: 'idea', fields: { ...fx.idea, plan: 'Approved', planApproved: true } },
    { key: 't1', parent: 'idea', fields: { ...fx.t1, ...(step === 3 ? queued : { build: 'Done', attempts: 1, merge: 'Merged' }) } },
    { key: 't2', parent: 'idea', dependsOn: ['t1'], fields: { ...fx.t2, ...t2 } },
    { key: 't3', parent: 'idea', dependsOn: ['t2'], fields: { ...fx.t3, ...queued } },
  ]
}
