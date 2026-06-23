import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Card, Avatar, Spinner, EmptyState } from './ui/Primitives'
import Button from './ui/Button'

export default function ProjectChatDrawer({ project, open, onClose }) {
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [selectedPeer, setSelectedPeer] = useState(null)
  const [broadcast, setBroadcast] = useState(false)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open || !project) return
    setLoading(true)
    async function loadMembers() {
      const { data } = await supabase
        .from('project_members')
        .select('user_id, users(id, name, avatar_url)')
        .eq('project_id', project.id)
        .eq('status', 'accepted')
        .limit(50)
      const list = (data || []).map((m) => m.users).filter(Boolean)
      setMembers(list)
      setLoading(false)
    }
    loadMembers()
  }, [open, project])

  useEffect(() => {
    if (!open) return
    async function loadMessages() {
      const memberIds = members.map((m) => m.id)
      if (!memberIds.length) { setMessages([]); return }
      // load messages where both sender and receiver are team members
      const { data } = await supabase
        .from('direct_messages')
        .select('*')
        .in('sender_id', memberIds)
        .in('receiver_id', memberIds)
        .order('created_at', { ascending: true })
        .limit(500)
      setMessages(data || [])
    }
    loadMessages()
    // subscribe to new DMs and append if both participants are team members
    const channel = supabase
      .channel(`project-chat-${project?.id}-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, (payload) => {
        const m = payload.new
        if (members.some((mm) => mm.id === m.sender_id) && members.some((mm) => mm.id === m.receiver_id)) {
          setMessages((prev) => [...prev, m])
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [open, members, project, user.id])

  useEffect(() => {
    if (open) {
      // focus the input when the modal opens
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  async function sendMessage(e) {
    e?.preventDefault()
    const text = draft.trim()
    if (!text) return
    setSending(true)
    setDraft('')

    try {
      // Team-only chat: insert a single direct_message (one DB row) using a canonical receiver
      const otherMember = members.find((m) => m.id !== user.id)
      const receiverId = otherMember ? otherMember.id : user.id
      const { error } = await supabase.from('direct_messages').insert({ sender_id: user.id, receiver_id: receiverId, content: text })
      if (error) throw error
      // optimistic local add for display (single message)
      const tempMessage = { id: `temp-${Date.now()}`, sender_id: user.id, receiver_id: receiverId, content: text, created_at: new Date().toISOString() }
      setMessages((prev) => [...prev, tempMessage])
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[80vh] bg-card border border-line shadow-xl rounded-xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-line flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-card-foreground">{project?.title || 'Project Chat'}</h3>
            <p className="text-xs text-muted-foreground">Team discussion space (uses existing direct messages)</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto flex-1" ref={scrollRef}>
          {loading ? (
            <div className="py-6 flex justify-center"><Spinner size={20} /></div>
          ) : members.length === 0 ? (
            <EmptyState title="No team members" description="Invite collaborators to start a conversation." />
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-3">
                {members.slice(0,8).map((m) => (
                  <div key={m.id} className="flex items-center gap-2">
                    <Avatar url={m.avatar_url} name={m.name} size={28} />
                    <div className="text-sm truncate">{m.name}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                {messages.length === 0 ? (
                  <p className="text-sm text-ink-faint">No recent messages with your team yet. Use the composer below to start a conversation.</p>
                ) : messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap leading-snug ${m.sender_id === user.id ? 'bg-ink text-paper' : 'bg-card text-card-foreground'}`}>
                      {m.content}
                      <div className="text-[10px] mt-1 font-mono text-ink-faint">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={sendMessage} className="p-3 border-t border-line">
          <div className="flex items-center gap-2">
            <input ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message to the team…" className="flex-1 px-3 py-2 text-sm rounded-md border border-line bg-paper" />
            <Button type="submit" size="sm" disabled={!draft.trim() || sending}>{sending ? <Spinner size={14} /> : 'Send'}</Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Messages are visible to accepted project members only.</p>
        </form>
      </div>
    </div>
  )
}
