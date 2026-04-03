/**
 * pages/HistoryPage.jsx — optimizado para iPhone
 */
import { useState, useMemo } from 'react'
import { useSessions } from '../hooks/useSessions'
import Badge from '../components/ui/Badge'
import Select from '../components/ui/Select'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const rpeBadgeColor = (rpe) => rpe <= 6 ? 'green' : rpe <= 8 ? 'yellow' : 'red'

function groupByExercise(logs) {
  const map = {}
  for (const l of logs) {
    if (!map[l.exercise_id]) {
      map[l.exercise_id] = { name: l.exercises?.name ?? '—', muscleGroup: l.exercises?.muscle_group ?? '', sets: [] }
    }
    map[l.exercise_id].sets.push(l)
  }
  return Object.values(map)
}

export default function HistoryPage() {
  const { sessions, loading, deleteSession } = useSessions()
  const [filterDays, setFilterDays] = useState('all')
  const [expandedId, setExpandedId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const filtered = useMemo(() => sessions.filter(s => {
    if (filterDays === 'all') return true
    const diff = (Date.now() - new Date(s.logged_at)) / (1000 * 60 * 60 * 24)
    return diff <= parseInt(filterDays)
  }), [sessions, filterDays])

  const firstId = filtered[0]?.id
  const isOpen  = (id) => expandedId !== null ? expandedId === id : id === firstId
  const toggle  = (id) => setExpandedId(prev => prev === id ? null : id)

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta sesión y todas sus series?')) return
    setDeletingId(id)
    await deleteSession(id)
    setDeletingId(null)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-4 pb-6 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">📋 Historial</h1>
          <p className="text-gray-500 text-xs mt-0.5">{filtered.length} sesión{filtered.length !== 1 ? 'es' : ''}</p>
        </div>
        <select
          value={filterDays}
          onChange={e => setFilterDays(e.target.value)}
          className="px-3 py-2 rounded-xl border bg-gray-900 border-gray-700 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todas</option>
          <option value="7">7 días</option>
          <option value="30">30 días</option>
          <option value="90">3 meses</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl py-14 text-center text-gray-600">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm">No hay sesiones aún</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(session => {
            const open        = isOpen(session.id)
            const logs        = session.workout_logs ?? []
            const exerciseMap = groupByExercise(logs)
            const muscles     = [...new Set(exerciseMap.map(e => e.muscleGroup))]

            return (
              <div key={session.id} className={`border rounded-2xl overflow-hidden transition-colors ${
                open ? 'bg-gray-900 border-gray-700' : 'bg-gray-900/60 border-gray-800'
              }`}>

                {/* Cabecera — tap para expandir */}
                <button
                  onClick={() => toggle(session.id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-800/40 transition-colors text-left"
                >
                  {/* Ícono */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${open ? 'bg-blue-600' : 'bg-gray-800'}`}>
                    🏋️
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{session.name || 'Sesión'}</p>
                    <p className="text-xs text-gray-500 mt-0.5 capitalize">
                      {format(new Date(session.logged_at), "EEEE d 'de' MMMM · HH:mm", { locale: es })}
                    </p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {muscles.slice(0,3).map(m => <Badge key={m} color="blue">{m}</Badge>)}
                    </div>
                  </div>

                  {/* Counts + flecha */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <p className="text-xs text-gray-500">{exerciseMap.length} ej. · {logs.length} series</p>
                    <span className={`text-gray-600 text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>
                  </div>
                </button>

                {/* Detalle expandido */}
                {open && (
                  <div className="border-t border-gray-800">
                    {exerciseMap.map((ex, i) => (
                      <div key={i} className={`px-4 py-4 ${i < exerciseMap.length - 1 ? 'border-b border-gray-800/60' : ''}`}>

                        <div className="flex items-center gap-2 mb-3">
                          <p className="font-semibold text-gray-200 text-sm">{ex.name}</p>
                          <Badge color="gray">{ex.muscleGroup}</Badge>
                        </div>

                        {/* Tabla */}
                        <div className="bg-gray-800/60 rounded-xl overflow-hidden">
                          <div className="grid grid-cols-4 px-3 py-2 border-b border-gray-700/50">
                            {['#', 'Peso', 'Reps', 'RPE'].map(h => (
                              <span key={h} className="text-xs text-gray-600 font-medium text-center">{h}</span>
                            ))}
                          </div>
                          {ex.sets.map((set, si) => (
                            <div key={set.id} className="grid grid-cols-4 px-3 py-2.5 border-b border-gray-700/20 last:border-0">
                              <span className="text-xs text-gray-600 text-center font-bold">{si + 1}</span>
                              <span className="text-sm font-bold text-white text-center">
                                {set.weight_kg}<span className="text-gray-600 font-normal text-xs"> kg</span>
                              </span>
                              <span className="text-sm text-gray-300 text-center">{set.reps}</span>
                              <div className="flex justify-center">
                                <Badge color={rpeBadgeColor(set.rpe)}>{set.rpe}</Badge>
                              </div>
                            </div>
                          ))}
                          {/* Total volumen */}
                          <div className="grid grid-cols-4 px-3 py-2 bg-gray-700/20">
                            <span className="text-xs text-gray-600 col-span-2 text-center">Volumen total</span>
                            <span className="text-xs font-bold text-gray-400 text-center">
                              {ex.sets.reduce((s, l) => s + l.reps, 0)} reps
                            </span>
                            <span className="text-xs font-bold text-blue-400 text-center">
                              {ex.sets.reduce((s, l) => s + l.weight_kg * l.reps, 0).toFixed(0)} kg
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Borrar sesión */}
                    <div className="px-4 py-3 border-t border-gray-800">
                      <button
                        onClick={() => handleDelete(session.id)}
                        disabled={deletingId === session.id}
                        className="w-full py-2.5 rounded-xl border border-red-900/50 text-red-500 hover:bg-red-900/20 text-sm font-medium transition-colors active:scale-[0.98] disabled:opacity-50"
                      >
                        {deletingId === session.id ? '⏳ Eliminando...' : '🗑️ Eliminar sesión'}
                      </button>
                    </div>
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
