/**
 * pages/LogWorkoutPage.jsx
 * ------------------------
 * Formulario de sesión — optimizado para touch en iPhone.
 * Inputs grandes, RPE con botones en lugar de select, feedback táctil.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExercises } from '../hooks/useExercises'
import { useSessions } from '../hooks/useSessions'

// Color del RPE como fondo de botón
const rpeColor = (n) => {
  if (n <= 4)  return 'bg-green-700 text-green-100 border-green-600'
  if (n <= 6)  return 'bg-yellow-700 text-yellow-100 border-yellow-600'
  if (n <= 8)  return 'bg-orange-700 text-orange-100 border-orange-600'
  return              'bg-red-700 text-red-100 border-red-600'
}
const rpeColorInactive = 'bg-gray-800 text-gray-600 border-gray-700'

const newSet   = (prev = null) => ({ id: crypto.randomUUID(), weight: prev?.weight ?? '', reps: prev?.reps ?? '', rpe: prev?.rpe ?? 7 })
const newEntry = ()            => ({ uid: crypto.randomUUID(), exerciseId: '', sets: [newSet()] })

export default function LogWorkoutPage() {
  const navigate = useNavigate()
  const { exercises } = useExercises()
  const { saveSession } = useSessions()

  const [sessionName, setSessionName] = useState('')
  const [session, setSession]         = useState([newEntry()])
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState(false)

  // ── helpers ──────────────────────────────────────────────────────────────
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

  // ── guardar ───────────────────────────────────────────────────────────────
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

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">➕ Nueva sesión</h1>
        <p className="text-gray-500 text-xs mt-0.5">{session.length} ejercicio{session.length > 1 ? 's' : ''} · {totalSets} series</p>
      </div>

      {/* Nombre de la sesión */}
      <input
        type="text"
        placeholder='Nombre (ej: "Día A — Pecho") — opcional'
        value={sessionName}
        onChange={e => setSessionName(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border bg-gray-900 border-gray-700 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Bloques */}
      {session.map((entry, exIdx) => (
        <div key={entry.uid} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">

          {/* Header bloque */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ejercicio {exIdx + 1}</span>
            {session.length > 1 && (
              <button onClick={() => removeExercise(entry.uid)} className="text-xs text-red-500 hover:text-red-400">
                Eliminar
              </button>
            )}
          </div>

          {/* Selector ejercicio */}
          <div className="px-4 pt-3 pb-2">
            <select
              value={entry.exerciseId}
              onChange={e => setExercise(entry.uid, e.target.value)}
              className="w-full px-3 py-3 rounded-xl border bg-gray-800 border-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Selecciona un ejercicio —</option>
              {exercises.map(ex => (
                <option key={ex.id} value={ex.id}>{ex.name} ({ex.muscle_group})</option>
              ))}
            </select>
          </div>

          {/* Series */}
          <div className="px-4 pb-3 space-y-3">
            {entry.sets.map((set, si) => (
              <div key={set.id} className="bg-gray-800 rounded-xl p-3 space-y-3">
                {/* Número de serie y botón borrar */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500">Serie {si + 1}</span>
                  <button onClick={() => removeSet(entry.uid, set.id)} disabled={entry.sets.length === 1}
                    className="text-gray-600 hover:text-red-400 disabled:opacity-20 text-sm p-1 -m-1 transition-colors">
                    ✕
                  </button>
                </div>

                {/* Peso y Reps en 2 columnas grandes */}
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

                {/* RPE — botones grandes para touch fácil */}
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-500 font-medium">
                    Esfuerzo (RPE) — <span className={`font-bold ${
                      set.rpe <= 4 ? 'text-green-400' : set.rpe <= 6 ? 'text-yellow-400' : set.rpe <= 8 ? 'text-orange-400' : 'text-red-400'
                    }`}>{set.rpe}/10</span>
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => updateSet(entry.uid, set.id, 'rpe', n)}
                        className={`h-10 rounded-lg text-sm font-bold border transition-all active:scale-95 ${
                          set.rpe === n ? rpeColor(n) : rpeColorInactive
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 italic text-center">
                    {set.rpe <= 4 ? 'Fácil — muchas reps en reserva' :
                     set.rpe <= 6 ? 'Moderado — unas 4 reps en reserva' :
                     set.rpe <= 8 ? 'Duro — 1-2 reps en reserva' :
                     'Máximo — sin reserva'}
                  </p>
                </div>
              </div>
            ))}

            {/* Agregar serie */}
            <button onClick={() => addSet(entry.uid)}
              className="w-full py-3 rounded-xl border border-dashed border-gray-700 text-gray-500 hover:border-blue-600 hover:text-blue-400 text-sm transition-colors active:scale-[0.98]">
              + Agregar serie
            </button>
          </div>
        </div>
      ))}

      {/* Agregar ejercicio */}
      <button onClick={addExercise}
        className="w-full py-4 rounded-2xl border border-dashed border-gray-700 text-gray-400 hover:border-blue-600 hover:text-blue-400 font-medium transition-colors active:scale-[0.98]">
        💪 Agregar otro ejercicio
      </button>

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-300">{error}</div>
      )}

      {/* Guardar */}
      <button onClick={handleSave} disabled={saving}
        className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 active:scale-[0.98] text-white font-bold text-base transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20">
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
