import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Spinner } from './ui/Primitives'

const ALL_SKILLS = [
  'React', 'Vue', 'Node.js', 'Python', 'Java', 'C++', 'Figma',
  'UI/UX', 'Machine Learning', 'Data Science', 'Flutter', 'Android',
  'iOS', 'DevOps', 'Solidity', 'Go', 'Rust', 'PostgreSQL', 'AWS', 'Writing',
]

const STATUS_OPTIONS = [
  { value: 'open',        label: '🟢 Open' },
  { value: 'in_progress', label: '🟡 In Progress' },
  { value: 'completed',   label: '⚪ Completed' },
]

export default function EditProjectModal({ project, onClose, onSaved }) {
  const [form, setForm] = useState({
    title:       project.title       || '',
    description: project.description || '',
    github_url:  project.github_url  || '',
    team_size:   project.team_size   || 2,
    status:      project.status      || 'open',
    skills:      project.skills      || [],
  })
  const [saving, setSaving]   = useState(false)
  const [error,  setError]    = useState(null)

  // ─── Field helpers ─────────────────────────────────────────────────────────
  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleSkill(skill) {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }))
  }

  // ─── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!form.title.trim()) { setError('Title is required.'); return }
    if (form.team_size < 1) { setError('Team size must be at least 1.'); return }

    setSaving(true)
    setError(null)

    const { error: err } = await supabase
      .from('projects')
      .update({
        title:       form.title.trim(),
        description: form.description.trim(),
        github_url:  form.github_url.trim() || null,
        team_size:   Number(form.team_size),
        status:      form.status,
        skills:      form.skills,
      })
      .eq('id', project.id)

    setSaving(false)
    if (err) { setError(err.message); return }
    onSaved?.()
    onClose()
  }

  // ─── Shared input style ────────────────────────────────────────────────────
  const inputStyle = {
    width: '100%',
    padding: '10px 13px',
    border: '1.5px solid #e5e5e5',
    borderRadius: '10px',
    fontSize: 13,
    fontFamily: 'inherit',
    color: '#111',
    background: '#fafafa',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  }

  const labelStyle = {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 6,
  }

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(2px)',
          zIndex: 50,
        }}
      />

      {/* ── Modal ── */}
      <div
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%', maxWidth: 520,
          maxHeight: '90vh',
          background: '#fff',
          borderRadius: 18,
          boxShadow: '0 24px 64px rgba(0,0,0,0.16)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 51,
        }}
      >

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px',
          borderBottom: '1px solid #ebebeb',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: '#111',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {/* pencil icon */}
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" style={{ width: 15, height: 15 }}>
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15, color: '#111', lineHeight: 1.2 }}>Edit Project</p>
              <p style={{ fontSize: 12, color: '#888', marginTop: 1 }}>Update your project details</p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8,
              border: '1.5px solid #e5e5e5',
              background: 'transparent',
              cursor: 'pointer', fontSize: 15, color: '#888',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >✕</button>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ overflowY: 'auto', padding: '22px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Title */}
          <div>
            <label style={labelStyle}>Project Title *</label>
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. AI Resume Builder"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#111')}
              onBlur={(e)  => (e.target.style.borderColor = '#e5e5e5')}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="What are you building and who is it for?"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              onFocus={(e) => (e.target.style.borderColor = '#111')}
              onBlur={(e)  => (e.target.style.borderColor = '#e5e5e5')}
            />
          </div>

          {/* Status + Team size row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

            {/* Status */}
            <div>
              <label style={labelStyle}>Status</label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer', appearance: 'none', paddingRight: 32,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 10px center',
                  backgroundSize: '16px',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#111')}
                onBlur={(e)  => (e.target.style.borderColor = '#e5e5e5')}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Team size */}
            <div>
              <label style={labelStyle}>Team Size</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={form.team_size}
                  onChange={(e) => set('team_size', e.target.value)}
                  style={{ ...inputStyle, paddingRight: 55 }}
                  onFocus={(e) => (e.target.style.borderColor = '#111')}
                  onBlur={(e)  => (e.target.style.borderColor = '#e5e5e5')}
                />
                <span style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 11, color: '#aaa', pointerEvents: 'none',
                }}>
                  people
                </span>
              </div>
            </div>
          </div>

          {/* GitHub URL */}
          <div>
            <label style={labelStyle}>GitHub URL</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 12, top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" style={{ width: 14, height: 14 }}>
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <input
                value={form.github_url}
                onChange={(e) => set('github_url', e.target.value)}
                placeholder="https://github.com/you/repo"
                style={{ ...inputStyle, paddingLeft: 34 }}
                onFocus={(e) => (e.target.style.borderColor = '#111')}
                onBlur={(e)  => (e.target.style.borderColor = '#e5e5e5')}
              />
            </div>
          </div>

          {/* Skills */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Skills Needed</label>
              {form.skills.length > 0 && (
                <span style={{ fontSize: 11, color: '#888' }}>
                  {form.skills.length} selected
                </span>
              )}
            </div>

            {/* Selected skills summary */}
            {form.skills.length > 0 && (
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 6,
                padding: '10px 12px',
                background: '#f5f5f5',
                borderRadius: 10,
                marginBottom: 10,
                border: '1.5px solid #ebebeb',
              }}>
                {form.skills.map((s) => (
                  <span
                    key={s}
                    onClick={() => toggleSkill(s)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '3px 10px 3px 10px',
                      background: '#111', color: '#fff',
                      borderRadius: 999,
                      fontSize: 11, fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    {s}
                    <span style={{ opacity: 0.6, fontSize: 10 }}>✕</span>
                  </span>
                ))}
              </div>
            )}

            {/* Skill picker grid */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ALL_SKILLS.map((s) => {
                const active = form.skills.includes(s)
                return (
                  <button
                    key={s}
                    onClick={() => toggleSkill(s)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 999,
                      border: active ? '1.5px solid #111' : '1.5px solid #e5e5e5',
                      background: active ? '#111' : '#fff',
                      color: active ? '#fff' : '#555',
                      fontSize: 12,
                      fontWeight: active ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.12s',
                    }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.borderColor = '#aaa' }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.borderColor = '#e5e5e5' }}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '10px 14px',
              background: '#fff5f5',
              border: '1.5px solid #fecaca',
              borderRadius: 10,
              fontSize: 13,
              color: '#c0392b',
            }}>
              {error}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '14px 22px',
          borderTop: '1px solid #ebebeb',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
          flexShrink: 0,
          background: '#fff',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 20px',
              borderRadius: 10,
              border: '1.5px solid #e5e5e5',
              background: 'transparent',
              color: '#555', fontSize: 13, fontWeight: 500,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '9px 22px',
              borderRadius: 10,
              border: 'none',
              background: saving ? '#555' : '#111',
              color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = '#222' }}
            onMouseLeave={(e) => { if (!saving) e.currentTarget.style.background = '#111' }}
          >
            {saving ? (
              <>
                <Spinner size={13} color="text-white" />
                Saving…
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 13, height: 13 }}>
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Save changes
              </>
            )}
          </button>
        </div>

      </div>
    </>
  )
}