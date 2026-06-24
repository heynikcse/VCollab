import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { uploadImage } from '../lib/storage'
import Button from '../components/ui/Button'
import SkillPill from '../components/ui/SkillPill'
import { Avatar, Spinner } from '../components/ui/Primitives'

const SKILL_OPTIONS = [
  'React', 'Vue', 'Node.js', 'Python', 'Java', 'C++', 'Figma',
  'UI/UX', 'Machine Learning', 'Data Science', 'Flutter', 'Android',
  'iOS', 'DevOps', 'Solidity', 'Go', 'Rust', 'PostgreSQL', 'AWS', 'Writing',
]

export default function ProfileEditPage() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState(profile?.name || '')
  const [branch, setBranch] = useState(profile?.branch || '')
  const [year, setYear] = useState(profile?.year || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [skills, setSkills] = useState(profile?.skills || [])
  const [github, setGithub] = useState(profile?.github || '')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (profile) {
      setName(profile.name || '')
      setBranch(profile.branch || '')
      setYear(profile.year || '')
      setBio(profile.bio || '')
      setSkills(profile.skills || [])
      setGithub(profile.github || '')
      setAvatarPreview(profile.avatar_url || null)
    }
  }, [profile])

  function toggleSkill(skill) {
    setSkills((prev) => prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill])
  }

  function handleAvatarSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const canSubmit = name.trim().length > 0 && branch.trim().length > 0 && year && !saving

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setSaving(true)
    setError('')
    try {
      let avatar_url
      if (avatarFile) avatar_url = await uploadImage('avatars', avatarFile, user.id)

      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: name.trim(),
          branch: branch.trim(),
          year: Number(year),
          bio: bio.trim() || null,
          skills,
          github: github.trim() || null,
          ...(avatar_url ? { avatar_url } : {}),
        })
        .eq('id', user.id)

      if (updateError) throw updateError
      refreshProfile()
      navigate('/profile')
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg">
      <button
        onClick={() => navigate('/profile')}
        className="text-sm text-ink-faint hover:text-ink mb-5 flex items-center gap-1.5 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
          <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to profile
      </button>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">Edit profile</h1>
        <p className="text-sm text-ink-faint mt-1">Update your information and skills</p>
      </div>

      <form onSubmit={handleSubmit} className="vc-card p-6 space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="rounded-2xl overflow-hidden border-2 border-line">
            <Avatar url={avatarPreview} name={name} size={64} />
          </div>
          <div>
            <label className="cursor-pointer">
              <span className="text-sm font-semibold text-ink underline underline-offset-2 hover:text-violet transition-colors">
                Change photo
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
            </label>
            <p className="text-xs text-ink-faint mt-0.5">JPG, PNG or WebP</p>
          </div>
        </div>

        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="input" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Branch">
            <input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="Computer Science" className="input" />
          </Field>
          <Field label="Year">
            <select value={year} onChange={(e) => setYear(e.target.value)} className="input">
              <option value="">Select</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </Field>
        </div>

        <Field label="Bio" hint={`${bio.length}/160`}>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 160))}
            placeholder="What are you building? What do you want to build?"
            rows={2}
            className="input resize-none"
          />
        </Field>

        <Field label="GitHub username">
          <div className="flex items-center">
            <span className="text-sm text-ink-faint font-mono pl-3.5 pr-1.5 py-2.5 border border-r-0 border-line rounded-l-xl bg-paper-dim">
              github.com/
            </span>
            <input
              value={github}
              onChange={(e) => setGithub(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
              placeholder="username"
              className="input rounded-l-none flex-1 border-l-0"
            />
          </div>
        </Field>

        <div>
          <label className="block text-xs font-mono text-ink-soft mb-2 tracking-wide uppercase">
            Your skills
          </label>
          <div className="flex flex-wrap gap-1.5">
            {SKILL_OPTIONS.map((skill) => (
              <SkillPill key={skill} active={skills.includes(skill)} onClick={() => toggleSkill(skill)}>
                {skill}
              </SkillPill>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-rust-soft border border-rust/20 rounded-xl px-4 py-3 text-sm text-rust">
            {error}
          </div>
        )}

        <Button type="submit" variant="accent" size="lg" className="w-full" disabled={!canSubmit}>
          {saving ? <Spinner size={18} /> : 'Save changes'}
        </Button>
      </form>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-mono text-ink-soft tracking-wide uppercase">{label}</label>
        {hint && <span className="text-xs text-ink-faint font-mono">{hint}</span>}
      </div>
      {children}
    </div>
  )
}
