import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Card, Avatar } from './ui/Primitives'
import SkillPill from './ui/SkillPill'
import Button from './ui/Button'

const STATUS_TONE = { open: 'teal', in_progress: 'amber', completed: 'default' }
const STATUS_LABEL = { open: 'Open', in_progress: 'In progress', completed: 'Completed' }

export default function ProjectCard({ project, onUpdate }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [requesting, setRequesting] = useState(false)
  const [requestStatus, setRequestStatus] = useState(project.my_request_status) // null | 'pending' | 'accepted' | 'declined'
  const [members, setMembers] = useState([])

  useEffect(() => {
    let cancelled = false
    async function fetchMembers() {
      const { data } = await supabase
        .from('project_members')
        .select('user_id, users(id, name, avatar_url)')
        .eq('project_id', project.id)
        .eq('status', 'accepted')
      if (!cancelled) setMembers((data || []).map((m) => m.users).filter(Boolean))
    }
    fetchMembers()
    return () => { cancelled = true }
  }, [project.id])

  const isOwner = project.user_id === user.id
  const isFull = project.member_count >= project.team_size
  const owner = project.users

  async function requestToJoin() {
    if (requesting) return
    setRequesting(true)
    const { error } = await supabase
      .from('project_members')
      .insert({ project_id: project.id, user_id: user.id, status: 'pending' })
    setRequesting(false)
    if (!error) setRequestStatus('pending')
  }

  function ctaLabel() {
    if (isOwner) return 'Your project'
    if (isFull && requestStatus !== 'accepted') return 'Team full'
    if (requestStatus === 'pending') return 'Request sent'
    if (requestStatus === 'accepted') return 'You\u2019re a member'
    if (requestStatus === 'declined') return 'Request declined'
    return 'Request to join'
  }

  const ctaDisabled = isOwner || isFull || requestStatus

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display font-semibold text-ink">{project.title}</h3>
            <SkillPill size="sm" tone={STATUS_TONE[project.status]}>{STATUS_LABEL[project.status]}</SkillPill>
          </div>
          <p className="text-sm text-ink-soft leading-relaxed">{project.description}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {project.skills.map((s) => <SkillPill key={s} size="sm">{s}</SkillPill>)}
      </div>

      {members.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-ink-faint mb-1.5">Team members</p>
          <div className="flex flex-wrap items-center gap-2">
            {members.map((m) => (
              <button
                key={m.id}
                onClick={() => navigate(m.id === user.id ? '/profile' : `/profile/${m.id}`)}
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                title={m.name}
              >
                <Avatar url={m.avatar_url} name={m.name} size={24} />
                <span className="text-xs text-ink-soft">{m.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-line">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Avatar url={owner?.avatar_url} name={owner?.name} size={22} />
            <span className="text-xs text-ink-faint">{owner?.name}</span>
          </div>
          <span className="text-xs font-mono text-ink-faint">
            {project.member_count}/{project.team_size}
          </span>
          {project.github_url && (
            
            < a href={project.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-ink-soft hover:text-ink underline underline-offset-2"
            >
              repo →
            </a>
          )}
        </div>

        {!isOwner && (
          <Button
            variant={requestStatus === 'accepted' ? 'secondary' : 'accent'}
            size="sm"
            onClick={requestToJoin}
            disabled={ctaDisabled}
          >
            {ctaLabel()}
          </Button>
        )}
      </div>
    </Card>
  )
}
