import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { driverById, lastRace, season } from '@/data/season'
import { driverStandings } from '@/lib/standings'
import { renderAt } from '@/test/render'

describe('HomePage', () => {
  it('summarises the last race with its podium', () => {
    renderAt('/')
    const last = lastRace()!
    expect(screen.getByRole('heading', { name: `Last race: ${last.name}` })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByRole('link', { name: 'Full results' })).toHaveAttribute('href', `/races/${last.round}`)
  })

  it('shows the championship leader and their points', () => {
    renderAt('/')
    const leader = driverStandings(season.races)[0]!
    const d = driverById(leader.id)!
    expect(screen.getByText(`Championship leader: ${d.givenName} ${d.familyName}, ${leader.points} pts`)).toBeInTheDocument()
  })
})
