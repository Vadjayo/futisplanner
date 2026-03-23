// Ylärivi — harjoituksen nimi, tallennustila ja toimintopainikkeet
// PDF ja Jaa ovat Pro-ominaisuuksia, tällä hetkellä poissa käytöstä

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styles from './TopBar.module.css'

// Tallennuspainikkeen tekstit eri tiloissa
const SAVE_LABEL = {
  idle:   'Tallenna',
  saving: 'Tallennetaan...',
  saved:  '✓ Tallennettu',
  error:  '⚠ Virhe',
}

export default function TopBar({ sessionName, onSessionNameChange, onSignOut, saveStatus = 'idle', onSave }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // editing = true kun käyttäjä muokkaa harjoituksen nimeä
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(sessionName)

  // Vahvista nimen muutos kun kenttä menettää fokuksen
  function handleNameBlur() {
    setEditing(false)
    onSessionNameChange(draft || t('topbar.placeholder'))
  }

  // Enter vahvistaa, Escape peruuttaa muutoksen
  function handleNameKeyDown(e) {
    if (e.key === 'Enter') e.target.blur()
    if (e.key === 'Escape') {
      setDraft(sessionName)
      setEditing(false)
    }
  }

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
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            autoFocus
          />
        ) : (
          <button
            className={styles.namePlaceholder}
            onClick={() => {
              setDraft(sessionName)
              setEditing(true)
            }}
          >
            {sessionName || t('topbar.placeholder')}
            <span className={styles.editHint}>✎</span>
          </button>
        )}
      </div>

      <div className={styles.right}>
        {/* TODO: PDF-vienti Pro-ominaisuutena */}
        <button className={`${styles.btn} ${styles.btnSecondary}`} disabled title="Pro">
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
