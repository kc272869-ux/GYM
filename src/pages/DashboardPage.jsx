/**
 * pages/DashboardPage.jsx
 * -----------------------
 * Dashboard con calendario mensual y bottom sheet para detalle de sesión.
 */
import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useWorkouts } from '../hooks/useWorkouts'
import { useSessions } from '../hooks/useSessions'
import Badge from '../components/ui/Badge'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isSameDay, isToday, addMonths, subMonths
} from 'date-fns'
import { es } from 'date-fns/locale'

const dayKey = (date) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

// ── Bottom Sheet ──────────────────────────────────────────────────────────────
function DaySheet({ day, sessions, onClose }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Pequeño delay para que la animación se vea
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 280)
  }

  const daySessions = sessions.filter(s => isSameDay(new Date(s.logged_at), day))

  return (
    <>
      {/* Overlay oscuro */}
      <div
        onClick={handleClose}
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{ background: 'rgba(0,0,0,0.6)', opacity: visible ? 1 : 0 }}
      />

      {/* Panel */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-gray-900 border-t border-gray-800 transition-transform duration-300 ease-out"
        style={{
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <div>
            <p className="font-bold text-white text-base capitalize">
              {format(day, "EEEE d 'de' MMMM", { locale: es })}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {daySessions.length} sesión{daySessions.length !== 1 ? 'es' : ''}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 text-gray-400 text-sm active:scale-90 transition-all">
            ✕
          </button>
        </div>

        <div className="px-5 pb-6 space-y-3">
          {daySessions.map(s => {
            const logs    = s.workout_logs ?? []
            const exNames = [...new Set(logs.map(l => l.exercises?.name).filter(Boolean))]
            const muscles = [...new Set(logs.map(l => l.exercises?.muscle_group).filter(Boolean))]
            const totalVol = logs.reduce((sum, l) => sum + (l.weight_kg ?? 0) * (l.reps ?? 0), 0)

            return (
              <div key={s.id} className="bg-gray-800/70 rounded-2xl p-4 space-y-3">
                {/* Nombre + hora */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white text-sm">{s.name || 'Sesión'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {format(new Date(s.logged_at), 'HH:mm')}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-900/60 px-2 py-1 rounded-lg">{logs.length} series</span>
                </div>

                {/* Ejercicios */}
                {exNames.length > 0 && (
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {exNames.join('  ·  ')}
                  </p>
                )}

                {/* Músculos + volumen */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {muscles.map(m => <Badge key={m} color="blue">{m}</Badge>)}
                  </div>
                  {totalVol > 0 && (
                    <p className="text-xs text-gray-500">{totalVol.toLocaleString()} kg</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

// ── Calendario ────────────────────────────────────────────────────────────────
function Calendar({ sessions, onSelectDay }) {
  const [month, setMonth] = useState(new Date())

  const sessionMap = useMemo(() => {
    const map = {}
    sessions.forEach(s => {
      const k = dayKey(s.logged_at)
      if (!map[k]) map[k] = []
      map[k].push(s)
    })
    return map
  }, [sessions])

  const days     = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  const firstDow = (getDay(days[0]) + 6) % 7
  const DAYS_ES  = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-800">
        <button onClick={() => setMonth(m => subMonths(m, 1))}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-800 active:scale-90 transition-all text-xl">
          ‹
        </button>
        <p className="font-bold text-white text-sm capitalize">
          {format(month, 'MMMM yyyy', { locale: es })}
        </p>
        <button onClick={() => setMonth(m => addMonths(m, 1))}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-800 active:scale-90 transition-all text-xl">
          ›
        </button>
      </div>

      <div className="px-4 pb-4 pt-3">
        <div className="grid grid-cols-7 mb-2">
          {DAYS_ES.map(d => (
            <div key={d} className="text-center text-[11px] font-bold text-gray-600 py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1.5">
          {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}

          {days.map(day => {
            const k       = dayKey(day)
            const hasSess = !!sessionMap[k]
            const today   = isToday(day)

            return (
              <button
                key={k}
                onClick={() => hasSess && onSelectDay(day)}
                disabled={!hasSess}
                className={`
                  relative mx-auto w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium
                  transition-all duration-150
                  ${hasSess && today  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40 active:scale-90' :
                    hasSess           ? 'bg-blue-900/60 text-blue-300 hover:bg-blue-800/70 active:scale-90' :
                    today             ? 'ring-1 ring-gray-600 text-gray-300' :
                                        'text-gray-600 cursor-default'
                  }
                `}
              >
                {format(day, 'd')}
                {hasSess && !today && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-400" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user }                        = useAuth()
  const { profile }                     = useProfile()
  const { loading: loadingW }           = useWorkouts()
  const { sessions, loading: loadingS } = useSessions()
  const [selectedDay, setSelectedDay]   = useState(null)

  const displayName = profile?.full_name || user?.email?.split('@')[0]
  const loading     = loadingW || loadingS

  const { thisWeek, weekMuscles } = useMemo(() => {
    const weekSessions = sessions.filter(s => {
      const diff = (Date.now() - new Date(s.logged_at)) / (1000 * 60 * 60 * 24)
      return diff <= 7
    })
    const muscles = {}
    weekSessions.forEach(s => {
      ;(s.workout_logs ?? []).forEach(l => {
        const m = l.exercises?.muscle_group
        if (m) muscles[m] = (muscles[m] ?? 0) + l.sets
      })
    })
    return { thisWeek: weekSessions.length, weekMuscles: muscles }
  }, [sessions])

  const ALL_MUSCLES = [
    { key: 'Pecho',            icon: '🫀', color: 'text-blue-300',    bg: 'bg-blue-500/15'   },
    { key: 'Espalda',          icon: '🔙', color: 'text-purple-300',  bg: 'bg-purple-500/15' },
    { key: 'Hombros',          icon: '💪', color: 'text-cyan-300',    bg: 'bg-cyan-500/15'   },
    { key: 'Bíceps',           icon: '💪', color: 'text-green-300',   bg: 'bg-green-500/15'  },
    { key: 'Tríceps',          icon: '💪', color: 'text-emerald-300', bg: 'bg-emerald-500/15'},
    { key: 'Cuádriceps',       icon: '🦵', color: 'text-orange-300',  bg: 'bg-orange-500/15' },
    { key: 'Femoral / Glúteo', icon: '🍑', color: 'text-pink-300',    bg: 'bg-pink-500/15'   },
    { key: 'Abdomen',          icon: '⬜', color: 'text-yellow-300',  bg: 'bg-yellow-500/15' },
    { key: 'Cardio',           icon: '❤️', color: 'text-red-300',     bg: 'bg-red-500/15'    },
  ]

  return (
    <div className="max-w-lg mx-auto px-4 pt-5 pb-6 space-y-4">

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-blue-700/25 via-gray-900 to-purple-700/15 border border-gray-800/80 rounded-3xl px-5 py-6 overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-blue-500/8 rounded-full pointer-events-none" />
        <div className="absolute -right-2 top-6 w-20 h-20 bg-purple-500/8 rounded-full pointer-events-none" />
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-1">Hola 👋</p>
        <h1 className="text-3xl font-bold text-white leading-tight">{displayName}</h1>
        {sessions.length === 0 && !loading && (
          <Link to="/log"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-2xl active:scale-95 transition-all shadow-lg shadow-blue-500/25">
            ➕ Primera sesión
          </Link>
        )}
      </div>

      {/* ── Stat: Esta semana ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl px-5 py-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/15 flex items-center justify-center text-2xl shrink-0">🔥</div>
          <div>
            <p className="text-3xl font-bold text-orange-400 leading-none">{thisWeek}</p>
            <p className="text-xs text-gray-500 mt-1">sesiones esta semana</p>
          </div>
        </div>
      </div>

      {/* ── Músculos esta semana ───────────────────────────────────────── */}
      {thisWeek > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl px-4 py-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Músculos esta semana</p>
          <div className="grid grid-cols-3 gap-2">
            {ALL_MUSCLES.map(({ key, icon, color, bg }) => {
              const sets    = weekMuscles[key] ?? 0
              const worked  = sets > 0
              return (
                <div key={key} className={`rounded-xl px-3 py-2.5 flex items-center gap-2 transition-colors ${
                  worked ? bg : 'bg-gray-800/40'}`}>
                  <span className="text-base leading-none">{icon}</span>
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold truncate ${worked ? color : 'text-gray-700'}`}>{key}</p>
                    {worked && <p className="text-[10px] text-gray-500">{sets} series</p>}
                  </div>
                  {worked && <span className="ml-auto text-[10px] text-gray-500">✓</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Calendario ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="h-72 bg-gray-900 border border-gray-800 rounded-2xl animate-pulse" />
      ) : (
        <Calendar sessions={sessions} onSelectDay={setSelectedDay} />
      )}

      {/* ── Bottom Sheet ───────────────────────────────────────────────── */}
      {selectedDay && (
        <DaySheet
          day={selectedDay}
          sessions={sessions}
          onClose={() => setSelectedDay(null)}
        />
      )}

    </div>
  )
}
