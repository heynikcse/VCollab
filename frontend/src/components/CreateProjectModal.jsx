import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import SkillPill from './ui/SkillPill'
import Button from './ui/Button'
import { Spinner } from './ui/Primitives'

const SKILL_OPTIONS = [
  'React', 'Vue', 'Node.js', 'Python', 'Java', 'C++', 'Figma',
  'UI/UX', 'Machine Learning', 'Data Science', 'Flutter', 'Android',
  'iOS', 'DevOps', 'Solidity', 'Go', 'Rust', 'PostgreSQL', 'AWS', 'Writing',
]

export default function CreateProjectModal({ onClose, onCreated }) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [skills, setSkills] = useState([])
  const [customSkills, setCustomSkills] = useState([])
  const [customSkillInput, setCustomSkillInput] = useState('')
  const [teamSize, setTeamSize] = useState(4)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Preset skills + any custom ones typed in, deduped
  const allSkillOptions = [...SKILL_OPTIONS, ...customSkills.filter((s) => !SKILL_OPTIONS.includes(s))]

  function toggleSkill(skill) {
    setSkills((prev) => prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill])
  }

  function addCustomSkill() {
    const val = customSkillInput.trim()
    if (!val || val.length > 15) return
    setCustomSkills((prev) => (prev.includes(val) ? prev : [...prev, val]))
    setSkills((prev) => (prev.includes(val) ? prev : [...prev, val]))
    setCustomSkillInput('')
  }

  const canSubmit = title.trim() && description.trim() && skills.length > 0 && teamSize >= 1 && !saving

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setSaving(true)
    setError('')

    const { error } = await supabase.from('projects').insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim(),
      skills,
      team_size: Number(teamSize),
      github_url: null,
      status: 'open',
    })

    setSaving(false)
    if (error) { setError(error.message); return }
    onCreated?.()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-ink/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-paper-card rounded-t-3xl sm:rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle for mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-line rounded-full" />
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-xl font-bold">Start a project</h2>
              <p className="text-sm text-ink-faint mt-0.5">Find teammates with the right skills</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-paper-dim hover:bg-line text-ink-faint flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-ink-soft mb-1.5 tracking-wide uppercase">
                Project title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="AI Resume Builder"
                className="input"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-ink-soft mb-1.5 tracking-wide uppercase">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What you're building, what stage you're at, what help you need"
                rows={3}
                className="input resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-ink-soft mb-2 tracking-wide uppercase">
                Skills required
              </label>

              {/* Custom skill input */}
              <div className="flex gap-2 mb-3 items-start">
                <div className="flex-1">
                  <input
                    value={customSkillInput}
                    onChange={(e) => setCustomSkillInput(e.target.value.slice(0, 15))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); addCustomSkill() }
                    }}
                    placeholder="Not listed? Type a skill..."
                    maxLength={15}
                    className="input"
                  />
                  <p className="text-[10px] text-ink-faint mt-1 text-right">
                    {customSkillInput.length}/15
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addCustomSkill}
                  disabled={!customSkillInput.trim()}
                >
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {allSkillOptions.map((s) => (
                  <SkillPill key={s} size="sm" active={skills.includes(s)} onClick={() => toggleSkill(s)}>
                    {s}
                  </SkillPill>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-ink-soft mb-1.5 tracking-wide uppercase">
                Team size
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                className="input"
              />
            </div>

            {error && (
              <div className="bg-rust-soft border border-rust/20 rounded-xl px-4 py-3 text-sm text-rust">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="accent" className="flex-1" disabled={!canSubmit}>
                {saving ? <Spinner size={16} /> : 'Create project'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}