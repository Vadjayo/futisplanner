// Kirjautumissivu — näytetään kun käyttäjä ei ole kirjautunut sisään
// Tukee sekä sisäänkirjautumista että uuden tilin luontia samassa lomakkeessa

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import styles from './AuthPage.module.css'

export default function AuthPage() {
  const { t } = useTranslation()
  const { signIn, signUp, user } = useAuth()
  const navigate = useNavigate()

  // Ohjaa dashboardille jos käyttäjä on jo kirjautunut
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  // 'login' = kirjaudu sisään, 'register' = luo uusi tili
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Käsittele lomakkeen lähetys — toimii sekä kirjautumiseen että rekisteröintiin
  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setSubmitting(true)

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
      // Onnistunut kirjautuminen ohjaa App.jsx:ssä automaattisesti pääsivulle
    } else {
      const { error } = await signUp(email, password)
      if (error) setError(error.message)
      else setMessage(t('auth.checkEmail')) // pyydä vahvistamaan sähköposti
    }

    setSubmitting(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>⚽</div>
        <h1 className={styles.title}>{t('auth.title')}</h1>
        <p className={styles.subtitle}>{t('auth.subtitle')}</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            {t('auth.email')}
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
            {t('auth.password')}
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="••••••••"
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}
          {message && <p className={styles.success}>{message}</p>}

          <button className={styles.button} type="submit" disabled={submitting}>
            {submitting
              ? t('auth.loading')
              : mode === 'login'
              ? t('auth.login')
              : t('auth.register')}
          </button>
        </form>

        {/* Vaihda kirjautumisen ja rekisteröinnin välillä */}
        <button
          className={styles.switchMode}
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login')
            setError(null)
            setMessage(null)
          }}
        >
          {mode === 'login' ? t('auth.switchToRegister') : t('auth.switchToLogin')}
        </button>
      </div>
    </div>
  )
}
