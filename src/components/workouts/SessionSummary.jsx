/**
 * components/workouts/SessionSummary.jsx
 * ----------------------------------------
 * Pantalla de resumen al terminar una sesión.
 * Muestra: calorías, volumen total, duración estimada y PRs conseguidos.
 */
import { Link } from 'react-router-dom'
import { calcSessionCalories } from '../../utils/calories'

const StatBox = ({ icon, value, label, color = 'text-white' }) => (
  <div className="bg-gray-800/60 rounded-2xl p-4 flex flex-col items-center gap-1 text-center">
    <span className="text-2xl">{icon}</span>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    <p className="text-xs text-gray-500">{label}</p>
  </div>
)

export default function SessionSummary({ sessionName, logs, prs, profile, onDone }) {
  const stats = calcSessionCalories({
    logs,
    weightKg: profile?.weight_kg,
    sex:      profile?.sex,
  })

  const hasProfile = !!profile?.weight_kg

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-8 space-y-6 text-center">

      {/* Icono animado */}
      <div className="space-y-1">
        <div className="text-6xl animate-bounce">🏆</div>
        <h1 className="text-2xl font-bold text-white">¡Sesión completada!</h1>
        {sessionName && (
          <p className="text-gray-400 text-sm">"{sessionName}"</p>
        )}
      </div>

      {/* PRs */}
      {prs?.length > 0 && (
        <div className="w-full bg-yellow-900/20 border border-yellow-700/50 rounded-2xl p-4 space-y-2">
          <p className="font-bold text-yellow-400 text-sm">🥇 ¡Nuevo récord personal!</p>
          {prs.map((pr, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-gray-200">{pr.exerciseName}</span>
              <span className="text-yellow-400 font-bold">
                {pr.newWeight} kg
                <span className="text-gray-500 font-normal ml-1 text-xs">(antes {pr.oldMax} kg)</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Stats grid */}
      <div className="w-full grid grid-cols-2 gap-3">
        <StatBox
          icon="🔥"
          value={stats ? `${stats.calories} kcal` : '—'}
          label={hasProfile ? 'Calorías quemadas' : 'Completa tu perfil'}
          color={stats ? 'text-orange-400' : 'text-gray-600'}
        />
        <StatBox
          icon="⏱"
          value={stats ? `${stats.durationMin} min` : `${(logs?.length ?? 0) * 2.5} min`}
          label="Duración estimada"
          color="text-blue-400"
        />
        <StatBox
          icon="🏋️"
          value={stats ? `${stats.totalVolume.toLocaleString()} kg` : `${logs?.reduce((s,l) => s + (l.weight_kg??0)*(l.reps??0), 0).toLocaleString()} kg`}
          label="Volumen total"
          color="text-purple-400"
        />
        <StatBox
          icon="📊"
          value={`RPE ${stats?.avgRpe ?? '—'}`}
          label="Esfuerzo promedio"
          color="text-green-400"
        />
      </div>

      {/* Aviso si no hay perfil */}
      {!hasProfile && (
        <Link to="/profile"
          className="w-full flex items-center justify-between bg-blue-900/20 border border-blue-800/50 rounded-xl px-4 py-3">
          <div className="text-left">
            <p className="text-sm font-medium text-blue-300">Activa las calorías</p>
            <p className="text-xs text-gray-500">Completa tu perfil con peso y sexo</p>
          </div>
          <span className="text-blue-400 text-sm">→</span>
        </Link>
      )}

      {/* Acciones */}
      <div className="w-full flex flex-col gap-3">
        <button onClick={onDone}
          className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm active:scale-[0.98] transition-all">
          Ver historial
        </button>
        <Link to="/log"
          className="w-full py-3.5 rounded-2xl border border-gray-700 text-gray-400 font-medium text-sm active:scale-[0.98] transition-all">
          Nueva sesión
        </Link>
      </div>
    </div>
  )
}
