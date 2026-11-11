// One agent call = one `claude -p` run that must return a JSON verdict. The caller (a script) applies it.
import { spawnSync } from 'node:child_process'

export interface Verdict {
  status: 'ok' | 'failed' | 'needs_human'
  summary: string
  question?: string
}

const SCHEMA = JSON.stringify({
  type: 'object',
  properties: {
    status: { enum: ['ok', 'failed', 'needs_human'] },
    summary: { type: 'string', description: 'One line: what you changed and why.' },
    question: { type: 'string', description: 'Only with needs_human: the one question for the human.' },
  },
  required: ['status', 'summary'],
})

// Edits plus the repo's own scripts. No git, no network tools: the script owns those.
const TOOLS = ['Read', 'Edit', 'Write', 'Glob', 'Grep', 'Bash(npm run *)', 'Bash(npx vitest *)', 'Bash(npx playwright *)', 'Bash(ls *)']

export interface AgentRun {
  verdict: Verdict
  costUsd: number
  seconds: number
}

export function runAgent(prompt: string, opts: { tools?: string[]; schema?: string; budgetUsd?: number } = {}): AgentRun {
  const args = [
    '-p',
    prompt,
    '--output-format',
    'json',
    '--json-schema',
    opts.schema ?? SCHEMA,
    // Your own hooks and MCP servers would add cost and noise to every attempt. (--bare would too, but it refuses OAuth logins.)
    '--settings',
    '{"disableAllHooks":true}',
    '--strict-mcp-config',
    '--no-session-persistence',
    '--permission-mode',
    'acceptEdits',
    '--allowedTools',
    ...(opts.tools ?? TOOLS),
    '--max-budget-usd',
    String(opts.budgetUsd ?? 3),
    '--model',
    process.env.AGENT_MODEL ?? 'sonnet',
  ]
  const r = spawnSync('claude', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  let out: { is_error?: boolean; result?: string; structured_output?: Verdict; total_cost_usd?: number; duration_ms?: number }
  try {
    out = JSON.parse(r.stdout)
  } catch {
    return { verdict: { status: 'failed', summary: `claude -p gave no JSON (exit ${r.status}): ${(r.stderr ?? '').trim().slice(0, 200)}` }, costUsd: 0, seconds: 0 }
  }
  const verdict: Verdict = !out.is_error && out.structured_output ? out.structured_output : { status: 'failed', summary: `agent error: ${String(out.result).slice(0, 200)}` }
  return { verdict, costUsd: out.total_cost_usd ?? 0, seconds: Math.round((out.duration_ms ?? 0) / 1000) }
}
