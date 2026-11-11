import type { Race, ResultRow } from '@/data/types'

export interface StandingRow {
  position: number
  id: string
  points: number
  wins: number
}

// Pure: race results (incl. sprints) in, ranked rows out.
// Order: points, then wins, then count of 2nd places, 3rd places, ... (FIA countback).
function rank(rows: { key: string; row: ResultRow }[]): StandingRow[] {
  const acc = new Map<string, { points: number; finishes: number[] }>()
  for (const { key, row } of rows) {
    const a = acc.get(key) ?? { points: 0, finishes: Array(25).fill(0) }
    a.points += row.points
    if (row.position >= 1 && row.position <= 24) a.finishes[row.position]!++
    acc.set(key, a)
  }
  const sorted = [...acc.entries()].sort(([, a], [, b]) => {
    if (b.points !== a.points) return b.points - a.points
    for (let p = 1; p <= 24; p++) if (b.finishes[p] !== a.finishes[p]) return b.finishes[p]! - a.finishes[p]!
    return 0
  })
  return sorted.map(([id, a], i) => ({ position: i + 1, id, points: a.points, wins: a.finishes[1]! }))
}

// Points count from both race and sprint; wins and countback only from the Grand Prix itself.
const flatten = (races: Race[], by: (r: ResultRow) => string) =>
  races.flatMap((race) => [
    ...race.results.map((row) => ({ key: by(row), row })),
    ...(race.sprint ?? []).map((row) => ({ key: by(row), row: { ...row, position: 0 } })),
  ])

export const driverStandings = (races: Race[]): StandingRow[] => rank(flatten(races, (r) => r.driverId))

export const constructorStandings = (races: Race[]): StandingRow[] => rank(flatten(races, (r) => r.constructorId))
