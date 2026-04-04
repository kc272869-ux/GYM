/**
 * hooks/useProfile.js
 * --------------------
 * CRUD del perfil de usuario (peso, altura, edad, sexo).
 * Se usa para calcular calorías y personalizar recomendaciones.
 */
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!user) return
    const fetch = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
      setProfile(data ?? null)
      setLoading(false)
    }
    fetch()
  }, [user])

  // Guardar o actualizar perfil (upsert = insert si no existe, update si existe)
  const saveProfile = async (fields) => {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...fields, updated_at: new Date().toISOString() })
      .select()
      .single()
    if (!error) setProfile(data)
    return { error }
  }

  return { profile, loading, saveProfile }
}
