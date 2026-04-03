/**
 * pages/DashboardPage.jsx
 * -----------------------
 * Dashboard principal: resumen, últimas sesiones y recomendaciones.
 */
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useWorkouts } from '../hooks/useWorkouts'
import { useSessions } from '../hooks/useSessions'
import { getRecommendation } from '../utils/recommendations'
import Badge from '../components/ui/Badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// ── Componente de stat card ──────────────────────────────────────────────
function StatCard({ value, label, color, icon }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

const rpeBadgeColor = (rpe) => rpe <= 6 ? 'green' : rpe <= 8 ? 'yellow' : 'red'

export default function DashboardPage() {
  const { user } = useAuth()
  const { workouts, loading: loadingW } = useWorkouts()
  const { sessions, loading: loadingS } = useSessions()

  const username = user?.email?.split('@')[0]

  // Estadísticas
  const stats = useMemo(() => {
    const thisWeek = sessions.filter(s => {
      const diff = (Date.now() - new Date(s.logged_at)) / (1000 * 60 * 60 * 24)
      return diff <= 7
    }).length
    const exercises = new Set(workouts.map(w => w.exercise_id)).size
    return { sessions: sessions.length, thisWeek, exercises }
  }, [sessions, workouts])

  // Agrupar workouts por ejercicio para recomendaciones
  const exerciseGroups = useMemo(() => {
    const g = {}
    workouts.forEach(w => {
      const name = w.exercises?.name
      if (!name) return
      if (!g[name]) g[name] = []
      g[name].push(w)
    })
    return g
  }, [workouts])

  const loading = loadingW || loadingS

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

      {/* ── Hero saludo ─────────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-blue-600/20 via-gray-900 to-purple-600/10 border border-gray-800 rounded-2xl p-6 overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative">
          <p className="text-gray-400 text-sm font-medium uppercase tracking-widest mb-1">Panel principal</p>
          <h1 className="text-3xl font-bold text-white">
            Hola, <span className="text-blue-400">{username}</span> 👋
          </h1>
          <p className="text-gray-400 mt-2">
            {stats.sessions === 0
              ? 'Aún no tienes sesiones. ¡Empieza tu primer entrenamiento!'
              : `Llevas ${stats.sessions} sesión${stats.sessions !== 1 ? 'es' : ''} registrada${stats.sessions !== 1 ? 's' : ''}. ¡Sigue así!`
            }
          </p>
          {sessions.length === 0 && !loading && (
            <Link to="/log" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors">
              ➕ Registrar primera sesión
            </Link>
          )}
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard value={stats.sessions}  label="Sesiones totales"    icon="📅" color="bg-blue-500/10 text-blue-400" />
        <StatCard value={stats.thisWeek}  label="Esta semana"         icon="🔥" color="bg-orange-500/10 text-orange-400" />
        <StatCard value={stats.exercises} label="Ejercicios distintos" icon="💪" color="bg-purple-500/10 text-purple-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Últimas sesiones ──────────────────────────────────────────── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <h2 className="font-semibold text-white">Últimas sesiones</h2>
            <Link to="/history" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
              Ver todas →
            </Link>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />)}
            </div>
          ) : sessions.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-600">
              <p className="text-3xl mb-2">🏋️</p>
              <p className="text-sm">Sin sesiones aún</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {sessions.slice(0, 4).map(s => {
                const logs     = s.workout_logs ?? []
                const exNames  = [...new Set(logs.map(l => l.exercises?.name).filter(Boolean))]
                const muscles  = [...new Set(logs.map(l => l.exercises?.muscle_group).filter(Boolean))]
                return (
                  <div key={s.id} className="px-5 py-3.5 hover:bg-gray-800/40 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-200 truncate">{s.name || 'Sesión'}</p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {format(new Date(s.logged_at), "d MMM · HH:mm", { locale: es })}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 truncate">{exNames.slice(0,3).join(', ')}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-xs text-gray-500">{logs.length} series</span>
                        {muscles.slice(0,2).map(m => <Badge key={m} color="blue">{m}</Badge>)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Recomendaciones ───────────────────────────────────────────── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <h2 className="font-semibold text-white">Recomendaciones</h2>
            <span className="text-xs bg-blue-900/50 text-blue-300 border border-blue-800 px-2 py-0.5 rounded-full">Auto</span>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />)}
            </div>
          ) : Object.keys(exerciseGroups).length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-600">
              <p className="text-3xl mb-2">📊</p>
              <p className="text-sm">Registra sesiones para ver recomendaciones</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {Object.entries(exerciseGroups).slice(0, 4).map(([name, logs]) => {
                const rec = getRecommendation(logs)
                const icons = { increase: '⬆️', maintain: '➡️', decrease: '⬇️', start: '🚀' }
                const labels = { increase: 'Subir', maintain: 'Mantener', decrease: 'Bajar', start: 'Iniciar' }
                return (
                  <div key={name} className="px-5 py-3.5">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-200 truncate">{name}</p>
                      <Badge color={rec.badgeColor || 'gray'}>
                        {icons[rec.action]} {labels[rec.action]}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 leading-relaxed pr-4">{rec.message}</p>
                      {rec.suggestedWeight && (
                        <p className="text-sm font-bold text-white shrink-0">{rec.suggestedWeight} kg</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>

      {/* ── CTA si no hay sesiones ────────────────────────────────────── */}
      {sessions.length > 0 && (
        <Link to="/log"
          className="flex items-center justify-center gap-3 w-full py-4 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/30 hover:border-blue-500/50 rounded-2xl transition-colors group">
          <span className="text-xl">➕</span>
          <span className="font-semibold text-blue-300 group-hover:text-blue-200 transition-colors">
            Registrar nueva sesión
          </span>
        </Link>
      )}

    </div>
  )
}
