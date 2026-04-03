/**
 * pages/HistoryPage.jsx
 * ---------------------
 * Muestra el historial de sesiones guardadas.
 * Cada sesión = tarjeta colapsable con sus ejercicios y series.
 */
import { useState, useMemo } from 'react'
import { useSessions } from '../hooks/useSessions'
import { useExercises } from '../hooks/useExercises'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Select from '../components/ui/Select'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const rpeBadgeColor = (rpe) => rpe <= 6 ? 'green' : rpe <= 8 ? 'yellow' : 'red'

export default function HistoryPage() {
  const { sessions, loading, deleteSession } = useSessions()
  const { exercises } = useExercises()
  const [filterDays, setFilterDays]   = useState('all')
  const [expandedId, setExpandedId]   = useState(null)
  const [deletingId, setDeletingId]   = useState(null)

  // Filtrar por fecha
  const filtered = useMemo(() => sessions.filter(s => {
    if (filterDays === 'all') return true
    const diff = (Date.now() - new Date(s.logged_at)) / (1000 * 60 * 60 * 24)
    return diff <= parseInt(filterDays)
  }), [sessions, filterDays])

  // Abrir la primera sesión por defecto
  const firstId   = filtered[0]?.id
  const isOpen    = (id) => expandedId !== null ? expandedId === id : id === firstId
  const toggle    = (id) => setExpandedId(prev => prev === id ? null : id)

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta sesión y todas sus series?')) return
    setDeletingId(id)
    await deleteSession(id)
    setDeletingId(null)
  }

  // Agrupar workout_logs de la sesión por ejercicio
  const groupByExercise = (logs) => {
    const map = {}
    for (const l of logs) {
      if (!map[l.exercise_id]) {
        map[l.exercise_id] = {
          name:        l.exercises?.name ?? '—',
          muscleGroup: l.exercises?.muscle_group ?? '',
          sets:        [],
        }
      }
      map[l.exercise_id].sets.push(l)
    }
    return Object.values(map)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">📋 Historial</h1>
          <p className="text-gray-500 text-sm mt-1">{filtered.length} sesión{filtered.length !== 1 ? 'es' : ''}</p>
        </div>
        <Select value={filterDays} onChange={e => setFilterDays(e.target.value)} className="w-44">
          <option value="all">Todas las fechas</option>
          <option value="7">Última semana</option>
          <option value="30">Último mes</option>
          <option value="90">Últimos 3 meses</option>
        </Select>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-14">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-400">No hay sesiones aún</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(session => {
            const open        = isOpen(session.id)
            const logs        = session.workout_logs ?? []
            const exerciseMap = groupByExercise(logs)
            const muscles     = [...new Set(exerciseMap.map(e => e.muscleGroup))]
            const totalSets   = logs.length

            return (
              <div key={session.id} className={`
                border rounded-2xl overflow-hidden transition-colors
                ${open ? 'bg-gray-900 border-gray-700' : 'bg-gray-900/60 border-gray-800 hover:border-gray-700'}
              `}>

                {/* Cabecera */}
                <div className="flex items-center gap-3 px-5 py-4">
                  {/* Toggle */}
                  <button onClick={() => toggle(session.id)} className="flex-1 flex items-center gap-4 text-left min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg transition-colors ${open ? 'bg-blue-600' : 'bg-gray-800'}`}>
                      🏋️
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{session.name || 'Sesión'}</p>
                      <p className="text-xs text-gray-500 mt-0.5 capitalize">
                        {format(new Date(session.logged_at), "EEEE d 'de' MMMM · HH:mm", { locale: es })}
                      </p>
                    </div>
                  </button>

                  {/* Badges de músculos */}
                  <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                    {muscles.slice(0, 3).map(m => <Badge key={m} color="blue">{m}</Badge>)}
                  </div>

                  {/* Stats + controles */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-bold text-white">{exerciseMap.length} ej.</p>
                      <p className="text-xs text-gray-600">{totalSets} series</p>
                    </div>
                    <button onClick={() => handleDelete(session.id)} disabled={deletingId === session.id}
                      className="text-gray-700 hover:text-red-400 transition-colors text-base p-1"
                      title="Eliminar sesión">
                      {deletingId === session.id ? '⏳' : '🗑️'}
                    </button>
                    <button onClick={() => toggle(session.id)}
                      className={`text-gray-500 text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
                      ▼
                    </button>
                  </div>
                </div>

                {/* Detalle */}
                {open && exerciseMap.length > 0 && (
                  <div className="border-t border-gray-800">
                    {exerciseMap.map((ex, i) => (
                      <div key={i} className={`px-5 py-4 ${i < exerciseMap.length - 1 ? 'border-b border-gray-800/60' : ''}`}>

                        {/* Nombre ejercicio */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm font-semibold text-gray-200">{ex.name}</span>
                          <Badge color="gray">{ex.muscleGroup}</Badge>
                        </div>

                        {/* Tabla series */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-xs text-gray-600">
                                <th className="text-center pb-2 font-medium w-10">#</th>
                                <th className="text-center pb-2 font-medium">Peso</th>
                                <th className="text-center pb-2 font-medium">Reps</th>
                                <th className="text-center pb-2 font-medium">Vol.</th>
                                <th className="text-center pb-2 font-medium">RPE</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50">
                              {ex.sets.map((set, si) => (
                                <tr key={set.id} className="hover:bg-gray-800/30 transition-colors">
                                  <td className="text-center py-2 text-gray-600 font-bold text-xs">{si + 1}</td>
                                  <td className="text-center py-2 font-bold text-white">
                                    {set.weight_kg} <span className="text-gray-500 font-normal text-xs">kg</span>
                                  </td>
                                  <td className="text-center py-2 text-gray-300">{set.reps}</td>
                                  <td className="text-center py-2 text-gray-500 text-xs">
                                    {(set.weight_kg * set.reps).toFixed(0)} kg
                                  </td>
                                  <td className="text-center py-2">
                                    <Badge color={rpeBadgeColor(set.rpe)}>{set.rpe}</Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            {/* Totales del ejercicio */}
                            <tfoot>
                              <tr className="text-xs text-gray-600 border-t border-gray-800">
                                <td colSpan={2} className="pt-2 text-left">Total</td>
                                <td className="text-center pt-2">{ex.sets.reduce((s, l) => s + l.reps, 0)} reps</td>
                                <td className="text-center pt-2 font-semibold text-gray-500">
                                  {ex.sets.reduce((s, l) => s + l.weight_kg * l.reps, 0).toFixed(0)} kg
                                </td>
                                <td />
                              </tr>
                            </tfoot>
                          </table>
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
