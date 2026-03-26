/**
 * TopBar.jsx
 * Editorin yläpalkki. Session nimi, auto-tallennus-indikaattori ja toimintopainikkeet.
 */

import { useNavigate } from 'react-router-dom'
import { useInlineEdit } from '../../hooks/useInlineEdit'
import { ROUTES } from '../../constants/routes'
import styles from './TopBar.module.css'

const PLACEHOLDER = 'Nimetön harjoitus'

export default function TopBar({ sessionName, onSessionNameChange, onSignOut, saveStatus = 'idle', onSave, onExportPdf }) {
  const navigate = useNavigate()

  const { editing, draft, setDraft, startEdit, commit, handleKeyDown } = useInlineEdit(
    sessionName,
    (val) => onSessionNameChange(val || PLACEHOLDER)
  )

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button
          className={styles.btnBack}
          onClick={() => { onSave(); navigate(ROUTES.DASHBOARD) }}
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
            {sessionName || PLACEHOLDER}
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
        <button className={styles.btnSignOut} onClick={onSignOut} title="Kirjaudu ulos">
          ⎋
        </button>
      </div>
    </header>
  )
}
