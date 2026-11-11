import type { Meta, StoryObj } from '@storybook/react-vite'
import { withRouter } from '@/test/story-router'
import { HomePage } from './HomePage'

const meta = { title: 'Pages/Home', component: HomePage, decorators: [withRouter('/')] } satisfies Meta<typeof HomePage>
export default meta
export const Default: StoryObj<typeof meta> = {}
