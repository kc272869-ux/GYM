/**
 * pages/LogWorkoutPage.jsx
 * ------------------------
 * Formulario de sesión con:
 * - Buscador de ejercicios con filtro
 * - RPE 6-10 chips compactos
 * - Temporizador de descanso entre series
 * - Resumen post-sesión con calorías y PRs
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNavigationGuard } from '../context/NavigationGuardContext'
import { useExercises } from '../hooks/useExercises'
import { useSessions }  from '../hooks/useSessions'
import { useWorkouts }  from '../hooks/useWorkouts'
import { useProfile }   from '../hooks/useProfile'
import { useUnits }     from '../context/UnitsContext'
import { detectPRs }    from '../utils/records'
import RestTimer        from '../components/ui/RestTimer'
import Stopwatch        from '../components/ui/Stopwatch'
import SessionSummary   from '../components/workouts/SessionSummary'

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`
const newSet   = (prev = null) => ({ id: uid(), weight: prev?.weight ?? '', reps: prev?.reps ?? '', rpe: prev?.rpe ?? 7, duration_sec: '' })
const newEntry = ()            => ({ uid: uid(), exerciseId: '', sets: [newSet()] })

const RPE_OPTIONS = [
  { value: 6,  label: '6', desc: 'Moderado',   color: 'bg-yellow-600 border-yellow-500 text-white' },
  { value: 7,  label: '7', desc: 'Duro',        color: 'bg-orange-500 border-orange-400 text-white' },
  { value: 8,  label: '8', desc: 'Muy duro',    color: 'bg-orange-600 border-orange-500 text-white' },
  { value: 9,  label: '9', desc: 'Casi máx.',   color: 'bg-red-600 border-red-500 text-white'     },
  { value: 10, label:'10', desc: 'Máximo',      color: 'bg-red-700 border-red-600 text-white'     },
]
const rpeInactive = 'bg-gray-800 border-gray-700 text-gray-400'

// ── Buscador de ejercicios ────────────────────────────────────────────────────
function ExerciseSearch({ exercises, value, onChange }) {
  const [query, setQuery] = useState('')
  const [open, setOpen]   = useState(false)
  const ref               = useRef(null)
  const selected          = exercises.find(e => e.id === value)

  const filtered = query.trim()
    ? exercises.filter(e =>
        e.name.toLowerCase().includes(query.toLowerCase()) ||
        e.muscle_group.toLowerCase().includes(query.toLowerCase()))
    : exercises

  const grouped = filtered.reduce((acc, ex) => {
    if (!acc[ex.muscle_group]) acc[ex.muscle_group] = []
    acc[ex.muscle_group].push(ex)
    return acc
  }, {})

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const pick = (ex) => { onChange(ex.id); setQuery(''); setOpen(false) }

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => { setOpen(o => !o); setQuery('') }}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-colors ${
          open ? 'border-blue-500 bg-gray-800' : 'border-gray-700 bg-gray-800'}`}>
        {selected
          ? <span className="text-white font-medium text-sm">{selected.name} <span className="text-gray-500 text-xs font-normal">({selected.muscle_group})</span></span>
          : <span className="text-gray-500 text-sm">— Selecciona un ejercicio —</span>
        }
        <span className={`text-gray-500 text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-3 border-b border-gray-800">
            <input autoFocus type="text" placeholder="Buscar ejercicio o músculo..."
              value={query} onChange={e => setQuery(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {Object.keys(grouped).length === 0
              ? <p className="text-gray-500 text-sm text-center py-6">Sin resultados</p>
              : Object.entries(grouped).map(([muscle, exs]) => (
                  <div key={muscle}>
                    <p className="px-4 py-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-950/50 sticky top-0">{muscle}</p>
                    {exs.map(ex => (
                      <button key={ex.id} type="button" onClick={() => pick(ex)}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors active:bg-gray-700 ${
                          ex.id === value ? 'bg-blue-900/40 text-blue-300' : 'text-gray-200 hover:bg-gray-800'}`}>
                        {ex.name} {ex.id === value && <span className="text-blue-400 text-xs ml-1">✓</span>}
                      </button>
                    ))}
                  </div>
                ))
            }
          </div>
        </div>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function LogWorkoutPage() {
  const navigate = useNavigate()
  const { registerGuard, clearGuard } = useNavigationGuard()
  const { exercises }            = useExercises()
  const { saveSession }          = useSessions()
  const { workouts }             = useWorkouts()
  const { profile }              = useProfile()
  const { units, toKg, toDisplay, label } = useUnits()

  const [sessionName, setSessionName] = useState('')
  const [session, setSession]         = useState([newEntry()])
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')
  const [showTimer, setShowTimer]     = useState(false)
  // Estado del resumen post-sesión
  const [summary, setSummary] = useState(null) // { sessionName, logs, prs }

  const setExercise = (uid, exerciseId) =>
    setSession(p => p.map(e => e.uid === uid ? { ...e, exerciseId } : e))

  const updateSet = (uid, setId, field, value) =>
    setSession(p => p.map(e => e.uid !== uid ? e : {
      ...e, sets: e.sets.map(s => s.id === setId ? { ...s, [field]: value } : s)
    }))

  const addSet = (uid) =>
    setSession(p => p.map(e => e.uid !== uid ? e : {
      ...e, sets: [...e.sets, newSet(e.sets[e.sets.length - 1])]
    }))

  const removeSet = (uid, setId) =>
    setSession(p => p.map(e => e.uid !== uid ? e : {
      ...e, sets: e.sets.length > 1 ? e.sets.filter(s => s.id !== setId) : e.sets
    }))

  const addExercise    = () => setSession(p => [...p, newEntry()])
  const removeExercise = (uid) => session.length > 1 && setSession(p => p.filter(e => e.uid !== uid))

  const handleSave = async () => {
    setError('')
    for (const entry of session) {
      if (!entry.exerciseId) return setError('Selecciona un ejercicio en cada bloque')
      const exType = exercises.find(x => x.id === entry.exerciseId)?.type ?? 'weight_reps'
      for (const s of entry.sets) {
        if (exType === 'time' && !s.duration_sec) return setError('Selecciona la duración en todos los bloques de tiempo')
        if (exType === 'weight_reps' && (!s.weight || !s.reps)) return setError('Completa peso y reps en todas las series')
      }
    }
    setSaving(true)
    const exNames   = session.map(e => exercises.find(x => x.id === e.exerciseId)?.name ?? '')
    const muscles   = [...new Set(session.map(e => exercises.find(x => x.id === e.exerciseId)?.muscle_group).filter(Boolean))]
    const smartName = (() => {
      if (muscles.length === 0) return exNames.filter(Boolean).join(' · ')
      if (muscles.length === 1) {
        const m = muscles[0]
        if (m === 'Cardio') return 'Cardio'
        if (m === 'Abdomen') return 'Abdomen'
        if (m === 'Cuádriceps' || m === 'Femoral / Glúteo' || m === 'Pantorrilla') return 'Día de Pierna'
        return `Día de ${m}`
      }
      const legGroups = new Set(['Cuádriceps', 'Femoral / Glúteo', 'Pantorrilla'])
      if (muscles.every(m => legGroups.has(m))) return 'Día de Pierna'
      if (muscles.length === 2) return muscles.join(' + ')
      return exNames.filter(Boolean).slice(0, 2).join(' · ')
    })()
    const finalName = sessionName.trim() || smartName
    const logs      = session.flatMap((entry, ei) => {
      const exType = exercises.find(x => x.id === entry.exerciseId)?.type ?? 'weight_reps'
      return entry.sets.map((s, si) => ({
        exerciseId:   entry.exerciseId,
        weight:       exType === 'weight_reps' ? toKg(s.weight) : null,
        reps:         exType === 'weight_reps' ? parseInt(s.reps)     : null,
        duration_sec: exType === 'time'        ? parseInt(s.duration_sec) : null,
        rpe:          parseInt(s.rpe),
        notes:        `Ej ${ei+1} · Serie ${si+1}`,
      }))
    })

    const { error, data: savedSession } = await saveSession({ name: finalName, logs })
    if (error) { setError('Error al guardar. Inténtalo de nuevo.'); setSaving(false); return }

    // Construir logs con exercise_id para detectar PRs
    const logsWithEx = session.flatMap(entry => {
      const ex = exercises.find(x => x.id === entry.exerciseId)
      return entry.sets.map(s => ({
        exercise_id:  entry.exerciseId,
        weight_kg:    s.weight ? toKg(s.weight) : null,
        reps:         s.reps   ? parseInt(s.reps)     : null,
        duration_sec: s.duration_sec ? parseInt(s.duration_sec) : null,
        rpe:          parseInt(s.rpe),
        exercises:    { name: ex?.name ?? '', type: ex?.type ?? 'weight_reps', met_value: ex?.met_value ?? 4.0 },
        id:           `new-${uid()}`,
      }))
    })
    const prs = detectPRs(logsWithEx, workouts)

    setSummary({ sessionName: finalName, logs: logsWithEx, prs })
    setSaving(false)
  }

  const totalSets = session.reduce((s, e) => s + e.sets.length, 0)

  // Hay datos sin guardar si algún ejercicio está seleccionado o hay peso/reps
  const isDirty = !summary && session.some(e =>
    e.exerciseId || e.sets.some(s => s.weight || s.reps || s.duration_sec)
  )

  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const pendingNavRef = useRef(null)

  // Registrar/limpiar guard de navegación global
  useEffect(() => {
    if (!isDirty) { clearGuard(); return }
    registerGuard(() => new Promise(resolve => {
      pendingNavRef.current = resolve
      setShowLeaveModal(true)
    }))
    return () => clearGuard()
  }, [isDirty])

  // Bloquear cierre de pestaña / recarga
  useEffect(() => {
    if (!isDirty) return
    const handler = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const confirmLeave  = () => { setShowLeaveModal(false); pendingNavRef.current?.(true) }
  const cancelLeave   = () => { setShowLeaveModal(false); pendingNavRef.current?.(false) }

  // ── Resumen post-sesión ───────────────────────────────────────────────────
  if (summary) {
    return (
      <SessionSummary
        sessionName={summary.sessionName}
        logs={summary.logs}
        prs={summary.prs}
        profile={profile}
        onDone={() => navigate('/history')}
      />
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-6 space-y-4">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">➕ Nueva sesión</h1>
          <p className="text-gray-500 text-xs mt-0.5">{session.length} ejercicio{session.length > 1 ? 's' : ''} · {totalSets} series</p>
        </div>
        {/* Toggle temporizador */}
        <button onClick={() => setShowTimer(t => !t)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
            showTimer ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
          ⏱ Timer
        </button>
      </div>

      {/* Nombre sesión */}
      <input type="text" placeholder='Nombre de la sesión — opcional'
        value={sessionName} onChange={e => setSessionName(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border bg-gray-900 border-gray-700 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />

      {/* Temporizador de descanso (colapsable) */}
      {showTimer && <RestTimer />}

      {/* Bloques de ejercicio */}
      {session.map((entry, exIdx) => (
        <div key={entry.uid} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ejercicio {exIdx + 1}</span>
            {session.length > 1 && (
              <button onClick={() => removeExercise(entry.uid)} className="text-xs text-red-500">Eliminar</button>
            )}
          </div>

          <div className="px-4 pt-3 pb-2">
            <ExerciseSearch exercises={exercises} value={entry.exerciseId}
              onChange={(id) => setExercise(entry.uid, id)} />
          </div>

          {/* Progresión sugerida — última vez que hiciste este ejercicio */}
          {entry.exerciseId && (() => {
            const prev = workouts.filter(w => w.exercise_id === entry.exerciseId)
            if (!prev.length) return null
            const ex = exercises.find(e => e.id === entry.exerciseId)
            if (ex?.type === 'time') {
              const lastDur = prev[0]?.duration_sec
              if (!lastDur) return null
              const m = Math.floor(lastDur / 60), s = lastDur % 60
              return (
                <div className="mx-4 mb-2 px-3 py-2 rounded-xl bg-blue-900/20 border border-blue-800/40 flex items-center gap-2">
                  <span className="text-sm">⏱</span>
                  <p className="text-xs text-blue-300">
                    Última vez: <span className="font-bold">{m > 0 ? `${m}min${s > 0 ? ` ${s}s` : ''}` : `${s}s`}</span>
                  </p>
                </div>
              )
            }
            const maxW        = Math.max(...prev.map(w => w.weight_kg ?? 0))
            const lastSession = prev[0]
            const sameWeight  = prev.filter(w => Math.abs((w.weight_kg ?? 0) - maxW) < 0.1)
            const maxReps     = sameWeight.length ? Math.max(...sameWeight.map(w => w.reps ?? 0)) : 0
            return (
              <div className="mx-4 mb-2 px-3 py-2 rounded-xl bg-blue-900/20 border border-blue-800/40 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">📈</span>
                  <p className="text-xs text-blue-300">
                    Última vez: <span className="font-bold">{toDisplay(lastSession.weight_kg)}{label} × {lastSession.reps}</span>
                  </p>
                </div>
                <p className="text-xs text-gray-600">máx {toDisplay(maxW)}{label} × {maxReps}</p>
              </div>
            )
          })()}

          <div className="px-4 pb-3 space-y-3">
            {entry.sets.map((set, si) => (
              <div key={set.id} className="bg-gray-800 rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500">Serie {si + 1}</span>
                  <button onClick={() => removeSet(entry.uid, set.id)} disabled={entry.sets.length === 1}
                    className="text-gray-600 hover:text-red-400 disabled:opacity-20 text-sm transition-colors">✕</button>
                </div>

                {(() => {
                  const exType = exercises.find(e => e.id === entry.exerciseId)?.type ?? 'weight_reps'
                  return exType === 'time' ? (
                    // Ejercicio de tiempo — cronómetro activo
                    <Stopwatch
                      value={set.duration_sec || 0}
                      onChange={sec => updateSet(entry.uid, set.id, 'duration_sec', sec || null)}
                    />
                  ) : (
                    // Ejercicio de peso + reps
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500 font-medium">Peso ({label})</label>
                        <input type="number" inputMode="decimal" step={units === 'lb' ? '1' : '0.5'} min="0" placeholder="0"
                          value={set.weight} onChange={e => updateSet(entry.uid, set.id, 'weight', e.target.value)}
                          className="w-full px-3 py-3 rounded-xl border bg-gray-900 border-gray-700 text-white text-lg font-bold text-center placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500 font-medium">Repeticiones</label>
                        <input type="number" inputMode="numeric" min="1" max="500" placeholder="0"
                          value={set.reps} onChange={e => updateSet(entry.uid, set.id, 'reps', e.target.value)}
                          className="w-full px-3 py-3 rounded-xl border bg-gray-900 border-gray-700 text-white text-lg font-bold text-center placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  )
                })()}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-500 font-medium">Esfuerzo (RPE)</label>
                    <span className={`text-xs font-semibold ${
                      set.rpe <= 7 ? 'text-yellow-400' : set.rpe <= 8 ? 'text-orange-400' : 'text-red-400'}`}>
                      {RPE_OPTIONS.find(r => r.value === set.rpe)?.desc ?? ''}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {RPE_OPTIONS.map(r => (
                      <button key={r.value} type="button"
                        onClick={() => updateSet(entry.uid, set.id, 'rpe', r.value)}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all active:scale-95 ${
                          set.rpe === r.value ? r.color : rpeInactive}`}>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <button onClick={() => addSet(entry.uid)}
              className="w-full py-3 rounded-xl border border-dashed border-gray-700 text-gray-500 hover:border-blue-600 hover:text-blue-400 text-sm transition-colors active:scale-[0.98]">
              + Agregar serie
            </button>
          </div>
        </div>
      ))}

      <button onClick={addExercise}
        className="w-full py-4 rounded-2xl border border-dashed border-gray-700 text-gray-400 hover:border-blue-600 hover:text-blue-400 font-medium transition-colors active:scale-[0.98]">
        💪 Agregar otro ejercicio
      </button>

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-300">{error}</div>
      )}

      <button onClick={handleSave} disabled={saving}
        className="w-full py-4 rounded-2xl bg-blue-600 active:bg-blue-700 active:scale-[0.98] text-white font-bold text-base transition-all disabled:opacity-60 shadow-lg shadow-blue-500/20">
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Guardando...
          </span>
        ) : `Finalizar sesión · ${totalSets} serie${totalSets !== 1 ? 's' : ''}`}
      </button>

      {/* Modal — salir sin guardar */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pb-8 px-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="bg-gray-900 border border-gray-700 rounded-3xl p-6 w-full max-w-sm space-y-4">
            <div className="text-center space-y-1">
              <p className="text-white font-bold text-base">¿Salir sin guardar?</p>
              <p className="text-gray-400 text-sm">Perderás los datos de esta sesión.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={cancelLeave}
                className="flex-1 py-3 rounded-xl bg-gray-800 border border-gray-700 text-gray-200 text-sm font-semibold active:scale-95 transition-all">
                Seguir aquí
              </button>
              <button onClick={confirmLeave}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold active:scale-95 transition-all">
                Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
