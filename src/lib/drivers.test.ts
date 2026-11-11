import { describe, expect, it } from 'vitest'
import { season } from '@/data/season'
import type { Race, ResultRow } from '@/data/types'
import { driverProfile, teamOf } from './drivers'
import { driverStandings } from './standings'

const row = (driverId: string, constructorId: string, position: number, points: number): ResultRow => ({
  position, driverId, constructorId, grid: position, laps: 50, status: 'Finished', points,
})
const race = (round: number, results: ResultRow[], sprint?: ResultRow[]): Race => ({
  round, name: `R${round}`, date: '2025-01-01', circuit: 'c', locality: 'l', country: 'x', results, ...(sprint ? { sprint } : {}),
})

describe('teamOf', () => {
  it('returns the team of the last race the driver classified in', () => {
    const races = [race(1, [row('a', 'x', 1, 25)]), race(2, [row('a', 'y', 1, 25)]), race(3, [row('b', 'z', 1, 25)])]
    expect(teamOf(races, 'a')).toBe('y')
  })

  it('is undefined for an unknown driver', () => {
    expect(teamOf([race(1, [row('a', 'x', 1, 25)])], 'nobody')).toBeUndefined()
  })
})

describe('driverProfile', () => {
  const races = [
    race(1, [row('a', 'x', 1, 25), row('b', 'y', 2, 18)], [row('a', 'x', 3, 6)]),
    race(2, [row('b', 'y', 1, 25)]),
  ]

  it('sums points incl. sprint, counts GP wins and lists per-race results', () => {
    const p = driverProfile(races, 'a')
    expect(p).toMatchObject({ driverId: 'a', team: 'x', points: 31, wins: 1 })
    expect(p.results).toEqual([{ round: 1, name: 'R1', grid: 1, position: 1, status: 'Finished', points: 31 }])
  })

  it('does not count a sprint win as a win', () => {
    const p = driverProfile([race(1, [row('a', 'x', 2, 18)], [row('a', 'x', 1, 8)])], 'a')
    expect(p).toMatchObject({ points: 26, wins: 0 })
  })

  it('returns an empty profile for an unknown driver', () => {
    expect(driverProfile(races, 'nobody')).toEqual({ driverId: 'nobody', team: undefined, points: 0, wins: 0, results: [] })
  })

  it('agrees with driverStandings on the real season', () => {
    for (const s of driverStandings(season.races)) {
      expect(driverProfile(season.races, s.id)).toMatchObject({ points: s.points, wins: s.wins })
    }
  })
})
