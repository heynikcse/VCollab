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
  'React', 'Python', 'Node.js', 'Figma', 'Machine Learning', 'Flutter', 'UI/UX', 'DevOps',
]

export default function ConnectPage() {
  const { user, profile } = useAuth()
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')
  const [skillFilter, setSkillFilter] = useState(null)
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

    // attach my join-request status per project
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

  // Surface projects matching the student's own skills first (simple client-side match score)
  const sortedProjects = profile?.skills?.length
    ? [...projects].sort((a, b) => {
        const scoreA = a.skills.filter((s) => profile.skills.includes(s)).length
        const scoreB = b.skills.filter((s) => profile.skills.includes(s)).length
        return scoreB - scoreA
      })
    : projects

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
      <div className="space-y-4 max-w-2xl">
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadProjects()}
            placeholder="Search by project name..."
            className="input flex-1"
          />
          <Button variant="accent" onClick={() => setShowCreate(true)}>
            + Create project
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {SKILL_FILTERS.map((s) => (
            <SkillPill key={s} active={skillFilter === s} onClick={() => setSkillFilter(skillFilter === s ? null : s)}>
              {s}
            </SkillPill>
          ))}
        </div>

        {loading ? (
          <div className="py-16 flex justify-center"><Spinner size={28} /></div>
        ) : sortedProjects.length === 0 ? (
          <EmptyState
            title="No projects match"
            description="Try a different skill filter, or start your own project."
            action={<Button variant="accent" size="sm" onClick={() => setShowCreate(true)}>Create project</Button>}
          />
        ) : (
          sortedProjects.map((p) => (
            <ProjectCard key={p.id} project={p} onUpdate={loadProjects} />
          ))
        )}
      </div>

      <ConnectPanel refreshKey={refreshKey} />

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { loadProjects(); setRefreshKey((k) => k + 1) }}
        />
      )}
    </div>
  )
}
