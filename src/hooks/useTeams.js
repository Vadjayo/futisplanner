/**
 * useTeams.js
 * Joukkueiden listauksen ja valinnan hallinta Teams-sivulle.
 */
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { getTeams, createTeam, updateTeam, deleteTeam } from '../services/teamService'

/**
 * Hallitsee joukkueiden listaa ja valintaa Teams-sivulla.
 * @returns {{ teams, selectedTeam, selectedId, loading, error, selectTeam, createTeam, updateTeam, deleteTeam }}
 */
export function useTeams() {
  const { user } = useAuth()
  const [teams,      setTeams]      = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)

  // Lataa joukkueet käyttäjän vaihtuessa
  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    setError(null)
    getTeams(user.id).then(({ data, error: err }) => {
      if (err) {
        setError(err)
      } else {
        const list = data ?? []
        setTeams(list)
        // Valitse ensimmäinen joukkue automaattisesti
        if (list.length > 0 && !selectedId) {
          setSelectedId(list[0].id)
        }
      }
      setLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const selectedTeam = teams.find((t) => t.id === selectedId) ?? null

  /**
   * Luo uusi joukkue lomakkeen tiedoilla.
   * @param {object} formData
   * @returns {Promise<{ data: object|null, error: object|null }>}
   */
  const handleCreateTeam = useCallback(async (formData) => {
    if (!user?.id) return { data: null, error: new Error('Ei kirjautunut') }
    const { data, error } = await createTeam({ userId: user.id, ...formData })
    if (!error && data) {
      setTeams((prev) => [...prev, data])
      setSelectedId(data.id)
    }
    return { data, error }
  }, [user?.id])

  /**
   * Päivittää joukkueen tiedot.
   * @param {string} teamId
   * @param {object} updates
   * @returns {Promise<{ error: object|null }>}
   */
  const handleUpdateTeam = useCallback(async (teamId, updates) => {
    if (!user?.id) return { error: new Error('Ei kirjautunut') }
    const { error } = await updateTeam(user.id, teamId, updates)
    if (!error) {
      setTeams((prev) =>
        prev.map((t) => t.id === teamId ? { ...t, ...updates } : t)
      )
    }
    return { error }
  }, [user?.id])

  /**
   * Poistaa joukkueen. Kutsutaan vahvistuksen jälkeen.
   * @param {string} teamId
   * @returns {Promise<{ error: object|null }>}
   */
  const handleDeleteTeam = useCallback(async (teamId) => {
    if (!user?.id) return { error: new Error('Ei kirjautunut') }
    const { error } = await deleteTeam(user.id, teamId)
    if (!error) {
      const next = teams.filter((t) => t.id !== teamId)
      setTeams(next)
      // Tyhjennä valinta jos poistettiin valittu joukkue
      if (selectedId === teamId) {
        setSelectedId(next[0]?.id ?? null)
      }
    }
    return { error }
  }, [user?.id, teams, selectedId])

  return {
    teams,
    selectedTeam,
    selectedId,
    loading,
    error,
    selectTeam:   setSelectedId,
    createTeam:   handleCreateTeam,
    updateTeam:   handleUpdateTeam,
    deleteTeam:   handleDeleteTeam,
  }
}
