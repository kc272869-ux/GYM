/**
 * pages/ProgressPage.jsx
 * ----------------------
 * Muestra gráficos de progresión de peso por ejercicio usando Chart.js.
 * También muestra la recomendación de peso para el ejercicio seleccionado.
 */
import { useState, useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { useWorkouts } from '../hooks/useWorkouts'
import { useExercises } from '../hooks/useExercises'
import { getProgressData, getRecommendation } from '../utils/recommendations'
import Card from '../components/ui/Card'
import Select from '../components/ui/Select'
import Badge from '../components/ui/Badge'

// Registrar módulos de Chart.js (obligatorio antes de usarlos)
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

// Opciones de configuración del gráfico
const chartOptions = {
  responsive: true,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      labels: { color: '#9ca3af', font: { size: 12 } }
    },
    tooltip: {
      backgroundColor: '#1f2937',
      borderColor: '#374151',
      borderWidth: 1,
      titleColor: '#f9fafb',
      bodyColor: '#9ca3af',
    }
  },
  scales: {
    x: {
      ticks: { color: '#6b7280', font: { size: 11 } },
      grid:  { color: '#1f2937' },
    },
    y: {
      ticks: { color: '#6b7280', font: { size: 11 }, callback: v => `${v} kg` },
      grid:  { color: '#1f2937' },
    },
    y1: {
      // Eje secundario para RPE (escala 1-10)
      position: 'right',
      min: 0, max: 10,
      ticks: { color: '#6b7280', font: { size: 11 }, callback: v => `RPE ${v}` },
      grid: { drawOnChartArea: false },
    }
  },
}

export default function ProgressPage() {
  const { workouts, loading } = useWorkouts()
  const { exercises }         = useExercises()
  const [selectedEx, setSelectedEx] = useState('')

  // Agrupar workouts por ejercicio
  const grouped = useMemo(() => {
    const groups = {}
    workouts.forEach(w => {
      if (!groups[w.exercise_id]) groups[w.exercise_id] = []
      groups[w.exercise_id].push(w)
    })
    return groups
  }, [workouts])

  // Obtener datos del ejercicio seleccionado
  const currentLogs = grouped[selectedEx] || []
  const progressData = getProgressData(currentLogs, 15)
  const recommendation = getRecommendation(currentLogs)

  // Construir los datos para Chart.js
  const chartData = {
    labels: progressData.labels,
    datasets: [
      {
        label: 'Peso (kg)',
        data: progressData.weights,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y',
        pointBackgroundColor: '#3b82f6',
        pointRadius: 5,
      },
      {
        label: 'RPE',
        data: progressData.rpes,
        borderColor: '#f59e0b',
        backgroundColor: 'transparent',
        tension: 0.4,
        yAxisID: 'y1',
        borderDash: [4, 4],
        pointBackgroundColor: '#f59e0b',
        pointRadius: 4,
      },
    ],
  }

  // Ejercicios que tienen registros
  const exercisesWithData = exercises.filter(ex => grouped[ex.id]?.length > 0)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-white">📈 Progreso</h1>
        <p className="text-gray-400 text-sm mt-1">Gráficos de evolución por ejercicio</p>
      </div>

      {/* Selector de ejercicio */}
      <Select
        label="Selecciona un ejercicio para ver su progresión"
        value={selectedEx}
        onChange={e => setSelectedEx(e.target.value)}
      >
        <option value="">— Elige un ejercicio —</option>
        {exercisesWithData.map(ex => (
          <option key={ex.id} value={ex.id}>
            {ex.name} ({grouped[ex.id]?.length} registros)
          </option>
        ))}
      </Select>

      {!selectedEx ? (
        <Card className="text-center py-16">
          <p className="text-5xl mb-4">📊</p>
          <p className="text-gray-400">Selecciona un ejercicio para ver su progreso</p>
          {exercisesWithData.length === 0 && !loading && (
            <p className="text-gray-600 text-sm mt-2">Registra entrenamientos primero</p>
          )}
        </Card>
      ) : (
        <>
          {/* Recomendación */}
          <div className={`rounded-xl border p-4 space-y-1 ${
            recommendation.action === 'increase' ? 'bg-green-900/20 border-green-800' :
            recommendation.action === 'decrease' ? 'bg-red-900/20 border-red-800' :
            'bg-yellow-900/20 border-yellow-800'
          }`}>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">Recomendación</span>
              <Badge color={recommendation.badgeColor}>
                {recommendation.action === 'increase' ? '⬆️ Subir peso' :
                 recommendation.action === 'decrease' ? '⬇️ Bajar peso' : '➡️ Mantener'}
              </Badge>
            </div>
            <p className="text-gray-300 text-sm">{recommendation.message}</p>
            {recommendation.suggestedWeight && (
              <p className="text-white font-bold">
                Peso sugerido próxima sesión:{' '}
                <span className="text-blue-400">{recommendation.suggestedWeight} kg</span>
              </p>
            )}
          </div>

          {/* Gráfico */}
          <Card>
            <h2 className="font-semibold text-white mb-4">
              Evolución de peso y RPE — últimas 15 sesiones
            </h2>
            {progressData.labels.length < 2 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                Necesitas al menos 2 registros para ver la gráfica
              </p>
            ) : (
              <Line data={chartData} options={chartOptions} />
            )}
          </Card>

          {/* Estadísticas del ejercicio */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Máximo peso', value: `${Math.max(...currentLogs.map(l => l.weight_kg))} kg` },
              { label: 'Peso actual', value: `${currentLogs[0]?.weight_kg} kg` },
              { label: 'Sesiones totales', value: currentLogs.length },
              { label: 'RPE promedio', value: (currentLogs.reduce((s, l) => s + l.rpe, 0) / currentLogs.length).toFixed(1) },
            ].map(stat => (
              <Card key={stat.label} className="text-center">
                <p className="text-xl font-bold text-blue-400">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
