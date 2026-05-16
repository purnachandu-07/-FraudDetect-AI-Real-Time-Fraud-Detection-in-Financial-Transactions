export default function KPICard({ title, value, subtitle, icon: Icon, color = 'brand', trend }) {
  const colorMap = {
    brand:   { icon: 'text-brand-400 bg-brand-500/15 border-brand-500/20', ring: 'from-brand-500/20' },
    danger:  { icon: 'text-danger-400 bg-danger-500/15 border-danger-500/20', ring: 'from-danger-500/20' },
    warning: { icon: 'text-warning-400 bg-warning-500/15 border-warning-500/20', ring: 'from-warning-500/20' },
    success: { icon: 'text-success-400 bg-success-500/15 border-success-500/20', ring: 'from-success-500/20' },
  }
  const c = colorMap[color] || colorMap.brand

  return (
    <div className="glass-card-hover p-5 relative overflow-hidden">
      {/* Background glow */}
      <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${c.ring} to-transparent blur-2xl opacity-60`} />

      <div className="flex items-start justify-between relative">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold text-white mt-1.5 tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <p className={`text-xs mt-2 font-medium ${trend >= 0 ? 'text-danger-400' : 'text-success-400'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs yesterday
            </p>
          )}
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${c.icon} flex-shrink-0`}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  )
}
