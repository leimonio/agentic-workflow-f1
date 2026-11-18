// Runs the gate and baseline scripts for the loops. Same commands the agent is told to run.
import { spawnSync } from 'node:child_process'

// cwd: the item's worktree when dispatch or babysit run the loop there; else this checkout.
export const runBaseline = (cwd?: string) => {
  if (spawnSync('npx', ['tsx', 'scripts/baseline.ts'], { cwd, stdio: 'ignore' }).status === 2) throw new Error('baseline failed')
}

export const runGate = (cwd?: string) => {
  const r = spawnSync('npx', ['tsx', 'scripts/gate.ts', '--json'], { cwd, encoding: 'utf8' })
  if (r.status === 2) throw new Error('gate: no baseline')
  const out = JSON.parse(r.stdout) as { ok: boolean; newFailures: { id: string; message: string }[] }
  return { pass: out.ok, newFailures: out.newFailures.map((f) => f.id), messages: out.newFailures.map((f) => `${f.id}: ${f.message}`) }
}
