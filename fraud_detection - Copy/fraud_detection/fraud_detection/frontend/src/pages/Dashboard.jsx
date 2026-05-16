import { useEffect, useState, useCallback } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { Activity, AlertTriangle, Ban, TrendingUp, RefreshCw } from 'lucide-react'
import KPICard from '../components/KPICard'
import FraudGauge from '../components/FraudGauge'
import RiskBadge from '../components/RiskBadge'
import { getTransactionStats, getTransactionTrend, getTransactions } from '../services/transactionService'
import { getAlertStats } from '../services/alertService'
import api from '../services/api'

const PIE_COLORS = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#f97316', CRITICAL: '#ef4444' }

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-dark-800 border border-white/10 rounded-xl p-3 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [alertStats, setAlertStats] = useState(null)
  const [trend, setTrend] = useState([])
  const [recent, setRecent] = useState([])
  const [models, setModels] = useState([])
  const [riskDist, setRiskDist] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [s, as, t, txs, m] = await Promise.all([
        getTransactionStats(),
        getAlertStats(),
        getTransactionTrend(14),
        getTransactions({ limit: 10 }),
        api.get('/api/models/metrics'),
      ])
      setStats(s.data)
      setAlertStats(as.data)
      setTrend(t.data)
      setRecent(txs.data)
      setModels(m.data)

      // Compute risk distribution from recent
      const all = await getTransactions({ limit: 500 })
      const counts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }
      all.data.forEach(tx => { if (counts[tx.risk_tier] !== undefined) counts[tx.risk_tier]++ })
      setRiskDist(Object.entries(counts).map(([name, value]) => ({ name, value })))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Overview</h1>
          <p className="section-subtitle">Real-time fraud monitoring summary</p>
        </div>
        <button onClick={load} className="btn-ghost text-sm py-2">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard title="Total Transactions" value={stats?.total?.toLocaleString() ?? '—'} icon={Activity} color="brand" subtitle="All time" />
        <KPICard title="Flagged Today"      value={alertStats?.pending ?? '—'}             icon={AlertTriangle} color="warning" subtitle="Awaiting review" />
        <KPICard title="Blocked"            value={stats?.blocked?.toLocaleString() ?? '—'} icon={Ban}          color="danger"  subtitle="Auto-blocked" />
        <KPICard title="Fraud Rate"         value={`${stats?.fraud_rate ?? 0}%`}            icon={TrendingUp}   color="success" subtitle="Overall rate" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend chart */}
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Transaction Volume (14 days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="fraudGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="total" name="Total"  stroke="#6366f1" fill="url(#totalGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="fraud" name="Fraud"  stroke="#ef4444" fill="url(#fraudGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Gauge + Pie */}
        <div className="glass-card p-5 flex flex-col items-center justify-around">
          <FraudGauge value={stats?.fraud_rate ?? 0} label="Overall Fraud Rate" />
          <div className="w-full">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 text-center">Risk Distribution</h3>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={riskDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} paddingAngle={3}>
                  {riskDist.map(entry => (
                    <Cell key={entry.name} fill={PIE_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(v) => <span className="text-xs text-gray-400">{v}</span>}
                  iconType="circle" iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Model metrics */}
      {models.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">ML Model Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['Model', 'Accuracy', 'Precision', 'Recall', 'F1', 'AUC-ROC'].map(h => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {models.map(m => (
                  <tr key={m.id} className="table-row">
                    <td className="table-cell">
                      <span className="font-medium text-white capitalize">{m.model_name.replace('_', ' ')}</span>
                    </td>
                    {[m.accuracy, m.precision_score, m.recall, m.f1, m.auc_roc].map((v, i) => (
                      <td key={i} className="table-cell">
                        <span className={v >= 0.9 ? 'text-success-400' : v >= 0.75 ? 'text-warning-400' : 'text-danger-400'}>
                          {(v * 100).toFixed(2)}%
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['TX ID', 'Merchant', 'Amount', 'Risk Score', 'Tier', 'Status'].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map(tx => (
                <tr key={tx.id} className="table-row animate-slide-in">
                  <td className="table-cell font-mono text-brand-400">{tx.tx_id}</td>
                  <td className="table-cell">{tx.merchant}</td>
                  <td className="table-cell font-semibold">${tx.amount.toFixed(2)}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-white/5 rounded-full h-1.5 max-w-20">
                        <div
                          className={`h-1.5 rounded-full ${tx.risk_score >= 65 ? 'bg-danger-500' : tx.risk_score >= 40 ? 'bg-warning-500' : 'bg-success-500'}`}
                          style={{ width: `${tx.risk_score}%` }}
                        />
                      </div>
                      <span className="text-xs">{tx.risk_score.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="table-cell"><RiskBadge tier={tx.risk_tier} /></td>
                  <td className="table-cell">
                    {tx.is_blocked
                      ? <span className="badge-critical">Blocked</span>
                      : tx.is_fraud
                      ? <span className="badge-high">Flagged</span>
                      : <span className="badge-low">Clear</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
