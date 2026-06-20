import api from './axios'

export const getProducts = (params = {}) =>
  api.get('/products', { params })

export const getProductById = (id) =>
  api.get(`/products/${id}`)

export const createProduct = (data) =>
  api.post('/products', data)

export const updateProduct = (id, data) =>
  api.put(`/products/${id}`, data)

export const deleteProduct = (id) =>
  api.delete(`/products/${id}`)

export const getCategories = () =>
  api.get('/products/categories')

export const createCategory = (data) =>
  api.post('/products/categories', data)

export const updateCategory = (id, data) =>
  api.put(`/products/categories/${id}`, data)

export const deleteCategory = (id) =>
  api.delete(`/products/categories/${id}`)

export const updateStock = (id, qty, op) =>
  api.patch(`/products/${id}/stock`, { quantity: qty, operation: op })
