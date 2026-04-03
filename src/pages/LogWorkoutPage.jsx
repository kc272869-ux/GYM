/**
 * pages/LogWorkoutPage.jsx
 * ------------------------
 * Formulario de sesión: el usuario nombra la sesión opcionalmente,
 * agrega ejercicios y serie por serie. Al guardar se crea una sesión
 * en la tabla `sessions` y sus logs en `workout_logs`.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExercises } from '../hooks/useExercises'
import { useSessions } from '../hooks/useSessions'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'

const RPE_COLORS = {
  1:'text-green-400', 2:'text-green-400', 3:'text-green-400', 4:'text-green-400',
  5:'text-yellow-400', 6:'text-yellow-400',
  7:'text-orange-400', 8:'text-orange-400',
  9:'text-red-400', 10:'text-red-400',
}

const newSet  = (prev = null) => ({ id: crypto.randomUUID(), weight: prev?.weight ?? '', reps: prev?.reps ?? '', rpe: prev?.rpe ?? 7 })
const newEntry = () => ({ uid: crypto.randomUUID(), exerciseId: '', sets: [newSet()] })

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

  const addExercise   = () => setSession(p => [...p, newEntry()])
  const removeExercise = (uid) => session.length > 1 && setSession(p => p.filter(e => e.uid !== uid))

  // ── guardar ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setError('')
    for (const entry of session) {
      if (!entry.exerciseId)            return setError('Selecciona un ejercicio en cada bloque')
      for (const s of entry.sets)
        if (!s.weight || !s.reps)       return setError('Completa peso y reps en todas las series')
    }

    setSaving(true)

    // Nombre automático si el usuario no pone uno
    const exNames    = session.map(e => exercises.find(x => x.id === e.exerciseId)?.name ?? '')
    const autoName   = exNames.filter(Boolean).join(' · ')
    const finalName  = sessionName.trim() || autoName

    // Aplanar: un objeto por cada set de cada ejercicio
    const logs = session.flatMap((entry, ei) =>
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

  // ── UI ────────────────────────────────────────────────────────────────────
  if (success) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
      <div className="text-6xl">✅</div>
      <p className="text-2xl font-bold text-green-400">¡Sesión guardada!</p>
      <p className="text-gray-400">{totalSets} series · {session.length} ejercicio{session.length > 1 ? 's' : ''}</p>
      <p className="text-gray-600 text-sm">Redirigiendo al historial...</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">➕ Nueva sesión</h1>
        <p className="text-gray-500 text-sm mt-1">{session.length} ejercicio{session.length > 1 ? 's' : ''} · {totalSets} series</p>
      </div>

      {/* Nombre de la sesión */}
      <Input
        placeholder='Nombre de la sesión (ej: "Día A — Pecho") — opcional'
        value={sessionName}
        onChange={e => setSessionName(e.target.value)}
      />

      {/* Bloques de ejercicio */}
      {session.map((entry, exIdx) => (
        <Card key={entry.uid} className="space-y-4">

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Ejercicio {exIdx + 1}
            </span>
            {session.length > 1 && (
              <button onClick={() => removeExercise(entry.uid)} className="text-xs text-gray-600 hover:text-red-400 transition-colors">
                Eliminar
              </button>
            )}
          </div>

          <Select value={entry.exerciseId} onChange={e => setExercise(entry.uid, e.target.value)}>
            <option value="">— Selecciona un ejercicio —</option>
            {exercises.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.name} ({ex.muscle_group})</option>
            ))}
          </Select>

          {/* Cabecera columnas */}
          <div className="grid grid-cols-[1.5rem_1fr_1fr_1fr_1.5rem] gap-2 px-1">
            <span className="text-xs text-gray-600 text-center">#</span>
            <span className="text-xs text-gray-500 text-center font-medium">kg</span>
            <span className="text-xs text-gray-500 text-center font-medium">Reps</span>
            <span className="text-xs text-gray-500 text-center font-medium">RPE</span>
            <span />
          </div>

          {/* Series */}
          <div className="space-y-2">
            {entry.sets.map((set, si) => (
              <div key={set.id} className="grid grid-cols-[1.5rem_1fr_1fr_1fr_1.5rem] gap-2 items-center">
                <span className="text-xs text-gray-600 text-center font-bold">{si + 1}</span>
                <input type="number" step="0.5" min="0" placeholder="kg" value={set.weight}
                  onChange={e => updateSet(entry.uid, set.id, 'weight', e.target.value)}
                  className="w-full px-2 py-2 rounded-lg border text-sm bg-gray-800 border-gray-700 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center" />
                <input type="number" min="1" max="500" placeholder="reps" value={set.reps}
                  onChange={e => updateSet(entry.uid, set.id, 'reps', e.target.value)}
                  className="w-full px-2 py-2 rounded-lg border text-sm bg-gray-800 border-gray-700 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center" />
                <select value={set.rpe} onChange={e => updateSet(entry.uid, set.id, 'rpe', e.target.value)}
                  className={`w-full px-2 py-2 rounded-lg border text-sm bg-gray-800 border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-bold ${RPE_COLORS[set.rpe]}`}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <button onClick={() => removeSet(entry.uid, set.id)} disabled={entry.sets.length === 1}
                  className="text-gray-700 hover:text-red-400 transition-colors disabled:opacity-20 text-sm text-center">✕</button>
              </div>
            ))}
          </div>

          <button onClick={() => addSet(entry.uid)}
            className="w-full py-2 rounded-lg border border-dashed border-gray-700 text-gray-500 hover:border-blue-600 hover:text-blue-400 text-sm transition-colors">
            + Agregar serie
          </button>
        </Card>
      ))}

      {/* Agregar ejercicio */}
      <button onClick={addExercise}
        className="w-full py-3 rounded-xl border border-dashed border-gray-700 text-gray-400 hover:border-blue-600 hover:text-blue-400 font-medium transition-colors">
        💪 Agregar otro ejercicio
      </button>

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg px-4 py-3 text-sm text-red-300">{error}</div>
      )}

      <Button onClick={handleSave} loading={saving} size="lg" className="w-full">
        Guardar sesión · {totalSets} series
      </Button>
    </div>
  )
}
