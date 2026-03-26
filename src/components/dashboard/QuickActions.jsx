/**
 * QuickActions.jsx
 * Neljä pikaoikaisunappulaa oikeaan sivupalkkiin.
 */

import { COLORS } from '../../constants/colors'
import styles     from './QuickActions.module.css'

const ACTIONS = [
  { label: '+ Uusi harjoitus', key: 'session',  color: COLORS.event.drill },
  { label: '📅 Kausikalenteri', key: 'season',  color: COLORS.event.game },
  { label: '⚽ Pelipäivä',     key: 'matchDay', color: COLORS.status.warning },
  { label: '👥 Joukkueet',     key: 'teams',    color: COLORS.text.secondary },
]

/**
 * @param {function} onNewSession
 * @param {function} onSeason
 * @param {function} onMatchDay
 * @param {function} onTeams
 */
export default function QuickActions({ onNewSession, onSeason, onMatchDay, onTeams }) {
  const handlers = { session: onNewSession, season: onSeason, matchDay: onMatchDay, teams: onTeams }

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Pikaoikaisut</h2>
      <div className={styles.grid}>
        {ACTIONS.map(({ label, key, color }) => (
          <button
            key={key}
            className={styles.actionBtn}
            style={{ borderColor: color + '33', color }}
            onClick={handlers[key]}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
