// One babysit tick for one task PR. The script owns the rounds, the reply limit, the CI wait,
// every GitHub post and every tracker write. The agent triages a thread or fixes, and drafts replies.
//   npm run babysit -- <item-id>
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { runAgent, type Verdict } from './lib/agent.ts'
import { fetchPr, replyToThread, resolveThread } from './lib/github.ts'
import { MAX_FIX_ROUNDS, verifyAction, type Thread } from './lib/pr.ts'
import { runBaseline, runGate } from './lib/run-gate.ts'
import { logLine } from './lib/tracker.ts'
import { trackerFromEnv } from './lib/tracker-from-env.ts'

interface Triage extends Verdict { verdict: 'necessary' | 'discussion'; evidence: string; reply: string }
interface State { rounds: number; ciPendingSince?: string; triaged: Record<string, Triage>; replied: string[] }

const TRIAGE_SCHEMA = {
  type: 'object',
  properties: {
    status: { enum: ['ok'] },
    summary: { type: 'string' },
    verdict: { enum: ['necessary', 'discussion'] },
    evidence: { type: 'string', description: 'file:line, failing test, acceptance criterion or repo rule. Empty for discussion.' },
    reply: { type: 'string', description: 'The reply to post (necessary) or the draft for the human (discussion).' },
  },
  required: ['status', 'summary', 'verdict', 'evidence', 'reply'],
}

const id = process.argv[2] ?? ''
if (!id) {
  console.error('usage: npm run babysit -- <item-id>')
  process.exit(2)
}
const tracker = trackerFromEnv()
const item = await tracker.get(id)
if (!item.pr) throw new Error(`${id} has no PR`)
const say = (s: string) => console.log(`[babysit ${id}] ${s}`)
const git = (...a: string[]) => execFileSync('git', a, { encoding: 'utf8' }).trim()
// Read now: the PR branch may not have the skill (it was cut before the skill was written).
const SKILL = readFileSync('.claude/skills/babysit/SKILL.md', 'utf8')
// shortcut: babysit state lives in .agent/ even with the monday tracker; move it to columns if several machines babysit.
const stateFile = `.agent/babysit/${id}.json`
const state: State = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, 'utf8')) : { rounds: 0, triaged: {}, replied: [] }
const save = () => (mkdirSync('.agent/babysit', { recursive: true }), writeFileSync(stateFile, JSON.stringify(state, null, 2) + '\n'))
const tri = (t: Thread) => state.triaged[t.id]

let pr = fetchPr(item.pr)
if (pr.state === 'MERGED') {
  await tracker.update(id, { merge: 'Merged' })
  process.exit(0)
}
await tracker.update(id, { ci: pr.ci, openThreads: pr.unresolved, ...(pr.visual !== 'not-run' && { visual: pr.visual }) })

// Triage: one read-only agent call per new unresolved thread, never repeated.
for (const t of pr.threads.filter((t) => !t.resolved && !state.triaged[t.id])) {
  say(`triage ${t.path}:${t.line ?? '?'} (${t.author})`)
  const v = runAgent<Triage>(`${SKILL}\n\nMODE: triage\nPR: ${pr.url}\nTask acceptance:\n${item.planDetails ?? item.description}\n\nThread on ${t.path}:${t.line ?? '?'}:\n${t.body}`, {
    schema: TRIAGE_SCHEMA,
    tools: ['Read', 'Glob', 'Grep', 'Bash(gh pr diff *)'],
    budgetUsd: 0.5,
  }).verdict
  if (v.status !== 'ok' || !v.verdict) {
    say(`  → triage failed, retried next tick: ${v.summary}`)
    continue
  }
  state.triaged[t.id] = v
  say(`  → ${v.verdict}: ${v.summary}`)
  save()
}

const open = pr.threads.filter((t) => !t.resolved)
const necessary = open.filter((t) => tri(t)?.verdict === 'necessary' && !state.replied.includes(t.id))
const discussions = open.filter((t) => tri(t)?.verdict === 'discussion')
if (pr.ci === 'Pending') state.ciPendingSince ??= new Date().toISOString()
else delete state.ciPendingSince
save()
const ciWaitMin = state.ciPendingSince ? (Date.now() - Date.parse(state.ciPendingSince)) / 60_000 : 0
const untriaged = open.filter((t) => !tri(t)).length
const action = verifyAction({ ci: pr.ci, untriaged, necessary: necessary.length, discussions: discussions.length, rounds: state.rounds, ciWaitMin })
say(`CI ${pr.ci}, ${necessary.length} to fix, ${untriaged} untriaged, ${discussions.length} for a human, round ${state.rounds}/${MAX_FIX_ROUNDS} → ${action.do}`)

