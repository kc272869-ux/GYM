/**
 * App.jsx
 * -------
 * Componente raíz de la aplicación.
 * Responsabilidades:
 *   1. Envolver todo con AuthProvider (context de autenticación)
 *   2. Envolver todo con BrowserRouter (routing de React Router)
 *   3. Decidir si mostrar la pantalla de auth o la app principal
 *   4. Definir las rutas de la aplicación
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ErrorBoundary from './components/ui/ErrorBoundary'

// Páginas
import AuthPage      from './components/auth/AuthPage'
import DashboardPage from './pages/DashboardPage'
import ExercisesPage from './pages/ExercisesPage'
import LogWorkoutPage from './pages/LogWorkoutPage'
import HistoryPage   from './pages/HistoryPage'
import ProgressPage  from './pages/ProgressPage'
import RoutinesPage  from './pages/RoutinesPage'
import ProfilePage   from './pages/ProfilePage'

// Layout
import Navbar from './components/dashboard/Navbar'

/**
 * ProtectedLayout: envuelve las rutas que requieren autenticación.
 * Si no hay usuario logueado, redirige a /auth.
 */
function ProtectedLayout() {
  const { user, loading } = useAuth()

  // Mientras Supabase verifica la sesión, mostramos un loader
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center space-y-4">
          <div className="text-5xl">🏋️</div>
          <p className="text-gray-400 animate-pulse">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/auth" replace />

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      {/* pb-20 en móvil: espacio para la barra inferior de navegación */}
      <main className="pb-4 md:pb-8">
        <Routes>
          <Route path="/"          element={<DashboardPage />} />
          <Route path="/exercises" element={<ExercisesPage />} />
          <Route path="/log"       element={<LogWorkoutPage />} />
          <Route path="/history"   element={<HistoryPage />} />
          <Route path="/progress"  element={<ProgressPage />} />
          <Route path="/routines"  element={<RoutinesPage />} />
          <Route path="/profile"   element={<ProfilePage />} />
          {/* Cualquier ruta desconocida redirige al dashboard */}
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

/**
 * AuthRoute: si el usuario YA está logueado e intenta ir a /auth,
 * lo redirige al dashboard directamente.
 */
function AuthRoute() {
  const { user, loading } = useAuth()

  if (loading) return null
  if (user) return <Navigate to="/" replace />

  return <AuthPage />
}

export default function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthRoute />} />
          <Route path="/*"    element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ErrorBoundary>
  )
}
