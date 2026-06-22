import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Avatar, Spinner } from './ui/Primitives'
import Button from './ui/Button'

export default function CommunityPostComposer({ communityId, onPosted }) {
  const { user, profile } = useAuth()
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!content.trim() || posting) return
    setPosting(true)
    const { error } = await supabase.from('community_posts').insert({
      community_id: communityId,
      user_id: user.id,
      content: content.trim(),
    })
    setPosting(false)
    if (!error) {
      setContent('')
      onPosted?.()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-line rounded-lg p-3.5 flex items-start gap-3">
      <Avatar url={profile?.avatar_url} name={profile?.name} size={32} />
      <div className="flex-1">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, 500))}
          placeholder="Post in this community..."
          rows={2}
          className="w-full text-sm resize-none focus:outline-none placeholder:text-ink-faint"
        />
        <div className="flex justify-end mt-1">
          <Button type="submit" variant="accent" size="sm" disabled={!content.trim() || posting}>
            {posting ? <Spinner size={14} /> : 'Post'}
          </Button>
        </div>
      </div>
    </form>
  )
}
