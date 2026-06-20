import api from './axios'

export const getProducts = (params = {}) =>
  api.get('/products', { params })

export const getProductById = (id) =>
  api.get(`/products/${id}`)

export const createProduct = (data) =>
  api.post('/products', data)

export const updateProduct = (id, data) =>
  api.patch(`/products/${id}`, data)

export const deleteProduct = (id) =>
  api.delete(`/products/${id}`)

export const getCategories = () =>
  api.get('/categories')

export const createCategory = (data) =>
  api.post('/categories', data)

export const updateCategory = (id, data) =>
  api.patch(`/categories/${id}`, data)

export const deleteCategory = (id) =>
  api.delete(`/categories/${id}`)

export const updateStock = (id, qty, op) =>
  api.patch(`/products/${id}/stock`, { quantity: qty, operation: op })
