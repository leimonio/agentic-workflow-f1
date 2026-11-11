import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { season } from '@/data/season'
import { driverStandings } from '@/lib/standings'
import { renderAt } from '@/test/render'

describe('DriverStandingsPage', () => {
  it('ranks every driver with wins and points, in standings order', () => {
    renderAt('/standings/drivers')
    const rows = within(screen.getByRole('table')).getAllByRole('row')
    const standings = driverStandings(season.races)
    expect(rows).toHaveLength(standings.length + 1)
    const leader = standings[0]!
    const cells = within(rows[1]!).getAllByRole('cell')
    expect(cells[0]).toHaveTextContent('1')
    expect(cells[3]).toHaveTextContent(String(leader.wins))
    expect(cells[4]).toHaveTextContent(String(leader.points))
  })

  it('shows a team for the leader', () => {
    renderAt('/standings/drivers')
    const cells = within(screen.getAllByRole('row')[1]!).getAllByRole('cell')
    expect(cells[2]!.textContent).toMatch(/\w/)
    expect(cells[2]!.textContent).not.toBe('—')
  })
})
