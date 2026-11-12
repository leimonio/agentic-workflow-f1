import type { Meta, StoryObj } from '@storybook/react-vite'
import { withRouter } from '@/test/story-router'
import { DriverPage } from './DriverPage'

const meta = { title: 'Pages/Driver profile', component: DriverPage } satisfies Meta<typeof DriverPage>
export default meta
export const Norris: StoryObj<typeof meta> = { decorators: [withRouter('/drivers/:id', '/drivers/norris')] }
export const NotFound: StoryObj<typeof meta> = { decorators: [withRouter('/drivers/:id', '/drivers/nobody')] }
