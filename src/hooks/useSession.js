/**
 * useSession.js
 * Harjoitussessioiden tilan hallinta — erottaa sessio- ja drilllogiikan EditorApp.jsx:stä.
 *
 * Käyttö:
 *   const {
 *     drills, sessionId, sessionName, sessionMeta, saveStatus, appLoading,
 *     setSessionName, setSessionMeta,
 *     addDrill, updateDrill, deleteDrill, duplicateDrill, reorderDrills,
 *     addDrillFromLibrary, saveNow, exportPdf,
 *   } = useSession(userId, routeSessionId, isNew)
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  getRecentSession,
  getSessionById,
  saveSession,
  saveToLibrary,
} from '../services/sessionService'

// ── APUFUNKTIOT ──

/** Luo tyhjä harjoite oletusarvoilla */
export function createDrill() {
  return {
    id:        crypto.randomUUID(),
    title:     '',
    duration:  10,
    fieldType: '11v11',
    elements:  [],
  }
}

/** Muunna tietokannan snake_case-drill sovelluksen camelCase-muotoon */
function dbDrillToApp(d) {
  return {
    id:        d.id,
    title:     d.title,
    duration:  d.duration,
    fieldType: d.field_type,
    elements:  d.elements ?? [],
  }
}

const EMPTY_META = {
  description:    '',
  theme:          '',
  focusTechnical: '',
  focusTactical:  '',
  focusPhysical:  '',
  focusMental:    '',
}

/**
 * @param {string|null} userId          - Kirjautuneen käyttäjän UUID
 * @param {string|null} routeSessionId  - Dashboardilta annettu session-id (tai null)
 * @param {boolean}     isNew           - true = aloita tyhjästä
 */
export function useSession(userId, routeSessionId = null, isNew = false) {
  const [appLoading,   setAppLoading]   = useState(true)
  const [sessionId,    setSessionId]    = useState(() => routeSessionId ?? crypto.randomUUID())
  const [sessionName,  setSessionName]  = useState('')
  const [sessionMeta,  setSessionMeta]  = useState(EMPTY_META)
  const [drills,       setDrills]       = useState([createDrill()])
  const [saveStatus,   setSaveStatus]   = useState('idle') // 'idle'|'saving'|'saved'|'error'

  const autoSaveTimer = useRef(null)
  const isFirstLoad   = useRef(true)

  // ── LATAUS ──

  useEffect(() => {
    if (!userId) {
      setAppLoading(false)
      return
    }

    // Uusi suunnitelma — ei ladata mitään
    if (isNew) {
      setAppLoading(false)
      isFirstLoad.current = false
      return
    }

    const loader = routeSessionId
      ? getSessionById(userId, routeSessionId)
      : getRecentSession(userId)

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
        const sorted = [...(data.drills ?? [])].sort((a, b) => a.position - b.position)
        setDrills(sorted.length > 0 ? sorted.map(dbDrillToApp) : [createDrill()])
      }
      setAppLoading(false)
      isFirstLoad.current = false
    })
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── TALLENNUS ──

  const doSave = useCallback(async (sid, name, drillList, uid, meta) => {
    setSaveStatus('saving')
    const { error } = await saveSession({ id: sid, name, userId: uid, drills: drillList, meta })
    setSaveStatus(error ? 'error' : 'saved')
    if (!error) setTimeout(() => setSaveStatus('idle'), 2500)
  }, [])

  // Auto-tallennus 2 s debounssilla
  useEffect(() => {
    if (isFirstLoad.current || !userId) return
    clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(
      () => doSave(sessionId, sessionName, drills, userId, sessionMeta),
      2000
    )
    return () => clearTimeout(autoSaveTimer.current)
  }, [drills, sessionName, sessionId, sessionMeta, userId, doSave])

  /** Manuaalinen tallennus — peruuttaa vireillä olevan auto-tallennuksen */
  const saveNow = useCallback(() => {
    clearTimeout(autoSaveTimer.current)
    doSave(sessionId, sessionName, drills, userId, sessionMeta)
  }, [sessionId, sessionName, drills, userId, sessionMeta, doSave])

  // ── DRILL-OPERAATIOT ──

  /** Lisää uusi harjoite listan loppuun */
  const addDrill = useCallback(() => {
    const newDrill = createDrill()
    setDrills((prev) => [...prev, newDrill])
    return newDrill
  }, [])

  /** Päivitä yksittäisen harjoitteen kenttiä id:n perusteella */
  const updateDrill = useCallback((id, updates) => {
    setDrills((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)))
  }, [])

  /** Poista harjoite — listassa on aina vähintään yksi */
  const deleteDrill = useCallback((id) => {
    setDrills((prev) => {
      const next = prev.filter((d) => d.id !== id)
      return next.length > 0 ? next : [createDrill()]
    })
  }, [])

  /** Kopioi harjoite välittömästi alkuperäisen jälkeen */
  const duplicateDrill = useCallback((id) => {
    setDrills((prev) => {
      const idx = prev.findIndex((d) => d.id === id)
      if (idx === -1) return prev
      const copy = { ...prev[idx], id: crypto.randomUUID() }
      const next = [...prev]
      next.splice(idx + 1, 0, copy)
      return next
    })
  }, [])

  /** Järjestä harjoitelista uudelleen (from-indeksi → to-indeksi) */
  const reorderDrills = useCallback((from, to) => {
    setDrills((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }, [])

  /** Lisää kirjastosta valittu harjoite kopioimalla */
  const addDrillFromLibrary = useCallback((libraryDrill) => {
    const newDrill = {
      id:        crypto.randomUUID(),
      title:     libraryDrill.title,
      duration:  libraryDrill.duration,
      fieldType: libraryDrill.field_type,
      elements:  libraryDrill.elements ?? [],
    }
    setDrills((prev) => [...prev, newDrill])
    return newDrill
  }, [])

  /** Tallenna harjoite omaan kirjastoon */
  const saveDrillToLibrary = useCallback(async (drill, meta) => {
    const { error } = await saveToLibrary({
      userId:      userId,
      title:       drill.title || 'Nimetön harjoite',
      duration:    drill.duration,
      fieldType:   drill.fieldType,
      elements:    drill.elements,
      category:    meta.category,
      ageGroup:    meta.ageGroup,
      description: meta.description,
    })
    if (error) throw error
  }, [userId])

  /** Vie sessio PDF:ksi (lazy import pdfService) */
  const exportPdf = useCallback(async (drillCardRefs) => {
    const { exportSessionPdf } = await import('../services/pdfService')
    exportSessionPdf(drillCardRefs, drills, sessionName, sessionMeta)
  }, [drills, sessionName, sessionMeta])

  // ── META-APURIT ──

  const updateMeta = useCallback((key, value) => {
    setSessionMeta((prev) => ({ ...prev, [key]: value }))
  }, [])

  return {
    // Tila
    appLoading,
    sessionId,
    sessionName,
    sessionMeta,
    drills,
    saveStatus,
    // Setterit
    setSessionName,
    setSessionMeta,
    updateMeta,
    // Drill-operaatiot
    addDrill,
    updateDrill,
    deleteDrill,
    duplicateDrill,
    reorderDrills,
    addDrillFromLibrary,
    saveDrillToLibrary,
    // Tallennus & vienti
    saveNow,
    exportPdf,
  }
}
