/**
 * components/ui/Badge.jsx
 * -----------------------
 * Etiqueta pequeña para estados, grupos musculares, etc.
 */
const colors = {
  blue:   'bg-blue-900/50 text-blue-300 border-blue-800',
  green:  'bg-green-900/50 text-green-300 border-green-800',
  yellow: 'bg-yellow-900/50 text-yellow-300 border-yellow-800',
  orange: 'bg-orange-900/50 text-orange-300 border-orange-800',
  red:    'bg-red-900/50 text-red-300 border-red-800',
  purple: 'bg-purple-900/50 text-purple-300 border-purple-800',
  gray:   'bg-gray-800 text-gray-400 border-gray-700',
}

export default function Badge({ children, color = 'gray' }) {
  return (
    <span className={`
      inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border
      ${colors[color] || colors.gray}
    `}>
      {children}
    </span>
  )
}
