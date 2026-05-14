import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../hooks/useNotifications'
import { NotificationsPanel } from './NotificationsPanel'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: '▪' },
  { to: '/admin/clients', label: 'Clients', icon: '◆' },
  { to: '/admin/documents', label: 'Documents', icon: '◈' },
]

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [navOpen, setNavOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const { groups, unreadCount, loading, markAllRead } = useNotifications()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  function openNotifications() {
    setNavOpen(false)
    setNotifOpen(true)
  }

  return (
    <div className="flex min-h-screen">

      {/* Mobile top bar */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 h-14"
        style={{ backgroundColor: '#0D0D0D', borderBottom: '3px solid #F56E0F' }}
      >
        <h1 className="font-display font-bold text-[15px] tracking-[-0.02em] text-white">
          KENO <span style={{ color: '#F56E0F' }}>SONIC</span>
        </h1>

        <div className="flex items-center gap-3">
          {/* Bell — mobile */}
          <button
            onClick={openNotifications}
            className="relative flex items-center justify-center text-white p-1"
            aria-label="Notifications"
          >
            <BellIcon />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 font-body font-medium text-[8px] leading-none px-1 py-0.5 rounded-full"
                style={{ backgroundColor: '#F56E0F', color: '#fff', minWidth: '14px', textAlign: 'center' }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Hamburger */}
          <button
            onClick={() => setNavOpen(true)}
            className="flex flex-col gap-1.5 p-2"
            aria-label="Open menu"
          >
            <span className="block w-5 h-0.5 bg-white" />
            <span className="block w-5 h-0.5 bg-white" />
            <span className="block w-5 h-0.5 bg-white" />
          </button>
        </div>
      </div>

      {/* Mobile backdrop */}
      {navOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setNavOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative inset-y-0 left-0 z-50
          w-56 flex-shrink-0 flex flex-col
          transform transition-transform duration-200 ease-in-out
          md:translate-x-0 md:transform-none
          ${navOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ backgroundColor: '#0D0D0D', borderRight: '0.5px solid #1E1E1E' }}
      >
        {/* Logo */}
        <div className="px-6 py-7 flex items-center justify-between" style={{ borderBottom: '3px solid #F56E0F' }}>
          <div>
            <h1 className="font-display font-bold text-[15px] tracking-[-0.02em] text-white">
              KENO <span style={{ color: '#F56E0F' }}>SONIC</span>
            </h1>
            <p className="font-body font-medium text-[8px] uppercase tracking-[0.15em] mt-1" style={{ color: '#5A5A5A' }}>
              Studio OS
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Bell — desktop */}
            <button
              onClick={openNotifications}
              className="relative hidden md:flex items-center justify-center text-[#5A5A5A] hover:text-white transition-colors p-1"
              aria-label="Notifications"
            >
              <BellIcon />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 font-body font-medium text-[8px] leading-none px-1 py-0.5 rounded-full"
                  style={{ backgroundColor: '#F56E0F', color: '#fff', minWidth: '14px', textAlign: 'center' }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setNavOpen(false)}
              className="md:hidden text-white text-[20px] leading-none p-1"
              aria-label="Close menu"
            >×</button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
              onClick={() => setNavOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-ks font-body font-medium text-[10px] uppercase tracking-[0.1em] transition-colors ${
                  isActive
                    ? 'text-white bg-white/10'
                    : 'text-[#5A5A5A] hover:text-white hover:bg-white/5'
                }`
              }
            >
              <span className="text-ks-lava text-[8px]">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 pb-6" style={{ borderTop: '0.5px solid #1E1E1E' }}>
          <div className="pt-5">
            <p className="font-body text-[11px] text-white mb-1 truncate">{profile?.full_name}</p>
            <p className="font-body text-[9px] uppercase tracking-[0.1em]" style={{ color: '#5A5A5A' }}>Admin</p>
            <button
              onClick={handleSignOut}
              className="mt-3 font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-lava hover:text-white transition-colors"
            >Sign Out</button>
          </div>
        </div>
      </aside>

      {/* Main — offset top on mobile for the fixed header */}
      <main className="flex-1 bg-ks-ash min-h-screen overflow-auto pt-14 md:pt-0">
        {children}
      </main>

      {/* Notifications panel */}
      {notifOpen && (
        <NotificationsPanel
          groups={groups}
          unreadCount={unreadCount}
          loading={loading}
          onClose={() => setNotifOpen(false)}
          onMarkAllRead={() => { markAllRead(); }}
        />
      )}
    </div>
  )
}
