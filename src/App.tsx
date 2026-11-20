import { createBrowserRouter, RouterProvider } from 'react-router'
import { Layout } from '@/components/Layout'
import { CalendarPage } from '@/pages/CalendarPage'
import { ConstructorStandingsPage } from '@/pages/ConstructorStandingsPage'
import { DriverStandingsPage } from '@/pages/DriverStandingsPage'
import { DriverPage } from '@/pages/DriverPage'
import { HomePage } from '@/pages/HomePage'
import { RacePage } from '@/pages/RacePage'

export const routes = [
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/calendar', element: <CalendarPage /> },
      { path: '/standings/drivers', element: <DriverStandingsPage /> },
      { path: '/standings/constructors', element: <ConstructorStandingsPage /> },
      { path: '/races/:round', element: <RacePage /> },
      { path: '/drivers/:id', element: <DriverPage /> },
    ],
  },
]

export const App = () => <RouterProvider router={createBrowserRouter(routes)} />
