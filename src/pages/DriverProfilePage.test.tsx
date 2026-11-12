import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { constructorById, driverById, season } from '@/data/season'
import { driverProfile } from '@/lib/drivers'
import { driverStandings } from '@/lib/standings'
import { renderAt } from '@/test/render'

describe('DriverProfilePage', () => {
  it('shows name, points, wins and one row per race', () => {
    const leader = driverStandings(season.races)[0]
    if (!leader) throw new Error('season has no standings')
    const profile = driverProfile(season.races, leader.id)
    renderAt(`/drivers/${leader.id}`)
    const driver = driverById(leader.id)
    if (!driver || !profile.team) throw new Error('missing driver or team')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(`${driver.givenName} ${driver.familyName}`)
    expect(screen.getByText(constructorById(profile.team)?.name ?? profile.team)).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`${profile.points} pts`))).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`${profile.wins} wins?`))).toBeInTheDocument()
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(profile.results.length + 1)
  })

  it('handles an unknown driver', () => {
    renderAt('/drivers/nobody')
    expect(screen.getByRole('heading', { name: 'Driver not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to the standings' })).toHaveAttribute('href', '/standings/drivers')
  })
})
