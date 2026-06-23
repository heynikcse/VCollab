import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Card, EmptyState, Spinner } from '../components/ui/Primitives'
import SkillPill from '../components/ui/SkillPill'
import Button from '../components/ui/Button'
import { uploadImage, validateImageFile } from '../lib/storage'

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'popular', label: 'Popular' },
  { key: 'mine', label: 'My events' },
]
const CATEGORIES = ['tech', 'cultural', 'sports', 'academic']

export default function EventsPage() {
  const { user, profile } = useAuth()
  const [tab, setTab] = useState('upcoming')
  const [category, setCategory] = useState(null)
  const [events, setEvents] = useState([])
  const [myRegistrations, setMyRegistrations] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const canCreate = profile?.role === 'admin' || profile?.role === 'club'

  const load = useCallback(async () => {
    setLoading(true)

    const { data: regs } = await supabase
      .from('event_registrations')
      .select('event_id')
      .eq('user_id', user.id)
    const regIds = new Set((regs || []).map((r) => r.event_id))
    setMyRegistrations(regIds)

    let query = supabase.from('events').select('*, users(name)')
    if (category) query = query.eq('category', category)

    if (tab === 'upcoming') {
      query = query.gte('date', new Date().toISOString()).order('date', { ascending: true })
    } else if (tab === 'popular') {
      query = query.order('date', { ascending: true }) // count sorted client-side below
    } else {
      query = query.in('id', regIds.size ? [...regIds] : ['00000000-0000-0000-0000-000000000000'])
        .order('date', { ascending: true })
    }

    const { data, error } = await query.limit(30)
    if (error) { console.error(error); setLoading(false); return }

    const eventIds = (data || []).map((e) => e.id)
    let counts = {}
    if (eventIds.length) {
      const { data: allRegs } = await supabase
        .from('event_registrations')
        .select('event_id')
        .in('event_id', eventIds)
      for (const r of allRegs || []) counts[r.event_id] = (counts[r.event_id] || 0) + 1
    }

    let withCounts = (data || []).map((e) => ({ ...e, registered_count: counts[e.id] || 0 }))
    if (tab === 'popular') withCounts.sort((a, b) => b.registered_count - a.registered_count)

    setEvents(withCounts)
    setLoading(false)
  }, [tab, category, user.id])

  useEffect(() => { load() }, [load])

  async function register(eventId) {
    await supabase.from('event_registrations').insert({ event_id: eventId, user_id: user.id })
    load()
  }
  async function unregister(eventId) {
    await supabase.from('event_registrations').delete().eq('event_id', eventId).eq('user_id', user.id)
    load()
  }

  return (
    <div className="max-w-6xl mx-auto">
      <header className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 text-xs mb-3">Events</div>
          <h1 className="font-display text-4xl font-bold">Upcoming <span className="text-gradient">events</span></h1>
          <p className="mt-2 text-muted-foreground max-w-xl">Workshops, hackathons and meetups around campus — RSVP and stay involved.</p>
        </div>
        <div>
          {canCreate && (
            <button className="gradient-neon text-background rounded-xl px-4 py-2.5 text-sm font-semibold" onClick={() => setShowCreate(true)}>+ Create event</button>
          )}
        </div>
      </header>

      <div className="flex items-center gap-1 border-b border-line mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
              ${tab === t.key ? 'border-ink text-ink' : 'border-transparent text-ink-faint hover:text-ink'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {CATEGORIES.map((c) => (
          <SkillPill key={c} active={category === c} onClick={() => setCategory(category === c ? null : c)}>
            {c}
          </SkillPill>
        ))}
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Spinner size={28} /></div>
      ) : events.length === 0 ? (
        <EmptyState
          title={tab === 'mine' ? "You haven't registered for anything yet" : 'No events found'}
          description={tab === 'mine' ? 'Browse upcoming events and register to see them here.' : 'Check back soon, or try a different category.'}
        />
      ) : (
        <div className="space-y-3">
          {events.map((ev) => (
            <Card key={ev.id} className="overflow-hidden flex flex-col sm:flex-row">
              {ev.poster_url && (
                <img src={ev.poster_url} alt="" className="sm:w-44 h-32 sm:h-auto object-cover" />
              )}
              <div className="p-4 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display font-semibold text-ink">{ev.title}</h3>
                    <p className="text-xs text-ink-faint font-mono mt-1">
                      {new Date(ev.date).toLocaleDateString(undefined, {
                        weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {ev.category && <SkillPill size="sm">{ev.category}</SkillPill>}
                </div>
                {ev.description && <p className="text-sm text-ink-soft mt-2 line-clamp-2">{ev.description}</p>}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-line">
                  <span className="text-xs text-ink-faint">
                    {ev.users?.name} · {ev.registered_count} registered
                  </span>
                  {myRegistrations.has(ev.id) ? (
                    <Button variant="secondary" size="sm" onClick={() => unregister(ev.id)}>Registered</Button>
                  ) : (
                    <Button
                      variant="accent"
                      size="sm"
                      onClick={() => register(ev.id)}
                      disabled={ev.max_attendees && ev.registered_count >= ev.max_attendees}
                    >
                      {ev.max_attendees && ev.registered_count >= ev.max_attendees ? 'Full' : 'Register'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateEventModal onClose={() => setShowCreate(false)} onCreated={load} />
      )}
    </div>
  )
}

function CreateEventModal({ onClose, onCreated }) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [category, setCategory] = useState('tech')
  const [maxAttendees, setMaxAttendees] = useState('')
  const [posterFile, setPosterFile] = useState(null)
  const [posterPreview, setPosterPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handlePoster(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateImageFile(file)
    if (err) { setError(err); return }
    setPosterFile(file)
    setPosterPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !date) return
    setSaving(true)
    setError('')
    try {
      let poster_url = null
      if (posterFile) poster_url = await uploadImage('event-posters', posterFile, user.id)

      const { error } = await supabase.from('events').insert({
        title: title.trim(),
        description: description.trim() || null,
        date: new Date(date).toISOString(),
        category,
        organizer_id: user.id,
        max_attendees: maxAttendees ? Number(maxAttendees) : null,
        poster_url,
      })
      if (error) throw error
      onCreated()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl font-semibold mb-5">Create event</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" className="input" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Schedule, prizes, rules..." rows={3} className="input resize-none" />
          <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <SkillPill key={c} active={category === c} onClick={() => setCategory(c)}>{c}</SkillPill>
            ))}
          </div>
          <input type="number" min={1} value={maxAttendees} onChange={(e) => setMaxAttendees(e.target.value)} placeholder="Max participants (optional)" className="input" />
          <div>
            <label className="cursor-pointer text-sm text-ink underline underline-offset-2">
              {posterFile ? 'Change poster' : 'Add poster image (optional)'}
              <input type="file" accept="image/*" className="hidden" onChange={handlePoster} />
            </label>
            {posterPreview && <img src={posterPreview} alt="" className="mt-2 rounded-lg max-h-32" />}
          </div>
          {error && <p className="text-sm text-rust">{error}</p>}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="accent" className="flex-1" disabled={!title.trim() || !date || saving}>
              {saving ? <Spinner size={16} /> : 'Create event'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
