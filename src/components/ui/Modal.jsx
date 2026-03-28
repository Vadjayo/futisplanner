/**
 * Modal.jsx
 * Modaalikomponentti vahvistuksille ja lomakkeille.
 * TÄRKEÄ: Kaikki poistot käyvät tämän kautta — ei window.confirm().
 *
 * Käyttö:
 *   <Modal
 *     isOpen={isOpen}
 *     onClose={() => setOpen(false)}
 *     title="Poistetaanko?"
 *     footer={<><Button variant="danger" onClick={confirm}>Poista</Button>
 *               <Button variant="ghost" onClick={cancel}>Peruuta</Button></>}
 *   >
 *     Haluatko varmasti poistaa?
 *   </Modal>
 *
 * @param {boolean}     isOpen
 * @param {() => void}  onClose  - Sulkee klikkaamalla taustaa tai Escape
 * @param {string}      title
 * @param {ReactNode}   children
 * @param {ReactNode}   footer   - Toimintopainikkeet (oikea-align)
 * @param {'sm'|'md'|'lg'} size
 */

import { useEffect } from 'react'
import { COLORS } from '../../constants/colors'

const MAX_WIDTHS = { sm: '360px', md: '480px', lg: '640px' }

const Modal = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
  // Sulje Escape-näppäimellä
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      style={{
        position:       'fixed',
        inset:          0,
        zIndex:         1000,
        background:     'rgba(0,0,0,0.7)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '16px',
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          background:   '#161820',
          border:       '0.5px solid #1e2230',
          borderRadius: '12px',
          padding:      '20px 24px',
          maxWidth:     MAX_WIDTHS[size] ?? MAX_WIDTHS.md,
          width:        '100%',
          boxShadow:    '0 24px 80px rgba(0,0,0,0.6)',
          maxHeight:    '90vh',
          overflowY:    'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Otsikko */}
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ color: COLORS.text.primary, fontSize: '15px', fontWeight: 600, margin: 0 }}>
              {title}
            </h3>
            <button
              onClick={onClose}
              aria-label="Sulje"
              style={{
                background: 'none', border: 'none', color: '#5a7a9a',
                fontSize: '14px', cursor: 'pointer', padding: '2px 6px',
                borderRadius: '4px',
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Sisältö */}
        <div>{children}</div>

        {/* Toimintopainikkeet */}
        {footer && (
          <div style={{ marginTop: '20px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal
