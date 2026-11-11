import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { season } from '@/data/season'
import { renderAt } from '@/test/render'

describe('CalendarPage', () => {
  it('lists every round of the season with a link to its results', () => {
    renderAt('/calendar')
    const rows = within(screen.getByRole('table')).getAllByRole('row')
    expect(rows).toHaveLength(season.races.length + 1)
    expect(screen.getByRole('link', { name: 'Australian Grand Prix' })).toHaveAttribute('href', '/races/1')
  })

  it('shows the winner of a finished race', () => {
    renderAt('/calendar')
    expect(within(screen.getByRole('row', { name: /Australian Grand Prix/ })).getByText('Norris')).toBeInTheDocument()
  })
})
