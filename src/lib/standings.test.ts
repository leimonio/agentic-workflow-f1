import { describe, expect, it } from 'vitest'
import { season } from '@/data/season'
import type { Race, ResultRow } from '@/data/types'
import { constructorStandings, driverStandings } from './standings'

const row = (driverId: string, constructorId: string, position: number, points: number): ResultRow => ({
  position, driverId, constructorId, grid: position, laps: 50, status: 'Finished', points,
})
const race = (round: number, results: ResultRow[], sprint?: ResultRow[]): Race => ({
  round, name: `R${round}`, date: '2025-01-01', circuit: 'c', locality: 'l', country: 'x', results, ...(sprint ? { sprint } : {}),
})

describe('standings', () => {
  it('sums race and sprint points', () => {
    const s = driverStandings([race(1, [row('a', 'x', 1, 25)], [row('b', 'y', 1, 8)]), race(2, [row('b', 'y', 1, 25)])])
    expect(s.map((r) => [r.id, r.points])).toEqual([['b', 33], ['a', 25]])
  })

  it('breaks ties on wins, and sprint wins do not count as wins', () => {
    const s = driverStandings([
      race(1, [row('a', 'x', 1, 25), row('b', 'y', 2, 18)]),
      race(2, [row('b', 'y', 3, 15), row('a', 'x', 4, 12)], [row('b', 'y', 1, 4)]),
    ])
    expect(s[0]).toMatchObject({ id: 'a', points: 37, wins: 1 })
    expect(s[1]).toMatchObject({ id: 'b', points: 37, wins: 0 })
  })

  it('falls back to countback when points and wins tie', () => {
    const s = driverStandings([race(1, [row('a', 'x', 2, 10), row('b', 'y', 3, 10)])])
    expect(s.map((r) => r.id)).toEqual(['a', 'b'])
  })

  it('matches the real 2025 final standings from the snapshot', () => {
    const d = driverStandings(season.races)
    expect(d.slice(0, 3).map((r) => [r.id, r.points])).toEqual([['norris', 423], ['max_verstappen', 421], ['piastri', 410]])
    expect(constructorStandings(season.races)[0]).toMatchObject({ id: 'mclaren', points: 833 })
  })
})
