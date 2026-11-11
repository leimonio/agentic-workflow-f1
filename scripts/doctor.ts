// Deterministic setup check. `--fix` applies what can be fixed. `--json` for agents.
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { flag } from './lib/args.ts'
import { nodeFinding, repoFindings, type Finding } from './lib/doctor.ts'

const sh = (cmd: string) => spawnSync('sh', ['-c', cmd], { encoding: 'utf8' })
const ok = (cmd: string) => sh(cmd).status === 0
const gh = (args: string) => {
  const r = sh(`gh ${args}`)
  return r.status === 0 ? (r.stdout.trim() ? JSON.parse(r.stdout) : {}) : null
}
const env = (key: string) => (existsSync('.env') ? new RegExp(`^${key}=(.+)$`, 'm').exec(readFileSync('.env', 'utf8'))?.[1] : undefined)

const pinned = Number(readFileSync('.nvmrc', 'utf8').trim())
const minMajor = Number(/>=(\d+)/.exec(JSON.parse(readFileSync('package.json', 'utf8')).engines.node)?.[1])
// Launching is the only reliable test that the browser Playwright will use is installed.
const browserOk = await chromium.launch().then((b) => b.close().then(() => true), () => false)
const findings: Finding[] = [nodeFinding(process.version, minMajor, pinned)]

const tool = (id: string, cmd: string, fix: string): Finding =>
  ok(cmd) ? { id, status: 'ok', message: `${id} found` } : { id, status: 'fail', message: `${id} not found or not ready`, fix }
findings.push(
  tool('git', 'git --version', 'Install git: https://git-scm.com'),
  tool('gh', 'gh auth status', 'Run: gh auth login'),
  tool('claude', 'claude --version', 'Install Claude Code: https://claude.com/claude-code'),
  existsSync('node_modules')
    ? { id: 'deps', status: 'ok', message: 'node_modules present' }
    : { id: 'deps', status: 'fail', message: 'dependencies not installed', fix: 'npm ci' },
  browserOk
    ? { id: 'playwright', status: 'ok', message: 'Playwright Chromium installed' }
    : { id: 'playwright', status: 'fail', message: 'Playwright Chromium missing', fix: 'npx playwright install --with-deps chromium' },
  env('MONDAY_API_TOKEN')
    ? { id: 'monday-token', status: 'ok', message: 'MONDAY_API_TOKEN set' }
    : { id: 'monday-token', status: 'warn', message: 'MONDAY_API_TOKEN not set in .env (needed from step 3)' },
)

const repo = gh('repo view --json nameWithOwner,defaultBranchRef')
if (!repo) findings.push({ id: 'repo', status: 'warn', message: 'No GitHub repo for this checkout yet: repo settings not checked. Use the template, then re-run.' })
else {
  const slug: string = repo.nameWithOwner
  const branch: string = repo.defaultBranchRef.name
  const settings = gh(`api repos/${slug}`)
  const prot = gh(`api repos/${slug}/branches/${branch}/protection`)
  const actions = gh(`api repos/${slug}/actions/permissions`)
  findings.push(
    ...repoFindings({
      slug,
      branch,
      allowAutoMerge: settings?.allow_auto_merge === true,
      actionsEnabled: actions?.enabled === true,
      requiredChecks: prot ? (prot.required_status_checks?.contexts ?? []) : null,
    }),
  )
  const token = env('CHROMATIC_PROJECT_TOKEN')
  const hasSecret = ok(`gh secret list | grep -q '^CHROMATIC_PROJECT_TOKEN'`)
  findings.push(
    hasSecret
      ? { id: 'chromatic-secret', status: 'ok', message: 'CHROMATIC_PROJECT_TOKEN is a repo secret' }
      : token
        ? { id: 'chromatic-secret', status: 'fail', message: 'CHROMATIC_PROJECT_TOKEN is in .env but not a repo secret', fix: `gh secret set CHROMATIC_PROJECT_TOKEN --body '${token}'` }
        : { id: 'chromatic-secret', status: 'warn', message: 'No CHROMATIC_PROJECT_TOKEN (secret or .env): Chromatic will be skipped in CI' },
  )
}

if (flag('fix')) {
  for (const f of findings) {
    if (f.status !== 'fail' || !f.fix || /^(Run|Install)/.test(f.fix)) continue
    const r = sh(f.fix)
    if (r.status === 0) Object.assign(f, { status: 'ok', message: `${f.message} -> fixed`, fix: undefined })
    else f.message += ` (fix failed: ${r.stderr.trim().split('\n')[0]})`
  }
}

const failed = findings.some((f) => f.status === 'fail')
if (flag('json')) console.log(JSON.stringify({ ok: !failed, findings }, null, 2))
else {
  for (const f of findings) {
    const mark = { ok: '✔', warn: '!', fail: '✘' }[f.status]
    console.log(`${mark} ${f.id}: ${f.message}${f.status !== 'ok' && f.fix ? `\n    fix: ${f.fix}` : ''}`)
  }
  if (failed && !flag('fix')) console.log('\nRun `npm run doctor -- --fix` to apply the fixes that can be applied automatically.')
}
process.exit(failed ? 1 : 0)
