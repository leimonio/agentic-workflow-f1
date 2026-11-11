export interface Status { context: string; state: 'pending' | 'success' | 'failure' | 'error'; description: string; target_url: string }
export type Visual = 'not-run' | 'pending-review' | 'accepted' | 'rejected-or-error'

// Chromatic posts "UI Tests" and "UI Review" commit statuses. We read them; we never decide.
export function summarize(statuses: Status[]): { visual: Visual; checks: Status[] } {
  const checks = statuses.filter((s) => /^UI (Tests|Review)/.test(s.context))
  const visual: Visual = !checks.length
    ? 'not-run'
    : checks.some((s) => s.state === 'failure' || s.state === 'error')
      ? 'rejected-or-error'
      : checks.some((s) => s.state === 'pending')
        ? 'pending-review'
        : 'accepted'
  return { visual, checks }
}
