/**
 * components/ui/Stopwatch.jsx
 * ---------------------------
 * Cronómetro activo para ejercicios de tiempo.
 * El usuario inicia, pausa y guarda el tiempo registrado.
 */
import { useState, useEffect, useRef } from 'react'

const fmt = (sec) => {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function Stopwatch({ value, onChange }) {
  const [elapsed, setElapsed] = useState(value ?? 0)
  const [running, setRunning] = useState(false)
  const intervalRef           = useRef(null)

  // Si ya hay un valor guardado, mostrarlo
  useEffect(() => {
    if (value && !running) setElapsed(value)
  }, [value])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed(e => e + 1)
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  const handleStartStop = () => {
    if (running) {
      // Al parar, guardar el tiempo
      setRunning(false)
      onChange(elapsed)
    } else {
      setRunning(true)
    }
  }

  const handleReset = () => {
    setRunning(false)
    setElapsed(0)
    onChange(0)
  }

  const saved = !running && elapsed > 0

  return (
    <div className="space-y-3">
      {/* Display */}
      <div className={`rounded-2xl py-5 flex flex-col items-center gap-1 transition-colors ${
        running ? 'bg-blue-600/20 border border-blue-500/40' : saved ? 'bg-green-600/15 border border-green-500/30' : 'bg-gray-900/60 border border-gray-700'
      }`}>
        <p className={`text-5xl font-bold tabular-nums tracking-tight transition-colors ${
          running ? 'text-blue-300' : saved ? 'text-green-400' : 'text-gray-500'
        }`}>
          {fmt(elapsed)}
        </p>
        {saved && (
          <p className="text-xs text-green-500 font-medium">Guardado ✓</p>
        )}
        {running && (
          <p className="text-xs text-blue-400 animate-pulse">En curso...</p>
        )}
      </div>

      {/* Controles */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleStartStop}
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
            onClick={handleReset}
            className="px-4 py-3.5 rounded-xl bg-gray-800 border border-gray-700 text-gray-400 text-sm font-medium active:scale-95 transition-all">
            ↺
          </button>
        )}
      </div>
    </div>
  )
}
