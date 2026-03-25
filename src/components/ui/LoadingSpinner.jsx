/**
 * LoadingSpinner.jsx
 * Latauspyörä. Käytä kun sivu tai data on latautumisvaiheessa.
 */

import styles from './LoadingSpinner.module.css'

/**
 * @param {'sm'|'md'|'lg'} size
 * @param {boolean} fullPage  — täyttää koko näytön, käytä sivulatauksen aikana
 */
export default function LoadingSpinner({ size = 'md', fullPage = false }) {
  const spinner = <div className={[styles.spinner, styles[size]].join(' ')} role="status" aria-label="Ladataan..." />

  if (fullPage) {
    return <div className={styles.fullPage}>{spinner}</div>
  }
  return spinner
}
