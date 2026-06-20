import api from './axios'

export const login = (email, password) =>
  api.post('/auth/login', { email, password })

export const logout = () =>
  api.post('/auth/logout')

export const getMe = () =>
  api.get('/auth/me')

export const register = (data) =>
  api.post('/auth/register', data)

export const getUsers = () =>
  api.get('/auth/users')

export const createUser = (data) =>
  api.post('/auth/users', data)

export const updateUser = (userId, data) =>
  api.patch(`/auth/users/${userId}`, data)

export const deactivateUser = (userId) =>
  api.delete(`/auth/users/${userId}`)
