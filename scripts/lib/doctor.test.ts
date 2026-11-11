import { describe, expect, it } from 'vitest'
import { nodeFinding, repoFindings, type RepoFacts } from './doctor.ts'

const good: RepoFacts = { slug: 'o/r', allowAutoMerge: true, actionsEnabled: true, requiredChecks: ['gate'], branch: 'main', isPrivate: false }

describe('doctor', () => {
  it('node: fails when too old, warns when not the pinned major, ok otherwise', () => {
    expect(nodeFinding('v22.1.0', 24, 26).status).toBe('fail')
    expect(nodeFinding('v24.13.1', 24, 26).status).toBe('warn')
    expect(nodeFinding('v26.13.0', 24, 26).status).toBe('ok')
  })

  it('repo: everything set is all ok with no fixes', () => {
    const f = repoFindings(good)
    expect(f.every((x) => x.status === 'ok' && !x.fix)).toBe(true)
  })

  it('repo: a fresh template repo gets a fix for each missing setting', () => {
    const f = repoFindings({ ...good, allowAutoMerge: false, actionsEnabled: false, requiredChecks: null })
    expect(f.map((x) => x.status)).toEqual(['fail', 'fail', 'fail'])
    expect(f.map((x) => x.fix)).toEqual([
      expect.stringContaining('actions/permissions'),
      expect.stringContaining('allow_auto_merge=true'),
      expect.stringContaining('"contexts":["gate"]'),
    ])
  })

  it('repo: keeps other required checks when adding gate', () => {
    const f = repoFindings({ ...good, requiredChecks: ['lint'] })
    expect(f[2]?.fix).toContain('"contexts":["lint","gate"]')
  })

  it('explains the GitHub Free limit on private repos', () => {
    const f = repoFindings({ ...good, isPrivate: true, allowAutoMerge: false, requiredChecks: null })
    expect(f.filter((x) => x.message.includes('private repo'))).toHaveLength(2)
    expect(repoFindings({ ...good, isPrivate: true }).every((x) => !x.message.includes('private repo'))).toBe(true)
  })
})
