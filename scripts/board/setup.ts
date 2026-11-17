// Idempotent: creates the board (once), the groups and the columns that are missing, and recolours status labels by meaning.
// A second run changes nothing.
//   npm run board:setup                  create a new board, or reuse the one in .agent/board.json
//   npm run board:setup -- --adopt <id>  use an existing board (for example a duplicated template)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { option } from '../lib/args.ts'
import { COLOR_ID, COLUMNS, GROUPS, LOG_COLUMN, labelColor } from '../lib/board-columns.ts'
import { BOARD_FILE, gql, type BoardConfig } from '../lib/monday.ts'

const created: string[] = []

let boardId = option('adopt') ?? (existsSync(BOARD_FILE) ? (JSON.parse(readFileSync(BOARD_FILE, 'utf8')) as BoardConfig).boardId : undefined)
if (!boardId) {
  const d = await gql<{ create_board: { id: string } }>(
    `mutation { create_board(board_name: "F1 workshop: agent board", board_kind: private, empty: true) { id } }`,
  )
  boardId = d.create_board.id
  created.push(`board ${boardId}`)
}

type Col = { id: string; title: string; revision: string; settings: { labels?: { id: number; label: string; index: number; color: number }[] } | null }
const q = await gql<{ boards: { name: string; url: string; groups: { id: string; title: string }[]; columns: Col[] }[] }>(
  `query ($b: [ID!]) { boards(ids: $b) { name url groups { id title } columns { id title revision settings } } }`,
  { b: [boardId] },
)
const board = q.boards[0]
if (!board) throw new Error(`Board ${boardId} not found or not visible to this token`)

const groups = {} as BoardConfig['groups']
for (const title of GROUPS) {
  let g = board.groups.find((x) => x.title === title)
  if (!g) {
    const d = await gql<{ create_group: { id: string } }>(`mutation ($b: ID!, $n: String!) { create_group(board_id: $b, group_name: $n) { id } }`, {
      b: boardId,
      n: title,
    })
    g = { id: d.create_group.id, title }
    created.push(`group ${title}`)
  }
  groups[title] = g.id
}

for (const c of [...COLUMNS, LOG_COLUMN]) {
  const existing = board.columns.find((x) => x.id === c.id)
  if (existing) {
    // Older boards were coloured by label position (Failed came out green). Fix only labels whose colour is wrong.
    const labels = (existing.settings?.labels ?? []).filter((l) => l.label)
    if (labels.some((l) => COLOR_ID[labelColor(l.label)] !== l.color)) {
      await gql(
        `mutation ($b: ID!, $id: String!, $r: String!, $s: UpdateStatusColumnSettingsInput!) { update_status_column(board_id: $b, id: $id, revision: $r, settings: $s) { id } }`,
        {
          b: boardId,
          id: c.id,
          r: existing.revision,
          s: { labels: labels.map((l) => ({ id: l.id, label: l.label, index: l.index, color: labelColor(l.label) })) },
        },
      )
      created.push(`colours ${c.title}`)
    }
    continue
  }
  const labels = 'labels' in c && c.labels ? c.labels : undefined
  // Writes also pass create_labels_if_missing, so a label that did not get created here still works.
  const defaults = labels ? { settings: { labels: labels.map((label, index) => ({ label, index, color: labelColor(label) })) } } : undefined
  await gql(
    `mutation ($b: ID!, $t: String!, $ty: ColumnType!, $id: String, $d: JSON) { create_column(board_id: $b, title: $t, column_type: $ty, id: $id, defaults: $d) { id } }`,
    {
      b: boardId,
      t: c.title,
      ty: c.type,
      id: c.id,
      d: defaults ? JSON.stringify(defaults) : undefined,
    },
  )
  created.push(`column ${c.title}`)
}

mkdirSync('.agent', { recursive: true })
writeFileSync(BOARD_FILE, JSON.stringify({ boardId, groups } satisfies BoardConfig, null, 2) + '\n')
console.log(created.length ? `board:setup changed ${created.length}: ${created.join(', ')}` : `board:setup: board ${boardId} already complete, nothing changed`)
console.log(`Board: ${board.name} ${board.url}`)
console.log(`Wrote ${BOARD_FILE}. Use it with AGENT_TRACKER=monday.`)
