/**
 * useDashboard.js
 * Dashboard-näkymän tila: data, lataus ja virheenkäsittely.
 * Kutsuu dashboardService:ä aktiivisen joukkueen mukaan suodatettuna.
 *
 * Käyttö:
 *   const { data, loading, error, reload } = useDashboard()
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth }           from './useAuth'
import { useCurrentTeam }    from '../store/teamStore'
import { getDashboardData }  from '../services/dashboardService'

/**
 * Palauttaa tänään YYYY-MM-DD -muodossa.
 * @returns {string}
 */
function todayStr() {
  return new Date().toLocaleDateString('sv-SE')
}

/**
 * Laskee kuluvan viikon maanantain ja sunnuntain YYYY-MM-DD.
 * @returns {{ start: string, end: string }}
 */
function getWeekRange() {
  const now = new Date()
  const dow = now.getDay()
  const mon = new Date(now)
  mon.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1))
  mon.setHours(0, 0, 0, 0)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  return {
    start: mon.toLocaleDateString('sv-SE'),
    end:   sun.toLocaleDateString('sv-SE'),
  }
}

/**
 * Hakee ja hallinnoi dashboard-datan tilan.
 * Hakee aina aktiivisen joukkueen tapahtumat.
 * @returns {{ data: object|null, loading: boolean, error: object|null, reload: function }}
 */
export function useDashboard() {
  const { user }        = useAuth()
  const { currentTeam, loading: teamLoading } = useCurrentTeam()

  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const loadData = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    setError(null)
    const { data: result, error: err } = await getDashboardData(
      user.id,
      todayStr(),
      getWeekRange(),
      currentTeam?.id ?? null,
    )
    if (err) setError(err)
    else     setData(result)
    setLoading(false)
  }, [user?.id, currentTeam?.id])

  // Lataa data kun käyttäjä tai aktiivinen joukkue vaihtuu
  useEffect(() => {
    if (teamLoading) return  // Odota kunnes joukkue on ladattu
    loadData()
  }, [loadData, teamLoading])

  return { data, loading, error, reload: loadData }
}
