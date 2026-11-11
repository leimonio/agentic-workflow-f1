// Deterministic: runs verify on the merge base and saves .agent/baseline.json.
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { flag, option } from './lib/args.ts'

const git = (...a: string[]) => execFileSync('git', a, { encoding: 'utf8' }).trim()
const hasRef = (ref: string) => spawnSync('git', ['rev-parse', '--verify', '-q', ref]).status === 0
const baseRef = option('base') ?? (hasRef('origin/main') ? 'origin/main' : 'main')
const mergeBase = git('merge-base', 'HEAD', baseRef)
const out = path.resolve('.agent/baseline.json')

// Always a clean worktree: the working tree may hold uncommitted edits that must not leak into the baseline.
const tmp = mkdtempSync(path.join(tmpdir(), 'baseline-'))
git('worktree', 'add', '--detach', tmp, mergeBase)
symlinkSync(path.resolve('node_modules'), path.join(tmp, 'node_modules'))
const cwd = tmp
try {
  if (!flag('json')) console.error(`baseline: ${baseRef} @ ${mergeBase.slice(0, 7)}`)
  spawnSync('npx', ['tsx', path.resolve('scripts/verify.ts'), '--cwd', cwd, '--out', out, '--json'], { stdio: ['ignore', 'ignore', 'inherit'] })
  if (!existsSync(out)) throw new Error('verify did not write a baseline')
} finally {
  git('worktree', 'remove', '--force', tmp)
  rmSync(tmp, { recursive: true, force: true })
}
if (flag('json')) console.log(JSON.stringify({ baseRef, mergeBase, file: '.agent/baseline.json' }))
else console.log('baseline: saved .agent/baseline.json')
