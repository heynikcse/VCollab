import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { EmptyState, Spinner } from '../components/ui/Primitives'
import SkillPill from '../components/ui/SkillPill'
import Button from '../components/ui/Button'

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'popular', label: 'Popular' },
  { key: 'mine', label: 'My events' },
]
const CATEGORIES = ['tech', 'cultural', 'sports', 'academic']

const CATEGORY_COLORS = {
  tech: 'violet',
  cultural: 'amber',
  sports: 'teal',
  academic: 'rust',
}

const CATEGORY_ICONS = {
  tech: '💻',
  cultural: '🎭',
  sports: '⚽',
  academic: '📚',
}

async function uploadPoster(file, userId) {
  const ext = file.name.split('.').pop()
  const path = `posters/${userId}_${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from('event-posters')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw error
  const { data } = supabase.storage.from('event-posters').getPublicUrl(path)
  return data.publicUrl
}

export default function EventsPage() {
  const { user } = useAuth()                  // user from AuthContext — already fresh
  const [tab, setTab] = useState('upcoming')
  const [category, setCategory] = useState(null)
  const [events, setEvents] = useState([])
  const [myRegistrations, setMyRegistrations] = useState(new Set())
  const [myInterests, setMyInterests] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const { profile } = useAuth()

  const canCreate = profile?.role === 'admin' || profile?.role === 'club'

  const load = useCallback(async (uid) => {
    // uid passed explicitly — never rely on closure/stale state
    if (!uid) { setLoading(false); return }

    setLoading(true)
    // Clear immediately so previous user's data never bleeds into this fetch
    setMyRegistrations(new Set())
    setMyInterests(new Set())

    const { data: regs } = await supabase
      .from('event_registrations')
      .select('event_id')
      .eq('user_id', uid)
    const regIds = new Set((regs || []).map((r) => r.event_id))
    setMyRegistrations(regIds)

    const { data: interests } = await supabase
      .from('event_interests')
      .select('event_id')
      .eq('user_id', uid)
    const interestIds = new Set((interests || []).map((i) => i.event_id))
    setMyInterests(interestIds)

    let query = supabase.from('events').select('*, users(name)')
    if (category) query = query.eq('category', category)

    if (tab === 'upcoming') {
      query = query.gte('date', new Date().toISOString()).order('date', { ascending: true })
    } else if (tab === 'popular') {
      query = query.order('date', { ascending: true })
    } else {
      query = query
        .in('id', regIds.size ? [...regIds] : ['00000000-0000-0000-0000-000000000000'])
        .order('date', { ascending: true })
    }

    const { data, error } = await query.limit(30)
    if (error) { console.error(error); setLoading(false); return }

    const eventIds = (data || []).map((e) => e.id)
    let counts = {}
    let interestCounts = {}

    if (eventIds.length) {
      const { data: allRegs } = await supabase
        .from('event_registrations')
        .select('event_id')
        .in('event_id', eventIds)
      for (const r of allRegs || []) counts[r.event_id] = (counts[r.event_id] || 0) + 1

      const { data: allInterests } = await supabase
        .from('event_interests')
        .select('event_id')
        .in('event_id', eventIds)
      for (const i of allInterests || [])
        interestCounts[i.event_id] = (interestCounts[i.event_id] || 0) + 1
    }

    let withCounts = (data || []).map((e) => ({
      ...e,
      registered_count: counts[e.id] || 0,
      interest_count: interestCounts[e.id] || 0,
    }))

    if (tab === 'popular') withCounts.sort((a, b) => b.interest_count - a.interest_count)

    setEvents(withCounts)
    setLoading(false)
  }, [tab, category])

  // Re-run load whenever tab/category changes OR user changes
  useEffect(() => {
    load(user?.id)
  }, [load, user?.id])

  // NO onAuthStateChange here — AuthContext already handles it
  // user?.id changing above is enough to trigger a fresh load

  async function register(eventId) {
    if (!user?.id) return
    await supabase.from('event_registrations').insert({ event_id: eventId, user_id: user.id })
    load(user.id)
  }

  async function unregister(eventId) {
    if (!user?.id) return
    await supabase.from('event_registrations').delete().eq('event_id', eventId).eq('user_id', user.id)
    load(user.id)
  }

  // Optimistic like-button — flips UI instantly, syncs DB in background, NO load() call
  async function toggleInterest(eventId) {
    if (!user?.id) return

    const alreadyInterested = myInterests.has(eventId)

    // 1. Instant optimistic update
    setMyInterests((prev) => {
      const next = new Set(prev)
      alreadyInterested ? next.delete(eventId) : next.add(eventId)
      return next
    })
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? { ...e, interest_count: e.interest_count + (alreadyInterested ? -1 : 1) }
          : e
      )
    )

    // 2. Sync DB — no load() after this, optimistic state is already correct
    if (alreadyInterested) {
      const { error } = await supabase
        .from('event_interests')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id)

      if (error) {
        // Roll back on failure
        setMyInterests((prev) => { const next = new Set(prev); next.add(eventId); return next })
        setEvents((prev) =>
          prev.map((e) => e.id === eventId ? { ...e, interest_count: e.interest_count + 1 } : e)
        )
      }
    } else {
      const { error } = await supabase
        .from('event_interests')
        .insert({ event_id: eventId, user_id: user.id })

      if (error) {
        // Roll back on failure
        setMyInterests((prev) => { const next = new Set(prev); next.delete(eventId); return next })
        setEvents((prev) =>
          prev.map((e) => e.id === eventId ? { ...e, interest_count: e.interest_count - 1 } : e)
        )
      }
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display font-bold text-xl text-ink">Events</h1>
          <p className="text-sm text-ink-faint mt-0.5">Hackathons, workshops, and more</p>
        </div>
        {canCreate && (
          <Button variant="accent" size="sm" onClick={() => setShowCreate(true)}>
            + Create event
          </Button>
        )}
      </div>

      <div className="flex items-center gap-1 border-b border-line mb-5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`tab-btn ${tab === t.key ? 'tab-btn-active' : 'tab-btn-inactive'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {CATEGORIES.map((c) => (
          <SkillPill
            key={c}
            active={category === c}
            tone={CATEGORY_COLORS[c]}
            onClick={() => setCategory(category === c ? null : c)}
          >
            {CATEGORY_ICONS[c]} {c}
          </SkillPill>
        ))}
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Spinner size={28} color="text-violet" /></div>
      ) : events.length === 0 ? (
        <EmptyState
          title={tab === 'mine' ? "No registrations yet" : 'No events found'}
          description={
            tab === 'mine'
              ? 'Browse upcoming events and register to see them here.'
              : 'Check back soon, or try a different category.'
          }
        />
      ) : (
        <div className="space-y-3">
          {events.map((ev) => (
            <EventCard
              key={ev.id}
              event={ev}
              isRegistered={myRegistrations.has(ev.id)}
              isInterested={myInterests.has(ev.id)}
              onRegister={() => register(ev.id)}
              onUnregister={() => unregister(ev.id)}
              onToggleInterest={() => toggleInterest(ev.id)}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateEventModal onClose={() => setShowCreate(false)} onCreated={() => load(user?.id)} />
      )}
    </div>
  )
}

function EventCard({ event: ev, isRegistered, isInterested, onRegister, onUnregister, onToggleInterest }) {
  const isFull = ev.max_attendees && ev.registered_count >= ev.max_attendees
  const catColor = CATEGORY_COLORS[ev.category] || 'default'
  const eventDate = new Date(ev.date)
  const isUpcoming = eventDate > new Date()
  const hasExternalLink = !!ev.registration_link

  return (
    <div className="vc-card overflow-hidden">
      {ev.poster_url && (
        <div style={{ width: '100%', height: 180, overflow: 'hidden', background: '#f0f0f0' }}>
          <img
            src={ev.poster_url}
            alt={`${ev.title} poster`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}

      <div className="flex flex-row">
        <div className={`w-16 shrink-0 p-3 flex flex-col items-center justify-center gap-0 ${
          isUpcoming ? 'bg-violet/8' : 'bg-paper-dim'
        }`}>
          <p className="text-[10px] font-mono text-ink-faint uppercase leading-none mb-0.5">
            {eventDate.toLocaleDateString(undefined, { month: 'short' })}
          </p>
          <p className={`text-2xl font-display font-bold leading-none ${isUpcoming ? 'text-violet' : 'text-ink-faint'}`}>
            {eventDate.getDate()}
          </p>
          <p className="text-[9px] font-mono text-ink-faint mt-1 uppercase tracking-wide">
            {eventDate.toLocaleDateString(undefined, { weekday: 'short' })}
          </p>
        </div>

        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <h3 className="font-display font-bold text-ink leading-tight">{ev.title}</h3>
            {ev.category && (
              <SkillPill size="sm" tone={catColor}>
                {CATEGORY_ICONS[ev.category]} {ev.category}
              </SkillPill>
            )}
          </div>

          <p className="text-xs font-mono text-ink-faint mb-2">
            {eventDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
            {ev.users?.name ? ` · By ${ev.users.name}` : ''}
          </p>

          {ev.description && (
            <p className="text-sm text-ink-soft line-clamp-2 mb-3 leading-relaxed">{ev.description}</p>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-line-soft gap-2">
            <button
              onClick={onToggleInterest}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                borderRadius: 10,
                border: `1.5px solid ${isInterested ? '#6d5acd' : '#e5e5e5'}`,
                background: isInterested ? 'rgba(109,90,205,0.08)' : 'transparent',
                color: isInterested ? '#6d5acd' : '#888',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                flexShrink: 0,
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill={isInterested ? '#6d5acd' : 'none'}
                stroke={isInterested ? '#6d5acd' : '#aaa'}
                strokeWidth="2"
                style={{ width: 13, height: 13, transition: 'fill 0.15s, stroke 0.15s' }}
              >
                <path
                  d="M12 21C12 21 3 13.5 3 8a5 5 0 0110 0 5 5 0 0110 0c0 5.5-9 13-9 13z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Interested
              <span style={{
                marginLeft: 2,
                padding: '1px 6px',
                borderRadius: 20,
                background: isInterested ? 'rgba(109,90,205,0.12)' : '#f0f0f0',
                color: isInterested ? '#6d5acd' : '#999',
                fontSize: 11,
                fontWeight: 600,
                transition: 'all 0.15s',
              }}>
                {ev.interest_count || 0}
              </span>
            </button>

            {hasExternalLink ? (
              <a
                href={ev.registration_link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 14px',
                  borderRadius: 10,
                  background: '#111',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'background 0.15s',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#333')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#111')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}>
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Register now
              </a>
            ) : (
              isRegistered ? (
                <Button variant="teal" size="sm" onClick={onUnregister}>
                  ✓ Registered
                </Button>
              ) : (
                <Button
                  variant={isFull ? 'secondary' : 'accent'}
                  size="sm"
                  onClick={onRegister}
                  disabled={isFull}
                >
                  {isFull ? 'Full' : 'Register'}
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CreateEventModal({ onClose, onCreated }) {
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  const [title, setTitle]               = useState('')
  const [description, setDescription]   = useState('')
  const [date, setDate]                 = useState('')
  const [category, setCategory]         = useState('tech')
  const [maxAttendees, setMaxAttendees] = useState('')
  const [regLink, setRegLink]           = useState('')
  const [posterFile, setPosterFile]     = useState(null)
  const [posterPreview, setPosterPreview] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(false)
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState('')

  function handlePosterChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Poster must be under 5 MB.'); return }
    setPosterFile(file)
    setPosterPreview(URL.createObjectURL(file))
    setError('')
  }

  function removePoster() {
    setPosterFile(null)
    if (posterPreview) URL.revokeObjectURL(posterPreview)
    setPosterPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !date) return

    if (regLink.trim() && !regLink.trim().startsWith('http')) {
      setError('Registration link must start with http:// or https://')
      return
    }

    setSaving(true)
    setError('')

    try {
      let poster_url = null

      if (posterFile) {
        setUploadProgress(true)
        poster_url = await uploadPoster(posterFile, user.id)
        setUploadProgress(false)
      }

      const { error: insertErr } = await supabase.from('events').insert({
        title:             title.trim(),
        description:       description.trim() || null,
        date:              new Date(date).toISOString(),
        category,
        organizer_id:      user.id,
        max_attendees:     maxAttendees ? Number(maxAttendees) : null,
        poster_url,
        registration_link: regLink.trim() || null,
      })
      if (insertErr) throw insertErr

      onCreated()
      onClose()
    } catch (err) {
      setError(err.message)
      setUploadProgress(false)
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 13px',
    border: '1.5px solid #e5e5e5',
    borderRadius: '10px',
    fontSize: 13,
    fontFamily: 'inherit',
    color: '#111',
    background: '#fafafa',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  }

  return (
    <div
      className="fixed inset-0 bg-ink/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-paper-card rounded-t-3xl sm:rounded-2xl max-w-md w-full max-h-[92vh] overflow-y-auto shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-line rounded-full" />
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h2 className="font-display text-xl font-bold mb-1">Create event</h2>
            <p className="text-sm text-ink-faint">Add a new event for VIT Bhopal students</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              className="input"
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Schedule, prizes, rules…"
              rows={3}
              className="input resize-none"
            />

            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input"
            />

            <div>
              <p className="text-xs font-mono text-ink-soft mb-2 tracking-wide uppercase">Category</p>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => (
                  <SkillPill key={c} active={category === c} tone={CATEGORY_COLORS[c]} onClick={() => setCategory(c)}>
                    {CATEGORY_ICONS[c]} {c}
                  </SkillPill>
                ))}
              </div>
            </div>

            <input
              type="number"
              min={1}
              value={maxAttendees}
              onChange={(e) => setMaxAttendees(e.target.value)}
              placeholder="Max participants (optional)"
              className="input"
            />

            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                Registration Link
              </p>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" style={{ width: 14, height: 14 }}>
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <input
                  type="url"
                  value={regLink}
                  onChange={(e) => setRegLink(e.target.value)}
                  placeholder="https://forms.google.com/... (optional)"
                  style={{ ...inputStyle, paddingLeft: 34 }}
                  onFocus={(e) => (e.target.style.borderColor = '#111')}
                  onBlur={(e)  => (e.target.style.borderColor = '#e5e5e5')}
                />
              </div>
              <p style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
                If added, a "Register now" button will redirect to this link.
              </p>
            </div>

            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                Event Poster
              </p>

              {posterPreview ? (
                <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1.5px solid #e5e5e5' }}>
                  <img
                    src={posterPreview}
                    alt="Poster preview"
                    style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }}
                  />
                  <button
                    type="button"
                    onClick={removePoster}
                    style={{
                      position: 'absolute', top: 8, right: 8,
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.55)', border: 'none',
                      color: '#fff', fontSize: 13, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >✕</button>
                  <label
                    htmlFor="poster-upload"
                    style={{
                      position: 'absolute', bottom: 8, right: 8,
                      background: 'rgba(0,0,0,0.55)', color: '#fff',
                      fontSize: 11, padding: '4px 10px', borderRadius: 8, cursor: 'pointer',
                    }}
                  >
                    Change
                  </label>
                </div>
              ) : (
                <label
                  htmlFor="poster-upload"
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', gap: 8, padding: '28px 16px',
                    border: '2px dashed #e0e0e0', borderRadius: 12,
                    cursor: 'pointer', background: '#fafafa', transition: 'border-color 0.15s, background 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#111'
                    e.currentTarget.style.background = '#f5f5f5'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e0e0e0'
                    e.currentTarget.style.background = '#fafafa'
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5" style={{ width: 32, height: 32 }}>
                    <rect x="3" y="3" width="18" height="18" rx="3"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#555' }}>Click to upload poster</p>
                    <p style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>PNG, JPG, WEBP · Max 5 MB</p>
                  </div>
                </label>
              )}

              <input
                id="poster-upload"
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handlePosterChange}
                style={{ display: 'none' }}
              />
            </div>

            {error && (
              <p className="text-sm text-rust bg-rust-soft border border-rust/20 px-3 py-2 rounded-xl">{error}</p>
            )}

            <div className="flex gap-3 pt-1">
              <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="accent"
                className="flex-1"
                disabled={!title.trim() || !date || saving}
              >
                {saving ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Spinner size={14} />
                    {uploadProgress ? 'Uploading…' : 'Creating…'}
                  </span>
                ) : 'Create event'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}