/**
 * components/dashboard/RecommendationCard.jsx
 * --------------------------------------------
 * Muestra la recomendación de peso para un ejercicio.
 * Usa la función getRecommendation() de utils/recommendations.js.
 */
import { getRecommendation } from '../../utils/recommendations'
import Badge from '../ui/Badge'

// Iconos por tipo de acción
const actionIcons = {
  increase: '⬆️',
  maintain: '➡️',
  decrease: '⬇️',
  start:    '🚀',
}

export default function RecommendationCard({ exerciseName, logs }) {
  const rec = getRecommendation(logs)

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-200 text-sm">{exerciseName}</span>
        <Badge color={rec.badgeColor || 'gray'}>
          {actionIcons[rec.action]} {rec.action === 'increase' ? 'Subir' :
            rec.action === 'decrease' ? 'Bajar' :
            rec.action === 'start'    ? 'Nuevo' : 'Mantener'}
        </Badge>
      </div>
      <p className="text-sm text-gray-400">{rec.message}</p>
      {rec.suggestedWeight && (
        <p className="text-lg font-bold text-white">
          {rec.suggestedWeight} <span className="text-sm font-normal text-gray-400">kg sugerido</span>
        </p>
      )}
    </div>
  )
}
