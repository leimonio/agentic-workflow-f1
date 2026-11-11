import type { Race } from '@/data/types'

// A driver's team is the one they last classified with.
export const teamOf = (races: Race[], driverId: string): string | undefined =>
  races
    .findLast((r) => r.results.some((x) => x.driverId === driverId))
    ?.results.find((x) => x.driverId === driverId)?.constructorId

export interface DriverRaceResult {
  round: number
  name: string
  grid: number
  position: number
  status: string
  /** Race points plus sprint points for that weekend. */
  points: number
}

export interface DriverProfile {
  driverId: string
  team: string | undefined
  points: number
  wins: number
  results: DriverRaceResult[]
}

// Pure: races in, one driver's profile out. Wins count Grand Prix wins only (as in standings).
export function driverProfile(races: Race[], driverId: string): DriverProfile {
  const results: DriverRaceResult[] = []
  for (const race of races) {
    const row = race.results.find((x) => x.driverId === driverId)
    const sprint = race.sprint?.find((x) => x.driverId === driverId)
    if (!row && !sprint) continue
    results.push({
      round: race.round,
      name: race.name,
      grid: row?.grid ?? 0,
      position: row?.position ?? 0,
      status: row?.status ?? 'Did not start',
      points: (row?.points ?? 0) + (sprint?.points ?? 0),
    })
  }
  return {
    driverId,
    team: teamOf(races, driverId),
    points: results.reduce((sum, r) => sum + r.points, 0),
    wins: results.filter((r) => r.position === 1).length,
    results,
  }
}
