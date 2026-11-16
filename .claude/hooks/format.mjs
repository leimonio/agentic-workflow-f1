// PostToolUse hook: Prettier-format the file Claude just edited. Input is the hook JSON on stdin.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const file = JSON.parse(readFileSync(0, 'utf8')).tool_input?.file_path
// --ignore-unknown skips files Prettier has no parser for; .prettierignore still applies.
if (file) execFileSync('npx', ['prettier', '--write', '--ignore-unknown', '--log-level', 'warn', file], { stdio: 'inherit' })
