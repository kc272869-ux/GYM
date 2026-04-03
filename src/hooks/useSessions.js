/**
 * hooks/useSessions.js
 * --------------------
 * Hook para obtener sesiones de entrenamiento del usuario.
 * Cada sesión trae sus workout_logs anidados con el nombre del ejercicio.
 */
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useSessions() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading]   = useState(true)

  const fetchSessions = async () => {
    if (!user) return
    setLoading(true)

    const { data, error } = await supabase
      .from('sessions')
      .select(`
        id,
        name,
        logged_at,
        workout_logs (
          id,
          exercise_id,
          weight_kg,
          reps,
          sets,
          rpe,
          notes,
          exercises ( name, muscle_group )
        )
      `)
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })

    if (error) {
      // Si la tabla sessions aún no existe en Supabase, no crashear — solo mostrar vacío
      console.warn('useSessions error (¿ejecutaste supabase_sessions.sql?):', error.message)
      setSessions([])
    } else {
      setSessions(data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { fetchSessions() }, [user])

  // Crear sesión + guardar todos sus logs en una sola llamada al hook
  const saveSession = async ({ name, logs }) => {
    // 1. Crear la sesión
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({ user_id: user.id, name })
      .select()
      .single()

    if (sessionError) return { error: sessionError }

    // 2. Insertar todos los workout_logs vinculados a esta sesión
    const rows = logs.map(l => ({
      user_id:     user.id,
      session_id:  session.id,
      exercise_id: l.exerciseId,
      weight_kg:   l.weight,
      reps:        l.reps,
      sets:        1,
      rpe:         l.rpe,
      notes:       l.notes ?? null,
    }))

    const { error: logsError } = await supabase
      .from('workout_logs')
      .insert(rows)

    if (logsError) return { error: logsError }

    // 3. Recargar para tener el join completo
    await fetchSessions()
    return { error: null }
  }

  const deleteSession = async (id) => {
    // workout_logs se borran en cascada por ON DELETE SET NULL → borramos logs manualmente
    await supabase.from('workout_logs').delete().eq('session_id', id)
    const { error } = await supabase.from('sessions').delete().eq('id', id).eq('user_id', user.id)
    if (!error) setSessions(prev => prev.filter(s => s.id !== id))
    return { error }
  }

  return { sessions, loading, saveSession, deleteSession, refetch: fetchSessions }
}
