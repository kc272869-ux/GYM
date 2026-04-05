/**
 * pages/ExercisesPage.jsx
 * -----------------------
 * Lista de ejercicios agrupados por músculo, con filtro dinámico.
 */
import { useState, useMemo } from 'react'
import { useExercises } from '../hooks/useExercises'

const MUSCLE_GROUPS_FORM = [
  'Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps',
  'Cuádriceps', 'Femoral / Glúteo', 'Pantorrilla', 'Abdomen', 'Cardio',
]


const DOT_COLORS = {
  'Pecho':            'bg-blue-400',
  'Espalda':          'bg-purple-400',
  'Hombros':          'bg-cyan-400',
  'Bíceps':           'bg-green-400',
  'Tríceps':          'bg-emerald-400',
  'Cuádriceps':       'bg-orange-400',
  'Femoral / Glúteo': 'bg-pink-400',
  'Pantorrilla':      'bg-rose-400',
  'Abdomen':          'bg-yellow-400',
  'Cardio':           'bg-red-400',
}
const muscleDot = (m) => DOT_COLORS[m] ?? 'bg-gray-500'

export default function ExercisesPage() {
  const { exercises, loading, addExercise } = useExercises()
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState({ name: '', muscleGroup: MUSCLE_GROUPS_FORM[0], type: 'weight_reps' })
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')
  const [filterGroup, setFilterGroup] = useState('Todos')
  const [search, setSearch]         = useState('')

  // Grupos musculares dinámicos desde los ejercicios reales
  const muscleGroups = useMemo(() => {
    const groups = [...new Set(exercises.map(e => e.muscle_group))].sort()
    return groups
  }, [exercises])

  const filtered = useMemo(() => {
    let list = exercises
    if (filterGroup !== 'Todos') list = list.filter(e => e.muscle_group === filterGroup)
    if (search.trim()) list = list.filter(e =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.muscle_group.toLowerCase().includes(search.toLowerCase())
    )
    return list
  }, [exercises, filterGroup, search])

  // Agrupar por músculo para la vista
  const grouped = useMemo(() => {
    const map = {}
    filtered.forEach(ex => {
      if (!map[ex.muscle_group]) map[ex.muscle_group] = []
      map[ex.muscle_group].push(ex)
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return setError('Escribe un nombre')
    setSaving(true)
    const { error: err } = await addExercise(form.name.trim(), form.muscleGroup, form.type)
    if (err) setError('Error al guardar.')
    else { setForm({ name: '', muscleGroup: MUSCLE_GROUPS_FORM[0], type: 'weight_reps' }); setShowForm(false); setError('') }
    setSaving(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-6 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Ejercicios</h1>
          <p className="text-gray-500 text-xs mt-0.5">{exercises.length} disponibles</p>
        </div>
        <button
          onClick={() => { setShowForm(s => !s); setError('') }}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
            showForm ? 'bg-gray-800 text-gray-300' : 'bg-blue-600 text-white'}`}>
          {showForm ? 'Cancelar' : '+ Nuevo'}
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-white">Nuevo ejercicio personalizado</p>

          <input
            autoFocus
            type="text"
            placeholder="Nombre del ejercicio"
            value={form.name}
            onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setError('') }}
            className="w-full px-4 py-3 rounded-xl border bg-gray-800 border-gray-700 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />

          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.muscleGroup}
              onChange={e => setForm(p => ({ ...p, muscleGroup: e.target.value }))}
              className="px-3 py-3 rounded-xl border bg-gray-800 border-gray-700 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {MUSCLE_GROUPS_FORM.map(g => <option key={g}>{g}</option>)}
            </select>

            {/* Tipo */}
            <div className="flex items-center gap-1 p-1 bg-gray-800 border border-gray-700 rounded-xl">
              {[{ v: 'weight_reps', l: 'Peso' }, { v: 'time', l: 'Tiempo' }].map(({ v, l }) => (
                <button key={v} type="button" onClick={() => setForm(p => ({ ...p, type: v }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    form.type === v ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button onClick={handleAdd} disabled={saving}
            className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-bold active:scale-[0.98] transition-all disabled:opacity-60">
            {saving ? 'Guardando...' : 'Guardar ejercicio'}
          </button>
        </div>
      )}

      {/* Buscador */}
      <input
        type="text"
        placeholder="Buscar ejercicio..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border bg-gray-900 border-gray-800 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {['Todos', ...muscleGroups].map(g => (
          <button key={g} onClick={() => setFilterGroup(g)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all active:scale-95 ${
              filterGroup === g ? 'bg-blue-600 text-white' : 'bg-gray-900 border border-gray-800 text-gray-400'}`}>
            {g}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-900 rounded-2xl animate-pulse" />)}
        </div>
      ) : grouped.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl py-12 text-center">
          <p className="text-gray-600 text-sm">No hay ejercicios</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([muscle, exs]) => (
            <div key={muscle} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              {/* Header grupo */}
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-800">
                <div className={`w-2.5 h-2.5 rounded-full ${muscleDot(muscle)}`} />
                <p className="text-sm font-bold text-white">{muscle}</p>
                <span className="text-xs text-gray-600 ml-auto">{exs.length}</span>
              </div>

              {/* Ejercicios */}
              <div className="divide-y divide-gray-800/60">
                {exs.map(ex => (
                  <div key={ex.id} className="flex items-center justify-between px-4 py-3">
                    <p className="text-sm text-gray-200">{ex.name}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      {ex.type === 'time' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20 font-medium">
                          Tiempo
                        </span>
                      )}
                      {!ex.user_id && (
                        <span className="text-[10px] text-gray-700">base</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
