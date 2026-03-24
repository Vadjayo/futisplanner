// Kuukausipohjainen kalenteri — treenit, ottelut, lepo
// Klikkaa päivää → pieni modal ajan ja sijainnin lisäämiseen

import { useMemo, useState, useRef, useEffect } from 'react'
import styles from './SeasonCalendar.module.css'

export const EVENT_TYPES = [
  { id: 'drill', label: 'Treeni', short: 'T', color: '#1D9E75' },
  { id: 'game',  label: 'Ottelu', short: 'O', color: '#378ADD' },
  { id: 'rest',  label: 'Lepo',   short: 'L', color: '#EF9F27' },
]

const DAY_LABELS = ['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su']
const FI_MONTHS  = [
  'Tammikuu','Helmikuu','Maaliskuu','Huhtikuu',
  'Toukokuu','Kesäkuu','Heinäkuu','Elokuu',
  'Syyskuu','Lokakuu','Marraskuu','Joulukuu',
]

function dateKey(date) {
  return date.toLocaleDateString('sv-SE')
}

function phaseForDate(key, phases) {
  return phases.find((p) => p.start && p.end && key >= p.start && key <= p.end)
}

function buildMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDate = new Date(year, month + 1, 0).getDate()
  const startDow = (firstDay.getDay() + 6) % 7

  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= lastDate; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

