// The plan's JSON schema (sent to the agent) and the deterministic check its output must pass.
import type { Verdict } from './agent.ts'

export const MAX_FILES = 15
export const PLAN_RETRIES = 2

export interface PlanTask {
  key: string
  title: string
  responsibility: string
  files: string[]
  acceptance: string[]
  test: string
  dependsOn: string[]
}
export interface PlanVerdict extends Verdict {
  tasks?: PlanTask[]
}
export interface ReviewVerdict extends Verdict {
  reasons?: string[]
}

const str = { type: 'string', minLength: 1 }
export const PLAN_SCHEMA = {
  type: 'object',
  properties: {
    status: { enum: ['ok', 'needs_human'] },
    summary: str,
    question: { type: 'string', description: 'Only with needs_human.' },
    tasks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          key: { type: 'string', description: 'Short id, for example "t1".' },
          title: str,
          responsibility: { type: 'string', description: 'One sentence: the single concern of this PR.' },
          files: { type: 'array', items: str },
          acceptance: { type: 'array', items: str },
          test: { type: 'string', description: 'The test to add (file and what it checks).' },
          dependsOn: { type: 'array', items: { type: 'string' }, description: 'Keys of tasks that must land first.' },
        },
        required: ['key', 'title', 'responsibility', 'files', 'acceptance', 'test', 'dependsOn'],
      },
    },
  },
  required: ['status', 'summary'],
}
export const REVIEW_SCHEMA = {
  type: 'object',
  properties: { status: { enum: ['ok', 'failed'] }, summary: str, reasons: { type: 'array', items: str } },
  required: ['status', 'summary'],
}

/** Every problem with a plan, as one line each. Empty = valid. */
export function validatePlan(tasks: PlanTask[] | undefined): string[] {
  if (!tasks?.length) return ['the plan has no tasks']
  const errors: string[] = []
  const keys = new Set<string>()
  for (const t of tasks) {
    const at = `task ${t.key || '?'}`
    if (!t.key) errors.push('a task has no key')
    else if (keys.has(t.key)) errors.push(`${at}: duplicate key`)
    keys.add(t.key)
    if (!t.responsibility?.trim()) errors.push(`${at}: no responsibility statement`)
    if (!t.files?.length) errors.push(`${at}: no files to touch`)
    if (!t.acceptance?.length) errors.push(`${at}: no acceptance criteria`)
    if (!t.test?.trim()) errors.push(`${at}: no test`)
  }
  const files = new Set(tasks.flatMap((t) => t.files ?? []))
  if (files.size > MAX_FILES) errors.push(`the plan touches ${files.size} files (max ${MAX_FILES})`)
  for (const t of tasks) for (const d of t.dependsOn ?? []) if (!keys.has(d)) errors.push(`task ${t.key}: depends on unknown task ${d}`)
  const cycle = findCycle(tasks)
  if (cycle) errors.push(`circular dependency: ${cycle.join(' → ')}`)
  return errors
}

function findCycle(tasks: PlanTask[]): string[] | null {
  const deps = new Map(tasks.map((t) => [t.key, t.dependsOn ?? []]))
  const state = new Map<string, 'visiting' | 'done'>()
  const visit = (k: string, path: string[]): string[] | null => {
    if (state.get(k) === 'visiting') return [...path.slice(path.indexOf(k)), k]
    if (state.get(k) === 'done') return null
    state.set(k, 'visiting')
    for (const d of deps.get(k) ?? []) {
      const c = visit(d, [...path, k])
      if (c) return c
    }
    state.set(k, 'done')
    return null
  }
  for (const k of deps.keys()) {
    const c = visit(k, [])
    if (c) return c
  }
  return null
}

/** The text stored in the task's Plan details column. */
export const renderTask = (t: PlanTask) =>
  [`Responsibility: ${t.responsibility}`, '', 'Files:', ...t.files.map((f) => `- ${f}`), '', 'Acceptance:', ...t.acceptance.map((a) => `- ${a}`), '', `Test: ${t.test}`].join('\n')
