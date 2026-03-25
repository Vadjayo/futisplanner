/**
 * RegisterPage.jsx
 * Rekisteröintisivu. Luo uuden käyttäjätilin Supabaseen.
 * Validoi kentät ennen lähetystä.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES } from '../../constants/routes'
import styles from './AuthPage.module.css'

// Tarkistaa että sähköposti on oikeassa muodossa
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Muuntaa Supabasen englanninkieliset virheviestit suomeksi
function mapError(msg) {
  if (!msg) return 'Rekisteröinti epäonnistui. Yritä uudelleen.'
  if (msg.includes('User already registered'))          return 'Tällä sähköpostilla on jo tili.'
  if (msg.includes('Password should be at least'))      return 'Salasanan täytyy olla vähintään 6 merkkiä.'
  if (msg.includes('Unable to validate email address')) return 'Tarkista sähköpostiosoite.'
  if (msg.includes('Too many requests'))                return 'Liian monta yritystä. Odota hetki.'
  return msg
}

export default function RegisterPage() {
  const { signUp } = useAuth()

  const [name,        setName]        = useState('')
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [confirmPwd,  setConfirmPwd]  = useState('')
  const [error,       setError]       = useState(null)
  const [success,     setSuccess]     = useState(false)
  const [submitting,  setSubmitting]  = useState(false)

  // Validoi kentät ja rekisteröi käyttäjä
  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    // Paikalliset validoinnit ennen Supabase-kutsua
    if (!name.trim()) {
      setError('Syötä nimesi.')
      return
    }
    if (!isValidEmail(email)) {
      setError('Sähköpostiosoite ei ole kelvollinen.')
      return
    }
    if (password.length < 8) {
      setError('Salasanan täytyy olla vähintään 8 merkkiä.')
      return
    }
    if (password !== confirmPwd) {
      setError('Salasanat eivät täsmää.')
      return
    }

    setSubmitting(true)
    const { data, error } = await signUp(email, password, name.trim())
    setSubmitting(false)

    if (error) {
      setError(mapError(error.message))
      return
    }

    // Tarkistetaan vaatiiko Supabase sähköpostivahvistuksen
    // Jos identities-lista on tyhjä, käyttäjä on jo olemassa (mutta ei paljasteta sitä tietoturvan vuoksi)
    const needsConfirm = !data?.session
    if (needsConfirm) {
      setSuccess(true)
    } else {
      // Sähköpostivahvistus ei ole päällä — käyttäjä on kirjautunut automaattisesti
      // useAuth-hook huomaa istunnon muutoksen ja ProtectedRoute ohjaa dashboardille
      setSuccess(true)
    }
  }

  // Onnistumisviesti näytetään rekisteröinnin jälkeen
  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.logo}>✉️</div>
          <h1 className={styles.title}>Tarkista sähköpostisi</h1>
          <p className={styles.subtitle}>
            Lähetimme sinulle vahvistuslinkin. Vahvista tilisi ennen kirjautumista.
          </p>
          <div className={styles.divider}>
            <Link to={ROUTES.LOGIN} className={styles.link}>
              Kirjaudu sisään →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>⚽</div>
        <h1 className={styles.title}>Luo tili</h1>
        <p className={styles.subtitle}>Aloita harjoitusten suunnittelu</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Nimi
            <input
              className={styles.input}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              placeholder="Matti Meikäläinen"
            />
          </label>

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
              autoComplete="new-password"
              placeholder="Vähintään 8 merkkiä"
            />
          </label>

          <label className={styles.label}>
            Salasana uudelleen
            <input
              className={styles.input}
              type="password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="••••••••"
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.button} type="submit" disabled={submitting}>
            {submitting ? 'Luodaan tiliä...' : 'Luo tili'}
          </button>
        </form>

        <div className={styles.divider}>
          <Link to={ROUTES.LOGIN} className={styles.link}>
            Onko sinulla jo tili? Kirjaudu →
          </Link>
        </div>
      </div>
    </div>
  )
}
