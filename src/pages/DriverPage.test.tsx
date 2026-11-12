import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { season } from '@/data/season'
import { driverProfile } from '@/lib/drivers'
import { driverStandings } from '@/lib/standings'
import { renderAt } from '@/test/render'

describe('DriverPage', () => {
  it('shows name, points, wins and one row per race', () => {
    const leader = driverStandings(season.races)[0]
    if (!leader) throw new Error('season has no standings')
    const profile = driverProfile(season.races, leader.id)
    renderAt(`/drivers/${leader.id}`)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
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
