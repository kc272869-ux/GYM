/**
 * pages/DashboardPage.jsx
 * -----------------------
 * Página principal después del login.
 * Muestra resumen rápido, últimos registros y recomendaciones.
 */
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useWorkouts } from '../hooks/useWorkouts'
import { getRecommendation } from '../utils/recommendations'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function DashboardPage() {
  const { user } = useAuth()
  const { workouts, loading } = useWorkouts()

  // Obtener nombre de usuario del email (antes del @)
  const username = user?.email?.split('@')[0]

  // Agrupar últimos registros por ejercicio para las recomendaciones
  const exerciseGroups = useMemo(() => {
    const groups = {}
    workouts.forEach(w => {
      const name = w.exercises?.name || 'Sin nombre'
      if (!groups[name]) groups[name] = []
      groups[name].push(w)
    })
    return groups
  }, [workouts])

  // Estadísticas rápidas
  const stats = useMemo(() => ({
    totalWorkouts: workouts.length,
    thisWeek: workouts.filter(w => {
      const days = (Date.now() - new Date(w.logged_at)) / (1000 * 60 * 60 * 24)
      return days <= 7
    }).length,
    exercises: Object.keys(exerciseGroups).length,
  }), [workouts, exerciseGroups])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

      {/* Saludo */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          ¡Hola, <span className="text-blue-400">{username}</span>! 👋
        </h1>
        <p className="text-gray-400 mt-1">Aquí está tu resumen de entrenamiento</p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="text-3xl font-bold text-blue-400">{stats.totalWorkouts}</p>
          <p className="text-sm text-gray-400 mt-1">Registros totales</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-green-400">{stats.thisWeek}</p>
          <p className="text-sm text-gray-400 mt-1">Esta semana</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-purple-400">{stats.exercises}</p>
          <p className="text-sm text-gray-400 mt-1">Ejercicios distintos</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Últimos registros */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Últimos registros</h2>
            <Link to="/history">
              <Button variant="ghost" size="sm">Ver todos →</Button>
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-14 bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : workouts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-4xl mb-2">🏋️</p>
              <p>Sin registros aún.</p>
              <Link to="/log">
                <Button size="sm" className="mt-3">Registrar primer entrenamiento</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {workouts.slice(0, 5).map(w => (
                <div key={w.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-gray-200">{w.exercises?.name}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(w.logged_at), "d MMM yyyy", { locale: es })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{w.weight_kg} kg</p>
                    <p className="text-xs text-gray-500">{w.sets}×{w.reps} · RPE {w.rpe}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recomendaciones */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Recomendaciones</h2>
            <Badge color="blue">IA Simple</Badge>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-20 bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : Object.keys(exerciseGroups).length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">
              Registra entrenamientos para ver recomendaciones
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(exerciseGroups).slice(0, 4).map(([name, logs]) => {
                const rec = getRecommendation(logs)
                return (
                  <div key={name} className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-sm text-gray-200">{name}</p>
                      <Badge color={rec.badgeColor || 'gray'}>
                        {rec.action === 'increase' ? '⬆️ Subir' :
                         rec.action === 'decrease' ? '⬇️ Bajar' : '➡️ Mantener'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{rec.message}</p>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

      </div>

      {/* Acceso rápido */}
      <Card>
        <h2 className="font-semibold text-white mb-4">Acceso rápido</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[
            { to: '/log',       icon: '➕', label: 'Registrar' },
            { to: '/exercises', icon: '💪', label: 'Ejercicios' },
            { to: '/history',   icon: '📋', label: 'Historial' },
            { to: '/progress',  icon: '📈', label: 'Progreso' },
            { to: '/routines',  icon: '🗓️', label: 'Rutinas' },
          ].map(item => (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center gap-2 p-4 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-medium text-gray-300">{item.label}</span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}
