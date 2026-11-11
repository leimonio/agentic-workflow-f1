// The stage rules from the spec, as one pure function. dispatch runs whatever this returns.
import type { Item } from './tracker.ts'

export type Stage = 'plan' | 'queue' | 'build' | 'verify' | 'merge'
export type Next = { stage: Stage } | { wait: string } | null

const depDone = (d: Item | undefined) => d?.merge === 'Merged' || d?.build === 'Done' // Build = Done counts in workshop mode

export function nextStage(item: Item, all: Item[]): Next {
  if (item.needsHuman) return { wait: `needs human: ${item.needsHuman}` }

  if (item.type === 'Idea') {
    if (!item.plan || item.plan === 'Not started') return { stage: 'plan' }
    if (item.plan === 'Awaiting approval') return item.planApproved ? { stage: 'queue' } : { wait: 'Plan approved (human)' }
    return null
  }

  if (item.pr && item.merge !== 'Merged') {
    if (item.verify === 'Stable green') {
      const missing = [item.visual !== 'Accepted' && 'Visual = Accepted (human, in Chromatic)', item.humanReview !== 'Approved' && 'Human review = Approved (human)'].filter(Boolean)
      return missing.length ? { wait: missing.join(', ') } : { stage: 'merge' }
    }
    return item.verify === 'Needs human' ? { wait: 'Verify = Needs human' } : { stage: 'verify' }
  }

  if (item.build === 'Queued') {
    const blocked = (item.dependsOn ?? []).filter((id) => !depDone(all.find((d) => d.id === id)))
    return blocked.length ? { wait: `depends on ${blocked.join(', ')}` } : { stage: 'build' }
  }
  return null
}
