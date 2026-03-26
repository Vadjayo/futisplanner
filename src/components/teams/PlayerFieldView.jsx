/**
 * PlayerFieldView.jsx
 * Visuaalinen kenttänäkymä — pelaajat ryhmitelty pelipaikan mukaan sarakkeisiin.
 * Ei interaktiivinen, ei raahaamista.
 *
 * @param {Array} players - Aktiiviset pelaajat (suodatettu joukkueen mukaan)
 */

import { useMemo } from 'react'
import { COLORS } from '../../constants/colors'
import styles from './PlayerFieldView.module.css'

// Pelipaikan värit
const POSITION_COLORS = {
  MV: COLORS.status.warning,
  PO: COLORS.event.game,
  KP: COLORS.brand.primary,
  KK: COLORS.event.tournament,
  HY: COLORS.status.danger,
}

// Sarakkeiden järjestys kentällä
const COLUMNS = [
  { key: 'MV', label: 'MV' },
  { key: 'PO', label: 'PO' },
  { key: 'KP', label: 'KP' },
  { key: 'KK', label: 'KK' },
  { key: 'HY', label: 'HY' },
]

/** Yksittäinen pelaajapallo */
function PlayerDot({ player, color }) {
  // Näytetään viimeinen osa nimestä tai koko nimi jos lyhyt
  const parts = player.name.trim().split(' ')
  const displayName = parts.length > 1 ? parts[parts.length - 1] : parts[0]
  const short = displayName.length > 8 ? displayName.slice(0, 7) + '…' : displayName

  return (
    <div className={styles.playerDot} style={{ borderColor: color }}>
      {player.number != null && (
        <span className={styles.playerNumber} style={{ color }}>
          {player.number}
        </span>
      )}
      <span className={styles.playerName}>{short}</span>
    </div>
  )
}

export default function PlayerFieldView({ players }) {
  // Ryhmittele pelaajat pelipaikan mukaan
  const grouped = useMemo(() => {
    const map = { MV: [], PO: [], KP: [], KK: [], HY: [], other: [] }
    for (const p of players) {
      if (map[p.position]) {
        map[p.position].push(p)
      } else {
        map.other.push(p)
      }
    }
    return map
  }, [players])

  const totalPlayers = players.length

  return (
    <div className={styles.wrapper}>
      {/* Kenttä */}
      <div className={styles.field}>
        {/* Kentän viivat */}
        <div className={styles.fieldLines}>
          <div className={styles.centerCircle} />
          <div className={styles.centerLine} />
          <div className={styles.penaltyTop} />
          <div className={styles.penaltyBottom} />
          <div className={styles.goalTop} />
          <div className={styles.goalBottom} />
        </div>

        {/* Pelaajasarakkeet */}
        <div className={styles.columns}>
          {COLUMNS.map(({ key, label }) => {
            const colPlayers = grouped[key]
            const color = POSITION_COLORS[key]
            return (
              <div key={key} className={styles.column}>
                <span className={styles.columnLabel} style={{ color, borderColor: `${color}44` }}>
                  {label}
                </span>
                <div className={styles.columnPlayers}>
                  {colPlayers.length === 0 ? (
                    <div className={styles.emptyColumn}>
                      <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 11 }}>—</span>
                    </div>
                  ) : (
                    colPlayers.map((p) => (
                      <PlayerDot key={p.id} player={p} color={color} />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Yhteenveto */}
      <p className={styles.summary}>
        {totalPlayers === 0
          ? 'Ei pelaajia joukkueessa.'
          : `${totalPlayers} pelaajaa`}
      </p>
    </div>
  )
}
