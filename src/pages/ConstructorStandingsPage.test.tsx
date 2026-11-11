import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { constructorById, season } from '@/data/season'
import { constructorStandings } from '@/lib/standings'
import { renderAt } from '@/test/render'

describe('ConstructorStandingsPage', () => {
  it('ranks every team with wins and points, in standings order', () => {
    renderAt('/standings/constructors')
    const rows = within(screen.getByRole('table')).getAllByRole('row')
    const standings = constructorStandings(season.races)
    expect(rows).toHaveLength(standings.length + 1)
    const leader = standings[0]!
    const cells = within(rows[1]!).getAllByRole('cell')
    expect(cells[0]).toHaveTextContent('1')
    expect(cells[1]).toHaveTextContent(constructorById(leader.id)?.name ?? leader.id)
    expect(cells[2]).toHaveTextContent(String(leader.wins))
    expect(cells[3]).toHaveTextContent(String(leader.points))
  })
})
