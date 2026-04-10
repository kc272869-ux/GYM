/**
 * components/workouts/ShareCard.jsx
 * -----------------------------------
 * Tarjeta visual para compartir una sesión como imagen PNG.
 * Se renderiza fuera de pantalla, se captura con html-to-image y se comparte.
 */
import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const MUSCLE_COLORS = {
  'Pecho':            '#3b82f6',
  'Espalda':          '#a855f7',
  'Hombros':          '#06b6d4',
  'Bíceps':           '#22c55e',
  'Tríceps':          '#10b981',
  'Cuádriceps':       '#f97316',
  'Femoral / Glúteo': '#ec4899',
  'Pantorrilla':      '#f43f5e',
  'Abdomen':          '#eab308',
  'Cardio':           '#ef4444',
}
const muscleColor = (m) => MUSCLE_COLORS[m] ?? '#6b7280'

function fmtDuration(sec) {
  if (!sec) return '—'
  const m = Math.floor(sec / 60), s = sec % 60
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}min` : `${s}s`
}

// ── Tarjeta visual (renderizada fuera de pantalla) ────────────────────────────
function Card({ cardRef, sessionName, date, exerciseMap, stats, label, toDisplay }) {
  const dateStr = date
    ? format(new Date(date), "EEEE d 'de' MMMM", { locale: es })
    : null

  return (
    <div
      ref={cardRef}
      style={{
        width: 400,
        background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        borderRadius: 24,
        padding: 28,
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        color: '#f1f5f9',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
          }}>🏋️</div>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: -0.5, color: '#fff' }}>Heavy</span>
        </div>
        {dateStr && (
          <span style={{ fontSize: 11, color: '#94a3b8', textTransform: 'capitalize' }}>{dateStr}</span>
        )}
      </div>

      {/* Session name */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontWeight: 800, fontSize: 22, lineHeight: 1.2, color: '#fff', letterSpacing: -0.5 }}>
          {sessionName || 'Mi sesión'}
        </p>
      </div>

      {/* Separator */}
      <div style={{
        height: 1,
        background: 'linear-gradient(to right, #3b82f6, #8b5cf6, transparent)',
        marginBottom: 18,
        borderRadius: 1,
      }} />

      {/* Exercises */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {exerciseMap.map((ex, i) => {
          const color = muscleColor(ex.muscleGroup)
          if (ex.type === 'time') {
            const dur = ex.sets[0]?.duration_sec
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 3, height: 32, borderRadius: 2, background: color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>{ex.name}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{fmtDuration(dur)}</p>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px',
                  borderRadius: 100, background: `${color}25`, color,
                }}>{ex.muscleGroup}</span>
              </div>
            )
          }
          const maxW   = Math.max(...ex.sets.map(l => l.weight_kg ?? 0))
          const reps   = ex.sets[0]?.reps ?? 0
          const avgRpe = (ex.sets.reduce((a, l) => a + (l.rpe ?? 7), 0) / ex.sets.length).toFixed(0)
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 3, height: 36, borderRadius: 2, background: color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>{ex.name}</p>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                  {ex.sets.length} series · {toDisplay(maxW)}{label} × {reps} reps
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 13, fontWeight: 800, color, margin: 0 }}>{toDisplay(maxW)}{label}</p>
                <p style={{ fontSize: 10, color: '#64748b', margin: 0 }}>RPE {avgRpe}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Stats footer */}
      {stats && (
        <>
          <div style={{
            height: 1,
            background: 'linear-gradient(to right, transparent, #334155, transparent)',
            marginBottom: 16,
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-around', gap: 8 }}>
            {stats.totalVolume > 0 && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 16, fontWeight: 800, color: '#a78bfa', margin: 0 }}>
                  {(stats.totalVolume / 1000).toFixed(1)}t
                </p>
                <p style={{ fontSize: 10, color: '#64748b', margin: 0 }}>volumen</p>
              </div>
            )}
            {stats.calories > 0 && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 16, fontWeight: 800, color: '#fb923c', margin: 0 }}>
                  {stats.calories}
                </p>
                <p style={{ fontSize: 10, color: '#64748b', margin: 0 }}>kcal</p>
              </div>
            )}
            {stats.avgRpe && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 16, fontWeight: 800, color: '#facc15', margin: 0 }}>
                  {stats.avgRpe}
                </p>
                <p style={{ fontSize: 10, color: '#64748b', margin: 0 }}>RPE avg</p>
              </div>
            )}
            {stats.durationMin > 0 && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 16, fontWeight: 800, color: '#60a5fa', margin: 0 }}>
                  {stats.durationMin}
                </p>
                <p style={{ fontSize: 10, color: '#64748b', margin: 0 }}>min</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Branding footer */}
      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <p style={{ fontSize: 10, color: '#334155', margin: 0, letterSpacing: 1, textTransform: 'uppercase' }}>
          heavy · entrenamiento registrado
        </p>
      </div>
    </div>
  )
}

// ── Hook para exportar y compartir ────────────────────────────────────────────
export function useShareCard() {
  const cardRef  = useRef(null)
  const [sharing, setSharing] = useState(false)

  const share = async (sessionName) => {
    if (!cardRef.current || sharing) return
    setSharing(true)
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true })
      const blob    = await (await fetch(dataUrl)).blob()
      const file    = new File([blob], `heavy-${(sessionName || 'sesion').replace(/\s+/g, '-')}.png`, { type: 'image/png' })

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: sessionName || 'Mi sesión' })
      } else {
        // Fallback: descarga el PNG
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = file.name
        a.click()
      }
    } catch (e) {
      console.error('share error', e)
    }
    setSharing(false)
  }

  return { cardRef, share, sharing }
}

// ── Componente principal exportado ────────────────────────────────────────────
export default function ShareCard(props) {
  return <Card {...props} />
}
