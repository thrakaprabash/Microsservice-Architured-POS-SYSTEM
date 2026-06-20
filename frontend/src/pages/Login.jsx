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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[var(--color-bg-primary)]">
      <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-5 pointer-events-none mix-blend-luminosity" />

      {/* Floating accent blobs */}
      <div className="absolute w-[300px] h-[300px] rounded-full top-[10%] left-[20%] blur-[60px] pointer-events-none bg-[radial-gradient(circle,rgba(16,185,129,0.12),transparent)]" />
      <div className="absolute w-[250px] h-[250px] rounded-full bottom-[15%] right-[15%] blur-[60px] pointer-events-none bg-[radial-gradient(circle,rgba(59,130,246,0.1),transparent)]" />

      <div className="w-full max-w-[420px] bg-[rgba(30,41,59,0.85)] backdrop-blur-xl rounded-2xl border border-[rgba(255,255,255,0.08)] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-10 relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-accent-primary)] to-[#059669] flex items-center justify-center text-3xl mx-auto mb-4 shadow-[0_8px_24px_rgba(16,185,129,0.35)]">
            ✦
          </div>
          <h1 className="font-[var(--font-outfit)] text-[28px] font-extrabold mb-1.5">
            POS System
          </h1>
          <p className="text-[var(--color-text-secondary)] text-[14px]">
            Sign in to your account to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-[13px] font-medium text-[var(--color-text-secondary)]" htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              className="bg-[var(--color-bg-primary)] text-white border border-[var(--color-border-color)] rounded-[var(--radius-sm)] px-3.5 py-2.5 text-[14px] w-full outline-none transition-all focus:border-[var(--color-accent-primary)] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] placeholder:text-[var(--color-text-muted)]"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              required
            />
          </div>

          <div className="flex flex-col gap-1.5 mb-6">
            <label className="text-[13px] font-medium text-[var(--color-text-secondary)]" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="bg-[var(--color-bg-primary)] text-white border border-[var(--color-border-color)] rounded-[var(--radius-sm)] px-3.5 py-2.5 text-[14px] w-full outline-none transition-all focus:border-[var(--color-accent-primary)] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] placeholder:text-[var(--color-text-muted)]"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-medium rounded-lg bg-[var(--color-accent-primary)] text-white hover:bg-[var(--color-accent-primary-dark)] hover:-translate-y-[1px] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-none"
            disabled={loading}
            id="login-submit-btn"
          >
            {loading ? (
              <>
                <span className="inline-block w-[18px] h-[18px] border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              '→ Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[12px] text-[var(--color-text-muted)]">
            Smart Point of Sale v1.0 • Secure & Reliable
          </p>
        </div>
      </div>
    </div>
  )
}

