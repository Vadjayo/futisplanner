// Oikea sivupalkki — harjoiteluettelo ja harjoituksen yhteenveto

import { useTranslation } from 'react-i18next'
import { totalDuration } from '../../utils/drillUtils'
import styles from './RightSidebar.module.css'

const FOCUS_FIELDS = [
  { key: 'focusTechnical', label: 'Tekninen' },
  { key: 'focusTactical',  label: 'Taktinen' },
  { key: 'focusPhysical',  label: 'Fyysinen' },
  { key: 'focusMental',    label: 'Henkinen' },
]

export default function RightSidebar({ drills, activeDrillIndex, onDrillSelect, onAddDrill, onOpenLibrary, sessionMeta, onSessionMetaChange }) {
  const { t } = useTranslation()
  const totalMinutes = totalDuration(drills)

  return (
    <aside className={styles.sidebar}>

      {/* ── HARJOITTEET ── */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('sidebar.drills')}</h3>

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

        <button className={styles.libraryBtn} onClick={onOpenLibrary}>
          📚 Kirjasto
        </button>
      </div>

      {/* ── YHTEENVETO ── */}
      <div className={styles.summarySection}>
        <h3 className={styles.sectionTitle}>Yhteenveto</h3>

        <div className={styles.summaryFields}>
          <label className={styles.fieldLabel}>
            Teema
            <input
              className={styles.fieldInput}
              type="text"
              value={sessionMeta?.theme ?? ''}
              onChange={(e) => onSessionMetaChange('theme', e.target.value)}
              placeholder="esim. Prässääminen"
              maxLength={80}
            />
          </label>

          <label className={styles.fieldLabel}>
            Kuvaus
            <textarea
              className={styles.fieldTextarea}
              value={sessionMeta?.description ?? ''}
              onChange={(e) => onSessionMetaChange('description', e.target.value)}
              placeholder="Lyhyt kuvaus harjoituksesta..."
              rows={3}
            />
          </label>

          <div className={styles.durationRow}>
            <span className={styles.durationLabel}>Kesto</span>
            <span className={styles.durationValue}>{totalMinutes} min</span>
          </div>

          <div className={styles.focusFields}>
            {FOCUS_FIELDS.map(({ key, label }) => (
              <label key={key} className={styles.fieldLabel}>
                {label}
                <textarea
                  className={styles.fieldTextarea}
                  value={sessionMeta?.[key] ?? ''}
                  onChange={(e) => onSessionMetaChange(key, e.target.value)}
                  placeholder={`${label} tavoitteet...`}
                  rows={2}
                />
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ── ALATUNNISTE ── */}
      <div className={styles.footer}>
        <span className={styles.totalLabel}>{t('sidebar.totalDuration')}</span>
        <span className={styles.totalValue}>
          {totalMinutes} {t('sidebar.minutes')}
        </span>
      </div>
    </aside>
  )
}
