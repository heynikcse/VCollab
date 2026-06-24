import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Avatar } from '../components/ui/Primitives'

const NAV_ITEMS = [
  { to: '/feed', label: 'Feed', icon: HomeIcon },
  { to: '/connect', label: 'Connect', icon: ConnectIcon },
  { to: '/community', label: 'Community', icon: CommunityIcon },
  { to: '/events', label: 'Events', icon: EventsIcon },
]

export default function AppShell() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-paper">
      {/* Top nav */}
      <header className="sticky top-0 z-30 glass">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <button
            onClick={() => navigate('/feed')}
            className="flex items-center gap-2.5 shrink-0"
          >
            <div className="w-8 h-8 rounded-xl bg-ink flex items-center justify-center shadow-sm">
              <span className="font-display font-bold text-amber text-sm">V</span>
            </div>
            <span className="font-display font-bold text-ink tracking-tight hidden sm:block text-[15px]">
              VCollab
            </span>
          </button>

          {/* Nav links */}
          <nav className="flex items-center gap-0.5">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150
                  ${isActive
                    ? 'bg-ink text-paper shadow-sm'
                    : 'text-ink-soft hover:bg-paper-dim hover:text-ink'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden md:block">{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Profile button */}
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-paper-dim transition-colors shrink-0"
          >
            <Avatar url={profile?.avatar_url} name={profile?.name} size={32} />
            {profile?.name && (
              <span className="text-sm font-medium text-ink-soft hidden lg:block pr-1">
                {profile.name.split(' ')[0]}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  )
}

function HomeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 21V12h6v9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function ConnectIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="8" cy="12" r="3" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="M10.5 10.5l5-3M10.5 13.5l5 3" strokeLinecap="round" />
    </svg>
  )
}
function CommunityIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="9" cy="7" r="3" />
      <path d="M2 21c0-3.5 3.1-6 7-6s7 2.5 7 6" strokeLinecap="round" />
      <circle cx="17" cy="8" r="2" />
      <path d="M16 14.5c2.4.5 4 2.4 4 6.5" strokeLinecap="round" />
    </svg>
  )
}
function EventsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  )
}
