export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white border border-line rounded-lg ${className}`}>
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
      className="rounded-full bg-paper-dim border border-line flex items-center justify-center font-display font-semibold text-ink-soft shrink-0"
    >
      {initial}
    </div>
  )
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="border border-dashed border-line rounded-lg py-14 px-6 text-center">
      <p className="font-display font-semibold text-ink mb-1">{title}</p>
      {description && <p className="text-sm text-ink-faint mb-4 max-w-sm mx-auto">{description}</p>}
      {action}
    </div>
  )
}

export function Spinner({ size = 20 }) {
  return (
    <svg
      className="animate-spin text-ink-faint"
      style={{ width: size, height: size }}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
    </svg>
  )
}
