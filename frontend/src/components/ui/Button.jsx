export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  ...props
}) {
  const base = 'inline-flex items-center justify-center font-display font-semibold rounded-xl transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]'

  const sizes = {
    xs: 'text-xs px-2.5 py-1',
    sm: 'text-sm px-3.5 py-1.5',
    md: 'text-sm px-4.5 py-2.5',
    lg: 'text-base px-6 py-3',
  }

  const variants = {
    primary: 'bg-ink text-paper hover:bg-ink-soft shadow-sm',
    accent: 'bg-amber text-ink hover:bg-amber-deep shadow-sm',
    secondary: 'bg-paper-dim text-ink-soft border border-line hover:bg-paper-card hover:text-ink hover:border-ink/20',
    ghost: 'bg-transparent text-ink-soft hover:text-ink hover:bg-paper-dim',
    danger: 'bg-rust text-paper hover:opacity-90 shadow-sm',
    violet: 'bg-violet text-white hover:opacity-90 shadow-sm',
    teal: 'bg-teal text-white hover:opacity-90 shadow-sm',
  }

  return (
    <button
      disabled={disabled}
      className={`${base} ${sizes[size] || sizes.md} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
