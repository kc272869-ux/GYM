/**
 * pages/ExercisesPage.jsx
 * -----------------------
 * Lista todos los ejercicios disponibles y permite agregar nuevos.
 */
import { useState } from 'react'
import { useExercises } from '../hooks/useExercises'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Badge from '../components/ui/Badge'

// Grupos musculares disponibles
const MUSCLE_GROUPS = [
  'Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps',
  'Piernas', 'Glúteos', 'Abdomen', 'Pantorrillas', 'Cardio'
]

// Color de badge por grupo muscular
const muscleColors = {
  'Pecho':      'blue',
  'Espalda':    'purple',
  'Hombros':    'yellow',
  'Bíceps':     'green',
  'Tríceps':    'orange',
  'Piernas':    'red',
  'Glúteos':    'orange',
  'Abdomen':    'blue',
  'Pantorrillas': 'gray',
  'Cardio':     'green',
}

export default function ExercisesPage() {
  const { exercises, loading, addExercise } = useExercises()
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState({ name: '', muscleGroup: MUSCLE_GROUPS[0] })
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const [filterGroup, setFilterGroup] = useState('Todos')

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return setError('Escribe un nombre')

    setSaving(true)
    const { error } = await addExercise(form.name.trim(), form.muscleGroup)
    if (error) {
      setError('Error al guardar. Inténtalo de nuevo.')
    } else {
      setForm({ name: '', muscleGroup: MUSCLE_GROUPS[0] })
      setShowForm(false)
    }
    setSaving(false)
  }

  // Filtrar ejercicios por grupo muscular
  const filtered = filterGroup === 'Todos'
    ? exercises
    : exercises.filter(e => e.muscle_group === filterGroup)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">💪 Ejercicios</h1>
          <p className="text-gray-400 text-sm mt-1">{exercises.length} ejercicios disponibles</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nuevo ejercicio'}
        </Button>
      </div>

      {/* Formulario para agregar ejercicio */}
      {showForm && (
        <Card>
          <h2 className="font-semibold text-white mb-4">Agregar ejercicio personalizado</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nombre del ejercicio"
                placeholder="ej: Press de banca"
                value={form.name}
                onChange={e => { setForm(p => ({...p, name: e.target.value})); setError('') }}
                error={error}
                autoFocus
              />
              <Select
                label="Grupo muscular"
                value={form.muscleGroup}
                onChange={e => setForm(p => ({...p, muscleGroup: e.target.value}))}
              >
                {MUSCLE_GROUPS.map(g => <option key={g}>{g}</option>)}
              </Select>
            </div>
            <div className="flex gap-3">
              <Button type="submit" loading={saving}>Guardar ejercicio</Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filtros por grupo muscular */}
      <div className="flex flex-wrap gap-2">
        {['Todos', ...MUSCLE_GROUPS].map(g => (
          <button
            key={g}
            onClick={() => setFilterGroup(g)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterGroup === g
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Lista de ejercicios */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500">No hay ejercicios en este grupo</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(ex => (
            <div
              key={ex.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-600 transition-colors"
            >
              <div className="flex justify-between items-start">
                <p className="font-medium text-gray-200">{ex.name}</p>
                {/* user_id null = ejercicio global/predefinido */}
                {!ex.user_id && (
                  <span className="text-xs text-gray-600">global</span>
                )}
              </div>
              <div className="mt-2">
                <Badge color={muscleColors[ex.muscle_group] || 'gray'}>
                  {ex.muscle_group}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
