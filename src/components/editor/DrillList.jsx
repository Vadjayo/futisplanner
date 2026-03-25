/**
 * DrillList.jsx
 * Harjoitteiden lista editorissa. Hallitsee aktiivisen harjoitteen valinnan.
 */

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
  onToolChange,
  onSaveToLibrary,
  onDuplicateDrill,
  getCardRef, // (index, el) => void — EditorApp kerää DrillCard-refit PDF-vientiä varten
}) {
  const { t } = useTranslation()

  // Näytä tyhjän tilan viesti jos yhtään harjoitetta ei ole
  if (drills.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>⚽</span>
        <p className={styles.emptyTitle}>Ei harjoitteita</p>
        <p className={styles.emptyText}>Aloita lisäämällä ensimmäinen harjoite</p>
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
          ref={getCardRef ? (el) => getCardRef(i, el) : null}
          drill={drill}
          index={i}
          activeTool={activeTool}
          toolOptions={toolOptions}
          isActive={i === activeDrillIndex}
          onSelect={() => onDrillSelect(i)}
          // Muunna id-pohjainen päivitys indeksipohjaiseksi
          onUpdate={(updates) => onDrillUpdate(drill.id, updates)}
          onDelete={() => onDrillDelete(drill.id)}
          onToolChange={onToolChange}
          onSaveToLibrary={onSaveToLibrary}
          onDuplicate={() => onDuplicateDrill(drill.id)}
        />
      ))}

      <button className={styles.addBtn} onClick={onAddDrill}>
        + Lisää harjoite
      </button>
    </div>
  )
}
