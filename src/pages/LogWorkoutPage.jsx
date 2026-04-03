/**
 * pages/LogWorkoutPage.jsx
 * ------------------------
 * Formulario de sesión completa de entrenamiento.
 *
 * Estructura de datos en memoria (antes de guardar):
 *   session = [
 *     {
 *       exerciseId: "uuid",
 *       exerciseName: "Press de banca",
 *       sets: [
 *         { id: 1, weight: 60, reps: 10, rpe: 7 },
 *         { id: 2, weight: 62.5, reps: 8, rpe: 8 },
 *       ]
 *     },
 *     { ... otro ejercicio ... }
 *   ]
 *
 * Al guardar, se inserta un workout_log por cada serie (set) de cada ejercicio.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExercises } from '../hooks/useExercises'
import { useWorkouts } from '../hooks/useWorkouts'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'

const RPE_COLORS = {
  1: 'text-green-400', 2: 'text-green-400', 3: 'text-green-400',
  4: 'text-green-400', 5: 'text-yellow-400', 6: 'text-yellow-400',
  7: 'text-orange-400', 8: 'text-orange-400',
  9: 'text-red-400', 10: 'text-red-400',
}

// Crea una serie vacía con valores por defecto
const newSet = (prevSet = null) => ({
  id:     Date.now() + Math.random(), // id temporal solo para React key
  weight: prevSet?.weight ?? '',      // prellenar con el peso de la serie anterior
  reps:   prevSet?.reps   ?? '',
  rpe:    prevSet?.rpe    ?? 7,
})

// Crea una entrada de ejercicio vacía en la sesión
const newExerciseEntry = () => ({
  uid:          Date.now() + Math.random(),
  exerciseId:   '',
  exerciseName: '',
  sets:         [newSet()],  // comienza con 1 serie vacía
})

export default function LogWorkoutPage() {
  const navigate = useNavigate()
  const { exercises } = useExercises()
  const { logWorkout } = useWorkouts()

  // La sesión es un array de ejercicios, cada uno con su array de series
  const [session, setSession] = useState([newExerciseEntry()])
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  // ── Helpers para modificar el estado anidado ──────────────────────────────

  // Cambiar el ejercicio seleccionado de una entrada
  const setExercise = (uid, exerciseId) => {
    const ex = exercises.find(e => e.id === exerciseId)
    setSession(prev => prev.map(entry =>
      entry.uid === uid
        ? { ...entry, exerciseId, exerciseName: ex?.name ?? '' }
        : entry
    ))
  }

  // Cambiar un campo de una serie específica (weight, reps, rpe)
  const updateSet = (uid, setId, field, value) => {
    setSession(prev => prev.map(entry => {
      if (entry.uid !== uid) return entry
      return {
        ...entry,
        sets: entry.sets.map(s =>
          s.id === setId ? { ...s, [field]: value } : s
        )
      }
    }))
  }

  // Agregar una nueva serie al ejercicio (prellenada con los valores de la última)
  const addSet = (uid) => {
    setSession(prev => prev.map(entry => {
      if (entry.uid !== uid) return entry
      const last = entry.sets[entry.sets.length - 1]
      return { ...entry, sets: [...entry.sets, newSet(last)] }
    }))
  }

  // Eliminar una serie de un ejercicio
  const removeSet = (uid, setId) => {
    setSession(prev => prev.map(entry => {
      if (entry.uid !== uid) return entry
      if (entry.sets.length === 1) return entry // no eliminar la última
      return { ...entry, sets: entry.sets.filter(s => s.id !== setId) }
    }))
  }

  // Agregar un nuevo ejercicio a la sesión
  const addExercise = () => {
    setSession(prev => [...prev, newExerciseEntry()])
  }

  // Eliminar un ejercicio completo de la sesión
  const removeExercise = (uid) => {
    if (session.length === 1) return // no eliminar el último
    setSession(prev => prev.filter(e => e.uid !== uid))
  }

  // ── Guardar toda la sesión ────────────────────────────────────────────────
  const handleSave = async () => {
    setError('')

    // Validar que todos los ejercicios tengan ejercicio seleccionado y series con datos
    for (const entry of session) {
      if (!entry.exerciseId) return setError('Selecciona un ejercicio en cada bloque')
      for (const set of entry.sets) {
        if (!set.weight || !set.reps) return setError('Completa peso y reps en todas las series')
      }
    }

    setSaving(true)

    // Guardar cada serie de cada ejercicio como un workout_log individual
    // Usamos Promise.all para enviar todo en paralelo (más rápido)
    const allSets = session.flatMap(entry =>
      entry.sets.map((set, idx) => ({
        exerciseId: entry.exerciseId,
        weight:     parseFloat(set.weight),
        reps:       parseInt(set.reps),
        sets:       1,           // cada log = 1 serie
        rpe:        parseInt(set.rpe),
        notes:      `Serie ${idx + 1}`,
      }))
    )

    const results = await Promise.all(allSets.map(s => logWorkout(s)))
    const failed  = results.find(r => r.error)

    if (failed) {
      setError('Error al guardar. Inténtalo de nuevo.')
    } else {
      setSuccess(true)
      setTimeout(() => navigate('/history'), 1800)
    }
    setSaving(false)
  }

  // Total de series en la sesión (para mostrar en el botón)
  const totalSets = session.reduce((sum, e) => sum + e.sets.length, 0)

  // ── UI ────────────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="text-6xl">✅</div>
        <p className="text-2xl font-bold text-green-400">¡Sesión guardada!</p>
        <p className="text-gray-400">
          {totalSets} series de {session.length} ejercicio{session.length > 1 ? 's' : ''} registradas.
        </p>
        <p className="text-gray-600 text-sm">Redirigiendo al historial...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">➕ Registrar sesión</h1>
          <p className="text-gray-400 text-sm mt-1">
            {session.length} ejercicio{session.length > 1 ? 's' : ''} · {totalSets} series
          </p>
        </div>
      </div>

      {/* Un bloque por cada ejercicio de la sesión */}
      {session.map((entry, exIdx) => (
        <Card key={entry.uid} className="space-y-4">

          {/* Encabezado del bloque */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Ejercicio {exIdx + 1}
            </span>
            {session.length > 1 && (
              <button
                onClick={() => removeExercise(entry.uid)}
                className="text-gray-600 hover:text-red-400 text-sm transition-colors"
              >
                Eliminar ejercicio
              </button>
            )}
          </div>

          {/* Selector de ejercicio */}
          <Select
            value={entry.exerciseId}
            onChange={e => setExercise(entry.uid, e.target.value)}
          >
            <option value="">— Selecciona un ejercicio —</option>
            {exercises.map(ex => (
              <option key={ex.id} value={ex.id}>
                {ex.name} ({ex.muscle_group})
              </option>
            ))}
          </Select>

          {/* Tabla de series */}
          <div className="space-y-2">

            {/* Header de columnas */}
            <div className="grid grid-cols-[2rem_1fr_1fr_1fr_2rem] gap-2 px-1">
              <span className="text-xs text-gray-600 text-center">#</span>
              <span className="text-xs text-gray-500 font-medium">Peso (kg)</span>
              <span className="text-xs text-gray-500 font-medium">Reps</span>
              <span className="text-xs text-gray-500 font-medium">RPE</span>
              <span />
            </div>

            {/* Filas de series */}
            {entry.sets.map((set, setIdx) => (
              <div
                key={set.id}
                className="grid grid-cols-[2rem_1fr_1fr_1fr_2rem] gap-2 items-center"
              >
                {/* Número de serie */}
                <span className="text-xs font-bold text-gray-500 text-center">{setIdx + 1}</span>

                {/* Peso */}
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="kg"
                  value={set.weight}
                  onChange={e => updateSet(entry.uid, set.id, 'weight', e.target.value)}
                  className="w-full px-2 py-2 rounded-lg border text-sm bg-gray-800 border-gray-700 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                />

                {/* Reps */}
                <input
                  type="number"
                  min="1"
                  max="500"
                  placeholder="reps"
                  value={set.reps}
                  onChange={e => updateSet(entry.uid, set.id, 'reps', e.target.value)}
                  className="w-full px-2 py-2 rounded-lg border text-sm bg-gray-800 border-gray-700 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                />

                {/* RPE — select compacto con color */}
                <select
                  value={set.rpe}
                  onChange={e => updateSet(entry.uid, set.id, 'rpe', e.target.value)}
                  className={`w-full px-2 py-2 rounded-lg border text-sm bg-gray-800 border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-bold ${RPE_COLORS[set.rpe]}`}
                >
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>

                {/* Botón eliminar serie */}
                <button
                  onClick={() => removeSet(entry.uid, set.id)}
                  disabled={entry.sets.length === 1}
                  className="text-gray-700 hover:text-red-400 transition-colors disabled:opacity-20 text-base text-center"
                  title="Eliminar serie"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Botón agregar serie */}
          <button
            onClick={() => addSet(entry.uid)}
            className="w-full py-2 rounded-lg border border-dashed border-gray-700 text-gray-500 hover:border-blue-600 hover:text-blue-400 text-sm transition-colors"
          >
            + Agregar serie
          </button>

        </Card>
      ))}

      {/* Botón agregar otro ejercicio */}
      <button
        onClick={addExercise}
        className="w-full py-3 rounded-xl border border-dashed border-gray-700 text-gray-400 hover:border-blue-600 hover:text-blue-400 font-medium transition-colors"
      >
        💪 Agregar otro ejercicio
      </button>

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Botón guardar toda la sesión */}
      <Button
        onClick={handleSave}
        loading={saving}
        size="lg"
        className="w-full"
      >
        Guardar sesión completa ({totalSets} series)
      </Button>

    </div>
  )
}
