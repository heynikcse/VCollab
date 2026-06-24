export function Card({ children, className = '' }) {
  return (
    <div className={`vc-card ${className}`}>
      {children}
    </div>
  )
}

export function Avatar({ url, name, size = 40 }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase()
  const fontSize = size < 28 ? 10 : size < 40 ? 13 : size < 60 ? 16 : 22
  const ringStyle = { width: size, height: size, boxShadow: '0 0 0 2px rgba(224,221,213,0.8)' }

  return url ? (
    <img
      src={url}
      alt={name || 'avatar'}
      style={ringStyle}
      className="rounded-full object-cover shrink-0"
    />
  ) : (
    <div
      style={{ ...ringStyle, fontSize }}
      className="rounded-full bg-gradient-to-br from-violet/20 to-amber/20 border border-line flex items-center justify-center font-display font-semibold text-ink-soft shrink-0"
    >
      {initial}
    </div>
  )
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="border-2 border-dashed border-line rounded-2xl py-16 px-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-paper-dim flex items-center justify-center mx-auto mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-ink-faint">
          <path d="M9 12h6M9 16h4M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V8L14 3z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="font-display font-semibold text-ink mb-1.5">{title}</p>
      {description && <p className="text-sm text-ink-faint mb-5 max-w-xs mx-auto leading-relaxed">{description}</p>}
      {action}
    </div>
  )
}

export function Spinner({ size = 20, color = 'text-ink-faint' }) {
  return (
    <svg
      className={`animate-spin ${color}`}
      style={{ width: size, height: size }}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
    </svg>
  )
}

export function Badge({ children, color = 'default' }) {
  const colors = {
    default: 'bg-paper-dim text-ink-soft border-line',
    teal: 'bg-teal-soft text-teal border-teal/20',
    amber: 'bg-amber-soft text-amber-deep border-amber/20',
    rust: 'bg-rust-soft text-rust border-rust/20',
    violet: 'bg-violet-soft text-violet border-violet/20',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono border ${colors[color]}`}>
      {children}
    </span>
  )
}

export function Divider({ className = '' }) {
  return <div className={`border-t border-line-soft ${className}`} />
}
