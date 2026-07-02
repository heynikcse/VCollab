import { useState } from 'react'
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

const STEPS = ['Basic info', 'About you', 'Your skills']

export default function ProfileSetupPage() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [branch, setBranch] = useState('')
  const [year, setYear] = useState('')
  const [bio, setBio] = useState('')
  const [skills, setSkills] = useState([])
  const [github, setGithub] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function toggleSkill(skill) {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    )
  }

  function handleAvatarSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const canProceedStep0 = name.trim().length > 0 && branch.trim().length > 0 && year
  const canSubmit = canProceedStep0 && !saving

  async function handleSubmit() {
    if (!canSubmit) return
    setSaving(true)
    setError('')

    try {
      let avatar_url = null
      if (avatarFile) {
        avatar_url = await uploadImage('avatars', avatarFile, user.id)
      }

      const { error: updateError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        name: name.trim(),
        branch: branch.trim(),
        year: Number(year),
        bio: bio.trim() || null,
        skills,
        github: github.trim() || null,
        ...(avatar_url ? { avatar_url } : {}),
      })

    if (updateError) throw updateError
    await refreshProfile()
    navigate('/feed')
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4 py-10">
      {/* Decorative blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-violet/8 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-amber/8 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center mb-6">
          <div className="w-9 h-9 rounded-2xl bg-ink flex items-center justify-center shadow-md">
            <span className="font-display font-bold text-amber text-base">V</span>
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-ink">VCollab</span>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-mono transition-all ${
                i < step ? 'bg-teal text-white' : i === step ? 'bg-ink text-paper' : 'bg-paper-dim text-ink-faint border border-line'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 rounded-full transition-all ${i < step ? 'bg-teal' : 'bg-line'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="vc-card p-6 shadow-lg">
          <div className="mb-6">
            <h1 className="font-display text-xl font-bold text-ink">{STEPS[step]}</h1>
            <p className="text-sm text-ink-faint mt-0.5">
              {step === 0 && 'Tell teammates who you are'}
              {step === 1 && 'Add context about your work and interests'}
              {step === 2 && 'Select your technical skills'}
            </p>
          </div>

          {/* Step 0: Basic info */}
          {step === 0 && (
            <div className="space-y-4">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="rounded-2xl overflow-hidden border-2 border-line">
                  <Avatar url={avatarPreview} name={name} size={60} />
                </div>
                <label className="cursor-pointer">
                  <span className="text-sm font-semibold text-ink underline underline-offset-2 hover:text-violet transition-colors">
                    {avatarFile ? 'Change photo' : 'Add photo'}
                  </span>
                  <p className="text-xs text-ink-faint">optional</p>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
                </label>
              </div>

              <div>
                <label className="block text-xs font-mono text-ink-soft mb-1.5 uppercase tracking-wide">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nikhil Raj"
                  className="input"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-ink-soft mb-1.5 uppercase tracking-wide">Branch</label>
                  <input
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="CSE"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-ink-soft mb-1.5 uppercase tracking-wide">Year</label>
                  <select value={year} onChange={(e) => setYear(e.target.value)} className="input">
                    <option value="">Select</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              </div>

              <Button
                variant="accent"
                size="lg"
                className="w-full"
                disabled={!canProceedStep0}
                onClick={() => setStep(1)}
              >
                Continue →
              </Button>
            </div>
          )}

          {/* Step 1: About you */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-mono text-ink-soft uppercase tracking-wide">Bio</label>
                  <span className="text-xs font-mono text-ink-faint">{bio.length}/160</span>
                </div>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 160))}
                  placeholder="What are you building? What do you want to build?"
                  rows={3}
                  className="input resize-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-ink-soft mb-1.5 uppercase tracking-wide">
                  GitHub username
                </label>
                <div className="flex items-center">
                  <span className="text-sm text-ink-faint font-mono pl-3.5 pr-1.5 py-2.5 border border-r-0 border-line rounded-l-xl bg-paper-dim">
                    github.com/
                  </span>
                  <input
                    value={github}
                    onChange={(e) => setGithub(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                    placeholder="username (optional)"
                    className="input rounded-l-none flex-1 border-l-0"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setStep(0)}>← Back</Button>
                <Button variant="accent" className="flex-1" onClick={() => setStep(2)}>Continue →</Button>
              </div>
            </div>
          )}

          {/* Step 2: Skills */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-mono text-ink-soft uppercase tracking-wide mb-3">
                  Select all that apply
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SKILL_OPTIONS.map((skill) => (
                    <SkillPill key={skill} active={skills.includes(skill)} onClick={() => toggleSkill(skill)}>
                      {skill}
                    </SkillPill>
                  ))}
                </div>
                {skills.length > 0 && (
                  <p className="text-xs text-ink-faint mt-2 font-mono">
                    {skills.length} selected
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-rust-soft border border-rust/20 rounded-xl px-4 py-3 text-sm text-rust">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setStep(1)}>← Back</Button>
                <Button
                  variant="accent"
                  className="flex-1"
                  disabled={!canSubmit}
                  onClick={handleSubmit}
                >
                  {saving ? <Spinner size={18} /> : 'Launch →'}
                </Button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-ink-faint mt-5 font-mono tracking-widest uppercase">
          VIT Bhopal Student Network
        </p>
      </div>
    </div>
  )
}
