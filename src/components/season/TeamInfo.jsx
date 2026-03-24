/**
 * TeamInfo.jsx
 * Joukkueen perustiedot -osio kausisuunnittelussa.
 */

import styles from './TeamInfo.module.css'

export default function TeamInfo({ team, onUpdate }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Perustiedot</h2>
      <div className={styles.grid}>

        <div className={styles.field}>
          <label className={styles.label}>Joukkueen nimi</label>
          <input
            className={styles.input}
            value={team.name ?? ''}
            onChange={(e) => onUpdate('name', e.target.value)}
            placeholder="esim. FC Esimerkki U15"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Ikäluokka</label>
          <input
            className={styles.input}
            value={team.age_group ?? ''}
            onChange={(e) => onUpdate('age_group', e.target.value)}
            placeholder="esim. U15, Juniori A"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Kausi</label>
          <input
            className={styles.input}
            value={team.season ?? ''}
            onChange={(e) => onUpdate('season', e.target.value)}
            placeholder="esim. 2026 kevät"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Taso</label>
          <div className={styles.levelToggle}>
            {['harraste', 'kilpa'].map((lvl) => (
              <button
                key={lvl}
                className={`${styles.levelBtn} ${(team.level ?? 'harraste') === lvl ? styles.levelActive : ''}`}
                onClick={() => onUpdate('level', lvl)}
              >
                {lvl === 'harraste' ? 'Harraste' : 'Kilpa'}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Valmentajat</label>
          <input
            className={styles.input}
            value={team.coaches ?? ''}
            onChange={(e) => onUpdate('coaches', e.target.value)}
            placeholder="esim. Matti Meikäläinen, Pekka Pekkanen"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Pelaajamäärä</label>
          <input
            className={styles.input}
            type="number"
            min={1}
            max={50}
            value={team.player_count ?? ''}
            onChange={(e) => onUpdate('player_count', parseInt(e.target.value) || 0)}
            placeholder="esim. 18"
          />
        </div>

      </div>
    </section>
  )
}
