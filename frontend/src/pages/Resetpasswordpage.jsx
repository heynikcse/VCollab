/**
 * ResetPasswordPage
 *
 * Supabase redirects the user here after they click the password-reset link
 * in their email. The URL will contain a one-time token that Supabase SDK
 * automatically picks up via onAuthStateChange (SIGNED_IN / PASSWORD_RECOVERY).
 *
 * Route: /reset-password
 * Add this page to your router alongside LoginPage, e.g.:
 *   <Route path="/reset-password" element={<ResetPasswordPage />} />
 */
import { useEffect, useState } from 'react'
import { useNavigate }         from 'react-router-dom'
import { supabase }            from '../lib/supabase'
import Button                  from '../components/ui/Button'
import { Spinner }             from '../components/ui/Primitives'

export default function ResetPasswordPage() {
  const navigate = useNavigate()

  const [ready, setReady]         = useState(false)    // true once recovery session is active
  const [newPw, setNewPw]         = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Listen for the PASSWORD_RECOVERY event that Supabase fires on this page
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (newPw.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (newPw !== confirmPw) { setError('Passwords do not match.'); return }

    setSubmitting(true)
    const { error: updateError } = await supabase.auth.updateUser({ password: newPw })
    setSubmitting(false)

    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess(true)
      setTimeout(() => navigate('/feed'), 2500)
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="text-center space-y-3">
          <Spinner size={28} color="text-violet" />
          <p className="text-sm text-ink-faint">Verifying reset link…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-10 h-10 rounded-2xl bg-ink flex items-center justify-center shadow-md">
            <span className="font-display font-bold text-amber text-lg">V</span>
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-ink">VCollab</span>
        </div>

        <div className="vc-card p-7 shadow-lg">
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-soft flex items-center justify-center mx-auto">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className="w-6 h-6 text-teal">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm text-ink-soft">Password updated! Redirecting you…</p>
            </div>
          ) : (
            <>
              <h1 className="font-display text-xl font-bold text-ink mb-1">Set new password</h1>
              <p className="text-sm text-ink-faint mb-6">Choose a strong password for your account.</p>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label className="block text-xs font-mono text-ink-soft mb-1.5 tracking-wide uppercase">
                    New Password
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    placeholder="Min. 6 characters"
                    value={newPw}
                    onChange={(e) => { setNewPw(e.target.value); setError('') }}
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
                    placeholder="Re-enter password"
                    value={confirmPw}
                    onChange={(e) => { setConfirmPw(e.target.value); setError('') }}
                    className="input"
                  />
                </div>

                {error && (
                  <div className="bg-rust-soft border border-rust/20 rounded-xl px-4 py-3
                                  text-sm text-rust flex items-start gap-2">
                    <span className="shrink-0 mt-0.5">⚠</span> {error}
                  </div>
                )}

                <Button type="submit" variant="accent" size="lg" className="w-full mt-2"
                  disabled={submitting}>
                  {submitting ? <Spinner size={18} /> : 'Update Password'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}