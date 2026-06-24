import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, isValidCollegeEmail } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      return null
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (!error) {
      setProfile(data)
      return data
    }

    return null
  }, [])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return

      setSession(session)

      if (session?.user) {
        await loadProfile(session.user.id)
      }

      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [loadProfile])

  const signUp = useCallback(async (email, password) => {
    if (!isValidCollegeEmail(email)) {
      return { error: { message: 'Use your @vitbhopal.ac.in email to sign up.' } }
    }
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
    return { data, error }
  }, [])

  const signIn = useCallback(async (email, password) => {
    if (!isValidCollegeEmail(email)) {
      return { error: { message: 'Use your @vitbhopal.ac.in email to sign in.' } }
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    return { data, error }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const refreshProfile = useCallback(() => {
    if (session?.user) loadProfile(session.user.id)
  }, [session, loadProfile])

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
    // a profile is "complete" once name + branch + year are set
    isProfileComplete: !!(profile?.name && profile?.branch && profile?.year),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
