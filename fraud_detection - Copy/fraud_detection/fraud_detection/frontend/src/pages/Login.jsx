import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Shield, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4"
      style={{
        backgroundImage: 'radial-gradient(ellipse at 30% 30%, rgba(99,102,241,0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(239,68,68,0.08) 0%, transparent 60%)'
      }}
    >
      {/* Animated grid bg */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }} />

      <div className="w-full max-w-md relative animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-brand-500 to-purple-600 rounded-2xl shadow-2xl shadow-brand-600/40 mb-4 animate-glow">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">FraudWatch</h1>
          <p className="text-gray-500 mt-1 text-sm">AI-Powered Fraud Detection Platform</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Sign in to your account</h2>

          {error && (
            <div className="flex items-center gap-2.5 bg-danger-500/10 border border-danger-500/30 rounded-xl p-3.5 mb-5 animate-slide-in">
              <AlertCircle className="w-4 h-4 text-danger-400 flex-shrink-0" />
              <p className="text-sm text-danger-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1.5 block">Email Address</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                placeholder="admin@fraudwatch.ai"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pr-11"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 pt-5 border-t border-white/5">
            <p className="text-xs text-gray-600 text-center mb-3">Demo Credentials</p>
            <div className="space-y-2">
              {[
                { label: 'Admin', email: 'admin@fraudwatch.ai', pw: 'Admin@1234' },
                { label: 'Analyst', email: 'analyst@fraudwatch.ai', pw: 'Analyst@1234' },
              ].map(({ label, email: e, pw }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => { setEmail(e); setPassword(pw) }}
                  className="w-full text-left px-3.5 py-2.5 bg-white/3 hover:bg-white/6 border border-white/5 rounded-xl transition-colors"
                >
                  <p className="text-xs font-medium text-gray-400">{label}</p>
                  <p className="text-xs text-gray-600 font-mono">{e}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
