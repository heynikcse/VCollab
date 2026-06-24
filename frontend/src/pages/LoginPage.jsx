import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isValidCollegeEmail, COLLEGE_DOMAIN } from '../lib/supabase'
import Button from '../components/ui/Button'
import { Spinner } from '../components/ui/Primitives'

export default function LoginPage() {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [domainError, setDomainError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [signupSent, setSignupSent] = useState(false)

  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  function handleEmailChange(value) {
    setEmail(value)
    setFormError('')
    if (!value.length) {
      setDomainError('')
    } else if (!isValidCollegeEmail(value) && value.includes('@')) {
      setDomainError(`Only ${COLLEGE_DOMAIN} addresses are allowed.`)
    } else {
      setDomainError('')
    }
  }

  const emailIsValid = isValidCollegeEmail(email)
  const canSubmit = emailIsValid && password.length >= 6 && !submitting

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setFormError('')

    if (mode === 'signin') {
      const { error } = await signIn(email, password)
      setSubmitting(false)
      if (error) {
        setFormError(
          error.message.includes('Invalid login')
            ? 'Wrong email or password. Try again.'
            : error.message
        )
        return
      }
      navigate('/feed')
    } else {
      const { error } = await signUp(email, password)
      setSubmitting(false)
      if (error) {
        setFormError(
          error.message.includes('already registered')
            ? 'An account already exists. Sign in instead.'
            : error.message
        )
        return
      }
      setSignupSent(true)
    }
  }

  if (signupSent) {
    return (
      <AuthShell>
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-teal-soft flex items-center justify-center mx-auto mb-5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7 text-teal">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="font-display text-xl font-bold mb-2">Check your inbox</h1>
          <p className="text-sm text-ink-soft mb-6 leading-relaxed">
            We sent a confirmation link to{' '}
            <span className="font-mono text-ink bg-paper-dim px-1.5 py-0.5 rounded-md text-xs">{email}</span>.
            Confirm it, then sign in.
          </p>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => { setMode('signin'); setSignupSent(false) }}
          >
            Back to sign in
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <h1 className="font-display text-2xl font-bold mb-1 text-ink">
        {mode === 'signin' ? 'Welcome back' : 'Join VCollab'}
      </h1>
      <p className="text-sm text-ink-faint mb-7">
        Exclusively for VIT Bhopal students.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="block text-xs font-mono text-ink-soft mb-1.5 tracking-wide uppercase">
            College Email
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="yourname@vitbhopal.ac.in"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            className={`input ${domainError ? 'border-rust/50 focus:ring-rust/20 focus:border-rust/50' : ''}`}
          />
          {domainError && (
            <p className="text-xs text-rust mt-1.5 flex items-center gap-1">
              <span>⚠</span> {domainError}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-mono text-ink-soft mb-1.5 tracking-wide uppercase">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setFormError('') }}
            className="input"
          />
        </div>

        {formError && (
          <div className="bg-rust-soft border border-rust/20 rounded-xl px-4 py-3 text-sm text-rust flex items-start gap-2">
            <span className="shrink-0 mt-0.5">⚠</span>
            {formError}
          </div>
        )}

        <Button
          type="submit"
          variant="accent"
          size="lg"
          className="w-full mt-2"
          disabled={!canSubmit}
        >
          {submitting
            ? <Spinner size={18} />
            : mode === 'signin' ? 'Sign in' : 'Create account'
          }
        </Button>
      </form>

      <div className="relative my-6">
        <div className="border-t border-line" />
        <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-paper-card px-3 text-xs text-ink-faint">
          or
        </span>
      </div>

      <p className="text-sm text-ink-faint text-center">
        {mode === 'signin' ? "New to VCollab? " : "Already a member? "}
        <button
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setFormError('') }}
          className="text-ink font-semibold hover:text-amber-deep transition-colors underline underline-offset-2"
        >
          {mode === 'signin' ? 'Create account' : 'Sign in'}
        </button>
      </p>
    </AuthShell>
  )
}

function AuthShell({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      {/* Decorative background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-amber/8 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-violet/8 blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Brand */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-10 h-10 rounded-2xl bg-ink flex items-center justify-center shadow-md">
            <span className="font-display font-bold text-amber text-lg">V</span>
          </div>
          <div>
            <span className="font-display font-bold text-xl tracking-tight text-ink">VCollab</span>
            <p className="text-[10px] font-mono text-ink-faint tracking-widest uppercase -mt-0.5">
              Build Together
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="vc-card p-7 shadow-lg">
          {children}
        </div>

        <p className="text-center text-[10px] text-ink-faint mt-6 font-mono tracking-widest uppercase">
          VIT Bhopal Student Network
        </p>
      </div>
    </div>
  )
}
