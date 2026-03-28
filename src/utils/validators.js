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

// ── TIETOTURVAVALIDAATTORIT ──
// Palauttavat { valid: boolean, error: string|null }

/** Vaarallisten HTML/skripti/SQL-merkkien havainnointi nimikentissä.
 *  Käyttää whitelist-lähestymistapaa: vain kirjaimet, numerot ja yleiset nimissä
 *  esiintyvät merkit sallitaan. */
const NAME_WHITELIST = /^[a-zA-ZÀ-ÖØ-öø-ÿ0-9\s'\-./]+$/

/** Vaarallisten koodinsyöttöyritysten tunnistus vapaamuotoisille tekstikentille */
const XSS_PATTERN = /<[^>]*>|javascript:|on\w+\s*=|\$\{|\{\{/i
const SQL_PATTERN = /;\s*(?:drop|insert|update|delete|select|truncate|exec)\s/i

/**
 * Validoi sähköpostiosoitteen palauttaen { valid, error } -objektin.
 * @param {string} email
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string')
    return { valid: false, error: 'Sähköposti on pakollinen' }
  if (XSS_PATTERN.test(email))
    return { valid: false, error: 'Sähköposti sisältää kiellettyjä merkkejä' }
  if (!isValidEmail(email))
    return { valid: false, error: 'Tarkista sähköpostiosoite' }
  return { valid: true, error: null }
}

/**
 * Validoi pelaajan nimen (whitelist — vain nimikirjaimet ja välimerkit).
 * @param {string} name
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validatePlayerName(name) {
  if (name == null || typeof name !== 'string')
    return { valid: false, error: 'Nimi on pakollinen' }
  const trimmed = name.trim()
  if (!trimmed)
    return { valid: false, error: 'Nimi on pakollinen' }
  if (trimmed.length > 100)
    return { valid: false, error: 'Nimi on liian pitkä (max 100 merkkiä)' }
  if (!NAME_WHITELIST.test(trimmed))
    return { valid: false, error: 'Nimi sisältää kiellettyjä merkkejä' }
  return { valid: true, error: null }
}

/**
 * Validoi joukkueen nimen (whitelist — vain nimikirjaimet ja välimerkit).
 * @param {string} name
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateTeamName(name) {
  if (name == null || typeof name !== 'string')
    return { valid: false, error: 'Nimi on pakollinen' }
  const trimmed = name.trim()
  if (!trimmed)
    return { valid: false, error: 'Nimi on pakollinen' }
  if (trimmed.length > 100)
    return { valid: false, error: 'Nimi on liian pitkä (max 100 merkkiä)' }
  if (!NAME_WHITELIST.test(trimmed))
    return { valid: false, error: 'Nimi sisältää kiellettyjä merkkejä' }
  return { valid: true, error: null }
}

/**
 * Validoi harjoituksen otsikon (tarkistaa XSS- ja SQL-injektioyritykset).
 * @param {string} title
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateSessionTitle(title) {
  if (title == null || typeof title !== 'string')
    return { valid: false, error: 'Otsikko on pakollinen' }
  const trimmed = title.trim()
  if (!trimmed)
    return { valid: false, error: 'Otsikko on pakollinen' }
  if (trimmed.length > 200)
    return { valid: false, error: 'Otsikko on liian pitkä (max 200 merkkiä)' }
  if (XSS_PATTERN.test(trimmed) || SQL_PATTERN.test(trimmed))
    return { valid: false, error: 'Otsikko sisältää kiellettyjä merkkejä' }
  return { valid: true, error: null }
}
