import raw from './season-2025.json'
import type { Constructor, Driver, Race, Season } from './types.ts'

export const season = raw as Season

export const driverById = (id: string): Driver | undefined => season.drivers.find((d) => d.id === id)
export const constructorById = (id: string): Constructor | undefined => season.constructors.find((c) => c.id === id)
export const raceByRound = (round: number): Race | undefined => season.races.find((r) => r.round === round)
export const lastRace = (): Race | undefined => season.races.findLast((r) => r.results.length > 0)
