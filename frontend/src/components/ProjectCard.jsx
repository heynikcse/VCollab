import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Card, Avatar } from './ui/Primitives'
import SkillPill from './ui/SkillPill'
import Button from './ui/Button'
import ProjectChatDrawer from './ProjectChatDrawer'

const STATUS_TONE = { open: 'teal', in_progress: 'amber', completed: 'default' }
const STATUS_LABEL = { open: 'Open', in_progress: 'In progress', completed: 'Completed' }

export default function ProjectCard({ project, onUpdate }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [requesting, setRequesting] = useState(false)
  const [requestStatus, setRequestStatus] = useState(project.my_request_status) // null | 'pending' | 'accepted' | 'declined'
  const [members, setMembers] = useState([])
  const [chatOpen, setChatOpen] = useState(false)

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
              <div key={m.id} className="flex items-center gap-2">
                <button
                  onClick={() => navigate(m.id === user.id ? '/profile' : `/profile/${m.id}`)}
                  className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                  title={`View ${m.name}`}
                >
                  <Avatar url={m.avatar_url} name={m.name} size={24} />
                  <span className="text-xs text-ink-soft">{m.name}</span>
                </button>
                {m.id !== user.id && (
                  <Button variant="ghost" size="sm" className="px-2" onClick={() => setChatOpen(true)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <path d="M21 11.5a8.4 8.4 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.4 8.4 0 01-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.4 8.4 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Button>
                )}
              </div>
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
          <div className="flex items-center gap-2">
            <Button
              variant={requestStatus === 'accepted' ? 'secondary' : 'accent'}
              size="sm"
              onClick={requestToJoin}
              disabled={ctaDisabled}
            >
              {ctaLabel()}
            </Button>
          </div>
        )}
      </div>

      <ProjectChatDrawer project={project} open={chatOpen} onClose={() => setChatOpen(false)} />
    </Card>
  )
}
