/**
 * hooks/useRoutines.js
 * --------------------
 * Hook para manejar rutinas de entrenamiento.
 * Una rutina = grupo de ejercicios (ej: "Día A - Pecho y Tríceps")
 */
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useRoutines() {
  const { user } = useAuth()
  const [routines, setRoutines] = useState([])
  const [loading, setLoading]   = useState(true)

  const fetchRoutines = async () => {
    if (!user) return
    setLoading(true)

    const { data, error } = await supabase
      .from('routines')
      .select(`
        *,
        routine_exercises (
          id,
          order_index,
          exercises ( id, name, muscle_group )
        )
      `)
      .eq('user_id', user.id)
      .order('name')

    if (!error) setRoutines(data)
    setLoading(false)
  }

  useEffect(() => { fetchRoutines() }, [user])

  const createRoutine = async (name, description) => {
    const { data, error } = await supabase
      .from('routines')
      .insert({ user_id: user.id, name, description })
      .select()
      .single()

    if (!error) {
      setRoutines(prev => [...prev, { ...data, routine_exercises: [] }])
    }
    return { data, error }
  }

  const addExerciseToRoutine = async (routineId, exerciseId, orderIndex) => {
    const { error } = await supabase
      .from('routine_exercises')
      .insert({ routine_id: routineId, exercise_id: exerciseId, order_index: orderIndex })

    if (!error) fetchRoutines() // recargar para obtener el join completo
    return { error }
  }

  const deleteRoutine = async (id) => {
    const { error } = await supabase
      .from('routines')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (!error) setRoutines(prev => prev.filter(r => r.id !== id))
    return { error }
  }

  return { routines, loading, createRoutine, addExerciseToRoutine, deleteRoutine, refetch: fetchRoutines }
}
