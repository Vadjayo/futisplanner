/**
 * PlayerLists.jsx
 * Oikean sivupalkin pelaajalistat: aloittajat, vaihtomiehet, poissaolijat.
 * Pelaajia voi siirtää eri listojen välillä kontekstivalikon kautta.
 */

import { useState } from 'react'
import styles from './PlayerLists.module.css'

const ABSENCE_REASONS = [
  { value: 'injured',  label: 'Loukkaantunut 🤕' },
  { value: 'absent',   label: 'Poissa ⛔' },
  { value: 'rest',     label: 'Taukotila 💤' },
]

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
 * @param {function} onChange     - (field, value) => void — päivittää plan-kenttää
 */
export default function PlayerLists({ lineup, substitutes, absent, onChange }) {
  /**
   * Siirtää pelaajan eri listalle.
   * @param {object} player
   * @param {'lineup'|'substitute'|'absent'} targetList
   */
  function handleMove(player, targetList) {
    // Poista pelaaja kaikista listoista
    const cleanLineup = lineup.filter((p) => p.id !== player.id)
    const cleanSubs   = substitutes.filter((p) => p.id !== player.id)
    const cleanAbsent = absent.filter((p) => p.id !== player.id)

    if (targetList === 'lineup')     onChange('lineup',      [...cleanLineup, player])
    if (targetList === 'substitute') onChange('substitutes', [...cleanSubs,   player])
    if (targetList === 'absent')     onChange('absent',      [...cleanAbsent, player])
  }

  /** Lisää tyhjä uusi pelaaja vaihtomieslistalle */
  function addSubstitute() {
    onChange('substitutes', [
      ...substitutes,
      { id: crypto.randomUUID(), name: '', number: '', position: 'KK' },
    ])
  }

  return (
    <div className={styles.lists}>
      {/* Tilastot ylhäällä */}
      <div className={styles.statsRow}>
        <span className={styles.statBadge}>
          <span className={`${styles.dot} ${styles.dotLineup}`} />
          {lineup.length} aloittajaa
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
        {lineup.length === 0 ? (
          <p className={styles.empty}>Ei aloittajia. Vaihda muodostelma lisätäksesi pelaajat kentälle.</p>
        ) : (
          lineup.map((p) => (
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
        <button className={styles.addBtn} onClick={addSubstitute}>+ Lisää vaihtopelaaja</button>
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
