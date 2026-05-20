import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
    setLoading(false)
  }

  async function signInWithGoogle(redirectTo?: string) {
    const target = redirectTo ?? window.location.origin
    // DEBUG — open browser console to read these before the redirect
    console.group('[Auth Debug]')
    console.log('Supabase URL :', import.meta.env.VITE_SUPABASE_URL)
    console.log('redirectTo   :', target)
    console.log('Expected callback registered in Google Cloud Console:',
      `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/callback`)
    console.groupEnd()
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: target },
    })
  }

  async function signInWithEmail(email: string, redirectTo?: string) {
    return supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo ?? window.location.origin },
    })
  }

  async function signOut() {
    return supabase.auth.signOut()
  }

  return { user, profile, loading, signInWithGoogle, signInWithEmail, signOut }
}
