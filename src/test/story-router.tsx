import type { Decorator } from '@storybook/react-vite'
import { MemoryRouter, Route, Routes } from 'react-router'

// Story decorator: renders the story at `route`, with the URL set to `path`.
export const withRouter = (route: string, path = route): Decorator => (Story) => (
  <MemoryRouter initialEntries={[path]}>
    <Routes><Route path={route} element={<Story />} /></Routes>
  </MemoryRouter>
)
