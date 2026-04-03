/**
 * pages/HistoryPage.jsx
 * ---------------------
 * Muestra el historial completo de registros del usuario.
 * Permite filtrar por ejercicio y por rango de fechas.
 */
import { useState, useMemo } from 'react'
import { useWorkouts } from '../hooks/useWorkouts'
import { useExercises } from '../hooks/useExercises'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// Badge de color según RPE
const rpeBadgeColor = (rpe) => {
  if (rpe <= 6) return 'green'
  if (rpe <= 8) return 'yellow'
  return 'red'
}

export default function HistoryPage() {
  const { workouts, loading, deleteWorkout } = useWorkouts()
  const { exercises } = useExercises()
  const [filterExercise, setFilterExercise] = useState('')
  const [filterDays, setFilterDays]         = useState('all')
  const [deletingId, setDeletingId]         = useState(null)

  // Filtrado combinado
  const filtered = useMemo(() => {
    return workouts.filter(w => {
      // Filtro por ejercicio
      if (filterExercise && w.exercise_id !== filterExercise) return false

      // Filtro por fecha
      if (filterDays !== 'all') {
        const days = parseInt(filterDays)
        const diff = (Date.now() - new Date(w.logged_at)) / (1000 * 60 * 60 * 24)
        if (diff > days) return false
      }
      return true
    })
  }, [workouts, filterExercise, filterDays])

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este registro?')) return
    setDeletingId(id)
    await deleteWorkout(id)
    setDeletingId(null)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-white">📋 Historial</h1>
        <p className="text-gray-400 text-sm mt-1">{filtered.length} registros</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={filterExercise}
          onChange={e => setFilterExercise(e.target.value)}
          className="flex-1 min-w-40"
        >
          <option value="">Todos los ejercicios</option>
          {exercises.map(ex => (
            <option key={ex.id} value={ex.id}>{ex.name}</option>
          ))}
        </Select>

        <Select
          value={filterDays}
          onChange={e => setFilterDays(e.target.value)}
          className="w-44"
        >
          <option value="all">Todas las fechas</option>
          <option value="7">Última semana</option>
          <option value="30">Último mes</option>
          <option value="90">Últimos 3 meses</option>
        </Select>
      </div>

      {/* Lista de registros */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-400">No hay registros con estos filtros</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(w => (
            <div
              key={w.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-gray-700 transition-colors"
            >
              {/* Info principal */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-gray-100">{w.exercises?.name}</p>
                  <Badge color="blue">{w.exercises?.muscle_group}</Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {format(new Date(w.logged_at), "EEEE d 'de' MMMM yyyy", { locale: es })}
                </p>
                {w.notes && (
                  <p className="text-xs text-gray-600 mt-1 italic">"{w.notes}"</p>
                )}
              </div>

              {/* Métricas */}
              <div className="flex items-center gap-4 text-center shrink-0">
                <div>
                  <p className="text-lg font-bold text-white">{w.weight_kg}<span className="text-xs text-gray-500 ml-0.5">kg</span></p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">{w.sets}×{w.reps}</p>
                  <p className="text-xs text-gray-600">series×reps</p>
                </div>
                <div>
                  <Badge color={rpeBadgeColor(w.rpe)}>RPE {w.rpe}</Badge>
                </div>
                <button
                  onClick={() => handleDelete(w.id)}
                  disabled={deletingId === w.id}
                  className="text-gray-600 hover:text-red-400 transition-colors text-lg"
                  title="Eliminar registro"
                >
                  {deletingId === w.id ? '⏳' : '🗑️'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
