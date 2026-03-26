/**
 * WeekCalendar.jsx
 * Kuluvan viikon 7 päivää. Merkitsee treeni- ja ottelupäivät pisteillä.
 */

import styles from './WeekCalendar.module.css'

const DAY_NAMES = ['ma', 'ti', 'ke', 'to', 'pe', 'la', 'su']

/** Palauttaa kuluvan viikon maanantain Date-oliona */
function getWeekDates() {
  const now = new Date()
  const dow = now.getDay() // 0 = su
  const mon = new Date(now)
  mon.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1))
  mon.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    return d
  })
}

/** Muotoilee Date → "YYYY-MM-DD" (sv-SE palauttaa ISO-muodon) */
function isoDate(d) {
  return d.toLocaleDateString('sv-SE')
}

/** Muotoilee Date → "YYYY-MM-DD" tänään */
function todayStr() {
  return new Date().toLocaleDateString('sv-SE')
}

export default function WeekCalendar({ loading, weekEvents = [], onNavigate }) {
  const days   = getWeekDates()
  const today  = todayStr()

  // Indeksoi tapahtumat päivämäärän mukaan
  const eventMap = {}
  weekEvents.forEach(({ date, type }) => {
    if (!eventMap[date]) eventMap[date] = new Set()
    eventMap[date].add(type)
  })

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>Tämä viikko</h2>
        <button className={styles.navBtn} onClick={onNavigate}>Kausikalenteri →</button>
      </div>

      <div className={styles.grid}>
        {days.map((d, i) => {
          const iso   = isoDate(d)
          const types = eventMap[iso] ?? new Set()
          const isToday = iso === today

          return (
            <div
              key={iso}
              className={`${styles.dayCell} ${isToday ? styles.today : ''}`}
            >
              <span className={styles.dayName}>{DAY_NAMES[i]}</span>
              <span className={styles.dayNum}>{d.getDate()}</span>
              <div className={styles.dots}>
                {types.has('drill') && <span className={`${styles.dot} ${styles.dotDrill}`} />}
                {types.has('game')  && <span className={`${styles.dot} ${styles.dotGame}`}  />}
              </div>
            </div>
          )
        })}
      </div>

      {!loading && weekEvents.length === 0 && (
        <p className={styles.empty}>Ei tapahtumia tällä viikolla.</p>
      )}
    </div>
  )
}
