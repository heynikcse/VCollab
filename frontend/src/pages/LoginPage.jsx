import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isValidCollegeEmail, COLLEGE_DOMAIN, supabase } from '../lib/supabase'
import { Spinner } from '../components/ui/Primitives'

const BETA_LIMIT = 20

const FEATURES = [
  {
    icon: FeedIcon,
    color: 'bg-violet/10 text-violet',
    title: 'Campus Feed',
    desc: 'Share updates, ask questions, and discuss anything with the entire VIT Bhopal community.',
  },
  {
    icon: ConnectIcon,
    color: 'bg-amber/10 text-amber-deep',
    title: 'Find Collaborators',
    desc: 'Post your project, list the skills you need, and let the right teammates find you.',
  },
  {
    icon: CommunityIcon,
    color: 'bg-teal/10 text-teal',
    title: 'Communities',
    desc: 'Join clubs and interest groups. Every community has its own feed and members.',
  },
  {
    icon: EventsIcon,
    color: 'bg-violet/10 text-violet',
    title: 'Events',
    desc: 'Discover hackathons and workshops. See who else is attending before you register.',
  },
  {
    icon: ProfileIcon,
    color: 'bg-amber/10 text-amber-deep',
    title: 'Developer Profile',
    desc: 'Showcase your skills, GitHub activity, and projects in one place.',
  },
  {
    icon: NetworkIcon,
    color: 'bg-teal/10 text-teal',
    title: 'Team Network',
    desc: 'A private feed of posts only from your project teammates — stay in sync.',
  },
]

const STATS = [
  { value: '200', label: 'Beta spots' },
  { value: '6', label: 'Core features' },
  { value: '1', label: 'Campus' },
]

