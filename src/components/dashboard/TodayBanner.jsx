/**
 * TodayBanner.jsx
 * Kolme rinnakkaista korttia: seuraava treeni, seuraava ottelu, kauden tilastot.
 * Näyttää skeleton-latauksen datan saapumista odotellessa.
 */

import { useNavigate } from 'react-router-dom'
import { COLORS }      from '../../constants/colors'
import styles          from './TodayBanner.module.css'

/**
 * Muotoilee YYYY-MM-DD suomeksi lyhyesti, esim. "ti 3.6."
 * @param {string} iso
 * @returns {string}
 */
function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso + 'T00:00:00').toLocaleDateString('fi-FI', {
    weekday: 'short', day: 'numeric', month: 'numeric',
  })
}

/** Skeleton-kortti latauksen ajaksi */
function SkeletonCard() {
  return (
    <div className={styles.card}>
      <div className={`${styles.skel} ${styles.skelTitle}`} />
      <div className={`${styles.skel} ${styles.skelLine}`} />
      <div className={`${styles.skel} ${styles.skelLineShort}`} />
    </div>
  )
}

/**
 * @param {boolean}     loading
 * @param {object|null} nextDrill
 * @param {object|null} nextGame
 * @param {number}      drillCount
 * @param {number}      gameCount
 * @param {object|null} team
 * @param {function}    onOpenEditor
 * @param {function}    onNewDrill
 * @param {function}    onMatchDay
 */
export default function TodayBanner({
  loading,
  nextDrill,
  nextGame,
  drillCount,
  gameCount,
  team,
  onOpenEditor,
  onNewDrill,
  onMatchDay,
}) {
  if (loading) {
    return (
      <div className={styles.banner}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  // Laske treeniä/vk kauden alusta faasiaikajanasta
  let drillsPerWeek = '–'
  if (team?.phases) {
    const valid = (team.phases ?? []).filter((p) => p.start && p.end)
    if (valid.length > 0) {
      const startMs = Math.min(...valid.map((p) => new Date(p.start).getTime()))
      const weeks   = Math.max(1, Math.floor((Date.now() - startMs) / (7 * 86400000)))
      const dpw     = drillCount / weeks
      drillsPerWeek = dpw >= 1 ? `${Math.round(dpw)}×` : `${dpw.toFixed(1)}×`
    }
  }

  // Kausi % faasiaikajanasta
  let seasonPct = 0
  if (team?.phases) {
    const valid = (team.phases ?? []).filter((p) => p.start && p.end)
    if (valid.length > 0) {
      const startMs   = Math.min(...valid.map((p) => new Date(p.start).getTime()))
      const endMs     = Math.max(...valid.map((p) => new Date(p.end).getTime()))
      const totalDays = Math.max(1, Math.ceil((endMs - startMs) / 86400000))
      const pastDays  = Math.max(0, Math.ceil((Date.now() - startMs) / 86400000))
      seasonPct = Math.min(100, Math.round((pastDays / totalDays) * 100))
    }
  }

  const pctColor = seasonPct < 25
    ? COLORS.status.warning
    : seasonPct >= 75
      ? COLORS.event.drill
      : COLORS.text.light

  return (
    <div className={styles.banner}>

      {/* ── SEURAAVA TREENI ── */}
      <div className={`${styles.card} ${styles.cardDrill}`}>
        <div className={styles.cardHeader}>
          <span className={styles.cardIcon}>🏃</span>
          <span className={styles.cardTitle}>Seuraava treeni</span>
        </div>
        {nextDrill ? (
          <>
            <div className={styles.eventDate}>
              {fmtDate(nextDrill.date)}
              {nextDrill.time && (
                <span className={styles.eventTime}> klo {nextDrill.time.slice(0, 5)}</span>
              )}
            </div>
            {nextDrill.theme && (
              <div className={styles.eventTheme}>{nextDrill.theme}</div>
            )}
            <button className={styles.cardBtn} onClick={onOpenEditor}>
              Suunnittele →
            </button>
          </>
        ) : (
          <>
            <p className={styles.emptyText}>Ei suunniteltuja treenejä</p>
            <button className={styles.cardBtnOutline} onClick={onNewDrill}>
              + Lisää treeni
            </button>
          </>
        )}
      </div>

      {/* ── SEURAAVA OTTELU ── */}
      <div className={`${styles.card} ${styles.cardGame}`}>
        <div className={styles.cardHeader}>
          <span className={styles.cardIcon}>⚽</span>
          <span className={styles.cardTitle}>Seuraava ottelu</span>
        </div>
        {nextGame ? (
          <>
            <div className={styles.eventDate}>
              {fmtDate(nextGame.date)}
              {nextGame.time && (
                <span className={styles.eventTime}> klo {nextGame.time.slice(0, 5)}</span>
              )}
            </div>
            {nextGame.title && (
              <div className={styles.eventTheme}>{nextGame.title}</div>
            )}
            <button className={styles.cardBtnBlue} onClick={onMatchDay}>
              Pelipäivä →
            </button>
          </>
        ) : (
          <>
            <p className={styles.emptyText}>Ei suunniteltuja otteluita</p>
            <button className={styles.cardBtnOutline} onClick={onNewDrill}>
              + Lisää ottelu
            </button>
          </>
        )}
      </div>

      {/* ── KAUDEN TILANNE ── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardIcon}>📊</span>
          <span className={styles.cardTitle}>Kauden tilanne</span>
        </div>
        <div className={styles.statsGrid}>
          <div className={styles.statBox}>
            <span className={styles.statVal} style={{ color: COLORS.event.drill }}>{drillCount}</span>
            <span className={styles.statLbl}>Treeniä tehty</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statVal} style={{ color: COLORS.event.game }}>{gameCount}</span>
            <span className={styles.statLbl}>Ottelua pelattu</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statVal} style={{ color: pctColor }}>{seasonPct}%</span>
            <span className={styles.statLbl}>Kausi kulunut</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statVal} style={{ color: COLORS.event.drill }}>{drillsPerWeek}</span>
            <span className={styles.statLbl}>Treeniä / vk</span>
          </div>
        </div>
      </div>

    </div>
  )
}
