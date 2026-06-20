import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        if (token) localStorage.setItem('pos_token', token)
        set({ user, token, isAuthenticated: true })
      },
      clearAuth: () => {
        localStorage.removeItem('pos_token')
        set({ user: null, token: null, isAuthenticated: false })
      }
    }),
    {
      name: 'pos-auth',
      partialize: (s) => ({
        user: s.user,
        token: s.token,
        isAuthenticated: s.isAuthenticated
      })
    }
  )
)
