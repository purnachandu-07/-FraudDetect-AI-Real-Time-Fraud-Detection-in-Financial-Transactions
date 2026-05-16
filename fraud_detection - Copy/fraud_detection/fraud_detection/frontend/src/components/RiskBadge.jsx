export default function RiskBadge({ tier }) {
  const classes = {
    LOW:      'badge-low',
    MEDIUM:   'badge-medium',
    HIGH:     'badge-high',
    CRITICAL: 'badge-critical',
  }
  return (
    <span className={classes[tier] || 'badge-low'}>
      {tier}
    </span>
  )
}

export function StatusBadge({ status }) {
  const classes = {
    pending:       'status-pending',
    investigating: 'status-investigating',
    blocked:       'status-blocked',
    dismissed:     'status-dismissed',
  }
  return (
    <span className={classes[status] || 'status-pending'}>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  )
}
