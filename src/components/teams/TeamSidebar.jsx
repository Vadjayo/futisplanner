/**
 * TeamSidebar.jsx
 * Joukkuelista sivupalkissa. Puhdas UI-komponentti.
 *
 * @param {Array}          teams        - Joukkueiden lista
 * @param {string|null}    selectedId   - Valitun joukkueen ID
 * @param {number}         playerCount  - Valitun joukkueen pelaajamäärä (tuore tieto)
 * @param {Function}       onSelect     - (teamId) => void
 * @param {Function}       onCreate     - () => void
 */

import { useCallback } from 'react'
import { COLORS } from '../../constants/colors'
import styles from './TeamSidebar.module.css'

export default function TeamSidebar({ teams, selectedId, playerCount, onSelect, onCreate }) {
  /**
   * Käsittelee joukkueen valinnan.
   * @param {string} teamId
   */
  const handleSelect = useCallback((teamId) => {
    onSelect(teamId)
  }, [onSelect])

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>JOUKKUEET</span>
        <span className={styles.count}>{teams.length}</span>
      </div>

      <div className={styles.list}>
        {teams.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>Ei joukkueita vielä.</p>
            <p className={styles.emptyHint}>Luo ensimmäinen joukkue alta.</p>
          </div>
        ) : (
          teams.map((team) => {
            const isActive = team.id === selectedId
            return (
              <button
                key={team.id}
                className={[styles.item, isActive ? styles.itemActive : ''].join(' ')}
                onClick={() => handleSelect(team.id)}
                style={isActive ? { borderLeft: `3px solid ${COLORS.brand.primary}` } : {}}
              >
                <div className={styles.itemContent}>
                  <div className={styles.itemTop}>
                    {isActive && (
                      <span
                        className={styles.activeDot}
                        style={{ background: COLORS.brand.primary }}
                      />
                    )}
                    <span
                      className={styles.teamName}
                      style={{ color: isActive ? COLORS.text.primary : COLORS.text.light }}
                    >
                      {team.name}
                    </span>
                  </div>
                  <div className={styles.itemMeta}>
                    {team.season && (
                      <span className={styles.metaTag}>{team.season}</span>
                    )}
                    {/* Valitun joukkueen osalta käytetään tuoretta pelaajamäärää */}
                    {team.id === selectedId ? (
                      <span className={styles.metaTag}>{playerCount} pelaajaa</span>
                    ) : (
                      team.player_count != null && team.player_count > 0 && (
                        <span className={styles.metaTag}>{team.player_count} pelaajaa</span>
                      )
                    )}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>

      <div className={styles.footer}>
        <button className={styles.createBtn} onClick={onCreate}>
          <span style={{ color: COLORS.brand.primary, fontWeight: 700, marginRight: 4 }}>+</span>
          Lisää joukkue
        </button>
      </div>
    </aside>
  )
}
