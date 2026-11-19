// PreToolUse(Bash): the human gates are the human's. Blocks `npm run item -- approve|review|visual` from Claude.
import { readFileSync } from 'node:fs'
import process from 'node:process'

const command = JSON.parse(readFileSync(0, 'utf8')).tool_input?.command ?? ''
if (/\bitem\b.*\b(approve|review|visual)\b/.test(command)) {
  process.stderr.write('Human gate: print this command for the human to run, do not run it yourself.\n')
  process.exit(2)
}
