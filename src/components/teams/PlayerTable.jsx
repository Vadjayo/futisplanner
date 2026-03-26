/**
 * PlayerTable.jsx
 * Pelaajataulukko suodattimineen ja toimintopainikkeineen. Puhdas UI-komponentti.
 *
 * @param {Array}    players        - Näytettävät pelaajat (jo suodatettu)
 * @param {boolean}  loading        - Lataustila — näyttää skeleton-rivit
 * @param {string}   positionFilter - 'all' | 'MV' | 'PO' | 'KP' | 'KK' | 'HY'
 * @param {Function} onFilterChange - (pos: string) => void
 * @param {Function} onNew          - () => void
 * @param {Function} onCsvImport    - () => void
 * @param {Function} onEdit         - (player) => void
 * @param {Function} onDelete       - (player) => void
 */

import { useCallback } from 'react'
import { COLORS } from '../../constants/colors'
import Button from '../ui/Button'
import styles from './PlayerTable.module.css'

// Pelipaikan värit
const POSITION_COLORS = {
  MV: COLORS.status.warning,
  PO: COLORS.event.game,
  KP: COLORS.brand.primary,
  KK: COLORS.event.tournament,
  HY: COLORS.status.danger,
}

const POSITIONS = ['MV', 'PO', 'KP', 'KK', 'HY']

/** Pelipaikkamerkki väreillä */
function PositionBadge({ position }) {
  if (!position) return <span style={{ color: COLORS.text.secondary }}>—</span>
  const color = POSITION_COLORS[position] ?? COLORS.text.secondary
  return (
    <span
      style={{
        display: 'inline-block',
        background: `${color}22`,
        color,
        border: `1px solid ${color}55`,
        borderRadius: 4,
        padding: '1px 6px',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.04em',
      }}
    >
      {position}
    </span>
  )
}

/** Skeleton-rivi latauksen aikana */
function SkeletonRow() {
  return (
    <tr className={styles.skeletonRow}>
      {[48, 160, 80, 80, 56, 64].map((w, i) => (
        <td key={i} className={styles.td}>
          <div className={styles.skeletonCell} style={{ width: w }} />
        </td>
      ))}
    </tr>
  )
}

export default function PlayerTable({
  players,
  loading,
  positionFilter,
  onFilterChange,
  onNew,
  onCsvImport,
  onEdit,
  onDelete,
}) {
  const handleFilterChange = useCallback((pos) => {
    onFilterChange(pos)
  }, [onFilterChange])

  const handleEdit = useCallback((player) => {
    onEdit(player)
  }, [onEdit])

  const handleDelete = useCallback((player) => {
    onDelete(player)
  }, [onDelete])

  return (
    <div className={styles.wrapper}>
      {/* Otsikkorivi */}
      <div className={styles.headerRow}>
        <h2 className={styles.title} style={{ color: COLORS.text.primary }}>
          Pelaajat
          <span className={styles.count} style={{ color: COLORS.text.secondary }}>
            {loading ? '…' : players.length}
          </span>
        </h2>
        <div className={styles.headerActions}>
          <Button variant="ghost" size="sm" onClick={onCsvImport}>
            Tuo CSV
          </Button>
          <Button variant="primary" size="sm" onClick={onNew}>
            + Lisää pelaaja
          </Button>
        </div>
      </div>

      {/* Pelipaikkafiltterit */}
      <div className={styles.filters}>
        <button
          className={[styles.filterBtn, positionFilter === 'all' ? styles.filterActive : ''].join(' ')}
          style={positionFilter === 'all' ? { color: COLORS.brand.primary, borderColor: COLORS.brand.primary } : {}}
          onClick={() => handleFilterChange('all')}
        >
          Kaikki
        </button>
        {POSITIONS.map((pos) => {
          const isActive = positionFilter === pos
          const color = POSITION_COLORS[pos]
          return (
            <button
              key={pos}
              className={[styles.filterBtn, isActive ? styles.filterActive : ''].join(' ')}
              style={isActive ? { color, borderColor: color } : {}}
              onClick={() => handleFilterChange(pos)}
            >
              {pos}
            </button>
          )
        })}
      </div>

      {/* Taulukko */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th} style={{ color: COLORS.text.secondary, width: 40 }}>#</th>
              <th className={styles.th} style={{ color: COLORS.text.secondary }}>Nimi</th>
              <th className={styles.th} style={{ color: COLORS.text.secondary }}>Paikka</th>
              <th className={styles.th} style={{ color: COLORS.text.secondary }}>Varapaikka</th>
              <th className={styles.th} style={{ color: COLORS.text.secondary }}>Synt.</th>
              <th className={styles.th} style={{ color: COLORS.text.secondary, width: 80 }} />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : players.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyCell}>
                  <div className={styles.empty}>
                    <span className={styles.emptyIcon}>👥</span>
                    <p style={{ color: COLORS.text.secondary, margin: '4px 0 0' }}>
                      {positionFilter === 'all'
                        ? 'Ei pelaajia. Lisää ensimmäinen pelaaja.'
                        : `Ei ${positionFilter}-pelaajia.`}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              players.map((player) => (
                <tr key={player.id} className={styles.row}>
                  <td className={styles.td} style={{ color: COLORS.text.secondary, fontVariantNumeric: 'tabular-nums' }}>
                    {player.number ?? '—'}
                  </td>
                  <td className={styles.td} style={{ color: COLORS.text.light, fontWeight: 500 }}>
                    {player.name}
                  </td>
                  <td className={styles.td}>
                    <PositionBadge position={player.position} />
                  </td>
                  <td className={styles.td}>
                    <PositionBadge position={player.position_secondary} />
                  </td>
                  <td className={styles.td} style={{ color: COLORS.text.secondary }}>
                    {player.birth_year ?? '—'}
                  </td>
                  <td className={styles.td}>
                    <div className={styles.rowActions}>
                      <button
                        className={styles.iconBtn}
                        style={{ color: COLORS.text.secondary }}
                        onClick={() => handleEdit(player)}
                        title="Muokkaa"
                        aria-label={`Muokkaa pelaajaa ${player.name}`}
                      >
                        ✏️
                      </button>
                      <button
                        className={styles.iconBtn}
                        style={{ color: COLORS.status.danger }}
                        onClick={() => handleDelete(player)}
                        title="Poista"
                        aria-label={`Poista pelaaja ${player.name}`}
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
