import React, { useState, useEffect } from 'react'
import { getUsers, register, updateUser, deactivateUser } from '../api/auth.api'
import { useUIStore } from '../store/uiStore'

export default function Settings() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const { addToast } = useUIStore()

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await getUsers()
      setUsers(res.data?.data?.users || [])
    } catch (err) {
      addToast('error', err.response?.data?.message || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      if (currentStatus) {
        await deactivateUser(id)
      } else {
        await updateUser(id, { isActive: true })
      }
      addToast('success', `User ${currentStatus ? 'deactivated' : 'activated'}`)
      fetchUsers()
    } catch (err) {
      addToast('error', err.response?.data?.message || 'Failed to update user status')
    }
  }

  const handleRoleChange = async (id, newRole) => {
    try {
      await updateUser(id, { role: newRole })
      addToast('success', 'User role updated')
      fetchUsers()
    } catch (err) {
      addToast('error', err.response?.data?.message || 'Failed to update user role')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-[var(--font-outfit)] text-[28px] font-bold text-white tracking-tight m-0">Users & Settings</h1>
        <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[14px] font-medium rounded-lg bg-[var(--color-accent-primary)] text-white hover:bg-[var(--color-accent-primary-dark)] transition-colors border-none cursor-pointer" onClick={() => setShowAddModal(true)}>
          + Add User
        </button>
      </div>

      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-xl overflow-hidden mb-6">
        <div className="overflow-x-auto bg-[var(--color-bg-primary)] border-none rounded-none">
          <table className="w-full min-w-[600px] border-collapse text-left text-[14px]">
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]">
                <th className="p-3 font-semibold text-[13px] text-[var(--color-text-secondary)] uppercase tracking-[0.05em]">Name</th>
                <th className="p-3 font-semibold text-[13px] text-[var(--color-text-secondary)] uppercase tracking-[0.05em]">Email</th>
                <th className="p-3 font-semibold text-[13px] text-[var(--color-text-secondary)] uppercase tracking-[0.05em]">Role</th>
                <th className="p-3 font-semibold text-[13px] text-[var(--color-text-secondary)] uppercase tracking-[0.05em]">Status</th>
                <th className="p-3 font-semibold text-[13px] text-[var(--color-text-secondary)] uppercase tracking-[0.05em]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center p-8">
                    <span className="inline-block w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center p-8 text-[var(--color-text-secondary)]">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user._id} className="border-b border-[var(--color-border-subtle)] last:border-0 hover:bg-[var(--color-bg-hover)] transition-colors">
                    <td className="p-3 font-medium">{user.name}</td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3">
                      <select 
                        className="bg-[var(--color-bg-primary)] text-white border border-[var(--color-border-color)] rounded-[var(--radius-sm)] px-2 py-1 text-[13px] outline-none transition-all focus:border-[var(--color-accent-primary)] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] w-auto" 
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      >
                        <option value="admin">Admin</option>
                        <option value="cashier">Cashier</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded border ${user.isActive ? 'bg-[rgba(16,185,129,0.15)] text-[#34d399] border-[rgba(16,185,129,0.3)]' : 'bg-[rgba(239,68,68,0.15)] text-[#f87171] border-[rgba(239,68,68,0.3)]'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3">
                      <button 
                        className={`inline-flex items-center justify-center gap-2 px-3.5 py-1.5 text-[13px] font-medium rounded-lg transition-colors border-none cursor-pointer ${user.isActive ? 'bg-[var(--color-accent-danger)] text-white hover:bg-red-600' : 'bg-[var(--color-accent-primary)] text-white hover:bg-[var(--color-accent-primary-dark)]'}`}
                        onClick={() => handleToggleStatus(user._id, user.isActive)}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <AddUserModal 
          onClose={() => setShowAddModal(false)} 
          onSuccess={() => {
            setShowAddModal(false)
            fetchUsers()
          }} 
        />
      )}
    </div>
  )
}

function AddUserModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'cashier' })
  const [loading, setLoading] = useState(false)
  const { addToast } = useUIStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      await register(formData)
      addToast('success', 'User added successfully')
      onSuccess()
    } catch (err) {
      addToast('error', err.response?.data?.message || 'Failed to add user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] shadow-[0_8px_32px_rgba(0,0,0,0.5)] w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border-subtle)] shrink-0 bg-[var(--color-bg-secondary)]">
          <h3 className="m-0 font-[var(--font-outfit)] text-xl font-bold">Add New User</h3>
          <button className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-white cursor-pointer transition-colors text-lg" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 overflow-y-auto flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[var(--color-text-secondary)]">Name</label>
            <input 
              required 
              className="bg-[var(--color-bg-primary)] text-white border border-[var(--color-border-color)] rounded-[var(--radius-sm)] px-3.5 py-2.5 text-[14px] w-full outline-none transition-all focus:border-[var(--color-accent-primary)] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] placeholder:text-[var(--color-text-muted)]" 
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
            
            <label className="text-[13px] font-medium text-[var(--color-text-secondary)] mt-3">Email</label>
            <input 
              required 
              type="email" 
              className="bg-[var(--color-bg-primary)] text-white border border-[var(--color-border-color)] rounded-[var(--radius-sm)] px-3.5 py-2.5 text-[14px] w-full outline-none transition-all focus:border-[var(--color-accent-primary)] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] placeholder:text-[var(--color-text-muted)]"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />

            <label className="text-[13px] font-medium text-[var(--color-text-secondary)] mt-3">Password</label>
            <input 
              required 
              type="password" 
              className="bg-[var(--color-bg-primary)] text-white border border-[var(--color-border-color)] rounded-[var(--radius-sm)] px-3.5 py-2.5 text-[14px] w-full outline-none transition-all focus:border-[var(--color-accent-primary)] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] placeholder:text-[var(--color-text-muted)]"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />

            <label className="text-[13px] font-medium text-[var(--color-text-secondary)] mt-3">Role</label>
            <select 
              className="bg-[var(--color-bg-primary)] text-white border border-[var(--color-border-color)] rounded-[var(--radius-sm)] px-3.5 py-2.5 text-[14px] w-full outline-none transition-all focus:border-[var(--color-accent-primary)] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] placeholder:text-[var(--color-text-muted)]"
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="cashier">Cashier</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-3 p-5 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] shrink-0">
            <button type="button" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[14px] font-medium rounded-lg bg-[var(--color-bg-hover)] border border-[var(--color-border-color)] text-[var(--color-text-primary)] hover:border-[var(--color-text-muted)] transition-colors cursor-pointer disabled:opacity-50" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[14px] font-medium rounded-lg bg-[var(--color-accent-primary)] text-white hover:bg-[var(--color-accent-primary-dark)] transition-colors border-none cursor-pointer disabled:opacity-50" disabled={loading}>
              {loading ? <span className="inline-block w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
