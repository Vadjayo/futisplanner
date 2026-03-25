/**
 * useToast.js
 * Toast-ilmoitusten hallinta-hook.
 *
 * Käyttö:
 *   const { toasts, toast } = useToast()
 *   toast.success('Tallennettu!')
 *   toast.error('Tallennus epäonnistui.')
 *   toast.info('Muista tallentaa.')
 *   toast.warning('Yhteys heikko.')
 *
 *   // Renderöinti:
 *   <ToastContainer toasts={toasts} />
 */

import { useState, useCallback, useRef } from 'react'

let nextId = 1

export function useToast(duration = 2500) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id])
    delete timers.current[id]
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const add = useCallback((message, type = 'success') => {
    const id = nextId++
    setToasts((prev) => [...prev, { id, message, type, onDismiss: () => dismiss(id) }])
    timers.current[id] = setTimeout(() => dismiss(id), duration)
    return id
  }, [dismiss, duration])

  const toast = {
    success: (msg) => add(msg, 'success'),
    error:   (msg) => add(msg, 'error'),
    info:    (msg) => add(msg, 'info'),
    warning: (msg) => add(msg, 'warning'),
  }

  return { toasts, toast }
}
