export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  ...props
}) {
  const base = 'inline-flex items-center justify-center font-display font-medium rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed'

  const sizes = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-sm px-4 py-2.5',
    lg: 'text-base px-5 py-3',
  }

  const variants = {
    primary: 'bg-ink text-paper hover:bg-ink-soft',
    accent: 'bg-amber text-ink hover:bg-amber-deep',
    secondary: 'bg-transparent text-ink border border-line hover:border-ink',
    ghost: 'bg-transparent text-ink-soft hover:text-ink',
    danger: 'bg-rust text-paper hover:opacity-90',
  }

  return (
    <button
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
