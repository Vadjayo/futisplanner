/**
 * validators.js
 * Lomakkeiden ja syöttökenttien validointifunktiot.
 * Palauttavat aina joko virheviestin (string) tai null jos ok.
 */

/**
 * Validoi sähköpostiosoitteen muodon.
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Validoi salasanan vahvuuden (vähintään 8 merkkiä).
 * @param {string} password
 * @returns {string|null}  Virheviesti tai null jos ok
 */
export const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return 'Salasanan täytyy olla vähintään 8 merkkiä'
  }
  return null
}

/**
 * Tarkistaa että salasanat täsmäävät.
 * @param {string} password
 * @param {string} confirm
 * @returns {string|null}  Virheviesti tai null jos ok
 */
export const passwordsMatch = (password, confirm) => {
  return password !== confirm ? 'Salasanat eivät täsmää' : null
}

/**
 * Tarkistaa että kenttä ei ole tyhjä.
 * @param {string} value
 * @param {string} fieldName
 * @returns {string|null}  Virheviesti tai null jos ok
 */
export const required = (value, fieldName = 'Kenttä') => {
  return !value?.trim() ? `${fieldName} on pakollinen` : null
}

/**
 * Validoi rekisteröintilomakkeen kaikki kentät kerralla.
 * @param {{ name: string, email: string, password: string, confirm: string }} fields
 * @returns {Record<string, string>}  Kenttä → virheviesti. Tyhjä objekti = ei virheitä.
 */
export const validateRegisterForm = ({ name, email, password, confirm }) => {
  const errors = {}

  const nameErr = required(name, 'Nimi')
  if (nameErr) errors.name = nameErr

  if (!isValidEmail(email)) errors.email = 'Tarkista sähköpostiosoite'

  const pwErr = validatePassword(password)
  if (pwErr) errors.password = pwErr

  const matchErr = passwordsMatch(password, confirm)
  if (matchErr) errors.confirm = matchErr

  return errors
}

/**
 * Validoi kirjautumislomakkeen kentät.
 * @param {{ email: string, password: string }} fields
 * @returns {Record<string, string>}
 */
export const validateLoginForm = ({ email, password }) => {
  const errors = {}
  if (!isValidEmail(email))   errors.email    = 'Tarkista sähköpostiosoite'
  if (!password?.trim())      errors.password = 'Salasana on pakollinen'
  return errors
}
