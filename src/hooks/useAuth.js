/**
 * useAuth.js
 * Kirjautumislogiikka — React-hook joka hallitsee käyttäjän istuntoa.
 * Kuuntelee Supabasen auth-tilaa reaaliajassa (esim. token-vanheneminen).
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Tarkista onko käyttäjällä jo aktiivinen istunto sovelluksen käynnistyessä
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Kuuntele kirjautumis- ja uloskirjautumistapahtumat reaaliajassa
    // Tämä päivittää tilan automaattisesti myös toisessa välilehdessä
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    // Lopeta kuuntelu kun komponentti poistetaan
    return () => subscription.unsubscribe()
  }, [])

  // Kirjaudu sisään sähköpostilla ja salasanalla
  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  // Luo uusi tili — tallentaa myös nimen käyttäjän metadataan
  async function signUp(email, password, name = '') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })
    return { data, error }
  }

  // Kirjaudu ulos — Supabase poistaa istunnon automaattisesti
  async function signOut() {
    await supabase.auth.signOut()
  }

  // Lähetä salasanan palautuslinkki sähköpostiin
  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/vaihda-salasana`,
    })
    return { error }
  }

  // Vaihda uusi salasana — kutsutaan /vaihda-salasana sivulta
  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error }
  }

  return { user, loading, signIn, signUp, signOut, resetPassword, updatePassword }
}
