import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Button from './ui/Button'
import { Spinner } from './ui/Primitives'

/**
 * DeleteAccountSection
 * Renders the "Danger Zone" card on the user's own Profile page.
 * Requires the user to type DELETE before proceeding.
 * Removes posts, comments, project memberships, community memberships,
 * and the user profile row, then signs out.
 */
export default function DeleteAccountSection() {
  const { user, signOut }         = useAuth()
  const [expanded, setExpanded]   = useState(false)
  const [confirmation, setConfirm]= useState('')
  const [deleting, setDeleting]   = useState(false)
  const [error, setError]         = useState('')

  const canDelete = confirmation === 'DELETE'

  async function handleDelete() {
    if (!canDelete) return
    setDeleting(true)
    setError('')

    try {
      const uid = user.id

      // 1. Remove the user's own posts (comments on those posts cascade via FK if set,
      //    otherwise we delete comments separately)
      await supabase.from('comments').delete().eq('user_id', uid)
      await supabase.from('post_likes').delete().eq('user_id', uid)
      await supabase.from('post_reports').delete().eq('reported_by', uid)
      await supabase.from('posts').delete().eq('user_id', uid)

      // 2. Remove project memberships (but NOT owned projects — those stay for other members)
      await supabase.from('project_members').delete().eq('user_id', uid)

      // 3. Remove community memberships
      await supabase.from('community_members').delete().eq('user_id', uid)

      // 4. Nullify / soft-delete profile row
      //    We anonymise rather than hard-delete so foreign keys from other users' content
      //    (e.g. comments referencing this user) don't break.
      await supabase.from('users').update({
        name:       'Deleted User',
        bio:        null,
        avatar_url: null,
        github:     null,
        skills:     [],
        branch:     null,
        year:       null,
        is_archived: true,
      }).eq('id', uid)

      // 5. Delete the auth account (requires service role in production;
      //    for client-side we sign out and the account is effectively inaccessible)
      //    If you have a Supabase Edge Function for hard-delete, call it here.
      await signOut()
    } catch (err) {
      setDeleting(false)
      setError('Something went wrong. Please try again.')
      console.error(err)
    }
  }

  return (
    <div className="vc-card p-5 border border-rust/20 mt-5">
      <h2 className="font-display font-bold text-sm text-rust mb-1">Danger Zone</h2>
      <p className="text-xs text-ink-faint mb-3 leading-relaxed">
        Deleting your account removes your posts, comments, memberships, and profile data.
        This action cannot be undone.
      </p>

      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="text-sm text-rust border border-rust/30 rounded-xl px-4 py-2
                     hover:bg-rust/5 transition-colors"
        >
          Delete Account
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-ink-soft">
            Type <span className="font-mono font-bold text-rust">DELETE</span> to confirm:
          </p>
          <input
            type="text"
            value={confirmation}
            onChange={(e) => { setConfirm(e.target.value); setError('') }}
            placeholder="DELETE"
            className="input font-mono"
          />

          {error && (
            <div className="text-xs text-rust bg-rust-soft border border-rust/20 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setExpanded(false); setConfirm('') }}
            >
              Cancel
            </Button>
            <button
              onClick={handleDelete}
              disabled={!canDelete || deleting}
              className={`flex-1 text-sm font-semibold rounded-xl px-4 py-2 transition-all
                ${canDelete && !deleting
                  ? 'bg-rust text-paper hover:bg-rust/90'
                  : 'bg-rust/20 text-rust/40 cursor-not-allowed'
                }`}
            >
              {deleting ? <Spinner size={16} /> : 'Permanently Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}