import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { uploadImage, validateImageFile } from '../lib/storage'
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
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [error, setError] = useState('')
  const [posting, setPosting] = useState(false)
  const fileRef = useRef(null)

  function handleImageSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateImageFile(file)
    if (err) { setError(err); return }
    setError('')
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function clearImage() {
    setImageFile(null)
    setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!content.trim() || posting) return
    setPosting(true)
    setError('')

    try {
      let image_url = null
      if (imageFile) {
        image_url = await uploadImage('post-images', imageFile, user.id)
      }

      const { error: insertError } = await supabase.from('posts').insert({
        user_id: user.id,
        content: content.trim(),
        post_type: postType,
        image_url,
      })
      if (insertError) throw insertError

      setContent('')
      setPostType('general')
      clearImage()
      onPosted?.()
    } catch (err) {
      setError(err.message || 'Could not post. Try again.')
    } finally {
      setPosting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-line rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Avatar url={profile?.avatar_url} name={profile?.name} size={40} />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 500))}
            placeholder="Share an update, ask a question, start a discussion..."
            rows={2}
            className="w-full text-sm resize-none focus:outline-none placeholder:text-ink-faint"
          />

          {imagePreview && (
            <div className="relative inline-block mt-2">
              <img src={imagePreview} alt="" className="rounded-lg border border-line max-h-48" />
              <button
                type="button"
                onClick={clearImage}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-ink text-paper text-xs flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          )}

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
              <label className="cursor-pointer p-1.5 text-ink-faint hover:text-ink">
                <ImageIcon className="w-4 h-4" />
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              </label>
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

function ImageIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  )
}
