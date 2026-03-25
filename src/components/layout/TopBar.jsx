/**
 * TopBar.jsx
 * Editorin yläpalkki. Session nimi, auto-tallennus-indikaattori ja toimintopainikkeet.
 */

import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useInlineEdit } from '../../hooks/useInlineEdit'
import styles from './TopBar.module.css'

export default function TopBar({ sessionName, onSessionNameChange, onSignOut, saveStatus = 'idle', onSave, onExportPdf }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { editing, draft, setDraft, startEdit, commit, handleKeyDown } = useInlineEdit(
    sessionName,
    (val) => onSessionNameChange(val || t('topbar.placeholder'))
  )

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button
          className={styles.btnBack}
          onClick={() => { onSave(); navigate('/dashboard') }}
          title="Takaisin suunnitelmiin"
        >
          ← Suunnitelmat
        </button>
      </div>

      <div className={styles.center}>
        {editing ? (
          <input
            className={styles.nameInput}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        ) : (
          <button className={styles.namePlaceholder} onClick={startEdit}>
            {sessionName || t('topbar.placeholder')}
            <span className={styles.editHint}>✎</span>
          </button>
        )}

        {/* Auto-tallennus indikaattori nimen vieressä */}
        <span className={`${styles.saveIndicator} ${styles[`save_${saveStatus}`]}`}>
          {saveStatus === 'saving' && <span className={styles.saveDot} />}
          {saveStatus === 'saved'  && '✓'}
          {saveStatus === 'error'  && '⚠'}
        </span>
      </div>

      <div className={styles.right}>
        <button
          className={`${styles.btn} ${styles.btnGhost}`}
          onClick={onExportPdf}
          title="Vie PDF:ksi"
        >
          ↓ PDF
        </button>
        <button
          className={`${styles.btn} ${styles.btnPrimary} ${saveStatus === 'saved' ? styles.btnSaved : ''} ${saveStatus === 'error' ? styles.btnError : ''}`}
          onClick={onSave}
          disabled={saveStatus === 'saving'}
        >
          {saveStatus === 'saving' ? '…' : saveStatus === 'saved' ? '✓ Tallennettu' : 'Tallenna'}
        </button>
        <button className={styles.btnSignOut} onClick={onSignOut} title={t('topbar.signOut')}>
          ⎋
        </button>
      </div>
    </header>
  )
}
