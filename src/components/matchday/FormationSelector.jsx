/**
 * FormationSelector.jsx
 * Muodostelman valinta napeilla ryhmiteltyinä pelimuodon mukaan.
 * Aktiivinen muodostelma korostetaan.
 */

import styles from './MatchDay.module.css'

/** Muodostelmat ryhmiteltyinä pelimuodon mukaan */
const GROUPS = [
  { label: '11v11', formations: ['4-3-3', '4-4-2', '3-5-2', '4-2-3-1', '5-3-2'] },
  { label: '8v8',   formations: ['3-3-1', '3-2-2', '2-4-1'] },
  { label: '5v5',   formations: ['2-2', '1-2-1'] },
]

/**
 * @param {string}   current   - Nykyinen muodostelma
 * @param {function} onChange  - (formation: string) => void
 */
export default function FormationSelector({ current, onChange }) {
  return (
    <div className={styles.formationGroups}>
      {GROUPS.map((group) => (
        <div key={group.label} className={styles.formationGroup}>
          <span className={styles.formationGroupLabel}>{group.label}</span>
          <div className={styles.formationRow}>
            {group.formations.map((f) => (
              <button
                key={f}
                className={`${styles.formationBtn} ${f === current ? styles.formationBtnActive : ''}`}
                onClick={() => onChange(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
