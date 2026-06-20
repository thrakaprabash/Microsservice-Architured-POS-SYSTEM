import React from 'react'
import { useCartStore } from '../store/cartStore'

function formatLKR(amount) {
  return `Rs. ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function Cart({ onCheckout }) {
  const { items, removeItem, updateQuantity, getTotal, getItemCount } = useCartStore()
  const total = getTotal()
  const count = getItemCount()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="cart-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 700 }}>Cart</span>
          {count > 0 && (
            <span
              style={{
                background: 'var(--accent-primary)', color: '#fff',
                borderRadius: 999, fontSize: 12, fontWeight: 700,
                padding: '2px 8px'
              }}
            >
              {count}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => useCartStore.getState().clearCart()}
            id="cart-clear-btn"
          >
            Clear
          </button>
        )}
      </div>

      <div className="cart-items">
        {items.length === 0 ? (
          <div className="empty-state" style={{ padding: 32 }}>
            <div className="empty-icon">🛒</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Your cart is empty
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Click on a product to add it
            </div>
          </div>
        ) : (
          items.map(item => (
            <div key={item.productId} className="cart-item">
              <div className="cart-item-info">
                <div className="cart-item-name">{item.name}</div>
                <div className="cart-item-price">{formatLKR(item.price)} each</div>
              </div>
              <div className="cart-qty-controls">
                <button
                  className="cart-qty-btn"
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  id={`qty-minus-${item.productId}`}
                >
                  −
                </button>
                <span className="cart-qty">{item.quantity}</span>
                <button
                  className="cart-qty-btn"
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  id={`qty-plus-${item.productId}`}
                >
                  +
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-primary)' }}>
                  {formatLKR(item.subtotal)}
                </span>
                <button
                  className="btn-icon"
                  style={{ width: 22, height: 22, padding: 0, fontSize: 12, borderColor: 'transparent' }}
                  onClick={() => removeItem(item.productId)}
                  id={`remove-item-${item.productId}`}
                  title="Remove item"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="cart-footer">
        <div className="divider" style={{ margin: '0 0 12px' }} />
        <div className="cart-total-row">
          <span className="cart-total-label">Subtotal</span>
          <span className="cart-total-value">{formatLKR(total)}</span>
        </div>
        <div className="cart-total-row" style={{ marginBottom: 16 }}>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16 }}>Total</span>
          <span className="cart-grand-total">{formatLKR(total)}</span>
        </div>
        <button
          className="btn btn-primary btn-block btn-lg"
          disabled={items.length === 0}
          onClick={onCheckout}
          id="checkout-btn"
        >
          💳 Checkout — {formatLKR(total)}
        </button>
      </div>
    </div>
  )
}
