/**
 * RecentMatches.jsx
 * Dashboard-widgetti: viimeisimmät 5 pelipäiväsuunnitelmaa tuloksineen.
 */

import { COLORS } from '../../constants/colors'
import styles     from './RecentMatches.module.css'

/**
 * Muotoilee ottelupäivämäärän suomeksi.
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {string}
 */
function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fi-FI', {
    day: 'numeric', month: 'numeric', year: 'numeric',
  })
}

/**
 * Skeletonrivit lataustilaa varten.
 */
function SkeletonRows() {
  return Array.from({ length: 3 }).map((_, i) => (
    <div key={i} className={styles.skeletonRow} />
  ))
}

/**
 * @param {object}   props
 * @param {boolean}  props.loading
 * @param {Array}    props.matches      - match_plans-rivit dashboardServicestä
 * @param {function} props.onOpen       - (matchId) => void
 * @param {function} props.onNew        - () => void — navigoi uuteen pelipäivään
 */
export default function RecentMatches({ loading, matches, onOpen, onNew }) {
  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Viimeisimmät ottelut</h2>
        <button className={styles.btnNew} onClick={onNew}>+ Uusi</button>
      </div>

      {loading ? (
        <div className={styles.list}><SkeletonRows /></div>
      ) : matches.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>Ei tallennettuja otteluita.</p>
          <button className={styles.btnEmpty} onClick={onNew}>Luo pelipäivä</button>
        </div>
      ) : (
        <ul className={styles.list}>
          {matches.map((m) => {
            const hasResult = m.result_home !== null && m.result_away !== null
            return (
              <li key={m.id} className={styles.row} onClick={() => onOpen(m.id)}>
                <div className={styles.rowLeft}>
                  <span className={styles.opponent}>{m.opponent || 'Vastustaja'}</span>
                  <span className={styles.date}>{formatDate(m.match_date)}</span>
                </div>
                {hasResult ? (
                  <span
                    className={styles.result}
                    style={{ color: COLORS.text.primary }}
                  >
                    {m.result_home} – {m.result_away}
                  </span>
                ) : (
                  <span className={styles.noResult}>Ei tulosta</span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
