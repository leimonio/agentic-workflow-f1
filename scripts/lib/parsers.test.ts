import { describe, expect, it } from 'vitest'
import { parseEslint, parsePlaywright, parseTsc, parseVitest } from './parsers.ts'

describe('parsers', () => {
  it('eslint: one failure per message, ids stable without line numbers', () => {
    const json = JSON.stringify([
      { filePath: '/repo/src/a.ts', messages: [{ ruleId: 'no-unused-vars', message: 'x unused', line: 3 }] },
      { filePath: '/repo/src/b.ts', messages: [] },
    ])
    expect(parseEslint(json, '/repo')).toEqual([
      { check: 'lint', id: 'lint:no-unused-vars:src/a.ts', status: 'fail', message: 'x unused' },
    ])
  })

  it('tsc: parses errors and disambiguates repeated ones in one file', () => {
    const out = ['src/a.ts(3,5): error TS2322: bad', 'src/a.ts(9,1): error TS2322: bad again', 'noise'].join('\n')
    expect(parseTsc(out).map((r) => r.id)).toEqual(['types:TS2322:src/a.ts', 'types:TS2322:src/a.ts#2'])
  })

  it('vitest: passes and failures, with root-relative file ids', () => {
    const json = JSON.stringify({
      testResults: [{ name: '/repo/src/x.test.ts', assertionResults: [
        { fullName: 'x works', status: 'passed' },
        { fullName: 'x breaks', status: 'failed', failureMessages: ['AssertionError: nope\n at ...'] },
      ] }],
    })
    expect(parseVitest(json, 'unit', '/repo')).toEqual([
      { check: 'unit', id: 'unit:src/x.test.ts::x works', status: 'pass', message: '' },
      { check: 'unit', id: 'unit:src/x.test.ts::x breaks', status: 'fail', message: 'AssertionError: nope' },
    ])
  })

  it('playwright: walks nested suites', () => {
    const json = JSON.stringify({ suites: [{ title: 'f', suites: [{ title: 'inner', specs: [
      { title: 'ok test', file: 'site.spec.ts', ok: true, tests: [] },
      { title: 'bad test', file: 'site.spec.ts', ok: false, tests: [{ results: [{ error: { message: 'timeout\nmore' } }] }] },
    ] }] }] })
    expect(parsePlaywright(json).map((r) => [r.id, r.status, r.message])).toEqual([
      ['e2e:site.spec.ts::ok test', 'pass', ''],
      ['e2e:site.spec.ts::bad test', 'fail', 'timeout'],
    ])
  })

  it('a garbage input throws, so verify can report a crash instead of a pass', () => {
    expect(() => parseEslint('not json', '/')).toThrow()
  })
})
