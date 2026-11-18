import { createBrowserRouter, RouterProvider } from 'react-router'
import { Layout } from '@/components/Layout'
import { CalendarPage } from '@/pages/CalendarPage'
import { ConstructorStandingsPage } from '@/pages/ConstructorStandingsPage'
import { DriverProfilePage } from '@/pages/DriverProfilePage'
import { DriverStandingsPage } from '@/pages/DriverStandingsPage'
import { HomePage } from '@/pages/HomePage'
import { RacePage } from '@/pages/RacePage'

export const routes = [
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/calendar', element: <CalendarPage /> },
      { path: '/standings/drivers', element: <DriverStandingsPage /> },
      { path: '/drivers/:id', element: <DriverProfilePage /> },
      { path: '/standings/constructors', element: <ConstructorStandingsPage /> },
      { path: '/races/:round', element: <RacePage /> },
    ],
  },
]

export const App = () => <RouterProvider router={createBrowserRouter(routes)} />
