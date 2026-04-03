/**
 * hooks/useExercises.js
 * ---------------------
 * Hook personalizado para manejar ejercicios.
 * Separa la lógica de datos de la UI — el componente no sabe cómo
 * se obtienen los datos, solo los consume.
 */
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useExercises() {
  const { user } = useAuth()
  const [exercises, setExercises] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  // Cargar ejercicios del usuario (propios + globales sin dueño)
  const fetchExercises = async () => {
    if (!user) return
    setLoading(true)

    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .or(`user_id.eq.${user.id},user_id.is.null`)  // propios O globales
      .order('name')

    if (error) {
      console.warn('useExercises error:', error.message)
      setError(error.message)
    } else {
      setExercises(data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { fetchExercises() }, [user])

  // Agregar un ejercicio personalizado
  const addExercise = async (name, muscleGroup) => {
    const { data, error } = await supabase
      .from('exercises')
      .insert({ name, muscle_group: muscleGroup, user_id: user.id })
      .select()
      .single()

    if (!error) setExercises(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    return { data, error }
  }

  return { exercises, loading, error, refetch: fetchExercises, addExercise }
}
