import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Card, EmptyState, Spinner, Avatar } from '../components/ui/Primitives'
import SkillPill from '../components/ui/SkillPill'
import Button from '../components/ui/Button'
import PostComposerInline from '../components/CommunityPostComposer'

export default function CommunityPage() {
  const { user, profile } = useAuth()
  const [communities, setCommunities] = useState([])
  const [myCommunityIds, setMyCommunityIds] = useState(new Set())
  const [activeCommunity, setActiveCommunity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const isAdmin = profile?.role === 'admin'

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('communities')
      .select('*')
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
    setCommunities(data || [])

    const { data: memberships } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', user.id)
    setMyCommunityIds(new Set((memberships || []).map((m) => m.community_id)))
    setLoading(false)
  }, [user.id])

  useEffect(() => { load() }, [load])

  async function toggleJoin(communityId) {
    if (myCommunityIds.has(communityId)) {
      await supabase.from('community_members').delete().eq('community_id', communityId).eq('user_id', user.id)
    } else {
      await supabase.from('community_members').insert({ community_id: communityId, user_id: user.id })
    }
    load()
  }

  if (activeCommunity) {
    return (
      <CommunityDetail
        community={activeCommunity}
        isMember={myCommunityIds.has(activeCommunity.id)}
        isAdmin={isAdmin}
        onBack={() => setActiveCommunity(null)}
        onJoinToggle={() => { toggleJoin(activeCommunity.id) }}
      />
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <header className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 text-xs mb-3">Communities</div>
          <h1 className="font-display text-4xl font-bold">Join interest <span className="text-gradient">circles</span></h1>
          <p className="mt-2 text-muted-foreground max-w-xl">Clubs, branches and groups — find and join communities that match your interests.</p>
        </div>
        <div>
          {isAdmin && (
            <button className="gradient-neon text-background rounded-xl px-4 py-2.5 text-sm font-semibold" onClick={() => setShowCreate(true)}>+ New community</button>
          )}
        </div>
      </header>

      {loading ? (
        <div className="py-16 flex justify-center"><Spinner size={28} /></div>
      ) : communities.length === 0 ? (
        <EmptyState title="No communities yet" description="Admins create communities for clubs, branches, and interest circles." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {communities.map((c) => (
            <Card key={c.id} className="overflow-hidden">
              <div className="h-24 bg-paper-dim relative">
                {c.banner_url && <img src={c.banner_url} alt="" className="w-full h-full object-cover" />}
                {myCommunityIds.has(c.id) && (
                  <span className="absolute top-2 right-2 bg-teal text-white text-xs font-mono px-2 py-0.5 rounded-full">
                    Joined
                  </span>
                )}
              </div>
              <div className="p-3.5">
                <button onClick={() => setActiveCommunity(c)} className="text-left">
                  <h3 className="font-display font-semibold text-sm text-ink">{c.name}</h3>
                </button>
                {c.category && <SkillPill size="sm" className="mt-1.5">{c.category}</SkillPill>}
                <p className="text-xs text-ink-faint mt-2 line-clamp-2">{c.description}</p>
                <Button
                  variant={myCommunityIds.has(c.id) ? 'secondary' : 'accent'}
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => toggleJoin(c.id)}
                >
                  {myCommunityIds.has(c.id) ? 'Leave' : 'Join'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateCommunityModal onClose={() => setShowCreate(false)} onCreated={load} />
      )}
    </div>
  )
}

function CommunityDetail({ community, isMember, isAdmin, onBack, onJoinToggle }) {
  const [posts, setPosts] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data: postData } = await supabase
      .from('community_posts')
      .select('*, users(name, avatar_url)')
      .eq('community_id', community.id)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
    setPosts(postData || [])

    const { data: memberData } = await supabase
      .from('community_members')
      .select('users(name, avatar_url)')
      .eq('community_id', community.id)
      .limit(20)
    setMembers(memberData || [])
    setLoading(false)
  }, [community.id])

  useEffect(() => { load() }, [load])

  async function togglePin(postId, current) {
    await supabase.from('community_posts').update({ is_pinned: !current }).eq('id', postId)
    load()
  }

  return (
    <div className="max-w-4xl">
      <button onClick={onBack} className="text-sm text-ink-faint hover:text-ink mb-4 flex items-center gap-1">
        ← Back to communities
      </button>

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-xl font-semibold">{community.name}</h1>
          <p className="text-sm text-ink-faint mt-0.5">{community.description}</p>
        </div>
        <Button variant={isMember ? 'secondary' : 'accent'} size="sm" onClick={onJoinToggle}>
          {isMember ? 'Leave' : 'Join'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6">
        <div className="space-y-3">
          {isMember && <PostComposerInline communityId={community.id} onPosted={load} />}

          {loading ? (
            <div className="py-12 flex justify-center"><Spinner size={24} /></div>
          ) : !isMember ? (
            <EmptyState title="Join to see posts" description="Community posts are only visible to members." />
          ) : posts.length === 0 ? (
            <EmptyState title="No posts yet" description="Be the first to post here." />
          ) : (
            posts.map((p) => (
              <Card key={p.id} className="p-4">
                {p.is_pinned && <SkillPill size="sm" tone="amber" className="mb-2">Pinned</SkillPill>}
                <div className="flex items-center gap-2.5 mb-2">
                  <Avatar url={p.users?.avatar_url} name={p.users?.name} size={28} />
                  <span className="text-sm font-medium text-ink">{p.users?.name}</span>
                </div>
                <p className="text-sm text-ink-soft whitespace-pre-wrap">{p.content}</p>
                {isAdmin && (
                  <button
                    onClick={() => togglePin(p.id, p.is_pinned)}
                    className="text-xs text-ink-faint hover:text-ink mt-3"
                  >
                    {p.is_pinned ? 'Unpin' : 'Pin to top'}
                  </button>
                )}
              </Card>
            ))
          )}
        </div>

        <Card className="p-4 h-fit">
          <h3 className="text-xs font-mono text-ink-faint uppercase tracking-wide mb-3">Members</h3>
          <div className="space-y-2.5">
            {members.map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <Avatar url={m.users?.avatar_url} name={m.users?.name} size={26} />
                <span className="text-sm text-ink truncate">{m.users?.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function CreateCommunityModal({ onClose, onCreated }) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const { error } = await supabase.from('communities').insert({
      name: name.trim(),
      description: description.trim() || null,
      category: category.trim() || null,
      created_by: user.id,
    })
    setSaving(false)
    if (error) { setError(error.message); return }
    onCreated()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl font-semibold mb-5">New community</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Community name" className="input" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={3} className="input resize-none" />
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category (e.g. Tech Club)" className="input" />
          {error && <p className="text-sm text-rust">{error}</p>}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="accent" className="flex-1" disabled={!name.trim() || saving}>
              {saving ? <Spinner size={16} /> : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
