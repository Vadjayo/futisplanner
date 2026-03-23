// Harjoiteluettelo — renderöi kaikki harjoitteet peräkkäin ja
// näyttää tyhjän tilan jos harjoitteita ei ole vielä lisätty

import { useTranslation } from 'react-i18next'
import DrillCard from './DrillCard'
import styles from './DrillList.module.css'

export default function DrillList({
  drills,
  activeTool,
  toolOptions,
  activeDrillIndex,
  onDrillSelect,
  onDrillUpdate,
  onDrillDelete,
  onAddDrill,
}) {
  const { t } = useTranslation()

  // Näytä tyhjän tilan viesti jos yhtään harjoitetta ei ole
  if (drills.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>{t('drill.addFirst')}</p>
        <button className={styles.addFirstBtn} onClick={onAddDrill}>
          + Lisää harjoite
        </button>
      </div>
    )
  }

  return (
    <div className={styles.list}>
      {drills.map((drill, i) => (
        <DrillCard
          key={drill.id}
          drill={drill}
          index={i}
          activeTool={activeTool}
          toolOptions={toolOptions}
          isActive={i === activeDrillIndex}
          onSelect={() => onDrillSelect(i)}
          // Muunna id-pohjainen päivitys indeksipohjaiseksi
          onUpdate={(updates) => onDrillUpdate(drill.id, updates)}
          onDelete={() => onDrillDelete(drill.id)}
        />
      ))}

      <button className={styles.addBtn} onClick={onAddDrill}>
        + Lisää harjoite
      </button>
    </div>
  )
}
