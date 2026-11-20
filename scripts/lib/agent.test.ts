import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { missingSkill, TOOLS } from './agent.ts'

describe('project skills', () => {
  const dir = mkdtempSync(join(tmpdir(), 'skills-'))
  mkdirSync(join(dir, 'plan-tasks'))
  writeFileSync(join(dir, 'plan-tasks', 'SKILL.md'), '# plan-tasks')

  it('finds a skill the project has', () => expect(missingSkill('plan-tasks', 3, dir)).toBeUndefined())

  it('names the step to write a missing skill in', () => {
    expect(missingSkill('babysit', 4, dir)).toMatch(/babysit skill is missing .*workshop step 4/)
  })
})

describe('agent tools', () => {
  // A Bash(...) rule allows any command starting with its text before the *.
  const allows = (cmd: string) => TOOLS.some((t) => t.startsWith('Bash(') && cmd.startsWith(t.slice(5, -2)))

  it('allows the checks', () => {
    for (const c of ['npm run -s gate -- --json', 'npm run verify', 'npm run format', 'npm run lint']) expect(allows(c), c).toBe(true)
  })

  it('never allows the tracker or the merge', () => {
    for (const c of ['npm run item -- review 1 approved', 'npm run -s merge -- 1', 'npm run dispatch', 'git push']) expect(allows(c), c).toBe(false)
  })
})
