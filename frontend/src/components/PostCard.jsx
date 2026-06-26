import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Avatar } from './ui/Primitives'
import SkillPill from './ui/SkillPill'

const POST_TYPE_TONE = {
  general:      'default',
  question:     'amber',
  opinion:      'teal',
  announcement: 'rust',
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export default function PostCard({ post, onUpdate }) {
  const { user, profile } = useAuth()
  const navigate           = useNavigate()

  const [liked, setLiked]             = useState(post.liked_by_me)
  const [likeCount, setLikeCount]     = useState(post.like_count)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments]       = useState([])
  const [commentText, setCommentText] = useState('')
  const [reported, setReported]       = useState(false)
  const [reportError, setReportError] = useState('')
  const [busy, setBusy]               = useState(false)

  // ── Like / unlike ────────────────────────────────────────
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

  // ── Comments ─────────────────────────────────────────────
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

  // ── Report (with dedup + rate-limit) ─────────────────────
  async function handleReport() {
    if (reported) return
    setReportError('')

    // 1. Check: has this user already reported this post?
    const { data: existingReport } = await supabase
      .from('post_reports')
      .select('id')
      .eq('post_id', post.id)
      .eq('reported_by', user.id)
      .maybeSingle()

    if (existingReport) {
      setReportError('You have already reported this post.')
      return
    }

    // 2. Check: user has not exceeded 3 reports today
    const today = new Date().toISOString().slice(0, 10)   // 'YYYY-MM-DD'
    const { count: todayCount } = await supabase
      .from('post_reports')
      .select('id', { count: 'exact', head: true })
      .eq('reported_by', user.id)
      .eq('report_date', today)

    if (todayCount >= 3) {
      setReportError('You can only report 3 posts per day.')
      return
    }

    // 3. Prompt for optional reason
    const reason = window.prompt('Why are you reporting this post? (optional)') || null
    if (reason === null && !window.confirm('Submit report without a reason?')) return

    const { error } = await supabase.from('post_reports').insert({
      post_id:     post.id,
      reported_by: user.id,
      reason,
      report_date: today,
    })

    if (!error) {
      setReported(true)
      // The DB trigger will automatically set is_hidden = true if reports >= 5
    } else if (error.code === '23505') {
      // Duplicate key — already reported (race condition)
      setReportError('You have already reported this post.')
    } else {
      setReportError('Could not submit report. Try again.')
    }
  }

  // ── Delete (owner only) ───────────────────────────────────
  async function handleDelete() {
    if (!window.confirm('Delete this post?')) return
    await supabase.from('posts').delete().eq('id', post.id)
    onUpdate?.()
  }

  const isOwner = post.user_id === user.id
  const author  = post.users

  return (
    <div className="vc-card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate(isOwner ? '/profile' : `/profile/${post.user_id}`)}
          className="shrink-0"
        >
          <Avatar url={author?.avatar_url} name={author?.name} size={40} />
        </button>

        <div className="flex-1 min-w-0">
          {/* Author row */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => navigate(isOwner ? '/profile' : `/profile/${post.user_id}`)}
              className="font-semibold text-sm text-ink hover:text-amber-deep transition-colors"
            >
              {author?.name}
            </button>
            {author?.branch && (
              <span className="text-xs text-ink-faint font-mono">
                {author.branch}{author.year ? ` · Y${author.year}` : ''}
              </span>
            )}
            <span className="text-xs text-ink-faint ml-auto shrink-0">{timeAgo(post.created_at)}</span>
          </div>

          {/* Post type tag */}
          <div className="mt-1.5">
            <SkillPill size="sm" tone={POST_TYPE_TONE[post.post_type] || 'default'}>
              {post.post_type}
            </SkillPill>
          </div>

          {/* Content */}
          <p className="text-sm text-ink-soft mt-2.5 whitespace-pre-wrap leading-relaxed">
            {post.content}
          </p>

          {/* Action bar */}
          <div className="flex items-center gap-4 mt-3.5 pt-3 border-t border-line-soft">
            <button
              onClick={toggleLike}
              className={`flex items-center gap-1.5 text-sm transition-all duration-150 ${
                liked ? 'text-rust' : 'text-ink-faint hover:text-rust'
              }`}
            >
              <HeartIcon filled={liked} className="w-4 h-4" />
              <span className="font-mono text-xs tabular-nums">{likeCount}</span>
            </button>

            <button
              onClick={toggleComments}
              className="flex items-center gap-1.5 text-sm text-ink-faint hover:text-ink transition-colors"
            >
              <CommentIcon className="w-4 h-4" />
              <span className="font-mono text-xs tabular-nums">{post.comment_count}</span>
            </button>

            <div className="flex items-center gap-3 ml-auto">
              {!reported && !isOwner && (
                <button
                  onClick={handleReport}
                  className="text-xs text-ink-faint hover:text-rust transition-colors"
                >
                  Report
                </button>
              )}
              {reported && <span className="text-xs text-rust">Reported</span>}
              {reportError && (
                <span className="text-xs text-rust">{reportError}</span>
              )}
              {isOwner && (
                <button
                  onClick={handleDelete}
                  className="text-xs text-ink-faint hover:text-rust transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>

          {/* Comments */}
          {showComments && (
            <div className="mt-3 pt-3 border-t border-line-soft space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5">
                  <Avatar url={c.users?.avatar_url} name={c.users?.name} size={26} />
                  <div className="bg-paper-dim rounded-xl px-3 py-2 flex-1">
                    <span className="text-xs font-semibold text-ink">{c.users?.name}</span>
                    <p className="text-sm text-ink-soft mt-0.5 leading-relaxed">{c.content}</p>
                  </div>
                </div>
              ))}
              <form onSubmit={submitComment} className="flex items-center gap-2 pt-1">
                <Avatar url={profile?.avatar_url} name={profile?.name} size={26} />
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="input flex-1 py-1.5 text-sm rounded-xl"
                />
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function HeartIcon({ filled, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <path
        d="M12 21l-1.45-1.32C5.4 15.03 2 11.94 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.44-3.4 6.53-8.55 11.18L12 21z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CommentIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path
        d="M21 11.5a8.5 8.5 0 01-8.5 8.5 8.4 8.4 0 01-4-1L3 20l1.1-3.6A8.4 8.4 0 014 13.5 8.5 8.5 0 1121 11.5z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}