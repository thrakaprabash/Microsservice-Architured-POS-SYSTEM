import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
})

// Add token from localStorage as fallback
api.interceptors.request.use(config => {
  const token = localStorage.getItem('pos_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('pos_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
