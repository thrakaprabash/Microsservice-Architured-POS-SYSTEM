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
      const { clientSecret } = intentRes.data.data
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
      <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border-color)] rounded-[var(--radius-sm)] px-4 py-3.5 mb-5">
        <CardElement options={cardStyle} />
      </div>
      <button
        type="submit"
        className="w-full inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-medium rounded-lg bg-[var(--color-accent-primary)] text-white hover:bg-[var(--color-accent-primary-dark)] hover:-translate-y-[1px] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-none"
        disabled={!stripe || loading}
        id="card-pay-btn"
      >
        {loading ? <span className="inline-block w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : `💳 Pay ${formatLKR(total)}`}
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

  const orderCreatedRef = React.useRef(false)

  // Create order on mount
  useEffect(() => {
    if (orderCreatedRef.current) return
    orderCreatedRef.current = true

    const createTheOrder = async () => {
      try {
        const orderData = {
          items: items.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
          total,
          cashier: user?._id
        }
        const res = await createOrder(orderData)
        setCreatedOrder(res.data.data)
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
    <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] shadow-[0_8px_32px_rgba(0,0,0,0.5)] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" id="checkout-modal">
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border-subtle)] shrink-0 bg-[var(--color-bg-secondary)]">
          <h3 className="m-0 font-[var(--font-outfit)] text-xl font-bold">💳 Checkout</h3>
          <button className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-white cursor-pointer transition-colors text-lg" onClick={onClose} id="checkout-modal-close">×</button>
        </div>
        <div className="p-6 overflow-y-auto">
          {/* Order Summary */}
          <div className="mb-5">
            <div className="text-[13px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-[0.05em] mb-2.5">
              Order Summary
            </div>
            {items.map(item => (
              <div key={item.productId} className="flex justify-between text-[14px] mb-1.5">
                <span>{item.name} × {item.quantity}</span>
                <span className="font-medium">{formatLKR(item.subtotal)}</span>
              </div>
            ))}
            <div className="h-[1px] w-full bg-[var(--color-border-subtle)] my-4" />
            <div className="flex justify-between font-[var(--font-outfit)] text-xl font-bold text-[var(--color-accent-primary)]">
              <span>Total</span>
              <span>{formatLKR(total)}</span>
            </div>
          </div>

          {/* Payment Method Tabs */}
          <div className="flex gap-2 p-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] mb-6">
            <button
              className={`flex-1 py-2 px-4 rounded-md text-[13px] font-semibold cursor-pointer transition-colors border-none text-center ${activeTab === 'cash' ? 'bg-[var(--color-bg-hover)] text-white shadow-sm' : 'bg-transparent text-[var(--color-text-secondary)] hover:text-white'}`}
              onClick={() => setActiveTab('cash')}
              id="cash-tab-btn"
            >
              💵 Cash
            </button>
            <button
              className={`flex-1 py-2 px-4 rounded-md text-[13px] font-semibold cursor-pointer transition-colors border-none text-center ${activeTab === 'card' ? 'bg-[var(--color-bg-hover)] text-white shadow-sm' : 'bg-transparent text-[var(--color-text-secondary)] hover:text-white'}`}
              onClick={() => setActiveTab('card')}
              id="card-tab-btn"
            >
              💳 Card
            </button>
          </div>

          {/* Cash Tab */}
          {activeTab === 'cash' && (
            <div>
              <div className="flex flex-col gap-1.5 mb-4">
                <label className="text-[13px] font-medium text-[var(--color-text-secondary)]">Cash Received (Rs.)</label>
                <input
                  type="number"
                  className="bg-[var(--color-bg-primary)] text-white border border-[var(--color-border-color)] rounded-[var(--radius-sm)] px-3.5 py-2.5 text-[14px] w-full outline-none transition-all focus:border-[var(--color-accent-primary)] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] placeholder:text-[var(--color-text-muted)]"
                  placeholder="Enter amount received"
                  value={cashReceived}
                  onChange={e => setCashReceived(e.target.value)}
                  min={total}
                  step="0.01"
                  id="cash-received-input"
                />
              </div>
              {cashReceived && (
                <div className={`px-4 py-3 rounded-[var(--radius-sm)] mb-4 ${cashSufficient ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                  {cashSufficient ? (
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--color-text-secondary)] text-[14px]">Change</span>
                      <span className="text-[var(--color-accent-primary)] font-bold text-lg font-[var(--font-outfit)]">
                        {formatLKR(change)}
                      </span>
                    </div>
                  ) : (
                    <div className="text-[var(--color-accent-danger)] text-[14px]">
                      ⚠️ Shortfall: {formatLKR(total - parseFloat(cashReceived))}
                    </div>
                  )}
                </div>
              )}
              <button
                className="w-full inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-medium rounded-lg bg-[var(--color-accent-primary)] text-white hover:bg-[var(--color-accent-primary-dark)] hover:-translate-y-[1px] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-none"
                disabled={!cashSufficient || loading || !createdOrder}
                onClick={handleCashPayment}
                id="process-cash-btn"
              >
                {loading ? <span className="inline-block w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : '💵 Process Cash Payment'}
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
                <div className="text-center p-5">
                  <span className="inline-block w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
