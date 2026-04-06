/**
 * pages/ProgressPage.jsx
 * ----------------------
 * Progresión por ejercicio: peso máximo, volumen y 1RM estimado por sesión.
 * Tabs + filtro de rango de fechas.
 */
import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { useWorkouts }  from '../hooks/useWorkouts'
import { useExercises } from '../hooks/useExercises'
import { useUnits }     from '../context/UnitsContext'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

// Epley 1RM: peso × (1 + reps/30)
const epley = (w, r) => r === 1 ? w : Math.round(w * (1 + r / 30) * 10) / 10

const dayKey = (date) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

const RANGES = [
  { label: '30d',  days: 30  },
  { label: '90d',  days: 90  },
  { label: '6m',   days: 182 },
  { label: 'Todo', days: null },
]

const TABS = [
  { key: 'weight', label: 'Peso máx',  color: '#3b82f6' },
  { key: 'volume', label: 'Volumen',   color: '#a855f7' },
  { key: 'orm',    label: '1RM est.',  color: '#10b981' },
]

function buildChartOptions(color, yLabel) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111827',
        borderColor: '#374151',
        borderWidth: 1,
        titleColor: '#f9fafb',
        bodyColor: '#9ca3af',
        callbacks: { label: ctx => ` ${ctx.parsed.y} ${yLabel}` },
      },
    },
    scales: {
      x: { ticks: { color: '#6b7280', font: { size: 11 }, maxTicksLimit: 6 }, grid: { color: '#1f293755' } },
      y: { ticks: { color: '#6b7280', font: { size: 11 }, callback: v => `${v}` }, grid: { color: '#1f293755' } },
    },
  }
}

