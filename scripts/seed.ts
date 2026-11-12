// Recreate the state step N needs that git cannot restore: tracker items, and for steps 4-5 the task PR.
//   git checkout step-(N-1)-solution && npm run seed -- --step N
// Safe to re-run: items are matched by title and updated; the PR branch is force-pushed and its PR reused.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { option } from './lib/args.ts'
import { SEED_BRANCH, seedItems, type Fixture, type SeedKey } from './lib/seed.ts'
import { logLine } from './lib/tracker.ts'
import { trackerFromEnv } from './lib/tracker-from-env.ts'

const step = Number(option('step'))
if (![3, 4, 5].includes(step)) {
  console.error('usage: npm run seed -- --step 3|4|5   (steps 1 and 2 need no seed: check out the branch)')
  process.exit(2)
}
const sh = (cmd: string, args: string[], cwd?: string) => execFileSync(cmd, args, { encoding: 'utf8', cwd }).trim()
const fx: Fixture = JSON.parse(readFileSync('workshop/seed/items.json', 'utf8'))

let pr = ''
if (step >= 4) {
  const base = sh('git', ['branch', '--show-current'])
  try {
    sh('git', ['ls-remote', '--exit-code', '--heads', 'origin', base])
  } catch {
    throw new Error(`${base} is not on origin. Run: git push -u origin ${base}`)
  }
  // Build the branch in a throwaway worktree, so your working tree is never touched.
  const dir = mkdtempSync(join(tmpdir(), 'seed-'))
  try {
    sh('git', ['worktree', 'add', '--detach', dir, `origin/${base}`])
    sh('git', ['apply', '--index', resolve('workshop/seed/task-pr.patch')], dir)
    sh('git', ['commit', '-m', `${fx.t2.title} (seed)`], dir)
    sh('git', ['push', '--force', 'origin', `HEAD:refs/heads/${SEED_BRANCH}`], dir)
  } finally {
    sh('git', ['worktree', 'remove', '--force', dir])
    rmSync(dir, { recursive: true, force: true })
  }
  pr = sh('gh', ['pr', 'list', '--head', SEED_BRANCH, '--state', 'open', '--json', 'url', '--jq', '.[0].url'])
  if (pr) sh('gh', ['pr', 'edit', pr, '--base', base])
  else pr = sh('gh', ['pr', 'create', '--head', SEED_BRANCH, '--base', base, '--title', fx.t2.title, '--body', `Seeded for step ${step}.\n\n${fx.t2.planDetails ?? fx.t2.description}`])
  console.log(`seed: ${SEED_BRANCH} → ${base}, ${pr}`)
}

const tracker = trackerFromEnv()
const existing = await tracker.list()
const ids: Partial<Record<SeedKey, string>> = {}
for (const s of seedItems(step, fx, pr)) {
  const links = { parent: s.parent && ids[s.parent], dependsOn: s.dependsOn?.map((k) => ids[k] ?? '') }
  // shortcut: updates only the fields the seed sets; re-seeding an EARLIER step keeps a later step's PR fields. Delete the items first.
  const fields = { needsHuman: '', ...s.fields, ...links }
  const found = existing.find((i) => i.title === s.fields.title)
  const id = found ? found.id : await tracker.create(fields)
  if (found) await tracker.update(id, fields)
  await tracker.log(id, logLine('Seed', `step ${step}`))
  ids[s.key] = id
  console.log(`seed: ${found ? 'updated' : 'created'} ${id} (${s.fields.title})`)
}
