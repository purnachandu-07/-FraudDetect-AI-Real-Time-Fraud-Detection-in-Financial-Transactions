import { useEffect, useState, useCallback } from 'react'
import {
  AreaChart, Area, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { getTransactions, getTransactionTrend } from '../services/transactionService'
import { RefreshCw } from 'lucide-react'

const COLORS = ['#6366f1','#ef4444','#f59e0b','#10b981','#8b5cf6','#ec4899','#14b8a6','#f97316']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-dark-800 border border-white/10 rounded-xl p-3 text-xs shadow-xl">
      {label && <p className="text-gray-400 mb-1.5">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }}>
          {p.name}: <span className="font-semibold text-white">{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
        </p>
      ))}
    </div>
  )
}

export default function Analytics() {
  const [trend, setTrend] = useState([])
  const [txs, setTxs] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [t, all] = await Promise.all([
        getTransactionTrend(30),
        getTransactions({ limit: 500 }),
      ])
      setTrend(t.data)
      setTxs(all.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // Merchant category aggregation
  const catData = Object.entries(
    txs.reduce((acc, tx) => {
      const k = tx.merchant_category
      if (!acc[k]) acc[k] = { total: 0, fraud: 0 }
      acc[k].total++
      if (tx.is_fraud) acc[k].fraud++
      return acc
    }, {})
  ).map(([name, v]) => ({ name, ...v, rate: v.total ? +((v.fraud / v.total) * 100).toFixed(1) : 0 }))
   .sort((a, b) => b.rate - a.rate)

  // Scatter: amount vs risk
  const scatterData = txs.slice(0, 300).map(tx => ({
    amount: tx.amount,
    risk: tx.risk_score,
    fraud: tx.is_fraud,
  }))

  // Hour of day distribution
  const hourData = Array.from({ length: 24 }, (_, h) => {
    const group = txs.filter(tx => tx.hour_of_day === h)
    const fraud = group.filter(tx => tx.is_fraud).length
    return { hour: `${h}:00`, total: group.length, fraud }
  })

  // Radar: feature importance (simulated)
  const radarData = [
    { subject: 'Amount', value: 85 },
    { subject: 'Velocity', value: 78 },
    { subject: 'Geo Distance', value: 72 },
    { subject: 'Hour', value: 65 },
    { subject: 'Device', value: 70 },
    { subject: 'Foreign', value: 60 },
    { subject: 'Category', value: 45 },
    { subject: 'Day', value: 30 },
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Analytics</h1>
          <p className="section-subtitle">Deep fraud pattern analysis — last 500 transactions</p>
        </div>
        <button onClick={load} className="btn-ghost text-sm py-2"><RefreshCw size={13} /> Refresh</button>
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 30-day trend */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Fraud Trend — 30 Days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="total" name="Total"  stroke="#6366f1" fill="url(#tg)" strokeWidth={1.5} />
              <Area type="monotone" dataKey="fraud" name="Fraud"  stroke="#ef4444" fill="url(#fg)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category fraud rates */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Fraud Rate by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={catData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="rate" name="Fraud Rate %" radius={[0, 4, 4, 0]}>
                {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Amount vs Risk Scatter */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Amount vs Risk Score</h3>
          <p className="text-xs text-gray-500 mb-4">Each point = one transaction (sample of 300)</p>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="amount" name="Amount ($)" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => `$${v.toFixed(0)}`} />
              <YAxis dataKey="risk" name="Risk Score" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => `${v}%`} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
              <Scatter
                name="Transactions"
                data={scatterData.filter(d => !d.fraud)}
                fill="#6366f1" opacity={0.6} r={3}
              />
              <Scatter
                name="Fraud"
                data={scatterData.filter(d => d.fraud)}
                fill="#ef4444" opacity={0.8} r={4}
              />
            </ScatterChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 justify-center">
            <span className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-2.5 h-2.5 rounded-full bg-brand-500 inline-block" /> Legitimate</span>
            <span className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-2.5 h-2.5 rounded-full bg-danger-500 inline-block" /> Fraud</span>
          </div>
        </div>

        {/* Hourly distribution */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Fraud by Hour of Day</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hourData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="hour" tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false}
                interval={3} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" name="Total" fill="#6366f1" opacity={0.5} radius={[2,2,0,0]} />
              <Bar dataKey="fraud" name="Fraud" fill="#ef4444" radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feature importance radar */}
      <div className="glass-card p-5 max-w-lg mx-auto">
        <h3 className="text-sm font-semibold text-white mb-4 text-center">Feature Importance (XGBoost)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="rgba(255,255,255,0.06)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#4b5563', fontSize: 9 }} />
            <Radar name="Importance" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
