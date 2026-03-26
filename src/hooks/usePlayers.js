/**
 * usePlayers.js
 * Joukkueen pelaajien hallinta Teams-sivulle.
 */
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import {
  getPlayers,
  createPlayer as createPlayerService,
  updatePlayer as updatePlayerService,
  deletePlayer as deletePlayerService,
} from '../services/playerService'

/**
 * Hallitsee joukkueen pelaajalistaa.
 * @param {string|null} teamId - Valitun joukkueen UUID
 * @returns {{ players, loading, createPlayer, updatePlayer, deletePlayer }}
 */
export function usePlayers(teamId) {
  const { user } = useAuth()
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  // Lataa pelaajat joukkueen vaihtuessa
  useEffect(() => {
    if (!teamId || !user?.id) {
      setPlayers([])
      setLoading(false)
      return
    }
    setLoading(true)
    getPlayers(user.id, teamId).then(({ data }) => {
      setPlayers(data ?? [])
      setLoading(false)
    })
  }, [teamId, user?.id])

  /**
   * Luo uuden pelaajan joukkueeseen.
   * @param {object} formData - Pelaajan tiedot lomakkeelta
   * @returns {Promise<{ data: object|null, error: object|null }>}
   */
  const createPlayer = useCallback(async (formData) => {
    if (!user?.id || !teamId) return { data: null, error: new Error('Ei kirjautunut tai joukkuetta ei valittu') }
    const { data, error } = await createPlayerService({
      userId:             user.id,
      teamId,
      name:               formData.name,
      number:             formData.number             ?? null,
      position:           formData.position           ?? null,
      positionSecondary:  formData.position_secondary ?? null,
      birthYear:          formData.birth_year         ?? null,
      notes:              formData.notes              ?? null,
    })
    if (!error && data) {
      setPlayers((prev) => {
        // Lisää uusi pelaaja ja järjestä pelipaikka → numero
        const next = [...prev, data]
        return next.sort((a, b) => {
          if (a.position < b.position) return -1
          if (a.position > b.position) return 1
          return (a.number ?? 99) - (b.number ?? 99)
        })
      })
    }
    return { data, error }
  }, [user?.id, teamId])

  /**
   * Päivittää pelaajan tiedot.
   * @param {string} playerId
   * @param {object} updates
   * @returns {Promise<{ error: object|null }>}
   */
  const updatePlayer = useCallback(async (playerId, updates) => {
    if (!user?.id) return { error: new Error('Ei kirjautunut') }
    // Muunna camelCase → snake_case palvelulle
    const dbUpdates = {}
    if (updates.name               !== undefined) dbUpdates.name               = updates.name
    if (updates.number             !== undefined) dbUpdates.number             = updates.number
    if (updates.position           !== undefined) dbUpdates.position           = updates.position
    if (updates.position_secondary !== undefined) dbUpdates.position_secondary = updates.position_secondary
    if (updates.birth_year         !== undefined) dbUpdates.birth_year         = updates.birth_year
    if (updates.notes              !== undefined) dbUpdates.notes              = updates.notes
    const { error } = await updatePlayerService(user.id, playerId, dbUpdates)
    if (!error) {
      setPlayers((prev) =>
        prev.map((p) => p.id === playerId ? { ...p, ...dbUpdates } : p)
      )
    }
    return { error }
  }, [user?.id])

  /**
   * Pehmeä poisto: poistaa pelaajan paikallisesta listasta välittömästi.
   * @param {string} playerId
   * @returns {Promise<{ error: object|null }>}
   */
  const deletePlayer = useCallback(async (playerId) => {
    if (!user?.id) return { error: new Error('Ei kirjautunut') }
    const { error } = await deletePlayerService(user.id, playerId)
    if (!error) {
      setPlayers((prev) => prev.filter((p) => p.id !== playerId))
    }
    return { error }
  }, [user?.id])

  return { players, loading, createPlayer, updatePlayer, deletePlayer }
}