export default function ProgressPage() {
  const { workouts, loading } = useWorkouts()
  const { exercises }         = useExercises()
  const { toDisplay, label }  = useUnits()

  const [selectedEx,  setSelectedEx]  = useState('')
  const [activeTab,   setActiveTab]   = useState('weight')
  const [rangeDays,   setRangeDays]   = useState(90)
  const [searchOpen,  setSearchOpen]  = useState(false)
  const [query,       setQuery]       = useState('')
  const searchRef                     = useRef(null)

  useEffect(() => {
    const h = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Ejercicios con datos
  const exercisesWithData = useMemo(() => {
    const ids = new Set(workouts.map(w => w.exercise_id))
    return exercises.filter(e => ids.has(e.id))
  }, [workouts, exercises])

  // Logs del ejercicio seleccionado, dentro del rango
  const filteredLogs = useMemo(() => {
    if (!selectedEx) return []
    return workouts.filter(w => {
      if (w.exercise_id !== selectedEx) return false
      if (!rangeDays) return true
      const diff = (Date.now() - new Date(w.logged_at)) / (1000 * 60 * 60 * 24)
      return diff <= rangeDays
    })
  }, [workouts, selectedEx, rangeDays])

  // Agrupar por sesión (día) → métricas por sesión
  const sessionPoints = useMemo(() => {
    const map = {}
    filteredLogs.forEach(l => {
      const k = dayKey(l.logged_at)
      if (!map[k]) map[k] = { date: k, logs: [] }
      map[k].logs.push(l)
    })
    return Object.values(map)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(({ date, logs }) => {
        const validLogs = logs.filter(l => l.weight_kg && l.reps)
        const maxW  = validLogs.length ? Math.max(...validLogs.map(l => l.weight_kg)) : 0
        const vol   = validLogs.reduce((s, l) => s + l.weight_kg * l.reps, 0)
        const orm   = validLogs.length ? Math.max(...validLogs.map(l => epley(l.weight_kg, l.reps))) : 0
        return { date, maxW, vol, orm }
      })
  }, [filteredLogs])

  const fmtDate = (d) => {
    const [, m, day] = d.split('-')
    const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
    return `${parseInt(day)} ${months[parseInt(m)-1]}`
  }

  const tab = TABS.find(t => t.key === activeTab)

  const chartValues = sessionPoints.map(p =>
    activeTab === 'weight' ? toDisplay(p.maxW) :
    activeTab === 'volume' ? Math.round(p.vol)  : toDisplay(p.orm)
  )

  const yLabel = activeTab === 'volume' ? 'kg vol.' : label

  const chartData = {
    labels: sessionPoints.map(p => fmtDate(p.date)),
    datasets: [{
      data: chartValues,
      borderColor: tab.color,
      backgroundColor: tab.color + '18',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: tab.color,
      pointRadius: sessionPoints.length > 20 ? 2 : 4,
      pointHoverRadius: 6,
    }],
  }

  // Stats resumen
  const allWeights = sessionPoints.map(p => p.maxW).filter(Boolean)
  const allOrms    = sessionPoints.map(p => p.orm).filter(Boolean)
  const allRpes    = filteredLogs.map(l => l.rpe).filter(Boolean)

  const stats = selectedEx && sessionPoints.length > 0 ? [
    { label: 'Peso máx',   value: allWeights.length ? `${toDisplay(Math.max(...allWeights))} ${label}` : '—' },
    { label: '1RM est.',   value: allOrms.length    ? `${toDisplay(Math.max(...allOrms))} ${label}`    : '—',  color: 'text-green-400' },
    { label: 'Sesiones',   value: sessionPoints.length },
    { label: 'RPE prom.',  value: allRpes.length    ? (allRpes.reduce((a,b) => a+b,0) / allRpes.length).toFixed(1) : '—' },
  ] : []

  const selectedExName = exercises.find(e => e.id === selectedEx)?.name ?? ''

  // Ejercicios con datos filtrados por búsqueda, agrupados por músculo
  const filteredForSearch = useMemo(() => {
    const list = query.trim()
      ? exercisesWithData.filter(e =>
          e.name.toLowerCase().includes(query.toLowerCase()) ||
          e.muscle_group.toLowerCase().includes(query.toLowerCase()))
      : exercisesWithData
    const grouped = {}
    list.forEach(ex => {
      if (!grouped[ex.muscle_group]) grouped[ex.muscle_group] = []
      grouped[ex.muscle_group].push(ex)
    })
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
  }, [exercisesWithData, query])

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-6 space-y-4">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Progreso</h1>
        <p className="text-gray-500 text-xs mt-0.5">Evolución por ejercicio</p>
      </div>

      {/* Selector ejercicio — buscador custom */}
      <div ref={searchRef} className="relative">
        <button
          type="button"
          onClick={() => { setSearchOpen(o => !o); setQuery('') }}
          className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border text-left transition-colors ${
            searchOpen ? 'border-blue-500 bg-gray-800' : 'border-gray-800 bg-gray-900'}`}>
          {selectedEx
            ? <div className="min-w-0">
                <p className="text-white font-medium text-sm truncate">{selectedExName}</p>
                <p className="text-gray-500 text-xs">{exercises.find(e => e.id === selectedEx)?.muscle_group}</p>
              </div>
            : <span className="text-gray-500 text-sm">Selecciona un ejercicio</span>
          }
          <span className={`text-gray-500 text-xs transition-transform ml-2 shrink-0 ${searchOpen ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {searchOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-xl shadow-black/40">
            {/* Buscador */}
            <div className="p-2 border-b border-gray-800">
              <input
                autoFocus
                type="text"
                placeholder="Buscar ejercicio..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Lista agrupada */}
            <div className="max-h-72 overflow-y-auto">
              {filteredForSearch.length === 0 ? (
                <p className="text-center text-gray-600 text-sm py-6">Sin resultados</p>
              ) : filteredForSearch.map(([muscle, exs]) => (
                <div key={muscle}>
                  <p className="px-4 py-1.5 text-[10px] font-bold text-gray-600 uppercase tracking-wider bg-gray-900/80 sticky top-0">
                    {muscle}
                  </p>
                  {exs.map(ex => (
                    <button key={ex.id} type="button"
                      onClick={() => { setSelectedEx(ex.id); setSearchOpen(false); setQuery('') }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-gray-800 active:bg-gray-700 ${
                        selectedEx === ex.id ? 'text-blue-400 font-medium' : 'text-gray-300'}`}>
                      {ex.name}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {!selectedEx ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl py-16 text-center">
          <p className="text-gray-700 text-sm">Selecciona un ejercicio</p>
          {exercisesWithData.length === 0 && !loading && (
            <p className="text-gray-700 text-xs mt-1">Registra entrenamientos primero</p>
          )}
        </div>
      ) : (
        <>
          {/* Tabs métrica + rango */}
          <div className="flex items-center justify-between gap-3">
            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-gray-900 border border-gray-800 rounded-xl">
              {TABS.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === t.key ? 'bg-gray-700 text-white' : 'text-gray-500'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Rango */}
            <div className="flex gap-1 p-1 bg-gray-900 border border-gray-800 rounded-xl">
              {RANGES.map(r => (
                <button key={r.label} onClick={() => setRangeDays(r.days)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    rangeDays === r.days ? 'bg-gray-700 text-white' : 'text-gray-500'}`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Gráfico */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-white">{selectedExName}</p>
              <span className="text-xs font-medium px-2 py-1 rounded-full"
                style={{ background: tab.color + '20', color: tab.color }}>
                {tab.label}
              </span>
            </div>

            {sessionPoints.length < 2 ? (
              <div className="h-40 flex items-center justify-center">
                <p className="text-gray-600 text-sm">
                  {sessionPoints.length === 0 ? 'Sin datos en este rango' : 'Necesitas al menos 2 sesiones'}
                </p>
              </div>
            ) : (
              <div className="h-48">
                <Line data={chartData} options={buildChartOptions(tab.color, yLabel)} />
              </div>
            )}
          </div>

          {/* Stats */}
          {stats.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {stats.map(s => (
                <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-3 text-center">
                  <p className={`text-lg font-bold ${s.color ?? 'text-blue-400'}`}>{s.value}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Info 1RM */}
          {activeTab === 'orm' && (
            <p className="text-xs text-gray-600 text-center">
              1RM estimado con fórmula de Epley: peso × (1 + reps/30)
            </p>
          )}
        </>
      )}
    </div>
  )
}
