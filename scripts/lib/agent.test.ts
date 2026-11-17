import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { missingSkill } from './agent.ts'

describe('project skills', () => {
  const dir = mkdtempSync(join(tmpdir(), 'skills-'))
  mkdirSync(join(dir, 'plan-tasks'))
  writeFileSync(join(dir, 'plan-tasks', 'SKILL.md'), '# plan-tasks')

  it('finds a skill the project has', () => expect(missingSkill('plan-tasks', 3, dir)).toBeUndefined())

  it('names the step to write a missing skill in', () => {
    expect(missingSkill('babysit', 4, dir)).toMatch(/babysit skill is missing .*workshop\/step-4\.md/)
  })
})
