/**
 * MatchHeader.jsx
 * Ottelun perustiedot: joukkueet, päivämäärä, kellonaika, paikka.
 * Kaikki kentät muokattavissa inline.
 */

import styles from './MatchDay.module.css'

/**
 * @param {object}   plan          - Pelipäiväsuunnitelman tiedot
 * @param {string}   homeTeamName  - Oman joukkueen nimi (esitäytetty)
 * @param {function} onChange      - (field, value) => void
 */
export default function MatchHeader({ plan, homeTeamName, onChange }) {
  return (
    <div className={styles.matchHeader}>
      {/* Joukkuenimet */}
      <div className={styles.teamsRow}>
        <span className={styles.homeTeam}>{homeTeamName || 'Oma joukkue'}</span>
        <span className={styles.vsLabel}>vs</span>
        <input
          className={styles.opponentInput}
          type="text"
          value={plan.opponent}
          onChange={(e) => onChange('opponent', e.target.value)}
          placeholder="Vastustaja"
          maxLength={60}
        />
      </div>

      {/* Meta: päivä, kellonaika, paikka */}
      <div className={styles.matchMeta}>
        <input
          className={styles.metaInput}
          type="date"
          value={plan.matchDate}
          onChange={(e) => onChange('matchDate', e.target.value)}
        />
        <input
          className={styles.metaInput}
          type="time"
          value={plan.matchTime}
          onChange={(e) => onChange('matchTime', e.target.value)}
          placeholder="Kellonaika"
        />
        <input
          className={styles.metaInput}
          type="text"
          value={plan.location}
          onChange={(e) => onChange('location', e.target.value)}
          placeholder="Paikka / kenttä"
          maxLength={80}
        />
      </div>
    </div>
  )
}
