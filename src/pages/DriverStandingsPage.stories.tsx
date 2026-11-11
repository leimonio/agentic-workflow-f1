import type { Meta, StoryObj } from '@storybook/react-vite'
import { withRouter } from '@/test/story-router'
import { DriverStandingsPage } from './DriverStandingsPage'

const meta = { title: 'Pages/DriverStandings', component: DriverStandingsPage, decorators: [withRouter('/standings/drivers')] } satisfies Meta<typeof DriverStandingsPage>
export default meta
export const Default: StoryObj<typeof meta> = {}
