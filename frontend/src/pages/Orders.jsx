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
  pending: 'bg-[rgba(245,158,11,0.15)] text-[#fbbf24] border-[rgba(245,158,11,0.3)]',
  completed: 'bg-[rgba(16,185,129,0.15)] text-[#34d399] border-[rgba(16,185,129,0.3)]',
  cancelled: 'bg-[rgba(239,68,68,0.15)] text-[#f87171] border-[rgba(239,68,68,0.3)]',
  refunded: 'bg-[rgba(59,130,246,0.15)] text-[#60a5fa] border-[rgba(59,130,246,0.3)]'
}

const METHOD_COLORS = {
  cash: 'bg-[rgba(16,185,129,0.15)] text-[#34d399] border-[rgba(16,185,129,0.3)]',
  card: 'bg-[rgba(59,130,246,0.15)] text-[#60a5fa] border-[rgba(59,130,246,0.3)]',
  stripe: 'bg-[rgba(59,130,246,0.15)] text-[#60a5fa] border-[rgba(59,130,246,0.3)]'
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
    <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] shadow-[0_8px_32px_rgba(0,0,0,0.5)] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" id="order-detail-modal">
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border-subtle)] shrink-0 bg-[var(--color-bg-secondary)]">
          <h3 className="m-0 font-[var(--font-outfit)] text-xl font-bold">📋 Order Details</h3>
          <button className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-white cursor-pointer transition-colors text-lg" onClick={onClose} id="order-detail-close">×</button>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <div className="text-[12px] text-[var(--color-text-muted)] mb-1">Order Number</div>
              <div className="font-bold font-[var(--font-outfit)] text-[18px]">
                #{order.orderNumber || order._id?.slice(-8).toUpperCase()}
              </div>
            </div>
            <div>
              <div className="text-[12px] text-[var(--color-text-muted)] mb-1">Date</div>
              <div className="font-medium">{formatDate(order.createdAt)}</div>
            </div>
            <div>
              <div className="text-[12px] text-[var(--color-text-muted)] mb-1">Cashier</div>
              <div className="font-medium">{order.cashier?.name || 'Staff'}</div>
            </div>
            <div>
              <div className="text-[12px] text-[var(--color-text-muted)] mb-1">Status</div>
              <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded border ${STATUS_COLORS[status] || 'bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)]'}`}>
                {status}
              </span>
            </div>
          </div>

          {isAdmin && (
            <div className="mb-5">
              <div className="text-[12px] text-[var(--color-text-muted)] mb-2">Change Status</div>
              <div className="flex gap-2">
                {['pending', 'completed', 'cancelled', 'refunded'].map(s => (
                  <button
                    key={s}
                    className={`inline-flex items-center justify-center gap-2 px-3.5 py-1.5 text-[13px] font-medium rounded-lg transition-colors cursor-pointer ${status === s ? 'bg-[var(--color-accent-primary)] text-white border-none' : 'bg-[var(--color-bg-hover)] border border-[var(--color-border-color)] text-[var(--color-text-primary)] hover:border-[var(--color-text-muted)]'}`}
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

          <div className="h-[1px] w-full bg-[var(--color-border-subtle)] my-4" />

          {/* Items Table */}
          <div className="overflow-x-auto bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] rounded-xl">
            <table className="w-full min-w-[600px] border-collapse text-left text-[14px]">
              <thead>
                <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]">
                  <th className="p-3 font-semibold text-[13px] text-[var(--color-text-secondary)] uppercase tracking-[0.05em]">Item</th>
                  <th className="p-3 font-semibold text-[13px] text-[var(--color-text-secondary)] uppercase tracking-[0.05em]">Price</th>
                  <th className="p-3 font-semibold text-[13px] text-[var(--color-text-secondary)] uppercase tracking-[0.05em]">Qty</th>
                  <th className="p-3 font-semibold text-[13px] text-[var(--color-text-secondary)] uppercase tracking-[0.05em] text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((item, idx) => (
                  <tr key={idx} className="border-b border-[var(--color-border-subtle)] last:border-0 hover:bg-[var(--color-bg-hover)] transition-colors">
                    <td className="p-3">{item.name || item.product?.name || 'Item'}</td>
                    <td className="p-3">{formatLKR(item.price)}</td>
                    <td className="p-3">{item.quantity}</td>
                    <td className="p-3 text-right">
                      {formatLKR(item.subtotal || item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end">
            <div className="min-w-[200px]">
              <div className="flex justify-between text-[14px] mb-2">
                <span className="text-[var(--color-text-secondary)]">Payment Method</span>
                <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded border ${METHOD_COLORS[order.paymentMethod] || 'bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)]'}`}>
                  {order.paymentMethod || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between font-[var(--font-outfit)] text-[20px] font-bold text-[var(--color-accent-primary)]">
                <span>Total</span>
                <span>{formatLKR(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] shrink-0">
          <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[14px] font-medium rounded-lg bg-[var(--color-bg-hover)] border border-[var(--color-border-color)] text-[var(--color-text-primary)] hover:border-[var(--color-text-muted)] transition-colors cursor-pointer" onClick={onClose}>Close</button>
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-[var(--font-outfit)] text-[28px] font-bold text-white tracking-tight m-0">📋 Orders</h1>
        <span className="text-[var(--color-text-muted)] text-[14px]">
          {orders.length} order{orders.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <select
          className="bg-[var(--color-bg-primary)] text-white border border-[var(--color-border-color)] rounded-[var(--radius-sm)] px-3.5 py-2.5 text-[14px] outline-none transition-all focus:border-[var(--color-accent-primary)] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] placeholder:text-[var(--color-text-muted)] w-auto min-w-[140px]"
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
          className="bg-[var(--color-bg-primary)] text-white border border-[var(--color-border-color)] rounded-[var(--radius-sm)] px-3.5 py-2.5 text-[14px] outline-none transition-all focus:border-[var(--color-accent-primary)] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] placeholder:text-[var(--color-text-muted)] w-auto"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          id="orders-date-from"
        />
        <input
          type="date"
          className="bg-[var(--color-bg-primary)] text-white border border-[var(--color-border-color)] rounded-[var(--radius-sm)] px-3.5 py-2.5 text-[14px] outline-none transition-all focus:border-[var(--color-accent-primary)] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] placeholder:text-[var(--color-text-muted)] w-auto"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          id="orders-date-to"
        />
        <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[14px] font-medium rounded-lg bg-[var(--color-bg-hover)] border border-[var(--color-border-color)] text-[var(--color-text-primary)] hover:border-[var(--color-text-muted)] transition-colors cursor-pointer" onClick={loadOrders} id="orders-refresh-btn">
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center p-12">
          <span className="inline-block w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="text-[64px] mb-4 opacity-50">📋</div>
          <div className="font-medium text-[var(--color-text-secondary)] mb-1">No orders found</div>
          <div className="text-[13px] text-[var(--color-text-muted)]">Orders will appear here after checkout</div>
        </div>
      ) : (
        <div className="overflow-x-auto bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] rounded-xl">
          <table className="w-full min-w-[600px] border-collapse text-left text-[14px]">
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]">
                <th className="p-3 font-semibold text-[13px] text-[var(--color-text-secondary)] uppercase tracking-[0.05em]">Order #</th>
                <th className="p-3 font-semibold text-[13px] text-[var(--color-text-secondary)] uppercase tracking-[0.05em]">Cashier</th>
                <th className="p-3 font-semibold text-[13px] text-[var(--color-text-secondary)] uppercase tracking-[0.05em]">Items</th>
                <th className="p-3 font-semibold text-[13px] text-[var(--color-text-secondary)] uppercase tracking-[0.05em]">Total</th>
                <th className="p-3 font-semibold text-[13px] text-[var(--color-text-secondary)] uppercase tracking-[0.05em]">Method</th>
                <th className="p-3 font-semibold text-[13px] text-[var(--color-text-secondary)] uppercase tracking-[0.05em]">Status</th>
                <th className="p-3 font-semibold text-[13px] text-[var(--color-text-secondary)] uppercase tracking-[0.05em]">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id} onClick={() => setSelectedOrder(order)} id={`order-row-${order._id}`} className="border-b border-[var(--color-border-subtle)] last:border-0 hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer">
                  <td className="p-3 font-bold">
                    #{order.orderNumber || order._id?.slice(-8).toUpperCase()}
                  </td>
                  <td className="p-3">{order.cashier?.name || 'Staff'}</td>
                  <td className="p-3">
                    <span className="bg-[var(--color-bg-hover)] rounded-full px-2.5 py-0.5 text-[12px] font-semibold">
                      {(order.items || []).length} items
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-[var(--color-accent-primary)]">
                    {formatLKR(order.total)}
                  </td>
                  <td className="p-3">
                    <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded border ${METHOD_COLORS[order.paymentMethod] || 'bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)]'}`}>
                      {order.paymentMethod || 'N/A'}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded border ${STATUS_COLORS[order.status] || 'bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)]'}`}>
                      {order.status || 'pending'}
                    </span>
                  </td>
                  <td className="p-3 text-[var(--color-text-secondary)] text-[13px]">
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
