import React, { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend
} from 'recharts'
import { getSummary, getWeeklyReport, getTopProducts, getRevenueByMethod } from '../api/report.api'
import { useUIStore } from '../store/uiStore'

function formatLKR(amount) {
  return `Rs. ${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#a855f7']

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
        borderRadius: 8, padding: '10px 14px', fontSize: 13
      }}>
        <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, fontWeight: 600 }}>
            {formatLKR(p.value)}
          </div>
        ))}
      </div>
    )
  }
  return null
}

const PieCustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
        borderRadius: 8, padding: '10px 14px', fontSize: 13
      }}>
        <div style={{ color: payload[0].payload.fill, fontWeight: 600 }}>{payload[0].name}</div>
        <div style={{ color: 'var(--text-primary)' }}>{formatLKR(payload[0].value)}</div>
      </div>
    )
  }
  return null
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState('today')
  const [summary, setSummary] = useState(null)
  const [weeklyData, setWeeklyData] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [revenueByMethod, setRevenueByMethod] = useState([])
  const [loading, setLoading] = useState(true)
  const { addToast } = useUIStore()

  const loadData = async (tab) => {
    setLoading(true)
    try {
      const now = new Date()
      let start, end
      if (tab === 'today') {
        start = now.toISOString().split('T')[0]
        end = start
      } else if (tab === 'week') {
        const d = new Date(now)
        d.setDate(d.getDate() - 6)
        start = d.toISOString().split('T')[0]
        end = now.toISOString().split('T')[0]
      } else {
        const d = new Date(now)
        d.setDate(1)
        start = d.toISOString().split('T')[0]
        end = now.toISOString().split('T')[0]
      }

      const [summaryRes, weeklyRes, topRes, methodRes] = await Promise.all([
        getSummary(),
        getWeeklyReport(start, end),
        getTopProducts({ start, end }),
        getRevenueByMethod({ start, end })
      ])

      setSummary(summaryRes.data)
      // Normalize weekly data for recharts
      const wData = weeklyRes.data.data || weeklyRes.data || []
      setWeeklyData(Array.isArray(wData) ? wData : [])
      setTopProducts(topRes.data.products || topRes.data || [])

      // Normalize pie data
      const methodData = methodRes.data.data || methodRes.data || []
      setRevenueByMethod(Array.isArray(methodData) ? methodData : [])
    } catch (err) {
      addToast('error', 'Failed to load report data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData(activeTab) }, [activeTab])

  const tabs = [
    { key: 'today', label: '📅 Today' },
    { key: 'week', label: '📆 This Week' },
    { key: 'month', label: '🗓️ This Month' }
  ]

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📊 Reports</h1>
        <div className="tabs" style={{ width: 'auto' }}>
          {tabs.map(t => (
            <button
              key={t.key}
              className={`tab-btn ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
              id={`reports-tab-${t.key}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-icon">💰</span>
              <span className="stat-label">Today's Revenue</span>
              <span className="stat-value text-success">{formatLKR(summary?.todayRevenue)}</span>
              <span className="stat-sub">From completed orders</span>
            </div>
            <div className="stat-card">
              <span className="stat-icon">🛒</span>
              <span className="stat-label">Today's Orders</span>
              <span className="stat-value">{summary?.todayOrders || 0}</span>
              <span className="stat-sub">Total transactions</span>
            </div>
            <div className="stat-card">
              <span className="stat-icon">📈</span>
              <span className="stat-label">This Week Revenue</span>
              <span className="stat-value text-success">{formatLKR(summary?.weekRevenue)}</span>
              <span className="stat-sub">Last 7 days</span>
            </div>
            <div className="stat-card">
              <span className="stat-icon">⭐</span>
              <span className="stat-label">Top Product</span>
              <span className="stat-value" style={{ fontSize: 18 }}>
                {summary?.topProduct?.name || 'N/A'}
              </span>
              <span className="stat-sub">{summary?.topProduct?.units || 0} units sold</span>
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
            {/* Bar Chart */}
            <div className="chart-container">
              <div className="chart-title">📊 Revenue by Day</div>
              {weeklyData.length === 0 ? (
                <div className="empty-state" style={{ padding: 24 }}>
                  <div style={{ fontSize: 32 }}>📊</div>
                  <div style={{ fontSize: 13, marginTop: 8 }}>No revenue data for this period</div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      axisLine={{ stroke: '#334155' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={v => `Rs.${(v/1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Pie Chart */}
            <div className="chart-container">
              <div className="chart-title">💳 Payment Split</div>
              {revenueByMethod.length === 0 ? (
                <div className="empty-state" style={{ padding: 24 }}>
                  <div style={{ fontSize: 32 }}>🥧</div>
                  <div style={{ fontSize: 13, marginTop: 8 }}>No payment data</div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={revenueByMethod}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="name"
                    >
                      {revenueByMethod.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieCustomTooltip />} />
                    <Legend
                      formatter={(val) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{val}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top Products Table */}
          <div className="section-card">
            <div className="section-card-header">
              <span className="section-card-title">🏆 Top Products</span>
            </div>
            {topProducts.length === 0 ? (
              <div className="empty-state" style={{ padding: 24 }}>
                <div style={{ fontSize: 32 }}>🏆</div>
                <div style={{ fontSize: 13, marginTop: 8 }}>No product data for this period</div>
              </div>
            ) : (
              <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Product</th>
                      <th>Units Sold</th>
                      <th style={{ textAlign: 'right' }}>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((p, idx) => (
                      <tr key={p._id || idx}>
                        <td>
                          <span style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: idx === 0 ? 'rgba(245,158,11,0.2)' : idx === 1 ? 'rgba(148,163,184,0.2)' : idx === 2 ? 'rgba(180,120,80,0.2)' : 'var(--bg-hover)',
                            color: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b47850' : 'var(--text-muted)',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 700
                          }}>
                            {idx + 1}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500 }}>{p.name}</td>
                        <td>
                          <span style={{ fontWeight: 600 }}>{p.unitsSold || p.quantity || 0}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}> units</span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent-primary)' }}>
                          {formatLKR(p.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
