/**
 * pages/DashboardPage.jsx
 * -----------------------
 * Dashboard principal — optimizado para iPhone.
 */
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useWorkouts } from '../hooks/useWorkouts'
import { useSessions } from '../hooks/useSessions'
import Badge from '../components/ui/Badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const rpeBadgeColor = (rpe) => rpe <= 6 ? 'green' : rpe <= 8 ? 'yellow' : 'red'

export default function DashboardPage() {
  const { user } = useAuth()
  const { workouts, loading: loadingW } = useWorkouts()
  const { sessions, loading: loadingS } = useSessions()

  const username = user?.email?.split('@')[0]
  const loading  = loadingW || loadingS

  const stats = useMemo(() => {
    const thisWeek = sessions.filter(s => {
      const diff = (Date.now() - new Date(s.logged_at)) / (1000 * 60 * 60 * 24)
      return diff <= 7
    }).length
    const exercises = new Set(workouts.map(w => w.exercise_id)).size
    return { sessions: sessions.length, thisWeek, exercises }
  }, [sessions, workouts])

return (
    <div className="max-w-5xl mx-auto px-4 pt-4 pb-6 space-y-5">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-blue-600/20 via-gray-900 to-purple-600/10 border border-gray-800 rounded-2xl px-5 py-5 overflow-hidden">
        <div className="absolute right-0 top-0 w-48 h-48 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-1">Hola 👋</p>
        <h1 className="text-2xl font-bold text-white">{username}</h1>
        <p className="text-gray-400 text-sm mt-1">
          {stats.sessions === 0
            ? '¡Empieza tu primer entrenamiento!'
            : `${stats.sessions} sesión${stats.sessions !== 1 ? 'es' : ''} registrada${stats.sessions !== 1 ? 's' : ''}`
          }
        </p>
        {sessions.length === 0 && !loading && (
          <Link to="/log" className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors active:scale-95">
            ➕ Primera sesión
          </Link>
        )}
      </div>

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: stats.sessions,  label: 'Sesiones',    color: 'text-blue-400',   bg: 'bg-blue-500/10',   icon: '📅' },
          { value: stats.thisWeek,  label: 'Esta semana', color: 'text-orange-400', bg: 'bg-orange-500/10', icon: '🔥' },
          { value: stats.exercises, label: 'Ejercicios',  color: 'text-purple-400', bg: 'bg-purple-500/10', icon: '💪' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-3 flex flex-col items-center gap-1">
            <span className={`text-xl ${s.bg} w-10 h-10 rounded-xl flex items-center justify-center`}>{s.icon}</span>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-gray-500 text-center leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Últimas sesiones ─────────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <h2 className="font-semibold text-white text-sm">Últimas sesiones</h2>
          <Link to="/history" className="text-xs text-blue-400">Ver todas →</Link>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {[1,2].map(i => <div key={i} className="h-14 bg-gray-800 rounded-xl animate-pulse" />)}
          </div>
        ) : sessions.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-600 text-sm">
            <p className="text-3xl mb-2">🏋️</p>Sin sesiones aún
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {sessions.slice(0, 3).map(s => {
              const logs    = s.workout_logs ?? []
              const exNames = [...new Set(logs.map(l => l.exercises?.name).filter(Boolean))]
              const muscles = [...new Set(logs.map(l => l.exercises?.muscle_group).filter(Boolean))]
              return (
                <div key={s.id} className="px-4 py-3 active:bg-gray-800/40 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-200 text-sm truncate">{s.name || 'Sesión'}</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {format(new Date(s.logged_at), "d MMM · HH:mm", { locale: es })}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 truncate">{exNames.slice(0,3).join(' · ')}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-xs text-gray-500">{logs.length} series</span>
                      <div className="flex gap-1 flex-wrap justify-end">
                        {muscles.slice(0,2).map(m => <Badge key={m} color="blue">{m}</Badge>)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

{/* ── CTA nueva sesión ─────────────────────────────────────────── */}
      {sessions.length > 0 && (
        <Link to="/log"
          className="flex items-center justify-center gap-2 w-full py-4 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/30 rounded-2xl transition-colors active:scale-[0.98] group">
          <span>➕</span>
          <span className="font-semibold text-blue-300 text-sm">Registrar nueva sesión</span>
        </Link>
      )}
    </div>
  )
}
