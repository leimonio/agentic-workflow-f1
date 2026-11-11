import { driverById } from '@/data/season'
import type { ResultRow } from '@/data/types'
import { Table, Td, Th } from '@/components/ui/table'
import { TeamSwatch } from '@/components/TeamSwatch'

export function RaceResultsTable({ results }: { results: ResultRow[] }) {
  return (
    <Table>
      <caption className="sr-only">Race results</caption>
      <thead>
        <tr><Th>Pos</Th><Th>Driver</Th><Th>Team</Th><Th>Grid</Th><Th>Time / status</Th><Th>Pts</Th></tr>
      </thead>
      <tbody>
        {results.map((r) => {
          const d = driverById(r.driverId)
          return (
            <tr key={r.driverId}>
              <Td>{r.position}</Td>
              <Td>{d ? `${d.givenName} ${d.familyName}` : r.driverId}</Td>
              <Td><TeamSwatch constructorId={r.constructorId} /></Td>
              <Td>{r.grid}</Td>
              <Td>{r.time ?? r.status}</Td>
              <Td>{r.points}</Td>
            </tr>
          )
        })}
      </tbody>
    </Table>
  )
}
