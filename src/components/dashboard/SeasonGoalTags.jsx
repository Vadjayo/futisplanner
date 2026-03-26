/**
 * SeasonGoalTags.jsx
 * Näyttää joukkueen kausitavoitteet tageinä kategorioittain.
 */

import { COLORS } from '../../constants/colors'
import styles     from './SeasonGoalTags.module.css'

const CATEGORIES = [
  { key: 'technical', label: 'Tekninen',  color: COLORS.event.drill },
  { key: 'tactical',  label: 'Taktinen',  color: COLORS.event.game },
  { key: 'physical',  label: 'Fyysinen',  color: COLORS.status.warning },
  { key: 'mental',    label: 'Henkinen',  color: COLORS.event.tournament },
]

/**
 * @param {boolean}      loading
 * @param {object|null}  goals    - { technical: string[], tactical: string[], ... }
 * @param {function}     onNavigate
 */
export default function SeasonGoalTags({ loading, goals, onNavigate }) {
  const hasGoals = goals && Object.values(goals).some((v) => Array.isArray(v) && v.length > 0)

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>Kausitavoitteet</h2>
        <button className={styles.editBtn} onClick={onNavigate}>Muokkaa</button>
      </div>

      {loading ? (
        <div className={styles.skeletonWrap}>
          {[60, 45, 75].map((w) => (
            <div key={w} className={styles.skel} style={{ width: `${w}%` }} />
          ))}
        </div>
      ) : !hasGoals ? (
        <p className={styles.empty}>
          Ei kausitavoitteita.{' '}
          <button className={styles.linkBtn} onClick={onNavigate}>Lisää tavoitteet →</button>
        </p>
      ) : (
        <div className={styles.categories}>
          {CATEGORIES.map(({ key, label, color }) => {
            const items = goals?.[key]
            if (!items?.length) return null
            return (
              <div key={key} className={styles.category}>
                <span className={styles.catLabel} style={{ color }}>{label}</span>
                <div className={styles.tags}>
                  {items.map((g, i) => (
                    <span key={i} className={styles.tag} style={{ borderColor: color + '40', color }}>
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
