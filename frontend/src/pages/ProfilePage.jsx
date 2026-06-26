import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Avatar, Spinner, EmptyState } from '../components/ui/Primitives'
import SkillPill from '../components/ui/SkillPill'

const TABS = [
  { key: 'posts',       label: 'Posts' },
  { key: 'projects',    label: 'Projects' },
  { key: 'communities', label: 'Communities' },
]

// ── GitHub contribution graph (public API, no token needed) ──
function GitHubContributions({ username }) {
  const [weeks, setWeeks]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)

  useEffect(() => {
    if (!username) return
    setLoading(true)
    setError(false)

    fetch(`https://corsproxy.io/?${encodeURIComponent(`https://github.com/users/${username}/contributions`)}`)
      .then((r) => r.text())
      .then((html) => {
        const parser = new DOMParser()
        const doc    = parser.parseFromString(html, 'text/html')
        const rects  = Array.from(doc.querySelectorAll('td.ContributionCalendar-day'))

        const allDays = rects.map((el) => ({
          count: parseInt(el.getAttribute('data-count') || '0', 10),
          date:  el.getAttribute('data-date') || '',
          level: parseInt(el.getAttribute('data-level') || '0', 10),
        }))

        const grouped = []
        for (let i = 0; i < allDays.length; i += 7) {
          grouped.push(allDays.slice(i, i + 7))
        }
        setWeeks(grouped.slice(-26))
        setLoading(false)
      })
      .catch(() => { setError(true); setLoading(false) })
  }, [username])

  const LEVEL_COLORS = [
    'bg-paper-dim  border-line',
    'bg-teal/20    border-teal/10',
    'bg-teal/40    border-teal/20',
    'bg-teal/70    border-teal/30',
    'bg-teal        border-teal/50',
  ]

  if (!username) return null

  return (
    <div className="mt-4 pt-4 border-t border-line-soft">
      <div className="flex items-center justify-between mb-2">
        <p className="section-label">GitHub Activity</p>
        <a
          href={`https://github.com/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-ink-faint hover:text-ink transition-colors"
        >
          @{username}
        </a>
      </div>

      {loading && (
        <div className="flex justify-center py-4">
          <Spinner size={16} color="text-ink-faint" />
        </div>
      )}

      {error && (
        <p className="text-xs text-ink-faint">Could not load contributions.</p>
      )}

      {!loading && !error && (
        <div className="flex gap-[2px] w-full">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[2px] flex-1">
              {week.map((day, di) => (
                <div
                  key={di}
                  title={day.date ? `${day.date}: ${day.count} contribution${day.count !== 1 ? 's' : ''}` : ''}
                  className={`w-full rounded-[2px] border ${LEVEL_COLORS[day.level] || LEVEL_COLORS[0]}`}
                  style={{ aspectRatio: '1' }}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const { userId } = useParams()
  const { user, profile: myProfile } = useAuth()

  const targetId     = userId || user.id
  const isOwnProfile = targetId === user.id

  const [profile, setProfile]         = useState(isOwnProfile ? myProfile : null)
  const [tab, setTab]                 = useState('posts')
  const [posts, setPosts]             = useState([])
  const [projects, setProjects]       = useState([])
  const [communities, setCommunities] = useState([])
  const [loading, setLoading]         = useState(true)
  const [stats, setStats]             = useState({ posts: 0, projects: 0, communities: 0 })

  // Touch last_seen on own profile visit
  useEffect(() => {
    if (isOwnProfile) {
      supabase.from('users').update({ last_seen: new Date().toISOString() }).eq('id', user.id)
    }
  }, [isOwnProfile, user.id])

  // Load profile
  useEffect(() => {
    if (isOwnProfile) {
      setProfile(myProfile)
    } else {
      supabase.from('users').select('*').eq('id', targetId).single()
        .then(({ data }) => setProfile(data))
    }
  }, [targetId, isOwnProfile, myProfile])

  // Load stats
  useEffect(() => {
    async function loadStats() {
      const [{ count: postCount }, { count: projectCount }, { count: communityCount }] =
        await Promise.all([
          supabase.from('posts').select('id', { count: 'exact', head: true })
            .eq('user_id', targetId).eq('is_hidden', false),
          supabase.from('projects').select('id', { count: 'exact', head: true })
            .eq('user_id', targetId),
          supabase.from('community_members').select('id', { count: 'exact', head: true })
            .eq('user_id', targetId),
        ])
      setStats({ posts: postCount || 0, projects: projectCount || 0, communities: communityCount || 0 })
    }
    loadStats()
  }, [targetId])

  // Load tab data
  const loadTabData = useCallback(async () => {
    setLoading(true)
    if (tab === 'posts') {
      let query = supabase
        .from('posts')
        .select('*, users(name, avatar_url, branch, year)')
        .eq('user_id', targetId)
      if (!isOwnProfile) query = query.eq('is_hidden', false)
      const { data } = await query.order('created_at', { ascending: false }).limit(20)
      setPosts(data || [])
    } else if (tab === 'projects') {
      const { data: owned } = await supabase.from('projects').select('*').eq('user_id', targetId)
      const { data: joined } = await supabase
        .from('project_members').select('projects(*)')
        .eq('user_id', targetId).eq('status', 'accepted')
      const joinedProjects = (joined || []).map((j) => j.projects).filter(Boolean)
      setProjects([...(owned || []), ...joinedProjects.filter((p) => p.user_id !== targetId)])
    } else if (tab === 'communities') {
      const { data } = await supabase
        .from('community_members').select('communities(*)')
        .eq('user_id', targetId)
      setCommunities((data || []).map((d) => d.communities).filter(Boolean))
    }
    setLoading(false)
  }, [tab, targetId, isOwnProfile])

  useEffect(() => { loadTabData() }, [loadTabData])

  if (!profile) {
    return (
      <div className="py-20 flex justify-center">
        <Spinner size={28} color="text-violet" />
      </div>
    )
  }

  return (
    <div className="flex gap-6 items-start max-w-5xl mx-auto">

      {/* ════════ LEFT — sticky profile card ════════ */}
      <aside className="hidden md:flex flex-col gap-4 w-72 shrink-0 sticky top-6">
        <div className="vc-card overflow-hidden">
          {/* Banner */}
          <div className="h-16 bg-gradient-to-r from-violet/15 via-amber/10 to-teal/15" />

          <div className="px-4 pb-5">
            {/* Avatar */}
            <div className="-mt-8 mb-3">
              <div className="rounded-2xl border-4 border-paper-card overflow-hidden inline-block"
                style={{ width: 64, height: 64 }}>
                <Avatar url={profile.avatar_url} name={profile.name} size={64} />
              </div>
            </div>

            {/* Name & meta */}
            <h1 className="font-display text-lg font-bold text-ink leading-tight">{profile.name}</h1>
            <p className="text-xs text-ink-faint font-mono mt-0.5">
              {profile.branch}{profile.year ? ` · Year ${profile.year}` : ''}
            </p>

            {profile.bio && (
              <p className="text-xs text-ink-soft leading-relaxed mt-2">{profile.bio}</p>
            )}

            {/* Stats */}
            <div className="flex items-center justify-between py-3 border-y border-line-soft mt-4 mb-3">
              {[
                { label: 'Posts',       value: stats.posts },
                { label: 'Projects',    value: stats.projects },
                { label: 'Communities', value: stats.communities },
              ].map(({ label, value }) => (
                <div key={label} className="text-center flex-1">
                  <p className="font-display font-bold text-base text-ink leading-none">{value}</p>
                  <p className="text-[10px] text-ink-faint mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Skills */}
            {profile.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {profile.skills.map((s) => (
                  <SkillPill key={s} size="sm">{s}</SkillPill>
                ))}
              </div>
            )}

            {/* GitHub link */}
            {profile.github && (
              <a
                href={`https://github.com/${profile.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink transition-colors group mb-1"
              >
                <GithubIcon className="w-3.5 h-3.5" />
                <span className="underline underline-offset-2">github.com/{profile.github}</span>
              </a>
            )}

            {/* GitHub contribution graph */}
            {profile.github && <GitHubContributions username={profile.github} />}
          </div>
        </div>
      </aside>

      {/* ════════ MIDDLE — tabs + content ════════ */}
      <main className="flex-1 min-w-0">
        {/* Mobile-only compact profile header */}
        <div className="md:hidden vc-card overflow-hidden mb-4">
          <div className="h-16 bg-gradient-to-r from-violet/15 via-amber/10 to-teal/15" />
          <div className="px-4 pb-4">
            <div className="flex items-end justify-between -mt-7 mb-3">
              <div className="rounded-xl border-4 border-paper-card overflow-hidden"
                style={{ width: 56, height: 56 }}>
                <Avatar url={profile.avatar_url} name={profile.name} size={56} />
              </div>
            </div>
            <h1 className="font-display font-bold text-base text-ink">{profile.name}</h1>
            <p className="text-xs text-ink-faint font-mono">
              {profile.branch}{profile.year ? ` · Year ${profile.year}` : ''}
            </p>
            <div className="flex gap-5 mt-3">
              {[
                { label: 'Posts',       value: stats.posts },
                { label: 'Projects',    value: stats.projects },
                { label: 'Communities', value: stats.communities },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="font-display font-bold text-sm text-ink">{value}</p>
                  <p className="text-[10px] text-ink-faint">{label}</p>
                </div>
              ))}
            </div>
            {profile.github && (
  
              < a href={`https://github.com/${profile.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink transition-colors mt-3"
              >
                <GithubIcon className="w-3.5 h-3.5" />
                <span className="underline underline-offset-2">github.com/{profile.github}</span>
              </a>
            )}

{profile.github && <GitHubContributions username={profile.github} />}
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 border-b border-line mb-4">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`tab-btn ${tab === t.key ? 'tab-btn-active' : 'tab-btn-inactive'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="space-y-3">
          {loading ? (
            <div className="py-12 flex justify-center">
              <Spinner size={24} color="text-violet" />
            </div>
          ) : tab === 'posts' ? (
            posts.length === 0
              ? <EmptyState title="No posts yet"
                  description={isOwnProfile ? 'Share something with VIT Bhopal.' : undefined} />
              : posts.map((p) => (
                <div key={p.id} className="vc-card p-4">
                  <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{p.content}</p>
                  <p className="text-xs text-ink-faint font-mono mt-2">
                    {new Date(p.created_at).toLocaleDateString(undefined, {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
              ))
          ) : tab === 'projects' ? (
            projects.length === 0
              ? <EmptyState title="No projects yet"
                  description="Join or create a project on the Connect page." />
              : projects.map((p) => (
                <div key={p.id} className="vc-card p-4">
                  <h3 className="font-display font-bold text-sm text-ink">{p.title}</h3>
                  <p className="text-sm text-ink-soft mt-1 leading-relaxed">{p.description}</p>
                  {p.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {p.skills.map((s) => <SkillPill key={s} size="sm">{s}</SkillPill>)}
                    </div>
                  )}
                </div>
              ))
          ) : (
            communities.length === 0
              ? <EmptyState title="No communities joined"
                  description="Explore and join communities that match your interests." />
              : communities.map((c) => (
                <div key={c.id} className="vc-card p-4">
                  <h3 className="font-display font-bold text-sm text-ink">{c.name}</h3>
                  <p className="text-sm text-ink-soft mt-1 leading-relaxed">{c.description}</p>
                </div>
              ))
          )}
        </div>
      </main>
    </div>
  )
}

function GithubIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.5 0-.24-.01-1.04-.01-1.89-2.78.62-3.37-1.21-3.37-1.21-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.28 2.75 1.05a9.3 9.3 0 015 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.95.68 1.92 0 1.39-.01 2.51-.01 2.85 0 .28.18.6.69.5A10.27 10.27 0 0022 12.25C22 6.58 17.52 2 12 2z" />
    </svg>
  )
}