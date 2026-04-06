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
 * @param {Array}  params.logs     - workout_logs [{ rpe, weight_kg, reps, duration_sec, exercises: {type, met_value} }]
 * @param {number} params.weightKg - peso corporal del usuario en kg
 * @param {string} params.sex      - 'male' | 'female'
 * @returns {{ calories, durationMin, avgRpe, totalVolume } | null}
 */
export function calcSessionCalories({ logs, weightKg, sex }) {
  if (!logs?.length || !weightKg) return null

  const sexFactor = sex === 'female' ? 0.85 : 1.0
  let totalCal    = 0
  let totalMin    = 0
  let totalRpe    = 0
  let totalVol    = 0

  logs.forEach(log => {
    const exType = log.exercises?.type      ?? 'weight_reps'
    const met    = log.exercises?.met_value ?? (log.rpe <= 6 ? 3.5 : log.rpe <= 8 ? 5.0 : 6.0)
    const rpe    = log.rpe ?? 7

    let durationHours
    if (exType === 'time') {
      durationHours = (log.duration_sec ?? 0) / 3600
    } else {
      durationHours = 2.5 / 60   // ~2.5 min por serie (trabajo + descanso corto)
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
    durationMin: Math.round(totalMin),
    avgRpe:      (totalRpe / logs.length).toFixed(1),
    totalVolume: totalVol,
  }
}
