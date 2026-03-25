/**
 * Input.jsx
 * Yleiskäyttöinen syötekenttä tummalla teemalla. Tukee label, error ja helper-tekstiä.
 */

import styles from './Input.module.css'

/**
 * @param {'text'|'email'|'password'|'number'|'date'|'time'} type
 * @param {string} label
 * @param {string} error
 * @param {string} helper
 */
export default function Input({
  label,
  error,
  helper,
  id,
  className = '',
  ...props
}) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')}>
      {label && (
        <label className={styles.label} htmlFor={inputId}>{label}</label>
      )}
      <input
        id={inputId}
        className={[styles.input, error ? styles.inputError : ''].filter(Boolean).join(' ')}
        {...props}
      />
      {error  && <p className={styles.error}>{error}</p>}
      {!error && helper && <p className={styles.helper}>{helper}</p>}
    </div>
  )
}
