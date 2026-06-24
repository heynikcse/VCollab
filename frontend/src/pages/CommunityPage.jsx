import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { EmptyState, Spinner, Avatar } from '../components/ui/Primitives'
import SkillPill from '../components/ui/SkillPill'
import Button from '../components/ui/Button'
import CommunityPostComposer from '../components/CommunityPostComposer'

const CATEGORY_COLORS = {
  tech: 'violet',
  cultural: 'amber',
  sports: 'teal',
  academic: 'rust',
}

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
        onJoinToggle={() => toggleJoin(activeCommunity.id)}
      />
    )
  }

  const joined = communities.filter((c) => myCommunityIds.has(c.id))
  const discover = communities.filter((c) => !myCommunityIds.has(c.id))

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-xl text-ink">Communities</h1>
          <p className="text-sm text-ink-faint mt-0.5">Find your people at VIT Bhopal</p>
        </div>
        {isAdmin && (
          <Button variant="accent" size="sm" onClick={() => setShowCreate(true)}>
            + New community
          </Button>
        )}
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Spinner size={28} color="text-violet" /></div>
      ) : communities.length === 0 ? (
        <EmptyState
          title="No communities yet"
          description="Admins can create communities for clubs, branches, and interest groups."
        />
      ) : (
        <div className="space-y-8">
          {joined.length > 0 && (
            <section>
              <p className="section-label mb-3">Your communities</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {joined.map((c) => (
                  <CommunityCard
                    key={c.id}
                    community={c}
                    isMember={true}
                    onOpen={() => setActiveCommunity(c)}
                    onToggle={() => toggleJoin(c.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {discover.length > 0 && (
            <section>
              <p className="section-label mb-3">Discover</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {discover.map((c) => (
                  <CommunityCard
                    key={c.id}
                    community={c}
                    isMember={false}
                    onOpen={() => setActiveCommunity(c)}
                    onToggle={() => toggleJoin(c.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {showCreate && (
        <CreateCommunityModal onClose={() => setShowCreate(false)} onCreated={load} />
      )}
    </div>
  )
}

function CommunityCard({ community: c, isMember, onOpen, onToggle }) {
  const catColor = CATEGORY_COLORS[c.category?.toLowerCase()] || 'default'
  return (
    <div className="vc-card overflow-hidden flex flex-col">
      <div className="h-20 bg-gradient-to-br from-paper-dim to-line relative overflow-hidden">
        {c.banner_url && (
          <img src={c.banner_url} alt="" className="w-full h-full object-cover" />
        )}
        {isMember && (
          <span className="absolute top-2 right-2 bg-teal text-white text-[10px] font-mono px-2 py-0.5 rounded-full">
            Joined
          </span>
        )}
      </div>
      <div className="p-3.5 flex-1 flex flex-col">
        <button onClick={onOpen} className="text-left mb-auto">
          <h3 className="font-display font-bold text-sm text-ink leading-tight">{c.name}</h3>
          {c.category && (
            <div className="mt-1.5">
              <SkillPill size="sm" tone={catColor}>{c.category}</SkillPill>
            </div>
          )}
          {c.description && (
            <p className="text-xs text-ink-faint mt-2 leading-relaxed line-clamp-2">{c.description}</p>
          )}
        </button>
        <Button
          variant={isMember ? 'secondary' : 'accent'}
          size="sm"
          className="w-full mt-3"
          onClick={onToggle}
        >
          {isMember ? 'Leave' : 'Join community'}
        </Button>
      </div>
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

  const catColor = CATEGORY_COLORS[community.category?.toLowerCase()] || 'default'

  return (
    <div className="max-w-4xl">
      <button
        onClick={onBack}
        className="text-sm text-ink-faint hover:text-ink mb-5 flex items-center gap-1.5 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
          <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to communities
      </button>

      <div className="vc-card p-5 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="font-display font-bold text-xl text-ink">{community.name}</h1>
            {community.category && (
              <div className="mt-1.5">
                <SkillPill size="sm" tone={catColor}>{community.category}</SkillPill>
              </div>
            )}
            {community.description && (
              <p className="text-sm text-ink-soft mt-2 leading-relaxed">{community.description}</p>
            )}
          </div>
          <Button variant={isMember ? 'secondary' : 'accent'} size="sm" onClick={onJoinToggle}>
            {isMember ? 'Leave' : 'Join'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-5">
        <div className="space-y-3">
          {isMember && <CommunityPostComposer communityId={community.id} onPosted={load} />}

          {loading ? (
            <div className="py-12 flex justify-center"><Spinner size={24} color="text-violet" /></div>
          ) : !isMember ? (
            <EmptyState title="Join to see posts" description="Community posts are visible to members only." />
          ) : posts.length === 0 ? (
            <EmptyState title="No posts yet" description="Be the first to post here." />
          ) : (
            posts.map((p) => (
              <div key={p.id} className="vc-card p-4">
                {p.is_pinned && (
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <SkillPill size="sm" tone="amber">📌 Pinned</SkillPill>
                  </div>
                )}
                <div className="flex items-center gap-2.5 mb-2">
                  <Avatar url={p.users?.avatar_url} name={p.users?.name} size={28} />
                  <span className="text-sm font-semibold text-ink">{p.users?.name}</span>
                </div>
                <p className="text-sm text-ink-soft whitespace-pre-wrap leading-relaxed">{p.content}</p>
                {isAdmin && (
                  <button
                    onClick={() => togglePin(p.id, p.is_pinned)}
                    className="text-xs text-ink-faint hover:text-ink mt-3 transition-colors"
                  >
                    {p.is_pinned ? 'Unpin' : 'Pin to top'}
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <div className="vc-card p-4 h-fit">
          <p className="section-label mb-3">Members</p>
          <div className="space-y-2">
            {members.map((m, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <Avatar url={m.users?.avatar_url} name={m.users?.name} size={28} />
                <span className="text-sm text-ink truncate">{m.users?.name}</span>
              </div>
            ))}
          </div>
        </div>
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
    <div className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-paper-card rounded-2xl max-w-md w-full p-6 shadow-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl font-bold mb-1">New community</h2>
        <p className="text-sm text-ink-faint mb-5">Create a space for a club or interest group</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Community name" className="input" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this community is about" rows={3} className="input resize-none" />
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category (e.g. Tech Club)" className="input" />
          {error && <p className="text-sm text-rust bg-rust-soft border border-rust/20 px-3 py-2 rounded-xl">{error}</p>}
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
