/**
 * hooks/useWorkouts.js
 * --------------------
 * Hook para manejar registros de entrenamiento (workout logs).
 * Cada registro = una entrada de ejercicio con peso, reps, series y RPE.
 */
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useWorkouts(exerciseId = null) {
  const { user } = useAuth()
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  const fetchWorkouts = async () => {
    if (!user) return
    setLoading(true)

    // Construir query base — siempre filtramos por el usuario actual (Row Level Security)
    let query = supabase
      .from('workout_logs')
      .select(`
        *,
        exercises ( name, muscle_group )
      `)
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })

    // Si se pasa un exerciseId, filtramos por ese ejercicio
    if (exerciseId) query = query.eq('exercise_id', exerciseId)

    const { data, error } = await query

    if (error) setError(error.message)
    else setWorkouts(data)
    setLoading(false)
  }

  useEffect(() => { fetchWorkouts() }, [user, exerciseId])

  // Guardar un nuevo registro de entrenamiento
  const logWorkout = async ({ exerciseId, weight, reps, sets, rpe, notes }) => {
    const { data, error } = await supabase
      .from('workout_logs')
      .insert({
        user_id:     user.id,
        exercise_id: exerciseId,
        weight_kg:   weight,
        reps,
        sets,
        rpe,
        notes,
        // logged_at tiene DEFAULT now() en Supabase, no hace falta enviarlo
      })
      .select(`*, exercises ( name, muscle_group )`)
      .single()

    if (!error) setWorkouts(prev => [data, ...prev])
    return { data, error }
  }

  const deleteWorkout = async (id) => {
    const { error } = await supabase
      .from('workout_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // seguridad extra: solo borrar los propios

    if (!error) setWorkouts(prev => prev.filter(w => w.id !== id))
    return { error }
  }

  return { workouts, loading, error, refetch: fetchWorkouts, logWorkout, deleteWorkout }
}
