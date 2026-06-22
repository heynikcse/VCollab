import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isValidCollegeEmail, COLLEGE_DOMAIN } from '../lib/supabase'
import Button from '../components/ui/Button'
import { Spinner } from '../components/ui/Primitives'

export default function LoginPage() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
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
    if (value.length === 0) {
      setDomainError('')
    } else if (!isValidCollegeEmail(value) && value.includes('@')) {
      setDomainError(`Only ${COLLEGE_DOMAIN} addresses can access Collagram.`)
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
            ? 'An account already exists for this email. Sign in instead.'
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
          <div className="w-12 h-12 rounded-full bg-teal-soft flex items-center justify-center mx-auto mb-4">
            <span className="text-teal text-xl">✓</span>
          </div>
          <h1 className="font-display text-xl font-semibold mb-2">Check your inbox</h1>
          <p className="text-sm text-ink-soft mb-6">
            We sent a confirmation link to <span className="font-mono text-ink">{email}</span>.
            Confirm it, then sign in below.
          </p>
          <Button variant="secondary" className="w-full" onClick={() => { setMode('signin'); setSignupSent(false) }}>
            Back to sign in
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <h1 className="font-display text-2xl font-semibold mb-1">
        {mode === 'signin' ? 'Welcome back' : 'Join Collagram'}
      </h1>
      <p className="text-sm text-ink-faint mb-7">
        Exclusively for VIT Bhopal students.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="block text-xs font-mono text-ink-soft mb-1.5">
            COLLEGE EMAIL
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="yourname@vitbhopal.ac.in"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            className={`w-full px-3.5 py-2.5 rounded-md border bg-paper text-sm font-body
              focus:outline-none focus:ring-2 focus:ring-ink/20
              ${domainError ? 'border-rust' : 'border-line'}`}
          />
          {domainError && <p className="text-xs text-rust mt-1.5">{domainError}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-mono text-ink-soft mb-1.5">
            PASSWORD
          </label>
          <input
            id="password"
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setFormError('') }}
            className="w-full px-3.5 py-2.5 rounded-md border border-line bg-paper text-sm font-body
              focus:outline-none focus:ring-2 focus:ring-ink/20"
          />
        </div>

        {formError && (
          <div className="bg-rust-soft border border-rust/20 rounded-md px-3 py-2 text-sm text-rust">
            {formError}
          </div>
        )}

        <Button type="submit" variant="accent" size="lg" className="w-full" disabled={!canSubmit}>
          {submitting ? <Spinner size={18} /> : mode === 'signin' ? 'Sign in' : 'Create account'}
        </Button>
      </form>

      <p className="text-sm text-ink-faint text-center mt-6">
        {mode === 'signin' ? "Don't have an account? " : 'Already on Collagram? '}
        <button
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setFormError('') }}
          className="text-ink font-medium underline underline-offset-2 hover:text-amber-deep"
        >
          {mode === 'signin' ? 'Sign up' : 'Sign in'}
        </button>
      </p>
    </AuthShell>
  )
}

function AuthShell({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-8 h-8 rounded bg-ink flex items-center justify-center">
            <span className="font-display font-bold text-amber text-sm">C</span>
          </div>
          <span className="font-display font-semibold text-lg tracking-tight">Collagram</span>
        </div>
        <div className="bg-white border border-line rounded-xl p-7 shadow-sm">
          {children}
        </div>
        <p className="text-center text-xs text-ink-faint mt-6 font-mono">
          BUILD TOGETHER. GROW TOGETHER.
        </p>
      </div>
    </div>
  )
}
