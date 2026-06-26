import { useState, useRef, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { uploadImage } from '../lib/storage'
import { Avatar, Spinner } from '../components/ui/Primitives'

const NAV_ITEMS = [
  { to: '/feed',      label: 'Feed',      icon: HomeIcon },
  { to: '/connect',   label: 'Connect',   icon: ConnectIcon },
  { to: '/community', label: 'Community', icon: CommunityIcon },
  { to: '/events',    label: 'Events',    icon: EventsIcon },
]

export default function AppShell() {
  const { profile, signOut, user, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const dropdownRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSignOut() {
    setDropdownOpen(false)
    signOut()
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* Top nav */}
      <header className="sticky top-0 z-30 glass">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <button
            onClick={() => navigate('/feed')}
            className="flex items-center gap-2.5 shrink-0"
          >
            <div className="w-8 h-8 rounded-xl bg-ink flex items-center justify-center shadow-sm">
              <span className="font-display font-bold text-amber text-sm">V</span>
            </div>
            <span className="font-display font-bold text-ink tracking-tight hidden sm:block text-[15px]">
              VCollab β 
            </span>
          </button>

          {/* Nav links */}
          <nav className="flex items-center gap-0.5">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150
                  ${isActive
                    ? 'bg-ink text-paper shadow-sm'
                    : 'text-ink-soft hover:bg-paper-dim hover:text-ink'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden md:block">{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Avatar button + dropdown */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-paper-dim transition-colors"
            >
              <Avatar url={profile?.avatar_url} name={profile?.name} size={32} />
              {profile?.name && (
                <span className="text-sm font-medium text-ink-soft hidden lg:block pr-1">
                  {profile.name.split(' ')[0]}
                </span>
              )}
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-52 bg-white border border-line rounded-2xl shadow-lg overflow-hidden z-50 animate-in">
                {/* User info */}
                <div className="px-4 py-3 border-b border-line">
                  <p className="text-sm font-semibold text-ink leading-snug">{profile?.name}</p>
                  <p className="text-xs text-ink-faint font-mono mt-0.5">
                    {profile?.branch && profile?.year ? `${profile.branch} · Y${profile.year}` : profile?.branch || ''}
                  </p>
                </div>

                {/* Edit profile */}
                <button
                  onClick={() => { setDropdownOpen(false); setEditModalOpen(true) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-ink hover:bg-paper-dim transition-colors text-left"
                >
                  <EditIcon className="w-4 h-4 text-ink-faint" />
                  Edit profile
                </button>

                {/* My profile */}
                <button
                  onClick={() => { setDropdownOpen(false); navigate('/profile') }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-ink hover:bg-paper-dim transition-colors text-left"
                >
                  <UserIcon className="w-4 h-4 text-ink-faint" />
                  My profile
                </button>

                {/* Change password */}
                <button
                  onClick={() => { setDropdownOpen(false); setChangePasswordOpen(true) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-ink hover:bg-paper-dim transition-colors text-left"
                >
                  <LockIcon className="w-4 h-4 text-ink-faint" />
                  Change password
                </button>

                <div className="border-t border-line" />

                {/* Sign out */}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-rust hover:bg-rust-soft transition-colors text-left"
                >
                  <SignOutIcon className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <EditProfileModal
          profile={profile}
          user={user}
          refreshProfile={refreshProfile}
          onClose={() => setEditModalOpen(false)}
          onChangePassword={() => { setEditModalOpen(false); setChangePasswordOpen(true) }}
          onDeleteRequest={() => { setEditModalOpen(false); setDeleteConfirmOpen(true) }}
        />
      )}

      {/* Change Password Modal */}
      {changePasswordOpen && (
        <ChangePasswordModal onClose={() => setChangePasswordOpen(false)} />
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmOpen && (
        <DeleteAccountModal
          user={user}
          signOut={signOut}
          onClose={() => setDeleteConfirmOpen(false)}
        />
      )}

      {/* Page content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  )
}

// ─── Edit Profile Modal ────────────────────────────────────────────────────────

const SKILL_OPTIONS = [
  'React', 'Vue', 'Node.js', 'Python', 'Java', 'C++', 'Figma',
  'UI/UX', 'Machine Learning', 'Data Science', 'Flutter', 'Android',
  'iOS', 'DevOps', 'Solidity', 'Go', 'Rust', 'PostgreSQL', 'AWS', 'Writing',
]

function EditProfileModal({ profile, user, refreshProfile, onClose, onChangePassword, onDeleteRequest }) {
  const [name, setName]       = useState(profile?.name || '')
  const [branch, setBranch]   = useState(profile?.branch || '')
  const [year, setYear]       = useState(profile?.year || '')
  const [bio, setBio]         = useState(profile?.bio || '')
  const [skills, setSkills]   = useState(profile?.skills || [])
  const [github, setGithub]   = useState(profile?.github || '')
  const [avatarFile, setAvatarFile]       = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || null)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  function handleAvatarSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    if (!name.trim()) return
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
          year: year ? Number(year) : null,
          bio: bio.trim() || null,
          skills,
          github: github.trim() || null,
          ...(avatar_url ? { avatar_url } : {}),
        })
        .eq('id', user.id)

      if (updateError) throw updateError
      refreshProfile()
      onClose()
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 className="font-display font-bold text-base text-ink">Edit profile</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-paper-dim hover:bg-line flex items-center justify-center transition-colors"
          >
            <XIcon className="w-3.5 h-3.5 text-ink-soft" />
          </button>
        </div>

        {/* Body — scrollable so skills grid doesn't overflow */}
        <div className="px-5 py-4 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Avatar */}
          <div className="flex items-center gap-3">
            <div className="rounded-xl overflow-hidden border border-line shrink-0">
              <Avatar url={avatarPreview} name={name} size={52} />
            </div>
            <label className="cursor-pointer">
              <span className="text-sm font-semibold text-ink underline underline-offset-2 hover:text-violet transition-colors">
                Change photo
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
            </label>
          </div>

          {/* Name */}
          <ModalField label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="input w-full"
            />
          </ModalField>

          {/* Branch + Year */}
          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Branch">
              <input
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="Computer Science"
                className="input w-full"
              />
            </ModalField>
            <ModalField label="Year">
              <select value={year} onChange={(e) => setYear(e.target.value)} className="input w-full">
                <option value="">Select</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </ModalField>
          </div>

          {/* Bio */}
          <ModalField label="Bio" hint={`${bio.length}/160`}>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 160))}
              placeholder="What are you building?"
              rows={2}
              className="input w-full resize-none"
            />
          </ModalField>

          {/* GitHub */}
          <ModalField label="GitHub">
            <div className="flex items-center">
              <span className="text-xs text-ink-faint font-mono pl-3 pr-1.5 py-2.5 border border-r-0 border-line rounded-l-xl bg-paper-dim">
                github.com/
              </span>
              <input
                value={github}
                onChange={(e) => setGithub(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                placeholder="username"
                className="input rounded-l-none flex-1 border-l-0 w-full"
              />
            </div>
          </ModalField>

          {/* Skills */}
          <div>
            <p className="text-[10px] font-mono font-semibold text-ink-soft uppercase tracking-wide mb-2">Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {SKILL_OPTIONS.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => setSkills((prev) =>
                    prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
                  )}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    skills.includes(skill)
                      ? 'bg-violet text-white border-violet'
                      : 'bg-paper-dim text-ink-soft border-line hover:border-violet/40 hover:text-ink'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-rust bg-rust-soft rounded-xl px-3 py-2">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 border-t border-line space-y-3">
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="w-full py-2.5 rounded-xl bg-ink text-paper text-sm font-semibold hover:bg-ink/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <Spinner size={16} /> : 'Save changes'}
          </button>

          {/* Danger zone */}
          <div className="border border-rust/20 rounded-xl p-3 bg-rust-soft/40">
            <p className="text-[10px] font-mono font-semibold text-rust uppercase tracking-wide mb-1">
              Danger zone
            </p>
            <p className="text-xs text-ink-faint mb-2.5 leading-relaxed">
              Permanently delete your account and all data. This cannot be undone.
            </p>
            <button
              onClick={onDeleteRequest}
              className="w-full py-2 rounded-lg border border-rust/30 bg-white text-rust text-xs font-semibold hover:bg-rust-soft transition-colors"
            >
              Delete my account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Delete Account Modal ──────────────────────────────────────────────────────

function DeleteAccountModal({ user, signOut, onClose }) {
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const isConfirmed = confirmText === 'DELETE'

  async function handleDelete() {
    if (!isConfirmed) return
    setDeleting(true)
    setError('')
    try {
      await supabase.from('users').delete().eq('id', user.id)
      await supabase.auth.admin.deleteUser(user.id) // needs service role; or use an Edge Function
      signOut()
    } catch (err) {
      setError(err.message || 'Could not delete account. Contact support.')
      setDeleting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-line flex items-center justify-between">
          <h2 className="font-display font-bold text-base text-rust">Delete account</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-paper-dim hover:bg-line flex items-center justify-center transition-colors">
            <XIcon className="w-3.5 h-3.5 text-ink-soft" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <p className="text-sm text-ink-soft leading-relaxed">
            This will permanently delete your account, posts, projects, and all associated data.
            <span className="font-semibold text-ink"> There is no going back.</span>
          </p>

          <ModalField label='Type "DELETE" to confirm'>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="input w-full font-mono"
            />
          </ModalField>

          {error && (
            <p className="text-xs text-rust bg-rust-soft rounded-xl px-3 py-2">{error}</p>
          )}
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-line text-sm font-medium text-ink hover:bg-paper-dim transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!isConfirmed || deleting}
            className="flex-1 py-2.5 rounded-xl bg-rust text-white text-sm font-semibold hover:bg-rust/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {deleting ? <Spinner size={16} /> : 'Delete account'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Change Password Modal ─────────────────────────────────────────────────────

function ChangePasswordModal({ onClose }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  const isValid = currentPassword.length >= 6 && newPassword.length >= 8 && newPassword === confirmPassword

  async function handleSave() {
    if (!isValid) return
    setSaving(true)
    setError('')
    try {
      // Re-authenticate with current password first
      const { data: { user } } = await supabase.auth.getUser()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })
      if (signInError) throw new Error('Current password is incorrect.')

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) throw updateError
      setSuccess(true)
      setTimeout(onClose, 1800)
    } catch (err) {
      setError(err.message || 'Could not update password. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 className="font-display font-bold text-base text-ink">Change password</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-paper-dim hover:bg-line flex items-center justify-center transition-colors">
            <XIcon className="w-3.5 h-3.5 text-ink-soft" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {success ? (
            <div className="py-6 flex flex-col items-center gap-2 text-center">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 text-green-600">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-ink">Password updated</p>
              <p className="text-xs text-ink-faint">You're all set.</p>
            </div>
          ) : (
            <>
              <ModalField label="Current password">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="input w-full"
                />
              </ModalField>

              <ModalField label="New password">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="input w-full"
                />
              </ModalField>

              <ModalField label="Confirm new password">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="input w-full"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-[11px] text-rust mt-1">Passwords don't match</p>
                )}
              </ModalField>

              {error && (
                <p className="text-xs text-rust bg-rust-soft rounded-xl px-3 py-2">{error}</p>
              )}
            </>
          )}
        </div>

        {!success && (
          <div className="px-5 pb-5">
            <button
              onClick={handleSave}
              disabled={!isValid || saving}
              className="w-full py-2.5 rounded-xl bg-ink text-paper text-sm font-semibold hover:bg-ink/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <Spinner size={16} /> : 'Update password'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Small helpers ─────────────────────────────────────────────────────────────

function ModalField({ label, hint, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[10px] font-mono font-semibold text-ink-soft uppercase tracking-wide">{label}</label>
        {hint && <span className="text-[10px] text-ink-faint font-mono">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function HomeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 21V12h6v9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function ConnectIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="8" cy="12" r="3" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="M10.5 10.5l5-3M10.5 13.5l5 3" strokeLinecap="round" />
    </svg>
  )
}
function CommunityIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="9" cy="7" r="3" />
      <path d="M2 21c0-3.5 3.1-6 7-6s7 2.5 7 6" strokeLinecap="round" />
      <circle cx="17" cy="8" r="2" />
      <path d="M16 14.5c2.4.5 4 2.4 4 6.5" strokeLinecap="round" />
    </svg>
  )
}
function EventsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  )
}
function EditIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" />
    </svg>
  )
}
function UserIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
    </svg>
  )
}
function SignOutIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function LockIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" />
    </svg>
  )
}
function XIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  )
}