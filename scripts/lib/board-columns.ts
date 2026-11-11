// The board schema (spec section 3) and the pure mapping between Item fields and monday column values.
// Column ids are fixed, so a duplicated board keeps them and `board:setup --adopt` only needs the board id.
import type { Item } from './tracker.ts'

type Kind = 'status' | 'text' | 'long_text' | 'numbers' | 'checkbox' | 'link'
export interface Column {
  field: keyof Item
  id: string
  title: string
  type: Kind
  labels?: string[]
}

export const COLUMNS: Column[] = [
  { field: 'type', id: 'agent_type', title: 'Type', type: 'status', labels: ['Idea', 'Task'] },
  { field: 'parent', id: 'agent_parent', title: 'Parent', type: 'text' },
  { field: 'dependsOn', id: 'agent_depends_on', title: 'Depends on', type: 'text' },
  { field: 'description', id: 'agent_description', title: 'Description', type: 'long_text' },
  { field: 'plan', id: 'agent_plan', title: 'Plan', type: 'status', labels: ['Not started', 'Planning', 'Awaiting approval', 'Approved', 'Needs human'] },
  { field: 'planDetails', id: 'agent_plan_details', title: 'Plan details', type: 'long_text' },
  { field: 'planApproved', id: 'agent_plan_approved', title: 'Plan approved', type: 'checkbox' },
  { field: 'build', id: 'agent_build', title: 'Build', type: 'status', labels: ['Queued', 'In progress', 'Done', 'Failed'] },
  { field: 'attempts', id: 'agent_attempts', title: 'Attempts', type: 'numbers' },
  { field: 'branch', id: 'agent_branch', title: 'Branch', type: 'text' },
  { field: 'ci', id: 'agent_ci', title: 'CI', type: 'status', labels: ['Pending', 'Green', 'Failing', 'Fixing'] },
  { field: 'openThreads', id: 'agent_open_threads', title: 'Open threads', type: 'numbers' },
  { field: 'verify', id: 'agent_verify', title: 'Verify', type: 'status', labels: ['Watching', 'Fixing', 'Stable green', 'Needs human'] },
  { field: 'visual', id: 'agent_visual', title: 'Visual', type: 'status', labels: ['Pending review', 'Accepted', 'Rejected'] },
  { field: 'humanReview', id: 'agent_human_review', title: 'Human review', type: 'status', labels: ['Waiting', 'Changes requested', 'Approved'] },
  { field: 'merge', id: 'agent_merge', title: 'Merge', type: 'status', labels: ['Waiting', 'Merged', 'Blocked'] },
  { field: 'pr', id: 'agent_pr', title: 'PR', type: 'link' },
  { field: 'needsHuman', id: 'agent_needs_human', title: 'Needs human', type: 'long_text' },
]
export const LOG_COLUMN = { id: 'agent_log', title: 'Agent log', type: 'long_text' as const }
export const GROUPS = ['Ideas', 'Tasks', 'Done'] as const

/** Item fields → the `column_values` JSON for change_multiple_column_values. `undefined` fields are skipped. */
export function toColumnValues(fields: Partial<Item>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const c of COLUMNS) {
    const v = fields[c.field]
    if (v === undefined) continue
    if (c.type === 'status') out[c.id] = v === '' ? null : { label: v }
    else if (c.type === 'long_text') out[c.id] = { text: String(v) }
    else if (c.type === 'numbers') out[c.id] = String(v)
    else if (c.type === 'checkbox') out[c.id] = v ? { checked: 'true' } : null
    else if (c.type === 'link') out[c.id] = v ? { url: String(v), text: 'PR' } : null
    else out[c.id] = Array.isArray(v) ? v.join(',') : String(v)
  }
  return out
}

/** monday `column_values` (id, text, value) → Item fields. Empty columns are left out. */
export function fromColumnValues(values: { id: string; text: string | null; value: string | null }[]): Partial<Item> {
  const out: Record<string, unknown> = {}
  for (const cv of values) {
    const c = COLUMNS.find((col) => col.id === cv.id)
    if (!c) continue
    const text = cv.text ?? ''
    if (c.type === 'checkbox') out[c.field] = cv.value ? String(JSON.parse(cv.value).checked) === 'true' : false
    else if (!text) continue
    else if (c.type === 'numbers') out[c.field] = Number(text)
    else if (c.type === 'link') out[c.field] = cv.value ? JSON.parse(cv.value).url : text
    else if (c.field === 'dependsOn') out[c.field] = text.split(',').map((s) => s.trim()).filter(Boolean)
    else out[c.field] = text
  }
  return out as Partial<Item>
}
