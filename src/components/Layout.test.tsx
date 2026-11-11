import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderAt } from '@/test/render'

describe('Layout', () => {
  it('navigates between pages from the main nav', async () => {
    renderAt('/')
    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(nav).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: 'Calendar' }))
    expect(screen.getByRole('heading', { name: 'Race calendar' })).toBeInTheDocument()
  })
})
