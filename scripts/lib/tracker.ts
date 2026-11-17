// The only abstraction in the workflow: the same fields whether they live in files or on a monday board.
// Field names follow the board columns (spec section 3).
export interface Item {
  id: string
  title: string
  type: 'Idea' | 'Task'
  /** What to build (the task text, or the idea for the plan stage). */
  description: string
  parent?: string
  dependsOn?: string[]
  plan?: 'Not started' | 'Planning' | 'Awaiting approval' | 'Approved' | 'Needs human'
  planDetails?: string
  /** Human only. */
  planApproved?: boolean
  build?: 'Queued' | 'In progress' | 'Done' | 'Failed'
  attempts?: number
  branch?: string
  ci?: 'Pending' | 'Green' | 'Failing' | 'Fixing'
  openThreads?: number
  verify?: 'Watching' | 'Fixing' | 'Stable green' | 'Needs human'
  visual?: 'Pending review' | 'Accepted' | 'Rejected'
  /** Human only. */
  humanReview?: 'Waiting' | 'Changes requested' | 'Approved'
  merge?: 'Waiting' | 'Merged' | 'Blocked'
  pr?: string
  needsHuman?: string
}

/** Written by a script, never by the agent. Same shape for every stage. */
export interface Handoff {
  stage: string
  attempts: number
  failing: string[]
  tried: string[]
  question: string
  resume: string
}

export interface Tracker {
  list(): Promise<Item[]>
  get(id: string): Promise<Item>
  /** Returns the new id. (Not in the spec's list: monday assigns ids, so an upsert by our own id cannot work.) */
  create(fields: Omit<Item, 'id'>): Promise<string>
  update(id: string, fields: Partial<Item>): Promise<void>
  log(id: string, line: string): Promise<void>
  handoff(id: string, record: Handoff): Promise<void>
}

export const logLine = (stage: string, result: string, at = new Date()) => `${stage} · ${result} · ${at.toISOString()}`

export function renderHandoff(h: Handoff): string {
  return [
    `## What happened`,
    `Stage **${h.stage}** stopped after ${h.attempts} attempt(s).`,
    ...(h.failing.length ? ['', 'Still failing:', ...h.failing.map((f) => `- \`${f}\``)] : []),
    '',
    `## What was tried`,
    ...h.tried.map((t, i) => `${i + 1}. ${t}`),
    '',
    `## Question`,
    h.question,
    '',
    `## How to resume`,
    h.resume,
    '',
  ].join('\n')
}
