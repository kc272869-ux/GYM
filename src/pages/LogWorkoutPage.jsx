/**
 * pages/LogWorkoutPage.jsx
 * ------------------------
 * - Selector de ejercicio con búsqueda por texto
 * - RPE solo del 6 al 10 como chips compactos con descripción al elegir
 */
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExercises } from '../hooks/useExercises'
import { useSessions } from '../hooks/useSessions'

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`
const newSet   = (prev = null) => ({ id: uid(), weight: prev?.weight ?? '', reps: prev?.reps ?? '', rpe: prev?.rpe ?? 7 })
const newEntry = ()            => ({ uid: uid(), exerciseId: '', sets: [newSet()] })

// Solo RPE 6-10 con colores y etiquetas
const RPE_OPTIONS = [
  { value: 6,  label: '6',  desc: 'Moderado',    color: 'bg-yellow-600 border-yellow-500 text-white' },
  { value: 7,  label: '7',  desc: 'Duro',         color: 'bg-orange-500 border-orange-400 text-white' },
  { value: 8,  label: '8',  desc: 'Muy duro',     color: 'bg-orange-600 border-orange-500 text-white' },
  { value: 9,  label: '9',  desc: 'Casi máximo',  color: 'bg-red-600 border-red-500 text-white' },
  { value: 10, label: '10', desc: 'Máximo',       color: 'bg-red-700 border-red-600 text-white' },
]
const rpeInactive = 'bg-gray-800 border-gray-700 text-gray-400'

// ── Componente selector de ejercicio con búsqueda ────────────────────────────
function ExerciseSearch({ exercises, value, onChange }) {
  const [query, setQuery]     = useState('')
  const [open, setOpen]       = useState(false)
  const ref                   = useRef(null)

  // Nombre del ejercicio seleccionado
  const selected = exercises.find(e => e.id === value)

  // Filtrar por nombre o grupo muscular
  const filtered = query.trim()
    ? exercises.filter(e =>
        e.name.toLowerCase().includes(query.toLowerCase()) ||
        e.muscle_group.toLowerCase().includes(query.toLowerCase())
      )
    : exercises

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const pick = (ex) => {
    onChange(ex.id)
    setQuery('')
    setOpen(false)
  }

  // Agrupar ejercicios por músculo para mostrar secciones
  const grouped = filtered.reduce((acc, ex) => {
    if (!acc[ex.muscle_group]) acc[ex.muscle_group] = []
    acc[ex.muscle_group].push(ex)
    return acc
  }, {})

  return (
    <div ref={ref} className="relative">
      {/* Campo — muestra el seleccionado o el buscador */}
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setQuery('') }}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-colors
          ${open ? 'border-blue-500 bg-gray-800' : 'border-gray-700 bg-gray-800 hover:border-gray-600'}
        `}
      >
        {selected ? (
          <span className="text-white font-medium text-sm">{selected.name}
            <span className="text-gray-500 font-normal ml-1.5 text-xs">({selected.muscle_group})</span>
          </span>
        ) : (
          <span className="text-gray-500 text-sm">— Selecciona un ejercicio —</span>
        )}
        <span className={`text-gray-500 text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
          {/* Buscador */}
          <div className="p-3 border-b border-gray-800">
            <input
              autoFocus
              type="text"
              placeholder="Buscar ejercicio o músculo..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Lista */}
          <div className="max-h-64 overflow-y-auto">
            {Object.keys(grouped).length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">Sin resultados</p>
            ) : (
              Object.entries(grouped).map(([muscle, exs]) => (
                <div key={muscle}>
                  {/* Cabecera de grupo */}
                  <p className="px-4 py-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-950/50 sticky top-0">
                    {muscle}
                  </p>
                  {exs.map(ex => (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => pick(ex)}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors active:bg-gray-700
                        ${ex.id === value ? 'bg-blue-900/40 text-blue-300' : 'text-gray-200 hover:bg-gray-800'}
                      `}
                    >
                      {ex.name}
                      {ex.id === value && <span className="ml-2 text-blue-400 text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function LogWorkoutPage() {
  const navigate = useNavigate()
  const { exercises } = useExercises()
  const { saveSession } = useSessions()

  const [sessionName, setSessionName] = useState('')
  const [session, setSession]         = useState([newEntry()])
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState(false)

  const setExercise = (uid, exerciseId) =>
    setSession(p => p.map(e => e.uid === uid ? { ...e, exerciseId } : e))

  const updateSet = (uid, setId, field, value) =>
    setSession(p => p.map(e => e.uid !== uid ? e : {
      ...e, sets: e.sets.map(s => s.id === setId ? { ...s, [field]: value } : s)
    }))

  const addSet = (uid) =>
    setSession(p => p.map(e => e.uid !== uid ? e : {
      ...e, sets: [...e.sets, newSet(e.sets.at(-1))]
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
      for (const s of entry.sets)
        if (!s.weight || !s.reps) return setError('Completa peso y reps en todas las series')
    }
    setSaving(true)
    const exNames   = session.map(e => exercises.find(x => x.id === e.exerciseId)?.name ?? '')
    const finalName = sessionName.trim() || exNames.filter(Boolean).join(' · ')
    const logs      = session.flatMap((entry, ei) =>
      entry.sets.map((s, si) => ({
        exerciseId: entry.exerciseId,
        weight:     parseFloat(s.weight),
        reps:       parseInt(s.reps),
        rpe:        parseInt(s.rpe),
        notes:      `Ej ${ei+1} · Serie ${si+1}`,
      }))
    )
    const { error } = await saveSession({ name: finalName, logs })
    if (error) { setError('Error al guardar. Inténtalo de nuevo.'); setSaving(false); return }
    setSuccess(true)
    setTimeout(() => navigate('/history'), 1800)
    setSaving(false)
  }

  const totalSets = session.reduce((s, e) => s + e.sets.length, 0)

  if (success) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-4">
      <div className="text-6xl animate-bounce">✅</div>
      <p className="text-2xl font-bold text-green-400">¡Sesión guardada!</p>
      <p className="text-gray-400">{totalSets} series · {session.length} ejercicio{session.length > 1 ? 's' : ''}</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-6 space-y-4">

      <div>
        <h1 className="text-xl font-bold text-white">➕ Nueva sesión</h1>
        <p className="text-gray-500 text-xs mt-0.5">{session.length} ejercicio{session.length > 1 ? 's' : ''} · {totalSets} series</p>
      </div>

      <input
        type="text"
        placeholder='Nombre de la sesión — opcional'
        value={sessionName}
        onChange={e => setSessionName(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border bg-gray-900 border-gray-700 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {session.map((entry, exIdx) => (
        <div key={entry.uid} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">

          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ejercicio {exIdx + 1}</span>
            {session.length > 1 && (
              <button onClick={() => removeExercise(entry.uid)} className="text-xs text-red-500">Eliminar</button>
            )}
          </div>

          <div className="px-4 pt-3 pb-2">
            <ExerciseSearch
              exercises={exercises}
              value={entry.exerciseId}
              onChange={(id) => setExercise(entry.uid, id)}
            />
          </div>

          <div className="px-4 pb-3 space-y-3">
            {entry.sets.map((set, si) => (
              <div key={set.id} className="bg-gray-800 rounded-xl p-3 space-y-3">

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500">Serie {si + 1}</span>
                  <button onClick={() => removeSet(entry.uid, set.id)} disabled={entry.sets.length === 1}
                    className="text-gray-600 hover:text-red-400 disabled:opacity-20 text-sm transition-colors">✕</button>
                </div>

                {/* Peso y Reps */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-medium">Peso (kg)</label>
                    <input
                      type="number" inputMode="decimal" step="0.5" min="0" placeholder="0"
                      value={set.weight}
                      onChange={e => updateSet(entry.uid, set.id, 'weight', e.target.value)}
                      className="w-full px-3 py-3 rounded-xl border bg-gray-900 border-gray-700 text-white text-lg font-bold text-center placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-medium">Repeticiones</label>
                    <input
                      type="number" inputMode="numeric" min="1" max="500" placeholder="0"
                      value={set.reps}
                      onChange={e => updateSet(entry.uid, set.id, 'reps', e.target.value)}
                      className="w-full px-3 py-3 rounded-xl border bg-gray-900 border-gray-700 text-white text-lg font-bold text-center placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* RPE 6-10 compacto */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-500 font-medium">Esfuerzo (RPE)</label>
                    {/* Descripción del RPE elegido */}
                    <span className={`text-xs font-semibold ${
                      set.rpe <= 7 ? 'text-yellow-400' : set.rpe <= 8 ? 'text-orange-400' : 'text-red-400'
                    }`}>
                      {RPE_OPTIONS.find(r => r.value === set.rpe)?.desc ?? ''}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {RPE_OPTIONS.map(r => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => updateSet(entry.uid, set.id, 'rpe', r.value)}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all active:scale-95 ${
                          set.rpe === r.value ? r.color : rpeInactive
                        }`}
                      >
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
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Guardando...
          </span>
        ) : `Guardar sesión · ${totalSets} serie${totalSets !== 1 ? 's' : ''}`}
      </button>
    </div>
  )
}
