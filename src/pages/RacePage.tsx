import { Link, useParams } from 'react-router'
import { RaceResultsTable } from '@/components/RaceResultsTable'
import { raceByRound } from '@/data/season'
import { formatRaceDate } from '@/lib/dates'

export function RacePage() {
  const race = raceByRound(Number(useParams().round))
  if (!race) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Race not found</h1>
        <Link className="underline" to="/calendar">Back to the calendar</Link>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{race.name}</h1>
      <p className="text-sm text-muted-foreground">Round {race.round} · {formatRaceDate(race.date)} · {race.circuit}, {race.country}</p>
      <RaceResultsTable results={race.results} />
    </div>
  )
}
