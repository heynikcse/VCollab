// SkillPill — the connective visual thread of the app.
// Mono type + small dot, used for skills, post-type tags, category tags.

const DOT_COLORS = {
  default: 'bg-ink-faint',
  amber: 'bg-amber',
  teal: 'bg-teal',
  rust: 'bg-rust',
}

export default function SkillPill({ children, tone = 'default', active = false, onClick, size = 'md' }) {
  const Tag = onClick ? 'button' : 'span'
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5'

  return (
    <Tag
      onClick={onClick}
      className={`inline-flex items-center ${sizeClasses} rounded-full font-mono border transition-colors
        ${active
          ? 'bg-ink text-paper border-ink'
          : 'bg-paper border-line text-ink-soft hover:border-ink-faint'}
        ${onClick ? 'cursor-pointer' : ''}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-amber' : DOT_COLORS[tone]}`} />
      {children}
    </Tag>
  )
}
