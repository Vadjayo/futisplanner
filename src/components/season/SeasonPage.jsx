/**
 * SeasonPage.jsx
 * Kausisuunnittelun pääsivu. Joukkue, faasiaikajana, tavoitteet ja kalenteri.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { loadTeams, createTeam, updateTeam, deleteTeam, loadEvents, addEvent, deleteEvent } from '../../lib/seasonDb'
import TeamInfo from './TeamInfo'
import PhaseTimeline from './PhaseTimeline'
import GoalTags from './GoalTags'
import SeasonCalendar from './SeasonCalendar'
import SeasonStats from './SeasonStats'
import styles from './SeasonPage.module.css'

export default function SeasonPage() {
  const { user, signOut, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [teams, setTeams] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [team, setTeam] = useState(null)       // paikallinen tila — autogesätään DB:hen
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [addEventType, setAddEventType] = useState('drill')

  const saveTimer = useRef(null)
  const isFirstLoad = useRef(true)

  // Ohjaa kirjautumissivulle jos ei kirjautunut (odota ensin auth-lataus)
  useEffect(() => {
    if (!authLoading && !user) navigate('/kirjaudu', { replace: true })
  }, [authLoading, user, navigate])

  // Lataa joukkueet käynnistyessä
  useEffect(() => {
    if (!user) return
    loadTeams(user.id).then(({ data }) => {
      const list = data ?? []
      setTeams(list)
      if (list.length > 0) {
        setSelectedId(list[0].id)
        setTeam(list[0])
      }
      setLoading(false)
      isFirstLoad.current = false
    })
  }, [user])

  // Lataa tapahtumat kun joukkue vaihtuu
  useEffect(() => {
    if (!selectedId) { setEvents([]); return }
    loadEvents(selectedId).then(({ data }) => setEvents(data ?? []))
  }, [selectedId])

  // Autogesäys 1 sekunnin debounssilla kun team-tila muuttuu
  useEffect(() => {
    if (isFirstLoad.current || !team || !selectedId) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaving(true)
      await updateTeam(selectedId, {
        name: team.name,
        age_group: team.age_group,
        level: team.level,
        season: team.season,
        coaches: team.coaches,
        player_count: team.player_count,
        phases: team.phases,
        goals: team.goals,
      })
      setSaving(false)
      // Päivitä myös teams-listaan uusi nimi
      setTeams((prev) => prev.map((t) => t.id === selectedId ? { ...t, name: team.name, season: team.season } : t))
    }, 1000)
    return () => clearTimeout(saveTimer.current)
  }, [team, selectedId])

  // Päivitä yksittäinen kenttä paikalliseen tilaan
  const handleTeamUpdate = useCallback((field, value) => {
    setTeam((prev) => ({ ...prev, [field]: value }))
  }, [])

  async function handleCreateTeam() {
    const { data } = await createTeam(user.id)
    if (!data) return
    isFirstLoad.current = false
    setTeams((prev) => [...prev, data])
    setSelectedId(data.id)
    setTeam(data)
  }

  function handleSelectTeam(t) {
    isFirstLoad.current = true // estä gesäys joukkueen vaihdon aikana
    setSelectedId(t.id)
    setTeam(t)
    setTimeout(() => { isFirstLoad.current = false }, 100)
  }

  async function handleDeleteTeam(e, teamId) {
    e.stopPropagation()
    if (!confirm('Poistetaanko joukkue ja kaikki sen tapahtumat pysyvästi?')) return
    await deleteTeam(teamId)
    const next = teams.filter((t) => t.id !== teamId)
    setTeams(next)
    if (selectedId === teamId) {
      const first = next[0] ?? null
      setSelectedId(first?.id ?? null)
      setTeam(first)
    }
  }

  async function handleAddEvent(date, type, time, location) {
    if (!selectedId) return
    const { data, error } = await addEvent(selectedId, { date, type, time, location })
    if (error) { console.error('Tapahtuman lisäys epäonnistui:', error.message); return }
    if (data) setEvents((prev) => [...prev, data])
  }

  async function handleDeleteEvent(eventId) {
    await deleteEvent(eventId)
    setEvents((prev) => prev.filter((e) => e.id !== eventId))
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <span className={styles.loadingIcon}>⚽</span>
      </div>
    )
  }

  return (
    <div className={styles.page}>

      {/* ── NAVIGAATIO ── */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <button className={styles.btnBack} onClick={() => navigate('/dashboard')}>
            ← Suunnitelmat
          </button>
          <span className={styles.navTitle}>Kausisuunnittelu</span>
          <div className={styles.navRight}>
            {saving && <span className={styles.savingHint}>Tallennetaan...</span>}
            <span className={styles.userEmail}>{user?.email}</span>
            <button className={styles.btnSignOut} onClick={signOut}>Kirjaudu ulos</button>
          </div>
        </div>
      </nav>

      <div className={styles.layout}>

        {/* ── VASEN SIVUPALKKI — joukkueet ── */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>Joukkueet</h2>
            <button className={styles.btnNew} onClick={handleCreateTeam} title="Uusi joukkue">+</button>
          </div>

          {teams.length === 0 ? (
            <p className={styles.emptyTeams}>Ei joukkueita vielä.<br />Luo ensimmäinen →</p>
          ) : (
            <ul className={styles.teamList}>
              {teams.map((t) => (
                <li key={t.id} className={styles.teamItem}>
                  <button
                    className={`${styles.teamBtn} ${t.id === selectedId ? styles.teamActive : ''}`}
                    onClick={() => handleSelectTeam(t)}
                  >
                    <span className={styles.teamName}>{t.name || 'Nimetön joukkue'}</span>
                    {t.season && <span className={styles.teamSeason}>{t.season}</span>}
                  </button>
                  <button
                    className={styles.btnDeleteTeam}
                    onClick={(e) => handleDeleteTeam(e, t.id)}
                    title="Poista joukkue"
                  >✕</button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* ── PÄÄSISÄLTÖ ── */}
        <main className={styles.content}>
          {!team ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📋</div>
              <h2 className={styles.emptyTitle}>Ei joukkuetta valittuna</h2>
              <p className={styles.emptyDesc}>Luo uusi joukkue vasemmalta aloittaaksesi.</p>
              <button className={styles.btnNewLg} onClick={handleCreateTeam}>
                + Luo joukkue
              </button>
            </div>
          ) : (
            <>
              <TeamInfo team={team} onUpdate={handleTeamUpdate} />
              <PhaseTimeline
                phases={team.phases ?? []}
                onUpdate={(p) => handleTeamUpdate('phases', p)}
              />
              <GoalTags
                goals={team.goals ?? {}}
                onUpdate={(g) => handleTeamUpdate('goals', g)}
              />
              <SeasonCalendar
                phases={team.phases ?? []}
                events={events}
                addEventType={addEventType}
                onAddEventTypeChange={setAddEventType}
                onAddEvent={handleAddEvent}
                onDeleteEvent={handleDeleteEvent}
              />
              <SeasonStats events={events} phases={team.phases ?? []} />
            </>
          )}
        </main>
      </div>
    </div>
  )
}
