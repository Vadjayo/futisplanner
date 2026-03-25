/**
 * validators.js
 * Lomakkeiden ja syöttökenttien validointifunktiot.
 */

/**
 * Tarkistaa sähköpostiosoitteen muodon
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Tarkistaa salasanan vahvuuden (vähintään 8 merkkiä)
 * @param {string} password
 * @returns {{ valid: boolean, message: string | null }}
 */
export function validatePassword(password) {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Salasanan täytyy olla vähintään 8 merkkiä.' }
  }
  return { valid: true, message: null }
}

/**
 * Tarkistaa että salasanat täsmäävät
 * @param {string} password
 * @param {string} confirm
 * @returns {{ valid: boolean, message: string | null }}
 */
export function passwordsMatch(password, confirm) {
  if (password !== confirm) {
    return { valid: false, message: 'Salasanat eivät täsmää.' }
  }
  return { valid: true, message: null }
}

/**
 * Tarkistaa että kenttä ei ole tyhjä
 * @param {string} value
 * @param {string} fieldName
 * @returns {{ valid: boolean, message: string | null }}
 */
export function required(value, fieldName = 'Kenttä') {
  if (!value || !value.trim()) {
    return { valid: false, message: `${fieldName} on pakollinen.` }
  }
  return { valid: true, message: null }
}
