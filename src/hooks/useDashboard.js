/**
 * useDashboard.js
 * Dashboard-näkymän tila: data, lataus ja virheenkäsittely.
 * Kutsuu dashboardService:ä ja tarjoaa reload-funktion.
 *
 * Käyttö:
 *   const { data, loading, error, reload } = useDashboard()
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth }            from './useAuth'
import { getDashboardData }   from '../services/dashboardService'

/**
 * Palauttaa tänään YYYY-MM-DD -muodossa.
 * sv-SE locale palauttaa ISO-muotoisen päivämäärän.
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
  const dow = now.getDay() // 0 = sunnuntai
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
 * @returns {{ data: object|null, loading: boolean, error: object|null, reload: function }}
 */
export function useDashboard() {
  const { user } = useAuth()

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
    )
    if (err) setError(err)
    else     setData(result)
    setLoading(false)
  }, [user?.id])

  useEffect(() => { loadData() }, [loadData])

  return { data, loading, error, reload: loadData }
}
