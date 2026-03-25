/**
 * SeasonPage.jsx
 * Kausisuunnittelun pääsivu. Joukkue, faasiaikajana, tavoitteet ja kalenteri.
 * Sivupalkissa joukkuelista ja valmiit harjoitusohjelmapohjat.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  loadTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  loadEvents,
  addEvents,
} from '../../lib/seasonDb'
import TeamInfo from './TeamInfo'
import PhaseTimeline from './PhaseTimeline'
import GoalTags from './GoalTags'
import SeasonCalendar from './SeasonCalendar'
import styles from './SeasonPage.module.css'

// ── HARJOITUSOHJELMAPOHJAT ──

// Palauttaa viikonpäivänumerot (0=Su, 1=Ma ... 6=La) pohjan mukaan
const TEMPLATES = [
  {
    id: 'hobby2',
    label: 'Harraste 2×/vk (Ti & To)',
    days: [2, 4], // tiistai, torstai
  },
  {
    id: 'competition3',
    label: 'Kilpa 3×/vk (Ma, Ke, Pe)',
    days: [1, 3, 5], // maanantai, keskiviikko, perjantai
  },
  {
    id: 'competition4',
    label: 'Kilpa 4×/vk (Ma, Ti, To, Pe)',
    days: [1, 2, 4, 5], // maanantai, tiistai, torstai, perjantai
  },
]

// Generoi treeni-tapahtumat annetuille viikonpäiville kauden alusta loppuun
function generateTemplateDrills(days, seasonStart, seasonEnd, teamId, userId) {
  const events = []
  const start  = new Date(seasonStart + 'T00:00:00')
  const end    = new Date(seasonEnd   + 'T00:00:00')
  const current = new Date(start)

  while (current <= end) {
    const dow = current.getDay() // 0=Su...6=La
    if (days.includes(dow)) {
      events.push({
        userId,
        teamId,
        title:      'Treeni',
        type:       'drill',
        date:       current.toLocaleDateString('sv-SE'),
        time:       null,
        duration:   90,
        theme:      null,
        isRecurring: false,
      })
    }
    current.setDate(current.getDate() + 1)
  }
  return events
}

export default function SeasonPage() {
  const { user, signOut, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [teams, setTeams]       = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [team, setTeam]         = useState(null)
  const [events, setEvents]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)

  // Pohjan vahvistusmodaali: null | { template: object }
  const [templateConfirm, setTemplateConfirm] = useState(null)
  const [templateBusy, setTemplateBusy]       = useState(false)

  const saveTimer    = useRef(null)
  const isFirstLoad  = useRef(true)

  // Ohjaa kirjautumissivulle jos ei kirjautunut
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
        name:         team.name,
        age_group:    team.age_group,
        level:        team.level,
        season:       team.season,
        coaches:      team.coaches,
        player_count: team.player_count,
        phases:       team.phases,
        goals:        team.goals,
      })
      setSaving(false)
      // Päivitä myös teams-listaan uusi nimi
      setTeams((prev) =>
        prev.map((t) => t.id === selectedId ? { ...t, name: team.name, season: team.season } : t)
      )
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

  // Lataa tapahtumat uudelleen tietokannasta (SeasonCalendar kutsuu tätä muutosten jälkeen)
  function handleEventsChange() {
    if (!selectedId) return
    loadEvents(selectedId).then(({ data }) => setEvents(data ?? []))
  }

  // ── POHJAKÄSITTELY ──

  // Laske kauden alku- ja loppupäivämäärä faaseista tai kuluvan vuoden raja-arvoista
  function getSeasonRange() {
    const phases = team?.phases ?? []
    const valid  = phases.filter((p) => p.start && p.end)
    if (valid.length > 0) {
      const starts = valid.map((p) => p.start).sort()
      const ends   = valid.map((p) => p.end).sort()
      return { start: starts[0], end: ends[ends.length - 1] }
    }
    const y = new Date().getFullYear()
    return { start: `${y}-01-01`, end: `${y}-12-31` }
  }

  function handleTemplateClick(template) {
    if (template.id === 'copyLast') {
      alert('Toiminto ei ole vielä saatavilla.')
      return
    }
    setTemplateConfirm({ template })
  }

  async function handleTemplateConfirm() {
    if (!templateConfirm || templateBusy || !selectedId) return
    const { template } = templateConfirm
    setTemplateBusy(true)

    try {
      const range  = getSeasonRange()
      const events = generateTemplateDrills(template.days, range.start, range.end, selectedId, user.id)
      if (events.length === 0) {
        alert('Kaudelle ei löytynyt sopivia päiviä.')
        return
      }
      const { error } = await addEvents(events)
      if (error) {
        console.error('Pohjan luonti epäonnistui:', error.message)
        alert('Pohjan luonti epäonnistui: ' + error.message)
        return
      }
      setTemplateConfirm(null)
      handleEventsChange()
    } finally {
      setTemplateBusy(false)
    }
  }

  function handleGoogleCalSync() {
    alert('Ei käytössä vielä.')
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
            <button className={styles.btnGoogleCal} onClick={handleGoogleCalSync} title="Google Kalenteri -synkronointi">
              Google Kalenteri
            </button>
            <span className={styles.userEmail}>{user?.email}</span>
            <button className={styles.btnSignOut} onClick={signOut}>Kirjaudu ulos</button>
          </div>
        </div>
      </nav>

      <div className={styles.layout}>

        {/* ── VASEN SIVUPALKKI — joukkueet + pohjat ── */}
        <aside className={styles.sidebar}>

          {/* Joukkuelista */}
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

          {/* Valmiit harjoitusohjelmapohjat */}
          {team && (
            <div className={styles.templates}>
              <div className={styles.templatesHeader}>Valmiit pohjat</div>
              <button
                className={styles.templateBtn}
                onClick={() => handleTemplateClick({ id: 'copyLast', label: 'Kopioi viime kausi', days: [] })}
              >
                Kopioi viime kausi
              </button>
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  className={styles.templateBtn}
                  onClick={() => handleTemplateClick(tpl)}
                >
                  {tpl.label}
                </button>
              ))}
            </div>
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
                teamId={selectedId}
                userId={user.id}
                onEventsChange={handleEventsChange}
              />
            </>
          )}
        </main>
      </div>

      {/* ── POHJAN VAHVISTUSMODAALI ── */}
      {templateConfirm && (
        <div className={styles.templateOverlay} onClick={() => !templateBusy && setTemplateConfirm(null)}>
          <div className={styles.templateConfirm} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.templateConfirmTitle}>Luo harjoitusohjelma</h3>
            <p className={styles.templateConfirmText}>
              Luodaanko harjoitusohjelma pohjasta <strong>{templateConfirm.template.label}</strong>?
              <br />
              Tämä lisää toistuvat treenit koko kaudelle.
            </p>
            <div className={styles.templateConfirmActions}>
              <button
                className={styles.btnTemplateCreate}
                onClick={handleTemplateConfirm}
                disabled={templateBusy}
              >
                {templateBusy ? 'Luodaan...' : 'Luo'}
              </button>
              <button
                className={styles.btnTemplateCancel}
                onClick={() => setTemplateConfirm(null)}
                disabled={templateBusy}
              >
                Peruuta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
