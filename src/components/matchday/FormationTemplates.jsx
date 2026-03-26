/**
 * FormationTemplates.jsx
 * Tallennetut kokoonpanopohjat pienin tagein.
 * Lataus kysyy vahvistuksen Modal-komponentilla.
 */

import { useState } from 'react'
import Modal  from '../ui/Modal'
import Button from '../ui/Button'
import styles from './MatchDay.module.css'

/**
 * @param {Array}    templates       - Kokoonpanopohjat
 * @param {function} onLoad          - (template) => void — lataa pohjan
 * @param {function} onSaveCurrent   - () => void — tallenna nykyinen pohjaksi
 */
export default function FormationTemplates({ templates, onLoad, onSaveCurrent }) {
  const [confirmTemplate, setConfirmTemplate] = useState(null)

  function handleTagClick(template) {
    setConfirmTemplate(template)
  }

  function handleConfirm() {
    if (confirmTemplate) onLoad(confirmTemplate)
    setConfirmTemplate(null)
  }

  return (
    <div className={styles.templatesRow}>
      {templates.map((t) => (
        <button key={t.id} className={styles.templateTag} onClick={() => handleTagClick(t)}>
          {t.name}
        </button>
      ))}
      <button className={styles.templateTagOutline} onClick={onSaveCurrent}>
        + Tallenna pohjaksi
      </button>

      {/* Vahvistusmodaali pohjan lataukselle */}
      <Modal
        isOpen={!!confirmTemplate}
        onClose={() => setConfirmTemplate(null)}
        title="Lataa kokoonpanopohja?"
        size="sm"
        footer={
          <>
            <Button variant="primary" onClick={handleConfirm}>Lataa</Button>
            <Button variant="ghost" onClick={() => setConfirmTemplate(null)}>Peruuta</Button>
          </>
        }
      >
        <p style={{ color: '#8b8d97', fontSize: '14px', margin: 0 }}>
          Ladataanko pohja <strong style={{ color: '#fff' }}>"{confirmTemplate?.name}"</strong>?
          Nykyinen kokoonpano ylikirjoitetaan.
        </p>
      </Modal>
    </div>
  )
}
