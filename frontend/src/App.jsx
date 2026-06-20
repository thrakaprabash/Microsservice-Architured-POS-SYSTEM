import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { getMe } from './api/auth.api'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Toast from './components/Toast'
import Login from './pages/Login'
import POS from './pages/POS'
import Orders from './pages/Orders'
import Products from './pages/Products'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

export default function App() {
  const { setAuth, isAuthenticated } = useAuthStore()

  // Restore session on app load
  useEffect(() => {
    const token = localStorage.getItem('pos_token')
    if (token && !isAuthenticated) {
      getMe()
        .then(res => {
          setAuth(res.data.user || res.data, token)
        })
        .catch(() => {
          localStorage.removeItem('pos_token')
        })
    }
  }, [])

  return (
    <BrowserRouter>
      <Toast />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <POS />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Layout>
                <Orders />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute adminOnly>
              <Layout>
                <Products />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute adminOnly>
              <Layout>
                <Reports />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute adminOnly>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
