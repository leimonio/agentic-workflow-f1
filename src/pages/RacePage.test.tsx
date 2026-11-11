import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { raceByRound } from '@/data/season'
import { renderAt } from '@/test/render'

describe('RacePage', () => {
  it('shows one result row per classified driver', () => {
    renderAt('/races/1')
    const race = raceByRound(1)!
    expect(screen.getByRole('heading', { name: race.name })).toBeInTheDocument()
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(race.results.length + 1)
  })

  it('handles an unknown round', () => {
    renderAt('/races/99')
    expect(screen.getByRole('heading', { name: 'Race not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to the calendar' })).toHaveAttribute('href', '/calendar')
  })
})
