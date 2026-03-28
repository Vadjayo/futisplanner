/**
 * TodayBanner.jsx
 * "Tänään"-banneri kausisuunnittelun yläosassa.
 * Näyttää seuraavan treenin, seuraavan ottelun ja kauden tilanteen.
 * Laskee tilastot jo ladatuista tapahtumista (ei ylimääräisiä DB-kyselyjä).
 */

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { COLORS } from '../../constants/colors'
import styles from './TodayBanner.module.css'

// Formatoi 'YYYY-MM-DD' suomeksi lyhyesti, esim. "ti 3.6."
function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso + 'T00:00:00').toLocaleDateString('fi-FI', {
    weekday: 'short', day: 'numeric', month: 'numeric',
  })
}

export default function TodayBanner({ team, events }) {
  const navigate = useNavigate()
  const today    = new Date().toLocaleDateString('sv-SE')

  // Hae seuraavat tapahtumat muistissa olevasta taulukosta (jo lajiteltu päivämäärän mukaan)
  const nextDrill = useMemo(
    () => events.find((e) => e.type === 'drill' && e.date >= today) ?? null,
    [events, today]
  )
  const nextGame = useMemo(
    () => events.find((e) => e.type === 'game'  && e.date >= today) ?? null,
    [events, today]
  )

  // Laske kauden tilastoarvot in-memory tapahtumista
  const stats = useMemo(() => {
    // Menneet tapahtumat (date < tänään)
    const past        = events.filter((e) => e.date < today)
    const drillsDone  = past.filter((e) => e.type === 'drill').length
    const gamesDone   = past.filter((e) => e.type === 'game').length

    // Kauden pituus faasiaikajanasta
    const phases = team?.phases ?? []
    const valid  = phases.filter((p) => p.start && p.end)

    let seasonPct    = 0
    let drillsPerWeek = '–'

    if (valid.length > 0) {
      const startMs   = Math.min(...valid.map((p) => new Date(p.start).getTime()))
      const endMs     = Math.max(...valid.map((p) => new Date(p.end).getTime()))
      const seasonDays = Math.max(1, Math.ceil((endMs - startMs) / 86400000))

      // % = uniikit tapahtumapaivat / kauden pituus
      const eventDays = new Set(events.map((e) => e.date)).size
      seasonPct = Math.min(100, Math.round((eventDays / seasonDays) * 100))

      // Treeniä/vk — lasketaan kauden alusta tähän päivään
      const weeksSinceStart = Math.max(1, Math.floor((Date.now() - startMs) / (7 * 86400000)))
      const dpw = drillsDone / weeksSinceStart
      drillsPerWeek = dpw >= 1 ? `${Math.round(dpw)}×` : `${dpw.toFixed(1)}×`
    }

    // Kauden % väri
    const pctColor = seasonPct < 25 ? COLORS.status.warning : seasonPct >= 75 ? COLORS.brand.primary : COLORS.text.light

    return { drillsDone, gamesDone, seasonPct, drillsPerWeek, pctColor }
  }, [events, team, today])

  return (
    <div className={styles.banner}>

      {/* ── SEURAAVA TREENI ── */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span className={styles.panelIcon}>🏃</span>
          <span className={styles.panelTitle}>Seuraava treeni</span>
        </div>
        {nextDrill ? (
          <>
            <div className={styles.eventDate}>
              {fmtDate(nextDrill.date)}
              {nextDrill.time && <span className={styles.eventTime}> klo {nextDrill.time.slice(0, 5)}</span>}
            </div>
            {nextDrill.theme && (
              <div className={styles.eventTheme}>{nextDrill.theme}</div>
            )}
            <button className={styles.panelBtn} onClick={() => navigate(ROUTES.EDITOR)}>
              Suunnittele treeni →
            </button>
          </>
        ) : (
          <>
            <div className={styles.emptyText}>Ei suunniteltuja treenejä</div>
          </>
        )}
      </div>

      {/* ── SEURAAVA OTTELU ── */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span className={styles.panelIcon}>⚽</span>
          <span className={styles.panelTitle}>Seuraava ottelu</span>
        </div>
        {nextGame ? (
          <>
            <div className={styles.eventDate}>
              {fmtDate(nextGame.date)}
              {nextGame.time && <span className={styles.eventTime}> klo {nextGame.time.slice(0, 5)}</span>}
            </div>
            {nextGame.title && (
              <div className={styles.eventTheme}>{nextGame.title}</div>
            )}
            <button className={styles.panelBtn} onClick={() => navigate(ROUTES.MATCH_DAY + '?event=' + nextGame.id)}>
              Pelipäiväsuunnitelma →
            </button>
          </>
        ) : (
          <>
            <div className={styles.emptyText}>Ei suunniteltuja otteluita</div>
          </>
        )}
      </div>

      {/* ── KAUDEN TILANNE ── */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span className={styles.panelIcon}>📊</span>
          <span className={styles.panelTitle}>Kauden tilanne</span>
        </div>
        <div className={styles.statsGrid}>
          <div className={styles.statBox}>
            <span className={styles.statVal} style={{ color: COLORS.event.drill }}>{stats.drillsDone}</span>
            <span className={styles.statLbl}>Treeniä tehty</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statVal} style={{ color: COLORS.event.game }}>{stats.gamesDone}</span>
            <span className={styles.statLbl}>Ottelua pelattu</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statVal} style={{ color: stats.pctColor }}>{stats.seasonPct}%</span>
            <span className={styles.statLbl}>Kausi suunniteltu</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statVal} style={{ color: COLORS.event.drill }}>{stats.drillsPerWeek}</span>
            <span className={styles.statLbl}>Treeniä / vk</span>
          </div>
        </div>
      </div>

    </div>
  )
}
