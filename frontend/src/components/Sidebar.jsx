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
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">✦</div>
        <div>
          <div className="sidebar-logo-text">POS</div>
          <div className="sidebar-logo-sub">Point of Sale</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {filtered.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name || 'User'}</div>
            <div className="sidebar-user-role">{user?.role || 'cashier'}</div>
          </div>
        </div>
        <button
          className="btn btn-secondary btn-sm btn-block"
          onClick={handleLogout}
          id="sidebar-logout-btn"
        >
          🚪 Sign Out
        </button>
      </div>
    </aside>
  )
}
