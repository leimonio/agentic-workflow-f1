// Pure decision for the build loop. The script counts attempts; the agent never does.
export const MAX_ATTEMPTS = 3

export interface Attempt {
  /** What the agent said it did (one line). */
  summary: string
  /** The agent's own verdict. Advisory only: the gate decides. */
  verdict: 'ok' | 'failed' | 'needs_human'
  question?: string
  /** Results of the gate runs after this attempt, in order. Stable green = two passes in a row. */
  gates: { pass: boolean; newFailures: string[] }[]
}

export type Decision = { kind: 'done' } | { kind: 'attempt' } | { kind: 'escalate'; reason: string; question: string }

export const isStable = (a: Attempt) => a.gates.length >= 2 && a.gates.slice(-2).every((g) => g.pass)
/** The failures this attempt ended with, as a comparable signature. */
export const signature = (a: Attempt) => [...(a.gates.at(-1)?.newFailures ?? [])].sort().join('\n')

export function decide(attempts: Attempt[], max = MAX_ATTEMPTS): Decision {
  const last = attempts.at(-1)
  if (!last) return { kind: 'attempt' }
  if (isStable(last)) return { kind: 'done' }
  if (last.verdict === 'needs_human')
    return { kind: 'escalate', reason: 'the agent asked a question', question: last.question ?? 'The agent needs a decision (no question given).' }
  const prev = attempts.at(-2)
  if (prev && signature(prev) !== '' && signature(prev) === signature(last))
    return { kind: 'escalate', reason: 'two attempts in a row failed the same way', question: 'The same checks failed twice in a row. Is the task or the test wrong?' }
  if (attempts.length >= max)
    return { kind: 'escalate', reason: `${max} attempts used`, question: `No stable green after ${max} attempts. What should change?` }
  return { kind: 'attempt' }
}
