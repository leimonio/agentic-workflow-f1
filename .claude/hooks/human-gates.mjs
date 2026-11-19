// PreToolUse(Bash): the human gates are the human's. Blocks `npm run item -- approve|review|visual` from Claude.
let input = ''
for await (const chunk of process.stdin) input += chunk
const command = JSON.parse(input).tool_input?.command ?? ''
if (/\bitem\b.*\b(approve|review|visual)\b/.test(command)) {
  console.error('Human gate: print this command for the human to run, do not run it yourself.')
  process.exit(2)
}
