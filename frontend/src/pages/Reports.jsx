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
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-color)] rounded-lg px-3.5 py-2.5 text-[13px] shadow-lg">
        <div className="text-[var(--color-text-secondary)] mb-1">{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color }} className="font-semibold">
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
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-color)] rounded-lg px-3.5 py-2.5 text-[13px] shadow-lg">
        <div style={{ color: payload[0].payload.fill }} className="font-semibold">{payload[0].name}</div>
        <div className="text-[var(--color-text-primary)]">{formatLKR(payload[0].value)}</div>
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
        getTopProducts({ startDate: start, endDate: end }),
        getRevenueByMethod({ startDate: start, endDate: end })
      ])

      const sData = summaryRes.data.data || {}
      const wData = weeklyRes.data.data || {}
      const topP = topRes.data.data?.topProducts || []
      const mData = methodRes.data.data || {}

      setSummary({
        todayRevenue: sData.today?.revenue || 0,
        todayOrders: sData.today?.completedOrders || 0,
        weekRevenue: wData.totals?.totalRevenue || 0,
        topProduct: topP[0] ? { name: topP[0].name, units: topP[0].quantity } : null
      })

      const wDays = wData.days || []
      
      // Generate full date range to ensure Recharts renders properly even with sparse data
      const generateDateRange = (s, e) => {
        const dates = [];
        let curr = new Date(s);
        const endD = new Date(e);
        while (curr <= endD) {
          dates.push(curr.toISOString().split('T')[0]);
          curr.setDate(curr.getDate() + 1);
        }
        return dates;
      };

      const dateRange = generateDateRange(start, end);
      const formattedDays = dateRange.map(dateStr => {
        const existingData = wDays.find(d => d.date === dateStr) || { orders: 0, revenue: 0 };
        const dateObj = new Date(dateStr);
        const dayLabel = tab === 'month' 
            ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : tab === 'today'
              ? 'Today'
              : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        
        return {
          ...existingData,
          date: dateStr,
          day: dayLabel
        };
      });

      setWeeklyData(formattedDays)
      setTopProducts(Array.isArray(topP) ? topP : [])

      setRevenueByMethod([
        { name: 'Card', value: mData.card?.revenue || 0 },
        { name: 'Cash', value: mData.cash?.revenue || 0 }
      ])
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-[var(--font-outfit)] text-[28px] font-bold text-white tracking-tight m-0">📊 Reports</h1>
        <div className="flex gap-2 p-1 bg-[var(--color-bg-primary)] rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] w-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              className={`flex items-center gap-2 px-4 py-2 text-[14px] font-medium rounded-[var(--radius-sm)] cursor-pointer transition-all border-none ${activeTab === t.key ? 'bg-[var(--color-bg-secondary)] text-white shadow-sm' : 'bg-transparent text-[var(--color-text-secondary)] hover:text-white'}`}
              onClick={() => setActiveTab(t.key)}
              id={`reports-tab-${t.key}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center p-12">
          <span className="inline-block w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4 md:gap-5 mb-6 md:mb-8">
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-xl p-5 md:p-6 flex flex-col items-start transition-all hover:-translate-y-1 hover:shadow-lg hover:border-[var(--color-text-muted)] group">
              <span className="w-12 h-12 flex items-center justify-center rounded-lg bg-[rgba(255,255,255,0.05)] text-[24px] mb-4 border border-[rgba(255,255,255,0.1)] group-hover:scale-110 transition-transform">💰</span>
              <span className="text-[13px] font-medium text-[var(--color-text-secondary)] uppercase tracking-[0.05em] mb-2">Today's Revenue</span>
              <span className="font-[var(--font-outfit)] text-[28px] font-bold mb-1 text-[#10b981]">{formatLKR(summary?.todayRevenue)}</span>
              <span className="text-[12px] text-[var(--color-text-muted)]">From completed orders</span>
            </div>
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-xl p-5 md:p-6 flex flex-col items-start transition-all hover:-translate-y-1 hover:shadow-lg hover:border-[var(--color-text-muted)] group">
              <span className="w-12 h-12 flex items-center justify-center rounded-lg bg-[rgba(255,255,255,0.05)] text-[24px] mb-4 border border-[rgba(255,255,255,0.1)] group-hover:scale-110 transition-transform">🛒</span>
              <span className="text-[13px] font-medium text-[var(--color-text-secondary)] uppercase tracking-[0.05em] mb-2">Today's Orders</span>
              <span className="font-[var(--font-outfit)] text-[28px] font-bold mb-1 text-white">{summary?.todayOrders || 0}</span>
              <span className="text-[12px] text-[var(--color-text-muted)]">Total transactions</span>
            </div>
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-xl p-5 md:p-6 flex flex-col items-start transition-all hover:-translate-y-1 hover:shadow-lg hover:border-[var(--color-text-muted)] group">
              <span className="w-12 h-12 flex items-center justify-center rounded-lg bg-[rgba(255,255,255,0.05)] text-[24px] mb-4 border border-[rgba(255,255,255,0.1)] group-hover:scale-110 transition-transform">📈</span>
              <span className="text-[13px] font-medium text-[var(--color-text-secondary)] uppercase tracking-[0.05em] mb-2">This Week Revenue</span>
              <span className="font-[var(--font-outfit)] text-[28px] font-bold mb-1 text-[#10b981]">{formatLKR(summary?.weekRevenue)}</span>
              <span className="text-[12px] text-[var(--color-text-muted)]">Last 7 days</span>
            </div>
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-xl p-5 md:p-6 flex flex-col items-start transition-all hover:-translate-y-1 hover:shadow-lg hover:border-[var(--color-text-muted)] group">
              <span className="w-12 h-12 flex items-center justify-center rounded-lg bg-[rgba(255,255,255,0.05)] text-[24px] mb-4 border border-[rgba(255,255,255,0.1)] group-hover:scale-110 transition-transform">⭐</span>
              <span className="text-[13px] font-medium text-[var(--color-text-secondary)] uppercase tracking-[0.05em] mb-2">Top Product</span>
              <span className="font-[var(--font-outfit)] font-bold mb-1 text-white text-[18px]">
                {summary?.topProduct?.name || 'N/A'}
              </span>
              <span className="text-[12px] text-[var(--color-text-muted)]">{summary?.topProduct?.units || 0} units sold</span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-[2fr_1fr] gap-4 mb-6">
            {/* Bar Chart */}
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-xl p-5 md:p-6 flex flex-col h-full">
              <div className="font-[var(--font-outfit)] text-[16px] font-bold mb-4">📊 Revenue by Day</div>
              {weeklyData.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                  <div className="text-[32px]">📊</div>
                  <div className="text-[13px] mt-2 text-[var(--color-text-secondary)]">No revenue data for this period</div>
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
                    <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} minPointSize={2} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Pie Chart */}
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-xl p-5 md:p-6 flex flex-col h-full">
              <div className="font-[var(--font-outfit)] text-[16px] font-bold mb-4">💳 Payment Split</div>
              {revenueByMethod.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                  <div className="text-[32px]">🥧</div>
                  <div className="text-[13px] mt-2 text-[var(--color-text-secondary)]">No payment data</div>
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
                      formatter={(val) => <span className="text-[var(--color-text-secondary)] text-[12px]">{val}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top Products Table */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-[var(--color-border-subtle)]">
              <span className="font-[var(--font-outfit)] text-[16px] font-bold">🏆 Top Products</span>
            </div>
            {topProducts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <div className="text-[32px]">🏆</div>
                <div className="text-[13px] mt-2 text-[var(--color-text-secondary)]">No product data for this period</div>
              </div>
            ) : (
              <div className="overflow-x-auto bg-[var(--color-bg-primary)] border-none rounded-none">
                <table className="w-full min-w-[600px] border-collapse text-left text-[14px]">
                  <thead>
                    <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]">
                      <th className="p-3 font-semibold text-[13px] text-[var(--color-text-secondary)] uppercase tracking-[0.05em]">Rank</th>
                      <th className="p-3 font-semibold text-[13px] text-[var(--color-text-secondary)] uppercase tracking-[0.05em]">Product</th>
                      <th className="p-3 font-semibold text-[13px] text-[var(--color-text-secondary)] uppercase tracking-[0.05em]">Units Sold</th>
                      <th className="p-3 font-semibold text-[13px] text-[var(--color-text-secondary)] uppercase tracking-[0.05em] text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((p, idx) => (
                      <tr key={p._id || idx} className="border-b border-[var(--color-border-subtle)] last:border-0 hover:bg-[var(--color-bg-hover)] transition-colors">
                        <td className="p-3">
                          <span className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-[13px] font-bold ${idx === 0 ? 'bg-[rgba(245,158,11,0.2)] text-[#f59e0b]' : idx === 1 ? 'bg-[rgba(148,163,184,0.2)] text-[#94a3b8]' : idx === 2 ? 'bg-[rgba(180,120,80,0.2)] text-[#b47850]' : 'bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]'}`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="p-3 font-medium">{p.name}</td>
                        <td className="p-3">
                          <span className="font-semibold">{p.unitsSold || p.quantity || 0}</span>
                          <span className="text-[var(--color-text-muted)] text-[12px]"> units</span>
                        </td>
                        <td className="p-3 text-right font-semibold text-[var(--color-accent-primary)]">
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
