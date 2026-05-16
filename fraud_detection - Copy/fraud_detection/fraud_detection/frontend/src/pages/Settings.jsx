import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Save, Shield, Zap, Cpu, Lock, CheckCircle, AlertCircle } from 'lucide-react'

export default function Settings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState({
    threshold: parseInt(localStorage.getItem('fw_threshold') || '75'),
    autoBlock: localStorage.getItem('fw_autoblock') !== 'false',
    model: localStorage.getItem('fw_model') || 'xgboost',
    simSpeed: parseInt(localStorage.getItem('fw_speed') || '2000'),
  })
  const [saved, setSaved] = useState(false)

  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState(null)

  const save = () => {
    localStorage.setItem('fw_threshold', settings.threshold)
    localStorage.setItem('fw_autoblock', settings.autoBlock)
    localStorage.setItem('fw_model', settings.model)
    localStorage.setItem('fw_speed', settings.simSpeed)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const changePw = (e) => {
    e.preventDefault()
    if (pwForm.newPw !== pwForm.confirm) {
      setPwMsg({ type: 'error', text: 'Passwords do not match.' })
      return
    }
    if (pwForm.newPw.length < 8) {
      setPwMsg({ type: 'error', text: 'Password must be at least 8 characters.' })
      return
    }
    setPwMsg({ type: 'success', text: 'Password updated successfully.' })
    setPwForm({ current: '', newPw: '', confirm: '' })
    setTimeout(() => setPwMsg(null), 3000)
  }

  const tierColor =
    settings.threshold >= 85 ? 'text-danger-400' :
    settings.threshold >= 65 ? 'text-warning-400' :
    'text-success-400'

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="section-title">Settings</h1>
        <p className="section-subtitle">Configure detection parameters and preferences</p>
      </div>

      {/* Detection settings */}
      <div className="glass-card p-6 space-y-6">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Shield size={15} className="text-brand-400" /> Detection Configuration
        </h2>

        {/* Threshold */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-300">Risk Threshold</label>
            <span className={`text-lg font-bold font-mono ${tierColor}`}>{settings.threshold}%</span>
          </div>
          <input type="range" min="50" max="95" step="5"
            value={settings.threshold}
            onChange={e => setSettings(s => ({ ...s, threshold: +e.target.value }))}
            className="w-full accent-brand-500 cursor-pointer" />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>50% (Sensitive)</span>
            <span>95% (Strict)</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Transactions with a risk score above <span className={`font-semibold ${tierColor}`}>{settings.threshold}%</span> will be flagged as HIGH/CRITICAL.
          </p>
        </div>

        {/* Auto-block */}
        <div className="flex items-center justify-between py-4 border-t border-white/5">
          <div>
            <p className="text-sm font-medium text-gray-300">Auto-Block Critical Transactions</p>
            <p className="text-xs text-gray-500 mt-0.5">Automatically block transactions scored CRITICAL</p>
          </div>
          <button
            onClick={() => setSettings(s => ({ ...s, autoBlock: !s.autoBlock }))}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none ${
              settings.autoBlock ? 'bg-brand-600' : 'bg-white/10'
            }`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${
              settings.autoBlock ? 'left-6' : 'left-0.5'
            }`} />
          </button>
        </div>

        {/* Model selector */}
        <div className="border-t border-white/5 pt-4">
          <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <Cpu size={13} className="text-brand-400" /> Active ML Model
          </label>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {[
              { key: 'xgboost', label: 'XGBoost', desc: 'Higher precision, recommended' },
              { key: 'random_forest', label: 'Random Forest', desc: 'Faster inference, robust' },
            ].map(({ key, label, desc }) => (
              <button key={key}
                onClick={() => setSettings(s => ({ ...s, model: key }))}
                className={`p-4 rounded-xl text-left border transition-all ${
                  settings.model === key
                    ? 'border-brand-500/60 bg-brand-500/10'
                    : 'border-white/5 bg-white/5 hover:border-white/10'
                }`}
              >
                <p className={`text-sm font-semibold ${settings.model === key ? 'text-brand-400' : 'text-gray-300'}`}>{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                {settings.model === key && (
                  <div className="flex items-center gap-1 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                    <span className="text-xs text-brand-400">Active</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Sim speed */}
        <div className="border-t border-white/5 pt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Zap size={13} className="text-brand-400" /> Simulation Speed
            </label>
            <span className="text-sm font-mono text-brand-400">{settings.simSpeed / 1000}s interval</span>
          </div>
          <input type="range" min="500" max="5000" step="500"
            value={settings.simSpeed}
            onChange={e => setSettings(s => ({ ...s, simSpeed: +e.target.value }))}
            className="w-full accent-brand-500 cursor-pointer" />
        </div>

        <button onClick={save} className="btn-primary">
          {saved
            ? <><CheckCircle size={14} /> Saved!</>
            : <><Save size={14} /> Save Settings</>
          }
        </button>
      </div>

      {/* Account */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Lock size={15} className="text-brand-400" /> Account & Security
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500">Name</p>
            <p className="text-white font-medium mt-0.5">{user?.username}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Email</p>
            <p className="text-white font-medium mt-0.5">{user?.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Role</p>
            <p className="text-white font-medium mt-0.5 capitalize">{user?.role}</p>
          </div>
        </div>

        <div className="border-t border-white/5 pt-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Change Password</h3>
          {pwMsg && (
            <div className={`flex items-center gap-2 p-3 rounded-xl border mb-3 text-xs animate-slide-in ${
              pwMsg.type === 'error'
                ? 'bg-danger-500/10 border-danger-500/30 text-danger-400'
                : 'bg-success-500/10 border-success-500/30 text-success-400'
            }`}>
              {pwMsg.type === 'error' ? <AlertCircle size={12} /> : <CheckCircle size={12} />}
              {pwMsg.text}
            </div>
          )}
          <form onSubmit={changePw} className="space-y-3">
            {[
              { label: 'Current Password', key: 'current' },
              { label: 'New Password', key: 'newPw' },
              { label: 'Confirm Password', key: 'confirm' },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                <input type="password" value={pwForm[key]}
                  onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                  className="input-field text-sm py-2" placeholder="••••••••" required />
              </div>
            ))}
            <button type="submit" className="btn-primary text-sm py-2">
              <Lock size={13} /> Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
