/**
 * lib/supabase.js
 * ---------------
 * Crea y exporta el cliente de Supabase.
 * Se usa en toda la app para interactuar con la base de datos y la auth.
 *
 * Las variables VITE_* se leen del archivo .env en desarrollo
 * y de las "Environment Variables" de Vercel en producción.
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltan las variables de entorno de Supabase. Revisa tu archivo .env')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
