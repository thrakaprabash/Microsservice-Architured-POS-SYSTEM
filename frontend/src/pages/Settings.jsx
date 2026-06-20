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
      <div className="page-header">
        <h1 className="page-title">Users & Settings</h1>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + Add User
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="empty-state">
                    <div className="spinner"></div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-state">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <select 
                        className="form-input" 
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        style={{ padding: '4px 8px', width: 'auto' }}
                      >
                        <option value="admin">Admin</option>
                        <option value="cashier">Cashier</option>
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className={`btn btn-sm ${user.isActive ? 'btn-danger' : 'btn-primary'}`}
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
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Add New User</h3>
          <button className="btn btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body form-group">
            <label className="form-label">Name</label>
            <input 
              required 
              className="form-input" 
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
            
            <label className="form-label" style={{ marginTop: '12px' }}>Email</label>
            <input 
              required 
              type="email" 
              className="form-input"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />

            <label className="form-label" style={{ marginTop: '12px' }}>Password</label>
            <input 
              required 
              type="password" 
              className="form-input"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />

            <label className="form-label" style={{ marginTop: '12px' }}>Role</label>
            <select 
              className="form-input"
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="cashier">Cashier</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
