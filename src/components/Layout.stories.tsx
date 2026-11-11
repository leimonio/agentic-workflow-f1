import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter, Route, Routes } from 'react-router'
import { Layout } from './Layout'

const meta = { title: 'Components/Layout', component: Layout } satisfies Meta<typeof Layout>
export default meta
export const Default: StoryObj<typeof meta> = {
  render: () => (
    <MemoryRouter initialEntries={['/calendar']}>
      <Routes><Route element={<Layout />}><Route path="/calendar" element={<p>Page content</p>} /></Route></Routes>
    </MemoryRouter>
  ),
}
