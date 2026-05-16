import { useEffect, useState, useCallback } from 'react'
import { Bell, Search, Filter, Download, RefreshCw, Eye, X, Ban } from 'lucide-react'
import RiskBadge, { StatusBadge } from '../components/RiskBadge'
import { getAlerts, getAlertStats, updateAlert } from '../services/alertService'

const TIERS = ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const STATUSES = ['', 'pending', 'investigating', 'dismissed', 'blocked']

export default function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filterTier, setFilterTier] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [updating, setUpdating] = useState(null)
  const PER_PAGE = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [a, s] = await Promise.all([
        getAlerts({ skip: page * PER_PAGE, limit: PER_PAGE, risk_tier: filterTier || undefined, status: filterStatus || undefined }),
        getAlertStats(),
      ])
      setAlerts(a.data)
      setStats(s.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [page, filterTier, filterStatus])

  useEffect(() => { load() }, [load])

  const handle = async (id, status) => {
    setUpdating(id)
    try {
      const res = await updateAlert(id, status)
      setAlerts(prev => prev.map(a => a.id === id ? res.data : a))
    } catch (e) { console.error(e) }
    finally { setUpdating(null) }
  }

  const exportCSV = () => {
    const headers = ['ID','TX ID','Merchant','Amount','Risk Score','Tier','Status','Created']
    const rows = alerts.map(a => [
      a.id, a.tx_id, a.merchant, a.amount, a.risk_score, a.risk_tier, a.status, a.created_at
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url; link.download = 'alerts.csv'; link.click()
    URL.revokeObjectURL(url)
  }

  const filtered = alerts.filter(a =>
    !search || a.tx_id.includes(search.toUpperCase()) || a.merchant.toLowerCase().includes(search.toLowerCase())
  )

  const statCards = [
    { label: 'Total', value: stats?.total ?? 0, color: 'text-gray-300' },
    { label: 'Pending', value: stats?.pending ?? 0, color: 'text-warning-400' },
    { label: 'Investigating', value: stats?.investigating ?? 0, color: 'text-blue-400' },
    { label: 'Blocked', value: stats?.blocked ?? 0, color: 'text-danger-400' },
    { label: 'Dismissed', value: stats?.dismissed ?? 0, color: 'text-success-400' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Alert Center</h1>
          <p className="section-subtitle">Review and action flagged transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-ghost text-sm py-2"><RefreshCw size={13} /> Refresh</button>
          <button onClick={exportCSV} className="btn-ghost text-sm py-2"><Download size={13} /> Export CSV</button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-5 gap-3">
        {statCards.map(({ label, value, color }) => (
          <div key={label} className="glass-card p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search TX ID or merchant..."
            className="input-field pl-8 py-2 text-sm" />
        </div>
        <select value={filterTier} onChange={e => { setFilterTier(e.target.value); setPage(0) }}
          className="input-field py-2 text-sm w-auto">
          {TIERS.map(t => <option key={t} value={t}>{t || 'All Tiers'}</option>)}
        </select>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(0) }}
          className="input-field py-2 text-sm w-auto">
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                {['TX ID', 'Merchant', 'Amount', 'Location', 'Risk Score', 'Tier', 'Status', 'Actions'].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} className="text-center py-12 text-gray-600">
                  <div className="inline-block w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-gray-600">
                  <Bell size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No alerts found</p>
                </td></tr>
              )}
              {!loading && filtered.map(alert => (
                <tr key={alert.id} className={`table-row animate-slide-in ${
                  alert.risk_tier === 'CRITICAL' ? 'bg-danger-500/3' : ''
                }`}>
                  <td className="table-cell font-mono text-brand-400 text-xs">{alert.tx_id}</td>
                  <td className="table-cell">
                    <p className="font-medium text-white text-sm">{alert.merchant}</p>
                    <p className="text-xs text-gray-600">{alert.merchant_category}</p>
                  </td>
                  <td className="table-cell font-semibold text-white">${alert.amount?.toFixed(2)}</td>
                  <td className="table-cell text-xs">{alert.location}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-white/5 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${alert.risk_score >= 65 ? 'bg-danger-500' : alert.risk_score >= 40 ? 'bg-warning-500' : 'bg-success-500'}`}
                          style={{ width: `${alert.risk_score}%` }} />
                      </div>
                      <span className="text-xs font-mono">{alert.risk_score?.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="table-cell"><RiskBadge tier={alert.risk_tier} /></td>
                  <td className="table-cell"><StatusBadge status={alert.status} /></td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handle(alert.id, 'investigating')}
                        disabled={updating === alert.id || alert.status === 'investigating'}
                        title="Investigate"
                        className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors disabled:opacity-40">
                        <Eye size={13} />
                      </button>
                      <button onClick={() => handle(alert.id, 'blocked')}
                        disabled={updating === alert.id || alert.status === 'blocked'}
                        title="Block"
                        className="p-1.5 bg-danger-500/10 hover:bg-danger-500/20 text-danger-400 rounded-lg transition-colors disabled:opacity-40">
                        <Ban size={13} />
                      </button>
                      <button onClick={() => handle(alert.id, 'dismissed')}
                        disabled={updating === alert.id || alert.status === 'dismissed'}
                        title="Dismiss"
                        className="p-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors disabled:opacity-40">
                        <X size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
          <p className="text-xs text-gray-500">Page {page + 1}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="btn-ghost text-xs py-1.5 px-3 disabled:opacity-40">← Prev</button>
            <button onClick={() => setPage(p => p + 1)} disabled={filtered.length < PER_PAGE}
              className="btn-ghost text-xs py-1.5 px-3 disabled:opacity-40">Next →</button>
          </div>
        </div>
      </div>
    </div>
  )
}
