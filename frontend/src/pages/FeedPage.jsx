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
  const [connectedIds, setConnectedIds] = useState(null)

  const loadPosts = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from('posts')
      .select('*, users(name, avatar_url, branch, year)')
      .eq('is_hidden', false)

    // local copy so we can use it in this same call without waiting on state
    let ids = connectedIds

    if (tab === 'trending') {
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
      query = query.gte('created_at', since).order('like_count', { ascending: false })
    } else if (tab === 'network') {
      if (followingIds === null) {
        const netIds = await loadNetworkIds()
        setFollowingIds(netIds)
        if (netIds.length === 0) { setPosts([]); setLoading(false); return }
        query = query.in('user_id', netIds)
      } else if (followingIds.length === 0) {
        setPosts([])
        setLoading(false)
        return
      } else {
        query = query.in('user_id', followingIds)
      }
      query = query.order('created_at', { ascending: false })
    } else {
      // latest — fetch accepted connections once so we can bubble their posts up
      if (ids === null) {
        ids = await loadConnectedIds()
        setConnectedIds(ids)
      }
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

    let mapped = (data || []).map((p) => ({ ...p, liked_by_me: likedSet.has(p.id) }))

    // Latest tab: connected users' posts first (each group still newest-first)
    if (tab === 'latest' && ids?.length) {
      const connectedSet = new Set(ids)
      mapped = [...mapped].sort((a, b) => {
        const aFirst = connectedSet.has(a.user_id) ? 0 : 1
        const bFirst = connectedSet.has(b.user_id) ? 0 : 1
        if (aFirst !== bFirst) return aFirst - bFirst
        return new Date(b.created_at) - new Date(a.created_at)
      })
    }

    setPosts(mapped)
    setLoading(false)
  }, [tab, user.id, followingIds, connectedIds])

  // Shared project OR shared community = "network"
  async function loadNetworkIds() {
    const { data: myProjects } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', user.id)
      .eq('status', 'accepted')
    const projectIds = (myProjects || []).map((p) => p.project_id)

    const { data: myCommunities } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', user.id)
    const communityIds = (myCommunities || []).map((c) => c.community_id)

    const ids = new Set()

    if (projectIds.length) {
      const { data: teammates } = await supabase
        .from('project_members')
        .select('user_id')
        .in('project_id', projectIds)
        .eq('status', 'accepted')
      ;(teammates || []).forEach((t) => ids.add(t.user_id))
    }

    if (communityIds.length) {
      const { data: communityMates } = await supabase
        .from('community_members')
        .select('user_id')
        .in('community_id', communityIds)
      ;(communityMates || []).forEach((c) => ids.add(c.user_id))
    }

    ids.delete(user.id)
    return [...ids]
  }

  async function loadConnectedIds() {
    const { data } = await supabase
      .from('connections')
      .select('requester_id, recipient_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)

    return [...new Set(
      (data || []).map((c) => (c.requester_id === user.id ? c.recipient_id : c.requester_id))
    )]
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
                ? 'Join a project or community on Connect to see posts from your network.'
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