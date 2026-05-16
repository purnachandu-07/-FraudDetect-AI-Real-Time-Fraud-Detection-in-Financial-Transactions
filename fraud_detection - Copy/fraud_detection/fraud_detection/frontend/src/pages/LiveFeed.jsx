import { useEffect, useState, useRef, useCallback } from 'react'
import { Radio, Zap, Play, Pause, AlertTriangle, CheckCircle } from 'lucide-react'
import RiskBadge from '../components/RiskBadge'
import { simulateTransaction, submitManualTransaction } from '../services/transactionService'

const CATEGORIES = ['retail','entertainment','transport','travel','fuel','food','health','electronics']

export default function LiveFeed() {
  const [transactions, setTransactions] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const [speed, setSpeed] = useState(2000)
  const [model, setModel] = useState('xgboost')
  const [wsStatus, setWsStatus] = useState('disconnected')
  const [newCount, setNewCount] = useState(0)
  const wsRef = useRef(null)
  const intervalRef = useRef(null)
  const feedRef = useRef(null)

  // WebSocket
  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket(`ws://${window.location.host}/ws/feed`)
      wsRef.current = ws
      ws.onopen = () => setWsStatus('connected')
      ws.onclose = () => { setWsStatus('disconnected'); setTimeout(connect, 3000) }
      ws.onerror = () => setWsStatus('error')
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data)
        if (msg.type === 'transaction') {
          setTransactions(prev => [msg.data, ...prev].slice(0, 200))
          setNewCount(n => n + 1)
        }
      }
    }
    connect()
    return () => { wsRef.current?.close(); clearInterval(intervalRef.current) }
  }, [])

  // Auto-simulate
  const toggle = useCallback(() => {
    if (isRunning) {
      clearInterval(intervalRef.current)
      setIsRunning(false)
    } else {
      const run = () => simulateTransaction(model).catch(console.error)
      run()
      intervalRef.current = setInterval(run, speed)
      setIsRunning(true)
    }
  }, [isRunning, model, speed])

  useEffect(() => {
    if (isRunning) {
      clearInterval(intervalRef.current)
      const run = () => simulateTransaction(model).catch(console.error)
      intervalRef.current = setInterval(run, speed)
    }
  }, [speed, model])

  // Scroll to top on new tx
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = 0
  }, [transactions.length])

  // Manual form
  const [form, setForm] = useState({
    amount: '', merchant: '', merchant_category: 'retail',
    card_last4: '', location: '', is_foreign: false, device_mismatch: false,
    velocity_1h: 1, geo_distance: 0, model_name: 'xgboost',
  })
  const [manualResult, setManualResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleManual = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setManualResult(null)
    try {
      const res = await submitManualTransaction({
        ...form, amount: parseFloat(form.amount),
        velocity_1h: parseInt(form.velocity_1h),
        geo_distance: parseFloat(form.geo_distance),
      })
      setManualResult(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const wsColor = { connected: 'text-success-400', disconnected: 'text-gray-500', error: 'text-danger-400' }[wsStatus]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Live Transaction Feed</h1>
          <p className="section-subtitle">Real-time ML-scored transaction stream</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className={`flex items-center gap-1.5 ${wsColor}`}>
            <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
            WebSocket {wsStatus}
          </div>
          {newCount > 0 && (
            <span className="bg-brand-600/20 text-brand-400 border border-brand-600/30 px-2 py-1 rounded-full text-xs font-medium">
              {newCount} received
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Controls */}
        <div className="space-y-4">
          {/* Auto-simulate */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Zap size={14} className="text-brand-400" /> Auto-Simulate
            </h3>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Model</label>
              <select value={model} onChange={e => setModel(e.target.value)} className="input-field text-sm">
                <option value="xgboost">XGBoost</option>
                <option value="random_forest">Random Forest</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Speed: {speed / 1000}s interval</label>
              <input type="range" min="500" max="5000" step="500" value={speed}
                onChange={e => setSpeed(+e.target.value)}
                className="w-full accent-brand-500 cursor-pointer" />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>0.5s</span><span>5s</span>
              </div>
            </div>
            <button onClick={toggle} className={isRunning ? 'btn-danger w-full justify-center' : 'btn-primary w-full justify-center'}>
              {isRunning ? <><Pause size={14} /> Stop</> : <><Play size={14} /> Start Feed</>}
            </button>
            <button
              onClick={() => simulateTransaction(model, true)}
              className="w-full btn-ghost justify-center text-sm py-2 border-danger-600/30 text-danger-400 hover:bg-danger-600/10"
            >
              <AlertTriangle size={13} /> Force Fraud Tx
            </button>
          </div>

          {/* Manual form */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Radio size={14} className="text-brand-400" /> Manual Submit
            </h3>
            <form onSubmit={handleManual} className="space-y-3">
              {[
                { label: 'Amount ($)', key: 'amount', type: 'number', placeholder: '250.00' },
                { label: 'Merchant', key: 'merchant', type: 'text', placeholder: 'Amazon' },
                { label: 'Card Last 4', key: 'card_last4', type: 'text', placeholder: '4242' },
                { label: 'Location', key: 'location', type: 'text', placeholder: 'New York, USA' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="input-field text-sm py-2" placeholder={placeholder} required />
                </div>
              ))}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Category</label>
                <select value={form.merchant_category}
                  onChange={e => setForm(f => ({ ...f, merchant_category: e.target.value }))}
                  className="input-field text-sm py-2">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                  <input type="checkbox" checked={form.is_foreign}
                    onChange={e => setForm(f => ({ ...f, is_foreign: e.target.checked }))}
                    className="accent-brand-500" />
                  Foreign
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                  <input type="checkbox" checked={form.device_mismatch}
                    onChange={e => setForm(f => ({ ...f, device_mismatch: e.target.checked }))}
                    className="accent-brand-500" />
                  Device Mismatch
                </label>
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full justify-center text-sm py-2 disabled:opacity-60">
                {submitting ? 'Analyzing...' : 'Analyze Transaction'}
              </button>
            </form>

            {manualResult && (
              <div className={`mt-4 p-3.5 rounded-xl border animate-slide-in ${
                manualResult.is_fraud
                  ? 'bg-danger-500/10 border-danger-500/30'
                  : 'bg-success-500/10 border-success-500/30'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {manualResult.is_fraud
                    ? <AlertTriangle className="w-4 h-4 text-danger-400" />
                    : <CheckCircle className="w-4 h-4 text-success-400" />
                  }
                  <span className={`text-sm font-semibold ${manualResult.is_fraud ? 'text-danger-400' : 'text-success-400'}`}>
                    {manualResult.is_fraud ? 'FRAUD DETECTED' : 'LEGITIMATE'}
                  </span>
                </div>
                <p className="text-xs text-gray-400">Score: <span className="text-white font-mono">{manualResult.risk_score}%</span></p>
                <p className="text-xs text-gray-400">Tier: <RiskBadge tier={manualResult.risk_tier} /></p>
                <p className="text-xs text-gray-400 mt-1 font-mono">{manualResult.tx_id}</p>
              </div>
            )}
          </div>
        </div>

        {/* Feed */}
        <div className="xl:col-span-2 glass-card p-5 flex flex-col" style={{ maxHeight: '78vh' }}>
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Radio size={14} className="text-brand-400 animate-pulse" />
            Transaction Stream
            <span className="ml-auto text-xs text-gray-500">{transactions.length} transactions</span>
          </h3>
          <div ref={feedRef} className="flex-1 overflow-y-auto space-y-2 pr-1">
            {transactions.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-gray-600">
                <Radio size={32} className="mb-3 opacity-40" />
                <p className="text-sm">Start the feed to see live transactions</p>
              </div>
            )}
            {transactions.map((tx, i) => (
              <div key={`${tx.tx_id}-${i}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all animate-slide-in ${
                  tx.is_fraud
                    ? 'bg-danger-500/8 border-danger-500/20 hover:border-danger-500/40'
                    : 'bg-white/5 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex-shrink-0">
                  {tx.is_fraud
                    ? <AlertTriangle size={14} className="text-danger-400" />
                    : <CheckCircle size={14} className="text-success-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-brand-400">{tx.tx_id}</span>
                    <RiskBadge tier={tx.risk_tier} />
                    {tx.is_blocked && <span className="badge-critical">Blocked</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {tx.merchant} · {tx.location}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-white">${typeof tx.amount === 'number' ? tx.amount.toFixed(2) : tx.amount}</p>
                  <p className={`text-xs font-medium ${
                    tx.risk_score >= 65 ? 'text-danger-400' :
                    tx.risk_score >= 40 ? 'text-warning-400' : 'text-success-400'
                  }`}>{typeof tx.risk_score === 'number' ? tx.risk_score.toFixed(1) : tx.risk_score}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
