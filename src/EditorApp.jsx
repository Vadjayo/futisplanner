/**
 * EditorApp.jsx
 * Editorin pääkomponentti. Hallitsee sessiotilan, automaattitallennuksen ja komponenttien koordinoinnin.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './lib/i18n'
import { useAuth } from './hooks/useAuth'
import { ROUTES } from './constants/routes'
import { loadRecentSession, loadSessionById, saveSession, saveToLibrary } from './lib/db'
import { convertAIElements } from './utils/aiElementConverter'
import TopBar from './components/layout/TopBar'
import LeftToolbar from './components/layout/LeftToolbar'
import RightSidebar from './components/layout/RightSidebar'
import DrillList from './components/editor/DrillList'
import LibraryPanel from './components/library/LibraryPanel'
import AIAssistantPanel from './components/editor/AIAssistantPanel'
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
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  // Spacebar → valintakalu, ? → näppäinohjeet
  useEffect(() => {
    function handleKeyDown(e) {
      const inInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA'
      if (e.code === 'Space' && !inInput) {
        e.preventDefault()
        setActiveTool('select')
      }
      if (e.key === '?' && !inInput) {
        setShortcutsOpen((v) => !v)
      }
      if (e.key === 'Escape') {
        setShortcutsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // toolOptions = aktiivisen työkalun asetukset (väri, tiimi, nuolityyppi jne.)
  const [toolOptions, setToolOptions] = useState({
    coneColor: 'orange',
    poleColor: 'yellow',
    playerTeam: 'blue',
    playerShape: 'att',
    arrowType: 'syotto',
    drawColor: 'white',
    playerDisplayMode: 'number',
  })

  const [drills, setDrills] = useState([createDrill()])
  const [activeDrillIndex, setActiveDrillIndex] = useState(0)
  const [sessionMeta, setSessionMeta] = useState({
    description: '', theme: '',
    focusTechnical: '', focusTactical: '', focusPhysical: '', focusMental: '',
  })

  // saveStatus kertoo automaattitallenuksen tilan UI:lle
  const [saveStatus, setSaveStatus] = useState('idle') // 'idle' | 'saving' | 'saved' | 'error'
  const [libraryOpen, setLibraryOpen] = useState(false)

  const autoSaveTimer = useRef(null)
  // DrillCard-refit indeksoituna — käytetään PDF-vientiin
  const drillRefs = useRef([])

  // isFirstLoad estää auto-tallennuksen käynnistymisen heti latauksen jälkeen
  const isFirstLoad = useRef(true)

  // Ohjaa kirjautumissivulle jos ei ole kirjautunut (auth tarkistettu)
  useEffect(() => {
    if (!loading && !user) navigate(ROUTES.LOGIN, { replace: true })
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
        setSessionMeta({
          description:    data.description    ?? '',
          theme:          data.theme          ?? '',
          focusTechnical: data.focus_technical ?? '',
          focusTactical:  data.focus_tactical  ?? '',
          focusPhysical:  data.focus_physical  ?? '',
          focusMental:    data.focus_mental    ?? '',
        })
        // Järjestä harjoitteet position-kentän mukaan
        const sorted = [...(data.drills ?? [])].sort((a, b) => a.position - b.position)
        setDrills(sorted.length > 0 ? sorted.map(dbDrillToApp) : [createDrill()])
      }
      setAppLoading(false)
      isFirstLoad.current = false
    })
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  // Tallenna harjoitus — asettaa saveStatus-tilan UI-palautetta varten
  const doSave = useCallback(async (sid, name, drilList, uid, meta) => {
    setSaveStatus('saving')
    const { error } = await saveSession({ id: sid, name, userId: uid, drills: drilList, meta })
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
      doSave(sessionId, sessionName, drills, user.id, sessionMeta)
    }, 2000)
    return () => clearTimeout(autoSaveTimer.current)
  }, [drills, sessionName, sessionId, sessionMeta, user, doSave])

  // Manuaalinen tallennus — peruuttaa vireillä olevan auto-tallennuksen
  function handleManualSave() {
    clearTimeout(autoSaveTimer.current)
    doSave(sessionId, sessionName, drills, user.id, sessionMeta)
  }

  // Vie harjoitussuunnitelma PDF:ksi — ladataan jsPDF vasta tarvittaessa (lazy)
  async function handleExportPdf() {
    const { exportSessionPdf } = await import('./lib/exportPdf')
    exportSessionPdf(drillRefs.current, drills, sessionName, sessionMeta)
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

  // Lisää mallipohjapelaajat aktiiviseen harjoitteeseen
  function handleAddTemplate(players) {
    const activeDrill = drills[activeDrillIndex]
    if (!activeDrill) return
    const newPlayers = players.map((p) => ({ ...p, id: crypto.randomUUID() }))
    updateDrill(activeDrill.id, { elements: [...activeDrill.elements, ...newPlayers] })
  }

  // Lisää AI:n generoimat elementit aktiiviseen harjoitteeseen
  const handleAIElements = useCallback((aiElements) => {
    const activeDrill = drills[activeDrillIndex]
    if (!activeDrill) return
    const converted = convertAIElements(aiElements)
    updateDrill(activeDrill.id, { elements: [...activeDrill.elements, ...converted] })
  }, [drills, activeDrillIndex])

  // Päivitä yksittäisen harjoitteen kenttiä id:n perusteella
  function updateDrill(id, updates) {
    setDrills((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)))
  }

  // Tallenna harjoite omaan kirjastoon — palauttaa virheen jos epäonnistuu
  async function handleSaveToLibrary(drill, meta) {
    const { error } = await saveToLibrary({
      userId: user.id,
      title: drill.title || 'Nimetön harjoite',
      duration: drill.duration,
      fieldType: drill.fieldType,
      elements: drill.elements,
      category: meta.category,
      ageGroup: meta.ageGroup,
      description: meta.description,
    })
    if (error) {
      console.error('Kirjastoon tallennus epäonnistui:', error)
      throw error
    }
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

  // Kopioi harjoite — lisää identtinen kopio välittömästi alkuperäisen jälkeen
  function duplicateDrill(id) {
    setDrills((prev) => {
      const idx = prev.findIndex((d) => d.id === id)
      if (idx === -1) return prev
      const copy = { ...prev[idx], id: crypto.randomUUID() }
      const next = [...prev]
      next.splice(idx + 1, 0, copy)
      return next
    })
    setActiveDrillIndex((prev) => prev + 1)
  }

  // Järjestä harjoitelista uudelleen vetämällä (from → to)
  function reorderDrills(from, to) {
    setDrills((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
    setActiveDrillIndex(to)
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
        onExportPdf={handleExportPdf}
      />
      <div className={styles.body}>
        <LeftToolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          toolOptions={toolOptions}
          onToolOptionChange={(key, value) => setToolOptions((prev) => ({ ...prev, [key]: value }))}
          onAddTemplate={handleAddTemplate}
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
            onToolChange={setActiveTool}
            onSaveToLibrary={handleSaveToLibrary}
            onDuplicateDrill={duplicateDrill}
            getCardRef={(i, el) => { drillRefs.current[i] = el }}
          />
        </main>
        <RightSidebar
          drills={drills}
          activeDrillIndex={activeDrillIndex}
          onDrillSelect={setActiveDrillIndex}
          onReorderDrill={reorderDrills}
          onAddDrill={addDrill}
          onOpenLibrary={() => setLibraryOpen(true)}
          sessionMeta={sessionMeta}
          onSessionMetaChange={(key, val) => setSessionMeta((prev) => ({ ...prev, [key]: val }))}
          aiPanel={<AIAssistantPanel onElementsGenerated={handleAIElements} isPro={true} />}
        />
      </div>

      {/* Harjoituskirjasto — renderöidään vain kun auki */}
      {libraryOpen && (
        <LibraryPanel
          userId={user.id}
          onClose={() => setLibraryOpen(false)}
          onAddDrill={addDrillFromLibrary}
        />
      )}

      {/* Näppäinohjeet — ? avaa, Esc sulkee */}
      {shortcutsOpen && (
        <div style={overlayStyle} onClick={() => setShortcutsOpen(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Näppäinohjeet</span>
              <button onClick={() => setShortcutsOpen(false)} style={closeBtnStyle}>✕</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {SHORTCUTS.map(({ key, desc }) => (
                  <tr key={key}>
                    <td style={tdKeyStyle}><kbd style={kbdStyle}>{key}</kbd></td>
                    <td style={tdDescStyle}>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

const SHORTCUTS = [
  { key: 'Välilyönti',   desc: 'Valintatyökalu' },
  { key: 'Ctrl+Z',       desc: 'Kumoa' },
  { key: 'Ctrl+Y',       desc: 'Tee uudelleen' },
  { key: 'Ctrl+C',       desc: 'Kopioi valitut' },
  { key: 'Ctrl+V',       desc: 'Liitä' },
  { key: 'Ctrl+D',       desc: 'Monista valitut' },
  { key: 'Delete',       desc: 'Poista valitut' },
  { key: '?',            desc: 'Näppäinohjeet' },
  { key: 'Esc',          desc: 'Sulje dialogi' },
]

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
  zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center',
}
const modalStyle = {
  background: '#1a2535', border: '1px solid #2d3f55', borderRadius: 10,
  padding: '20px 24px', width: 340, boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
}
const modalHeaderStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
}
const closeBtnStyle = {
  background: 'none', border: 'none', color: '#3d5068', fontSize: 16,
  cursor: 'pointer', padding: '2px 6px', borderRadius: 4,
}
const tdKeyStyle = { padding: '5px 12px 5px 0', width: 130, verticalAlign: 'middle' }
const tdDescStyle = { padding: '5px 0', color: '#8a9bb0', fontSize: 13 }
const kbdStyle = {
  display: 'inline-block', background: '#0f1923', border: '1px solid #3d5068',
  borderRadius: 4, padding: '2px 7px', fontSize: 12, fontFamily: 'monospace',
  color: '#d0dce8', letterSpacing: '0.02em',
}
