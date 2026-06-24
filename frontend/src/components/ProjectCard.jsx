import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Avatar, Spinner } from './ui/Primitives'
import SkillPill from './ui/SkillPill'
import Button from './ui/Button'
import TeamChatModal from './TeamChatModal'
import EditProjectModal from './EditProjectModal'

const STATUS_CONFIG = {
  open: { tone: 'teal', label: 'Open', dot: '🟢' },
  in_progress: { tone: 'amber', label: 'In Progress', dot: '🟡' },
  completed: { tone: 'default', label: 'Completed', dot: '⚪' },
}

export default function ProjectCard({ project, onUpdate }) {
  const { user } = useAuth()

  const [showChat, setShowChat] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [requestStatus, setRequestStatus] = useState(project.my_request_status)
  const [leaving, setLeaving] = useState(false)
  const [members, setMembers] = useState([]) // accepted members with avatar/name
  const [localProject, setLocalProject] = useState(project) // track edits locally

  const isOwner = localProject.user_id === user.id
  const isFull = localProject.member_count >= localProject.team_size
  const owner = localProject.users
  const statusCfg = STATUS_CONFIG[localProject.status] || STATUS_CONFIG.open
  const fillPct = Math.min(100, (localProject.member_count / localProject.team_size) * 100)

  // ─── Load accepted members (for avatars + kick) ───────────────────────────
  useEffect(() => {
    async function fetchMembers() {
      const { data } = await supabase
        .from('project_members')
        .select('user_id, status, users(id, name, avatar_url)')
        .eq('project_id', project.id)
        .eq('status', 'accepted')
      setMembers(data || [])
    }
    fetchMembers()
  }, [project.id, requestStatus])

  // ─── Request to join ──────────────────────────────────────────────────────
  async function requestToJoin() {
    if (requesting) return
    setRequesting(true)
    const { error } = await supabase
      .from('project_members')
      .insert({ project_id: project.id, user_id: user.id, status: 'pending' })
    setRequesting(false)
    if (!error) setRequestStatus('pending')
  }

  // ─── Leave project ────────────────────────────────────────────────────────
  async function leaveProject() {
    if (!window.confirm('Are you sure you want to leave this project?')) return
    setLeaving(true)
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', project.id)
      .eq('user_id', user.id)
    setLeaving(false)
    if (!error) {
      setRequestStatus(null)
      setMembers((prev) => prev.filter((m) => m.user_id !== user.id))
      onUpdate?.()
    }
  }

  // ─── Kick member (owner only) ─────────────────────────────────────────────
  async function kickMember(memberId, memberName) {
    if (!window.confirm(`Remove ${memberName} from this project?`)) return
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', project.id)
      .eq('user_id', memberId)
    if (!error) {
      setMembers((prev) => prev.filter((m) => m.user_id !== memberId))
      onUpdate?.()
    }
  }

  // ─── CTA label for join button ────────────────────────────────────────────
  function ctaLabel() {
    if (isOwner) return 'Your project'
    if (isFull && requestStatus !== 'accepted') return 'Team full'
    if (requestStatus === 'pending') return 'Request sent'
    if (requestStatus === 'accepted') return 'You\u2019re a member'
    if (requestStatus === 'declined') return 'Request declined'
    return 'Request to join'
  }

  const ctaDisabled = isOwner || (isFull && requestStatus !== 'accepted') || requestStatus

  return (
    <div className="vc-card p-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h3 className="font-display font-bold text-ink text-base leading-tight">{localProject.title}</h3>
            <SkillPill size="sm" tone={statusCfg.tone}>{statusCfg.label}</SkillPill>
          </div>
          <p className="text-sm text-ink-soft leading-relaxed">{localProject.description}</p>
        </div>

        {/* Edit pencil — owner only */}
        {isOwner && (
          <button
            onClick={() => setShowEdit(true)}
            title="Edit project"
            style={{
              flexShrink: 0,
              width: 30, height: 30,
              borderRadius: 8,
              border: '1.5px solid #e5e5e5',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#888',
              transition: 'border-color 0.15s, color 0.15s, background 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#111'
              e.currentTarget.style.color = '#111'
              e.currentTarget.style.background = '#f5f5f5'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e5e5'
              e.currentTarget.style.color = '#888'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}>
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* ── Skills ── */}
      {localProject.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {localProject.skills.map((s) => (
            <SkillPill key={s} size="sm">{s}</SkillPill>
          ))}
        </div>
      )}

      {/* ── Team member avatars ── */}
      {members.length > 0 && (
        <div className="flex items-center gap-1.5 mb-4">
          <span className="text-xs text-ink-faint mr-1">Team:</span>
          <div className="flex -space-x-2">
            {members.map((m) => (
              <div
                key={m.user_id}
                className="relative group"
                title={m.users?.name}
              >
                <Avatar
                  url={m.users?.avatar_url}
                  name={m.users?.name}
                  size={26}
                  className="ring-2 ring-paper rounded-full"
                />
                {/* Kick button tooltip — owner only, can't kick yourself */}
                {isOwner && m.user_id !== user.id && (
                  <button
                    onClick={() => kickMember(m.user_id, m.users?.name)}
                    title={`Remove ${m.users?.name}`}
                    className="
                      absolute -top-1 -right-1 w-4 h-4 rounded-full
                      bg-rust text-white text-[9px] font-bold leading-none
                      flex items-center justify-center
                      opacity-0 group-hover:opacity-100
                      transition-opacity duration-150 z-10
                      shadow-sm
                    "
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          {/* Overflow count if more than 5 */}
          {members.length > 5 && (
            <span className="text-xs text-ink-faint ml-1">+{members.length - 5}</span>
          )}
        </div>
      )}

      {/* ── Team fill bar ── */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-ink-faint">Team slots</span>
          <span className="text-xs font-mono text-ink-soft">
            {localProject.member_count}/{localProject.team_size}
          </span>
        </div>
        <div className="h-1.5 bg-paper-dim rounded-full overflow-hidden">
          <div
            className="h-full bg-teal rounded-full transition-all duration-300"
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between pt-3 border-t border-line-soft gap-2 flex-wrap">

        {/* Left: owner info + github */}
        <div className="flex items-center gap-2">
          <Avatar url={owner?.avatar_url} name={owner?.name} size={22} />
          <span className="text-xs text-ink-faint">{owner?.name}</span>
          {localProject.github_url && (
            <a
              href={localProject.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-violet hover:text-violet/80 underline underline-offset-2 transition-colors"
            >
              repo →
            </a>
          )}
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2">

          {/* Team Chat — rectangular black button, visible to owner + accepted members */}
          {(isOwner || requestStatus === 'accepted') && (
            <button
              onClick={() => setShowChat(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                paddingInline: '14px',
                paddingBlock: '7px',
                background: '#111',
                color: '#fff',
                border: '1.5px solid #222',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '500',
                letterSpacing: '0.01em',
                cursor: 'pointer',
                transition: 'background 0.15s, box-shadow 0.15s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1e1e1e'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.22)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#111'
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)'
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13, flexShrink: 0 }}>
                <path d="M21 11.5a8.5 8.5 0 01-8.5 8.5 8.4 8.4 0 01-4-1L3 20l1.1-3.6A8.4 8.4 0 014 13.5 8.5 8.5 0 1121 11.5z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Team chat
            </button>
          )}

          {/* Leave button — non-owner accepted members only */}
          {!isOwner && requestStatus === 'accepted' && (
            <button
              onClick={leaveProject}
              disabled={leaving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                paddingInline: '13px',
                paddingBlock: '7px',
                background: 'transparent',
                color: '#c0392b',
                border: '1.5px solid #e8b4b0',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: leaving ? 'not-allowed' : 'pointer',
                opacity: leaving ? 0.6 : 1,
                transition: 'border-color 0.15s, color 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#c0392b'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e8b4b0'
              }}
            >
              {leaving ? <Spinner size={12} /> : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}>
                    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Leave
                </>
              )}
            </button>
          )}

          {/* Join / status CTA — hidden once accepted (we show Leave instead) */}
          {requestStatus !== 'accepted' && (
            isOwner ? (
              /* "Your project" — matches Team chat button height/shape, muted style */
              <button
                disabled
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  paddingInline: '14px',
                  paddingBlock: '7px',
                  background: '#f4f4f4',
                  color: '#999',
                  border: '1.5px solid #e5e5e5',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: '500',
                  letterSpacing: '0.01em',
                  cursor: 'default',
                  whiteSpace: 'nowrap',
                }}
              >
                Your project
              </button>
            ) : (
              <Button
                variant="accent"
                size="sm"
                onClick={requestToJoin}
                disabled={!!ctaDisabled}
              >
                {requesting ? <Spinner size={14} /> : ctaLabel()}
              </Button>
            )
          )}

        </div>
      </div>

      {showChat && (
        <TeamChatModal project={localProject} onClose={() => setShowChat(false)} />
      )}

      {showEdit && (
        <EditProjectModal
          project={localProject}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            // Re-fetch updated project from Supabase and reflect locally
            supabase
              .from('projects')
              .select('*, users(name, avatar_url)')
              .eq('id', localProject.id)
              .single()
              .then(({ data }) => {
                if (data) setLocalProject({ ...data, my_request_status: requestStatus })
              })
            onUpdate?.()
          }}
        />
      )}
    </div>
  )
}