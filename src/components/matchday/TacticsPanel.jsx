/**
 * TacticsPanel.jsx
 * Taktiikkatekstikentät: hyökkäys ja puolustus.
 */

import styles from './MatchDay.module.css'

/**
 * @param {string}   tacticsAttack   - Hyökkäystaktiikat
 * @param {string}   tacticsDefense  - Puolustustaktiikat
 * @param {function} onChange        - (field, value) => void
 * @param {function} onOpenEditor    - Avaa harjoituseditori (linkki)
 */
export default function TacticsPanel({ tacticsAttack, tacticsDefense, onChange, onOpenEditor }) {
  return (
    <div className={styles.tabContent}>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Hyökkäystaktiikat</label>
        <textarea
          className={styles.textarea}
          value={tacticsAttack}
          onChange={(e) => onChange('tacticsAttack', e.target.value)}
          placeholder={'Rakennetaan hitaasti takaa, käytetään leveyttä...'}
          rows={5}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Puolustustaktiikat</label>
        <textarea
          className={styles.textarea}
          value={tacticsDefense}
          onChange={(e) => onChange('tacticsDefense', e.target.value)}
          placeholder={'Korkea prässi vastustajan alueella, tiukka linja...'}
          rows={5}
        />
      </div>

      {onOpenEditor && (
        <button className={styles.linkBtn} onClick={onOpenEditor}>
          Avaa treenisuunnittelija →
        </button>
      )}
    </div>
  )
}
