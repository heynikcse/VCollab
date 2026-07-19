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

// Loose match: exact/substring match either direction, or enough shared
// characters that it's clearly the "same" skill even if not typed exactly.
function fuzzyMatch(skillName, query) {
  const a = (skillName || '').toLowerCase().trim()
  const b = (query || '').toLowerCase().trim()
  if (!a || !b) return false
  if (a === b || a.includes(b) || b.includes(a)) return true

  const aChars = a.split('')
  let common = 0
  for (const ch of b) {
    const idx = aChars.indexOf(ch)
    if (idx !== -1) { common++; aChars.splice(idx, 1) }
  }
  return common >= Math.min(3, b.length)
}

export default function ConnectPage() {
  // ✅ Fix: destructure user and profile from useAuth
  const { user, profile } = useAuth()

  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')
  const [skillFilter, setSkillFilter] = useState(null)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [customSkills, setCustomSkills] = useState([])
  const [customSkillInput, setCustomSkillInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const loadProjects = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('projects')
      .select('*, users(name, avatar_url)')
      .order('created_at', { ascending: false })

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

  useEffect(() => { loadProjects() }, [refreshKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fuzzy skill match — doesn't need to be an exact match, just meaningfully close
  const skillMatchedProjects = skillFilter
    ? projects.filter((p) => (p.skills || []).some((s) => fuzzyMatch(s, skillFilter)))
    : projects

  // Once a project's team is full, only its owner or an accepted member should
  // still see it in Find Projects — everyone else it just disappears for.
  const visibleProjects = skillMatchedProjects.filter((p) => {
    const isFull = p.member_count >= p.team_size
    if (!isFull) return true
    return p.user_id === user.id || p.my_request_status === 'accepted'
  })

  const sortedProjects = profile?.skills?.length
    ? [...visibleProjects].sort((a, b) => {
        const scoreA = a.skills.filter((s) => profile.skills.includes(s)).length
        const scoreB = b.skills.filter((s) => profile.skills.includes(s)).length
        return scoreB - scoreA
      })
    : visibleProjects

  // Preset skills + any custom ones typed in this session, deduped
  const allSkills = [...SKILL_FILTERS, ...customSkills.filter((s) => !SKILL_FILTERS.includes(s))]

  function addCustomSkill() {
    const val = customSkillInput.trim()
    if (!val || val.length > 15) return
    setCustomSkills((prev) => (prev.includes(val) ? prev : [...prev, val]))
    setSkillFilter(val)
    setCustomSkillInput('')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_288px] gap-5">
      <div className="space-y-4 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-xl text-ink">Find Projects</h1>
            <p className="text-sm text-ink-faint mt-0.5">Collaborate on what matters to you</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilterModal(true)}
              className={`flex items-center gap-2 px-4 h-10 rounded-xl border text-sm font-medium transition-all duration-150
                ${skillFilter
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
            <Button variant="accent" onClick={() => setShowCreate(true)}>
              <span className="mr-1.5">+</span> Create
            </Button>
          </div>
        </div>

        {/* Search row */}
        <div className="relative">
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

      {showFilterModal && (
        <div
          className="fixed inset-0 bg-ink/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          onClick={() => setShowFilterModal(false)}
        >
          <div
            className="bg-paper-card rounded-t-3xl sm:rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto shadow-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle for mobile */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 bg-line rounded-full" />
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-display text-lg font-bold text-ink">Filter by skill</h2>
                  <p className="text-sm text-ink-faint mt-0.5">Pick one, or add your own</p>
                </div>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="w-8 h-8 rounded-xl bg-paper-dim hover:bg-line text-ink-faint flex items-center justify-center transition-colors shrink-0"
                >
                  ✕
                </button>
              </div>

              {/* Custom skill input */}
              <div className="mb-4">
                <label className="block text-xs font-mono text-ink-soft mb-1.5 tracking-wide uppercase">
                  Not in the list?
                </label>
                <div className="flex gap-2 items-start">
                  <div className="flex-1">
                    <input
                      value={customSkillInput}
                      onChange={(e) => setCustomSkillInput(e.target.value.slice(0, 15))}
                      onKeyDown={(e) => e.key === 'Enter' && addCustomSkill()}
                      placeholder="Type a skill..."
                      maxLength={15}
                      className="input"
                    />
                    <p className="text-[10px] text-ink-faint mt-1 text-right">
                      {customSkillInput.length}/15
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={addCustomSkill}
                    disabled={!customSkillInput.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Skill grid */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-ink-soft tracking-wide uppercase">All skills</span>
                {skillFilter && (
                  <button
                    onClick={() => setSkillFilter(null)}
                    className="text-xs text-ink-faint hover:text-rust transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {allSkills.map((s) => (
                  <SkillPill
                    key={s}
                    active={skillFilter === s}
                    onClick={() => setSkillFilter(skillFilter === s ? null : s)}
                  >
                    {s}
                  </SkillPill>
                ))}
              </div>

              <div className="pt-4">
                <Button variant="accent" className="w-full" onClick={() => setShowFilterModal(false)}>
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}