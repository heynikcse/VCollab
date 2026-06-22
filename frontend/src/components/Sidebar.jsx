import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Card, Avatar } from './ui/Primitives'
import SkillPill from './ui/SkillPill'
import Button from './ui/Button'

export default function Sidebar() {
  const [hashtags, setHashtags] = useState([])
  const [activeProjects, setActiveProjects] = useState([])
  const [topStudent, setTopStudent] = useState(null)
  const [upcomingEvent, setUpcomingEvent] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadSidebarData()
  }, [])

  async function loadSidebarData() {
    // Trending hashtags: derive from recent post content client-side
    // (kept simple — no separate hashtags table in MVP schema)
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
        .slice(0, 5)
        .map(([tag]) => tag)
      setHashtags(top)
    }

    const { data: projects } = await supabase
      .from('projects')
      .select('id, title, member_count, team_size')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(3)
    setActiveProjects(projects || [])

    // "Top student" — most accepted project memberships, simple proxy for contribution
    const { data: members } = await supabase
      .from('project_members')
      .select('user_id, users(name, avatar_url)')
      .eq('status', 'accepted')
      .limit(100)
    if (members?.length) {
      const counts = {}
      for (const m of members) counts[m.user_id] = (counts[m.user_id] || { count: 0, user: m.users })
      for (const m of members) counts[m.user_id].count++
      const top = Object.values(counts).sort((a, b) => b.count - a.count)[0]
      if (top) setTopStudent(top)
    }

    const { data: event } = await supabase
      .from('events')
      .select('id, title, date')
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true })
      .limit(1)
      .maybeSingle()
    setUpcomingEvent(event)
  }

  return (
    <aside className="space-y-4">
      {hashtags.length > 0 && (
        <Card className="p-4">
          <SidebarHeader>Trending</SidebarHeader>
          <div className="flex flex-wrap gap-2 mt-3">
            {hashtags.map((tag) => (
              <SkillPill key={tag} size="sm">{tag}</SkillPill>
            ))}
          </div>
        </Card>
      )}

      {activeProjects.length > 0 && (
        <Card className="p-4">
          <SidebarHeader>Active projects</SidebarHeader>
          <div className="mt-3 space-y-3">
            {activeProjects.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate('/connect')}
                className="block w-full text-left"
              >
                <p className="text-sm font-medium text-ink leading-snug">{p.title}</p>
                <p className="text-xs text-ink-faint font-mono mt-0.5">
                  {p.member_count}/{p.team_size} members
                </p>
              </button>
            ))}
          </div>
        </Card>
      )}

      {topStudent && (
        <Card className="p-4">
          <SidebarHeader>Top student</SidebarHeader>
          <div className="flex items-center gap-3 mt-3">
            <Avatar url={topStudent.user?.avatar_url} name={topStudent.user?.name} size={36} />
            <div>
              <p className="text-sm font-medium text-ink">{topStudent.user?.name}</p>
              <p className="text-xs text-ink-faint font-mono">{topStudent.count} projects this period</p>
            </div>
          </div>
        </Card>
      )}

      {upcomingEvent && (
        <Card className="p-4">
          <SidebarHeader>Upcoming event</SidebarHeader>
          <p className="text-sm font-medium text-ink mt-3 leading-snug">{upcomingEvent.title}</p>
          <p className="text-xs text-ink-faint font-mono mt-1">
            {new Date(upcomingEvent.date).toLocaleDateString(undefined, {
              weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
            })}
          </p>
          <Button variant="secondary" size="sm" className="w-full mt-3" onClick={() => navigate('/events')}>
            View event
          </Button>
        </Card>
      )}
    </aside>
  )
}

function SidebarHeader({ children }) {
  return (
    <h3 className="text-xs font-mono text-ink-faint tracking-wide uppercase">{children}</h3>
  )
}
