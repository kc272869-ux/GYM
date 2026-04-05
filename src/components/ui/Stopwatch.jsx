/**
 * components/ui/Stopwatch.jsx
 * ---------------------------
 * Cronómetro para ejercicios de tiempo.
 * Usa Date.now() para calcular el tiempo real transcurrido,
 * así funciona correctamente aunque el usuario salga de la app en móvil.
 */
import { useState, useEffect, useRef } from 'react'

const fmt = (sec) => {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function Stopwatch({ onChange }) {
  const [elapsed, setElapsed]   = useState(0)   // segundos mostrados
  const [running, setRunning]   = useState(false)
  const [saved,   setSaved]     = useState(false)
  const startRef                = useRef(null)  // timestamp de inicio
  const baseRef                 = useRef(0)     // segundos acumulados antes de pausar
  const rafRef                  = useRef(null)

  const tick = () => {
    const now   = Date.now()
    const total = baseRef.current + Math.floor((now - startRef.current) / 1000)
    setElapsed(total)
    rafRef.current = requestAnimationFrame(tick)
  }

  const start = () => {
    startRef.current = Date.now()
    setSaved(false)
    setRunning(true)
    rafRef.current = requestAnimationFrame(tick)
  }

  const stop = () => {
    cancelAnimationFrame(rafRef.current)
    // Calcular tiempo final con Date.now() para capturar tiempo en background
    const final = baseRef.current + Math.floor((Date.now() - startRef.current) / 1000)
    baseRef.current = final
    setElapsed(final)
    setRunning(false)
    setSaved(true)
    onChange(final)
  }

  const reset = () => {
    cancelAnimationFrame(rafRef.current)
    baseRef.current = 0
    startRef.current = null
    setElapsed(0)
    setRunning(false)
    setSaved(false)
    onChange(null)
  }

  // Limpieza al desmontar
  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  return (
    <div className="space-y-3">
      {/* Display */}
      <div className={`rounded-2xl py-5 flex flex-col items-center gap-1 transition-colors ${
        running ? 'bg-blue-600/20 border border-blue-500/40'
        : saved  ? 'bg-green-600/15 border border-green-500/30'
                 : 'bg-gray-900/60 border border-gray-700'
      }`}>
        <p className={`text-5xl font-bold tabular-nums tracking-tight transition-colors ${
          running ? 'text-blue-300' : saved ? 'text-green-400' : 'text-gray-500'
        }`}>
          {fmt(elapsed)}
        </p>
        {saved   && <p className="text-xs text-green-500 font-medium">Guardado ✓</p>}
        {running && <p className="text-xs text-blue-400 animate-pulse">En curso...</p>}
        {!running && !saved && elapsed === 0 && <p className="text-xs text-gray-600">Listo para iniciar</p>}
      </div>

      {/* Controles */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={running ? stop : start}
          className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${
            running
              ? 'bg-red-600 hover:bg-red-500 text-white'
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}>
          {running ? '⏹ Detener' : elapsed > 0 ? '▶ Continuar' : '▶ Iniciar'}
        </button>

        {elapsed > 0 && !running && (
          <button
            type="button"
            onClick={reset}
            className="px-4 py-3.5 rounded-xl bg-gray-800 border border-gray-700 text-gray-400 text-sm font-medium active:scale-95 transition-all">
            ↺
          </button>
        )}
      </div>
    </div>
  )
}
