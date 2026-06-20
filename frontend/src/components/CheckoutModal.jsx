import React, { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useCartStore } from '../store/cartStore'
import { createOrder } from '../api/order.api'
import { createPaymentIntent, confirmPayment, processCashPayment } from '../api/payment.api'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder')

function formatLKR(amount) {
  return `Rs. ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Stripe card payment inner form
function CardPaymentForm({ orderId, total, onSuccess, onError }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  const handlePay = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    try {
      const intentRes = await createPaymentIntent(orderId, total)
      const { clientSecret } = intentRes.data
      const cardEl = elements.getElement(CardElement)
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardEl }
      })
      if (error) {
        onError(error.message)
      } else if (paymentIntent.status === 'succeeded') {
        await confirmPayment(paymentIntent.id)
        onSuccess({ method: 'card', paymentIntentId: paymentIntent.id })
      }
    } catch (err) {
      onError(err.response?.data?.message || 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  const cardStyle = {
    style: {
      base: {
        color: '#f1f5f9',
        fontFamily: 'Inter, sans-serif',
        fontSize: '15px',
        '::placeholder': { color: '#64748b' },
        iconColor: '#94a3b8'
      },
      invalid: { color: '#ef4444' }
    }
  }

  return (
    <form onSubmit={handlePay}>
      <div style={{
        background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)', padding: '14px 16px', marginBottom: 20
      }}>
        <CardElement options={cardStyle} />
      </div>
      <button
        type="submit"
        className="btn btn-primary btn-block btn-lg"
        disabled={!stripe || loading}
        id="card-pay-btn"
      >
        {loading ? <span className="spinner" /> : `💳 Pay ${formatLKR(total)}`}
      </button>
    </form>
  )
}

export default function CheckoutModal({ onClose, onSuccess }) {
  const { items, getTotal } = useCartStore()
  const { user } = useAuthStore()
  const { addToast } = useUIStore()
  const total = getTotal()

  const [activeTab, setActiveTab] = useState('cash')
  const [cashReceived, setCashReceived] = useState('')
  const [loading, setLoading] = useState(false)
  const [createdOrder, setCreatedOrder] = useState(null)
  const [clientSecret, setClientSecret] = useState(null)

  // Create order on mount
  useEffect(() => {
    const createTheOrder = async () => {
      try {
        const orderData = {
          items: items.map(i => ({ product: i.productId, quantity: i.quantity, price: i.price })),
          total,
          cashier: user?._id
        }
        const res = await createOrder(orderData)
        setCreatedOrder(res.data.order || res.data)
      } catch (err) {
        addToast('error', err.response?.data?.message || 'Failed to create order')
        onClose()
      }
    }
    createTheOrder()
  }, [])

  const change = parseFloat(cashReceived) - total
  const cashSufficient = parseFloat(cashReceived) >= total

  const handleCashPayment = async () => {
    if (!createdOrder || !cashSufficient) return
    setLoading(true)
    try {
      await processCashPayment(createdOrder._id, total, parseFloat(cashReceived))
      onSuccess({
        order: createdOrder,
        method: 'cash',
        cashReceived: parseFloat(cashReceived),
        change
      })
    } catch (err) {
      addToast('error', err.response?.data?.message || 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCardSuccess = (data) => {
    onSuccess({ order: createdOrder, method: 'card', ...data })
  }

  const handleCardError = (msg) => {
    addToast('error', msg || 'Card payment failed')
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg" id="checkout-modal">
        <div className="modal-header">
          <h3>💳 Checkout</h3>
          <button className="btn-icon" onClick={onClose} id="checkout-modal-close">×</button>
        </div>
        <div className="modal-body">
          {/* Order Summary */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
              Order Summary
            </div>
            {items.map(item => (
              <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                <span>{item.name} × {item.quantity}</span>
                <span style={{ fontWeight: 500 }}>{formatLKR(item.subtotal)}</span>
              </div>
            ))}
            <div className="divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--accent-primary)' }}>
              <span>Total</span>
              <span>{formatLKR(total)}</span>
            </div>
          </div>

          {/* Payment Method Tabs */}
          <div className="payment-tabs">
            <button
              className={`payment-tab ${activeTab === 'cash' ? 'active' : ''}`}
              onClick={() => setActiveTab('cash')}
              id="cash-tab-btn"
            >
              💵 Cash
            </button>
            <button
              className={`payment-tab ${activeTab === 'card' ? 'active' : ''}`}
              onClick={() => setActiveTab('card')}
              id="card-tab-btn"
            >
              💳 Card
            </button>
          </div>

          {/* Cash Tab */}
          {activeTab === 'cash' && (
            <div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Cash Received (Rs.)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Enter amount received"
                  value={cashReceived}
                  onChange={e => setCashReceived(e.target.value)}
                  min={total}
                  step="0.01"
                  id="cash-received-input"
                />
              </div>
              {cashReceived && (
                <div style={{
                  padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                  background: cashSufficient ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${cashSufficient ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  marginBottom: 16
                }}>
                  {cashSufficient ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Change</span>
                      <span style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: 18, fontFamily: 'Outfit, sans-serif' }}>
                        {formatLKR(change)}
                      </span>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--accent-danger)', fontSize: 14 }}>
                      ⚠️ Shortfall: {formatLKR(total - parseFloat(cashReceived))}
                    </div>
                  )}
                </div>
              )}
              <button
                className="btn btn-primary btn-block btn-lg"
                disabled={!cashSufficient || loading || !createdOrder}
                onClick={handleCashPayment}
                id="process-cash-btn"
              >
                {loading ? <span className="spinner" /> : '💵 Process Cash Payment'}
              </button>
            </div>
          )}

          {/* Card Tab */}
          {activeTab === 'card' && (
            <div>
              {createdOrder ? (
                <Elements stripe={stripePromise}>
                  <CardPaymentForm
                    orderId={createdOrder._id}
                    total={total}
                    onSuccess={handleCardSuccess}
                    onError={handleCardError}
                  />
                </Elements>
              ) : (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <span className="spinner" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
