/**
 * drillUtils.js
 * Harjoituksiin liittyvät apufunktiot — käytetään sekä Dashboardissa että sivupalkissa.
 */

/**
 * Muotoile ISO-päivämäärä suomalaiseen muotoon (esim. "21.3.2025").
 * @param {string|null} isoString - ISO 8601 -muotoinen päivämäärämerkkijono
 * @returns {string} Lokalisoitu päivämäärä tai tyhjä merkkijono jos syöte puuttuu
 */
export function formatDate(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleDateString('fi-FI', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })
}

/**
 * Laske harjoitteiden yhteiskesto minuutteina.
 * @param {Array<{duration?: number}>|null|undefined} drills - Harjoitelista
 * @returns {number} Kokonaiskesto minuutteina (0 jos lista on tyhjä tai null)
 */
export function totalDuration(drills) {
  return (drills ?? []).reduce((sum, d) => sum + (d.duration ?? 0), 0)
}
