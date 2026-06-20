import React, { useState, useEffect, useCallback } from 'react'
import { getOrders, updateOrderStatus } from '../api/order.api'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'

function formatLKR(amount) {
  return `Rs. ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const STATUS_COLORS = {
  pending: 'badge-warning',
  completed: 'badge-success',
  cancelled: 'badge-danger',
  refunded: 'badge-info'
}

const METHOD_COLORS = {
  cash: 'badge-success',
  card: 'badge-info',
  stripe: 'badge-info'
}

function OrderDetailModal({ order, onClose, onStatusChange }) {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'
  const [status, setStatus] = useState(order.status)
  const [saving, setSaving] = useState(false)
  const { addToast } = useUIStore()

  const handleStatusChange = async (newStatus) => {
    setSaving(true)
    try {
      await updateOrderStatus(order._id, newStatus)
      setStatus(newStatus)
      onStatusChange && onStatusChange(order._id, newStatus)
      addToast('success', 'Order status updated')
    } catch (err) {
      addToast('error', err.response?.data?.message || 'Failed to update status')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg" id="order-detail-modal">
        <div className="modal-header">
          <h3>📋 Order Details</h3>
          <button className="btn-icon" onClick={onClose} id="order-detail-close">×</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Order Number</div>
              <div style={{ fontWeight: 700, fontFamily: 'Outfit, sans-serif', fontSize: 18 }}>
                #{order.orderNumber || order._id?.slice(-8).toUpperCase()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Date</div>
              <div style={{ fontWeight: 500 }}>{formatDate(order.createdAt)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Cashier</div>
              <div style={{ fontWeight: 500 }}>{order.cashier?.name || 'Staff'}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Status</div>
              <span className={`badge ${STATUS_COLORS[status] || 'badge-default'}`}>
                {status}
              </span>
            </div>
          </div>

          {isAdmin && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Change Status</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['pending', 'completed', 'cancelled', 'refunded'].map(s => (
                  <button
                    key={s}
                    className={`btn btn-sm ${status === s ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleStatusChange(s)}
                    disabled={saving || status === s}
                    id={`status-${s}-btn`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="divider" />

          {/* Items Table */}
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th style={{ textAlign: 'right' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.name || item.product?.name || 'Item'}</td>
                    <td>{formatLKR(item.price)}</td>
                    <td>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>
                      {formatLKR(item.subtotal || item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ minWidth: 200 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Payment Method</span>
                <span className={`badge ${METHOD_COLORS[order.paymentMethod] || 'badge-default'}`}>
                  {order.paymentMethod || 'N/A'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--accent-primary)' }}>
                <span>Total</span>
                <span>{formatLKR(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const { addToast } = useUIStore()

  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (statusFilter) params.status = statusFilter
      if (dateFrom) params.dateFrom = dateFrom
      if (dateTo) params.dateTo = dateTo
      const res = await getOrders(params)
      setOrders(res.data.orders || res.data || [])
    } catch (err) {
      addToast('error', 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, dateFrom, dateTo])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const handleStatusChange = (orderId, newStatus) => {
    setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o))
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📋 Orders</h1>
        <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          {orders.length} order{orders.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select
          className="form-input"
          style={{ width: 'auto', minWidth: 140 }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          id="orders-status-filter"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </select>
        <input
          type="date"
          className="form-input"
          style={{ width: 'auto' }}
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          id="orders-date-from"
        />
        <input
          type="date"
          className="form-input"
          style={{ width: 'auto' }}
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          id="orders-date-to"
        />
        <button className="btn btn-secondary" onClick={loadOrders} id="orders-refresh-btn">
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div style={{ fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>No orders found</div>
          <div style={{ fontSize: 13 }}>Orders will appear here after checkout</div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Cashier</th>
                <th>Items</th>
                <th>Total</th>
                <th>Method</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id} onClick={() => setSelectedOrder(order)} id={`order-row-${order._id}`}>
                  <td style={{ fontWeight: 700 }}>
                    #{order.orderNumber || order._id?.slice(-8).toUpperCase()}
                  </td>
                  <td>{order.cashier?.name || 'Staff'}</td>
                  <td>
                    <span style={{
                      background: 'var(--bg-hover)', borderRadius: 999,
                      padding: '2px 10px', fontSize: 12, fontWeight: 600
                    }}>
                      {(order.items || []).length} items
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                    {formatLKR(order.total)}
                  </td>
                  <td>
                    <span className={`badge ${METHOD_COLORS[order.paymentMethod] || 'badge-default'}`}>
                      {order.paymentMethod || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${STATUS_COLORS[order.status] || 'badge-default'}`}>
                      {order.status || 'pending'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                    {formatDate(order.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}
