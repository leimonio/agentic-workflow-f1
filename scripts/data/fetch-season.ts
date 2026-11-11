// Run once by the workshop author: npm run data:fetch
// The app and the tests read only src/data/season-2025.json and never touch the network.
import { writeFileSync } from 'node:fs'
import type { Constructor, Driver, Race, ResultRow, Season } from '../../src/data/types.ts'

const BASE = 'https://api.jolpi.ca/ergast/f1/2025'
const COLORS: Record<string, string> = {
  mclaren: '#FF8000', ferrari: '#E8002D', mercedes: '#27F4D2', red_bull: '#3671C6',
  williams: '#64C4FF', rb: '#6692FF', aston_martin: '#229971', haas: '#B6BABD',
  sauber: '#52E252', alpine: '#FF87BC',
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function get(path: string, offset = 0): Promise<any> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(`${BASE}/${path}.json?limit=100&offset=${offset}`)
    if (res.ok) return (await res.json()).MRData
    await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt)) // Jolpica rate-limits: back off
  }
  throw new Error(`Jolpica failed for ${path}`)
}

async function all(path: string, pick: (table: any) => any[]): Promise<any[]> {
  const out: any[] = []
  for (let offset = 0; ; offset += 100) {
    const data = await get(path, offset)
    out.push(...pick(data))
    if (offset + 100 >= Number(data.total)) return out
    await new Promise((r) => setTimeout(r, 400))
  }
}

const row = (r: any): ResultRow => ({
  position: Number(r.position),
  driverId: r.Driver.driverId,
  constructorId: r.Constructor.constructorId,
  grid: Number(r.grid),
  laps: Number(r.laps),
  status: r.status,
  points: Number(r.points),
  ...(r.Time?.time ? { time: r.Time.time } : {}),
})

// Results are paged by result row, so races can be split across pages: merge by round.
function merge(rows: any[], key: 'Results' | 'SprintResults'): Map<number, any[]> {
  const byRound = new Map<number, any[]>()
  for (const race of rows) {
    const list = byRound.get(Number(race.round)) ?? []
    list.push(...race[key])
    byRound.set(Number(race.round), list)
  }
  return byRound
}

const schedule = await all('races', (d) => d.RaceTable.Races)
const results = merge(await all('results', (d) => d.RaceTable.Races), 'Results')
const sprints = merge(await all('sprint', (d) => d.RaceTable.Races), 'SprintResults')
const drivers: Driver[] = (await all('drivers', (d) => d.DriverTable.Drivers)).map((d) => ({
  id: d.driverId, code: d.code, number: d.permanentNumber ?? '',
  givenName: d.givenName, familyName: d.familyName, nationality: d.nationality,
}))
const constructors: Constructor[] = (await all('constructors', (d) => d.ConstructorTable.Constructors)).map((c) => ({
  id: c.constructorId, name: c.name, nationality: c.nationality, color: COLORS[c.constructorId] ?? '#888888',
}))

const races: Race[] = schedule.map((r) => ({
  round: Number(r.round),
  name: r.raceName,
  date: r.date,
  ...(r.time ? { time: r.time } : {}),
  circuit: r.Circuit.circuitName,
  locality: r.Circuit.Location.locality,
  country: r.Circuit.Location.country,
  results: (results.get(Number(r.round)) ?? []).map(row),
  ...(sprints.has(Number(r.round)) ? { sprint: sprints.get(Number(r.round))!.map(row) } : {}),
}))

const season: Season = { season: 2025, fetchedAt: new Date().toISOString(), races, drivers, constructors }
writeFileSync(new URL('../../src/data/season-2025.json', import.meta.url), JSON.stringify(season, null, 1) + '\n')
console.log(`races=${races.length} drivers=${drivers.length} constructors=${constructors.length}`)
