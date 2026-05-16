import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Radio, Bell, BarChart3,
  Settings, Shield, Zap
} from 'lucide-react'

const links = [
  { to: '/',          label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/feed',      label: 'Live Feed',   icon: Radio           },
  { to: '/alerts',    label: 'Alerts',      icon: Bell            },
  { to: '/analytics', label: 'Analytics',   icon: BarChart3       },
  { to: '/settings',  label: 'Settings',    icon: Settings        },
]

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-dark-900/80 backdrop-blur-md border-r border-white/5 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/30 animate-glow">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg leading-none">FraudWatch</h1>
            <p className="text-xs text-gray-500 mt-0.5">AI Detection System</p>
          </div>
        </div>
      </div>

      {/* Live indicator */}
      <div className="px-4 py-3 mx-4 mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5">
        <div className="relative flex-shrink-0">
          <span className="live-dot relative w-2 h-2 rounded-full bg-emerald-400 flex" />
        </div>
        <span className="text-xs text-emerald-400 font-medium">System Active</span>
        <Zap className="w-3.5 h-3.5 text-emerald-400 ml-auto" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon className="w-4.5 h-4.5 flex-shrink-0" size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <p className="text-xs text-gray-600 text-center">FraudWatch v1.0 © 2025</p>
      </div>
    </aside>
  )
}
