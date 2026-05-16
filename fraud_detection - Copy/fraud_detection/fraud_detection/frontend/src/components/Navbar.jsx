import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut, User, Bell } from 'lucide-react'

const PAGE_TITLES = {
  '/':          { title: 'Dashboard',     subtitle: 'Overview of fraud activity' },
  '/feed':      { title: 'Live Feed',     subtitle: 'Real-time transaction stream' },
  '/alerts':    { title: 'Alert Center',  subtitle: 'Manage flagged transactions' },
  '/analytics': { title: 'Analytics',     subtitle: 'Deep fraud pattern insights' },
  '/settings':  { title: 'Settings',      subtitle: 'Configure detection parameters' },
}

export default function Navbar() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const page = PAGE_TITLES[location.pathname] || PAGE_TITLES['/']

  return (
    <header className="h-16 bg-dark-900/60 backdrop-blur-md border-b border-white/5 flex items-center px-6 gap-4 flex-shrink-0">
      {/* Page info */}
      <div className="flex-1">
        <h2 className="text-base font-semibold text-white">{page.title}</h2>
        <p className="text-xs text-gray-500">{page.subtitle}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button className="relative w-9 h-9 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-colors border border-white/5">
          <Bell className="w-4 h-4 text-gray-400" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full border border-dark-900" />
        </button>

        <div className="flex items-center gap-2.5 pl-3 border-l border-white/10">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-purple-600 rounded-lg flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-white leading-none">{user?.username}</p>
            <p className="text-xs text-gray-500 mt-0.5 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="ml-2 w-8 h-8 bg-white/5 hover:bg-danger-600/20 hover:text-danger-400 text-gray-500 rounded-lg flex items-center justify-center transition-all border border-white/5 hover:border-danger-600/30"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
