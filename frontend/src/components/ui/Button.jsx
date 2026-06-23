export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  ...props
}) {
  const base = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 py-2',
    lg: 'h-10 px-8',
    icon: 'h-9 w-9',
  }

  const variants = {
    primary: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
    accent: 'gradient-neon text-background shadow hover:opacity-95',
    secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    danger: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
  }

  const v = variants[variant] || variants.primary
  const s = sizes[size] || sizes.md

  return (
    <button disabled={disabled} className={`${base} ${s} ${v} ${className}`} {...props}>
      {children}
    </button>
  )
}
