/**
 * utils/recommendations.js
 * ------------------------
 * Lógica pura de recomendaciones de peso.
 * Está separada de los componentes para poder testearla fácilmente
 * y reutilizarla desde cualquier parte de la app.
 *
 * RPE (Rate of Perceived Exertion) = escala del 1 al 10 de esfuerzo:
 *   1-6  → fácil, el músculo tiene mucho más para dar → subir peso
 *   7-8  → esfuerzo moderado, carga óptima → mantener
 *   9-10 → al límite, riesgo de falla o lesión → bajar o mantener
 */

/**
 * Calcula la recomendación basada en el último registro de un ejercicio.
 * @param {Array} logs - Registros ordenados por fecha (más reciente primero)
 * @returns {Object} { action: 'increase'|'maintain'|'decrease', message: string, suggestedWeight: number }
 */
export function getRecommendation(logs) {
  if (!logs || logs.length === 0) {
    return {
      action: 'start',
      message: 'Sin registros aún. ¡Empieza tu primer entrenamiento!',
      suggestedWeight: null,
    }
  }

  // Tomamos el registro más reciente para la recomendación
  const latest = logs[0]
  const { rpe, weight_kg, reps } = latest

  // Incremento estándar en powerlifting/fuerza: 2.5 kg (o 5% del peso actual)
  const increment = weight_kg >= 60 ? 2.5 : 1.25

  if (rpe <= 6) {
    return {
      action: 'increase',
      message: `Esfuerzo bajo (RPE ${rpe}/10). Puedes subir ${increment} kg en tu próxima sesión.`,
      suggestedWeight: weight_kg + increment,
      badgeColor: 'green',
    }
  }

  if (rpe <= 8) {
    return {
      action: 'maintain',
      message: `Esfuerzo ideal (RPE ${rpe}/10). Mantén ${weight_kg} kg y trata de mejorar las repeticiones.`,
      suggestedWeight: weight_kg,
      badgeColor: 'yellow',
    }
  }

  // RPE 9-10
  // Si las reps son altas (≥8) aunque el RPE es alto, posiblemente es buena carga
  if (reps >= 8) {
    return {
      action: 'maintain',
      message: `Esfuerzo muy alto (RPE ${rpe}/10) pero con buenas reps. Mantén el peso y foco en la técnica.`,
      suggestedWeight: weight_kg,
      badgeColor: 'orange',
    }
  }

  return {
    action: 'decrease',
    message: `Esfuerzo máximo (RPE ${rpe}/10). Baja ${increment} kg para mejorar la técnica y el volumen.`,
    suggestedWeight: weight_kg - increment,
    badgeColor: 'red',
  }
}

/**
 * Obtiene las últimas N sesiones de un ejercicio para mostrar en el gráfico.
 * @param {Array} logs - Todos los registros del ejercicio
 * @param {number} limit - Cuántas sesiones mostrar (default 10)
 */
export function getProgressData(logs, limit = 10) {
  // Los logs ya vienen ordenados desc, revertimos para el gráfico (izq = más viejo)
  const recent = [...logs].slice(0, limit).reverse()

  return {
    labels: recent.map(l => new Date(l.logged_at).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'short'
    })),
    weights: recent.map(l => l.weight_kg),
    rpes: recent.map(l => l.rpe),
  }
}
