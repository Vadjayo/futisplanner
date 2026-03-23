// Dashboard — kirjautuneen käyttäjän aloitussivu
// Näyttää kaikki sessiot kortteina ja mahdollistaa uuden luomisen

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { loadAllSessions, deleteSession } from '../../lib/db'
import styles from './Dashboard.module.css'

// Muotoile päivämäärä suomalaiseen muotoon (esim. "21.3.2025")
function formatDate(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleDateString('fi-FI', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })
}

// Laske session harjoitteiden yhteiskesto minuutteina
function totalDuration(drills) {
  return (drills ?? []).reduce((sum, d) => sum + (d.duration ?? 0), 0)
}

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  // deletingId = juuri poistettavan session id — näyttää lataustilan kortissa
  const [deletingId, setDeletingId] = useState(null)

  // Lataa sessiot kun komponentti mountataan
  useEffect(() => {
    if (!user) return
    loadAllSessions(user.id).then(({ data }) => {
      setSessions(data ?? [])
      setLoading(false)
    })
  }, [user])

  // Luo uusi sessio — generoi UUID:n ja siirtyy editoriin
  function handleNewSession() {
    const newSessionId = crypto.randomUUID()
    navigate('/sovellus', { state: { sessionId: newSessionId, isNew: true } })
  }

  // Avaa olemassa oleva sessio editorissa
  function handleOpen(sessionId) {
    navigate('/sovellus', { state: { sessionId } })
  }

  // Poista sessio vahvistuksen jälkeen
  async function handleDelete(e, sessionId) {
    e.stopPropagation() // estä kortin click-tapahtuma
    if (!confirm('Poistetaanko suunnitelma pysyvästi?')) return
    setDeletingId(sessionId)
    await deleteSession(sessionId)
    setSessions((prev) => prev.filter((s) => s.id !== sessionId))
    setDeletingId(null)
  }

  // Laske kokonaisstatistiikat otsikkoriville
  const totalSessions = sessions.length
  const totalDrills = sessions.reduce((sum, s) => sum + (s.drills?.length ?? 0), 0)

  return (
    <div className={styles.page}>

      {/* ── NAVIGAATIO ── */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <span className={styles.logo}>⚽ FutisPlanner</span>
          <div className={styles.navRight}>
            <span className={styles.userEmail}>{user?.email}</span>
            <button className={styles.btnSignOut} onClick={signOut}>
              Kirjaudu ulos
            </button>
          </div>
        </div>
      </nav>

      <div className={styles.content}>

        {/* ── OTSIKKORIVI ── */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Harjoitussuunnitelmat</h1>
            {!loading && (
              <p className={styles.subtitle}>
                {totalSessions} suunnitelmaa · {totalDrills} harjoitetta yhteensä
              </p>
            )}
          </div>
          <button className={styles.btnNew} onClick={handleNewSession}>
            + Uusi suunnitelma
          </button>
        </div>

        {/* ── LATAUS ── */}
        {loading && (
          <div className={styles.loadingState}>
            <span className={styles.loadingIcon}>⚽</span>
          </div>
        )}

        {/* ── TYHJÄ TILA ── */}
        {!loading && sessions.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📋</div>
            <h2 className={styles.emptyTitle}>Ei vielä suunnitelmia</h2>
            <p className={styles.emptyDesc}>
              Luo ensimmäinen harjoitussuunnitelmasi aloittaaksesi.
            </p>
            <button className={styles.btnNewLg} onClick={handleNewSession}>
              Luo ensimmäinen suunnitelma →
            </button>
          </div>
        )}

        {/* ── SESSIORUUDUKKO ── */}
        {!loading && sessions.length > 0 && (
          <div className={styles.grid}>
            {sessions.map((session) => {
              const drillCount = session.drills?.length ?? 0
              const minutes = totalDuration(session.drills)

              return (
                <div
                  key={session.id}
                  className={styles.card}
                  onClick={() => handleOpen(session.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleOpen(session.id)}
                >
                  {/* Kortin yläosa: nimi + poistopainike */}
                  <div className={styles.cardTop}>
                    <h3 className={styles.cardTitle}>
                      {session.name || 'Nimetön suunnitelma'}
                    </h3>
                    <button
                      className={styles.btnDelete}
                      onClick={(e) => handleDelete(e, session.id)}
                      disabled={deletingId === session.id}
                      title="Poista suunnitelma"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Tilastobadget */}
                  <div className={styles.cardBadges}>
                    <span className={styles.badge}>
                      {drillCount} {drillCount === 1 ? 'harjoite' : 'harjoitetta'}
                    </span>
                    {minutes > 0 && (
                      <span className={styles.badge}>{minutes} min</span>
                    )}
                  </div>

                  {/* Päivämäärä + avaa-nappi */}
                  <div className={styles.cardFooter}>
                    <span className={styles.cardDate}>
                      Muokattu {formatDate(session.updated_at)}
                    </span>
                    <span className={styles.openHint}>Avaa →</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
