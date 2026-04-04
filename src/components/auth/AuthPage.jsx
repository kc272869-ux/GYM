/**
 * components/auth/AuthPage.jsx
 * ----------------------------
 * Página de login y registro combinada.
 * Usa estado local para alternar entre los dos formularios.
 */
import { useState } from 'react'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-950">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Título */}
        <div className="text-center mb-8">
          <img src="/logo.jpg" alt="Heavy" className="w-20 h-20 rounded-2xl object-cover mx-auto mb-3 shadow-lg" />
          <h1 className="text-3xl font-bold text-white">Heavy</h1>
          <p className="text-gray-400 mt-2">Seguimiento de progresión de fuerza</p>
        </div>

        {/* Tabs Login / Registro */}
        <div className="flex bg-gray-900 rounded-xl p-1 mb-6 border border-gray-800">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              isLogin ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              !isLogin ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Registrarse
          </button>
        </div>

        {/* Formulario activo */}
        {isLogin
          ? <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
          : <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
        }
      </div>
    </div>
  )
}
