import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Button from './ui/Button'
import { Spinner } from './ui/Primitives'

/**
 * ChangePasswordModal
 * Shown when the user clicks "Change Password" on their Profile page.
 * Uses supabase.auth.updateUser to change the password in-session.
 */
export default function ChangePasswordModal({ onClose }) {
  const [newPassword, setNewPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError]                     = useState('')
  const [success, setSuccess]                 = useState(false)
  const [submitting, setSubmitting]           = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    setSubmitting(false)

    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess(true)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-ink/30 backdrop-blur-sm">
      <div className="vc-card w-full max-w-sm p-6 shadow-xl">
        <h2 className="font-display font-bold text-lg text-ink mb-5">Change Password</h2>

        {success ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-soft flex items-center justify-center mx-auto">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className="w-6 h-6 text-teal">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-sm text-ink-soft">Your password has been updated successfully.</p>
            <Button variant="secondary" className="w-full" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-mono text-ink-soft mb-1.5 tracking-wide uppercase">
                New Password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Min. 6 characters"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError('') }}
                className="input"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-ink-soft mb-1.5 tracking-wide uppercase">
                Confirm Password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError('') }}
                className="input"
              />
            </div>

            {error && (
              <div className="bg-rust-soft border border-rust/20 rounded-xl px-4 py-3 text-sm text-rust flex items-start gap-2">
                <span className="shrink-0 mt-0.5">⚠</span> {error}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="secondary" className="flex-1" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button
                variant="accent"
                className="flex-1"
                type="submit"
                disabled={submitting}
              >
                {submitting ? <Spinner size={16} /> : 'Update'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}