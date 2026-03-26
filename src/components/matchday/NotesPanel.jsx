/**
 * NotesPanel.jsx
 * Vapaa muistiinpanokenttä pelipäivälle.
 */

import styles from './MatchDay.module.css'

/**
 * @param {string}   notes     - Muistiinpanot
 * @param {function} onChange  - (field, value) => void
 */
export default function NotesPanel({ notes, onChange }) {
  return (
    <div className={styles.tabContent}>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Muistiinpanot</label>
        <textarea
          className={styles.textarea}
          value={notes}
          onChange={(e) => onChange('notes', e.target.value)}
          placeholder={'Vastustajan vahvuudet ja heikkoudet&#10;Avainkohdat ennen peliä&#10;Muuta huomioitavaa...'}
          rows={12}
        />
      </div>
    </div>
  )
}
