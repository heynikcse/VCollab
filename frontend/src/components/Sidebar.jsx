import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Avatar } from './ui/Primitives'
import SkillPill from './ui/SkillPill'
import Button from './ui/Button'

export default function Sidebar() {
  const [hashtags, setHashtags] = useState([])
  const [activeProjects, setActiveProjects] = useState([])
  const [topStudent, setTopStudent] = useState(null)
  const [popularEvents, setPopularEvents] = useState([])
  const navigate = useNavigate()

  useEffect(() => { loadSidebarData() }, [])

  async function loadSidebarData() {
    // ── Trending hashtags ──────────────────────────────────────────
    const { data: recentPosts } = await supabase
      .from('posts')
      .select('content')
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(50)

    if (recentPosts) {
      const counts = {}
      for (const post of recentPosts) {
        const tags = post.content.match(/#\w+/g) || []
        for (const tag of tags) counts[tag] = (counts[tag] || 0) + 1
      }
      const top = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([tag]) => tag)
      setHashtags(top)
    }

    // ── Open projects ──────────────────────────────────────────────
    const { data: projects } = await supabase
      .from('projects')
      .select('id, title, member_count, team_size')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(4)
    setActiveProjects(projects || [])

    // ── Active collaborator ────────────────────────────────────────
    const { data: members } = await supabase
      .from('project_members')
      .select('user_id, users(name, avatar_url)')
      .eq('status', 'accepted')
      .limit(100)
    if (members?.length) {
      const counts = {}
      for (const m of members) {
        if (!counts[m.user_id]) counts[m.user_id] = { count: 0, user: m.users }
        counts[m.user_id].count++
      }
      const top = Object.values(counts).sort((a, b) => b.count - a.count)[0]
      if (top) setTopStudent(top)
    }

    // ── Popular events (top 3 by interest count) ───────────────────
    const { data: eventRows } = await supabase
      .from('events')
      .select('id, title, date')
      .gte('date', new Date().toISOString())
      .limit(20)

    const eventIds = (eventRows || []).map((e) => e.id)
    let interestCounts = {}
    if (eventIds.length) {
      const { data: allInterests } = await supabase
        .from('event_interests')
        .select('event_id')
        .in('event_id', eventIds)
      for (const i of allInterests || [])
        interestCounts[i.event_id] = (interestCounts[i.event_id] || 0) + 1
    }

    const popular = (eventRows || [])
      .map((e) => ({ ...e, interest_count: interestCounts[e.id] || 0 }))
      .sort((a, b) => b.interest_count - a.interest_count)
      .slice(0, 3)
    setPopularEvents(popular)
  }

  return (
    <aside className="space-y-3">

      {/* Trending Topics */}
      {hashtags.length > 0 && (
        <div className="vc-card p-4">
          <SectionLabel>Trending Topics</SectionLabel>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {hashtags.map((tag) => (
              <SkillPill key={tag} size="sm" tone="violet">{tag}</SkillPill>
            ))}
          </div>
        </div>
      )}

      {/* Open Projects */}
      {activeProjects.length > 0 && (
        <div className="vc-card p-4">
          <SectionLabel>Open Projects</SectionLabel>
          <div className="mt-3 space-y-2.5">
            {activeProjects.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate('/connect')}
                className="block w-full text-left group"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-ink leading-snug group-hover:text-amber-deep transition-colors truncate">
                    {p.title}
                  </p>
                  <span className="text-[10px] font-mono text-ink-faint shrink-0 bg-paper-dim px-1.5 py-0.5 rounded-full">
                    {p.member_count}/{p.team_size}
                  </span>
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate('/connect')}
            className="mt-3 text-xs text-violet hover:text-violet/80 font-medium transition-colors"
          >
            View all projects →
          </button>
        </div>
      )}

      {/* Active Collaborator */}
      {topStudent && (
        <div className="vc-card p-4">
          <SectionLabel>Active Collaborator</SectionLabel>
          <div className="flex items-center gap-3 mt-3">
            <Avatar url={topStudent.user?.avatar_url} name={topStudent.user?.name} size={38} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink truncate">{topStudent.user?.name}</p>
              <p className="text-xs text-ink-faint font-mono mt-0.5">
                {topStudent.count} project{topStudent.count !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="ml-auto shrink-0 w-8 h-8 rounded-xl bg-amber-soft flex items-center justify-center">
              <span className="text-amber-deep text-sm">★</span>
            </div>
          </div>
        </div>
      )}

      {/* Popular Events */}
      {popularEvents.length > 0 && (
        <div className="vc-card p-4">
          <SectionLabel>Popular Events</SectionLabel>
          <div className="mt-3 space-y-3">
            {popularEvents.map((ev, i) => (
              <div key={ev.id} className="flex items-center gap-2.5">
                {/* Rank badge */}
                <span style={{
                  minWidth: 20,
                  height: 20,
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: i === 0 ? '#6d5acd' : i === 1 ? '#ede9fb' : '#f3f3f3',
                  color: i === 0 ? '#fff' : i === 1 ? '#6d5acd' : '#bbb',
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {i + 1}
                </span>

                {/* Title + date */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate leading-snug">{ev.title}</p>
                  <p className="text-xs text-ink-faint font-mono mt-0.5">
                    {new Date(ev.date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                {/* Interest count */}
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: 11,
                  color: '#6d5acd',
                  fontWeight: 600,
                  flexShrink: 0,
                }}>
                  <svg viewBox="0 0 24 24" fill="#6d5acd" style={{ width: 11, height: 11 }}>
                    <path d="M12 21C12 21 3 13.5 3 8a5 5 0 0110 0 5 5 0 0110 0c0 5.5-9 13-9 13z"/>
                  </svg>
                  {ev.interest_count}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/events')}
            className="mt-3 text-xs text-violet hover:text-violet/80 font-medium transition-colors"
          >
            View all events →
          </button>
        </div>
      )}

    </aside>
  )
}

function SectionLabel({ children }) {
  return <p className="section-label">{children}</p>
}