// Pieni modal tapahtuman lisäämiseen
function AddEventModal({ date, eventType, onConfirm, onClose }) {
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const timeRef = useRef(null)
  const et = EVENT_TYPES.find((t) => t.id === eventType)

  useEffect(() => { timeRef.current?.focus() }, [])

  function handleSubmit(e) {
    e.preventDefault()
    onConfirm({ time: time.trim() || null, location: location.trim() || null })
  }

  function handleKey(e) {
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose} onKeyDown={handleKey}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader} style={{ borderLeft: `3px solid ${et.color}` }}>
          <span className={styles.modalTitle}>{et.label}</span>
          <span className={styles.modalDate}>{date}</span>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <form className={styles.modalForm} onSubmit={handleSubmit}>
          <label className={styles.modalLabel}>
            Kellonaika
            <input
              ref={timeRef}
              className={styles.modalInput}
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="esim. 18:00"
            />
          </label>
          {eventType !== 'rest' && (
            <label className={styles.modalLabel}>
              Sijainti
              <input
                className={styles.modalInput}
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="esim. Kenttä 1"
                maxLength={60}
              />
            </label>
          )}
          <button
            type="submit"
            className={styles.modalBtn}
            style={{ background: et.color }}
          >
            Lisää {et.label.toLowerCase()}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function SeasonCalendar({ phases, events, addEventType, onAddEventTypeChange, onAddEvent, onDeleteEvent }) {
  const [modal, setModal] = useState(null) // { key, label }

  const eventMap = useMemo(() => {
    const map = {}
    events.forEach((ev) => {
      if (!map[ev.date]) map[ev.date] = []
      map[ev.date].push(ev)
    })
    return map
  }, [events])

  const { rangeStart, rangeEnd } = useMemo(() => {
    const validPhases = phases.filter((p) => p.start && p.end)
    if (validPhases.length === 0) {
      const y = new Date().getFullYear()
      return { rangeStart: new Date(y, 0, 1), rangeEnd: new Date(y, 11, 31) }
    }
    return {
      rangeStart: new Date(Math.min(...validPhases.map((p) => new Date(p.start)))),
      rangeEnd:   new Date(Math.max(...validPhases.map((p) => new Date(p.end)))),
    }
  }, [phases])

  const months = useMemo(() => {
    const list = []
    const y0 = rangeStart.getFullYear(), m0 = rangeStart.getMonth()
    const y1 = rangeEnd.getFullYear(),   m1 = rangeEnd.getMonth()
    let y = y0, m = m0
    while (y < y1 || (y === y1 && m <= m1)) {
      list.push({ year: y, month: m })
      m++; if (m > 11) { m = 0; y++ }
    }
    return list
  }, [rangeStart, rangeEnd])

  const todayKey      = dateKey(new Date())
  const rangeStartKey = dateKey(rangeStart)
  const rangeEndKey   = dateKey(rangeEnd)

  function handleDayClick(key, label) {
    setModal({ key, label })
  }

  function handleModalConfirm({ time, location }) {
    onAddEvent(modal.key, addEventType, time, location)
    setModal(null)
  }

  return (
    <section className={styles.section}>
      {modal && (
        <AddEventModal
          date={modal.label}
          eventType={addEventType}
          onConfirm={handleModalConfirm}
          onClose={() => setModal(null)}
        />
      )}

      <div className={styles.header}>
        <h2 className={styles.title}>Kalenteri</h2>
        <div className={styles.typeBar}>
          <span className={styles.typeBarLabel}>Lisää:</span>
          {EVENT_TYPES.map((et) => (
            <button
              key={et.id}
              className={`${styles.typeBtn} ${addEventType === et.id ? styles.typeBtnActive : ''}`}
              style={addEventType === et.id ? { background: et.color, borderColor: et.color } : {}}
              onClick={() => onAddEventTypeChange(et.id)}
            >
              {et.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.monthsGrid}>
        {months.map(({ year, month }) => {
          const weeks  = buildMonthGrid(year, month)
          const midKey = dateKey(new Date(year, month, 15))
          const phase  = phaseForDate(midKey, phases)

          return (
            <div key={`${year}-${month}`} className={styles.monthCard}>
              <div
                className={styles.monthHeader}
                style={phase ? { borderLeft: `3px solid ${phase.color}` } : {}}
              >
                <span className={styles.monthName}>{FI_MONTHS[month]}</span>
                <span className={styles.monthYear}>{year}</span>
                {phase && (
                  <span className={styles.phaseBadge} style={{ color: phase.color }}>
                    {phase.name}
                  </span>
                )}
              </div>

              <div className={styles.dayLabels}>
                {DAY_LABELS.map((d) => (
                  <div key={d} className={styles.dayLabel}>{d}</div>
                ))}
              </div>

              {weeks.map((week, wi) => (
                <div key={wi} className={styles.week}>
                  {week.map((day, di) => {
                    if (!day) return <div key={di} className={styles.emptyCell} />

                    const key       = dateKey(day)
                    const dayEvents = eventMap[key] ?? []
                    const isToday   = key === todayKey
                    const inRange   = key >= rangeStartKey && key <= rangeEndKey
                    const isWeekend = di >= 5
                    // Päivämääräteksti modalille
                    const label = day.toLocaleDateString('fi-FI', { weekday: 'long', day: 'numeric', month: 'long' })

                    return (
                      <div
                        key={di}
                        className={[
                          styles.dayCell,
                          isToday   ? styles.today   : '',
                          !inRange  ? styles.outside : '',
                          isWeekend ? styles.weekend : '',
                        ].join(' ')}
                        onClick={() => inRange && handleDayClick(key, label)}
                      >
                        <span className={styles.dayNum}>{day.getDate()}</span>
                        <div className={styles.chips}>
                          {dayEvents.map((ev) => {
                            const et = EVENT_TYPES.find((t) => t.id === ev.type)
                            const tooltip = [et?.label, ev.time, ev.location].filter(Boolean).join(' · ')
                            return (
                              <div
                                key={ev.id}
                                className={styles.chip}
                                style={{ background: et?.color ?? '#555' }}
                                onClick={(e) => { e.stopPropagation(); onDeleteEvent(ev.id) }}
                                title={`${tooltip} — klikkaa poistaaksesi`}
                              >
                                <span className={styles.chipShort}>{et?.short}</span>
                                {ev.time && <span className={styles.chipTime}>{ev.time.slice(0,5)}</span>}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </section>
  )
}
