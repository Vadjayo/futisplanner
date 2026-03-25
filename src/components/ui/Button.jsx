/**
 * Button.jsx
 * Yleiskäyttöinen painike-komponentti. Tukee variantteja, kokoja ja lataustilaa.
 *
 * Käyttö:
 *   <Button variant="primary" size="md" onClick={...}>Tallenna</Button>
 *   <Button variant="ghost" loading>Odota...</Button>
 */

import styles from './Button.module.css'

/**
 * @param {'primary'|'secondary'|'ghost'|'danger'} variant
 * @param {'sm'|'md'|'lg'} size
 * @param {boolean} loading
 * @param {boolean} fullWidth
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) {
  return (
    <button
      className={[
        styles.btn,
        styles[variant],
        styles[size],
        fullWidth ? styles.fullWidth : '',
        className,
      ].filter(Boolean).join(' ')}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </button>
  )
}
