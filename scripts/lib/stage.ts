// The stage rules from the spec, as one pure function. dispatch runs whatever this returns.
// Every wait that needs a human ends with "→ <the command>", so the output always says what to do next.
import type { Item } from './tracker.ts'

export type Stage = 'plan' | 'queue' | 'build' | 'pr' | 'verify' | 'merge'
export type Next = { stage: Stage } | { wait: string } | null

const depDone = (d: Item | undefined) => d?.merge === 'Merged' || d?.build === 'Done' // Build = Done counts in workshop mode

// The stage a handoff came from, so the reset command names the right one.
const escalated = (i: Item) => (i.plan === 'Needs human' ? 'plan' : i.verify === 'Needs human' ? 'verify' : i.merge === 'Blocked' ? 'merge' : 'build')

export function nextStage(item: Item, all: Item[]): Next {
  const cmd = (c: string) => `npm run item -- ${c.replace('<id>', item.id)}`
  if (item.needsHuman)
    return { wait: `needs human: ${item.needsHuman} → read .agent/items/${item.id}.handoff.md, then ${cmd(`reset <id> ${escalated(item)}`)}` }

  if (item.type === 'Idea') {
    if (!item.plan || item.plan === 'Not started') return { stage: 'plan' }
    if (item.plan === 'Awaiting approval')
      return item.planApproved ? { stage: 'queue' } : { wait: `Plan approved (human) → read ${cmd('show <id>')}, then ${cmd('approve <id>')}` }
    return null
  }

  if (item.pr && item.merge !== 'Merged') {
    if (item.verify === 'Stable green') {
      const missing = [
        item.visual !== 'Accepted' && `Visual = Accepted (human, in Chromatic) → ${cmd('visual <id> accepted|rejected')}`,
        item.humanReview !== 'Approved' && `Human review = Approved (human) → ${cmd('review <id> approved|changes')}`,
      ].filter(Boolean)
      if (missing.length) return { wait: missing.join('; ') }
      // Bottom of the stack first: a dependency's PR must merge before this one.
      const unmerged = (item.dependsOn ?? []).filter((id) => all.find((d) => d.id === id)?.merge !== 'Merged')
      return unmerged.length ? { wait: `merge ${unmerged.join(', ')} first` } : { stage: 'merge' }
    }
    return item.verify === 'Needs human'
      ? { wait: `Verify = Needs human → answer the threads on GitHub, then ${cmd('reset <id> verify')}` }
      : { stage: 'verify' }
  }

  // Built by dispatch (an agent/ branch) but no PR yet: dispatch ran without --pr.
  if (item.build === 'Done' && !item.pr && item.branch?.startsWith('agent/')) return { stage: 'pr' }

  if (item.build === 'Queued') {
    const blocked = (item.dependsOn ?? []).filter((id) => !depDone(all.find((d) => d.id === id)))
    return blocked.length ? { wait: `depends on ${blocked.join(', ')}` } : { stage: 'build' }
  }
  return null
}

/** The Next block: one line per item that waits. Without --pr, a built task waits for the next `dispatch -- --pr`. */
export function waitingLines(all: Item[], withPr: boolean): string[] {
  return all.flatMap((item) => {
    const next = nextStage(item, all)
    if (next && 'wait' in next) return [`${item.id} (${item.title}): ${next.wait}`]
    if (next?.stage === 'pr' && !withPr) return [`${item.id} (${item.title}): PR not opened → npm run dispatch -- --pr`]
    return []
  })
}
