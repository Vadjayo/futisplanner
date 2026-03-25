/**
 * formatters.js
 * Näyttöarvojen muotoilufunktiot.
 */

/**
 * Muotoilee treeniä/viikko -arvon näytettäväksi
 * @param {number} drills  — tehtyjen treenien määrä
 * @param {number} weeks   — viikkojen määrä
 * @returns {string}  esim. "3×" tai "1.5×"
 */
export function fmtDrillsPerWeek(drills, weeks) {
  if (!weeks || weeks === 0) return '0×'
  const dpw = drills / weeks
  return dpw >= 1 ? `${Math.round(dpw)}×` : `${dpw.toFixed(1)}×`
}

/**
 * Muotoilee prosentin (0–100) näytettäväksi
 * @param {number} value  — 0–100
 * @returns {string}  esim. "72%"
 */
export function fmtPercent(value) {
  return `${Math.min(100, Math.max(0, Math.round(value)))}%`
}

/**
 * Muotoilee keston minuuteista tunteiksi ja minuuteiksi
 * @param {number} minutes
 * @returns {string}  esim. "1 h 30 min" tai "45 min"
 */
export function fmtDuration(minutes) {
  if (!minutes) return '–'
  if (minutes < 60) return `${minutes} min`
  const h   = Math.floor(minutes / 60)
  const min = minutes % 60
  return min > 0 ? `${h} h ${min} min` : `${h} h`
}

/**
 * Lyhentää tekstin annettuun merkkimäärään ja lisää "…"
 * @param {string} text
 * @param {number} maxLen
 * @returns {string}
 */
export function truncate(text, maxLen = 40) {
  if (!text) return ''
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text
}
