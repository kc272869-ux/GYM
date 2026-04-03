/**
 * components/dashboard/Navbar.jsx
 * --------------------------------
 * Barra de navegación principal. Muestra las secciones de la app
 * y el botón de logout. Responsive: en móvil colapsa a iconos.
 */
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Button from '../ui/Button'

// Definición de las secciones de navegación
const navItems = [
  { to: '/',          label: 'Dashboard',  icon: '📊' },
  { to: '/exercises', label: 'Ejercicios', icon: '💪' },
  { to: '/log',       label: 'Registrar',  icon: '➕' },
  { to: '/history',   label: 'Historial',  icon: '📋' },
  { to: '/progress',  label: 'Progreso',   icon: '📈' },
  { to: '/routines',  label: 'Rutinas',    icon: '🗓️' },
]

export default function Navbar() {
  const { user, signOut } = useAuth()

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2 font-bold text-lg text-white">
          <span>🏋️</span>
          <span className="hidden sm:block">GymTracker</span>
        </NavLink>

        {/* Links de navegación */}
        <div className="flex items-center gap-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }
              `}
            >
              <span>{item.icon}</span>
              <span className="hidden md:block">{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Usuario y logout */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-xs text-gray-500 truncate max-w-32">
            {user?.email}
          </span>
          <Button variant="secondary" size="sm" onClick={signOut}>
            Salir
          </Button>
        </div>
      </div>
    </nav>
  )
}
