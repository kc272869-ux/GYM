/**
 * utils/records.js
 * ----------------
 * Detecta récords personales (PRs) comparando los logs de la sesión actual
 * contra el historial previo del usuario.
 *
 * Un PR es cuando el peso levantado en un ejercicio supera el máximo histórico.
 */

/**
 * @param {Array} sessionLogs  - logs de la sesión recién guardada
 * @param {Array} allWorkouts  - todos los workout_logs históricos del usuario
 * @returns {Array} PRs: [{ exerciseName, newWeight, oldMax }]
 */
export function detectPRs(sessionLogs, allWorkouts) {
  if (!sessionLogs?.length || !allWorkouts?.length) return []

  const prs = []

  // Agrupar logs de la sesión por ejercicio
  const sessionByEx = {}
  for (const log of sessionLogs) {
    const id = log.exercise_id
    if (!sessionByEx[id]) sessionByEx[id] = { name: log.exercises?.name ?? '?', maxWeight: 0 }
    if ((log.weight_kg ?? 0) > sessionByEx[id].maxWeight)
      sessionByEx[id].maxWeight = log.weight_kg
  }

  // Comparar con histórico (excluir los logs de la sesión actual)
  const sessionIds = new Set(sessionLogs.map(l => l.id))

  for (const [exId, current] of Object.entries(sessionByEx)) {
    const historical = allWorkouts.filter(w => w.exercise_id === exId && !sessionIds.has(w.id))
    if (!historical.length) continue  // primer registro del ejercicio, no es PR comparativo

    const oldMax = Math.max(...historical.map(w => w.weight_kg ?? 0))
    if (current.maxWeight > oldMax) {
      prs.push({ exerciseName: current.name, newWeight: current.maxWeight, oldMax })
    }
  }

  return prs
}
