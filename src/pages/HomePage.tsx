import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { TeamSwatch } from '@/components/TeamSwatch'
import { driverById, lastRace } from '@/data/season'
import { formatRaceDate } from '@/lib/dates'

export function HomePage() {
  const race = lastRace()
  if (!race) return <p>No races yet.</p>
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Formula 1 2025</h1>
      <Card aria-label="Last race">
        <CardTitle>Last race: {race.name}</CardTitle>
        <p className="text-sm text-muted-foreground">{formatRaceDate(race.date)} · {race.circuit}</p>
        <ol className="my-4 space-y-1">
          {race.results.slice(0, 3).map((r) => {
            const d = driverById(r.driverId)
            return (
              <li key={r.driverId} className="flex items-center gap-3">
                <span className="w-6 font-semibold">{r.position}.</span>
                <span>{d ? `${d.givenName} ${d.familyName}` : r.driverId}</span>
                <TeamSwatch constructorId={r.constructorId} />
              </li>
            )
          })}
        </ol>
        <Button asChild size="sm"><Link to={`/races/${race.round}`}>Full results</Link></Button>
      </Card>
    </div>
  )
}
