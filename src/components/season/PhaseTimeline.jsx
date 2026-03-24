/**
 * PhaseTimeline.jsx
 * Kauden faasiaikajana. Harjoittelu-, kilpailu- ja taukojaksojen hallinta.
 */

import styles from './PhaseTimeline.module.css'

const DEFAULT_PHASES = [
  { id: 'pre',         label: 'Pre-season',    color: '#EF9F27', start: '', end: '', weeklyCount: 3, focus: '' },
  { id: 'competition', label: 'Kilpailukausi', color: '#1D9E75', start: '', end: '', weeklyCount: 4, focus: '' },
  { id: 'transition',  label: 'Siirtymäkausi', color: '#378ADD', start: '', end: '', weeklyCount: 2, focus: '' },
]

// Laske jakson kesto päivinä (vähintään 1 jotta palkki näkyy)
function durationDays(phase) {
  if (!phase.start || !phase.end) return 1
  const diff = new Date(phase.end) - new Date(phase.start)
  return Math.max(1, Math.ceil(diff / 86400000))
}

// Formatoi päivämäärä "15.3.2026" → lyhyt esitys
function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric', year: 'numeric' })
}

export default function PhaseTimeline({ phases, onUpdate }) {
  // Käytetään oletuksia jos jaksoja ei vielä ole
  const current = phases.length === 3 ? phases : DEFAULT_PHASES

  function updatePhase(id, field, value) {
    const updated = current.map((p) => p.id === id ? { ...p, [field]: value } : p)
    onUpdate(updated)
  }

  const durations = current.map(durationDays)
  const total = durations.reduce((s, d) => s + d, 0)

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Kauden jaksot</h2>

      {/* ── VISUAALINEN AIKAJANA ── */}
      <div className={styles.bar}>
        {current.map((phase, i) => (
          <div
            key={phase.id}
            className={styles.barSegment}
            style={{ flex: durations[i] / total, background: phase.color }}
          >
            <span className={styles.barLabel}>{phase.label}</span>
            {phase.start && phase.end && (
              <span className={styles.barDates}>{fmtDate(phase.start)} – {fmtDate(phase.end)}</span>
            )}
          </div>
        ))}
      </div>

      {/* ── MUOKATTAVAT KORTIT ── */}
      <div className={styles.cards}>
        {current.map((phase) => (
          <div key={phase.id} className={styles.card} style={{ borderTopColor: phase.color }}>
            <div className={styles.cardTitle} style={{ color: phase.color }}>{phase.label}</div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label}>Alkaa</label>
                <input
                  type="date"
                  className={styles.input}
                  value={phase.start}
                  onChange={(e) => updatePhase(phase.id, 'start', e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Päättyy</label>
                <input
                  type="date"
                  className={styles.input}
                  value={phase.end}
                  onChange={(e) => updatePhase(phase.id, 'end', e.target.value)}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Treeniä / viikko</label>
              <input
                type="number"
                className={styles.input}
                min={1} max={7}
                value={phase.weeklyCount}
                onChange={(e) => updatePhase(phase.id, 'weeklyCount', parseInt(e.target.value) || 1)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Pääkohteet</label>
              <input
                type="text"
                className={styles.input}
                value={phase.focus}
                onChange={(e) => updatePhase(phase.id, 'focus', e.target.value)}
                placeholder="esim. Peruskunto, ryhmäytyminen"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
