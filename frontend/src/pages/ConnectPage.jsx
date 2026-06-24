import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import ProjectCard from '../components/ProjectCard'
import CreateProjectModal from '../components/CreateProjectModal'
import ConnectPanel from '../components/ConnectPanel'
import SkillPill from '../components/ui/SkillPill'
import Button from '../components/ui/Button'
import { EmptyState, Spinner } from '../components/ui/Primitives'

const SKILL_FILTERS = [
  'React', 'Vue', 'Node.js', 'Python', 'Java', 'C++', 'Figma',
  'UI/UX', 'Machine Learning', 'Data Science', 'Flutter', 'Android',
  'iOS', 'DevOps', 'Solidity', 'Go', 'Rust', 'PostgreSQL', 'AWS', 'Writing',
]

export default function ConnectPage() {
  // ✅ Fix: destructure user and profile from useAuth
  const { user, profile } = useAuth()

  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')
  const [skillFilter, setSkillFilter] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const loadProjects = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('projects')
      .select('*, users(name, avatar_url)')
      .order('created_at', { ascending: false })

    if (skillFilter) query = query.contains('skills', [skillFilter])
    if (search.trim()) query = query.ilike('title', `%${search.trim()}%`)

    const { data, error } = await query.limit(30)
    if (error) { console.error(error); setLoading(false); return }

    const projectIds = (data || []).map((p) => p.id)
    let myRequests = {}
    if (projectIds.length) {
      const { data: requests } = await supabase
        .from('project_members')
        .select('project_id, status')
        .eq('user_id', user.id)
        .in('project_id', projectIds)
      myRequests = Object.fromEntries((requests || []).map((r) => [r.project_id, r.status]))
    }

    setProjects((data || []).map((p) => ({ ...p, my_request_status: myRequests[p.id] || null })))
    setLoading(false)
  }, [skillFilter, search, user.id])

  useEffect(() => { loadProjects() }, [skillFilter, refreshKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const sortedProjects = profile?.skills?.length
    ? [...projects].sort((a, b) => {
        const scoreA = a.skills.filter((s) => profile.skills.includes(s)).length
        const scoreB = b.skills.filter((s) => profile.skills.includes(s)).length
        return scoreB - scoreA
      })
    : projects

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_288px] gap-5">
      <div className="space-y-4 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-xl text-ink">Find Projects</h1>
            <p className="text-sm text-ink-faint mt-0.5">Collaborate on what matters to you</p>
          </div>
          <Button variant="accent" onClick={() => setShowCreate(true)}>
            <span className="mr-1.5">+</span> Create
          </Button>
        </div>

        {/* Search + Filter button row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.5-4.5" strokeLinecap="round" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadProjects()}
              placeholder="Search projects..."
              className="input pl-10"
            />
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 px-4 rounded-xl border text-sm font-medium transition-all duration-150
              ${skillFilter || showFilters
                ? 'bg-ink text-paper border-ink'
                : 'bg-paper-card border-line text-ink-soft hover:border-ink/30 hover:text-ink'
              }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M3 6h18M7 12h10M11 18h2" strokeLinecap="round" />
            </svg>
            Filter
            {skillFilter && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber shrink-0" />
            )}
          </button>
        </div>

        {/* Collapsible skill filter panel */}
        {showFilters && (
          <div className="vc-card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="section-label">Filter by skill</p>
              {skillFilter && (
                <button
                  onClick={() => setSkillFilter(null)}
                  className="text-xs text-ink-faint hover:text-rust transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SKILL_FILTERS.map((s) => (
                <SkillPill
                  key={s}
                  active={skillFilter === s}
                  onClick={() => setSkillFilter(skillFilter === s ? null : s)}
                >
                  {s}
                </SkillPill>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex justify-center">
            <Spinner size={28} color="text-violet" />
          </div>
        ) : sortedProjects.length === 0 ? (
          <EmptyState
            title="No projects match"
            description="Try a different filter, or start your own project."
            action={
              <Button variant="accent" size="sm" onClick={() => setShowCreate(true)}>
                Create project
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {sortedProjects.map((p) => (
              <ProjectCard key={p.id} project={p} onUpdate={loadProjects} />
            ))}
          </div>
        )}
      </div>

      <div className="hidden lg:block">
        <ConnectPanel refreshKey={refreshKey} />
      </div>

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { loadProjects(); setRefreshKey((k) => k + 1) }}
        />
      )}
    </div>
  )
}