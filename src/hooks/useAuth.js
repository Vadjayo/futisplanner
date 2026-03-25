/**
 * useAuth.js
 * Kirjautumislogiikka — hallitsee käyttäjän istuntoa reaaliajassa.
 * Kuuntelee Supabasen auth-tilaa: token-vanheneminen, muut välilehdet jne.
 *
 * Käyttö:
 *   const { user, loading, signIn, signOut, signUp, resetPassword } = useAuth()
 */

import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { ROUTES } from '../constants/routes'

export function useAuth() {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Tarkista onko käyttäjällä jo aktiivinen istunto sovelluksen käynnistyessä
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Kuuntele kirjautumis- ja uloskirjautumistapahtumat reaaliajassa
    // Päivittää tilan automaattisesti myös toisessa välilehdessä
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  /** Kirjaudu sisään sähköpostilla ja salasanalla */
  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  /** Luo uusi tili — tallentaa nimen käyttäjän metadataan */
  async function signUp(email, password, name = '') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })
    return { data, error }
  }

  /** Kirjaudu ulos */
  async function signOut() {
    await supabase.auth.signOut()
  }

  /** Lähetä salasanan palautuslinkki sähköpostiin */
  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${ROUTES.RESET_PASSWORD}`,
    })
    return { error }
  }

  /** Vaihda uusi salasana (kutsutaan RESET_PASSWORD-sivulta PASSWORD_RECOVERY-tapahtuman jälkeen) */
  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error }
  }

  return { user, loading, signIn, signUp, signOut, resetPassword, updatePassword }
}
