/**
 * ResetPasswordPage.jsx
 * Salasanan vaihtaminen. Supabase ohjaa käyttäjän tänne palautuslinkin kautta.
 * Istunto asetetaan automaattisesti URL:n hash-parametreista.
 */

import { useState }             from 'react'
import { useNavigate, Link }    from 'react-router-dom'
import { usePasswordReset }     from '../../hooks/usePasswordReset'
import { ROUTES }               from '../../constants/routes'
import styles                   from './AuthPage.module.css'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const { ready, updatePassword } = usePasswordReset()

  const [password,   setPassword]   = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [error,      setError]      = useState(null)
  const [success,    setSuccess]    = useState(false)
  const [submitting, setSubmitting] = useState(false)

  /** Tallenna uusi salasana */
  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Salasanan täytyy olla vähintään 8 merkkiä.')
      return
    }
    if (password !== confirmPwd) {
      setError('Salasanat eivät täsmää.')
      return
    }

    setSubmitting(true)
    const { error: updateError } = await updatePassword(password)
    setSubmitting(false)

    if (updateError) {
      setError('Salasanan vaihto epäonnistui. Yritä pyytää uusi palautuslinkki.')
      return
    }

    setSuccess(true)
    // Ohjaa dashboardille muutaman sekunnin kuluttua
    setTimeout(() => navigate(ROUTES.DASHBOARD, { replace: true }), 2500)
  }

  // Onnistumistila
  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.logo}>✅</div>
          <h1 className={styles.title}>Salasana vaihdettu!</h1>
          <p className={styles.subtitle}>Sinut ohjataan automaattisesti sovellukseen.</p>
        </div>
      </div>
    )
  }

  // Odotetaan palautusistuntoa (linkin hash-parametrien käsittely)
  if (!ready) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.logo}>⏳</div>
          <h1 className={styles.title}>Tarkistetaan linkkiä...</h1>
          <p className={styles.subtitle}>
            Jos tämä kestää kauan, pyydä uusi palautuslinkki.
          </p>
          <div className={styles.divider}>
            <Link to={ROUTES.FORGOT_PASSWORD} className={styles.link}>
              Pyydä uusi linkki →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>🔒</div>
        <h1 className={styles.title}>Vaihda salasana</h1>
        <p className={styles.subtitle}>Syötä uusi salasanasi</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Uusi salasana
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
            {submitting ? 'Tallennetaan...' : 'Tallenna uusi salasana'}
          </button>
        </form>
      </div>
    </div>
  )
}
