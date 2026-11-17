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

// Step 2: write this. The rules, in order (scripts/lib/loop.test.ts checks each one):
//   no attempt yet → attempt · stable green (isStable) → done · the agent asked (needs_human) → escalate
//   the same non-empty failures twice in a row (signature) → escalate · max attempts used → escalate · else → attempt
// The agent's own verdict "ok" never counts: only the gate does.
export function decide(attempts: Attempt[], max = MAX_ATTEMPTS): Decision {
  void attempts
  void max
  throw new Error('decide() is not written yet: step 2 of the workshop (scripts/lib/loop.ts)')
}
