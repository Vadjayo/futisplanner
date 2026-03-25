/**
 * useToast.js
 * Toast-ilmoitusten hallinta.
 *
 * Käyttö:
 *   const { toasts, showToast } = useToast()
 *   showToast('Tallennettu!', 'success')
 *   showToast('Virhe tallennuksessa.', 'error')
 *
 *   // Renderöinti (yhdistä ToastContainer-komponenttiin):
 *   <ToastContainer toasts={toasts} />
 */

import { useState, useCallback, useRef } from 'react'
import { CONFIG } from '../constants/config'

export function useToast(duration = CONFIG.TOAST_DURATION) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id])
    delete timers.current[id]
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  /** Näytä toast-ilmoitus. Poistuu automaattisesti `duration` ms jälkeen. */
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    timers.current[id] = setTimeout(() => dismiss(id), duration)
    return id
  }, [dismiss, duration])

  return { toasts, showToast }
}
