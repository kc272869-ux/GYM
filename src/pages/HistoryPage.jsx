/**
 * pages/HistoryPage.jsx
 * ---------------------
 * Muestra el historial agrupado por sesión (día).
 *
 * Lógica de agrupación:
 *   - Todos los registros del mismo día calendario = una sesión
 *   - Dentro de cada sesión, los registros se agrupan por ejercicio
 *   - Dentro de cada ejercicio, cada fila = una serie (con su peso/reps/rpe)
 */
import { useState, useMemo } from 'react'
import { useWorkouts } from '../hooks/useWorkouts'
import { useExercises } from '../hooks/useExercises'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Select from '../components/ui/Select'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const rpeBadgeColor = (rpe) => {
  if (rpe <= 4) return 'green'
  if (rpe <= 6) return 'green'
  if (rpe <= 8) return 'yellow'
  return 'red'
}

/**
 * Agrupa un array de workout_logs en sesiones por día.
 * Retorna un array ordenado de sesiones (más reciente primero):
 * [
 *   {
 *     dateKey: "2026-04-02",
 *     dateLabel: "jueves 2 de abril 2026",
 *     exercises: [
 *       {
 *         exerciseId: "uuid",
 *         name: "Press de banca",
 *         muscleGroup: "Pecho",
 *         sets: [ { id, weight_kg, reps, rpe }, ... ]
 *       }
 *     ]
 *   }
 * ]
 */
function groupBySession(workouts) {
  const sessions = {}

  for (const w of workouts) {
    // Clave del día (YYYY-MM-DD en zona local)
    const date = new Date(w.logged_at)
    const dateKey = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`

    if (!sessions[dateKey]) {
      sessions[dateKey] = {
        dateKey,
        dateLabel: format(date, "EEEE d 'de' MMMM yyyy", { locale: es }),
        exercises: {},
      }
    }

    const exId = w.exercise_id
    if (!sessions[dateKey].exercises[exId]) {
      sessions[dateKey].exercises[exId] = {
        exerciseId:  exId,
        name:        w.exercises?.name ?? '—',
        muscleGroup: w.exercises?.muscle_group ?? '',
        sets:        [],
      }
    }

    sessions[dateKey].exercises[exId].sets.push(w)
  }

  // Convertir a array ordenado más reciente primero
  return Object.values(sessions)
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
    .map(s => ({ ...s, exercises: Object.values(s.exercises) }))
}

export default function HistoryPage() {
  const { workouts, loading, deleteWorkout } = useWorkouts()
  const { exercises } = useExercises()
  const [filterExercise, setFilterExercise] = useState('')
  const [filterDays, setFilterDays]         = useState('all')
  const [deletingId, setDeletingId]         = useState(null)
  // qué sesiones están expandidas (por defecto la primera)
  const [expanded, setExpanded]             = useState({})

  // Filtrar registros individualmente antes de agrupar
  const filtered = useMemo(() => {
    return workouts.filter(w => {
      if (filterExercise && w.exercise_id !== filterExercise) return false
      if (filterDays !== 'all') {
        const diff = (Date.now() - new Date(w.logged_at)) / (1000 * 60 * 60 * 24)
        if (diff > parseInt(filterDays)) return false
      }
      return true
    })
  }, [workouts, filterExercise, filterDays])

  // Agrupar por sesión
  const sessions = useMemo(() => groupBySession(filtered), [filtered])

  // Abrir la primera sesión por defecto cuando cargan los datos
  const firstKey = sessions[0]?.dateKey
  const isOpen = (key) => expanded[key] ?? key === firstKey

  const toggleSession = (key) =>
    setExpanded(prev => ({ ...prev, [key]: !isOpen(key) }))

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta serie?')) return
    setDeletingId(id)
    await deleteWorkout(id)
    setDeletingId(null)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-white">📋 Historial</h1>
        <p className="text-gray-400 text-sm mt-1">
          {sessions.length} sesión{sessions.length !== 1 ? 'es' : ''} · {filtered.length} series
        </p>
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

      {/* Contenido */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      ) : sessions.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-400">No hay registros con estos filtros</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map(session => {
            const open = isOpen(session.dateKey)
            const totalSets = session.exercises.reduce((s, e) => s + e.sets.length, 0)
            const muscles   = [...new Set(session.exercises.map(e => e.muscleGroup))]

            return (
              <div key={session.dateKey} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">

                {/* Cabecera de la sesión — clickeable para expandir/colapsar */}
                <button
                  onClick={() => toggleSession(session.dateKey)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-800/50 transition-colors text-left"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-white capitalize">{session.dateLabel}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-500">
                        {session.exercises.length} ejercicio{session.exercises.length !== 1 ? 's' : ''} · {totalSets} series
                      </span>
                      {muscles.map(m => (
                        <Badge key={m} color="blue">{m}</Badge>
                      ))}
                    </div>
                  </div>
                  <span className={`text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>

                {/* Detalle de la sesión */}
                {open && (
                  <div className="border-t border-gray-800 divide-y divide-gray-800">
                    {session.exercises.map(ex => (
                      <div key={ex.exerciseId} className="px-5 py-4">

                        {/* Nombre del ejercicio */}
                        <div className="flex items-center gap-2 mb-3">
                          <p className="font-medium text-gray-200">{ex.name}</p>
                          <Badge color="blue">{ex.muscleGroup}</Badge>
                        </div>

                        {/* Tabla de series */}
                        <div className="space-y-1">
                          {/* Header */}
                          <div className="grid grid-cols-[2rem_1fr_1fr_1fr_2rem] gap-2 px-1 mb-2">
                            <span className="text-xs text-gray-600 text-center">#</span>
                            <span className="text-xs text-gray-600 text-center">Peso</span>
                            <span className="text-xs text-gray-600 text-center">Reps</span>
                            <span className="text-xs text-gray-600 text-center">RPE</span>
                            <span />
                          </div>

                          {/* Una fila por serie */}
                          {ex.sets.map((set, idx) => (
                            <div
                              key={set.id}
                              className="grid grid-cols-[2rem_1fr_1fr_1fr_2rem] gap-2 items-center bg-gray-800/50 rounded-lg px-2 py-2"
                            >
                              <span className="text-xs text-gray-600 text-center font-bold">{idx + 1}</span>
                              <span className="text-sm font-semibold text-white text-center">
                                {set.weight_kg} <span className="text-xs text-gray-500 font-normal">kg</span>
                              </span>
                              <span className="text-sm text-gray-300 text-center">{set.reps}</span>
                              <span className="flex justify-center">
                                <Badge color={rpeBadgeColor(set.rpe)}>RPE {set.rpe}</Badge>
                              </span>
                              <button
                                onClick={() => handleDelete(set.id)}
                                disabled={deletingId === set.id}
                                className="text-gray-700 hover:text-red-400 transition-colors text-sm text-center"
                                title="Eliminar serie"
                              >
                                {deletingId === set.id ? '⏳' : '✕'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
