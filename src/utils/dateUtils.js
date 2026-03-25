/**
 * dateUtils.js
 * Päivämäärä- ja aika-apufunktiot.
 */

/**
 * Palauttaa päivämäärän muodossa 'YYYY-MM-DD' (sv-SE-lokaali käyttää ISO-formaattia)
 * @param {Date} date
 * @returns {string}
 */
export function toDateKey(date) {
  return date.toLocaleDateString('sv-SE')
}

/**
 * Palauttaa tämän päivän muodossa 'YYYY-MM-DD'
 * @returns {string}
 */
export function today() {
  return toDateKey(new Date())
}

/**
 * Formatoi 'YYYY-MM-DD' suomeksi lyhyesti, esim. "ti 3.6."
 * @param {string} iso
 * @returns {string}
 */
export function fmtDateShort(iso) {
  if (!iso) return ''
  return new Date(iso + 'T00:00:00').toLocaleDateString('fi-FI', {
    weekday: 'short', day: 'numeric', month: 'numeric',
  })
}

/**
 * Formatoi 'YYYY-MM-DD' suomeksi pitkästi, esim. "tiistai 3.6.2025"
 * @param {string} iso
 * @returns {string}
 */
export function fmtDateLong(iso) {
  if (!iso) return ''
  return new Date(iso + 'T00:00:00').toLocaleDateString('fi-FI', {
    weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric',
  })
}

/**
 * Palauttaa kahden ISO-päivämäärän välisen eron päivinä
 * @param {string} startIso
 * @param {string} endIso
 * @returns {number}
 */
export function daysBetween(startIso, endIso) {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime()
  return Math.ceil(ms / 86400000)
}

/**
 * Palauttaa viikon maanantain Date-objektina annetusta päivämäärästä
 * @param {Date} date
 * @returns {Date}
 */
export function getMondayOf(date) {
  const d = new Date(date)
  const dow = (d.getDay() + 6) % 7 // 0 = maanantai
  d.setDate(d.getDate() - dow)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Generoi viikkoittaiset toistuvat päivämäärät alusta loppuun (sama viikonpäivä)
 * @param {string} startIso
 * @param {string} untilIso
 * @returns {string[]}
 */
export function generateWeeklyDates(startIso, untilIso) {
  const dates = []
  const current = new Date(startIso + 'T00:00:00')
  const until   = new Date(untilIso + 'T00:00:00')
  while (current <= until) {
    dates.push(toDateKey(current))
    current.setDate(current.getDate() + 7)
  }
  return dates
}
