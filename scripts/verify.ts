// Deterministic: runs the five checks and writes .agent/verify.json. No model involved.
import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { flag, option } from './lib/args.ts'
import { parseEslint, parsePlaywright, parseTsc, parseVitest } from './lib/parsers.ts'
import type { Check, Result } from './lib/types.ts'

const root = path.resolve(option('cwd') ?? process.cwd())
const run = (cmd: string, args: string[]) =>
  spawnSync(cmd, args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: { ...process.env, CI: process.env.CI ?? '1' } })

// A tool that crashes (no parseable output) is a single failure, never a silent pass.
const guard = (check: Check, parse: () => Result[]): Result[] => {
  try {
    return parse()
  } catch (e) {
    return [{ check, id: `${check}:crashed`, status: 'fail', message: `could not read ${check} output: ${(e as Error).message}` }]
  }
}
const vitest = (project: 'unit' | 'stories') => () => {
  const file = path.join(root, `.agent/vitest-${project}.json`)
  rmSync(file, { force: true })
  run('npx', ['vitest', 'run', '--project', project === 'unit' ? 'unit' : 'storybook', '--reporter=json', `--outputFile.json=${file}`])
  return guard(project, () => parseVitest(readFileSync(file, 'utf8'), project, root))
}

mkdirSync(path.join(root, '.agent'), { recursive: true })
const checks: Record<Check, () => Result[]> = {
  lint: () => guard('lint', () => parseEslint(run('npx', ['eslint', '.', '-f', 'json']).stdout, root)),
  types: () => guard('types', () => parseTsc(run('npx', ['tsc', '--noEmit', '--pretty', 'false']).stdout)),
  unit: vitest('unit'),
  stories: vitest('stories'),
  e2e: () => {
    run('npx', ['playwright', 'test'])
    return guard('e2e', () => parsePlaywright(readFileSync(path.join(root, 'test-results/e2e.json'), 'utf8')))
  },
}

const results: Result[] = []
for (const name of Object.keys(checks) as Check[]) {
  if (!flag('json')) process.stderr.write(`verify: ${name}...\n`)
  results.push(...checks[name]())
}

// In a baseline worktree we write next to the code under test; --out redirects it.
const outFile = path.resolve(option('out') ?? path.join(root, '.agent/verify.json'))
mkdirSync(path.dirname(outFile), { recursive: true })
writeFileSync(outFile, JSON.stringify(results, null, 2) + '\n')

const failed = results.filter((r) => r.status === 'fail')
if (flag('json')) console.log(JSON.stringify({ ok: failed.length === 0, passed: results.length - failed.length, failed: failed.length, results }, null, 2))
else {
  for (const f of failed) console.log(`FAIL ${f.id}\n     ${f.message}`)
  console.log(`verify: ${results.length - failed.length} passed, ${failed.length} failed -> .agent/verify.json`)
}
process.exit(failed.length ? 1 : 0)
