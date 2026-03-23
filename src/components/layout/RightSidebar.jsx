// Oikea sivupalkki — harjoiteluettelo, navigointi harjoitteiden välillä
// ja kirjastonappula. Näyttää myös harjoituksen kokonaiskeston.

import { useTranslation } from 'react-i18next'
import styles from './RightSidebar.module.css'

export default function RightSidebar({ drills, activeDrillIndex, onDrillSelect, onAddDrill, onOpenLibrary }) {
  const { t } = useTranslation()

  // Laske harjoitteiden yhteiskesto minuuteissa
  const totalMinutes = drills.reduce((sum, d) => sum + (d.duration || 0), 0)

  return (
    <aside className={styles.sidebar}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('sidebar.drills')}</h3>

        {/* Harjoiteluettelo — aktiivinen harjoite korostettu */}
        <ul className={styles.drillList}>
          {drills.map((drill, i) => (
            <li key={drill.id}>
              <button
                className={`${styles.drillItem} ${i === activeDrillIndex ? styles.active : ''}`}
                onClick={() => onDrillSelect(i)}
              >
                <span className={styles.drillNum}>{i + 1}</span>
                <span className={styles.drillName}>
                  {drill.title || t('drill.untitled')}
                </span>
                <span className={styles.drillDuration}>
                  {drill.duration || 0} {t('sidebar.minutes')}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <button className={styles.addBtn} onClick={onAddDrill}>
          {t('sidebar.addDrill')}
        </button>

        {/* Kirjasto — avaa valmiiden harjoitteiden paneelin */}
        <button className={styles.libraryBtn} onClick={onOpenLibrary}>
          📚 Kirjasto
        </button>
      </div>

      {/* Alatunniste — näyttää harjoituksen kokonaiskeston */}
      <div className={styles.footer}>
        <span className={styles.totalLabel}>{t('sidebar.totalDuration')}</span>
        <span className={styles.totalValue}>
          {totalMinutes} {t('sidebar.minutes')}
        </span>
      </div>
    </aside>
  )
}
