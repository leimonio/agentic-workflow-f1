// The only place that talks to monday: one GraphQL POST with the token from .env.
import { existsSync, readFileSync } from 'node:fs'

if (existsSync('.env')) process.loadEnvFile('.env')

export interface BoardConfig {
  boardId: string
  groups: Record<'Ideas' | 'Tasks' | 'Done', string>
}
export const BOARD_FILE = '.agent/board.json'
export const boardConfig = (): BoardConfig => {
  if (!existsSync(BOARD_FILE)) throw new Error(`No ${BOARD_FILE}. Run \`npm run board:setup\` first.`)
  return JSON.parse(readFileSync(BOARD_FILE, 'utf8'))
}

export async function gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const token = process.env.MONDAY_API_TOKEN
  if (!token) throw new Error('MONDAY_API_TOKEN is not set (.env)')
  const res = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(30_000),
  })
  const body = (await res.json()) as { data?: T; errors?: { message: string }[]; error_message?: string }
  if (!res.ok || body.errors || body.error_message) throw new Error(`monday API: ${body.errors?.map((e) => e.message).join('; ') ?? body.error_message ?? res.status}`)
  return body.data as T
}
