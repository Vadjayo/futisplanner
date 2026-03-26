/**
 * PlayerLists.jsx
 * Oikean sivupalkin pelaajalistat: aloittajat, vaihtomiehet, poissaolijat.
 * Vaihtopelaajanvalitsin avautuu joukkueen pelaajista jotka eivät ole listoilla.
 */

import { useState, useMemo } from 'react'
import styles from './PlayerLists.module.css'

/**
 * Yksittäinen pelaajariivi toimintovalikolla.
 * @param {object}   player
 * @param {string}   listType  - 'lineup' | 'substitute' | 'absent'
 * @param {function} onMove    - (player, targetList) => void
 */
function PlayerRow({ player, listType, onMove }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className={styles.playerRow}>
      <div className={styles.playerInfo}>
        <span className={`${styles.badge} ${styles['badge_' + listType]}`} />
        <span className={styles.playerNumber}>{player.number || '–'}</span>
        <span className={styles.playerName}>{player.name || 'Nimetön'}</span>
        <span className={styles.playerPos}>{player.position}</span>
      </div>

      <div className={styles.menuWrap}>
        <button
          className={styles.menuBtn}
          onClick={() => setMenuOpen((v) => !v)}
          title="Toiminnot"
        >
          ⋯
        </button>
        {menuOpen && (
          <div className={styles.dropdown}>
            {listType !== 'lineup' && (
              <button className={styles.dropItem} onClick={() => { onMove(player, 'lineup'); setMenuOpen(false) }}>
                Siirrä aloittajiin
              </button>
            )}
            {listType !== 'substitute' && (
              <button className={styles.dropItem} onClick={() => { onMove(player, 'substitute'); setMenuOpen(false) }}>
                Siirrä vaihtoon
              </button>
            )}
            {listType !== 'absent' && (
              <button className={styles.dropItem} onClick={() => { onMove(player, 'absent'); setMenuOpen(false) }}>
                Merkitse poissa
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * @param {Array}    lineup       - Aloittava kokoonpano
 * @param {Array}    substitutes  - Vaihtomiehet
 * @param {Array}    absent       - Poissaolijat
 * @param {Array}    teamPlayers  - Kaikki joukkueen pelaajat (valintaa varten)
 * @param {function} onChange     - (field, value) => void
 */
export default function PlayerLists({ lineup, substitutes, absent, teamPlayers = [], onChange }) {
  const [subPickerOpen, setSubPickerOpen] = useState(false)

  /**
   * Siirtää pelaajan eri listalle.
   * @param {object} player
   * @param {'lineup'|'substitute'|'absent'} targetList
   */
  function handleMove(player, targetList) {
    const cleanLineup = lineup.filter((p) => p.id !== player.id)
    const cleanSubs   = substitutes.filter((p) => p.id !== player.id)
    const cleanAbsent = absent.filter((p) => p.id !== player.id)

    if (targetList === 'lineup')     onChange('lineup',      [...cleanLineup, player])
    if (targetList === 'substitute') onChange('substitutes', [...cleanSubs,   player])
    if (targetList === 'absent')     onChange('absent',      [...cleanAbsent, player])
  }

  /** PlayerId:t jotka ovat jo jollain listalla */
  const assignedIds = useMemo(() => {
    const ids = new Set()
    lineup.forEach((s) => s.playerId && ids.add(s.playerId))
    substitutes.forEach((s) => s.playerId && ids.add(s.playerId))
    absent.forEach((s) => s.playerId && ids.add(s.playerId))
    return ids
  }, [lineup, substitutes, absent])

  /** Pelaajat jotka eivät ole millään listalla */
  const availablePlayers = useMemo(
    () => teamPlayers.filter((p) => !assignedIds.has(p.id)),
    [teamPlayers, assignedIds]
  )

  /**
   * Lisää joukkuepelaajan vaihtomieslistalle.
   * @param {object} player - Joukkueen pelaaja
   */
  function addSubFromTeam(player) {
    onChange('substitutes', [
      ...substitutes,
      {
        id:       crypto.randomUUID(),
        playerId: player.id,
        name:     player.name,
        number:   String(player.number ?? ''),
        position: player.position ?? '',
      },
    ])
    setSubPickerOpen(false)
  }

  /** Lisää tyhjä rivi jos joukkuetta ei ole käytössä */
  function addEmptySub() {
    onChange('substitutes', [
      ...substitutes,
      { id: crypto.randomUUID(), name: '', number: '', position: '' },
    ])
  }

  function handleAddSubClick() {
    if (teamPlayers.length > 0) {
      setSubPickerOpen((v) => !v)
    } else {
      addEmptySub()
    }
  }

  return (
    <div className={styles.lists}>
      {/* Tilastot ylhäällä */}
      <div className={styles.statsRow}>
        <span className={styles.statBadge}>
          <span className={`${styles.dot} ${styles.dotLineup}`} />
          {lineup.filter((p) => !!(p.name || p.number)).length} aloittajaa
        </span>
        <span className={styles.statBadge}>
          <span className={`${styles.dot} ${styles.dotSub}`} />
          {substitutes.length} vaihto
        </span>
        <span className={styles.statBadge}>
          <span className={`${styles.dot} ${styles.dotAbsent}`} />
          {absent.length} poissa
        </span>
      </div>

      {/* Aloittajat */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Aloittava kokoonpano</h4>
        {lineup.filter((p) => !!(p.name || p.number)).length === 0 ? (
          <p className={styles.empty}>Valitse muodostelma ja lisää pelaajat kentälle.</p>
        ) : (
          lineup
            .filter((p) => !!(p.name || p.number))
            .map((p) => (
              <PlayerRow key={p.id} player={p} listType="lineup" onMove={handleMove} />
            ))
        )}
      </div>

      {/* Vaihtomiehet */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Vaihtomiehet</h4>
        {substitutes.map((p) => (
          <PlayerRow key={p.id} player={p} listType="substitute" onMove={handleMove} />
        ))}

        {/* Lisää vaihtopelaaja */}
        <div className={styles.addSubWrap}>
          <button className={styles.addBtn} onClick={handleAddSubClick}>
            + Lisää vaihtopelaaja
          </button>
          {subPickerOpen && (
            <div className={styles.subPicker}>
              {availablePlayers.length === 0 ? (
                <div className={styles.subPickerEmpty}>Kaikki pelaajat jo lisätty</div>
              ) : (
                availablePlayers.map((p) => (
                  <button key={p.id} className={styles.subPickerItem} onClick={() => addSubFromTeam(p)}>
                    <span className={styles.subPickerNum}>{p.number ?? '–'}</span>
                    <span>{p.name}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Poissaolijat */}
      {absent.length > 0 && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Poissa</h4>
          {absent.map((p) => (
            <PlayerRow key={p.id} player={p} listType="absent" onMove={handleMove} />
          ))}
        </div>
      )}
    </div>
  )
}
