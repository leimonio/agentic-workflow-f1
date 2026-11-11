export interface ResultRow {
  position: number
  driverId: string
  constructorId: string
  grid: number
  laps: number
  status: string
  points: number
  time?: string
}

export interface Race {
  round: number
  name: string
  /** ISO date (YYYY-MM-DD) of the race as published by the API, local to the circuit */
  date: string
  /** UTC start time, e.g. "05:00:00Z" */
  time?: string
  circuit: string
  locality: string
  country: string
  results: ResultRow[]
  sprint?: ResultRow[]
}

export interface Driver {
  id: string
  code: string
  number: string
  givenName: string
  familyName: string
  nationality: string
}

export interface Constructor {
  id: string
  name: string
  nationality: string
  /** Team colour as hex. No logos. */
  color: string
}

export interface Season {
  season: number
  fetchedAt: string
  races: Race[]
  drivers: Driver[]
  constructors: Constructor[]
}
