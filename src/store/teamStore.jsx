/**
 * teamStore.js
 * Globaali joukkueen tila — jaetaan kaikille sivuille React Contextilla.
 * Tallentaa aktiivisen joukkueen localStorageen jotta valinta
 * säilyy sivulatauksen yli.
 *
 * Käyttö:
 *   const { currentTeam, teams, switchTeam } = useCurrentTeam()
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { useAuth }  from '../hooks/useAuth'
import { getTeams } from '../services/teamService'

const TeamContext = createContext(null)

/**
 * Tarjoaa globaalin joukkuetilan koko sovellukselle.
 * Lisää App.jsx:ään Routes-elementin ympärille.
 */
export function TeamProvider({ children }) {
  const { user } = useAuth()
  const [teams,       setTeams]       = useState([])
  const [currentTeam, setCurrentTeam] = useState(null)
  const [loading,     setLoading]     = useState(true)

  /** Lataa joukkueet ja palauttaa localStorageen tallennetun valinnan. */
  const loadTeams = useCallback(async () => {
    if (!user?.id) return
    const { data, error } = await getTeams(user.id)
    if (error) { setLoading(false); return }

    const list = data ?? []
    setTeams(list)

    // Palauta tallennettu joukkue localStoragesta
    const savedId  = localStorage.getItem('activeTeamId')
    const restored = list.find((t) => t.id === savedId)

    // Käytä tallennettua tai ensimmäistä joukkuetta
    setCurrentTeam(restored ?? list[0] ?? null)
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) { setLoading(false); return }
    loadTeams()
  }, [user?.id, loadTeams])

  /**
   * Vaihda aktiivinen joukkue — tallentuu localStorageen.
   * @param {object} team - Joukkueobjekti
   */
  const switchTeam = useCallback((team) => {
    setCurrentTeam(team)
    if (team?.id) localStorage.setItem('activeTeamId', team.id)
  }, [])

  return (
    <TeamContext.Provider value={{ teams, currentTeam, loading, switchTeam, reloadTeams: loadTeams }}>
      {children}
    </TeamContext.Provider>
  )
}

/**
 * Hook aktiivisen joukkueen käyttöön kaikissa komponenteissa.
 * Vaatii TeamProvider-komponentin ylempänä puussa.
 * @returns {{ teams: Array, currentTeam: object|null, loading: boolean, switchTeam: function, reloadTeams: function }}
 */
export function useCurrentTeam() {
  const ctx = useContext(TeamContext)
  if (!ctx) throw new Error('useCurrentTeam vaatii TeamProvider-komponentin')
  return ctx
}
