import { describe, expect, it } from 'vitest'
import { formatRaceDate } from './dates'

describe('formatRaceDate', () => {
  it('formats a race date', () => {
    expect(formatRaceDate('2025-03-16')).toBe('Mar 16')
  })

  // PLANTED FAILURE (pre-existing, on purpose): workshop step 2 shows `gate` ignoring it.
  // The date is parsed as UTC midnight, so a viewer west of UTC sees the previous day.
  // Do NOT fix this on main; the fix would be to format with timeZone: 'UTC' regardless of the viewer.
  it('keeps the circuit calendar date for a viewer in Los Angeles', () => {
    expect(formatRaceDate('2025-03-16', 'America/Los_Angeles')).toBe('Mar 16')
  })
})
