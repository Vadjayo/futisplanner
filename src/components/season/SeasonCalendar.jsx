/**
 * SeasonCalendar.jsx
 * Kausikaienteri. Kuukausi-, viikko- ja kausnäkymä harjoituksista ja peleistä.
 * Tukee tapahtumien lisäystä, muokkausta, poistoa ja raahaamista.
 */

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { addEvent, addEvents, updateEvent, deleteEvent, deleteFutureRecurring } from '../../lib/seasonDb'
import styles from './SeasonCalendar.module.css'

// ── VAKIOT ──

const EVENT_TYPES = [
  { id: 'drill',      label: 'Treeni',   color: '#1D9E75' },
  { id: 'game',       label: 'Ottelu',   color: '#378ADD' },
  { id: 'tournament', label: 'Turnaus',  color: '#7F77DD' },
  { id: 'rest',       label: 'Lepo',     color: '#EF9F27' },
]

const FI_MONTHS = [
  'Tammikuu','Helmikuu','Maaliskuu','Huhtikuu','Toukokuu','Kesäkuu',
  'Heinäkuu','Elokuu','Syyskuu','Lokakuu','Marraskuu','Joulukuu',
]

const FI_MONTHS_SHORT = [
  'Tammi','Helmi','Maalis','Huhti','Touko','Kesä',
  'Heinä','Elo','Syys','Loka','Marras','Joulu',
]

const DAY_LABELS = ['Ma','Ti','Ke','To','Pe','La','Su']

const DURATIONS = [45, 60, 75, 90, 120]

// ── APUFUNKTIOT ──

// Palauttaa päivämäärän muodossa 'YYYY-MM-DD'
function dateKey(date) {
  return date.toLocaleDateString('sv-SE')
}

// Rakentaa kuukausiruudukon: palauttaa taulukon viikkoja (kukin viikko = 7 Date|null)
function buildMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDate = new Date(year, month + 1, 0).getDate()
  const startDow = (firstDay.getDay() + 6) % 7 // 0=Ma, 6=Su

  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= lastDate; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

// Palauttaa 7 päivää (Ma–Su) sisältävän taulukon annetusta päivämäärästä
function getWeekDates(date) {
  const d = new Date(date)
  const dow = (d.getDay() + 6) % 7 // 0=Ma
  const monday = new Date(d)
  monday.setDate(d.getDate() - dow)
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday)
    day.setDate(monday.getDate() + i)
    return day
  })
}

// Hakee päivämäärää vastaavan faasin tai undefined jos ei löydy
function phaseForDate(key, phases) {
  return phases.find((p) => p.start && p.end && key >= p.start && key <= p.end)
}

// Palauttaa tapahtuman värin tyypin perusteella
function getEventColor(type) {
  return EVENT_TYPES.find((t) => t.id === type)?.color ?? '#555'
}

// Formatoi 'YYYY-MM-DD' suomeksi, esim. '15.4.2025 tiistai'
function formatDateFi(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric', year: 'numeric', weekday: 'long' })
}

// Generoi viikoittaiset toistuvat päivämäärät alkupäivästä loppupäivään (sama viikonpäivä)
function generateRecurringDates(startDate, untilDate) {
  const dates = []
  const start = new Date(startDate + 'T00:00:00')
  const until = new Date(untilDate + 'T00:00:00')
  const current = new Date(start)
  while (current <= until) {
    dates.push(dateKey(current))
    current.setDate(current.getDate() + 7)
  }
  return dates
}

// ── LOMAKEKOMPONENTTI ──

