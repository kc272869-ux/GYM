/**
 * components/auth/RegisterForm.jsx
 * ---------------------------------
 * Formulario de registro de nuevo usuario.
 * Supabase crea el usuario en Auth y podemos insertar perfil adicional si quisiéramos.
 */
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import Input from '../ui/Input'
import Button from '../ui/Button'

export default function RegisterForm({ onSwitchToLogin }) {
  const { signUp } = useAuth()
  const [form, setForm]         = useState({ email: '', password: '', confirm: '' })
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)
  const [loading, setLoading]   = useState(false)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validación del lado del cliente
    if (form.password !== form.confirm) {
      return setError('Las contraseñas no coinciden')
    }
    if (form.password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres')
    }

    setLoading(true)
    const { error } = await signUp(form.email, form.password)

    if (error) {
      setError(error.message.includes('already registered')
        ? 'Este email ya está registrado'
        : error.message
      )
    } else {
      // Supabase por defecto envía un email de confirmación
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="bg-green-900/30 border border-green-800 rounded-xl p-6 text-center space-y-3">
        <div className="text-3xl">✉️</div>
        <h3 className="font-semibold text-green-300">¡Revisa tu email!</h3>
        <p className="text-sm text-gray-400">
          Te enviamos un link de confirmación a <strong className="text-gray-200">{form.email}</strong>.
          Confirma tu cuenta y luego inicia sesión.
        </p>
        <Button variant="ghost" onClick={onSwitchToLogin} className="mx-auto">
          Ir al login →
        </Button>
      </div>
    )
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
      />
      <Input
        label="Contraseña"
        name="password"
        type="password"
        placeholder="Mínimo 6 caracteres"
        value={form.password}
        onChange={handleChange}
        required
      />
      <Input
        label="Confirmar contraseña"
        name="confirm"
        type="password"
        placeholder="Repite la contraseña"
        value={form.confirm}
        onChange={handleChange}
        required
      />

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full" size="lg">
        Crear cuenta
      </Button>
    </form>
  )
}
