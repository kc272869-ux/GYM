/**
 * context/AuthContext.jsx
 * -----------------------
 * Context de React para manejar el estado de autenticación globalmente.
 *
 * ¿Por qué un Context?
 * Porque cualquier componente (Navbar, Dashboard, etc.) necesita saber
 * si hay un usuario logueado, sin tener que pasar props por toda la jerarquía.
 *
 * Patrón: Provider wrappea toda la app en App.jsx,
 * y cualquier componente usa el hook useAuth() para acceder al estado.
 */
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// 1. Crear el Context vacío
const AuthContext = createContext({})

// 2. Provider: componente que envuelve la app y provee el estado
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)   // usuario actual (null = no logueado)
  const [loading, setLoading] = useState(true)   // true mientras Supabase verifica la sesión

  useEffect(() => {
    // Obtener la sesión actual al montar el componente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Suscribirse a cambios de auth (login, logout, refresh de token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    // Limpiar la suscripción al desmontar
    return () => subscription.unsubscribe()
  }, [])

  // Funciones de auth que los componentes pueden llamar
  const signUp = (email, password) =>
    supabase.auth.signUp({ email, password })

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password })

  const signOut = () =>
    supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// 3. Hook personalizado para consumir el context fácilmente
// Uso: const { user, signIn, signOut } = useAuth()
export const useAuth = () => useContext(AuthContext)
