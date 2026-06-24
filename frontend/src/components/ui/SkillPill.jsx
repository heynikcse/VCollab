const TONES = {
  default: {
    base: 'bg-paper-dim border-line text-ink-soft hover:border-ink/30 hover:text-ink',
    active: 'bg-ink text-paper border-ink',
    dot: 'bg-ink-faint',
    dotActive: 'bg-amber',
  },
  amber: {
    base: 'bg-amber-soft border-amber/30 text-amber-deep hover:border-amber',
    active: 'bg-amber-deep text-white border-amber-deep',
    dot: 'bg-amber',
    dotActive: 'bg-white',
  },
  teal: {
    base: 'bg-teal-soft border-teal/30 text-teal hover:border-teal',
    active: 'bg-teal text-white border-teal',
    dot: 'bg-teal',
    dotActive: 'bg-white',
  },
  rust: {
    base: 'bg-rust-soft border-rust/30 text-rust hover:border-rust',
    active: 'bg-rust text-white border-rust',
    dot: 'bg-rust',
    dotActive: 'bg-white',
  },
  violet: {
    base: 'bg-violet-soft border-violet/30 text-violet hover:border-violet',
    active: 'bg-violet text-white border-violet',
    dot: 'bg-violet',
    dotActive: 'bg-white',
  },
}

export default function SkillPill({ children, tone = 'default', active = false, onClick, size = 'md' }) {
  const Tag = onClick ? 'button' : 'span'
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5'
  const t = TONES[tone] || TONES.default

  return (
    <Tag
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      className={`inline-flex items-center ${sizeClasses} rounded-full font-mono border transition-all duration-150
        ${active ? t.active : t.base}
        ${onClick ? 'cursor-pointer' : ''}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? t.dotActive : t.dot}`} />
      {children}
    </Tag>
  )
}
