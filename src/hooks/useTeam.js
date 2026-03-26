/**
 * useTeam.js
 * Joukkueen tilan hallinta — erottaa joukkuelogiikan SeasonPage.jsx:stä.
 *
 * Käyttö:
 *   const {
 *     teams, selectedTeam, events, loading, saving, isDirty,
 *     selectTeam, createTeam, updateTeam, deleteTeam,
 *     updateTeamField, reloadEvents,
 *   } = useTeam(userId)
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { getTeams, createTeam, updateTeam, deleteTeam } from '../services/teamService'
import { getEvents } from '../services/seasonService'
import { CONFIG } from '../constants/config'

/**
 * @param {string|null} userId - Kirjautuneen käyttäjän UUID
 */
export function useTeam(userId) {
  const [teams,      setTeams]      = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [team,       setTeam]       = useState(null)
  const [events,     setEvents]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [isDirty,    setIsDirty]    = useState(false)

  const [creatingTeam, setCreatingTeam] = useState(false)

  const saveTimer   = useRef(null)
  const isFirstLoad = useRef(true)

  // ── LATAUS ──

  // Lataa joukkueet käynnistyttyä
  useEffect(() => {
    if (!userId) return
    getTeams(userId).then(({ data }) => {
      const list = data ?? []
      setTeams(list)
      if (list.length > 0) {
        setSelectedId(list[0].id)
        setTeam(list[0])
      }
      setLoading(false)
      isFirstLoad.current = false
    })
  }, [userId])

  // Lataa tapahtumat joukkueen vaihtuessa
  useEffect(() => {
    if (!selectedId) { setEvents([]); return }
    getEvents(selectedId).then(({ data }) => setEvents(data ?? []))
  }, [selectedId])

  // ── AUTO-TALLENNUS ──

  // Tallentaa joukkueen tiedot tietokantaan
  const save = useCallback(async (teamData, teamId) => {
    setSaving(true)
    await updateTeam(userId, teamId, {
      name:         teamData.name,
      age_group:    teamData.age_group,
      level:        teamData.level,
      season:       teamData.season,
      coaches:      teamData.coaches,
      player_count: teamData.player_count,
      phases:       teamData.phases,
      goals:        teamData.goals,
    })
    setSaving(false)
    setIsDirty(false)
    // Päivitä joukkuelistaan uusi nimi/kausi
    setTeams((prev) =>
      prev.map((t) => t.id === teamId ? { ...t, name: teamData.name, season: teamData.season } : t)
    )
  }, [userId])

  // Debounce-tallennus kun team-tila muuttuu
  useEffect(() => {
    if (isFirstLoad.current || !team || !selectedId) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(
      () => save(team, selectedId),
      CONFIG.SESSION_AUTOSAVE_INTERVAL > 5000
        ? 1000                              // käytä 1 s kausisuunnittelussa
        : CONFIG.SESSION_AUTOSAVE_INTERVAL
    )
    return () => clearTimeout(saveTimer.current)
  }, [team, selectedId, save])

  // ── TOIMINNOT ──

  /** Päivitä yksittäinen kenttä paikalliseen tilaan (auto-tallennus käynnistyy) */
  const updateTeamField = useCallback((field, value) => {
    setTeam((prev) => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }, [])

  /** Tallenna välittömästi (kelluva Tallenna-painike) */
  const saveNow = useCallback(async () => {
    if (!team || !selectedId || saving) return
    clearTimeout(saveTimer.current)
    await save(team, selectedId)
  }, [team, selectedId, saving, save])

  /** Vaihda aktiivinen joukkue */
  const selectTeam = useCallback((t) => {
    isFirstLoad.current = true
    setSelectedId(t.id)
    setTeam(t)
    setIsDirty(false)
    setTimeout(() => { isFirstLoad.current = false }, 100)
  }, [])

  /** Luo uusi joukkue — guard estää kaksoisklikkauksen */
  const handleCreateTeam = useCallback(async () => {
    if (creatingTeam || !userId) return
    setCreatingTeam(true)
    const { data } = await createTeam({ userId, name: 'Uusi joukkue' })
    setCreatingTeam(false)
    if (!data) return
    isFirstLoad.current = false
    setTeams((prev) => [...prev, data])
    setSelectedId(data.id)
    setTeam(data)
  }, [creatingTeam, userId])

  /** Poista joukkue */
  const handleDeleteTeam = useCallback(async (teamId) => {
    await deleteTeam(userId, teamId)
    const next = teams.filter((t) => t.id !== teamId)
    setTeams(next)
    if (selectedId === teamId) {
      const first = next[0] ?? null
      setSelectedId(first?.id ?? null)
      setTeam(first)
    }
  }, [teams, selectedId, userId])

  /** Lataa tapahtumat uudelleen tietokannasta */
  const reloadEvents = useCallback(() => {
    if (!selectedId) return
    getEvents(selectedId).then(({ data }) => setEvents(data ?? []))
  }, [selectedId])

  return {
    // Tila
    teams,
    selectedTeam: team,
    selectedId,
    events,
    loading,
    saving,
    isDirty,
    // Toiminnot
    selectTeam,
    createTeam:   handleCreateTeam,
    deleteTeam:   handleDeleteTeam,
    updateTeamField,
    saveNow,
    reloadEvents,
  }
}
