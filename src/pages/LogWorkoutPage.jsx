/**
 * pages/LogWorkoutPage.jsx
 * ------------------------
 * Formulario para registrar un nuevo entrenamiento.
 * El usuario elige ejercicio, peso, reps, series y RPE.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExercises } from '../hooks/useExercises'
import { useWorkouts } from '../hooks/useWorkouts'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'

// Descripciones del RPE para guiar al usuario
const RPE_DESCRIPTIONS = {
  1: 'Muy fácil — podrías hacer 10+ reps más',
  2: 'Fácil',
  3: 'Moderado — muchas reps en reserva',
  4: 'Moderado',
  5: 'Algo duro — unas 5 reps en reserva',
  6: 'Duro — unas 4 reps en reserva',
  7: 'Muy duro — 3 reps en reserva',
  8: 'Extremadamente duro — 2 reps en reserva',
  9: 'Casi máximo — 1 rep en reserva',
  10: 'Máximo — sin reps en reserva',
}

const initialForm = {
  exerciseId: '',
  weight: '',
  reps: '',
  sets: '',
  rpe: '7',
  notes: '',
}

export default function LogWorkoutPage() {
  const navigate = useNavigate()
  const { exercises, loading: loadingEx } = useExercises()
  const { logWorkout } = useWorkouts()

  const [form, setForm]     = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.exerciseId) return setError('Selecciona un ejercicio')

    setSaving(true)
    const { error } = await logWorkout({
      exerciseId: form.exerciseId,
      weight:     parseFloat(form.weight),
      reps:       parseInt(form.reps),
      sets:       parseInt(form.sets),
      rpe:        parseInt(form.rpe),
      notes:      form.notes,
    })

    if (error) {
      setError('Error al guardar. Inténtalo de nuevo.')
    } else {
      setSuccess(true)
      setTimeout(() => {
        setForm(initialForm)
        setSuccess(false)
        navigate('/history')
      }, 1500)
    }
    setSaving(false)
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">➕ Registrar entrenamiento</h1>
        <p className="text-gray-400 text-sm mt-1">Guarda tu serie de hoy</p>
      </div>

      <Card>
        {success ? (
          <div className="text-center py-8 space-y-3">
            <div className="text-5xl">✅</div>
            <p className="font-semibold text-green-400 text-lg">¡Registrado con éxito!</p>
            <p className="text-gray-400 text-sm">Redirigiendo al historial...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Selector de ejercicio */}
            <Select
              label="Ejercicio"
              name="exerciseId"
              value={form.exerciseId}
              onChange={handleChange}
              required
            >
              <option value="">— Selecciona un ejercicio —</option>
              {exercises.map(ex => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({ex.muscle_group})
                </option>
              ))}
            </Select>

            {/* Peso, Reps, Series en fila */}
            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Peso (kg)"
                name="weight"
                type="number"
                step="0.5"
                min="0"
                placeholder="60"
                value={form.weight}
                onChange={handleChange}
                required
              />
              <Input
                label="Repeticiones"
                name="reps"
                type="number"
                min="1"
                max="100"
                placeholder="10"
                value={form.reps}
                onChange={handleChange}
                required
              />
              <Input
                label="Series"
                name="sets"
                type="number"
                min="1"
                max="20"
                placeholder="3"
                value={form.sets}
                onChange={handleChange}
                required
              />
            </div>

            {/* RPE con slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-300">
                  Esfuerzo (RPE)
                </label>
                <span className="text-2xl font-bold text-blue-400">{form.rpe}</span>
              </div>
              <input
                type="range"
                name="rpe"
                min="1"
                max="10"
                step="1"
                value={form.rpe}
                onChange={handleChange}
                className="w-full accent-blue-500"
              />
              {/* Descripción del RPE actual */}
              <p className="text-xs text-gray-500 italic">
                {RPE_DESCRIPTIONS[form.rpe]}
              </p>
              {/* Escala visual */}
              <div className="flex justify-between text-xs text-gray-600">
                <span>1 Fácil</span>
                <span>5 Medio</span>
                <span>10 Máximo</span>
              </div>
            </div>

            {/* Notas opcionales */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-300">
                Notas <span className="text-gray-600 font-normal">(opcional)</span>
              </label>
              <textarea
                name="notes"
                rows={2}
                placeholder="Técnica, sensaciones, etc."
                value={form.notes}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border text-sm bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-800 rounded-lg px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <Button type="submit" loading={saving} size="lg" className="w-full">
              Guardar registro
            </Button>
          </form>
        )}
      </Card>
    </div>
  )
}
