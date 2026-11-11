import type { Meta, StoryObj } from '@storybook/react-vite'
import { withRouter } from '@/test/story-router'
import { RacePage } from './RacePage'

const meta = { title: 'Pages/Race results', component: RacePage } satisfies Meta<typeof RacePage>
export default meta
export const Australia: StoryObj<typeof meta> = { decorators: [withRouter('/races/:round', '/races/1')] }
export const NotFound: StoryObj<typeof meta> = { decorators: [withRouter('/races/:round', '/races/99')] }
