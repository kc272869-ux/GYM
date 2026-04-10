/**
 * pages/HistoryPage.jsx
 * ----------------------
 * Historial visual de sesiones con stats por sesión y detalle expandible.
 */
import { useState, useMemo } from 'react'
import { useSessions } from '../hooks/useSessions'
import { useUnits } from '../context/UnitsContext'
import { useProfile } from '../hooks/useProfile'
import { calcSessionCalories } from '../utils/calories'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const MUSCLE_COLORS = {
  'Pecho':            { bg: 'bg-blue-500/15',   text: 'text-blue-300',   dot: 'bg-blue-400' },
  'Espalda':          { bg: 'bg-purple-500/15',  text: 'text-purple-300', dot: 'bg-purple-400' },
  'Hombros':          { bg: 'bg-cyan-500/15',    text: 'text-cyan-300',   dot: 'bg-cyan-400' },
  'Bíceps':           { bg: 'bg-green-500/15',   text: 'text-green-300',  dot: 'bg-green-400' },
  'Tríceps':          { bg: 'bg-emerald-500/15', text: 'text-emerald-300',dot: 'bg-emerald-400' },
  'Cuádriceps':       { bg: 'bg-orange-500/15',  text: 'text-orange-300', dot: 'bg-orange-400' },
  'Femoral / Glúteo': { bg: 'bg-pink-500/15',    text: 'text-pink-300',   dot: 'bg-pink-400' },
  'Pantorrilla':      { bg: 'bg-rose-500/15',    text: 'text-rose-300',   dot: 'bg-rose-400' },
  'Abdomen':          { bg: 'bg-yellow-500/15',  text: 'text-yellow-300', dot: 'bg-yellow-400' },
  'Cardio':           { bg: 'bg-red-500/15',     text: 'text-red-300',    dot: 'bg-red-400' },
}

const muscleColor = (m) => MUSCLE_COLORS[m] ?? { bg: 'bg-gray-700/40', text: 'text-gray-400', dot: 'bg-gray-500' }

function buildShareText({ sessionName, date, exerciseMap, totalVol, calStats, avgRpe, label, toDisplay }) {
  const dateStr = format(new Date(date), "EEEE d 'de' MMMM · HH:mm", { locale: es })
  const lines = [`💪 *${sessionName || 'Sesión'}*`, `📅 ${dateStr}`, '']
  for (const ex of exerciseMap) {
    if (ex.type === 'time') {
      const dur = ex.sets[0]?.duration_sec
      const m = dur ? Math.floor(dur / 60) : 0
      const s = dur ? dur % 60 : 0
      lines.push(`• ${ex.name} — ${m}:${String(s).padStart(2,'0')}min`)
    } else {
      const maxW  = Math.max(...ex.sets.map(l => l.weight_kg ?? 0))
      const reps  = ex.sets[0]?.reps ?? 0
      const avgRpeEx = (ex.sets.reduce((a, l) => a + (l.rpe ?? 7), 0) / ex.sets.length).toFixed(0)
      lines.push(`• ${ex.name} — ${ex.sets.length}×${reps} @ ${toDisplay(maxW)}${label} (RPE ${avgRpeEx})`)
    }
  }
  lines.push('')
  const stats = []
  if (totalVol > 0) stats.push(`📦 ${(totalVol/1000).toFixed(1)}t volumen`)
  if (calStats?.calories) stats.push(`🔥 ${calStats.calories} kcal`)
  if (avgRpe) stats.push(`RPE avg ${avgRpe}`)
  if (stats.length) lines.push(stats.join(' · '))
  lines.push('Registrado con Heavy 💪')
  return lines.join('\n')
}

function shareSession(text) {
  if (navigator.share) {
    navigator.share({ text }).catch(() => {})
  } else {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }
}

function MuscleChip({ muscle }) {
  const c = muscleColor(muscle)
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {muscle}
    </span>
  )
}

function groupByExercise(logs) {
  const map = {}
  for (const l of logs) {
    if (!map[l.exercise_id]) {
      map[l.exercise_id] = {
        name: l.exercises?.name ?? '—',
        muscleGroup: l.exercises?.muscle_group ?? '',
        type: l.exercises?.type ?? 'weight_reps',
        sets: [],
      }
    }
    map[l.exercise_id].sets.push(l)
  }
  return Object.values(map)
}

