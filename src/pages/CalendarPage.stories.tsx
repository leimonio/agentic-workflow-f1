import type { Meta, StoryObj } from '@storybook/react-vite'
import { withRouter } from '@/test/story-router'
import { CalendarPage } from './CalendarPage'

const meta = { title: 'Pages/Calendar', component: CalendarPage, decorators: [withRouter('/calendar')] } satisfies Meta<typeof CalendarPage>
export default meta
export const Default: StoryObj<typeof meta> = {}
