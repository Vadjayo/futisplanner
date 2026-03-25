/**
 * Modal.jsx
 * Yleiskäyttöinen modaali-komponentti. Sulkeutuu taustaa klikkaamalla tai Escape-näppäimellä.
 */

import { useEffect } from 'react'
import styles from './Modal.module.css'

/**
 * @param {boolean} open
 * @param {() => void} onClose
 * @param {string} title
 * @param {'sm'|'md'|'lg'} size
 */
export default function Modal({ open, onClose, title, size = 'md', children }) {
  // Sulje Escape-näppäimellä
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={[styles.dialog, styles[size]].join(' ')}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div className={styles.header}>
            <h2 className={styles.title}>{title}</h2>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Sulje">✕</button>
          </div>
        )}
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  )
}
