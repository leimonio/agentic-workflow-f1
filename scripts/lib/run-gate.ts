// Runs the gate and baseline scripts for the loops. Same commands the agent is told to run.
import { spawnSync } from 'node:child_process'

export const runBaseline = () => {
  if (spawnSync('npx', ['tsx', 'scripts/baseline.ts'], { stdio: 'ignore' }).status === 2) throw new Error('baseline failed')
}

export const runGate = () => {
  const r = spawnSync('npx', ['tsx', 'scripts/gate.ts', '--json'], { encoding: 'utf8' })
  if (r.status === 2) throw new Error('gate: no baseline')
  const out = JSON.parse(r.stdout) as { ok: boolean; newFailures: { id: string; message: string }[] }
  return { pass: out.ok, newFailures: out.newFailures.map((f) => f.id), messages: out.newFailures.map((f) => `${f.id}: ${f.message}`) }
}
