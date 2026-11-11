import { NavLink, Outlet } from 'react-router'
import { cn } from '@/lib/utils'

export const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/calendar', label: 'Calendar', end: false },
  { to: '/standings/drivers', label: 'Drivers', end: false },
  { to: '/standings/constructors', label: 'Constructors', end: false },
]

export function Layout() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <nav aria-label="Main" className="mx-auto flex max-w-4xl items-center gap-6 px-4 py-3">
          <span className="font-bold text-primary">F1 2025</span>
          {navItems.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) => cn('text-sm', isActive ? 'font-semibold underline' : 'text-muted-foreground')}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
