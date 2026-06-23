import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Avatar, Spinner } from './ui/Primitives'
import SkillPill from './ui/SkillPill'
import Button from './ui/Button'

const POST_TYPES = [
  { value: 'general', label: 'General', tone: 'default' },
  { value: 'question', label: 'Question', tone: 'amber' },
  { value: 'opinion', label: 'Opinion', tone: 'teal' },
  { value: 'announcement', label: 'Announcement', tone: 'rust' },
]

export default function PostComposer({ onPosted }) {
  const { user, profile } = useAuth()
  const [content, setContent] = useState('')
  const [postType, setPostType] = useState('general')
  
  const [error, setError] = useState('')
  const [posting, setPosting] = useState(false)


  async function handleSubmit(e) {
    e.preventDefault()
    if (!content.trim() || posting) return
    setPosting(true)
    setError('')

    try {
      const { error: insertError } = await supabase.from('posts').insert({
        user_id: user.id,
        content: content.trim(),
        post_type: postType,
      })
      if (insertError) throw insertError

      setContent('')
      setPostType('general')
      onPosted?.()
    } catch (err) {
      setError(err.message || 'Could not post. Try again.')
    } finally {
      setPosting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <Avatar url={profile?.avatar_url} name={profile?.name} size={40} />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 500))}
            placeholder="Share an update, ask a question, start a discussion..."
            rows={3}
            className="w-full text-sm resize-none focus:outline-none placeholder:text-ink-faint bg-transparent"
          />

          

          {error && <p className="text-xs text-rust mt-2">{error}</p>}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-line">
            <div className="flex flex-wrap items-center gap-1.5">
              {POST_TYPES.map((t) => (
                <SkillPill
                  key={t.value}
                  size="sm"
                  tone={t.tone}
                  active={postType === t.value}
                  onClick={() => setPostType(t.value)}
                >
                  {t.label}
                </SkillPill>
              ))}
              
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-ink-faint font-mono">{content.length}/500</span>
              <Button type="submit" variant="accent" size="sm" disabled={!content.trim() || posting}>
                {posting ? <Spinner size={16} /> : 'Post'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
 
