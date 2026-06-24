import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Avatar, Spinner } from './ui/Primitives'

export default function TeamChatModal({ project, onClose }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // ─── Fetch existing messages ───────────────────────────────────────────────
  useEffect(() => {
    async function fetchMessages() {
      const { data, error } = await supabase
        .from('project_messages')
        .select('*, users(id, name, avatar_url)')
        .eq('project_id', project.id)
        .order('created_at', { ascending: true })
        .limit(100)

      if (!error) setMessages(data || [])
      setLoading(false)
    }

    fetchMessages()
  }, [project.id])

  // ─── Realtime subscription ─────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`project-chat-${project.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_messages',
          filter: `project_id=eq.${project.id}`,
        },
        async (payload) => {
          // Fetch the sender's user info for the new message
          const { data: userData } = await supabase
            .from('users')
            .select('id, name, avatar_url')
            .eq('id', payload.new.user_id)
            .single()

          setMessages((prev) => [
            ...prev,
            { ...payload.new, users: userData },
          ])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [project.id])

  // ─── Auto scroll to bottom on new messages ─────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ─── Focus input on open ───────────────────────────────────────────────────
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  // ─── Send message ──────────────────────────────────────────────────────────
  async function sendMessage() {
    const trimmed = text.trim()
    if (!trimmed || sending) return

    setSending(true)
    const { error } = await supabase
      .from('project_messages')
      .insert({
        project_id: project.id,
        user_id: user.id,
        content: trimmed,
      })

    setSending(false)
    if (!error) setText('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // ─── Group messages by sender (consecutive) ────────────────────────────────
  function isNewGroup(msg, idx) {
    if (idx === 0) return true
    return messages[idx - 1].user_id !== msg.user_id
  }

  function formatTime(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(2px)',
          zIndex: 50,
        }}
      />

      {/* ── Modal ── */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          maxWidth: '560px',
          height: '600px',
          maxHeight: '90vh',
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 51,
        }}
      >

        {/* ── Modal Header ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #ebebeb',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Chat icon */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: '#111',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" style={{ width: 16, height: 16 }}>
                <path d="M21 11.5a8.5 8.5 0 01-8.5 8.5 8.4 8.4 0 01-4-1L3 20l1.1-3.6A8.4 8.4 0 014 13.5 8.5 8.5 0 1121 11.5z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15, color: '#111', lineHeight: 1.2 }}>
                {project.title}
              </p>
              <p style={{ fontSize: 12, color: '#888', marginTop: 1 }}>Team chat</p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              border: '1.5px solid #e5e5e5',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
              fontSize: 16,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            ✕
          </button>
        </div>

        {/* ── Messages Area ── */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            background: '#fafafa',
          }}
        >
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
              <Spinner size={24} color="text-violet" />
            </div>
          ) : messages.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                color: '#aaa',
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" style={{ width: 40, height: 40 }}>
                <path d="M21 11.5a8.5 8.5 0 01-8.5 8.5 8.4 8.4 0 01-4-1L3 20l1.1-3.6A8.4 8.4 0 014 13.5 8.5 8.5 0 1121 11.5z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p style={{ fontSize: 13 }}>No messages yet. Say hello!</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.user_id === user.id
              const showHeader = isNewGroup(msg, idx)

              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: isMe ? 'row-reverse' : 'row',
                    alignItems: 'flex-end',
                    gap: 8,
                    marginTop: showHeader ? 12 : 2,
                  }}
                >
                  {/* Avatar — only on first of group, other side */}
                  <div style={{ width: 28, flexShrink: 0 }}>
                    {showHeader && !isMe && (
                      <Avatar url={msg.users?.avatar_url} name={msg.users?.name} size={28} />
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '72%',
                      gap: 2,
                    }}
                  >
                    {/* Name + time header */}
                    {showHeader && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          flexDirection: isMe ? 'row-reverse' : 'row',
                        }}
                      >
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#555' }}>
                          {isMe ? 'You' : msg.users?.name}
                        </span>
                        <span style={{ fontSize: 10, color: '#bbb' }}>{formatTime(msg.created_at)}</span>
                      </div>
                    )}

                    {/* Bubble */}
                    <div
                      style={{
                        padding: '9px 13px',
                        borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                        background: isMe ? '#111' : '#fff',
                        color: isMe ? '#fff' : '#1a1a1a',
                        fontSize: 13,
                        lineHeight: 1.5,
                        boxShadow: isMe
                          ? '0 1px 4px rgba(0,0,0,0.15)'
                          : '0 1px 3px rgba(0,0,0,0.08)',
                        border: isMe ? 'none' : '1px solid #ececec',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Input Area ── */}
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid #ebebeb',
            background: '#fff',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 10,
          }}
        >
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message the team… (Enter to send)"
            rows={1}
            style={{
              flex: 1,
              resize: 'none',
              border: '1.5px solid #e5e5e5',
              borderRadius: '12px',
              padding: '10px 14px',
              fontSize: 13,
              lineHeight: 1.5,
              outline: 'none',
              fontFamily: 'inherit',
              color: '#111',
              background: '#fafafa',
              transition: 'border-color 0.15s',
              maxHeight: 120,
              overflowY: 'auto',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#111')}
            onBlur={(e) => (e.target.style.borderColor = '#e5e5e5')}
            onInput={(e) => {
              // auto grow
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
          />

          {/* Send button */}
          <button
            onClick={sendMessage}
            disabled={!text.trim() || sending}
            style={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              background: text.trim() ? '#111' : '#e5e5e5',
              border: 'none',
              cursor: text.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
          >
            {sending ? (
              <Spinner size={14} color={text.trim() ? 'text-white' : 'text-gray-400'} />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke={text.trim() ? '#fff' : '#aaa'} strokeWidth="2" style={{ width: 16, height: 16 }}>
                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>

      </div>
    </>
  )
}