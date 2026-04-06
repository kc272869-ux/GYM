/**
 * components/ui/Stopwatch.jsx
 * ---------------------------
 * Dos modos: cronómetro activo o entrada manual de tiempo.
 */
import { useState, useEffect, useRef } from 'react'

const fmt = (sec) => {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ── Cronómetro ────────────────────────────────────────────────────────────────
function Timer({ onChange }) {
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [saved,   setSaved]   = useState(false)
  const startRef              = useRef(null)
  const baseRef               = useRef(0)
  const rafRef                = useRef(null)

  const tick = () => {
    setElapsed(baseRef.current + Math.floor((Date.now() - startRef.current) / 1000))
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
    setElapsed(0)
    setRunning(false)
    setSaved(false)
    onChange(null)
  }

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  return (
    <div className="space-y-3">
      <div className={`rounded-2xl py-5 flex flex-col items-center gap-1 transition-colors ${
        running ? 'bg-blue-600/20 border border-blue-500/40'
        : saved  ? 'bg-green-600/15 border border-green-500/30'
                 : 'bg-gray-900/60 border border-gray-700'
      }`}>
        <p className={`text-5xl font-bold tabular-nums tracking-tight ${
          running ? 'text-blue-300' : saved ? 'text-green-400' : 'text-gray-500'
        }`}>
          {fmt(elapsed)}
        </p>
        {saved   && <p className="text-xs text-green-500 font-medium">Guardado ✓</p>}
        {running && <p className="text-xs text-blue-400 animate-pulse">En curso...</p>}
        {!running && !saved && elapsed === 0 && <p className="text-xs text-gray-600">Listo para iniciar</p>}
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={running ? stop : start}
          className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${
            running ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
          {running ? '⏹ Detener' : elapsed > 0 ? '▶ Continuar' : '▶ Iniciar'}
        </button>
        {elapsed > 0 && !running && (
          <button type="button" onClick={reset}
            className="px-4 py-3.5 rounded-xl bg-gray-800 border border-gray-700 text-gray-400 text-sm active:scale-95 transition-all">
            ↺
          </button>
        )}
      </div>
    </div>
  )
}

// ── Entrada manual ────────────────────────────────────────────────────────────
function ManualInput({ onChange }) {
  const [mins, setMins] = useState('')
  const [secs, setSecs] = useState('')

  const update = (m, s) => {
    const total = (parseInt(m) || 0) * 60 + (parseInt(s) || 0)
    onChange(total > 0 ? total : null)
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 space-y-1">
        <label className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Min</label>
        <input
          type="number" inputMode="numeric" min="0" max="999" placeholder="0"
          value={mins}
          onChange={e => { setMins(e.target.value); update(e.target.value, secs) }}
          className="w-full px-3 py-3 rounded-xl border bg-gray-900 border-gray-700 text-white text-2xl font-bold text-center placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <span className="text-2xl text-gray-600 font-bold mt-4">:</span>
      <div className="flex-1 space-y-1">
        <label className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Seg</label>
        <input
          type="number" inputMode="numeric" min="0" max="59" placeholder="0"
          value={secs}
          onChange={e => { setSecs(e.target.value); update(mins, e.target.value) }}
          className="w-full px-3 py-3 rounded-xl border bg-gray-900 border-gray-700 text-white text-2xl font-bold text-center placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Stopwatch({ onChange }) {
  const [mode, setMode] = useState('timer') // 'timer' | 'manual'

  return (
    <div className="space-y-3">
      {/* Toggle modo */}
      <div className="flex gap-1 p-1 bg-gray-900/60 border border-gray-700 rounded-xl">
        <button type="button" onClick={() => setMode('timer')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            mode === 'timer' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>
          Cronómetro
        </button>
        <button type="button" onClick={() => setMode('manual')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            mode === 'manual' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>
          Manual
        </button>
      </div>

      {mode === 'timer'
        ? <Timer  key="timer"  onChange={onChange} />
        : <ManualInput key="manual" onChange={onChange} />
      }
    </div>
  )
}
