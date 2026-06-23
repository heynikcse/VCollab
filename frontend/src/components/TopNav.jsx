import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/feed', label: 'Campus Feed', icon: HomeIcon },
  { to: '/connect', label: 'Connect', icon: ConnectIcon },
  { to: '/community', label: 'Communities', icon: CommunityIcon },
  { to: '/events', label: 'Events', icon: EventsIcon },
]

export default function TopNav() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 backdrop-blur-xl bg-paper/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
        <button onClick={() => navigate('/feed')} className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-xl gradient-neon grid place-items-center glow-purple">
            <SparkIcon className="w-5 h-5 text-paper" />
          </div>
          <div className="hidden sm:block">
            <div className="font-display text-lg font-bold tracking-tight leading-none">VCollab</div>
            <div className="text-[9px] uppercase tracking-[0.2em] text-ink-faint mt-0.5">VIT Bhopal</div>
          </div>
        </button>

        <nav className="hidden lg:flex items-center gap-1 ml-4">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${isActive ? 'glass-strong text-ink ring-neon' : 'text-ink-faint hover:text-ink hover:bg-white/5'}`}>
              <Icon className={`w-4 h-4`} />
              <span className="font-medium">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex flex-1 max-w-md mx-auto glass rounded-xl items-center gap-3 px-4 py-2">
          <input placeholder="Search posts, projects, people…" className="bg-transparent outline-none text-sm flex-1 min-w-0 placeholder:text-ink-faint" />
        </div>

        <div className="flex-1 lg:flex-none" />

        <div className="flex items-center gap-2 shrink-0">
          <button className="glass size-10 rounded-xl grid place-items-center hover:ring-neon transition">
            <BellIcon className="w-4 h-4" />
          </button>
          <div className="hidden sm:flex items-center gap-2 glass rounded-xl pl-1 pr-3 py-1">
            <div className="w-8 h-8 rounded-lg gradient-neon grid place-items-center font-bold text-paper text-sm">{profile?.name?.[0] || 'U'}</div>
            <div className="hidden md:block leading-tight">
              <div className="text-xs font-semibold">{profile?.name?.split(' ')[0] || 'User'}</div>
              <div className="text-[10px] text-ink-faint">{profile?.branch || ''}</div>
            </div>
          </div>
          <button onClick={() => navigate('/profile')} className="lg:hidden glass size-10 rounded-xl grid place-items-center" aria-label="Toggle menu">
            <MenuIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}

function SparkIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" {...props}>
      <path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2z" strokeLinejoin="round" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" strokeLinejoin="round" />
    </svg>
  )
}

function HomeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M3 11l9-8 9 8M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function ConnectIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="7" cy="12" r="3" />
      <circle cx="17" cy="6" r="3" />
      <circle cx="17" cy="18" r="3" />
      <path d="M9.5 10.5l5-3M9.5 13.5l5 3" />
    </svg>
  )
}
function CommunityIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6" strokeLinecap="round" />
      <circle cx="17" cy="8" r="2.5" />
      <path d="M16 14.2c2.6.4 4 2.4 4 5.8" strokeLinecap="round" />
    </svg>
  )
}
function EventsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  )
}

function BellIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MenuIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
