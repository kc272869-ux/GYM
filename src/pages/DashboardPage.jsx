/**
 * pages/DashboardPage.jsx
 * -----------------------
 * Dashboard con calendario mensual: días con sesión aparecen resaltados.
 * Al tocar un día con sesión se muestra el detalle debajo.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useWorkouts } from '../hooks/useWorkouts'
import { useSessions } from '../hooks/useSessions'
import Badge from '../components/ui/Badge'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isSameDay, isToday, addMonths, subMonths
} from 'date-fns'
import { es } from 'date-fns/locale'

// Convierte fecha a clave "YYYY-MM-DD" en zona local
const dayKey = (date) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

// ── Calendario ───────────────────────────────────────────────────────────────
function Calendar({ sessions, onSelectDay, selectedDay }) {
  const [month, setMonth] = useState(new Date())

  // Mapa: "YYYY-MM-DD" → array de sesiones de ese día
  const sessionMap = useMemo(() => {
    const map = {}
    sessions.forEach(s => {
      const k = dayKey(s.logged_at)
      if (!map[k]) map[k] = []
      map[k].push(s)
    })
    return map
  }, [sessions])

  const days      = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  // Día de la semana del primer día (0=dom, ajustamos a lunes=0)
  const firstDow  = (getDay(days[0]) + 6) % 7  // lunes = 0

  const DAYS_ES = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Header mes */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <button onClick={() => setMonth(m => subMonths(m, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-800 active:scale-90 transition-all text-lg">
          ‹
        </button>
        <p className="font-semibold text-white text-sm capitalize">
          {format(month, 'MMMM yyyy', { locale: es })}
        </p>
        <button onClick={() => setMonth(m => addMonths(m, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-800 active:scale-90 transition-all text-lg">
          ›
        </button>
      </div>

      <div className="px-3 pb-3 pt-2">
        {/* Cabecera días de la semana */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS_ES.map(d => (
            <div key={d} className="text-center text-[11px] font-bold text-gray-600 py-1">{d}</div>
          ))}
        </div>

        {/* Cuadrícula de días */}
        <div className="grid grid-cols-7 gap-y-1">
          {/* Espacios vacíos antes del día 1 */}
          {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}

          {days.map(day => {
            const k        = dayKey(day)
            const hasSess  = !!sessionMap[k]
            const isSelect = selectedDay && dayKey(selectedDay) === k
            const today    = isToday(day)

            return (
              <button
                key={k}
                onClick={() => hasSess && onSelectDay(isSelect ? null : day)}
                disabled={!hasSess}
                className={`
                  relative mx-auto w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium
                  transition-all duration-150
                  ${isSelect             ? 'bg-blue-600 text-white scale-110 shadow-lg shadow-blue-500/30' :
                    hasSess && today     ? 'bg-blue-500/30 text-blue-300 ring-2 ring-blue-500' :
                    hasSess              ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-800/60 active:scale-95' :
                    today                ? 'ring-1 ring-gray-600 text-gray-300' :
                                          'text-gray-600 cursor-default'
                  }
                `}
              >
                {format(day, 'd')}
                {/* Punto indicador si hay sesión */}
                {hasSess && !isSelect && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Detalle de sesiones de un día ────────────────────────────────────────────
function DayDetail({ day, sessions }) {
  const daySessions = sessions.filter(s => isSameDay(new Date(s.logged_at), day))

  return (
    <div className="bg-gray-900 border border-blue-800/50 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <p className="font-semibold text-white text-sm capitalize">
          {format(day, "EEEE d 'de' MMMM", { locale: es })}
        </p>
        <span className="text-xs text-gray-500">{daySessions.length} sesión{daySessions.length !== 1 ? 'es' : ''}</span>
      </div>

      <div className="divide-y divide-gray-800">
        {daySessions.map(s => {
          const logs    = s.workout_logs ?? []
          const exNames = [...new Set(logs.map(l => l.exercises?.name).filter(Boolean))]
          const muscles = [...new Set(logs.map(l => l.exercises?.muscle_group).filter(Boolean))]

          return (
            <div key={s.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-200 text-sm">{s.name || 'Sesión'}</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {format(new Date(s.logged_at), 'HH:mm', { locale: es })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                    {exNames.join(' · ')}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-xs text-gray-500">{logs.length} series</span>
                  {muscles.slice(0, 2).map(m => <Badge key={m} color="blue">{m}</Badge>)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user }                        = useAuth()
  const { workouts, loading: loadingW } = useWorkouts()
  const { sessions, loading: loadingS } = useSessions()
  const [selectedDay, setSelectedDay]   = useState(null)

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

      {/* ── Hero ─────────────────────────────────────────────────────── */}
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
          <Link to="/log" className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl active:scale-95 transition-all">
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

      {/* ── Calendario ───────────────────────────────────────────────── */}
      {loading ? (
        <div className="h-64 bg-gray-800 rounded-2xl animate-pulse" />
      ) : (
        <Calendar
          sessions={sessions}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
        />
      )}

      {/* ── Detalle del día seleccionado ─────────────────────────────── */}
      {selectedDay && (
        <DayDetail day={selectedDay} sessions={sessions} />
      )}

    </div>
  )
}
