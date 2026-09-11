import { LogOut } from 'lucide-react'
import { NavLink, Navigate, Outlet, useLocation } from 'react-router'
import { Button } from '@/components/ui/button'
import { signOutUser } from '@/lib/firebase'
import { KINDS } from '@/lib/kinds'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/store'

const NAV = [
  { to: '/', label: 'Dashboard' },
  ...KINDS.map((k) => ({ to: k.path, label: k.label })),
  { to: '/category', label: 'Categories' },
]

/** Auth guard + shell for every signed-in route. */
export function AppLayout() {
  const auth = useAppSelector((s) => s.auth)
  const location = useLocation()

  if (auth.status === 'loading') {
    return (
      <p role="status" className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Checking sign-in…
      </p>
    )
  }
  if (auth.status === 'signedOut') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <span className="font-semibold">MyExpenseLog</span>
          <nav aria-label="Main" className="-mx-1 flex flex-1 gap-1 overflow-x-auto">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-1.5 text-sm whitespace-nowrap text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring',
                    isActive && 'bg-muted font-medium text-foreground',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground md:inline">{auth.user?.email}</span>
            <Button variant="ghost" size="sm" onClick={() => void signOutUser()}>
              <LogOut aria-hidden />
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
