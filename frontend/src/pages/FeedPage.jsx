import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import PostComposer from '../components/PostComposer'
import PostCard from '../components/PostCard'
import Sidebar from '../components/Sidebar'
import { EmptyState, Spinner } from '../components/ui/Primitives'

const TABS = [
  { key: 'latest', label: 'Latest' },
  { key: 'trending', label: 'Trending' },
  { key: 'network', label: 'Network' },
]

export default function FeedPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('latest')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [followingIds, setFollowingIds] = useState(null)

  const loadPosts = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from('posts')
      .select('*, users(name, avatar_url, branch, year)')
      .eq('is_hidden', false)

    if (tab === 'trending') {
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
      query = query.gte('created_at', since).order('like_count', { ascending: false })
    } else if (tab === 'network') {
      if (followingIds === null) {
        const ids = await loadNetworkIds()
        setFollowingIds(ids)
        if (ids.length === 0) { setPosts([]); setLoading(false); return }
        query = query.in('user_id', ids)
      } else if (followingIds.length === 0) {
        setPosts([])
        setLoading(false)
        return
      } else {
        query = query.in('user_id', followingIds)
      }
      query = query.order('created_at', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data, error } = await query.limit(30)
    if (error) { console.error(error); setLoading(false); return }

    const postIds = (data || []).map((p) => p.id)
    let likedSet = new Set()
    if (postIds.length) {
      const { data: likes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds)
      likedSet = new Set((likes || []).map((l) => l.post_id))
    }

    setPosts((data || []).map((p) => ({ ...p, liked_by_me: likedSet.has(p.id) })))
    setLoading(false)
  }, [tab, user.id, followingIds])

  async function loadNetworkIds() {
    const { data: myProjects } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', user.id)
      .eq('status', 'accepted')
    const projectIds = (myProjects || []).map((p) => p.project_id)
    if (!projectIds.length) return []

    const { data: teammates } = await supabase
      .from('project_members')
      .select('user_id')
      .in('project_id', projectIds)
      .eq('status', 'accepted')
    return [...new Set((teammates || []).map((t) => t.user_id))].filter((id) => id !== user.id)
  }

  useEffect(() => {
    loadPosts()
  }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_288px] gap-5">
      <div className="space-y-4 min-w-0">
        <PostComposer onPosted={loadPosts} />

        {/* Tab bar */}
        <div className="flex items-center gap-1 border-b border-line">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); if (t.key === 'network') setFollowingIds(null) }}
              className={`tab-btn ${tab === t.key ? 'tab-btn-active' : 'tab-btn-inactive'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <Spinner size={28} color="text-violet" />
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            title={tab === 'network' ? 'No teammate posts yet' : 'Nothing here yet'}
            description={
              tab === 'network'
                ? 'Join a project on Connect to see posts from teammates.'
                : 'Be the first to share something with VIT Bhopal.'
            }
          />
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onUpdate={loadPosts} />
            ))}
          </div>
        )}
      </div>

      <div className="hidden lg:block">
        <Sidebar />
      </div>
    </div>
  )
}