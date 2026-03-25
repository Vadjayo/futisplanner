/**
 * AuthPage.jsx
 * Kirjautumissivu. Ohjaa rekisteröintiin ja salasanan palautukseen.
 */

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES } from '../../constants/routes'
import styles from './AuthPage.module.css'

// Muuntaa Supabasen englanninkieliset virheviestit suomeksi
function mapError(msg) {
  if (!msg) return 'Tapahtui virhe. Yritä uudelleen.'
  if (msg.includes('Invalid login credentials'))  return 'Sähköposti tai salasana on väärin.'
  if (msg.includes('Email not confirmed'))         return 'Vahvista ensin sähköpostiosoitteesi.'
  if (msg.includes('Too many requests'))           return 'Liian monta yritystä. Odota hetki.'
  return msg
}

export default function AuthPage() {
  const { signIn } = useAuth()
  const navigate   = useNavigate()

  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [error,      setError]      = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Käsittele kirjautumislomakkeen lähetys
  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error } = await signIn(email, password)
    if (error) {
      setError(mapError(error.message))
    } else {
      // Onnistunut kirjautuminen — ohjaa dashboardille
      navigate(ROUTES.DASHBOARD, { replace: true })
    }

    setSubmitting(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>⚽</div>
        <h1 className={styles.title}>FutisPlanner</h1>
        <p className={styles.subtitle}>Kirjaudu sisään jatkaaksesi</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Sähköposti
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="valmentaja@seura.fi"
            />
          </label>

          <label className={styles.label}>
            Salasana
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.button} type="submit" disabled={submitting}>
            {submitting ? 'Kirjaudutaan...' : 'Kirjaudu sisään'}
          </button>
        </form>

        <div className={styles.divider}>
          <Link to={ROUTES.REGISTER} className={styles.link}>
            Ei vielä tiliä? Luo tili →
          </Link>
          <Link to={ROUTES.FORGOT_PASSWORD} className={styles.linkSmall}>
            Unohditko salasanan?
          </Link>
        </div>
      </div>
    </div>
  )
}
