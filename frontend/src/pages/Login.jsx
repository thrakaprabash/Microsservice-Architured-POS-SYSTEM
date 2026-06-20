import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/auth.api'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const { addToast } = useUIStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      addToast('error', 'Please enter email and password')
      return
    }
    setLoading(true)
    try {
      const res = await login(email, password)
      const { user, token } = res.data
      setAuth(user, token)
      addToast('success', `Welcome back, ${user.name || 'User'}!`)
      navigate('/')
    } catch (err) {
      addToast('error', err.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg" />

      {/* Floating accent blobs */}
      <div style={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.12), transparent)',
        top: '10%', left: '20%', filter: 'blur(60px)', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', width: 250, height: 250, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.1), transparent)',
        bottom: '15%', right: '15%', filter: 'blur(60px)', pointerEvents: 'none'
      }} />

      <div className="login-card">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'linear-gradient(135deg, var(--accent-primary), #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(16,185,129,0.35)'
          }}>
            ✦
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
            POS System
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Sign in to your account to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
            id="login-submit-btn"
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 18, height: 18 }} />
                Signing in...
              </>
            ) : (
              '→ Sign In'
            )}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Smart Point of Sale v1.0 • Secure & Reliable
          </p>
        </div>
      </div>
    </div>
  )
}
