// Pure parsers: tool output in, Result[] out. No I/O, so they are unit-tested with fixtures.
import type { Check, Result } from './types.ts'

const rel = (file: string, root: string) => (file.startsWith(root) ? file.slice(root.length).replace(/^\//, '') : file)

/** `eslint -f json`: only failures are reported (a clean file is not a result). */
export function parseEslint(json: string, root: string): Result[] {
  const files = JSON.parse(json) as { filePath: string; messages: { ruleId: string | null; message: string }[] }[]
  return files.flatMap((f) =>
    f.messages.map((m) => ({
      check: 'lint' as const,
      id: `lint:${m.ruleId ?? 'parse-error'}:${rel(f.filePath, root)}`,
      status: 'fail' as const,
      message: m.message,
    })),
  )
}

/** `tsc --pretty false`: lines like `src/a.ts(3,5): error TS2322: message`. */
export function parseTsc(output: string): Result[] {
  const seen = new Map<string, number>()
  const out: Result[] = []
  for (const line of output.split('\n')) {
    const m = /^(.+?)\(\d+,\d+\): error (TS\d+): (.*)$/.exec(line)
    if (!m) continue
    const base = `types:${m[2]}:${m[1]}`
    const n = (seen.get(base) ?? 0) + 1
    seen.set(base, n)
    out.push({ check: 'types', id: n === 1 ? base : `${base}#${n}`, status: 'fail', message: m[3]! })
  }
  return out
}

/** `vitest run --reporter=json`, used for both the unit and the stories project. */
export function parseVitest(json: string, check: Check, root: string): Result[] {
  const report = JSON.parse(json) as {
    testResults: { name: string; assertionResults: { fullName: string; status: string; failureMessages?: string[] }[] }[]
  }
  return report.testResults.flatMap((file) =>
    file.assertionResults.map((t) => ({
      check,
      id: `${check}:${rel(file.name, root)}::${t.fullName}`,
      status: t.status === 'passed' ? ('pass' as const) : ('fail' as const),
      message: t.status === 'passed' ? '' : (t.failureMessages?.[0] ?? t.status).split('\n')[0]!,
    })),
  )
}

interface PwSuite { file?: string; title: string; specs?: PwSpec[]; suites?: PwSuite[] }
interface PwSpec { title: string; file: string; ok: boolean; tests: { results: { error?: { message?: string } }[] }[] }

/** Playwright `--reporter=json`. */
export function parsePlaywright(json: string): Result[] {
  const out: Result[] = []
  const walk = (s: PwSuite) => {
    for (const spec of s.specs ?? []) {
      const err = spec.tests.flatMap((t) => t.results).find((r) => r.error)?.error?.message ?? ''
      out.push({
        check: 'e2e',
        id: `e2e:${spec.file}::${spec.title}`,
        status: spec.ok ? 'pass' : 'fail',
        message: spec.ok ? '' : err.split('\n')[0]!,
      })
    }
    s.suites?.forEach(walk)
  }
  ;(JSON.parse(json) as { suites: PwSuite[] }).suites.forEach(walk)
  return out
}
