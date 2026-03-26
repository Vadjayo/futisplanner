/**
 * RecentSessions.jsx
 * Viimeksi muokatut harjoitussuunnitelmat listana.
 */

import styles from './RecentSessions.module.css'

/** Laskee harjoitteiden kokonaiskeston minuuteissa */
function totalMin(drills = []) {
  return drills.reduce((s, d) => s + (d.duration || 0), 0)
}

/** Muotoilee ISO-aikaleiman suomalaiseksi päivämääräksi */
function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fi-FI', {
    day: 'numeric', month: 'numeric', year: 'numeric',
  })
}

function SkeletonRow() {
  return (
    <div className={styles.skeletonRow}>
      <div className={`${styles.skel} ${styles.skelTitle}`} />
      <div className={`${styles.skel} ${styles.skelMeta}`} />
    </div>
  )
}

export default function RecentSessions({ loading, sessions, onOpen, onNew }) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>Viimeisimmät harjoitukset</h2>
        <button className={styles.newBtn} onClick={onNew}>+ Uusi</button>
      </div>

      {loading ? (
        <div className={styles.list}>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : sessions.length === 0 ? (
        <p className={styles.empty}>Ei tallennettuja harjoituksia vielä.</p>
      ) : (
        <ul className={styles.list}>
          {sessions.map((s) => {
            const min = totalMin(s.drills)
            const count = s.drills?.length ?? 0
            return (
              <li key={s.id}>
                <button className={styles.sessionRow} onClick={() => onOpen(s.id)}>
                  <div className={styles.sessionInfo}>
                    <span className={styles.sessionName}>{s.name || 'Nimetön harjoitus'}</span>
                    <span className={styles.sessionMeta}>
                      {count} harjoitetta · {min} min
                    </span>
                  </div>
                  <div className={styles.sessionRight}>
                    <span className={styles.sessionDate}>{fmtDate(s.updated_at)}</span>
                    <span className={styles.sessionArrow}>→</span>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
