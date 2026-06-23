export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-xl border bg-card text-card-foreground shadow ${className}`}>
      {children}
    </div>
  )
}

export function Avatar({ url, name, size = 40 }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase()
  return url ? (
    <img
      src={url}
      alt={name || 'avatar'}
      style={{ width: size, height: size }}
      className="rounded-full object-cover border border-line shrink-0"
    />
  ) : (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-card text-card-foreground border border-line flex items-center justify-center font-display font-semibold shrink-0"
    >
      {initial}
    </div>
  )
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="border border-dashed border-line rounded-lg py-14 px-6 text-center bg-card">
      <p className="font-display font-semibold text-card-foreground mb-1">{title}</p>
      {description && <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">{description}</p>}
      {action}
    </div>
  )
}

export function Spinner({ size = 20 }) {
  return (
    <svg className="animate-spin text-muted-foreground" style={{ width: size, height: size }} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
    </svg>
  )
}