// EventForm: yhteinen lomake lisäys- ja muokkausnäkymille
function EventForm({ initialValues, onSubmit, onCancel, submitLabel }) {
  const [values, setValues] = useState({
    type:           initialValues.type ?? 'drill',
    title:          initialValues.title ?? 'Treeni',
    date:           initialValues.date ?? '',
    time:           initialValues.time ?? '',
    duration:       initialValues.duration ?? 60,
    theme:          initialValues.theme ?? '',
    isRecurring:    initialValues.isRecurring ?? false,
    recurringUntil: initialValues.recurringUntil ?? '',
  })

  // Täytetään otsikko automaattisesti kun tyyppi vaihtuu (jos käyttäjä ei ole muokannut)
  const autoTitles = { drill: 'Treeni', game: 'Ottelu', tournament: 'Turnaus', rest: 'Lepopäivä' }

  function handleTypeChange(newType) {
    setValues((prev) => ({
      ...prev,
      type: newType,
      // Vaihdetaan otsikko automaattisesti vain jos se vastaa jonkun tyypin automaattiotsikkoa
      title: Object.values(autoTitles).includes(prev.title) ? autoTitles[newType] : prev.title,
    }))
  }

  function handleChange(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit(values)
  }

  return (
    <form className={styles.eventForm} onSubmit={handleSubmit}>
      {/* Tyyppi */}
      <div className={styles.formField}>
        <label className={styles.formLabel}>Tyyppi</label>
        <div className={styles.typeRow}>
          {EVENT_TYPES.map((et) => (
            <button
              key={et.id}
              type="button"
              className={`${styles.typePill} ${values.type === et.id ? styles.typePillActive : ''}`}
              style={values.type === et.id ? { background: et.color, borderColor: et.color } : {}}
              onClick={() => handleTypeChange(et.id)}
            >
              {et.label}
            </button>
          ))}
        </div>
      </div>

      {/* Otsikko */}
      <div className={styles.formField}>
        <label className={styles.formLabel}>Otsikko</label>
        <input
          className={styles.formInput}
          type="text"
          value={values.title}
          onChange={(e) => handleChange('title', e.target.value)}
          required
          maxLength={80}
        />
      </div>

      {/* Päivämäärä */}
      <div className={styles.formField}>
        <label className={styles.formLabel}>Päivämäärä</label>
        <input
          className={styles.formInput}
          type="date"
          value={values.date}
          onChange={(e) => handleChange('date', e.target.value)}
          required
        />
      </div>

      {/* Kellonaika */}
      <div className={styles.formField}>
        <label className={styles.formLabel}>Kellonaika (valinnainen)</label>
        <input
          className={styles.formInput}
          type="time"
          value={values.time}
          onChange={(e) => handleChange('time', e.target.value)}
        />
      </div>

      {/* Kesto – vain ei-lepo-tyypeille */}
      {values.type !== 'rest' && (
        <div className={styles.formField}>
          <label className={styles.formLabel}>Kesto</label>
          <select
            className={styles.formSelect}
            value={values.duration}
            onChange={(e) => handleChange('duration', parseInt(e.target.value))}
          >
            {DURATIONS.map((d) => (
              <option key={d} value={d}>{d} min</option>
            ))}
          </select>
        </div>
      )}

      {/* Viikkoteema – vain treeneille */}
      {values.type === 'drill' && (
        <div className={styles.formField}>
          <label className={styles.formLabel}>Viikkoteema</label>
          <input
            className={styles.formInput}
            type="text"
            value={values.theme}
            onChange={(e) => handleChange('theme', e.target.value)}
            placeholder="esim. Puolustuspeli"
            maxLength={80}
          />
        </div>
      )}

      {/* Toistuva */}
      <div className={styles.formCheckRow}>
        <input
          id="isRecurring"
          type="checkbox"
          className={styles.formCheckbox}
          checked={values.isRecurring}
          onChange={(e) => handleChange('isRecurring', e.target.checked)}
        />
        <label htmlFor="isRecurring" className={styles.formCheckLabel}>Toistuva (joka viikko)</label>
      </div>

      {/* Loppuu – vain toistuvalle */}
      {values.isRecurring && (
        <div className={styles.formField}>
          <label className={styles.formLabel}>Loppuu</label>
          <input
            className={styles.formInput}
            type="date"
            value={values.recurringUntil}
            onChange={(e) => handleChange('recurringUntil', e.target.value)}
            min={values.date}
            required
          />
        </div>
      )}

      <div className={styles.formActions}>
        <button type="button" className={styles.btnCancel} onClick={onCancel}>Peruuta</button>
        <button
          type="submit"
          className={styles.btnSubmit}
          style={{ background: getEventColor(values.type) }}
        >
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

// ── APUKOMPONENTIT ──

// PhaseBar: faasiaikajana kalenterin yläpuolella. Klikkaamalla jaksoa filtteröidään tapahtumat.
function PhaseBar({ phases, activePhase, onPhaseClick }) {
  const validPhases = phases.filter((p) => p.start && p.end)
  if (validPhases.length === 0) return null

  const startMs = Math.min(...validPhases.map((p) => new Date(p.start).getTime()))
  const endMs   = Math.max(...validPhases.map((p) => new Date(p.end).getTime()))
  const totalMs = endMs - startMs || 1

  return (
    <div className={styles.phaseBar}>
      {validPhases.map((phase) => {
        const left    = ((new Date(phase.start).getTime() - startMs) / totalMs) * 100
        const width   = ((new Date(phase.end).getTime() - new Date(phase.start).getTime()) / totalMs) * 100
        const isActive = activePhase && (activePhase.id ?? activePhase.label) === (phase.id ?? phase.label)
        return (
          <div
            key={phase.id ?? phase.label}
            className={styles.phaseSegment}
            style={{
              left:    `${left}%`,
              width:   `${width}%`,
              background: phase.color,
              opacity: activePhase && !isActive ? 0.4 : 1,
              cursor:  'pointer',
              outline: isActive ? '2px solid #fff' : 'none',
            }}
            title={`${phase.label ?? phase.name}: ${phase.start} – ${phase.end}`}
            onClick={() => onPhaseClick(phase)}
          >
            <span className={styles.phaseSegmentLabel}>{phase.label ?? phase.name}</span>
          </div>
        )
      })}
    </div>
  )
}

// StatsBar: tilastopalkki kalenterin alapuolella
function StatsBar({ events, phases }) {
  const drills      = events.filter((e) => e.type === 'drill').length
  const games       = events.filter((e) => e.type === 'game').length
  const tournaments = events.filter((e) => e.type === 'tournament').length

  // Laske kaudenviikkojen ja -päivien määrä faasiaikajanasta
  const { weekCount, seasonDays } = useMemo(() => {
    const valid = phases.filter((p) => p.start && p.end)
    if (valid.length === 0) return { weekCount: 52, seasonDays: 365 }
    const startMs = Math.min(...valid.map((p) => new Date(p.start).getTime()))
    const endMs   = Math.max(...valid.map((p) => new Date(p.end).getTime()))
    const diffMs  = endMs - startMs
    return {
      weekCount:  Math.max(1, Math.ceil(diffMs / (7 * 86400000))),
      seasonDays: Math.max(1, Math.ceil(diffMs / 86400000)),
    }
  }, [phases])

  const drillsPerWeek = weekCount > 0 ? (drills / weekCount).toFixed(1) : '0.0'

  // Kausi suunniteltu % = uniikit tapahtumapaivat / kauden pituus paivina
  const eventDays = new Set(events.map((e) => e.date)).size
  const seasonPct = `${Math.min(100, Math.round((eventDays / seasonDays) * 100))}%`

  const stats = [
    { label: 'Treenejä',          value: drills,        color: '#1D9E75' },
    { label: 'Otteluita',         value: games,         color: '#378ADD' },
    { label: 'Turnauksia',        value: tournaments,   color: '#7F77DD' },
    { label: 'Treenejä/vk',       value: drillsPerWeek, color: '#1D9E75' },
    { label: 'Kausi suunniteltu', value: seasonPct,     color: '#EF9F27' },
  ]

  return (
    <div className={styles.statsBar}>
      {stats.map((s) => (
        <div key={s.label} className={styles.statItem}>
          <span className={styles.statValue} style={{ color: s.color }}>{s.value}</span>
          <span className={styles.statLabel}>{s.label}</span>
        </div>
      ))}
    </div>
  )
}

// NavigationBar: navigointipainikkeet kuukausi- ja viikkonäkymille
function NavigationBar({ view, currentDate, onPrev, onNext, onToday }) {
  let title = ''
  if (view === 'month') {
    title = `${FI_MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
  } else if (view === 'week') {
    const days = getWeekDates(currentDate)
    const first = days[0]
    const last  = days[6]
    if (first.getMonth() === last.getMonth()) {
      title = `${first.getDate()}–${last.getDate()}. ${FI_MONTHS_SHORT[first.getMonth()]} ${first.getFullYear()}`
    } else {
      title = `${first.getDate()}. ${FI_MONTHS_SHORT[first.getMonth()]} – ${last.getDate()}. ${FI_MONTHS_SHORT[last.getMonth()]} ${last.getFullYear()}`
    }
  }

  return (
    <div className={styles.navBar}>
      <button className={styles.navBtn} onClick={onPrev}>‹</button>
      <span className={styles.navTitle}>{title}</span>
      <button className={styles.navBtn} onClick={onNext}>›</button>
      <button className={styles.navBtnToday} onClick={onToday}>Tänään</button>
    </div>
  )
}

// ── PÄÄKOMPONENTTI ──

export default function SeasonCalendar({ phases, events, teamId, userId, onEventsChange }) {
  const [view, setView]               = useState('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [modal, setModal]             = useState(null)
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [dragState, setDragState]     = useState(null)
  const [busy, setBusy]               = useState(false)
  // activePhase = valittu jakso filtteröintiä varten, null = näytä kaikki
  const [activePhase, setActivePhase] = useState(null)

  // Klikkaamalla PhaseBar-jaksoa filtteröidään tai poistetaan filtteri
  function handlePhaseClick(phase) {
    const key = phase.id ?? phase.label
    setActivePhase((prev) => {
      const prevKey = prev?.id ?? prev?.label
      return prevKey === key ? null : phase
    })
  }

  // Tapahtumat suodatettuna aktiivisen jakson mukaan
  const filteredEvents = useMemo(() => {
    if (!activePhase) return events
    return events.filter((ev) => ev.date >= activePhase.start && ev.date <= activePhase.end)
  }, [events, activePhase])

  // Tapahtumien hakurakenne päivämäärän mukaan (filtteröidyistä)
  const eventMap = useMemo(() => {
    const map = {}
    filteredEvents.forEach((ev) => {
      if (!map[ev.date]) map[ev.date] = []
      map[ev.date].push(ev)
    })
    return map
  }, [filteredEvents])

  const todayKey = dateKey(new Date())

  // ── NAVIGAATIO ──

  function handlePrev() {
    if (view === 'month') {
      setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
    } else if (view === 'week') {
      setCurrentDate((d) => { const n = new Date(d); n.setDate(d.getDate() - 7); return n })
    }
  }

  function handleNext() {
    if (view === 'month') {
      setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
    } else if (view === 'week') {
      setCurrentDate((d) => { const n = new Date(d); n.setDate(d.getDate() + 7); return n })
    }
  }

  function handleToday() {
    setCurrentDate(new Date())
  }

  // ── TAPAHTUMAN LISÄYS ──

  async function handleAddSubmit(values) {
    if (busy) return
    setBusy(true)
    try {
      if (values.isRecurring && values.recurringUntil) {
        // Generoi kaikki toistuvan jakson päivämäärät
        const groupId = crypto.randomUUID()
        const dates   = generateRecurringDates(values.date, values.recurringUntil)
        const rows    = dates.map((date) => ({
          userId,
          teamId,
          title:              values.title,
          type:               values.type,
          date,
          time:               values.time || null,
          duration:           values.duration || null,
          theme:              values.theme || null,
          isRecurring:        true,
          recurringUntil:     values.recurringUntil,
          recurringGroupId:   groupId,
        }))
        const { error } = await addEvents(rows)
        if (error) console.error('Toistuvien tapahtumien lisäys epäonnistui:', error.message)
      } else {
        // Yksittäinen tapahtuma
        const { error } = await addEvent({
          userId,
          teamId,
          title:    values.title,
          type:     values.type,
          date:     values.date,
          time:     values.time || null,
          duration: values.duration || null,
          theme:    values.theme || null,
        })
        if (error) console.error('Tapahtuman lisäys epäonnistui:', error.message)
      }
      setModal(null)
      onEventsChange()
    } finally {
      setBusy(false)
    }
  }

  // ── TAPAHTUMAN MUOKKAUS ──

  async function handleEditSubmit(values) {
    if (busy || !modal?.event) return
    setBusy(true)
    try {
      const { error } = await updateEvent(modal.event.id, {
        title:    values.title,
        type:     values.type,
        date:     values.date,
        time:     values.time || null,
        duration: values.duration || null,
        theme:    values.theme || null,
      })
      if (error) console.error('Tapahtuman muokkaus epäonnistui:', error.message)
      setModal(null)
      onEventsChange()
    } finally {
      setBusy(false)
    }
  }

  // ── TAPAHTUMAN POISTO ──

  function handleDeleteRequest(event) {
    if (event.is_recurring) {
      // Toistuva — kysytään poistetaanko vain tämä vai kaikki tulevat
      setConfirmDialog({ type: 'deleteRecurring', event })
    } else {
      // Yksittäinen — vahvistus
      setConfirmDialog({ type: 'delete', event })
    }
  }

  async function handleConfirmDelete(event) {
    if (busy) return
    setBusy(true)
    setConfirmDialog(null)
    setModal(null)
    try {
      const { error } = await deleteEvent(event.id)
      if (error) console.error('Poisto epäonnistui:', error.message)
      onEventsChange()
    } finally {
      setBusy(false)
    }
  }

  async function handleConfirmDeleteFuture(event) {
    if (busy) return
    setBusy(true)
    setConfirmDialog(null)
    setModal(null)
    try {
      const { error } = await deleteFutureRecurring(event.recurring_group_id, event.date)
      if (error) console.error('Toistuvien poisto epäonnistui:', error.message)
      onEventsChange()
    } finally {
      setBusy(false)
    }
  }

  // ── RAAHAAMINEN (HTML5 DnD) ──

  function handleDragStart(e, event) {
    setDragState({ eventId: event.id, originalDate: event.date })
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function handleDrop(e, targetDateKey) {
    e.preventDefault()
    if (!dragState || dragState.originalDate === targetDateKey) {
      setDragState(null)
      return
    }
    setConfirmDialog({
      type:        'dragConfirm',
      eventId:     dragState.eventId,
      originalDate: dragState.originalDate,
      targetDate:  targetDateKey,
    })
    setDragState(null)
  }

  async function handleConfirmDrag() {
    if (!confirmDialog || busy) return
    const { eventId, targetDate } = confirmDialog
    setBusy(true)
    setConfirmDialog(null)
    try {
      const { error } = await updateEvent(eventId, { date: targetDate })
      if (error) console.error('Siirto epäonnistui:', error.message)
      onEventsChange()
    } finally {
      setBusy(false)
    }
  }

  // ── KUUKAUSINÄKYMÄ ──

  function MonthView() {
    const year  = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const weeks = buildMonthGrid(year, month)

    return (
      <div className={styles.monthGrid}>
        {/* Viikonpäivien otsikot */}
        {DAY_LABELS.map((d) => (
          <div key={d} className={styles.dayHeader}>{d}</div>
        ))}
        {/* Päiväsolut */}
        {weeks.flat().map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className={styles.dayCellOutside} />
          const key       = dateKey(day)
          const dayEvents = eventMap[key] ?? []
          const isToday   = key === todayKey
          const isWeekend = idx % 7 >= 5

          return (
            <div
              key={key}
              className={[
                styles.dayCell,
                isToday   ? styles.dayCellToday   : '',
                isWeekend ? styles.dayCellWeekend : '',
              ].filter(Boolean).join(' ')}
              onClick={() => setModal({ mode: 'add', date: key })}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, key)}
            >
              <span className={styles.dayNum}>{day.getDate()}</span>
              {dayEvents.map((ev) => (
                <EventChip
                  key={ev.id}
                  event={ev}
                  onDragStart={handleDragStart}
                  onClick={(e) => { e.stopPropagation(); setModal({ mode: 'view', event: ev }) }}
                />
              ))}
            </div>
          )
        })}
      </div>
    )
  }

  // ── VIIKKONÄKYMÄ ──

  function WeekView() {
    const weekDates  = getWeekDates(currentDate)
    const hours      = Array.from({ length: 17 }, (_, i) => i + 6) // 6–22

    return (
      <div className={styles.weekView}>
        {/* Viikonpäivien otsikot */}
        <div className={styles.weekHeader}>
          <div className={styles.weekTimeGutter} /> {/* Aika-sarakkeen tyhjä otsikko */}
          {weekDates.map((day, i) => {
            const key     = dateKey(day)
            const isToday = key === todayKey
            return (
              <div key={key} className={`${styles.weekDayHeader} ${isToday ? styles.weekDayHeaderToday : ''}`}>
                <span className={styles.weekDayName}>{DAY_LABELS[i]}</span>
                <span className={styles.weekDayNum}>{day.getDate()}.{day.getMonth() + 1}.</span>
              </div>
            )
          })}
        </div>

        {/* Aika-ruudukko */}
        <div className={styles.weekBody}>
          {/* Aika-sarake */}
          <div className={styles.weekTimeGutter}>
            {hours.map((h) => (
              <div key={h} className={styles.weekHourLabel}>{h}:00</div>
            ))}
          </div>

          {/* Päiväsarakkeet */}
          {weekDates.map((day, colIdx) => {
            const key       = dateKey(day)
            const dayEvents = eventMap[key] ?? []
            // Tapahtumat joilla on kellonaika
            const timedEvents = dayEvents.filter((ev) => ev.time)
            // Tapahtumat ilman kellonaikaa
            const allDayEvents = dayEvents.filter((ev) => !ev.time)

            return (
              <div
                key={key}
                className={styles.weekDayCol}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, key)}
              >
                {/* Koko päivän tapahtumat */}
                {allDayEvents.length > 0 && (
                  <div className={styles.weekAllDay}>
                    {allDayEvents.map((ev) => (
                      <EventChip
                        key={ev.id}
                        event={ev}
                        onDragStart={handleDragStart}
                        onClick={(e) => { e.stopPropagation(); setModal({ mode: 'view', event: ev }) }}
                      />
                    ))}
                  </div>
                )}
                {/* Tuntisarake klikkaukset */}
                {hours.map((h) => (
                  <div
                    key={h}
                    className={styles.weekHourCell}
                    onClick={() => {
                      const timeStr = `${String(h).padStart(2, '0')}:00`
                      setModal({ mode: 'add', date: key, time: timeStr })
                    }}
                  />
                ))}
                {/* Ajoitetut tapahtumat asemoituna kellonajan mukaan */}
                {timedEvents.map((ev) => {
                  const [hh, mm] = ev.time.split(':').map(Number)
                  const topPct   = ((hh - 6 + mm / 60) / 16) * 100
                  const heightPct = ev.duration ? (ev.duration / 60 / 16) * 100 : 3
                  return (
                    <div
                      key={ev.id}
                      className={styles.weekEvent}
                      style={{
                        top:              `${topPct}%`,
                        height:           `${Math.max(2, heightPct)}%`,
                        background:       getEventColor(ev.type),
                        left:             '2px',
                        right:            '2px',
                      }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, ev)}
                      onClick={(e) => { e.stopPropagation(); setModal({ mode: 'view', event: ev }) }}
                    >
                      <span className={styles.weekEventTitle}>{ev.title}</span>
                      <span className={styles.weekEventTime}>{ev.time?.slice(0, 5)}</span>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── KAUSNÄKYMÄ ──

  function SeasonView() {
    // Määritä kaudenaikaväli faaseista tai käytä kuluva vuosi
    const { rangeStart, rangeEnd } = useMemo(() => {
      const valid = phases.filter((p) => p.start && p.end)
      if (valid.length === 0) {
        const y = new Date().getFullYear()
        return { rangeStart: new Date(y, 0, 1), rangeEnd: new Date(y, 11, 31) }
      }
      return {
        rangeStart: new Date(Math.min(...valid.map((p) => new Date(p.start)))),
        rangeEnd:   new Date(Math.max(...valid.map((p) => new Date(p.end)))),
      }
    }, [])

    const months = useMemo(() => {
      const list = []
      const y0 = rangeStart.getFullYear(), m0 = rangeStart.getMonth()
      const y1 = rangeEnd.getFullYear(),   m1 = rangeEnd.getMonth()
      let y = y0, m = m0
      while (y < y1 || (y === y1 && m <= m1)) {
        list.push({ year: y, month: m })
        m++
        if (m > 11) { m = 0; y++ }
      }
      return list
    }, [rangeStart, rangeEnd])

    return (
      <div className={styles.seasonGrid}>
        {months.map(({ year, month }) => {
          const weeks   = buildMonthGrid(year, month)
          const midKey  = dateKey(new Date(year, month, 15))
          const phase   = phaseForDate(midKey, phases)

          return (
            <div key={`${year}-${month}`} className={styles.seasonMonthCard}>
              <div
                className={styles.seasonMonthHeader}
                style={phase ? { borderLeft: `3px solid ${phase.color}` } : {}}
              >
                <span className={styles.seasonMonthName}>{FI_MONTHS[month]}</span>
                <span className={styles.seasonMonthYear}>{year}</span>
                {phase && (
                  <span className={styles.seasonPhaseBadge} style={{ color: phase.color }}>
                    {phase.label ?? phase.name}
                  </span>
                )}
              </div>

              <div className={styles.seasonDayLabels}>
                {DAY_LABELS.map((d) => (
                  <div key={d} className={styles.seasonDayLabel}>{d}</div>
                ))}
              </div>

              {weeks.map((week, wi) => (
                <div key={wi} className={styles.seasonWeek}>
                  {week.map((day, di) => {
                    if (!day) return <div key={di} className={styles.seasonEmptyCell} />
                    const key       = dateKey(day)
                    const dayEvents = eventMap[key] ?? []
                    const isToday   = key === todayKey
                    const isWeekend = di >= 5

                    return (
                      <div
                        key={di}
                        className={[
                          styles.seasonDayCell,
                          isToday   ? styles.seasonDayCellToday   : '',
                          isWeekend ? styles.seasonDayCellWeekend : '',
                        ].filter(Boolean).join(' ')}
                        onClick={() => setModal({ mode: 'add', date: key })}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, key)}
                      >
                        <span className={styles.seasonDayNum}>{day.getDate()}</span>
                        {dayEvents.map((ev) => (
                          <div
                            key={ev.id}
                            className={styles.seasonChip}
                            style={{ background: getEventColor(ev.type) }}
                            draggable
                            onDragStart={(e) => { e.stopPropagation(); handleDragStart(e, ev) }}
                            onClick={(e) => { e.stopPropagation(); setModal({ mode: 'view', event: ev }) }}
                            title={ev.title}
                          />
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    )
  }

  // ── TAPAHTUMACHIPIN KOMPONENTTI ──

  function EventChip({ event, onDragStart, onClick }) {
    return (
      <div
        className={styles.chip}
        style={{ background: getEventColor(event.type) }}
        draggable
        onDragStart={(e) => onDragStart(e, event)}
        onClick={onClick}
        title={event.title}
      >
        <span className={styles.chipTitle}>{event.title}</span>
        {event.time && <span className={styles.chipTime}>{event.time.slice(0, 5)}</span>}
        {event.theme && <span className={styles.chipTheme}>{event.theme}</span>}
      </div>
    )
  }

  // ── LISÄYSMODAALI ──

  function AddModal() {
    const initDate = modal?.date ?? dateKey(new Date())
    const initTime = modal?.time ?? ''
    return (
      <div className={styles.modalOverlay} onClick={() => setModal(null)}>
        <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <span className={styles.modalTitle}>Lisää tapahtuma</span>
            <button className={styles.modalClose} onClick={() => setModal(null)}>✕</button>
          </div>
          <EventForm
            initialValues={{
              type: 'drill',
              title: 'Treeni',
              date: initDate,
              time: initTime,
              duration: 60,
              theme: '',
              isRecurring: false,
              recurringUntil: '',
            }}
            onSubmit={handleAddSubmit}
            onCancel={() => setModal(null)}
            submitLabel="Lisää"
          />
        </div>
      </div>
    )
  }

  // ── NÄYTTÖ- JA MUOKKAUSMODAALI ──

  function EventModal() {
    const event = modal?.event
    if (!event) return null
    const isEditing = modal?.mode === 'edit'
    const typeInfo  = EVENT_TYPES.find((t) => t.id === event.type)

    if (isEditing) {
      return (
        <div className={styles.modalOverlay} onClick={() => setModal(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>Muokkaa tapahtumaa</span>
              <button className={styles.modalClose} onClick={() => setModal(null)}>✕</button>
            </div>
            <EventForm
              initialValues={{
                type:           event.type,
                title:          event.title,
                date:           event.date,
                time:           event.time ?? '',
                duration:       event.duration ?? 60,
                theme:          event.theme ?? '',
                isRecurring:    false,
                recurringUntil: '',
              }}
              onSubmit={handleEditSubmit}
              onCancel={() => setModal({ mode: 'view', event })}
              submitLabel="Tallenna"
            />
          </div>
        </div>
      )
    }

    // Näyttömodaali
    return (
      <div className={styles.modalOverlay} onClick={() => setModal(null)}>
        <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader} style={{ borderLeft: `3px solid ${typeInfo?.color}` }}>
            <span className={styles.modalTitle}>{event.title}</span>
            <button className={styles.modalClose} onClick={() => setModal(null)}>✕</button>
          </div>
          <div className={styles.viewBody}>
            {/* Tyyppi-merkki */}
            <div className={styles.viewRow}>
              <span
                className={styles.typeBadge}
                style={{ background: typeInfo?.color }}
              >
                {typeInfo?.label}
              </span>
            </div>
            {/* Päivämäärä */}
            <div className={styles.viewRow}>
              <span className={styles.viewLabel}>Päivämäärä</span>
              <span className={styles.viewValue}>{formatDateFi(event.date)}</span>
            </div>
            {/* Kellonaika */}
            {event.time && (
              <div className={styles.viewRow}>
                <span className={styles.viewLabel}>Kellonaika</span>
                <span className={styles.viewValue}>{event.time.slice(0, 5)}</span>
              </div>
            )}
            {/* Kesto */}
            {event.duration && event.type !== 'rest' && (
              <div className={styles.viewRow}>
                <span className={styles.viewLabel}>Kesto</span>
                <span className={styles.viewValue}>{event.duration} min</span>
              </div>
            )}
            {/* Teema */}
            {event.theme && event.type === 'drill' && (
              <div className={styles.viewRow}>
                <span className={styles.viewLabel}>Viikkoteema</span>
                <span className={styles.viewValue}>{event.theme}</span>
              </div>
            )}
            {/* Toistuva-merkintä */}
            {event.is_recurring && (
              <div className={styles.viewRow}>
                <span className={styles.viewLabel}>Toistuva</span>
                <span className={styles.viewValue}>
                  {event.recurring_until ? `asti ${formatDateFi(event.recurring_until)}` : 'kyllä'}
                </span>
              </div>
            )}
          </div>
          <div className={styles.viewActions}>
            <button
              className={styles.btnEdit}
              onClick={() => setModal({ mode: 'edit', event })}
            >
              Muokkaa
            </button>
            <button
              className={styles.btnDelete}
              onClick={() => handleDeleteRequest(event)}
            >
              Poista
            </button>
            <button
              className={styles.btnClose}
              onClick={() => setModal(null)}
            >
              Sulje
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── VAHVISTUSDIALOKIT ──

  function ConfirmDialog() {
    if (!confirmDialog) return null

    // Yksittäisen tapahtuman poisto
    if (confirmDialog.type === 'delete') {
      return (
        <div className={styles.modalOverlay} onClick={() => setConfirmDialog(null)}>
          <div className={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
            <p className={styles.confirmText}>
              Haluatko varmasti poistaa tapahtuman <strong>{confirmDialog.event.title}</strong>?
            </p>
            <div className={styles.confirmActions}>
              <button className={styles.btnConfirmDelete} onClick={() => handleConfirmDelete(confirmDialog.event)}>
                Poista
              </button>
              <button className={styles.btnConfirmCancel} onClick={() => setConfirmDialog(null)}>
                Peruuta
              </button>
            </div>
          </div>
        </div>
      )
    }

    // Toistuvan tapahtuman poisto
    if (confirmDialog.type === 'deleteRecurring') {
      return (
        <div className={styles.modalOverlay} onClick={() => setConfirmDialog(null)}>
          <div className={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
            <p className={styles.confirmText}>Poistetaanko vain tämä vai kaikki tulevat tapahtumat?</p>
            <div className={styles.confirmActions}>
              <button className={styles.btnConfirmDelete} onClick={() => handleConfirmDelete(confirmDialog.event)}>
                Vain tämä
              </button>
              <button className={styles.btnConfirmDeleteAll} onClick={() => handleConfirmDeleteFuture(confirmDialog.event)}>
                Kaikki tulevat
              </button>
              <button className={styles.btnConfirmCancel} onClick={() => setConfirmDialog(null)}>
                Peruuta
              </button>
            </div>
          </div>
        </div>
      )
    }

    // Raahauksen vahvistus
    if (confirmDialog.type === 'dragConfirm') {
      return (
        <div className={styles.modalOverlay} onClick={() => setConfirmDialog(null)}>
          <div className={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
            <p className={styles.confirmText}>
              Siirretäänkö tapahtuma{' '}
              <strong>{formatDateFi(confirmDialog.originalDate)}</strong>
              {' '}→{' '}
              <strong>{formatDateFi(confirmDialog.targetDate)}</strong>?
            </p>
            <div className={styles.confirmActions}>
              <button className={styles.btnConfirmOk} onClick={handleConfirmDrag}>
                Kyllä
              </button>
              <button className={styles.btnConfirmCancel} onClick={() => setConfirmDialog(null)}>
                Ei
              </button>
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  // ── RENDERÖINTI ──

  return (
    <section className={styles.section}>
      {/* Faasiaikajana — klikkaa jaksoa filtteröidäksesi */}
      <PhaseBar phases={phases} activePhase={activePhase} onPhaseClick={handlePhaseClick} />
      {activePhase && (
        <div className={styles.phaseFilterBar}>
          <span className={styles.phaseFilterLabel}>
            Näytetään: <strong>{activePhase.label ?? activePhase.name}</strong>
          </span>
          <button className={styles.phaseFilterReset} onClick={() => setActivePhase(null)}>
            Näytä kaikki
          </button>
        </div>
      )}

      {/* Yläpalkki: näkymävalitsin + navigaatio */}
      <div className={styles.toolbar}>
        <div className={styles.viewTabs}>
          <button
            className={view === 'month' ? styles.tabActive : styles.tab}
            onClick={() => setView('month')}
          >
            Kuukausi
          </button>
          <button
            className={view === 'week' ? styles.tabActive : styles.tab}
            onClick={() => setView('week')}
          >
            Viikko
          </button>
          <button
            className={view === 'season' ? styles.tabActive : styles.tab}
            onClick={() => setView('season')}
          >
            Kausi
          </button>
        </div>

        {view !== 'season' && (
          <NavigationBar
            view={view}
            currentDate={currentDate}
            onPrev={handlePrev}
            onNext={handleNext}
            onToday={handleToday}
          />
        )}
      </div>

      {/* Kalenteri */}
      {view === 'month'  && <MonthView />}
      {view === 'week'   && <WeekView />}
      {view === 'season' && <SeasonView />}

      {/* Modaalit */}
      {modal?.mode === 'add'                              && <AddModal />}
      {(modal?.mode === 'view' || modal?.mode === 'edit') && <EventModal />}

      {/* Vahvistusdialokit */}
      {confirmDialog && <ConfirmDialog />}

      {/* Tilastopalkki — käyttää filtteröityjä tapahtumia jos jakso valittu */}
      <StatsBar events={filteredEvents} phases={phases} />
    </section>
  )
}
