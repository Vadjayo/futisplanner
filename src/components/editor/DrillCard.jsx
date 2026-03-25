/**
 * DrillCard.jsx
 * Yksittäisen harjoitteen kortti editorissa. Otsikko, kesto, kentän tyyppi ja kanvas.
 */

import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useTranslation } from 'react-i18next'
import { useInlineEdit } from '../../hooks/useInlineEdit'
import DrillCanvas from './DrillCanvas'
import styles from './DrillCard.module.css'

const FIELD_TYPES = ['11v11', '7v7', '5v5', '3v3', 'blank', 'split']

const CATEGORIES = [
  { id: 'lammittely', label: 'Lämmittely' },
  { id: 'tekniikka',  label: 'Tekniikka' },
  { id: 'taktiikka',  label: 'Taktiikka' },
  { id: 'fysiikka',   label: 'Fysiikka' },
  { id: 'maalivahti', label: 'Maalivahti' },
]
const AGE_GROUPS = ['U6-U8', 'U9-U11', 'U12-U14', 'U15-U18']

const DrillCard = forwardRef(function DrillCard(
  { drill, index, activeTool, toolOptions, isActive, onSelect, onUpdate, onDelete, onToolChange, onSaveToLibrary, onDuplicate },
  ref
) {
  const { t } = useTranslation()
  const canvasRef = useRef(null)
  const menuBtnRef = useRef(null)

  // ⋯-valikko
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState(null)

  // Tallenna kirjastoon -dialogi
  const [saveOpen, setSaveOpen] = useState(false)
  const [saveCategory, setSaveCategory] = useState('tekniikka')
  const [saveAgeGroup, setSaveAgeGroup] = useState('U9-U11')
  const [saveDesc, setSaveDesc] = useState('')
  const [saving, setSaving] = useState(false)

  // Suljetaan menu klikkaamalla muualle
  useEffect(() => {
    if (!menuOpen) return
    function close() { setMenuOpen(false) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [menuOpen])

  function toggleMenu(e) {
    e.stopPropagation()
    if (menuOpen) { setMenuOpen(false); return }
    const rect = menuBtnRef.current.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    setMenuOpen(true)
  }

  async function handleSaveConfirm(e) {
    e.stopPropagation()
    setSaving(true)
    try {
      await onSaveToLibrary(drill, { category: saveCategory, ageGroup: saveAgeGroup, description: saveDesc })
      setSaveOpen(false)
      setSaveDesc('')
    } catch (err) {
      alert(`Tallennus epäonnistui: ${err?.message ?? err}`)
    } finally {
      setSaving(false)
    }
  }

  useImperativeHandle(ref, () => ({
    getImageDataUrl: () => canvasRef.current?.getImageDataUrl(),
  }))

  function handleDrop(e) {
    e.preventDefault()
    const tool = e.dataTransfer.getData('futisplanner/tool')
    if (!tool) return
    const optionsStr = e.dataTransfer.getData('futisplanner/options')
    const options = optionsStr ? JSON.parse(optionsStr) : {}
    canvasRef.current?.dropElement(tool, options, e.clientX, e.clientY)
    onToolChange?.(tool)
  }

  const { editing, draft, setDraft, startEdit, commit, handleKeyDown } = useInlineEdit(
    drill.title,
    (val) => onUpdate({ title: val })
  )

  function handleDurationChange(e) {
    const val = Math.max(1, Math.min(120, parseInt(e.target.value) || 1))
    onUpdate({ duration: val })
  }

  return (
    <div
      id={`drill-${drill.id}`}
      className={`${styles.card} ${isActive ? styles.active : ''}`}
      onClick={onSelect}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className={styles.header}>
        <span className={styles.index}>{index + 1}</span>

        {/* Otsikko */}
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

        {/* Kenttätyyppi — dropdown säästää tilaa */}
        <select
          className={styles.ftSelect}
          value={drill.fieldType}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onUpdate({ fieldType: e.target.value })}
        >
          {FIELD_TYPES.map((ft) => (
            <option key={ft} value={ft}>{ft}</option>
          ))}
        </select>

        {/* Kesto */}
        <div className={styles.durationWrapper}>
          <input
            className={styles.durationInput}
            type="number"
            value={drill.duration}
            min={1} max={120}
            onClick={(e) => e.stopPropagation()}
            onChange={handleDurationChange}
          />
          <span className={styles.durationUnit}>{t('drill.minutes')}</span>
        </div>

        {/* ⋯ toimintovalikko */}
        <button
          ref={menuBtnRef}
          className={styles.menuBtn}
          title="Toiminnot"
          onClick={toggleMenu}
        >
          ⋯
        </button>
      </div>

      {/* Tallenna kirjastoon -dialogi */}
      {saveOpen && (
        <div className={styles.saveDialog} onClick={(e) => e.stopPropagation()}>
          <div className={styles.saveRow}>
            <label className={styles.saveLabel}>Kategoria</label>
            <select className={styles.saveSelect} value={saveCategory} onChange={(e) => setSaveCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div className={styles.saveRow}>
            <label className={styles.saveLabel}>Ikäluokka</label>
            <select className={styles.saveSelect} value={saveAgeGroup} onChange={(e) => setSaveAgeGroup(e.target.value)}>
              {AGE_GROUPS.map((ag) => <option key={ag} value={ag}>{ag}</option>)}
            </select>
          </div>
          <div className={styles.saveRow}>
            <label className={styles.saveLabel}>Kuvaus</label>
            <textarea
              className={styles.saveTextarea}
              rows={2}
              placeholder="Lyhyt kuvaus (valinnainen)"
              value={saveDesc}
              onChange={(e) => setSaveDesc(e.target.value)}
            />
          </div>
          <div className={styles.saveActions}>
            <button className={styles.saveCancelBtn} onClick={(e) => { e.stopPropagation(); setSaveOpen(false) }}>
              Peruuta
            </button>
            <button className={styles.saveConfirmBtn} disabled={saving} onClick={handleSaveConfirm}>
              {saving ? 'Tallennetaan…' : 'Tallenna kirjastoon'}
            </button>
          </div>
        </div>
      )}

      <DrillCanvas
        ref={canvasRef}
        elements={drill.elements}
        fieldType={drill.fieldType}
        activeTool={activeTool}
        toolOptions={toolOptions}
        onChange={(newElements) => onUpdate({ elements: newElements })}
      />

      {/* ⋯-valikko — fixed position jotta ei leikkaudu kortin overflow:hidden alle */}
      {menuOpen && menuPos && (
        <div
          className={styles.menu}
          style={{ top: menuPos.top, right: menuPos.right }}
          onClick={(e) => e.stopPropagation()}
        >
          {onDuplicate && (
            <button className={styles.menuItem} onClick={() => { onDuplicate(); setMenuOpen(false) }}>
              <span className={styles.menuIcon}>⧉</span> Kopioi harjoite
            </button>
          )}
          {onSaveToLibrary && (
            <button className={styles.menuItem} onClick={() => { setMenuOpen(false); setSaveOpen((v) => !v) }}>
              <span className={styles.menuIcon}>📚</span> Tallenna kirjastoon
            </button>
          )}
          <div className={styles.menuDivider} />
          <button className={`${styles.menuItem} ${styles.menuItemDanger}`} onClick={() => { onDelete(); setMenuOpen(false) }}>
            <span className={styles.menuIcon}>✕</span> Poista harjoite
          </button>
        </div>
      )}
    </div>
  )
})

export default DrillCard
