import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { logout } from '../api/auth.api'
import { useUIStore } from '../store/uiStore'

const navItems = [
  { path: '/', icon: '🛒', label: 'POS', exact: true },
  { path: '/orders', icon: '📋', label: 'Orders' },
  { path: '/products', icon: '📦', label: 'Products', adminOnly: true },
  { path: '/reports', icon: '📊', label: 'Reports', adminOnly: true },
  { path: '/settings', icon: '⚙️', label: 'Settings', adminOnly: true },
]

export default function Sidebar() {
  const { user, clearAuth } = useAuthStore()
  const { addToast } = useUIStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (_) {}
    clearAuth()
    addToast('success', 'Logged out successfully')
    navigate('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const filtered = navItems.filter(item =>
    !item.adminOnly || user?.role === 'admin'
  )

  return (
    <aside className="w-[240px] shrink-0 bg-[var(--color-bg-secondary)] border-r border-[var(--color-border-subtle)] flex flex-col h-screen">
      <div className="p-6 flex items-center gap-3 border-b border-[var(--color-border-subtle)]">
        <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-primary)] text-white flex items-center justify-center text-xl font-bold shrink-0">✦</div>
        <div>
          <div className="text-xl font-bold font-[var(--font-outfit)] text-white leading-tight">PABA</div>
          <div className="text-xs text-[var(--color-text-muted)]">SuperMarket</div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 flex flex-col gap-1 overflow-y-auto">
        {filtered.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors ${
                isActive
                  ? 'bg-[var(--color-bg-hover)] text-white text-[var(--color-accent-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-white'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[var(--color-bg-hover)] border border-[var(--color-border-color)] flex items-center justify-center text-sm font-bold text-white shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold overflow-hidden text-ellipsis whitespace-nowrap">{user?.name || 'User'}</div>
            <div className="text-[11px] text-[var(--color-text-muted)] capitalize">{user?.role || 'cashier'}</div>
          </div>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 px-[14px] py-[6px] text-[13px] font-medium rounded-lg w-full bg-[var(--color-bg-hover)] border border-[var(--color-border-color)] text-[var(--color-text-primary)] hover:border-[var(--color-text-muted)] transition-colors cursor-pointer"
          onClick={handleLogout}
          id="sidebar-logout-btn"
        >
          🚪 Sign Out
        </button>
      </div>
    </aside>
  )
}
