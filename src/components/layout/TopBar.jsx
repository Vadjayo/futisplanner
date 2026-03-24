// Ylärivi — harjoituksen nimi, tallennustila ja toimintopainikkeet
// PDF ja Jaa ovat Pro-ominaisuuksia, tällä hetkellä poissa käytöstä

import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useInlineEdit } from '../../hooks/useInlineEdit'
import styles from './TopBar.module.css'

// Tallennuspainikkeen tekstit eri tiloissa
const SAVE_LABEL = {
  idle:   'Tallenna',
  saving: 'Tallennetaan...',
  saved:  '✓ Tallennettu',
  error:  '⚠ Virhe',
}

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
        {/* Takaisin dashboardille — tallentaa ensin */}
        <button
          className={styles.btnBack}
          onClick={() => { onSave(); navigate('/dashboard') }}
          title="Takaisin suunnitelmiin"
        >
          ← Suunnitelmat
        </button>
      </div>

      {/* Harjoituksen nimi — klikattava, muuttuu muokkauskentäksi */}
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
      </div>

      <div className={styles.right}>
        <button
          className={`${styles.btn} ${styles.btnSecondary}`}
          onClick={onExportPdf}
          title="Vie PDF:ksi"
        >
          {t('topbar.pdf')}
        </button>
        {/* TODO: Jakaminen Pro-ominaisuutena */}
        <button className={`${styles.btn} ${styles.btnSecondary}`} disabled title="Pro">
          {t('topbar.share')}
        </button>
        {/* Tallennuspainike — väri muuttuu tilan mukaan (saved=vihreä, error=punainen) */}
        <button
          className={`${styles.btn} ${styles.btnPrimary} ${saveStatus === 'saved' ? styles.btnSaved : ''} ${saveStatus === 'error' ? styles.btnError : ''}`}
          onClick={onSave}
          disabled={saveStatus === 'saving'}
        >
          {SAVE_LABEL[saveStatus]}
        </button>
        <button className={styles.btnSignOut} onClick={onSignOut}>
          {t('topbar.signOut')}
        </button>
      </div>
    </header>
  )
}
