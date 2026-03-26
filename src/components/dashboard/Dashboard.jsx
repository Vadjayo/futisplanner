/**
 * Dashboard.jsx
 * Kirjautuneen käyttäjän aloitussivu.
 * Vain UI — data haetaan useDashboard-hookilla.
 */

import { useEffect }       from 'react'
import { useNavigate }     from 'react-router-dom'
import { useAuth }         from '../../hooks/useAuth'
import { useDashboard }    from '../../hooks/useDashboard'
import { useCurrentTeam }  from '../../store/teamStore'
import { ROUTES }          from '../../constants/routes'
import TodayBanner      from './TodayBanner'
import RecentSessions   from './RecentSessions'
import WeekCalendar     from './WeekCalendar'
import QuickActions     from './QuickActions'
import SeasonGoalTags   from './SeasonGoalTags'
import RecentMatches    from './RecentMatches'
import styles           from './Dashboard.module.css'

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth()
  const navigate = useNavigate()
  const { data, loading, error, reload } = useDashboard()
  const { currentTeam } = useCurrentTeam()

  // Ohjaa kirjautumissivulle jos ei kirjautunut
  useEffect(() => {
    if (!authLoading && !user) navigate(ROUTES.LOGIN, { replace: true })
  }, [user, authLoading, navigate])

  /** Luo uusi sessio UUID:lla ja avaa editorissa */
  function handleNewSession() {
    navigate(ROUTES.EDITOR, { state: { sessionId: crypto.randomUUID(), isNew: true } })
  }

  // Käyttäjän nimi metadatasta tai sähköpostista
  const userName = user?.user_metadata?.full_name
    || user?.email?.split('@')[0]
    || 'Valmentaja'

  // Päivämäärä suomeksi esim. "ke 26.3.2026"
  const dateLabel = new Date().toLocaleDateString('fi-FI', {
    weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric',
  })

  // Onboarding: uusi käyttäjä ilman joukkuetta ja sessioita
  const isNewUser = !loading && !error && data && !currentTeam && data.sessions.length === 0

  return (
    <div className={styles.page}>

      {/* ── NAVIGAATIO ── */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <button className={styles.logo} onClick={() => navigate(ROUTES.HOME)}>
            ⚽ FutisPlanner
          </button>
          <div className={styles.navRight}>
            <span className={styles.userEmail}>{user?.email}</span>
            <button className={styles.btnSignOut} onClick={signOut}>Kirjaudu ulos</button>
          </div>
        </div>
      </nav>

      <div className={styles.content}>

        {/* ── TERVEHDYS ── */}
        <div className={styles.greeting}>
          <h1 className={styles.greetingTitle}>Hei, {userName} 👋</h1>
          <p className={styles.greetingMeta}>
            {dateLabel}
            {currentTeam && (
              <span className={styles.teamBadge}>{currentTeam.name}</span>
            )}
          </p>
        </div>

        {/* ── VIRHETILA ── */}
        {error && (
          <div className={styles.errorBanner}>
            <span>Tietojen haku epäonnistui — yritä uudelleen</span>
            <button className={styles.btnRetry} onClick={reload}>Yritä uudelleen</button>
          </div>
        )}

        {/* ── ONBOARDING (uusi käyttäjä) ── */}
        {isNewUser && (
          <div className={styles.onboarding}>
            <div className={styles.onboardingIcon}>🎉</div>
            <h2 className={styles.onboardingTitle}>Tervetuloa FutisPlanner!</h2>
            <p className={styles.onboardingDesc}>
              Aloita luomalla joukkue ja suunnittelemalla ensimmäinen harjoituksesi.
            </p>
            <div className={styles.onboardingActions}>
              <button className={styles.btnPrimary} onClick={() => navigate(ROUTES.SEASON)}>
                Luo joukkue
              </button>
              <button className={styles.btnSecondary} onClick={handleNewSession}>
                Luo harjoitus
              </button>
            </div>
          </div>
        )}

        {/* ── TÄNÄÄN-BANNERI ── */}
        <TodayBanner
          loading={loading}
          nextDrill={data?.nextDrill}
          nextGame={data?.nextGame}
          drillCount={data?.drillCount ?? 0}
          gameCount={data?.gameCount ?? 0}
          team={currentTeam}
          onOpenEditor={handleNewSession}
          onNewDrill={() => navigate(ROUTES.SEASON)}
          onMatchDay={() => navigate(ROUTES.MATCH_DAY)}
        />

        {/* ── KAKSIPALSTAINEN LAYOUT ── */}
        <div className={styles.columns}>

          {/* VASEN: harjoitukset + ottelut + viikkokalenteri */}
          <div className={styles.colMain}>
            <RecentSessions
              loading={loading}
              sessions={data?.sessions ?? []}
              onOpen={(id) => navigate(ROUTES.EDITOR, { state: { sessionId: id } })}
              onNew={handleNewSession}
            />
            <RecentMatches
              loading={loading}
              matches={data?.recentMatches ?? []}
              onOpen={(id) => navigate(`${ROUTES.MATCH_DAY}/${id}`)}
              onNew={() => navigate(ROUTES.MATCH_DAY)}
            />
            <WeekCalendar
              loading={loading}
              weekEvents={data?.weekEvents ?? []}
              onNavigate={() => navigate(ROUTES.SEASON)}
            />
          </div>

          {/* OIKEA: pikaoikaisut + kausitavoitteet */}
          <div className={styles.colSide}>
            <QuickActions
              onNewSession={handleNewSession}
              onSeason={() => navigate(ROUTES.SEASON)}
              onMatchDay={() => navigate(ROUTES.MATCH_DAY)}
              onTeams={() => navigate(ROUTES.TEAMS)}
            />
            <SeasonGoalTags
              loading={loading}
              goals={currentTeam?.goals}
              onNavigate={() => navigate(ROUTES.SEASON)}
            />
          </div>

        </div>

      </div>
    </div>
  )
}
