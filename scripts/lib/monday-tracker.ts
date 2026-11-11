// monday adapter: the same Item fields, stored in the columns from board-columns.ts.
import { fromColumnValues, LOG_COLUMN, toColumnValues } from './board-columns.ts'
import { boardConfig, gql } from './monday.ts'
import { renderHandoff, type Item, type Tracker } from './tracker.ts'

interface RawItem {
  id: string
  name: string
  column_values: { id: string; text: string | null; value: string | null }[]
}
const ITEM_FIELDS = 'id name column_values { id text value }'
const toItem = (r: RawItem): Item => ({ type: 'Task', description: '', ...fromColumnValues(r.column_values), id: r.id, title: r.name })

export function mondayTracker(): Tracker {
  const { boardId, groups } = boardConfig()
  const raw = async (id: string) => {
    const d = await gql<{ items: RawItem[] }>(`query ($ids: [ID!]) { items(ids: $ids) { ${ITEM_FIELDS} } }`, { ids: [id] })
    if (!d.items[0]) throw new Error(`No item ${id} on board ${boardId}`)
    return d.items[0]
  }
  const write = (id: string, values: Record<string, unknown>) =>
    gql(
      `mutation ($b: ID!, $i: ID!, $v: JSON!) { change_multiple_column_values(board_id: $b, item_id: $i, column_values: $v, create_labels_if_missing: true) { id } }`,
      { b: boardId, i: id, v: JSON.stringify(values) },
    )
  return {
    async list() {
      // shortcut: first 500 items only, page with the cursor when a board grows past that.
      const d = await gql<{ boards: { items_page: { items: RawItem[] } }[] }>(`query ($b: [ID!]) { boards(ids: $b) { items_page(limit: 500) { items { ${ITEM_FIELDS} } } } }`, { b: [boardId] })
      return (d.boards[0]?.items_page.items ?? []).map(toItem)
    },
    async get(id) {
      return toItem(await raw(id))
    },
    async create(fields) {
      const { title, ...rest } = fields
      const d = await gql<{ create_item: { id: string } }>(
        `mutation ($b: ID!, $g: String, $n: String!, $v: JSON) { create_item(board_id: $b, group_id: $g, item_name: $n, column_values: $v, create_labels_if_missing: true) { id } }`,
        { b: boardId, g: fields.type === 'Idea' ? groups.Ideas : groups.Tasks, n: title, v: JSON.stringify(toColumnValues(rest)) },
      )
      return d.create_item.id
    },
    async update(id, fields) {
      const { title, ...rest } = fields
      const values: Record<string, unknown> = toColumnValues(rest)
      if (title) values.name = title
      if (Object.keys(values).length) await write(id, values)
    },
    async log(id, line) {
      const prev = (await raw(id)).column_values.find((c) => c.id === LOG_COLUMN.id)?.text ?? ''
      await write(id, { [LOG_COLUMN.id]: { text: prev ? `${prev}\n${line}` : line } })
    },
    async handoff(id, record) {
      await write(id, toColumnValues({ needsHuman: record.question }))
      await gql(`mutation ($i: ID!, $body: String!) { create_update(item_id: $i, body: $body) { id } }`, {
        i: id,
        body: `<h3>Needs human</h3><pre>${renderHandoff(record).replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[ch] ?? ch)}</pre>`,
      })
    },
  }
}
