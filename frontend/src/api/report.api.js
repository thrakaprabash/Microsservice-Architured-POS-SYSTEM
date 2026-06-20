import api from './axios'

export const getSummary = () =>
  api.get('/reports/summary')

export const getDailyReport = (date) =>
  api.get('/reports/daily', { params: { date } })

export const getWeeklyReport = (start, end) =>
  api.get('/reports/weekly', { params: { start, end } })

export const getTopProducts = (params = {}) =>
  api.get('/reports/top-products', { params })

export const getRevenueByMethod = (params = {}) =>
  api.get('/reports/revenue-by-method', { params })
