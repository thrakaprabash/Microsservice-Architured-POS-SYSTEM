import React from 'react'

function formatLKR(amount) {
  return `Rs. ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDateTime(date) {
  return new Date(date || Date.now()).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function ReceiptModal({ paymentData, onClose, onNewSale }) {
  const { order, method, cashReceived, change } = paymentData || {}
  const items = order?.items || []
  const total = order?.total || 0
  const orderNumber = order?.orderNumber || order?._id?.slice(-8).toUpperCase() || 'N/A'

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] shadow-[0_8px_32px_rgba(0,0,0,0.5)] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" id="receipt-modal">
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border-subtle)] shrink-0 bg-[var(--color-bg-secondary)] print:hidden">
          <h3 className="m-0 font-[var(--font-outfit)] text-xl font-bold">🧾 Receipt</h3>
          <button className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-white cursor-pointer transition-colors text-lg" onClick={onClose} id="receipt-close-btn">×</button>
        </div>
        <div className="p-6 overflow-y-auto bg-gray-100">
          <div className="max-w-[320px] mx-auto p-6 bg-white text-black font-mono shadow-sm border border-gray-200">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="text-3xl mb-2">✦</div>
              <div className="text-xl font-bold font-sans tracking-wide uppercase mb-1">POS System</div>
              <div className="text-xs text-gray-500 mt-1">
                Smart Point of Sale
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formatDateTime(order?.createdAt)}
              </div>
            </div>

            <hr className="border-t border-dashed border-gray-300 my-3" />

            <div className="flex justify-between text-[13px] mb-1">
              <span className="text-gray-500">Order #</span>
              <span className="font-bold">{orderNumber}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-gray-500">Cashier</span>
              <span>{order?.cashier?.name || 'Staff'}</span>
            </div>

            <hr className="border-t border-dashed border-gray-300 my-3" />

            {/* Items */}
            <div className="mb-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-[13px] mb-2">
                  <div>
                    <div className="font-medium">{item.name || item.product?.name || 'Item'}</div>
                    <div className="text-[11px] text-gray-500">
                      {formatLKR(item.price)} × {item.quantity}
                    </div>
                  </div>
                  <span className="font-medium self-end">
                    {formatLKR(item.subtotal || item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <hr className="border-t border-dashed border-gray-300 my-3" />

            <div className="flex justify-between text-[13px] mb-1.5">
              <span className="text-gray-500">Subtotal</span>
              <span>{formatLKR(total)}</span>
            </div>

            <div className="flex justify-between items-center text-lg font-bold my-2">
              <span>Total</span>
              <span>{formatLKR(total)}</span>
            </div>

            <hr className="border-t border-dashed border-gray-300 my-3" />

            <div className="flex justify-between text-[13px] mb-1.5">
              <span className="text-gray-500">Payment Method</span>
              <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded border ${method === 'cash' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                {method === 'cash' ? '💵 Cash' : '💳 Card'}
              </span>
            </div>

            {method === 'cash' && (
              <>
                <div className="flex justify-between text-[13px] mb-1.5">
                  <span className="text-gray-500">Amount Paid</span>
                  <span>{formatLKR(cashReceived)}</span>
                </div>
                <div className="flex justify-between text-[13px] mb-1.5">
                  <span className="text-gray-500">Change</span>
                  <span className="font-bold">{formatLKR(change || 0)}</span>
                </div>
              </>
            )}

            <hr className="border-t border-dashed border-gray-300 my-3" />

            <div className="text-center text-[14px] font-bold mb-1">
              🎉 Thank You!
            </div>
            <div className="text-center text-[12px] text-gray-500">
              Please come again
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] shrink-0 print:hidden">
          <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[14px] font-medium rounded-lg bg-[var(--color-bg-hover)] border border-[var(--color-border-color)] text-[var(--color-text-primary)] hover:border-[var(--color-text-muted)] transition-colors cursor-pointer" onClick={handlePrint} id="print-receipt-btn">
            🖨️ Print Receipt
          </button>
          <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[14px] font-medium rounded-lg bg-[var(--color-accent-primary)] text-white hover:bg-[var(--color-accent-primary-dark)] hover:-translate-y-[1px] transition-all cursor-pointer border-none" onClick={onNewSale} id="new-sale-btn">
            ✨ New Sale
          </button>
        </div>
      </div>
    </div>
  )
}
