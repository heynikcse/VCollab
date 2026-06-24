import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Avatar, Spinner } from './ui/Primitives'
import SkillPill from './ui/SkillPill'
import Button from './ui/Button'

export default function ConnectPanel({ refreshKey }) {
  const { user } = useAuth()
  const [myProjects, setMyProjects] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])

  const load = useCallback(async () => {
    const { data: projects } = await supabase
      .from('projects')
      .select('id, title, member_count, team_size, status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setMyProjects(projects || [])

    if (projects?.length) {
      const projectIds = projects.map((p) => p.id)
      const { data: requests } = await supabase
        .from('project_members')
        .select('id, project_id, status, joined_at, users(name, avatar_url, skills, github)')
        .in('project_id', projectIds)
        .eq('status', 'pending')
        .order('joined_at', { ascending: true })
      setPendingRequests(requests || [])
    } else {
      setPendingRequests([])
    }
  }, [user.id])

  useEffect(() => { load() }, [load, refreshKey])

  async function respond(requestId, status) {
    await supabase.from('project_members').update({ status }).eq('id', requestId)
    load()
  }

  return (
    <aside className="space-y-3">
      {pendingRequests.length > 0 && (
        <div className="vc-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="section-label">Join Requests</p>
            <span className="text-xs font-mono bg-amber-soft text-amber-deep px-2 py-0.5 rounded-full border border-amber/20">
              {pendingRequests.length}
            </span>
          </div>
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div key={req.id} className="bg-paper-dim rounded-xl p-3">
                <div className="flex items-center gap-2.5">
                  <Avatar url={req.users?.avatar_url} name={req.users?.name} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink truncate">{req.users?.name}</p>
                    {req.users?.github && (
                      <a
                        href={`https://github.com/${req.users.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-ink-faint hover:text-ink underline underline-offset-2"
                      >
                        github/{req.users.github}
                      </a>
                    )}
                  </div>
                </div>
                {req.users?.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {req.users.skills.slice(0, 3).map((s) => (
                      <SkillPill key={s} size="sm">{s}</SkillPill>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-2.5">
                  <Button
                    size="sm"
                    variant="teal"
                    className="flex-1"
                    onClick={() => respond(req.id, 'accepted')}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => respond(req.id, 'declined')}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="vc-card p-4">
        <p className="section-label mb-3">Your Projects</p>
        {myProjects.length === 0 ? (
          <p className="text-sm text-ink-faint leading-relaxed">
            No projects yet. Create one to start collaborating.
          </p>
        ) : (
          <div className="space-y-2">
            {myProjects.map((p) => {
              const fillPct = Math.min(100, (p.member_count / p.team_size) * 100)
              return (
                <div key={p.id} className="bg-paper-dim rounded-xl p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-ink truncate flex-1">{p.title}</span>
                    <span className="text-xs font-mono text-ink-faint shrink-0 ml-2">
                      {p.member_count}/{p.team_size}
                    </span>
                  </div>
                  <div className="h-1 bg-line rounded-full overflow-hidden">
                    <div className="h-full bg-teal rounded-full" style={{ width: `${fillPct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </aside>
  )
}
