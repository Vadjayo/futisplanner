/**
 * dateUtils.js
 * Päivämäärä- ja aika-apufunktiot.
 */

/**
 * Muotoilee päivämäärän suomalaiseen muotoon.
 * Esim: "ti 25.3.2026"
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDate = (date) => {
  return new Intl.DateTimeFormat('fi-FI', {
    weekday: 'short',
    day:     'numeric',
    month:   'numeric',
    year:    'numeric',
  }).format(new Date(date))
}

/**
 * Muotoilee päivämäärän lyhyesti ilman vuotta.
 * Esim: "ti 3.6."
 * @param {string} iso  - 'YYYY-MM-DD'
 * @returns {string}
 */
export const formatDateShort = (iso) => {
  if (!iso) return ''
  return new Date(iso + 'T00:00:00').toLocaleDateString('fi-FI', {
    weekday: 'short', day: 'numeric', month: 'numeric',
  })
}

/**
 * Palauttaa päivämäärän muodossa 'YYYY-MM-DD'.
 * @param {Date} date
 * @returns {string}
 */
export const toDateKey = (date) => date.toLocaleDateString('sv-SE')

/**
 * Palauttaa tämän päivän muodossa 'YYYY-MM-DD'.
 * @returns {string}
 */
export const today = () => toDateKey(new Date())

/**
 * Tarkistaa onko päivämäärä tänään.
 * @param {string|Date} date
 * @returns {boolean}
 */
export const isToday = (date) => {
  const t = new Date()
  const d = new Date(date)
  return (
    d.getDate()     === t.getDate()     &&
    d.getMonth()    === t.getMonth()    &&
    d.getFullYear() === t.getFullYear()
  )
}

/**
 * Laskee kokonaisten viikkojen määrän kahden päivämäärän välillä (vähintään 1).
 * @param {Date|number} start
 * @param {Date|number} end
 * @returns {number}
 */
export const getWeeksBetween = (start, end) => {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  return Math.max(1, Math.floor((Number(end) - Number(start)) / msPerWeek))
}

/**
 * Laskee päivien määrän kahden ISO-päivämäärän välillä.
 * @param {string} startIso
 * @param {string} endIso
 * @returns {number}
 */
export const daysBetween = (startIso, endIso) => {
  return Math.ceil((new Date(endIso) - new Date(startIso)) / 86400000)
}

/**
 * Laskee kausisuunnitelman täyttöprosentin.
 * Prosentti = uniikit tapahtumapaivat / kauden päivien kokonaismäärä.
 * @param {Array<{ date: string }>} events
 * @param {string} seasonStart  - 'YYYY-MM-DD'
 * @param {string} seasonEnd    - 'YYYY-MM-DD'
 * @returns {number}  0–100
 */
export const getSeasonProgress = (events, seasonStart, seasonEnd) => {
  const totalDays = Math.max(1, Math.floor(
    (new Date(seasonEnd) - new Date(seasonStart)) / 86400000
  ))
  const uniqueDays = new Set(events.map((e) => e.date)).size
  return Math.min(100, Math.round((uniqueDays / totalDays) * 100))
}

/**
 * Generoi viikoittaiset toistuvat päivämäärät alusta loppuun (sama viikonpäivä).
 * @param {string} startIso
 * @param {string} untilIso
 * @returns {string[]}
 */
export const generateWeeklyDates = (startIso, untilIso) => {
  const dates   = []
  const current = new Date(startIso + 'T00:00:00')
  const until   = new Date(untilIso + 'T00:00:00')
  while (current <= until) {
    dates.push(toDateKey(current))
    current.setDate(current.getDate() + 7)
  }
  return dates
}
