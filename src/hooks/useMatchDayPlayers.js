/**
 * useMatchDayPlayers.js
 * Hakee joukkueen pelaajat pelipäivää varten.
 * Käytetään MatchDayPage:ssä pelaajien automaattiseen esitäyttöön.
 *
 * Käyttö:
 *   const { players, loading } = useMatchDayPlayers(teamId)
 */

import { useState, useEffect } from 'react'
import { useAuth }      from './useAuth'
import { getPlayers }   from '../services/playerService'

/**
 * Hakee joukkueen aktiiviset pelaajat pelipäiväsuunnittelua varten.
 * @param {string|null} teamId - Joukkueen UUID
 * @returns {{ players: Array, loading: boolean }}
 */
export function useMatchDayPlayers(teamId) {
  const { user } = useAuth()
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id || !teamId) {
      setPlayers([])
      setLoading(false)
      return
    }
    setLoading(true)
    getPlayers(user.id, teamId).then(({ data }) => {
      setPlayers(data ?? [])
      setLoading(false)
    })
  }, [user?.id, teamId])

  return { players, loading }
}
