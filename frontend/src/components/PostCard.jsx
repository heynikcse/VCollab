import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Avatar, Card } from './ui/Primitives'
import SkillPill from './ui/SkillPill'

const POST_TYPE_TONE = {
  general: 'default',
  question: 'amber',
  opinion: 'teal',
  announcement: 'rust',
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function PostCard({ post, onUpdate }) {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [liked, setLiked] = useState(post.liked_by_me)
  const [likeCount, setLikeCount] = useState(post.like_count)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [reported, setReported] = useState(false)
  const [busy, setBusy] = useState(false)

  async function toggleLike() {
    if (busy) return
    setBusy(true)
    if (liked) {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id)
      setLiked(false)
      setLikeCount((c) => c - 1)
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id })
      setLiked(true)
      setLikeCount((c) => c + 1)
    }
    setBusy(false)
  }

  async function loadComments() {
    const { data } = await supabase
      .from('comments')
      .select('id, content, created_at, users(name, avatar_url)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })
    setComments(data || [])
  }

  async function toggleComments() {
    if (!showComments) await loadComments()
    setShowComments((s) => !s)
  }

  async function submitComment(e) {
    e.preventDefault()
    if (!commentText.trim()) return
    const { error } = await supabase
      .from('comments')
      .insert({ post_id: post.id, user_id: user.id, content: commentText.trim() })
    if (!error) {
      setCommentText('')
      loadComments()
      onUpdate?.()
    }
  }

  async function handleReport() {
    if (reported) return
    const reason = window.prompt('Why are you reporting this post? (optional)') || null
    const { error } = await supabase
      .from('post_reports')
      .insert({ post_id: post.id, reported_by: user.id, reason })
    if (!error) setReported(true)
  }

  async function handleDelete() {
    if (!window.confirm('Delete this post?')) return
    await supabase.from('posts').delete().eq('id', post.id)
    onUpdate?.()
  }

  const isOwner = post.user_id === user.id
  const author = post.users

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <button onClick={() => navigate(isOwner ? '/profile' : '/feed')}>
          <Avatar url={author?.avatar_url} name={author?.name} size={40} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-ink">{author?.name}</span>
            {author?.branch && (
              <span className="text-xs text-ink-faint font-mono">
                {author.branch}{author.year ? ` · ${author.year}YR` : ''}
              </span>
            )}
            <span className="text-xs text-ink-faint">· {timeAgo(post.created_at)}</span>
          </div>

          <div className="mt-1.5">
            <SkillPill size="sm" tone={POST_TYPE_TONE[post.post_type] || 'default'}>
              {post.post_type}
            </SkillPill>
          </div>

          <p className="text-sm text-ink mt-2.5 whitespace-pre-wrap leading-relaxed">
            {post.content}
          </p>

          {post.image_url && (
            <img src={post.image_url} alt="" className="mt-3 rounded-lg border border-line w-full object-cover max-h-96" />
          )}

          <div className="flex items-center gap-5 mt-3.5 pt-3 border-t border-line">
            <button
              onClick={toggleLike}
              className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-rust' : 'text-ink-faint hover:text-ink'}`}
            >
              <HeartIcon filled={liked} className="w-4 h-4" />
              <span className="font-mono text-xs">{likeCount}</span>
            </button>
            <button
              onClick={toggleComments}
              className="flex items-center gap-1.5 text-sm text-ink-faint hover:text-ink transition-colors"
            >
              <CommentIcon className="w-4 h-4" />
              <span className="font-mono text-xs">{post.comment_count}</span>
            </button>
            <button
              onClick={handleReport}
              disabled={reported}
              className={`flex items-center gap-1.5 text-sm ml-auto ${reported ? 'text-rust' : 'text-ink-faint hover:text-ink'}`}
            >
              <FlagIcon className="w-4 h-4" />
              <span className="text-xs">{reported ? 'Reported' : 'Report'}</span>
            </button>
            {isOwner && (
              <button onClick={handleDelete} className="text-xs text-ink-faint hover:text-rust">
                Delete
              </button>
            )}
          </div>

          {showComments && (
            <div className="mt-3 pt-3 border-t border-line space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5">
                  <Avatar url={c.users?.avatar_url} name={c.users?.name} size={28} />
                  <div className="bg-paper-dim rounded-lg px-3 py-2 flex-1">
                    <span className="text-xs font-medium text-ink">{c.users?.name}</span>
                    <p className="text-sm text-ink-soft mt-0.5">{c.content}</p>
                  </div>
                </div>
              ))}
              <form onSubmit={submitComment} className="flex items-center gap-2 pt-1">
                <Avatar url={profile?.avatar_url} name={profile?.name} size={28} />
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="input flex-1 py-1.5 text-sm"
                />
              </form>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

function HeartIcon({ filled, ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 21s-7.5-4.6-10-9.3C.5 8 2 4.5 5.5 4 8 3.6 10 5 12 7.5 14 5 16 3.6 18.5 4 22 4.5 23.5 8 22 11.7 19.5 16.4 12 21 12 21z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function CommentIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M21 11.5a8.5 8.5 0 01-8.5 8.5 8.4 8.4 0 01-4-1L3 20l1.1-3.6A8.4 8.4 0 014 13.5 8.5 8.5 0 1121 11.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function FlagIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M4 21V4M4 4h13l-2.5 4L17 12H4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
