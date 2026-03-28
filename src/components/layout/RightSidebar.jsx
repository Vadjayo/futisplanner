/**
 * RightSidebar.jsx
 * Oikean reunan sivupalkki. Harjoitelista ja sessiotiedot.
 */

import { useState, useRef } from 'react'
import { totalDuration } from '../../utils/drillUtils'
import styles from './RightSidebar.module.css'

/**
 * @param {object}    props
 * @param {Array}     props.drills
 * @param {number}    props.activeDrillIndex
 * @param {function}  props.onDrillSelect
 * @param {function}  props.onReorderDrill
 * @param {function}  props.onAddDrill
 * @param {function}  props.onOpenLibrary
 * @param {object}    props.sessionMeta
 * @param {function}  props.onSessionMetaChange
 * @param {ReactNode} [props.aiPanel] - AI-paneeli (ei käytetä toistaiseksi)
 */
export default function RightSidebar({ drills, activeDrillIndex, onDrillSelect, onReorderDrill, onAddDrill, onOpenLibrary, sessionMeta, onSessionMetaChange }) {
  const totalMinutes = totalDuration(drills)
  const dragFromRef  = useRef(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  function handleDragStart(i) {
    dragFromRef.current = i
  }

  function handleDragOver(e, i) {
    e.preventDefault()
    setDragOverIndex(i)
  }

  function handleDrop(e, i) {
    e.preventDefault()
    if (dragFromRef.current !== null && dragFromRef.current !== i) {
      onReorderDrill(dragFromRef.current, i)
    }
    dragFromRef.current = null
    setDragOverIndex(null)
  }

  function handleDragEnd() {
    dragFromRef.current = null
    setDragOverIndex(null)
  }

  return (
    <aside className={styles.sidebar}>

      {/* ── HARJOITTEET ── */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Harjoitteet</h3>

        <ul className={styles.drillList}>
          {drills.map((drill, i) => (
            <li
              key={drill.id}
              className={`${styles.drillListItem} ${i === activeDrillIndex ? styles.drillListItemActive : ''} ${dragOverIndex === i ? styles.dragOver : ''}`}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={(e) => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
            >
              <span className={styles.dragHandle}>⠿</span>
              <button
                className={`${styles.drillItem} ${i === activeDrillIndex ? styles.active : ''}`}
                onClick={() => onDrillSelect(i)}
              >
                <span className={styles.drillNum}>{i + 1}</span>
                <div className={styles.drillInfo}>
                  <span className={styles.drillName}>
                    {drill.title || 'Nimetön harjoite'}
                  </span>
                  <span className={styles.drillDuration}>
                    {drill.duration ?? 10} min
                  </span>
                </div>
                <span className={styles.drillDots}>···</span>
              </button>
            </li>
          ))}
        </ul>

        <button className={styles.addBtn} onClick={onAddDrill}>
          + Lisää harjoite
        </button>

        <button className={styles.libraryBtn} onClick={onOpenLibrary}>
          📚 Kirjasto
        </button>
      </div>

      {/* ── YHTEENVETO ── */}
      <div className={styles.summarySection}>
        <h3 className={styles.sectionTitle}>Yhteenveto</h3>
        <div className={styles.summaryCard}>

          {/* Teema */}
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Teema</span>
            <input
              className={styles.summaryInput}
              type="text"
              value={sessionMeta?.theme ?? ''}
              onChange={(e) => onSessionMetaChange('theme', e.target.value)}
              placeholder="esim. Prässääminen"
              maxLength={80}
            />
          </div>

          {/* Kokonaiskesto + edistymispalkki */}
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Kesto</span>
            <span className={styles.summaryValue}>{totalMinutes} min</span>
          </div>
          {totalMinutes > 0 && (
            <div className={styles.sessionProgressWrap}>
              <div
                className={styles.sessionProgressBar}
                style={{ width: `${Math.min(100, Math.round((totalMinutes / 90) * 100))}%` }}
              />
              <span className={styles.sessionProgressLabel}>{totalMinutes}/90 min</span>
            </div>
          )}

          {/* Kuvaus */}
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Kuvaus</span>
            <textarea
              className={styles.summaryTextarea}
              value={sessionMeta?.description ?? ''}
              onChange={(e) => onSessionMetaChange('description', e.target.value)}
              placeholder="Harjoitteen kuvaus ja tavoitteet..."
              rows={4}
            />
          </div>

        </div>
      </div>

      {/* ── ALATUNNISTE ── */}
      <div className={styles.footer}>
        <span className={styles.totalLabel}>Kesto yhteensä</span>
        <span className={styles.totalValue}>
          {totalMinutes} min
        </span>
      </div>

    </aside>
  )
}
