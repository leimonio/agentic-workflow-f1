import type { Meta, StoryObj } from '@storybook/react-vite'
import { withRouter } from '@/test/story-router'
import { ConstructorStandingsPage } from './ConstructorStandingsPage'

const meta = { title: 'Pages/ConstructorStandings', component: ConstructorStandingsPage, decorators: [withRouter('/standings/constructors')] } satisfies Meta<typeof ConstructorStandingsPage>
export default meta
export const Default: StoryObj<typeof meta> = {}
