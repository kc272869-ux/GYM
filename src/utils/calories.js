/**
 * utils/calories.js
 * -----------------
 * Calcula calorías quemadas en una sesión de entrenamiento con pesas.
 *
 * Método: MET (Metabolic Equivalent of Task)
 * Fórmula: Calorías = MET × peso_corporal_kg × duración_horas
 *
 * Fuente: Compendium of Physical Activities (Ainsworth et al.)
 * MET para entrenamiento con pesas:
 *   - Esfuerzo ligero  (RPE 6)   → MET 3.5
 *   - Esfuerzo moderado (RPE 7-8) → MET 5.0
 *   - Esfuerzo alto    (RPE 9-10) → MET 6.0
 *
 * Tiempo estimado por serie: 2.5 minutos (set activo + descanso)
 * Ajuste por sexo: mujeres queman ~15% menos por diferencias metabólicas promedio
 */

const getMET = (avgRpe) => {
  if (avgRpe <= 6) return 3.5
  if (avgRpe <= 8) return 5.0
  return 6.0
}

/**
 * Calcula las calorías de una sesión.
 * @param {Object} params
 * @param {Array}  params.logs      - workout_logs de la sesión [{rpe, weight_kg, reps}, ...]
 * @param {number} params.weightKg  - peso corporal del usuario en kg
 * @param {string} params.sex       - 'male' | 'female'
 * @returns {Object} { calories, durationMin, avgRpe, totalVolume }
 */
export function calcSessionCalories({ logs, weightKg, sex }) {
  if (!logs?.length || !weightKg) return null

  const totalSets   = logs.length
  const avgRpe      = logs.reduce((s, l) => s + (l.rpe ?? 7), 0) / totalSets
  const durationMin = totalSets * 2.5           // 2.5 min por serie en promedio
  const met         = getMET(avgRpe)
  const sexFactor   = sex === 'female' ? 0.85 : 1.0
  const calories    = Math.round(met * weightKg * (durationMin / 60) * sexFactor)
  const totalVolume = logs.reduce((s, l) => s + (l.weight_kg ?? 0) * (l.reps ?? 0), 0)

  return { calories, durationMin: Math.round(durationMin), avgRpe: avgRpe.toFixed(1), totalVolume }
}
