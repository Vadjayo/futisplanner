/**
 * SeasonStats.jsx
 * Kauden tilastot. Harjoitusmäärät, pelit ja suunnitteluprosentti.
 */

import styles from './SeasonStats.module.css'

// Laske kuinka monen viikon välillä on vähintään yksi tapahtuma suhteessa kauden kokonaisviikkoihin
function plannedPercent(events, phases) {
  if (!phases.length || !events.length) return 0
  const starts = phases.map((p) => new Date(p.start)).filter((d) => !isNaN(d))
  const ends = phases.map((p) => new Date(p.end)).filter((d) => !isNaN(d))
  if (!starts.length || !ends.length) return 0

  const seasonStart = new Date(Math.min(...starts))
  const seasonEnd = new Date(Math.max(...ends))
  const totalDays = Math.ceil((seasonEnd - seasonStart) / 86400000) + 1
  const totalWeeks = Math.ceil(totalDays / 7)
  if (totalWeeks === 0) return 0

  // Kerää uniikit viikkoavaimet tapahtumista
  const weeksWithEvents = new Set(
    events.map((ev) => {
      const d = new Date(ev.date)
      const day = d.getDay() || 7
      d.setDate(d.getDate() - (day - 1))
      return d.toISOString().slice(0, 10)
    })
  )
  return Math.round((weeksWithEvents.size / totalWeeks) * 100)
}

function avgPerWeek(events, phases) {
  if (!phases.length) return 0
  const starts = phases.map((p) => new Date(p.start)).filter((d) => !isNaN(d))
  const ends = phases.map((p) => new Date(p.end)).filter((d) => !isNaN(d))
  if (!starts.length || !ends.length) return 0
  const totalDays = Math.ceil((new Date(Math.max(...ends)) - new Date(Math.min(...starts))) / 86400000) + 1
  const weeks = Math.max(1, Math.ceil(totalDays / 7))
  const drills = events.filter((e) => e.type === 'drill').length
  return (drills / weeks).toFixed(1)
}

export default function SeasonStats({ events, phases }) {
  const drillCount = events.filter((e) => e.type === 'drill').length
  const gameCount  = events.filter((e) => e.type === 'game').length
  const perWeek    = avgPerWeek(events, phases)
  const planned    = plannedPercent(events, phases)

  const stats = [
    { label: 'Treeniä kaudella',     value: drillCount, color: '#1D9E75' },
    { label: 'Ottelua kaudella',     value: gameCount,  color: '#378ADD' },
    { label: 'Treeniä per viikko',   value: perWeek,    color: '#EF9F27' },
    { label: 'Kausi suunniteltu',    value: `${planned}%`, color: '#a78bfa' },
  ]

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Tilastot</h2>
      <div className={styles.grid}>
        {stats.map((s) => (
          <div key={s.label} className={styles.card}>
            <span className={styles.value} style={{ color: s.color }}>{s.value}</span>
            <span className={styles.label}>{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