function fmtDuration(sec) {
  if (!sec) return '—'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}min${s > 0 ? ` ${s}s` : ''}` : `${s}s`
}

export default function HistoryPage() {
  const { sessions, loading, deleteSession } = useSessions()
  const { toDisplay, label } = useUnits()
  const { profile } = useProfile()
  const [filterDays, setFilterDays] = useState('all')
  const [expandedId, setExpandedId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const filtered = useMemo(() => sessions.filter(s => {
    if (filterDays === 'all') return true
    const diff = (Date.now() - new Date(s.logged_at)) / (1000 * 60 * 60 * 24)
    return diff <= parseInt(filterDays)
  }), [sessions, filterDays])

  const toggle = (id) => setExpandedId(prev => prev === id ? null : id)

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta sesión y todas sus series?')) return
    setDeletingId(id)
    await deleteSession(id)
    setDeletingId(null)
    if (expandedId === id) setExpandedId(null)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-4 pb-6 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Historial</h1>
          <p className="text-gray-500 text-xs mt-0.5">{filtered.length} sesión{filtered.length !== 1 ? 'es' : ''}</p>
        </div>
        <div className="flex gap-1 p-1 bg-gray-900/60 border border-gray-800 rounded-xl">
          {[{v:'all',l:'Todo'},{v:'7',l:'7d'},{v:'30',l:'30d'},{v:'90',l:'3m'}].map(f => (
            <button key={f.v} type="button" onClick={() => setFilterDays(f.v)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterDays === f.v ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-gray-900 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl py-14 text-center text-gray-600">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm">No hay sesiones aún</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(session => {
            const open        = expandedId === session.id
            const logs        = session.workout_logs ?? []
            const exerciseMap = groupByExercise(logs)
            const muscles     = [...new Set(exerciseMap.map(e => e.muscleGroup).filter(Boolean))]
            const totalVol    = logs.reduce((s, l) => s + (l.weight_kg ?? 0) * (l.reps ?? 0), 0)
            const avgRpe      = logs.length ? (logs.reduce((s, l) => s + (l.rpe ?? 7), 0) / logs.length).toFixed(1) : null
            const calStats    = calcSessionCalories({
              logs,
              weightKg:         profile?.weight_kg,
              sex:              profile?.sex,
              totalDurationMin: session.duration_min,
            })

            return (
              <div key={session.id} className={`border rounded-2xl overflow-hidden transition-all ${
                open ? 'bg-gray-900 border-gray-700' : 'bg-gray-900/70 border-gray-800'
              }`}>

                {/* Cabecera */}
                <button
                  onClick={() => toggle(session.id)}
                  className="w-full px-4 pt-4 pb-3 text-left active:bg-gray-800/30 transition-colors"
                >
                  {/* Fecha + nombre */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 capitalize mb-0.5">
                        {format(new Date(session.logged_at), "EEEE d 'de' MMMM · HH:mm", { locale: es })}
                      </p>
                      <p className="font-bold text-white text-base leading-tight truncate">{session.name || 'Sesión'}</p>
                    </div>
                    <span className={`text-gray-600 text-xs mt-1 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}>▼</span>
                  </div>

                  {/* Chips de músculos */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {muscles.map(m => <MuscleChip key={m} muscle={m} />)}
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-sm font-bold text-white">{exerciseMap.length}</p>
                      <p className="text-[10px] text-gray-600">ejercicios</p>
                    </div>
                    <div className="w-px h-6 bg-gray-800" />
                    <div className="text-center">
                      <p className="text-sm font-bold text-white">{logs.length}</p>
                      <p className="text-[10px] text-gray-600">series</p>
                    </div>
                    {totalVol > 0 && <>
                      <div className="w-px h-6 bg-gray-800" />
                      <div className="text-center">
                        <p className="text-sm font-bold text-purple-400">{(totalVol/1000).toFixed(1)}t</p>
                        <p className="text-[10px] text-gray-600">volumen</p>
                      </div>
                    </>}
                    {avgRpe && <>
                      <div className="w-px h-6 bg-gray-800" />
                      <div className="text-center">
                        <p className={`text-sm font-bold ${avgRpe <= 7 ? 'text-yellow-400' : avgRpe <= 8.5 ? 'text-orange-400' : 'text-red-400'}`}>
                          {avgRpe}
                        </p>
                        <p className="text-[10px] text-gray-600">RPE avg</p>
                      </div>
                    </>}
                    {calStats && <>
                      <div className="w-px h-6 bg-gray-800" />
                      <div className="text-center">
                        <p className="text-sm font-bold text-orange-400">{calStats.calories}</p>
                        <p className="text-[10px] text-gray-600">kcal</p>
                      </div>
                    </>}
                    {/* Barra de volumen */}
                    {totalVol > 0 && (
                      <div className="flex-1 ml-1">
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                            style={{ width: `${Math.min(100, (totalVol / 5000) * 100)}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </button>

                {/* Detalle expandido */}
                {open && (
                  <div className="border-t border-gray-800">
                    <div className="px-4 py-3 space-y-3">
                      {exerciseMap.map((ex, i) => {
                        const exVol = ex.sets.reduce((s,l) => s + (l.weight_kg??0)*(l.reps??0), 0)
                        const maxW  = ex.sets.length ? Math.max(...ex.sets.map(l => l.weight_kg ?? 0)) : 0
                        return (
                          <div key={i} className="bg-gray-800/50 rounded-2xl overflow-hidden">
                            {/* Header ejercicio */}
                            <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-700/50">
                              <div className="flex items-center gap-2">
                                <MuscleChip muscle={ex.muscleGroup} />
                                <p className="font-semibold text-white text-sm">{ex.name}</p>
                              </div>
                              {exVol > 0 && (
                                <p className="text-xs text-gray-500">{exVol.toLocaleString()} kg</p>
                              )}
                            </div>

                            {/* Series */}
                            <div className="divide-y divide-gray-700/30">
                              {ex.type === 'time' ? (
                                ex.sets.map((set, si) => (
                                  <div key={set.id} className="flex items-center justify-between px-3 py-2">
                                    <span className="text-xs text-gray-600 w-6">{si + 1}</span>
                                    <span className="text-sm font-bold text-blue-300">{fmtDuration(set.duration_sec)}</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                      set.rpe <= 6 ? 'bg-yellow-500/20 text-yellow-300' :
                                      set.rpe <= 8 ? 'bg-orange-500/20 text-orange-300' :
                                                     'bg-red-500/20 text-red-300'}`}>
                                      RPE {set.rpe}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <>
                                  {/* Encabezado columnas */}
                                  <div className="grid grid-cols-4 px-3 py-1.5 bg-gray-900/30">
                                    {['#', 'Peso', 'Reps', 'RPE'].map(h => (
                                      <span key={h} className="text-[10px] text-gray-600 font-medium text-center">{h}</span>
                                    ))}
                                  </div>
                                  {ex.sets.map((set, si) => (
                                    <div key={set.id} className="grid grid-cols-4 px-3 py-2.5">
                                      <span className="text-xs text-gray-600 text-center">{si + 1}</span>
                                      <span className="text-sm font-bold text-white text-center">
                                        {toDisplay(set.weight_kg)}<span className="text-gray-600 font-normal text-xs">{label}</span>
                                      </span>
                                      <span className="text-sm text-gray-300 text-center">{set.reps}</span>
                                      <div className="flex justify-center">
                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                                          set.rpe <= 6 ? 'bg-yellow-500/20 text-yellow-300' :
                                          set.rpe <= 8 ? 'bg-orange-500/20 text-orange-300' :
                                                         'bg-red-500/20 text-red-300'}`}>
                                          {set.rpe}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                  {/* Footer volumen */}
                                  <div className="flex items-center justify-between px-3 py-2 bg-gray-900/30">
                                    <span className="text-xs text-gray-600">{ex.sets.length} series · máx {toDisplay(maxW)}{label}</span>
                                    <span className="text-xs font-bold text-purple-400">{exVol.toLocaleString()} kg vol.</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Acciones */}
                    <div className="px-4 pb-4 flex gap-2">
                      <button
                        onClick={() => shareSession(buildShareText({
                          sessionName: session.name,
                          date: session.logged_at,
                          exerciseMap,
                          totalVol,
                          calStats,
                          avgRpe,
                          label,
                          toDisplay,
                        }))}
                        className="flex-1 py-2.5 rounded-xl border border-green-800/50 text-green-400 hover:bg-green-900/20 text-sm font-medium transition-colors active:scale-[0.98]"
                      >
                        Compartir
                      </button>
                      <button
                        onClick={() => handleDelete(session.id)}
                        disabled={deletingId === session.id}
                        className="flex-1 py-2.5 rounded-xl border border-red-900/40 text-red-500 hover:bg-red-900/20 text-sm font-medium transition-colors active:scale-[0.98] disabled:opacity-50"
                      >
                        {deletingId === session.id ? 'Eliminando...' : 'Eliminar sesión'}
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
