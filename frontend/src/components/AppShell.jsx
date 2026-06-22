import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Avatar } from '../components/ui/Primitives'

const NAV_ITEMS = [
  { to: '/feed', label: 'Feed', icon: HomeIcon },
  { to: '/connect', label: 'Connect', icon: ConnectIcon },
  { to: '/community', label: 'Community', icon: CommunityIcon },
  { to: '/events', label: 'Events', icon: EventsIcon },
  { to: '/messages', label: 'Messages', icon: MessagesIcon },
]

export default function AppShell() {
  const { profile, user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [hasUnread, setHasUnread] = useState(false)

  useEffect(() => {
  if (location.pathname.startsWith('/messages')) {
    setHasUnread(false)
  }
  }, [location.pathname])

  useEffect(() => {
    if (!user) return

    async function checkUnread() {
      const { count } = await supabase
        .from('direct_messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .is('read_at', null)
      setHasUnread((count || 0) > 0)
    }
    checkUnread()

    const channel = supabase
      .channel(`unread-dm-${user.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `receiver_id=eq.${user.id}` },
        () => setHasUnread(true)
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-30 bg-paper/95 backdrop-blur border-b border-line">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate('/feed')} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-ink flex items-center justify-center">
              <span className="font-display font-bold text-amber text-xs">C</span>
            </div>
            <span className="font-display font-semibold tracking-tight hidden sm:block">Collagram</span>
          </button>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `relative flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${isActive ? 'bg-ink text-paper' : 'text-ink-soft hover:bg-paper-dim'}`
                }
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:block">{label}</span>
                {to === '/messages' && hasUnread && (
                  <span className="absolute top-1 right-1 md:static md:ml-0.5 w-1.5 h-1.5 rounded-full bg-amber" />
                )}
              </NavLink>
            ))}
          </nav>

          <button onClick={() => navigate('/profile')} className="flex items-center gap-2">
            <Avatar url={profile?.avatar_url} name={profile?.name} size={32} />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
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
function MessagesIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M21 11.5a8.4 8.4 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.4 8.4 0 01-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.4 8.4 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
