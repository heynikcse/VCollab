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
  const [teamSize, setTeamSize] = useState(4)
  const [githubUrl, setGithubUrl] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function toggleSkill(skill) {
    setSkills((prev) => prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill])
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
      github_url: githubUrl.trim() || null,
      status: 'open',
    })

    setSaving(false)
    if (error) { setError(error.message); return }
    onCreated?.()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-semibold">Start a project</h2>
          <button onClick={onClose} className="text-ink-faint hover:text-ink text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-ink-soft mb-1.5">PROJECT TITLE</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="AI Resume Builder"
              className="input"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-ink-soft mb-1.5">DESCRIPTION</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What you're building, what stage you're at, what you need help with"
              rows={3}
              className="input resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-ink-soft mb-2">SKILLS REQUIRED</label>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map((s) => (
                <SkillPill key={s} size="sm" active={skills.includes(s)} onClick={() => toggleSkill(s)}>
                  {s}
                </SkillPill>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-ink-soft mb-1.5">TEAM SIZE</label>
              <input
                type="number"
                min={1}
                max={20}
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-ink-soft mb-1.5">GITHUB REPO (OPTIONAL)</label>
              <input
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="github.com/you/repo"
                className="input"
              />
            </div>
          </div>

          {error && <p className="text-sm text-rust">{error}</p>}

          <div className="flex gap-3 pt-2">
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
  )
}