export default function LoginPage() {
  const [mode, setMode]               = useState('signin')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [domainError, setDomainError] = useState('')
  const [formError, setFormError]     = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [signupSent, setSignupSent]   = useState(false)
  const [resetSent, setResetSent]     = useState(false)
  const [modalOpen, setModalOpen]     = useState(false)

  const { signIn, signUp } = useAuth()
  const navigate            = useNavigate()

  function openModal(m = 'signin') {
    setMode(m); setFormError(''); setModalOpen(true)
  }

  function handleEmailChange(value) {
    setEmail(value); setFormError('')
    if (!value.length) setDomainError('')
    else if (!isValidCollegeEmail(value) && value.includes('@'))
      setDomainError(`Only ${COLLEGE_DOMAIN} addresses are allowed.`)
    else setDomainError('')
  }

  const emailIsValid = isValidCollegeEmail(email)
  const canSubmit    = emailIsValid && (mode === 'forgot' || password.length >= 6) && !submitting

  async function handleSignIn() {
    const { error } = await signIn(email, password)
    setSubmitting(false)
    if (error) { setFormError(error.message.includes('Invalid login') ? 'Wrong email or password.' : error.message); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from('users').update({ last_seen: new Date().toISOString() }).eq('id', user.id)
    navigate('/feed')
  }

  async function handleSignUp() {
    const { data, error: countErr } = await supabase.rpc('get_user_count')
    if (!countErr && data >= BETA_LIMIT) { setSubmitting(false); setFormError('Beta is full. Registration closed.'); return }
    const { error } = await signUp(email, password)
    setSubmitting(false)
    if (error) { setFormError(error.message.includes('already registered') ? 'Account exists. Sign in instead.' : error.message); return }
    setSignupSent(true)
  }

  async function handleForgotPassword() {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
    setSubmitting(false)
    if (error) { setFormError(error.message); return }
    setResetSent(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true); setFormError('')
    if (mode === 'signin') await handleSignIn()
    else if (mode === 'signup') await handleSignUp()
    else await handleForgotPassword()
  }

  return (
    <div className="min-h-screen bg-paper text-ink">

      {/* ── NAV ── */}
      <header className="sticky top-0 z-30 glass border-b border-line">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-ink flex items-center justify-center shadow-sm">
              <span className="font-display font-bold text-amber text-sm">V</span>
            </div>
            <div>
              <span className="font-display font-bold text-[15px] tracking-tight text-ink">VCollab β</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => openModal('signin')}
              className="text-sm font-medium text-ink-soft hover:text-ink transition-colors px-3 py-1.5 rounded-xl hover:bg-paper-dim">
              Sign in
            </button>
            <button onClick={() => openModal('signup')}
              className="text-sm font-semibold bg-ink text-paper px-4 py-2 rounded-xl hover:bg-ink/90 transition-colors shadow-sm">
              Get started
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="max-w-6xl mx-auto px-5 pt-20 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-violet/8 border border-violet/15 rounded-full px-3.5 py-1.5 mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-violet" />
              <span className="text-[11px] font-mono font-semibold text-violet tracking-wide uppercase">Beta open · VIT Bhopal only</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink leading-[1.1] tracking-tight mb-5">
              Your campus,<br />
              <span className="relative">
                <span className="relative z-10">finally connected.</span>
                <span className="absolute bottom-1 left-0 right-0 h-3 bg-amber/20 -z-0 rounded" />
              </span>
            </h1>

            <p className="text-base text-ink-soft leading-relaxed mb-8 max-w-md">
              VCollab is the student network built exclusively for VIT Bhopal — find project partners, join communities, discover events, and keep up with campus life.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <button onClick={() => openModal('signup')}
                className="px-6 py-3 rounded-xl bg-ink text-paper text-sm font-semibold hover:bg-ink/90 transition-all shadow-sm hover:shadow-md">
                Create free account →
              </button>
              <button onClick={() => openModal('signin')}
                className="px-6 py-3 rounded-xl border border-line text-sm font-medium text-ink hover:bg-paper-dim transition-colors">
                Sign in
              </button>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-6 pt-6 border-t border-line-soft">
              {STATS.map(({ value, label }) => (
                <div key={label}>
                  <p className="font-display font-bold text-xl text-ink leading-none">{value}</p>
                  <p className="text-xs text-ink-faint mt-0.5">{label}</p>
                </div>
              ))}
              <div className="h-8 w-px bg-line-soft" />
              <p className="text-xs text-ink-faint leading-relaxed">
                Requires<br />@vitbhopal.ac.in
              </p>
            </div>
          </div>

          {/* Right — mini feed preview */}
          <div className="hidden lg:block">
            <div className="vc-card overflow-hidden shadow-lg">
              {/* Fake nav bar */}
              <div className="bg-paper border-b border-line px-4 h-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-ink flex items-center justify-center">
                    <span className="text-amber font-bold text-[9px]">V</span>
                  </div>
                  <span className="text-xs font-display font-bold text-ink">VCollab</span>
                </div>
                <div className="flex gap-3">
                  {['Feed','Connect','Events'].map(l => (
                    <span key={l} className={`text-[10px] font-medium ${l==='Feed' ? 'text-ink' : 'text-ink-faint'}`}>{l}</span>
                  ))}
                </div>
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet/60 to-amber/40" />
              </div>

              {/* Post composer */}
              <div className="px-4 pt-3 pb-2 border-b border-line">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet/40 to-amber/30 shrink-0" />
                  <div className="flex-1 h-8 rounded-xl bg-paper-dim flex items-center px-3">
                    <span className="text-xs text-ink-faint">Share an update, ask a question…</span>
                  </div>
                </div>
              </div>

              {/* Feed posts */}
              <div className="divide-y divide-line">
                {[
                  { name: 'Ayush', meta: 'CSE in Cloud · Y3', tag: 'general', tagColor: 'bg-paper-dim text-ink-faint', content: 'Did anyone know the VIT IFSC code for fee submission?', likes: 1, comments: 2 },
                  { name: 'Priya', meta: 'ECE · Y2', tag: 'opinion', tagColor: 'bg-teal/10 text-teal', content: 'The new vending machine near block C is actually great!!', likes: 4, comments: 0 },
                  { name: 'Nikhil Raj', meta: 'CSE · Y3', tag: 'general', tagColor: 'bg-paper-dim text-ink-faint', content: 'Looking for a React dev to join my project — DM me!', likes: 6, comments: 3 },
                ].map((p, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-6 h-6 rounded-full shrink-0 ${i === 2 ? 'bg-gradient-to-br from-violet/60 to-amber/40' : 'bg-paper-dim'} flex items-center justify-center`}>
                        <span className="text-[9px] font-bold text-ink-faint">{p.name[0]}</span>
                      </div>
                      <span className="text-xs font-semibold text-ink">{p.name}</span>
                      <span className="text-[10px] text-ink-faint">{p.meta}</span>
                      <span className={`ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded-full ${p.tagColor}`}>{p.tag}</span>
                    </div>
                    <p className="text-xs text-ink leading-relaxed mb-2">{p.content}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-ink-faint flex items-center gap-1">❤ {p.likes}</span>
                      <span className="text-[10px] text-ink-faint flex items-center gap-1">💬 {p.comments}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="border-y border-line bg-paper-dim/50">
        <div className="max-w-6xl mx-auto px-5 py-16">
          <p className="text-[10px] font-mono font-semibold text-violet tracking-widest uppercase mb-2 text-center">Getting started</p>
          <h2 className="font-display text-2xl font-bold text-ink text-center mb-10">Up and running in 2 minutes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { n: '1', title: 'Sign up with college email', desc: 'Only @vitbhopal.ac.in addresses are accepted — no outsiders.' },
              { n: '2', title: 'Set up your profile', desc: 'Add your branch, year, skills, and GitHub. Your profile travels with you.' },
              { n: '3', title: 'Explore and connect', desc: 'Browse the feed, join communities, find projects or start your own.' },
            ].map((s) => (
              <div key={s.n} className="vc-card p-5 flex gap-4 items-start">
                <div className="w-8 h-8 rounded-xl bg-violet/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="font-display font-bold text-violet text-sm">{s.n}</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-ink mb-1">{s.title}</h3>
                  <p className="text-xs text-ink-soft leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <p className="text-[10px] font-mono font-semibold text-violet tracking-widest uppercase mb-2 text-center">What's inside</p>
        <h2 className="font-display text-2xl font-bold text-ink text-center mb-3">Built for makers at VIT Bhopal</h2>
        <p className="text-sm text-ink-soft text-center mb-10 max-w-md mx-auto">
          Not a generic social app. Every feature was designed around how students actually collaborate.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURES.map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="vc-card p-5 hover:shadow-md transition-shadow">
              <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}>
                <Icon className="w-4 h-4" />
              </div>
              <h3 className="font-display font-bold text-sm text-ink mb-1">{title}</h3>
              <p className="text-xs text-ink-soft leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-6xl mx-auto px-5 pb-16">
        <div className="vc-card p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet/5 via-transparent to-amber/5 pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-violet/30 to-transparent" />
          <div className="relative">
            <p className="text-[10px] font-mono font-semibold text-violet tracking-widest uppercase mb-3">Limited beta</p>
            <h2 className="font-display text-2xl font-bold text-ink mb-2">Ready to build together?</h2>
            <p className="text-sm text-ink-soft mb-7 max-w-xs mx-auto">
              Beta is open to the first {BETA_LIMIT} VIT Bhopal students. Grab your spot before it fills up.
            </p>
            <button onClick={() => openModal('signup')}
              className="px-8 py-3 rounded-xl bg-ink text-paper text-sm font-semibold hover:bg-ink/90 transition-all shadow-sm hover:shadow-md">
              Create free account →
            </button>
            <p className="text-xs text-ink-faint mt-4 font-mono">@vitbhopal.ac.in required · Free during beta</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-line">
        <div className="max-w-6xl mx-auto px-5 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-ink flex items-center justify-center">
              <span className="font-display font-bold text-amber text-[9px]">V</span>
            </div>
            <span className="font-display font-bold text-sm text-ink">VCollab</span>
          </div>
          <p className="text-[10px] font-mono text-ink-faint tracking-widest uppercase">VIT Bhopal Student Network · Beta</p>
        </div>
      </footer>

      {/* ── AUTH MODAL ── */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div className="bg-paper-card rounded-2xl shadow-xl w-full max-w-sm p-7 relative border border-line">
            <button onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-paper-dim hover:bg-line flex items-center justify-center transition-colors">
              <XIcon className="w-3.5 h-3.5 text-ink-soft" />
            </button>

            {signupSent ? (
              <SuccessCard
                title="Check your inbox"
                body={<>Confirmation link sent to <Code>{email}</Code>. Confirm it, then sign in.</>}
                action={<button className="w-full py-2.5 rounded-xl border border-line text-sm font-medium text-ink hover:bg-paper-dim transition-colors"
                  onClick={() => { setMode('signin'); setSignupSent(false) }}>Back to sign in</button>}
              />
            ) : resetSent ? (
              <SuccessCard
                title="Reset email sent"
                body={<>Check <Code>{email}</Code> for a password reset link.</>}
                action={<button className="w-full py-2.5 rounded-xl border border-line text-sm font-medium text-ink hover:bg-paper-dim transition-colors"
                  onClick={() => { setMode('signin'); setResetSent(false) }}>Back to sign in</button>}
              />
            ) : (
              <>
                {/* Brand mark inside modal */}
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-7 h-7 rounded-lg bg-ink flex items-center justify-center">
                    <span className="font-display font-bold text-amber text-xs">V</span>
                  </div>
                  <span className="font-display font-bold text-sm text-ink">VCollab</span>
                </div>

                <h2 className="font-display text-xl font-bold text-ink mb-1">
                  {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Join VCollab' : 'Reset password'}
                </h2>
                <p className="text-xs text-ink-faint mb-6">
                  {mode === 'forgot' ? "We'll send a reset link to your college email." : 'Exclusively for VIT Bhopal students.'}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div>
                    <label className="block text-[10px] font-mono text-ink-soft mb-1.5 tracking-widest uppercase">College Email</label>
                    <input
                      type="email" inputMode="email" autoComplete="email"
                      placeholder="yourname@vitbhopal.ac.in"
                      value={email} onChange={(e) => handleEmailChange(e.target.value)}
                      className={`input ${domainError ? 'border-rust/50' : ''}`}
                    />
                    {domainError && <p className="text-xs text-rust mt-1.5">⚠ {domainError}</p>}
                  </div>

                  {mode !== 'forgot' && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[10px] font-mono text-ink-soft tracking-widest uppercase">Password</label>
                        {mode === 'signin' && (
                          <button type="button" onClick={() => { setMode('forgot'); setFormError('') }}
                            className="text-xs text-ink-faint hover:text-ink underline underline-offset-2 transition-colors">
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <input
                        type="password"
                        autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                        placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                        value={password} onChange={(e) => { setPassword(e.target.value); setFormError('') }}
                        className="input"
                      />
                    </div>
                  )}

                  {formError && (
                    <div className="bg-rust-soft border border-rust/20 rounded-xl px-4 py-3 text-sm text-rust flex items-start gap-2">
                      <span className="shrink-0">⚠</span>{formError}
                    </div>
                  )}

                  <button type="submit" disabled={!canSubmit}
                    className="w-full py-2.5 rounded-xl bg-ink text-paper text-sm font-semibold hover:bg-ink/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                    {submitting ? <Spinner size={18} /> :
                      mode === 'signin' ? 'Sign in' :
                      mode === 'signup' ? 'Create account' : 'Send reset link'}
                  </button>
                </form>

                <div className="relative my-5">
                  <div className="border-t border-line" />
                  <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-paper-card px-3 text-xs text-ink-faint">or</span>
                </div>

                {mode === 'forgot' ? (
                  <p className="text-sm text-ink-faint text-center">
                    Remember it?{' '}
                    <button onClick={() => { setMode('signin'); setFormError('') }}
                      className="text-ink font-semibold hover:text-amber-deep underline underline-offset-2 transition-colors">Sign in</button>
                  </p>
                ) : (
                  <p className="text-sm text-ink-faint text-center">
                    {mode === 'signin' ? 'New to VCollab? ' : 'Already a member? '}
                    <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setFormError('') }}
                      className="text-ink font-semibold hover:text-amber-deep underline underline-offset-2 transition-colors">
                      {mode === 'signin' ? 'Create account' : 'Sign in'}
                    </button>
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Code({ children }) {
  return <span className="font-mono text-ink bg-paper-dim px-1.5 py-0.5 rounded-md text-xs">{children}</span>
}

function SuccessCard({ title, body, action }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-2xl bg-teal-soft flex items-center justify-center mx-auto mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-teal">
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 className="font-display text-lg font-bold mb-2">{title}</h2>
      <p className="text-sm text-ink-soft mb-5 leading-relaxed">{body}</p>
      {action}
    </div>
  )
}

function FeedIcon(props) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 21V12h6v9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
}
function ConnectIcon(props) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <circle cx="8" cy="12" r="3" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" />
    <path d="M10.5 10.5l5-3M10.5 13.5l5 3" strokeLinecap="round" />
  </svg>
}
function CommunityIcon(props) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <circle cx="9" cy="7" r="3" /><path d="M2 21c0-3.5 3.1-6 7-6s7 2.5 7 6" strokeLinecap="round" />
    <circle cx="17" cy="8" r="2" /><path d="M16 14.5c2.4.5 4 2.4 4 6.5" strokeLinecap="round" />
  </svg>
}
function EventsIcon(props) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
  </svg>
}
function ProfileIcon(props) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
  </svg>
}
function NetworkIcon(props) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" />
  </svg>
}
function XIcon(props) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
  </svg>
}