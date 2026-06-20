import api from './axios'

export const createPaymentIntent = (orderId, amount) =>
  api.post('/payments/create-intent', { orderId, amount })

export const confirmPayment = (paymentIntentId) =>
  api.post('/payments/confirm', { paymentIntentId })

export const processCashPayment = (orderId, amount, cashReceived) =>
  api.post('/payments/cash', { orderId, amount, cashReceived })
