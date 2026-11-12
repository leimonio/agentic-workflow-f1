import type { Meta, StoryObj } from '@storybook/react-vite'
import { withRouter } from '@/test/story-router'
import { DriverProfilePage } from './DriverProfilePage'

const meta = { title: 'Pages/Driver profile', component: DriverProfilePage } satisfies Meta<typeof DriverProfilePage>
export default meta
export const Norris: StoryObj<typeof meta> = { decorators: [withRouter('/drivers/:id', '/drivers/norris')] }
export const NotFound: StoryObj<typeof meta> = { decorators: [withRouter('/drivers/:id', '/drivers/nobody')] }
