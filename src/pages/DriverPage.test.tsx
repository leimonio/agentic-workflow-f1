import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { season } from '@/data/season'
import { driverProfile } from '@/lib/drivers'
import { renderAt } from '@/test/render'

describe('DriverPage', () => {
  it('shows the driver profile and one row per race', () => {
    renderAt('/drivers/max_verstappen')
    const p = driverProfile(season.races, 'max_verstappen')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Max Verstappen')
    expect(screen.getByText(`${p.points} points`)).toBeInTheDocument()
    expect(screen.getByText(`${p.wins} wins`)).toBeInTheDocument()
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(p.results.length + 1)
    expect(screen.getByRole('link', { name: p.results[0]!.name })).toHaveAttribute('href', '/races/1')
  })

  it('handles an unknown driver', () => {
    renderAt('/drivers/nobody')
    expect(screen.getByRole('heading', { name: 'Driver not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to the driver standings' })).toHaveAttribute('href', '/standings/drivers')
  })
})
