import { Link, useParams } from 'react-router'
import { TeamSwatch } from '@/components/TeamSwatch'
import { Table, Td, Th } from '@/components/ui/table'
import { driverById, season } from '@/data/season'
import { driverProfile } from '@/lib/drivers'

export function DriverPage() {
  const id = useParams().id ?? ''
  const driver = driverById(id)
  if (!driver) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Driver not found</h1>
        <Link className="underline" to="/standings/drivers">Back to the standings</Link>
      </div>
    )
  }
  const profile = driverProfile(season.races, id)
  const name = `${driver.givenName} ${driver.familyName}`
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{name}</h1>
      <p className="text-sm text-muted-foreground">
        {profile.team ? <TeamSwatch constructorId={profile.team} /> : '—'} · {profile.points} pts · {profile.wins} {profile.wins === 1 ? 'win' : 'wins'}
      </p>
      <Table>
        <caption className="sr-only">{name} 2025 results</caption>
        <thead><tr><Th>Round</Th><Th>Race</Th><Th>Grid</Th><Th>Pos</Th><Th>Status</Th><Th>Pts</Th></tr></thead>
        <tbody>
          {profile.results.map((r) => (
            <tr key={r.round}>
              <Td>{r.round}</Td>
              <Td><Link className="underline" to={`/races/${r.round}`}>{r.name}</Link></Td>
              <Td>{r.grid}</Td>
              <Td>{r.position}</Td>
              <Td>{r.status}</Td>
              <Td>{r.points}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}
