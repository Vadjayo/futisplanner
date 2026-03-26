/**
 * FormationSelector.jsx
 * Muodostelman valinta napeilla. Aktiivinen muodostelma korostetaan.
 */

import styles from './MatchDay.module.css'

const AVAILABLE = ['4-3-3', '4-4-2', '3-5-2', '4-2-3-1', '5-3-2']

/**
 * @param {string}   current   - Nykyinen muodostelma
 * @param {function} onChange  - (formation: string) => void
 */
export default function FormationSelector({ current, onChange }) {
  return (
    <div className={styles.formationRow}>
      {AVAILABLE.map((f) => (
        <button
          key={f}
          className={`${styles.formationBtn} ${f === current ? styles.formationBtnActive : ''}`}
          onClick={() => onChange(f)}
        >
          {f}
        </button>
      ))}
    </div>
  )
}
