/**
 * Toast.jsx
 * Toast-ilmoituskomponentti.
 * Näytetään tallennuksen, virheen jne. jälkeen.
 *
 * Käyttö:
 *   const { toasts, showToast } = useToast()
 *   showToast('Tallennettu!', 'success')
 *   showToast('Tallennus epäonnistui.', 'error')
 *   <Toast toasts={toasts} />
 *
 * @param {Array<{ id: number, message: string, type: 'success'|'error'|'info'|'warning' }>} toasts
 */

const TYPE_STYLES = {
  success: {
    background: 'rgba(15,110,86,0.12)',
    color:      '#1D9E75',
    border:     '0.5px solid rgba(29,158,117,0.25)',
    icon:       '✓',
  },
  error: {
    background: 'rgba(153,60,29,0.12)',
    color:      '#D85A30',
    border:     '0.5px solid rgba(216,90,48,0.25)',
    icon:       '✕',
  },
  info: {
    background: 'rgba(55,138,221,0.12)',
    color:      '#378ADD',
    border:     '0.5px solid rgba(55,138,221,0.25)',
    icon:       'ℹ',
  },
  warning: {
    background: 'rgba(239,159,39,0.12)',
    color:      '#EF9F27',
    border:     '0.5px solid rgba(239,159,39,0.25)',
    icon:       '⚠',
  },
}

const Toast = ({ toasts = [] }) => {
  if (toasts.length === 0) return null

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position:      'fixed',
        bottom:        '20px',
        right:         '20px',
        zIndex:        2000,
        display:       'flex',
        flexDirection: 'column',
        gap:           '8px',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => {
        const s = TYPE_STYLES[toast.type] ?? TYPE_STYLES.success
        return (
          <div
            key={toast.id}
            style={{
              padding:      '10px 16px',
              borderRadius: '8px',
              fontSize:     '13px',
              fontWeight:   500,
              background:   s.background,
              color:        s.color,
              border:       s.border,
              display:      'flex',
              alignItems:   'center',
              gap:          '8px',
              boxShadow:    '0 4px 16px rgba(0,0,0,0.3)',
              animation:    'toast-in 0.2s ease',
            }}
          >
            <span aria-hidden="true">{s.icon}</span>
            {toast.message}
          </div>
        )
      })}
    </div>
  )
}

export default Toast
