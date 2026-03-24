/**
 * DrillCard.jsx
 * Yksittäisen harjoitteen kortti editorissa. Otsikko, kesto, kentän tyyppi ja kanvas.
 */

import { useRef, forwardRef, useImperativeHandle } from 'react'
import { useTranslation } from 'react-i18next'
import { useInlineEdit } from '../../hooks/useInlineEdit'
import DrillCanvas from './DrillCanvas'
import styles from './DrillCard.module.css'

// Tuetut kenttätyypit — split = kenttä jaettuna kahteen puoliskoon (A+B)
const FIELD_TYPES = ['11v11', '7v7', '5v5', '3v3', 'blank', 'split']

const DrillCard = forwardRef(function DrillCard(
  { drill, index, activeTool, toolOptions, isActive, onSelect, onUpdate, onDelete },
  ref
) {
  const { t } = useTranslation()
  const canvasRef = useRef(null)

  // Exposoi getImageDataUrl() PDF-vientiä varten
  useImperativeHandle(ref, () => ({
    getImageDataUrl: () => canvasRef.current?.getImageDataUrl(),
  }))

  const { editing, draft, setDraft, startEdit, commit, handleKeyDown } = useInlineEdit(
    drill.title,
    (val) => onUpdate({ title: val })
  )

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
        {editing ? (
          <input
            className={styles.titleInput}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={handleKeyDown}
            autoFocus
            placeholder={t('drill.untitled')}
          />
        ) : (
          <button
            className={styles.titleBtn}
            onClick={(e) => { e.stopPropagation(); startEdit() }}
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
              onClick={(e) => { e.stopPropagation(); onUpdate({ fieldType: ft }) }}
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
          onClick={(e) => { e.stopPropagation(); onDelete() }}
        >
          ✕
        </button>
      </div>

      {/* Piirtoalue — välittää aktiiviisen työkalun ja vaihtoehdot alaspäin */}
      <DrillCanvas
        ref={canvasRef}
        elements={drill.elements}
        fieldType={drill.fieldType}
        activeTool={activeTool}
        toolOptions={toolOptions}
        onChange={(newElements) => onUpdate({ elements: newElements })}
      />
    </div>
  )
})

export default DrillCard