if (action.do === 'wait') await tracker.update(id, { verify: 'Watching' })
else if (action.do === 'stable') {
  await tracker.update(id, { verify: 'Stable green' })
  await tracker.log(id, logLine('Verify', 'Stable green'))
} else if (action.do === 'escalate') {
  await tracker.update(id, { verify: 'Needs human' })
  await tracker.handoff(id, {
    stage: 'Verify',
    attempts: state.rounds,
    failing: [...(pr.ci === 'Failing' ? pr.checks.filter((c) => c.state === 'failure').map((c) => `check ${c.name}`) : []), ...discussions.map((t) => `${t.url}`)],
    tried: [`${state.rounds} fix round(s)`, ...discussions.map((t) => `Drafted reply for ${t.path}:${t.line ?? '?'}: "${tri(t)?.reply}"`)],
    question: action.why + '. Post or edit the drafted replies and resolve the threads, or say what to change.',
    resume: `Resolve the threads on GitHub, then \`npm run item -- reset ${id} verify\` (or set Verify = Watching on the board).`,
  })
  await tracker.log(id, logLine('Verify', `Needs human: ${action.why}`))
  say(`escalated: ${action.why}`)
} else {
  await fix(necessary)
}

async function fix(threads: Thread[]) {
  if (git('status', '--porcelain')) return say('skipped fix: the working tree is not clean')
  state.rounds++
  save()
  await tracker.update(id, { verify: 'Fixing', ci: pr.ci === 'Failing' ? 'Fixing' : pr.ci })
  const back = git('branch', '--show-current')
  git('fetch', '-q', 'origin', pr.head)
  git('switch', '-C', pr.head, `origin/${pr.head}`)
  try {
    runBaseline()
    const failing = pr.ci === 'Failing' ? pr.checks.filter((c) => c.state === 'failure').map((c) => c.name) : []
    const prompt = [
      `${SKILL}\n\nMODE: fix (round ${state.rounds} of ${MAX_FIX_ROUNDS}, script-owned; run \`npm run -s gate -- --json\` before you answer)`,
      `Task acceptance:\n${item.planDetails ?? item.description}`,
      ...threads.map((t) => `Thread ${t.path}:${t.line ?? '?'}:\n${t.body}\nTriage evidence: ${tri(t)?.evidence}`),
      ...(failing.length ? [`Failing CI checks: ${failing.join(', ')}. Reproduce with npm run gate.`] : []),
    ].join('\n\n')
    const v = runAgent(prompt, { budgetUsd: 1.5 }).verdict
    say(`agent: ${v.status} · ${v.summary}`)
    const first = runGate()
    const stable = first.pass && runGate().pass
    if (!stable || !git('status', '--porcelain')) {
      await tracker.log(id, logLine('Verify', `fix round ${state.rounds}: ${stable ? 'no change' : `gate FAIL ${first.newFailures.join(', ')}`}`))
      return say(`round ${state.rounds} did not land (${stable ? 'no change' : 'gate failed'}); next tick decides`)
    }
    git('add', '-A')
    git('commit', '-q', '-m', `Address review: ${threads.map((t) => `${t.path}:${t.line ?? '?'}`).join(', ') || 'red CI'}\n\nbabysit round ${state.rounds} for ${id}`)
    git('push', '-q', 'origin', pr.head)
    const sha = git('rev-parse', '--short', 'HEAD')
    for (const t of threads) {
      replyToThread(t.id, `${tri(t)?.reply}\n\nFixed in ${sha}. \`gate\`: PASS twice, 0 new failures.`)
      resolveThread(t.id)
      state.replied.push(t.id)
    }
    save()
    await tracker.log(id, logLine('Verify', `fix round ${state.rounds}: pushed ${sha}, resolved ${threads.length} thread(s)`))
    pr = fetchPr(item.pr!)
    await tracker.update(id, { verify: 'Watching', openThreads: pr.unresolved, ci: 'Pending' })
    say(`pushed ${sha}; resolved ${threads.length} thread(s)`)
  } finally {
    git('switch', '-q', back)
  }
}
