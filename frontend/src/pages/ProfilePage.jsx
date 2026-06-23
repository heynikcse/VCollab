import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Avatar, Card, Spinner, EmptyState } from '../components/ui/Primitives'
import SkillPill from '../components/ui/SkillPill'
import Button from '../components/ui/Button'
import GithubPanel from '../components/GithubPanel'

const TABS = [
  { key: 'posts', label: 'Posts' },
  { key: 'projects', label: 'Projects' },
  { key: 'communities', label: 'Communities' },
]

export default function ProfilePage() {
  const { userId } = useParams()
  const { user, profile: myProfile, signOut } = useAuth()
  const navigate = useNavigate()

  const targetId = userId || user.id
  const isOwnProfile = targetId === user.id

  const [profile, setProfile] = useState(isOwnProfile ? myProfile : null)
  const [tab, setTab] = useState('posts')
  const [posts, setPosts] = useState([])
  const [projects, setProjects] = useState([])
  const [communities, setCommunities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOwnProfile) {
      setProfile(myProfile)
    } else {
      supabase.from('users').select('*').eq('id', targetId).single().then(({ data }) => setProfile(data))
    }
  }, [targetId, isOwnProfile, myProfile])

  const loadTabData = useCallback(async () => {
    setLoading(true)
    if (tab === 'posts') {
      let query = supabase.from('posts').select('*, users(name, avatar_url, branch, year)').eq('user_id', targetId)
      if (!isOwnProfile) query = query.eq('is_hidden', false)
      const { data } = await query.order('created_at', { ascending: false }).limit(20)
      setPosts(data || [])
    } else if (tab === 'projects') {
      const { data: owned } = await supabase.from('projects').select('*').eq('user_id', targetId)
      const { data: joined } = await supabase
        .from('project_members')
        .select('projects(*)')
        .eq('user_id', targetId)
        .eq('status', 'accepted')
      const joinedProjects = (joined || []).map((j) => j.projects).filter(Boolean)
      const all = [...(owned || []), ...joinedProjects.filter((p) => p.user_id !== targetId)]
      setProjects(all)
    } else if (tab === 'communities') {
      const { data } = await supabase
        .from('community_members')
        .select('communities(*)')
        .eq('user_id', targetId)
      setCommunities((data || []).map((d) => d.communities).filter(Boolean))
    }
    setLoading(false)
  }, [tab, targetId, isOwnProfile])

  useEffect(() => { loadTabData() }, [loadTabData])

  if (!profile) {
    return <div className="py-16 flex justify-center"><Spinner size={28} /></div>
  }

  return (
    <div className="max-w-2xl">
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar url={profile.avatar_url} name={profile.name} size={72} />
            <div>
              <h1 className="font-display text-xl font-semibold">{profile.name}</h1>
              <p className="text-sm text-ink-faint font-mono mt-0.5">
                {profile.branch}{profile.year ? ` · Year ${profile.year}` : ''}
              </p>
            </div>
          </div>
          {isOwnProfile ? (
            <div className="flex flex-col gap-2 items-end">
              <Button variant="secondary" size="sm" onClick={() => navigate('/profile/edit')}>Edit profile</Button>
              <button onClick={signOut} className="text-xs text-ink-faint hover:text-rust">Sign out</button>
            </div>
          ) : (
            <Button variant="accent" size="sm" onClick={() => navigate('/connect')}>
              Connect
            </Button>
          )}
        </div>

        {profile.bio && <p className="text-sm text-ink-soft mt-4 leading-relaxed">{profile.bio}</p>}

        {profile.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {profile.skills.map((s) => <SkillPill key={s} size="sm">{s}</SkillPill>)}
          </div>
        )}

        {profile.github && (
          <a
            href={`https://github.com/${profile.github}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-ink mt-4 underline underline-offset-2 hover:text-amber-deep"
          >
            <GithubIcon className="w-4 h-4" />
            github.com/{profile.github}
          </a>
        )}
      </Card>

      <GithubPanel username={profile.github} />

      <div className="flex items-center gap-1 border-b border-line mt-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
              ${tab === t.key ? 'border-ink text-ink' : 'border-transparent text-ink-faint hover:text-ink'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
          {loading ? (
          <div className="py-12 flex justify-center"><Spinner size={24} /></div>
        ) : tab === 'posts' ? (
          posts.length === 0 ? <EmptyState title="No posts yet" /> : posts.map((p) => (
            <Card key={p.id} className="p-4">
              <p className="text-sm text-ink whitespace-pre-wrap">{p.content}</p>
            </Card>
          ))
        ) : tab === 'projects' ? (
          projects.length === 0 ? <EmptyState title="No projects yet" /> : projects.map((p) => (
            <Card key={p.id} className="p-4">
              <h3 className="font-display font-semibold text-sm">{p.title}</h3>
              <p className="text-sm text-ink-soft mt-1">{p.description}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {p.skills.map((s) => <SkillPill key={s} size="sm">{s}</SkillPill>)}
              </div>
            </Card>
          ))
        ) : (
          communities.length === 0 ? <EmptyState title="No communities joined" /> : communities.map((c) => (
            <Card key={c.id} className="p-4">
              <h3 className="font-display font-semibold text-sm">{c.name}</h3>
              <p className="text-sm text-ink-soft mt-1">{c.description}</p>
            </Card>
          ))
        )}
      </div>
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
