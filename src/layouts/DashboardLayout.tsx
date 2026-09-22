import { useState } from 'react'
import {
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import { Badge, BrandMark, Button } from '../components/ui/Primitives'
import { useAuth } from '../features/auth/authContext'
import { cn } from '../utils/cn'

function Navigation({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  return (
    <nav aria-label="Primary navigation" className="mt-7">
      {!collapsed && (
        <p className="px-3 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-ink-400">
          Workspace
        </p>
      )}
      <NavLink
        to="/"
        end
        onClick={onNavigate}
        aria-label={collapsed ? 'Foundation dashboard' : undefined}
        title={collapsed ? 'Foundation dashboard' : undefined}
        className={({ isActive }) =>
          cn(
            'mt-2 flex h-11 items-center rounded-xl text-sm font-semibold transition-colors',
            collapsed ? 'justify-center px-0' : 'gap-3 px-3',
            isActive
              ? 'bg-ink-950 text-white shadow-md shadow-ink-950/10'
              : 'text-ink-600 hover:bg-ink-100 hover:text-ink-950',
          )
        }
      >
        <LayoutDashboard aria-hidden="true" className="size-4.5 shrink-0" />
        {!collapsed && <span>Foundation</span>}
      </NavLink>
    </nav>
  )
}

export function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopCollapsed, setDesktopCollapsed] = useState(false)
  const auth = useAuth()
  const displayName =
    auth.status === 'authenticated' ? auth.session.displayName : 'Administrator'

  return (
    <div className="flex min-h-screen bg-canvas text-ink-950">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-50 -translate-y-20 rounded-lg bg-ink-950 px-4 py-2 text-sm font-semibold text-white transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>

      <aside
        id="desktop-sidebar"
        className={cn(
          'sticky top-0 hidden h-screen shrink-0 border-r border-ink-100 bg-white p-4 transition-[width] duration-200 lg:flex lg:flex-col',
          desktopCollapsed ? 'w-20' : 'w-64',
        )}
      >
        <div className={cn('flex items-center', desktopCollapsed ? 'justify-center' : 'gap-3 px-1')}>
          <BrandMark />
          {!desktopCollapsed && (
            <div>
              <p className="font-display text-base font-semibold tracking-tight">
                Hyperlocal
              </p>
              <p className="text-xs text-ink-500">Admin console</p>
            </div>
          )}
        </div>
        <Navigation collapsed={desktopCollapsed} />
        {!desktopCollapsed && (
          <div className="mt-auto rounded-xl border border-ink-100 bg-ink-50 p-3">
            <p className="text-xs font-semibold text-ink-800">Security model</p>
            <p className="mt-1 text-xs leading-5 text-ink-500">
              Authorization is always enforced by the backend.
            </p>
          </div>
        )}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink-950/45 backdrop-blur-sm"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            id="mobile-sidebar"
            aria-label="Mobile sidebar"
            className="relative flex h-full w-[min(19rem,86vw)] flex-col bg-white p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BrandMark />
                <div>
                  <p className="font-display text-base font-semibold">Hyperlocal</p>
                  <p className="text-xs text-ink-500">Admin console</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Close navigation"
                onClick={() => setMobileOpen(false)}
              >
                <X aria-hidden="true" className="size-5" />
              </Button>
            </div>
            <Navigation onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-17 items-center justify-between border-b border-ink-100 bg-canvas/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              aria-label="Open navigation"
              aria-controls="mobile-sidebar"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <Menu aria-hidden="true" className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hidden lg:inline-flex"
              aria-label={desktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-controls="desktop-sidebar"
              aria-expanded={!desktopCollapsed}
              onClick={() => setDesktopCollapsed((value) => !value)}
            >
              {desktopCollapsed ? (
                <PanelLeftOpen aria-hidden="true" className="size-5" />
              ) : (
                <PanelLeftClose aria-hidden="true" className="size-5" />
              )}
            </Button>
            <Badge className="hidden sm:inline-flex" tone="neutral">
              Foundation
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-ink-900">{displayName}</p>
              <p className="text-xs text-ink-500">Admin session</p>
            </div>
            <div
              className="grid size-9 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-800"
              aria-hidden="true"
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main id="main-content" className="mx-auto max-w-[90rem] p-5 sm:p-7 lg:p-9">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
