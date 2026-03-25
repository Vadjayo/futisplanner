/**
 * ForgotPasswordPage.jsx
 * Salasanan palautussivu. Lähettää palautuslinkki annettuun sähköpostiin.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES } from '../../constants/routes'
import styles from './AuthPage.module.css'

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()

  const [email,      setEmail]      = useState('')
  const [error,      setError]      = useState(null)
  const [sent,       setSent]       = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Lähetä palautuslinkki sähköpostiin
  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error } = await resetPassword(email)
    setSubmitting(false)

    if (error) {
      // Näytetään yleinen virhe — ei paljasteta onko osoite rekisteröity
      setError('Palautuslinkiä ei voitu lähettää. Tarkista sähköpostiosoite.')
      return
    }

    setSent(true)
  }

  // Onnistumistila — linkki lähetetty
  if (sent) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.logo}>📬</div>
          <h1 className={styles.title}>Linkki lähetetty!</h1>
          <p className={styles.subtitle}>
            Palautuslinkki lähetetty sähköpostiisi. Tarkista myös roskapostikansio.
          </p>
          <div className={styles.divider}>
            <Link to={ROUTES.LOGIN} className={styles.link}>
              Takaisin kirjautumiseen →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>🔑</div>
        <h1 className={styles.title}>Unohtunut salasana</h1>
        <p className={styles.subtitle}>
          Syötä sähköpostiosoitteesi niin lähetämme sinulle palautuslinkki.
        </p>

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

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.button} type="submit" disabled={submitting}>
            {submitting ? 'Lähetetään...' : 'Lähetä palautuslinkki'}
          </button>
        </form>

        <div className={styles.divider}>
          <Link to={ROUTES.LOGIN} className={styles.linkSmall}>
            ← Takaisin kirjautumiseen
          </Link>
        </div>
      </div>
    </div>
  )
}
