/**
 * pages/RoutinesPage.jsx
 * ----------------------
 * Gestión de rutinas de entrenamiento.
 * Permite crear rutinas y asignarles ejercicios.
 */
import { useState } from 'react'
import { useRoutines } from '../hooks/useRoutines'
import { useExercises } from '../hooks/useExercises'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Badge from '../components/ui/Badge'

export default function RoutinesPage() {
  const { routines, loading, createRoutine, addExerciseToRoutine, deleteRoutine } = useRoutines()
  const { exercises } = useExercises()

  const [showForm, setShowForm]       = useState(false)
  const [form, setForm]               = useState({ name: '', description: '' })
  const [saving, setSaving]           = useState(false)
  const [expandedId, setExpandedId]   = useState(null)
  const [addingToId, setAddingToId]   = useState(null)
  const [selectedEx, setSelectedEx]   = useState('')

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    await createRoutine(form.name.trim(), form.description.trim())
    setForm({ name: '', description: '' })
    setShowForm(false)
    setSaving(false)
  }

  const handleAddExercise = async (routineId) => {
    if (!selectedEx) return
    const order = routines.find(r => r.id === routineId)?.routine_exercises?.length || 0
    await addExerciseToRoutine(routineId, selectedEx, order)
    setAddingToId(null)
    setSelectedEx('')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">🗓️ Rutinas</h1>
          <p className="text-gray-400 text-sm mt-1">Organiza tus días de entrenamiento</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nueva rutina'}
        </Button>
      </div>

      {/* Formulario nueva rutina */}
      {showForm && (
        <Card>
          <h2 className="font-semibold text-white mb-4">Crear rutina</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              label="Nombre"
              placeholder="ej: Día A — Pecho y Tríceps"
              value={form.name}
              onChange={e => setForm(p => ({...p, name: e.target.value}))}
              autoFocus
              required
            />
            <Input
              label="Descripción (opcional)"
              placeholder="ej: Entrenamiento push del lunes"
              value={form.description}
              onChange={e => setForm(p => ({...p, description: e.target.value}))}
            />
            <Button type="submit" loading={saving}>Crear rutina</Button>
          </form>
        </Card>
      )}

      {/* Lista de rutinas */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-24 bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      ) : routines.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-4xl mb-3">🗓️</p>
          <p className="text-gray-400">No tienes rutinas aún. ¡Crea una para organizar tus entrenamientos!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {routines.map(routine => (
            <Card key={routine.id}>
              {/* Encabezado de rutina */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">{routine.name}</h3>
                  {routine.description && (
                    <p className="text-sm text-gray-400 mt-0.5">{routine.description}</p>
                  )}
                  <p className="text-xs text-gray-600 mt-1">
                    {routine.routine_exercises?.length || 0} ejercicios
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedId(expandedId === routine.id ? null : routine.id)}
                  >
                    {expandedId === routine.id ? 'Ocultar' : 'Ver ejercicios'}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => confirm('¿Eliminar esta rutina?') && deleteRoutine(routine.id)}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>

              {/* Ejercicios de la rutina (expandible) */}
              {expandedId === routine.id && (
                <div className="mt-4 space-y-3 border-t border-gray-800 pt-4">

                  {/* Lista de ejercicios */}
                  {routine.routine_exercises?.length === 0 ? (
                    <p className="text-gray-500 text-sm">Sin ejercicios aún</p>
                  ) : (
                    <div className="space-y-2">
                      {routine.routine_exercises
                        .sort((a, b) => a.order_index - b.order_index)
                        .map((re, idx) => (
                          <div key={re.id} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                            <span className="text-gray-600 text-sm w-6">{idx + 1}.</span>
                            <div>
                              <p className="text-gray-200 text-sm">{re.exercises?.name}</p>
                              <Badge color="gray">{re.exercises?.muscle_group}</Badge>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  )}

                  {/* Agregar ejercicio a la rutina */}
                  {addingToId === routine.id ? (
                    <div className="flex gap-2 items-end">
                      <Select
                        label="Agregar ejercicio"
                        value={selectedEx}
                        onChange={e => setSelectedEx(e.target.value)}
                        className="flex-1"
                      >
                        <option value="">— Selecciona —</option>
                        {exercises.map(ex => (
                          <option key={ex.id} value={ex.id}>{ex.name}</option>
                        ))}
                      </Select>
                      <Button size="sm" onClick={() => handleAddExercise(routine.id)}>Agregar</Button>
                      <Button size="sm" variant="ghost" onClick={() => setAddingToId(null)}>Cancelar</Button>
                    </div>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => setAddingToId(routine.id)}>
                      + Agregar ejercicio
                    </Button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
