// Yksittäinen harjoitekortti — otsikko, kesto, kenttätyyppi ja piirtoalue
// Otsikko on klikkaamalla muokattava, kesto ja kenttätyyppi vaihdettavissa napista

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import DrillCanvas from './DrillCanvas'
import styles from './DrillCard.module.css'

// Tuetut kenttätyypit — blank = pelkkä vihreä kenttä ilman viivoja
const FIELD_TYPES = ['11v11', '7v7', '5v5', '3v3', 'blank']

export default function DrillCard({ drill, index, activeTool, toolOptions, isActive, onSelect, onUpdate, onDelete }) {
  const { t } = useTranslation()

  // editingTitle = true kun otsikkomuokkaus on auki
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(drill.title)

  // Vahvista otsikon muutos ja sulje muokkaus
  function commitTitle() {
    setEditingTitle(false)
    onUpdate({ title: titleDraft })
  }

  // Enter vahvistaa, Escape peruuttaa
  function handleTitleKey(e) {
    if (e.key === 'Enter') e.target.blur()
    if (e.key === 'Escape') {
      setTitleDraft(drill.title)
      setEditingTitle(false)
    }
  }

  // Rajoita kesto 1–120 minuuttiin
  function handleDurationChange(e) {
    const val = Math.max(1, Math.min(120, parseInt(e.target.value) || 1))
    onUpdate({ duration: val })
  }

  return (
    <div
      id={`drill-${drill.id}`}
      className={`${styles.card} ${isActive ? styles.active : ''}`}
      onClick={onSelect}
    >
      <div className={styles.header}>
        <span className={styles.index}>{index + 1}.</span>

        {/* Harjoitteen otsikko — klikattava muokkaustila */}
        {editingTitle ? (
          <input
            className={styles.titleInput}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={handleTitleKey}
            autoFocus
            placeholder={t('drill.untitled')}
          />
        ) : (
          <button
            className={styles.titleBtn}
            onClick={(e) => {
              e.stopPropagation()
              setTitleDraft(drill.title)
              setEditingTitle(true)
            }}
          >
            {drill.title || <span className={styles.placeholder}>{t('drill.untitled')}</span>}
            <span className={styles.editHint}>✎</span>
          </button>
        )}

        {/* Kenttätyypin valinta — napit 11v11 / 7v7 / 5v5 / 3v3 / blank */}
        <div className={styles.fieldTypes}>
          {FIELD_TYPES.map((ft) => (
            <button
              key={ft}
              className={`${styles.ftBtn} ${drill.fieldType === ft ? styles.ftActive : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                onUpdate({ fieldType: ft })
              }}
            >
              {ft}
            </button>
          ))}
        </div>

        {/* Keston syöttökenttä minuuteissa */}
        <div className={styles.durationWrapper}>
          <input
            className={styles.durationInput}
            type="number"
            value={drill.duration}
            min={1}
            max={120}
            onClick={(e) => e.stopPropagation()}
            onChange={handleDurationChange}
          />
          <span className={styles.durationUnit}>{t('drill.minutes')}</span>
        </div>

        {/* Poista harjoite -nappi */}
        <button
          className={styles.deleteBtn}
          title="Poista harjoite"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          ✕
        </button>
      </div>

      {/* Piirtoalue — välittää aktiiviisen työkalun ja vaihtoehdot alaspäin */}
      <DrillCanvas
        elements={drill.elements}
        fieldType={drill.fieldType}
        activeTool={activeTool}
        toolOptions={toolOptions}
        onChange={(newElements) => onUpdate({ elements: newElements })}
      />
    </div>
  )
}
