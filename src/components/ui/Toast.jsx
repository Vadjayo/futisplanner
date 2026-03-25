/**
 * Toast.jsx
 * Ilmoituspalkki oikeaan yläkulmaan. Käytetään yhdessä useToast-hookin kanssa.
 *
 * Käyttö:
 *   const { toasts } = useToast()
 *   return <ToastContainer toasts={toasts} />
 */

import styles from './Toast.module.css'

const ICONS = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' }

/**
 * Yksittäinen toast-viesti
 */
function Toast({ message, type = 'success', onDismiss }) {
  return (
    <div className={[styles.toast, styles[type]].join(' ')} role="alert">
      <span className={styles.icon}>{ICONS[type]}</span>
      <span className={styles.message}>{message}</span>
      {onDismiss && (
        <button className={styles.dismiss} onClick={onDismiss} aria-label="Sulje">✕</button>
      )}
    </div>
  )
}

/**
 * Kaikkien toastien säiliö — renderöi oikeaan yläkulmaan
 */
export function ToastContainer({ toasts = [] }) {
  if (toasts.length === 0) return null
  return (
    <div className={styles.container}>
      {toasts.map((t) => (
        <Toast key={t.id} {...t} />
      ))}
    </div>
  )
}

export default Toast
