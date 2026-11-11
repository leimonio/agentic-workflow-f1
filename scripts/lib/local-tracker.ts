// Local adapter: one JSON file per item in .agent/items/. Handoffs go next to it, and the latest also to .agent/handoff.md.
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderHandoff, type Item, type Tracker } from './tracker.ts'

export function localTracker(dir = '.agent/items'): Tracker {
  const file = (id: string) => join(dir, `${id}.json`)
  const read = (id: string): Item => {
    if (!existsSync(file(id))) throw new Error(`No item ${id} in ${dir}`)
    return JSON.parse(readFileSync(file(id), 'utf8'))
  }
  const write = (item: Item) => {
    mkdirSync(dir, { recursive: true })
    writeFileSync(file(item.id), JSON.stringify(item, null, 2) + '\n')
  }
  return {
    async list() {
      if (!existsSync(dir)) return []
      return readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => read(f.slice(0, -5)))
    },
    async get(id) {
      return read(id)
    },
    async create(fields) {
      const base = fields.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'item'
      let id = base
      for (let n = 2; existsSync(file(id)); n++) id = `${base}-${n}`
      write({ ...fields, id })
      return id
    },
    async update(id, fields) {
      const item = existsSync(file(id)) ? read(id) : ({ id } as Item)
      write({ ...item, ...fields, id })
    },
    async log(id, line) {
      mkdirSync(dir, { recursive: true })
      appendFileSync(join(dir, `${id}.log`), line + '\n')
    },
    async handoff(id, record) {
      const md = `# Needs human: ${read(id).title}\n\n${renderHandoff(record)}`
      writeFileSync(join(dir, `${id}.handoff.md`), md)
      writeFileSync(join(dir, '..', 'handoff.md'), md)
      write({ ...read(id), needsHuman: record.question })
    },
  }
}
