// Kirjautumislogiikka — React-hook joka hallitsee käyttäjän istuntoa
// Kuuntelee Supabasen auth-tilaa reaaliajassa (esim. token-vanheneminen)

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Tarkista onko käyttäjällä jo aktiivinen istunto sovelluksen käynnistyessä
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Kuuntele kirjautumis/uloskirjautumistapahtumat reaaliajassa
    // Tämä päivittää tilan automaattisesti myös toisessa välilehdessä
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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

  // Luo uusi tili — Supabase lähettää vahvistuslinkin sähköpostiin
  async function signUp(email, password) {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error }
  }

  // Kirjaudu ulos — Supabase poistaa istunnon automaattisesti
  async function signOut() {
    await supabase.auth.signOut()
  }

  return { user, loading, signIn, signUp, signOut }
}
