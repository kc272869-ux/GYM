/**
 * components/dashboard/Navbar.jsx
 * --------------------------------
 * En móvil: barra de navegación INFERIOR tipo app nativa (iOS style).
 * En desktop: barra superior tradicional.
 *
 * La barra inferior respeta el "safe area" del iPhone (home bar).
 */
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/',          label: 'Inicio',    icon: '🏠' },
  { to: '/history',   label: 'Historial', icon: '📋' },
  { to: '/log',       label: 'Registrar', icon: '➕', highlight: true },
  { to: '/progress',  label: 'Progreso',  icon: '📈' },
  { to: '/profile',   label: 'Perfil',     icon: '👤' },
]

export default function Navbar() {
  const { user, signOut } = useAuth()

  return (
    <>
      {/* ── DESKTOP: barra superior (oculta en móvil) ────────────────── */}
      <nav className="hidden md:flex bg-gray-900/80 backdrop-blur border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 w-full flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2 font-bold text-white">
            <img src="/logo.jpg" alt="Heavy" className="w-7 h-7 rounded-lg object-cover" />
            <span>Heavy</span>
          </NavLink>

          <div className="flex items-center gap-1">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5
                  ${isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-600 truncate max-w-[140px]">{user?.email}</span>
            <button onClick={signOut}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">
              Salir
            </button>
          </div>
        </div>
      </nav>

      {/* ── MÓVIL: barra inferior tipo app nativa (solo en móvil) ──────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>

        {/* Fondo con blur */}
        <div className="absolute inset-0 bg-gray-950/95 backdrop-blur-xl border-t border-gray-800" />

        <div className="relative flex items-center justify-around px-2 h-[60px]">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `
                flex flex-col items-center justify-center gap-0.5 flex-1 h-full
                transition-all duration-150
                ${item.highlight
                  ? 'relative -mt-5'   // el botón central sube un poco
                  : ''
                }
              `}
            >
              {({ isActive }) => item.highlight ? (
                // Botón central "Registrar" con círculo azul
                <div className={`
                  w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-0.5
                  shadow-lg shadow-blue-500/30 transition-transform duration-150 active:scale-95
                  ${isActive ? 'bg-blue-500 scale-95' : 'bg-blue-600'}
                `}>
                  <span className="text-xl leading-none">{item.icon}</span>
                  <span className="text-[10px] font-semibold text-white">{item.label}</span>
                </div>
              ) : (
                <>
                  <span className={`text-xl leading-none transition-transform duration-150 ${isActive ? 'scale-110' : ''}`}>
                    {item.icon}
                  </span>
                  <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-blue-400' : 'text-gray-600'}`}>
                    {item.label}
                  </span>
                  {/* Indicador activo */}
                  {isActive && (
                    <span className="absolute top-2 w-1 h-1 rounded-full bg-blue-400" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      {/* ── Header móvil superior (solo título + logout) ──────────────── */}
      <header className="md:hidden sticky top-0 z-40 bg-gray-950/90 backdrop-blur-xl border-b border-gray-800/50"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="flex items-center justify-between px-4 h-12">
          <NavLink to="/" className="flex items-center gap-1.5 font-bold text-white text-sm">
            <img src="/logo.jpg" alt="Heavy" className="w-6 h-6 rounded-md object-cover" />
            <span>Heavy</span>
          </NavLink>
          <button onClick={signOut}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-2 py-1">
            Salir
          </button>
        </div>
      </header>
    </>
  )
}
