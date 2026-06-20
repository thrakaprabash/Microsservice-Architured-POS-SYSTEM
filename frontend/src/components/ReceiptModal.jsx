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
    <div className="modal-overlay">
      <div className="modal" id="receipt-modal">
        <div className="modal-header no-print">
          <h3>🧾 Receipt</h3>
          <button className="btn-icon" onClick={onClose} id="receipt-close-btn">×</button>
        </div>
        <div className="modal-body">
          <div className="receipt">
            {/* Header */}
            <div className="receipt-header">
              <div style={{ fontSize: 28, marginBottom: 8 }}>✦</div>
              <div className="receipt-shop-name">POS System</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Smart Point of Sale
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                {formatDateTime(order?.createdAt)}
              </div>
            </div>

            <hr className="receipt-divider" />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span style={{ color: 'var(--text-muted)' }}>Order #</span>
              <span style={{ fontWeight: 700 }}>{orderNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>Cashier</span>
              <span>{order?.cashier?.name || 'Staff'}</span>
            </div>

            <hr className="receipt-divider" />

            {/* Items */}
            <div style={{ marginBottom: 8 }}>
              {items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{item.name || item.product?.name || 'Item'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {formatLKR(item.price)} × {item.quantity}
                    </div>
                  </div>
                  <span style={{ fontWeight: 500, alignSelf: 'flex-end' }}>
                    {formatLKR(item.subtotal || item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <hr className="receipt-divider" />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
              <span>{formatLKR(total)}</span>
            </div>

            <div className="receipt-total-row">
              <span>Total</span>
              <span>{formatLKR(total)}</span>
            </div>

            <hr className="receipt-divider" />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: 'var(--text-muted)' }}>Payment Method</span>
              <span className={`badge ${method === 'cash' ? 'badge-success' : 'badge-info'}`}>
                {method === 'cash' ? '💵 Cash' : '💳 Card'}
              </span>
            </div>

            {method === 'cash' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Amount Paid</span>
                  <span>{formatLKR(cashReceived)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Change</span>
                  <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{formatLKR(change || 0)}</span>
                </div>
              </>
            )}

            <hr className="receipt-divider" />

            <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 600, color: 'var(--accent-primary)', marginBottom: 4 }}>
              🎉 Thank You!
            </div>
            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
              Please come again
            </div>
          </div>
        </div>

        <div className="modal-footer no-print">
          <button className="btn btn-secondary" onClick={handlePrint} id="print-receipt-btn">
            🖨️ Print Receipt
          </button>
          <button className="btn btn-primary" onClick={onNewSale} id="new-sale-btn">
            ✨ New Sale
          </button>
        </div>
      </div>
    </div>
  )
}
