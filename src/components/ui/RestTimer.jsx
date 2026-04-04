/**
 * components/ui/RestTimer.jsx
 * ----------------------------
 * Temporizador de descanso entre series.
 * El usuario elige el tiempo (60s, 90s, 120s, 180s) y lo inicia.
 * Vibra/suena al llegar a 0 (usando la Vibration API si está disponible).
 */
import { useState, useEffect, useRef } from 'react'

const PRESETS = [
  { label: '1 min',   seconds: 60  },
  { label: '1:30',    seconds: 90  },
  { label: '2 min',   seconds: 120 },
  { label: '3 min',   seconds: 180 },
]

// Formatea segundos a M:SS
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export default function RestTimer() {
  const [selected, setSelected] = useState(90)   // preset activo
  const [remaining, setRemaining] = useState(null) // null = no iniciado
  const [running, setRunning]     = useState(false)
  const intervalRef = useRef(null)

  // Arrancar / pausar
  const toggle = () => {
    if (running) {
      clearInterval(intervalRef.current)
      setRunning(false)
    } else {
      const start = remaining ?? selected
      setRemaining(start)
      setRunning(true)
    }
  }

  // Reset
  const reset = () => {
    clearInterval(intervalRef.current)
    setRunning(false)
    setRemaining(null)
  }

  // Cambiar preset (solo si no está corriendo)
  const pickPreset = (s) => {
    if (running) return
    setSelected(s)
    setRemaining(null)
  }

  // Tick del reloj
  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          setRunning(false)
          // Vibrar en móvil al terminar
          if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running])

  const display   = remaining ?? selected
  const progress  = 1 - display / selected  // 0 → 1
  const finished  = remaining === 0
  const r         = 44
  const circ      = 2 * Math.PI * r

  return (
    <div className="bg-gray-800 rounded-2xl p-4 space-y-3">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
        ⏱ Descanso
      </p>

      {/* Presets */}
      <div className="flex gap-2">
        {PRESETS.map(p => (
          <button key={p.seconds} onClick={() => pickPreset(p.seconds)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              selected === p.seconds && !running
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-gray-900 border-gray-700 text-gray-400'
            }`}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Círculo de progreso + tiempo */}
      <div className="flex items-center justify-center">
        <div className="relative w-28 h-28">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Track */}
            <circle cx="50" cy="50" r={r} fill="none" stroke="#1f2937" strokeWidth="6" />
            {/* Progreso */}
            <circle
              cx="50" cy="50" r={r} fill="none"
              stroke={finished ? '#22c55e' : running ? '#3b82f6' : '#374151'}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - progress)}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold tabular-nums ${
              finished ? 'text-green-400' : running ? 'text-white' : 'text-gray-400'
            }`}>
              {finished ? '✓' : fmt(display)}
            </span>
            {running && <span className="text-[10px] text-gray-500">restante</span>}
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="flex gap-2">
        <button onClick={toggle}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
            finished  ? 'bg-green-600 text-white' :
            running   ? 'bg-orange-600 text-white' :
                        'bg-blue-600 text-white'
          }`}>
          {finished ? '¡Listo!' : running ? '⏸ Pausar' : '▶ Iniciar'}
        </button>
        {(running || remaining !== null) && (
          <button onClick={reset}
            className="px-4 py-2.5 rounded-xl text-sm font-bold bg-gray-700 text-gray-300 active:scale-95 transition-all">
            ↺
          </button>
        )}
      </div>
    </div>
  )
}
