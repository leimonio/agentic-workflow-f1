import { Link } from 'react-router'
import { TeamSwatch } from '@/components/TeamSwatch'
import { Table, Td, Th } from '@/components/ui/table'
import { driverById, season } from '@/data/season'
import { teamOf } from '@/lib/drivers'
import { driverStandings } from '@/lib/standings'

export function DriverStandingsPage() {
  const rows = driverStandings(season.races)
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Driver standings</h1>
      <Table>
        <caption className="sr-only">2025 driver standings</caption>
        <thead><tr><Th>Pos</Th><Th>Driver</Th><Th>Team</Th><Th>Wins</Th><Th>Pts</Th></tr></thead>
        <tbody>
          {rows.map((r) => {
            const d = driverById(r.id)
            const team = teamOf(season.races, r.id)
            return (
              <tr key={r.id}>
                <Td>{r.position}</Td>
                <Td><Link className="underline" to={`/drivers/${r.id}`}>{d ? `${d.givenName} ${d.familyName}` : r.id}</Link></Td>
                <Td>{team ? <TeamSwatch constructorId={team} /> : '—'}</Td>
                <Td>{r.wins}</Td>
                <Td>{r.points}</Td>
              </tr>
            )
          })}
        </tbody>
      </Table>
    </div>
  )
}
