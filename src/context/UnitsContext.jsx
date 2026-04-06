/**
 * context/UnitsContext.jsx
 * -------------------------
 * Preferencia de unidades (kg / lb) guardada en localStorage.
 * Los datos siempre se almacenan en kg en Supabase.
 * La conversión es solo visual.
 */
import { createContext, useContext, useState } from 'react'

const KG_TO_LB = 2.20462

const UnitsContext = createContext(null)

export function UnitsProvider({ children }) {
  const [units, setUnits] = useState(() => localStorage.getItem('units') ?? 'kg')

  const toggle = () => {
    const next = units === 'kg' ? 'lb' : 'kg'
    localStorage.setItem('units', next)
    setUnits(next)
  }

  // kg → unidad seleccionada (para mostrar)
  const toDisplay = (kg) => {
    if (kg == null) return null
    return units === 'lb' ? Math.round(kg * KG_TO_LB * 10) / 10 : kg
  }

  // valor ingresado en la unidad seleccionada → kg (para guardar)
  const toKg = (val) => {
    if (val == null || val === '') return null
    const n = parseFloat(val)
    if (isNaN(n)) return null
    return units === 'lb' ? Math.round((n / KG_TO_LB) * 100) / 100 : n
  }

  return (
    <UnitsContext.Provider value={{ units, toggle, toDisplay, toKg, label: units }}>
      {children}
    </UnitsContext.Provider>
  )
}

export const useUnits = () => useContext(UnitsContext)
