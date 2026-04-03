/**
 * components/auth/LoginForm.jsx
 * -----------------------------
 * Formulario de inicio de sesión.
 * Maneja su propio estado local y llama a signIn del AuthContext.
 */
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import Input from '../ui/Input'
import Button from '../ui/Button'

export default function LoginForm() {
  const { signIn } = useAuth()

  // Estado local del formulario
  const [form, setForm]       = useState({ email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('') // limpiar error al escribir
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await signIn(form.email, form.password)

    if (error) {
      // Traducir mensajes de error de Supabase al español
      setError(error.message.includes('Invalid')
        ? 'Email o contraseña incorrectos'
        : error.message
      )
    }
    // Si no hay error, AuthContext actualiza el usuario y App.jsx redirige automáticamente
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
      <Input
        label="Email"
        name="email"
        type="email"
        placeholder="tu@email.com"
        value={form.email}
        onChange={handleChange}
        required
        autoComplete="email"
      />
      <Input
        label="Contraseña"
        name="password"
        type="password"
        placeholder="••••••••"
        value={form.password}
        onChange={handleChange}
        required
        autoComplete="current-password"
      />

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full" size="lg">
        Iniciar sesión
      </Button>
    </form>
  )
}
