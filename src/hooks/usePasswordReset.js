/**
 * usePasswordReset.js
 * Salasanan palautuksen tilan hallinta.
 * Kuuntelee Supabasen PASSWORD_RECOVERY -tapahtumaa ja paljastaa updatePassword-funktion.
 *
 * Käyttö:
 *   const { ready, updatePassword } = usePasswordReset()
 */

import { useState, useEffect } from 'react'
import { supabase }            from '../services/supabase'
import { useAuth }             from './useAuth'

/**
 * Kuuntelee PASSWORD_RECOVERY-tapahtumaa ja tarjoaa salasananvaihtofunktion.
 * @returns {{ ready: boolean, updatePassword: function }}
 */
export function usePasswordReset() {
  const { updatePassword } = useAuth()
  const [ready, setReady]  = useState(false)

  useEffect(() => {
    // Supabase lähettää PASSWORD_RECOVERY kun käyttäjä saapuu palautuslinkin kautta
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  return { ready, updatePassword }
}
