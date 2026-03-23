// Editori — kirjautuneen käyttäjän harjoitusten rakennustyökalu
// Hallitsee koko editorin tilan ja koordinoi komponenttien välistä viestintää

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './lib/i18n'
import { useAuth } from './hooks/useAuth'
import { loadRecentSession, loadSessionById, saveSession } from './lib/db'
import TopBar from './components/layout/TopBar'
import LeftToolbar from './components/layout/LeftToolbar'
import RightSidebar from './components/layout/RightSidebar'
import DrillList from './components/editor/DrillList'
import LibraryPanel from './components/library/LibraryPanel'
import styles from './App.module.css'

// Luo uusi tyhjä harjoite oletusarvoilla
function createDrill() {
  return {
    id: crypto.randomUUID(),
    title: '',
    duration: 10,
    fieldType: '11v11',
    elements: [],
  }
}

// Muunna tietokannan drill-objekti sovelluksen käyttämään muotoon
// (tietokanta käyttää snake_case, sovellus camelCase)
function dbDrillToApp(d) {
  return {
    id: d.id,
    title: d.title,
    duration: d.duration,
    fieldType: d.field_type,
    elements: d.elements ?? [],
  }
}

export default function EditorApp() {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Dashboardilta voidaan antaa sessionId route staten kautta
  // isNew = true tarkoittaa että sessio luodaan tyhjänä (uusi suunnitelma)
  const routeSessionId = location.state?.sessionId
  const isNew = location.state?.isNew ?? false

  // appLoading = true kun ladataan sessiota tietokannasta ensimmäisen kerran
  const [appLoading, setAppLoading] = useState(true)
  const [sessionId, setSessionId] = useState(() => routeSessionId ?? crypto.randomUUID())
  const [sessionName, setSessionName] = useState('')

  // activeTool = aktiivinen työkalu (select/player/cone/arrow jne.)
  const [activeTool, setActiveTool] = useState('select')

  // toolOptions = aktiivisen työkalun asetukset (väri, tiimi, nuolityyppi jne.)
  const [toolOptions, setToolOptions] = useState({
    coneColor: 'orange',
    poleColor: 'yellow',
    playerTeam: 'home',
    arrowType: 'syotto',
    drawColor: 'white',
  })

  const [drills, setDrills] = useState([createDrill()])
  const [activeDrillIndex, setActiveDrillIndex] = useState(0)

  // saveStatus kertoo automaattitallenuksen tilan UI:lle
  const [saveStatus, setSaveStatus] = useState('idle') // 'idle' | 'saving' | 'saved' | 'error'
  const [libraryOpen, setLibraryOpen] = useState(false)

  const autoSaveTimer = useRef(null)

  // isFirstLoad estää auto-tallennuksen käynnistymisen heti latauksen jälkeen
  const isFirstLoad = useRef(true)

  // Ohjaa kirjautumissivulle jos ei ole kirjautunut (auth tarkistettu)
  useEffect(() => {
    if (!loading && !user) navigate('/kirjaudu', { replace: true })
  }, [user, loading, navigate])

  // Lataa sessio kirjautumisen jälkeen
  // — Jos routeSessionId annettu: lataa kyseinen sessio (tai uusi tyhjä jos isNew)
  // — Muuten: lataa viimeisin sessio (backwards-compatible fallback)
  useEffect(() => {
    if (!user) {
      setAppLoading(false)
      return
    }

    // Uusi suunnitelma — ei ladata mitään, aloitetaan tyhjästä
    if (isNew) {
      setAppLoading(false)
      isFirstLoad.current = false
      return
    }

    const loader = routeSessionId
      ? loadSessionById(user.id, routeSessionId)
      : loadRecentSession(user.id)

    loader.then(({ data }) => {
      if (data) {
        setSessionId(data.id)
        setSessionName(data.name ?? '')
        // Järjestä harjoitteet position-kentän mukaan
        const sorted = [...(data.drills ?? [])].sort((a, b) => a.position - b.position)
        setDrills(sorted.length > 0 ? sorted.map(dbDrillToApp) : [createDrill()])
      }
      setAppLoading(false)
      isFirstLoad.current = false
    })
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  // Tallenna harjoitus — asettaa saveStatus-tilan UI-palautetta varten
  const doSave = useCallback(async (sid, name, drilList, uid) => {
    setSaveStatus('saving')
    const { error } = await saveSession({ id: sid, name, userId: uid, drills: drilList })
    setSaveStatus(error ? 'error' : 'saved')
    if (!error) {
      // Palaa idle-tilaan 2.5 sekunnin kuluttua jotta "Tallennettu" katoaa
      setTimeout(() => setSaveStatus('idle'), 2500)
    }
  }, [])

  // Auto-tallennus 2 sekunnin viiveellä muutoksen jälkeen (debounce)
  useEffect(() => {
    if (isFirstLoad.current || !user) return
    clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      doSave(sessionId, sessionName, drills, user.id)
    }, 2000)
    return () => clearTimeout(autoSaveTimer.current)
  }, [drills, sessionName, sessionId, user, doSave])

  // Manuaalinen tallennus — peruuttaa vireillä olevan auto-tallennuksen
  function handleManualSave() {
    clearTimeout(autoSaveTimer.current)
    doSave(sessionId, sessionName, drills, user.id)
  }

  // Lisää uusi harjoite listan loppuun ja vieritä siihen
  function addDrill() {
    const newDrill = createDrill()
    setDrills((prev) => [...prev, newDrill])
    const newIndex = drills.length
    setActiveDrillIndex(newIndex)
    setTimeout(() => {
      document.getElementById(`drill-${newDrill.id}`)?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }

  // Päivitä yksittäisen harjoitteen kenttiä id:n perusteella
  function updateDrill(id, updates) {
    setDrills((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)))
  }

  // Lisää kirjastosta valittu harjoite kopioimalla sen sisältö
  function addDrillFromLibrary(libraryDrill) {
    const newDrill = {
      id: crypto.randomUUID(), // uusi id jotta kirjaston originaali ei muutu
      title: libraryDrill.title,
      duration: libraryDrill.duration,
      fieldType: libraryDrill.field_type,
      elements: libraryDrill.elements ?? [],
    }
    setDrills((prev) => [...prev, newDrill])
    setActiveDrillIndex(drills.length)
  }

  // Poista harjoite — varmistaa että listassa on aina vähintään yksi harjoite
  function deleteDrill(id) {
    setDrills((prev) => {
      const next = prev.filter((d) => d.id !== id)
      return next.length > 0 ? next : [createDrill()]
    })
    setActiveDrillIndex(0)
  }

  // Näytä latausindikaattori kunnes auth ja sessio on tarkistettu
  if (loading || appLoading) {
    return (
      <div className={styles.loading}>
        <span>⚽</span>
      </div>
    )
  }

  // Ei renderöidä mitään jos ei ole kirjautunut (navigate hoitaa ohjauksen)
  if (!user) return null

  return (
    <div className={styles.app}>
      <TopBar
        sessionName={sessionName}
        onSessionNameChange={setSessionName}
        onSignOut={signOut}
        saveStatus={saveStatus}
        onSave={handleManualSave}
      />
      <div className={styles.body}>
        <LeftToolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          toolOptions={toolOptions}
          // Päivitä yksittäinen toolOption-avain muiden säilyessä
          onToolOptionChange={(key, value) => setToolOptions((prev) => ({ ...prev, [key]: value }))}
        />
        <main className={styles.main}>
          <DrillList
            drills={drills}
            activeTool={activeTool}
            toolOptions={toolOptions}
            activeDrillIndex={activeDrillIndex}
            onDrillSelect={setActiveDrillIndex}
            onDrillUpdate={updateDrill}
            onDrillDelete={deleteDrill}
            onAddDrill={addDrill}
          />
        </main>
        <RightSidebar
          drills={drills}
          activeDrillIndex={activeDrillIndex}
          onDrillSelect={setActiveDrillIndex}
          onAddDrill={addDrill}
          onOpenLibrary={() => setLibraryOpen(true)}
        />
      </div>

      {/* Harjoituskirjasto — renderöidään vain kun auki */}
      {libraryOpen && (
        <LibraryPanel
          onClose={() => setLibraryOpen(false)}
          onAddDrill={addDrillFromLibrary}
        />
      )}
    </div>
  )
}
