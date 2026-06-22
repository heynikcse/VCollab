import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Card, Avatar, Spinner, EmptyState } from '../components/ui/Primitives'
import Button from '../components/ui/Button'

export default function MessagesPage() {
  const { userId: peerId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [conversations, setConversations] = useState(null)
  const [peer, setPeer] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [loadingThread, setLoadingThread] = useState(false)
  const scrollRef = useRef(null)
  const peerIdRef = useRef(peerId) 
  useEffect(() => { peerIdRef.current = peerId }, [peerId]) 

  // --- Conversation list (left column) ---
  const loadConversations = useCallback(async () => {
    const { data, error } = await supabase
      .from('direct_messages')
      .select('id, sender_id, receiver_id, content, created_at, read_at')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) { console.error(error); return }

    const byPeer = new Map()
    for (const m of data || []) {
      const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id
      if (!byPeer.has(otherId)) {
        byPeer.set(otherId, {
          peerId: otherId,
          lastMessage: m.content,
          lastAt: m.created_at,
          unread: m.receiver_id === user.id && !m.read_at,
        })
      }
    }

    const peerIds = [...byPeer.keys()]
    if (peerIds.length) {
      const { data: users } = await supabase.from('users').select('id, name, avatar_url').in('id', peerIds)
      for (const u of users || []) {
        const entry = byPeer.get(u.id)
        if (entry) { entry.name = u.name; entry.avatarUrl = u.avatar_url }
      }
    }

    setConversations([...byPeer.values()].sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt)))
  }, [user.id])

  useEffect(() => { loadConversations() }, [loadConversations])

  // --- Active thread (right column) ---
  const loadThread = useCallback(async () => {
    if (!peerId) return
    setLoadingThread(true)

    const { data: peerProfile } = await supabase
      .from('users').select('id, name, avatar_url, branch, year').eq('id', peerId).single()
    setPeer(peerProfile)

    const { data, error } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
      .limit(500)

    if (!error) setMessages(data || [])
    setLoadingThread(false)

    // mark incoming messages as read
    await supabase
      .from('direct_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('sender_id', peerId)
      .eq('receiver_id', user.id)
      .is('read_at', null)
  }, [peerId, user.id])

  useEffect(() => { loadThread() }, [loadThread])

  // --- Realtime: new messages either way ---
  useEffect(() => {
    const channel = supabase
      .channel(`dm-${user.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `receiver_id=eq.${user.id}` },
        (payload) => {
          const m = payload.new
          if (peerIdRef.current && m.sender_id === peerIdRef.current) {
            setMessages((prev) => [...prev, m])
            supabase.from('direct_messages').update({ read_at: new Date().toISOString() }).eq('id', m.id).then(() => {})
          }
          loadConversations()
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user.id, loadConversations])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e) {
    e.preventDefault()
    const content = draft.trim()
    if (!content || !peerId || sending) return
    setSending(true)
    setDraft('')

    const optimistic = {
      id: `temp-${Date.now()}`,
      sender_id: user.id,
      receiver_id: peerId,
      content,
      created_at: new Date().toISOString(),
      read_at: null,
    }
    setMessages((prev) => [...prev, optimistic])

    const { data, error } = await supabase
      .from('direct_messages')
      .insert({ sender_id: user.id, receiver_id: peerId, content })
      .select()
      .single()

    if (error) {
      console.error(error)
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
      setSendError('Message failed to send. Please try again.')
      setDraft(content)
    } else {
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? data : m)))
      loadConversations()
    }
    setSending(false)
  }

  return (
    <div className="grid md:grid-cols-[280px_1fr] gap-4 h-[calc(100vh-7.5rem)]">
      <Card className="overflow-y-auto">
        <div className="p-4 border-b border-line">
          <h2 className="font-display font-semibold text-sm">Messages</h2>
        </div>
        {conversations === null ? (
          <div className="py-10 flex justify-center"><Spinner size={22} /></div>
        ) : conversations.length === 0 ? (
          <p className="text-sm text-ink-faint p-4">
            No conversations yet. Visit someone's profile and hit "Message" to start one.
          </p>
        ) : (
          <ul>
            {conversations.map((c) => (
              <li key={c.peerId}>
                <button
                  onClick={() => navigate(`/messages/${c.peerId}`)}
                  className={`w-full flex items-center gap-3 p-3 text-left hover:bg-paper-dim transition-colors
                    ${peerId === c.peerId ? 'bg-paper-dim' : ''}`}
                >
                  <Avatar url={c.avatarUrl} name={c.name} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-ink truncate">{c.name || 'Student'}</p>
                      {c.unread && <span className="w-2 h-2 rounded-full bg-amber shrink-0" />}
                    </div>
                    <p className="text-xs text-ink-faint truncate">{c.lastMessage}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="flex flex-col overflow-hidden">
        {!peerId ? (
          <EmptyState title="Select a conversation" description="Pick someone from the left, or start a new chat from their profile." />
        ) : loadingThread ? (
          <div className="flex-1 flex items-center justify-center"><Spinner size={24} /></div>
        ) : (
          <>
            <div className="p-4 border-b border-line flex items-center gap-3">
              <Avatar url={peer?.avatar_url} name={peer?.name} size={36} />
              <div>
                <button onClick={() => navigate(`/profile/${peerId}`)} className="text-sm font-medium text-ink hover:underline">
                  {peer?.name || 'Student'}
                </button>
                <p className="text-xs text-ink-faint font-mono">
                  {peer?.branch}{peer?.year ? ` · Year ${peer.year}` : ''}
                </p>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.length === 0 ? (
                <p className="text-sm text-ink-faint text-center mt-8">Say hi 👋</p>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[70%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap leading-snug
                        ${m.sender_id === user.id ? 'bg-ink text-paper' : 'bg-paper-dim text-ink'}`}
                    >
                      {m.content}
                      <div className={`text-[10px] mt-1 font-mono ${m.sender_id === user.id ? 'text-paper/60' : 'text-ink-faint'}`}>
                        {new Date(m.created_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={sendMessage} className="p-3 border-t border-line space-y-1.5">
              {sendError && (
                <p className="text-xs text-rust px-1">{sendError}</p>
              )}
              <div className="flex items-center gap-2">
                <input
                  value={draft}
                  onChange={(e) => { setDraft(e.target.value); setSendError('') }}
                  placeholder="Write a message…"
                  maxLength={2000}
                  className="flex-1 px-3 py-2 text-sm rounded-md border border-line bg-paper focus:outline-none focus:border-ink"
                />
                <Button type="submit" size="sm" disabled={!draft.trim() || sending}>
                  {sending ? <Spinner size={14} /> : 'Send'}
                </Button>
              </div>
            </form>
          </>
        )}
      </Card>
    </div>
  )
}
