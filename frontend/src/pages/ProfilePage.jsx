import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Avatar, Spinner, EmptyState } from '../components/ui/Primitives'
import SkillPill from '../components/ui/SkillPill'
import Button from '../components/ui/Button'
import ChangePasswordModal from '../components/ChangePasswordModal'
import DeleteAccountSection from '../components/DeleteAccountSection'

const TABS = [
  { key: 'posts',       label: 'Posts' },
  { key: 'projects',    label: 'Projects' },
  { key: 'communities', label: 'Communities' },
]

export default function ProfilePage() {
  const { userId } = useParams()
  const { user, profile: myProfile, signOut } = useAuth()
  const navigate = useNavigate()

  const targetId    = userId || user.id
  const isOwnProfile = targetId === user.id

  const [profile, setProfile]           = useState(isOwnProfile ? myProfile : null)
  const [tab, setTab]                   = useState('posts')
  const [posts, setPosts]               = useState([])
  const [projects, setProjects]         = useState([])
  const [communities, setCommunities]   = useState([])
  const [loading, setLoading]           = useState(true)
  const [stats, setStats]               = useState({ posts: 0, projects: 0, communities: 0 })
  const [showChangePw, setShowChangePw] = useState(false)

  // ── Update last_seen when viewing own profile ──────────────
  useEffect(() => {
    if (isOwnProfile) {
      supabase.from('users').update({ last_seen: new Date().toISOString() }).eq('id', user.id)
    }
  }, [isOwnProfile, user.id])

  // ── Load profile ───────────────────────────────────────────
  useEffect(() => {
    if (isOwnProfile) {
      setProfile(myProfile)
    } else {
      supabase
        .from('users')
        .select('*')
        .eq('id', targetId)
        .single()
        .then(({ data }) => setProfile(data))
    }
  }, [targetId, isOwnProfile, myProfile])

  // ── Load stats ─────────────────────────────────────────────
  useEffect(() => {
    async function loadStats() {
      const [{ count: postCount }, { count: projectCount }, { count: communityCount }] =
        await Promise.all([
          supabase
            .from('posts')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', targetId)
            .eq('is_hidden', false),
          supabase
            .from('projects')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', targetId),
          supabase
            .from('community_members')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', targetId),
        ])
      setStats({
        posts:       postCount       || 0,
        projects:    projectCount    || 0,
        communities: communityCount  || 0,
      })
    }
    loadStats()
  }, [targetId])

  // ── Load tab data ──────────────────────────────────────────
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
      const { data: owned } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', targetId)
      const { data: joined } = await supabase
        .from('project_members')
        .select('projects(*)')
        .eq('user_id', targetId)
        .eq('status', 'accepted')
      const joinedProjects = (joined || []).map((j) => j.projects).filter(Boolean)
      const all = [
        ...(owned || []),
        ...joinedProjects.filter((p) => p.user_id !== targetId),
      ]
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
    return (
      <div className="py-20 flex justify-center">
        <Spinner size={28} color="text-violet" />
      </div>
    )
  }

  return (
    <>
      <div className="max-w-2xl">
        {/* ── Profile header card ── */}
        <div className="vc-card overflow-hidden mb-5">
          {/* Banner */}
          <div className="h-24 bg-gradient-to-r from-violet/15 via-amber/10 to-teal/15" />

          <div className="px-5 pb-5">
            {/* Avatar + actions */}
            <div className="flex items-end justify-between -mt-8 mb-4">
              <div className="relative">
                <div
                  className="rounded-2xl border-4 border-paper-card overflow-hidden"
                  style={{ width: 72, height: 72 }}
                >
                  <Avatar url={profile.avatar_url} name={profile.name} size={72} />
                </div>
              </div>

              {isOwnProfile && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate('/profile/edit')}
                  >
                    Edit profile
                  </Button>
                  <button
                    onClick={signOut}
                    className="text-xs text-ink-faint hover:text-rust transition-colors px-2 py-1.5"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>

            {/* Name & meta */}
            <div className="mb-3">
              <h1 className="font-display text-xl font-bold text-ink">{profile.name}</h1>
              <p className="text-sm text-ink-faint font-mono mt-0.5">
                {profile.branch}{profile.year ? ` · Year ${profile.year}` : ''}
              </p>
            </div>

            {profile.bio && (
              <p className="text-sm text-ink-soft leading-relaxed mb-4">{profile.bio}</p>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-6 py-3 border-y border-line-soft mb-4">
              {[
                { label: 'Posts',       value: stats.posts },
                { label: 'Projects',    value: stats.projects },
                { label: 'Communities', value: stats.communities },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="font-display font-bold text-lg text-ink leading-none">{value}</p>
                  <p className="text-xs text-ink-faint mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Skills */}
            {profile.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {profile.skills.map((s) => (
                  <SkillPill key={s} size="sm">{s}</SkillPill>
                ))}
              </div>
            )}

            {/* GitHub */}
            {profile.github && (
              <a
                href={`https://github.com/${profile.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink transition-colors group"
              >
                <GithubIcon className="w-4 h-4 group-hover:text-ink" />
                <span className="underline underline-offset-2 hover:text-amber-deep">
                  github.com/{profile.github}
                </span>
              </a>
            )}

            {/* ── Account management (own profile only) ── */}
            {isOwnProfile && (
              <div className="mt-4 pt-4 border-t border-line-soft">
                <p className="section-label mb-2">Account</p>
                <button
                  onClick={() => setShowChangePw(true)}
                  className="text-sm text-ink-soft hover:text-ink transition-colors underline underline-offset-2"
                >
                  Change Password
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Tab bar ── */}
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

        {/* ── Tab content ── */}
        <div className="space-y-3">
          {loading ? (
            <div className="py-12 flex justify-center">
              <Spinner size={24} color="text-violet" />
            </div>
          ) : tab === 'posts' ? (
            posts.length === 0
              ? (
                <EmptyState
                  title="No posts yet"
                  description={isOwnProfile ? 'Share something with VIT Bhopal.' : undefined}
                />
              )
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
              ? (
                <EmptyState
                  title="No projects yet"
                  description="Join or create a project on the Connect page."
                />
              )
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
              ? (
                <EmptyState
                  title="No communities joined"
                  description="Explore and join communities that match your interests."
                />
              )
              : communities.map((c) => (
                <div key={c.id} className="vc-card p-4">
                  <h3 className="font-display font-bold text-sm text-ink">{c.name}</h3>
                  <p className="text-sm text-ink-soft mt-1 leading-relaxed">{c.description}</p>
                </div>
              ))
          )}
        </div>

        {/* ── Danger Zone (own profile only) ── */}
        {isOwnProfile && <DeleteAccountSection />}
      </div>

      {/* ── Change Password Modal ── */}
      {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}
    </>
  )
}

function GithubIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.5 0-.24-.01-1.04-.01-1.89-2.78.62-3.37-1.21-3.37-1.21-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.28 2.75 1.05a9.3 9.3 0 015 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.95.68 1.92 0 1.39-.01 2.51-.01 2.85 0 .28.18.6.69.5A10.27 10.27 0 0022 12.25C22 6.58 17.52 2 12 2z" />
    </svg>
  )
}