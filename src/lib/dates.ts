// Race dates are calendar dates at the circuit. They must not move when the viewer is in another timezone.
export function formatRaceDate(date: string, timeZone = 'UTC'): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone })
}
