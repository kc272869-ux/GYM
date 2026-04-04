/**
 * pages/ProfilePage.jsx
 * ----------------------
 * Perfil del usuario: datos físicos para calcular calorías.
 * También da acceso a Ejercicios y Rutinas desde aquí.
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import { useAuth } from '../context/AuthContext'

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
    {children}
  </div>
)

const inputCls = "w-full px-4 py-3 rounded-xl border bg-gray-800 border-gray-700 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"

export default function ProfilePage() {
  const { user, signOut }          = useAuth()
  const { profile, loading, saveProfile } = useProfile()

  const [form, setForm]     = useState({ full_name: '', weight_kg: '', height_cm: '', age: '', sex: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  // Cargar datos existentes cuando el perfil carga
  useEffect(() => {
    if (profile) {
      setForm({
        full_name:  profile.full_name  ?? '',
        weight_kg:  profile.weight_kg  ?? '',
        height_cm:  profile.height_cm  ?? '',
        age:        profile.age        ?? '',
        sex:        profile.sex        ?? '',
      })
    }
  }, [profile])

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }))

  const handleSave = async () => {
    setSaving(true)
    await saveProfile({
      full_name:  form.full_name  || null,
      weight_kg:  form.weight_kg  ? parseFloat(form.weight_kg)  : null,
      height_cm:  form.height_cm  ? parseInt(form.height_cm)    : null,
      age:        form.age        ? parseInt(form.age)           : null,
      sex:        form.sex        || null,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  // IMC calculado en tiempo real

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-6 space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">⚙️ Perfil</h1>
        <p className="text-gray-500 text-xs mt-0.5">{user?.email}</p>
      </div>

      {/* Formulario */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <p className="font-semibold text-white text-sm">Datos personales</p>
          <p className="text-xs text-gray-500 mt-0.5">Se usan para calcular calorías quemadas</p>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-12 bg-gray-800 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="p-4 space-y-4">

            <Field label="Nombre">
              <input type="text" placeholder="Tu nombre" value={form.full_name}
                onChange={e => set('full_name', e.target.value)} className={inputCls} />
            </Field>

            {/* Sexo — chips */}
            <Field label="Sexo">
              <div className="flex gap-3">
                {[{ value: 'male', label: '♂ Hombre' }, { value: 'female', label: '♀ Mujer' }].map(s => (
                  <button key={s.value} type="button" onClick={() => set('sex', s.value)}
                    className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all active:scale-95 ${
                      form.sex === s.value
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-400'
                    }`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </Field>

            {/* Edad, Peso, Altura en grid */}
            <div className="grid grid-cols-3 gap-3">
              <Field label="Edad">
                <input type="number" inputMode="numeric" placeholder="25" min="10" max="100"
                  value={form.age} onChange={e => set('age', e.target.value)}
                  className={inputCls + ' text-center'} />
              </Field>
              <Field label="Peso (kg)">
                <input type="number" inputMode="decimal" placeholder="70" step="0.1"
                  value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)}
                  className={inputCls + ' text-center'} />
              </Field>
              <Field label="Altura (cm)">
                <input type="number" inputMode="numeric" placeholder="175"
                  value={form.height_cm} onChange={e => set('height_cm', e.target.value)}
                  className={inputCls + ' text-center'} />
              </Field>
            </div>



            {/* Botón guardar */}
            <button onClick={handleSave} disabled={saving}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] ${
                saved
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-60'
              }`}>
              {saved ? '✓ Guardado' : saving ? 'Guardando...' : 'Guardar perfil'}
            </button>
          </div>
        )}
      </div>

      {/* Accesos rápidos */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <p className="font-semibold text-white text-sm">Más opciones</p>
        </div>
        {[
          { to: '/exercises', icon: '💪', label: 'Gestionar ejercicios',  desc: 'Agregar ejercicios personalizados' },
          { to: '/routines',  icon: '🗓️', label: 'Rutinas',               desc: 'Organizar días de entrenamiento' },
          { to: '/progress',  icon: '📈', label: 'Progreso',              desc: 'Gráficas de evolución' },
        ].map(item => (
          <Link key={item.to} to={item.to}
            className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-800 last:border-0 hover:bg-gray-800/40 active:bg-gray-800 transition-colors">
            <span className="text-xl w-8 text-center">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200">{item.label}</p>
              <p className="text-xs text-gray-600">{item.desc}</p>
            </div>
            <span className="text-gray-700 text-sm">›</span>
          </Link>
        ))}
      </div>

      {/* Cerrar sesión */}
      <button onClick={signOut}
        className="w-full py-3.5 rounded-xl border border-red-900/40 text-red-500 hover:bg-red-900/20 text-sm font-medium transition-colors active:scale-[0.98]">
        Cerrar sesión
      </button>
    </div>
  )
}
