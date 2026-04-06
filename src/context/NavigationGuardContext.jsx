/**
 * context/NavigationGuardContext.jsx
 * ------------------------------------
 * Permite que cualquier página registre un "guard" de navegación.
 * El Navbar lo consulta antes de cambiar de ruta.
 */
import { createContext, useContext, useRef } from 'react'

const NavigationGuardContext = createContext(null)

// guardRef.current = async function que retorna true (puede navegar) o false (cancelar)
export function NavigationGuardProvider({ children }) {
  const guardRef = useRef(null)

  const registerGuard  = (fn) => { guardRef.current = fn }
  const clearGuard     = ()   => { guardRef.current = null }
  const checkGuard     = async () => {
    if (!guardRef.current) return true
    return await guardRef.current()
  }

  return (
    <NavigationGuardContext.Provider value={{ registerGuard, clearGuard, checkGuard }}>
      {children}
    </NavigationGuardContext.Provider>
  )
}

export const useNavigationGuard = () => useContext(NavigationGuardContext)
