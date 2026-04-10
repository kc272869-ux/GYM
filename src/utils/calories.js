/**
 * utils/calories.js
 * -----------------
 * Calcula calorías usando MET específico por ejercicio.
 *
 * - Ejercicios de peso+reps: MET × peso_corporal × (2.5 min por serie / 60)
 * - Ejercicios de tiempo   : MET × peso_corporal × (duration_sec / 3600)
 *
 * Ajuste por sexo: mujeres −15% (diferencias metabólicas promedio)
 */

/**
 * @param {Object} params
 * @param {Array}  params.logs            - workout_logs [{ rpe, weight_kg, reps, duration_sec, exercises: {type, met_value} }]
 * @param {number} params.weightKg        - peso corporal del usuario en kg
 * @param {string} params.sex             - 'male' | 'female'
 * @param {number} [params.totalDurationMin] - duración real de la sesión en minutos (del cronómetro).
 *                                          Si se provee, se reparte entre los logs weight_reps en lugar del estimado 2.5min/set.
 * @returns {{ calories, durationMin, avgRpe, totalVolume } | null}
 */
export function calcSessionCalories({ logs, weightKg, sex, totalDurationMin }) {
  if (!logs?.length || !weightKg) return null

  const sexFactor = sex === 'female' ? 0.85 : 1.0
  let totalCal    = 0
  let totalMin    = 0
  let totalRpe    = 0
  let totalVol    = 0

  // Si se provee duración real, calcular minutos por serie weight_reps
  const weightRepLogs = logs.filter(l => (l.exercises?.type ?? 'weight_reps') === 'weight_reps')
  const timeLogs      = logs.filter(l => l.exercises?.type === 'time')
  const timeLogMin    = timeLogs.reduce((s, l) => s + (l.duration_sec ?? 0) / 60, 0)
  const minPerWeightRepSet = totalDurationMin != null && weightRepLogs.length > 0
    ? Math.max(1, (totalDurationMin - timeLogMin) / weightRepLogs.length)
    : 2.5

  logs.forEach(log => {
    const exType = log.exercises?.type      ?? 'weight_reps'
    const met    = log.exercises?.met_value ?? (log.rpe <= 6 ? 3.5 : log.rpe <= 8 ? 5.0 : 6.0)
    const rpe    = log.rpe ?? 7

    let durationHours
    if (exType === 'time') {
      durationHours = (log.duration_sec ?? 0) / 3600
    } else {
      durationHours = minPerWeightRepSet / 60
    }

    totalCal += met * weightKg * durationHours * sexFactor
    totalMin += durationHours * 60
    totalRpe += rpe
    const w = parseFloat(log.weight_kg) || 0
    const r = parseInt(log.reps)        || 0
    totalVol += w * r
  })

  return {
    calories:    Math.round(totalCal),
    durationMin: Math.round(totalDurationMin ?? totalMin),
    avgRpe:      (totalRpe / logs.length).toFixed(1),
    totalVolume: totalVol,
  }
}
