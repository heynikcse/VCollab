/**
 * AuthContext
 *
 * Preserves the original isProfileComplete logic that App.jsx depends on,
 * and adds last_seen tracking on login / session refresh.
 */
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

// A profile is "complete" when the user has filled in at least their name.
// Adjust this check to match whatever your ProfileSetupPage collects.
function checkProfileComplete(profile) {
  return !!(profile && profile.name && profile.name.trim().length > 0)
}

async function touchLastSeen(uid) {
  await supabase
    .from('users')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', uid)
}

export function AuthProvider({ children }) {
  const [user, setUser]                     = useState(null)
  const [profile, setProfile]               = useState(null)
  const [isProfileComplete, setIsComplete]  = useState(false)
  const [loading, setLoading]               = useState(true)

  async function fetchProfile(uid) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', uid)
      .single()
    setProfile(data || null)
    setIsComplete(checkProfileComplete(data))
    return data
  }

  useEffect(() => {
    // Bootstrap: check for an existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        await fetchProfile(session.user.id)
        touchLastSeen(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth state changes (login, logout, token refresh, password recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
          if (event === 'SIGNED_IN') {
            touchLastSeen(session.user.id)
          }
        } else {
          setUser(null)
          setProfile(null)
          setIsComplete(false)
        }
      },
    )

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email, password) {
    const result = await supabase.auth.signInWithPassword({ email, password })
    if (!result.error && result.data?.user) {
      touchLastSeen(result.data.user.id)
    }
    return result
  }

  async function signUp(email, password) {
    return supabase.auth.signUp({ email, password })
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const value = {
    user,
    profile,
    isProfileComplete,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile: () => user && fetchProfile(user.id),
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}