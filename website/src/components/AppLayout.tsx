import { useEffect, useRef, useState } from 'react'
import { ChevronDown, FolderTree, LogOut, Moon, Sun, User, X, Wallet } from 'lucide-react'
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { useThemeToggle } from '@/hooks/useColorScheme'
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll'
import { signOutUser } from '@/lib/firebase'
import { NAV } from '@/lib/nav'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/store'

/** Auth guard + full navbar shell for every signed-in route. */
export function AppLayout() {
  const auth = useAppSelector((s) => s.auth)
  const location = useLocation()
  const navigate = useNavigate()
  const { scheme, setLight, setDark } = useThemeToggle()

  const [menuOpen, setMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const mobileDropdownRef = useRef<HTMLDivElement | null>(null)

  // Lock background scrolling when mobile menu sheet is open
  useLockBodyScroll(menuOpen)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      const inDesktop = dropdownRef.current && dropdownRef.current.contains(target)
      const inMobile = mobileDropdownRef.current && mobileDropdownRef.current.contains(target)
      if (!inDesktop && !inMobile) {
        setMenuOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Close dropdown on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  if (auth.status === 'loading') {
    return (
      <div role="status" className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="font-medium">Loading ledger…</p>
        </div>
      </div>
    )
  }
  if (auth.status === 'signedOut') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  const isDark = scheme === 'dark'
  const toggleTheme = () => (isDark ? setLight() : setDark())
  const ThemeIcon = isDark ? Sun : Moon
  const themeLabel = isDark ? 'Switch to light theme' : 'Switch to dark theme'

  const user = auth.user
  const initials = (user?.displayName || user?.email || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  const profileMenuContent = (
    <div className="w-64 rounded-2xl border bg-card p-2 shadow-xl ring-1 ring-border/50 z-40 animate-in fade-in-50 zoom-in-95">
      <div className="px-3 py-2.5 border-b border-border/60">
        <p className="text-sm font-semibold truncate text-foreground">{user?.displayName || 'My Account'}</p>
        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
      </div>

      <div className="py-1.5">
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors text-left font-medium cursor-pointer"
        >
          <User className="size-4 text-muted-foreground" />
          Profile Settings
        </button>
        <button
          type="button"
          onClick={() => navigate('/category')}
          className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors text-left font-medium cursor-pointer"
        >
          <FolderTree className="size-4 text-muted-foreground" />
          Category Manager
        </button>
      </div>

      <div className="border-t border-border/60 pt-1.5">
        <button
          type="button"
          onClick={() => void signOutUser()}
          className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left font-medium cursor-pointer"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col relative bg-background text-foreground">
      {/* Top Header Navbar */}
      <header className="w-full border-b border-border/60 bg-background/90 backdrop-blur-md sticky top-0 z-20">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 px-4 md:px-8 py-3">
          <div className="flex items-center gap-4 sm:gap-8 min-w-0">
            <NavLink to="/" className="flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg shrink-0">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                <Wallet className="size-5" />
              </div>
              <span className="font-bold tracking-tight text-lg text-foreground">MyExpenseLog</span>
            </NavLink>

            {/* Desktop Navigation Links */}
            <nav aria-label="Main Desktop" className="hidden md:flex items-center gap-1">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end
                  className={({ isActive }) =>
                    cn(
                      'rounded-xl px-3.5 py-2 text-sm font-medium text-muted-foreground outline-none hover:text-foreground hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring transition-all',
                      isActive && 'bg-primary/10 text-primary font-semibold hover:bg-primary/15',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl size-9 text-muted-foreground hover:text-foreground hover:bg-muted/60"
              aria-label={themeLabel}
              title={themeLabel}
              onClick={toggleTheme}
            >
              <ThemeIcon aria-hidden className="size-4" />
            </Button>

            {/* Desktop Profile Dropdown */}
            <div className="relative hidden md:block" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2.5 rounded-full p-1 pl-1.5 pr-3 outline-none hover:bg-muted/60 transition-colors focus-visible:ring-2 focus-visible:ring-ring border border-border/40 hover:border-border cursor-pointer"
                aria-expanded={menuOpen}
                aria-haspopup="true"
                aria-label="User profile menu"
              >
                <div className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-xs ring-1 ring-primary/30 shrink-0">
                  {initials || <User className="size-4" />}
                </div>
                <span className="text-sm font-semibold text-foreground max-w-[140px] truncate">
                  {user?.displayName || user?.email?.split('@')[0] || 'User'}
                </span>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </button>

              {menuOpen && <div className="absolute right-0 mt-2">{profileMenuContent}</div>}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area — Expanded Bottom Padding to Prevent Nav Dock Overlap */}
      <main className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 pb-36 md:pb-8 flex-1">
        <Outlet />
      </main>

      {/* Mobile Floating Bottom Navigation Dock */}
      <div className="fixed bottom-3 left-3 right-3 z-30 md:hidden pb-[env(safe-area-inset-bottom)] pointer-events-none">
        <nav
          aria-label="Mobile Navigation"
          className="pointer-events-auto max-w-md mx-auto rounded-2xl border border-border/80 bg-background/95 backdrop-blur-lg shadow-2xl flex items-center justify-around p-1.5"
        >
          {NAV.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-xl text-muted-foreground transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive && 'text-primary font-bold bg-primary/10 shadow-xs',
                  )
                }
              >
                <Icon className="size-5 shrink-0" />
                <span className="text-[10px] leading-tight font-medium">{item.label}</span>
              </NavLink>
            )
          })}

          {/* Mobile Bottom Profile Menu Trigger */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-xl text-muted-foreground transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer',
              (location.pathname === '/profile' || menuOpen) && 'text-primary font-bold bg-primary/10 shadow-xs',
            )}
            aria-expanded={menuOpen}
            aria-haspopup="true"
            aria-label="User profile menu"
          >
            <User className="size-5 shrink-0" />
            <span className="text-[10px] leading-tight font-medium">Profile</span>
          </button>
        </nav>
      </div>

      {/* Mobile Bottom Sheet Profile Menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in-50"
            onClick={() => setMenuOpen(false)}
          />

          {/* Bottom Sheet Card */}
          <div
            ref={mobileDropdownRef}
            className="relative z-10 w-full max-w-lg mx-auto rounded-t-3xl border-t border-border/80 bg-background p-5 pb-8 shadow-2xl animate-in slide-in-from-bottom-full duration-200"
          >
            {/* Sheet Handle */}
            <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between pb-4 mb-3 border-b border-border/60">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-base ring-1 ring-primary/30">
                  {initials || <User className="size-5" />}
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold truncate text-foreground">{user?.displayName || 'My Account'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full shrink-0"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="space-y-1 py-1">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  navigate('/profile')
                }}
                className="w-full flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm text-foreground hover:bg-muted active:bg-muted/80 transition-colors text-left font-medium cursor-pointer"
              >
                <User className="size-4 text-muted-foreground" />
                Profile Settings
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  navigate('/category')
                }}
                className="w-full flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm text-foreground hover:bg-muted active:bg-muted/80 transition-colors text-left font-medium cursor-pointer"
              >
                <FolderTree className="size-4 text-muted-foreground" />
                Category Manager
              </button>
            </div>

            <div className="border-t border-border/60 pt-3 mt-3">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  void signOutUser()
                }}
                className="w-full flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm text-destructive hover:bg-destructive/10 active:bg-destructive/20 transition-colors text-left font-medium cursor-pointer"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

