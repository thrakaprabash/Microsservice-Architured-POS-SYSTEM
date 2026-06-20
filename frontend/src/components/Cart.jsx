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
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between shrink-0 bg-[var(--color-bg-secondary)]">
        <div className="flex items-center gap-2">
          <span className="font-[var(--font-outfit)] text-[18px] font-bold">Cart</span>
          {count > 0 && (
            <span
              className="bg-[var(--color-accent-primary)] text-white rounded-full text-xs font-bold px-2 py-0.5"
            >
              {count}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <button
            className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 text-[13px] font-medium rounded-lg bg-[var(--color-bg-hover)] border border-[var(--color-border-color)] text-[var(--color-text-primary)] hover:border-[var(--color-text-muted)] transition-colors cursor-pointer"
            onClick={() => useCartStore.getState().clearCart()}
            id="cart-clear-btn"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 h-full">
            <div className="text-[48px] mb-4 opacity-50">🛒</div>
            <div className="text-[14px] font-medium text-[var(--color-text-secondary)] mb-1">
              Your cart is empty
            </div>
            <div className="text-[12px] text-[var(--color-text-muted)]">
              Click on a product to add it
            </div>
          </div>
        ) : (
          items.map(item => (
            <div key={item.productId} className="flex items-center gap-3 p-3 bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border-subtle)]">
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold overflow-hidden text-ellipsis whitespace-nowrap mb-1">{item.name}</div>
                <div className="text-[11px] text-[var(--color-text-muted)]">{formatLKR(item.price)} each</div>
              </div>
              <div className="flex items-center gap-1 bg-[var(--color-bg-primary)] rounded-lg p-0.5 border border-[var(--color-border-subtle)]">
                <button
                  className="w-7 h-7 flex items-center justify-center rounded-md border-none bg-transparent text-[var(--color-text-primary)] font-medium cursor-pointer hover:bg-[var(--color-bg-hover)] transition-colors"
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  id={`qty-minus-${item.productId}`}
                >
                  −
                </button>
                <span className="w-6 text-center text-[13px] font-bold">{item.quantity}</span>
                <button
                  className="w-7 h-7 flex items-center justify-center rounded-md border-none bg-transparent text-[var(--color-text-primary)] font-medium cursor-pointer hover:bg-[var(--color-bg-hover)] transition-colors"
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  id={`qty-plus-${item.productId}`}
                >
                  +
                </button>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[13px] font-semibold text-[var(--color-accent-primary)]">
                  {formatLKR(item.subtotal)}
                </span>
                <button
                  className="w-[22px] h-[22px] p-0 text-[12px] rounded border border-transparent bg-transparent text-[var(--color-text-secondary)] cursor-pointer transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] flex items-center justify-center"
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

      <div className="p-4 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-subtle)] shrink-0">
        <div className="h-[1px] bg-[var(--color-border-subtle)] w-full mb-3" />
        <div className="flex justify-between items-center mb-2">
          <span className="text-[13px] text-[var(--color-text-secondary)]">Subtotal</span>
          <span className="font-semibold text-[14px]">{formatLKR(total)}</span>
        </div>
        <div className="flex justify-between items-center mb-4">
          <span className="font-[var(--font-outfit)] font-bold text-[16px]">Total</span>
          <span className="text-[20px] font-bold text-[var(--color-accent-primary)] font-[var(--font-outfit)]">{formatLKR(total)}</span>
        </div>
        <button
          className="w-full inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-medium rounded-lg bg-[var(--color-accent-primary)] text-white hover:bg-[var(--color-accent-primary-dark)] hover:-translate-y-[1px] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-none"
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

