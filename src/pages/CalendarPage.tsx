import { Link } from 'react-router'
import { Table, Td, Th } from '@/components/ui/table'
import { driverById, season } from '@/data/season'
import { formatRaceDate } from '@/lib/dates'

export function CalendarPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Race calendar</h1>
      <Table>
        <caption className="sr-only">2025 race calendar</caption>
        <thead><tr><Th>Round</Th><Th>Grand Prix</Th><Th>Date</Th><Th>Circuit</Th><Th>Winner</Th></tr></thead>
        <tbody>
          {season.races.map((r) => {
            const w = r.results.find((x) => x.position === 1)
            const d = w && driverById(w.driverId)
            return (
              <tr key={r.round}>
                <Td>{r.round}</Td>
                <Td><Link className="underline" to={`/races/${r.round}`}>{r.name}</Link></Td>
                <Td>{formatRaceDate(r.date)}</Td>
                <Td>{r.circuit}</Td>
                <Td>{d ? d.familyName : '—'}</Td>
              </tr>
            )
          })}
        </tbody>
      </Table>
    </div>
  )
}
