import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // try-catch para Safari iOS que puede fallar al leer localStorage
    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        setUser(data?.session?.user ?? null)
      } catch (e) {
        console.warn('getSession error:', e)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    init()

    let subscription
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
      })
      subscription = data?.subscription
    } catch (e) {
      console.warn('onAuthStateChange error:', e)
    }

    return () => { try { subscription?.unsubscribe() } catch (_) {} }
  }, [])

  const signUp  = (email, password) => supabase.auth.signUp({ email, password })
  const signIn  = (email, password) => supabase.auth.signInWithPassword({ email, password })
  const signOut = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
