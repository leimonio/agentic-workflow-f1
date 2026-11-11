export type Check = 'lint' | 'types' | 'unit' | 'stories' | 'e2e'
export interface Result {
  check: Check
  /** Stable per test, or per lint rule/type error plus file. Never contains line numbers. */
  id: string
  status: 'pass' | 'fail'
  message: string
}
