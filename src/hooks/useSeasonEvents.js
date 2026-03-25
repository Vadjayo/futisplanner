/**
 * useSeasonEvents.js
 * Kalenteri-tapahtumien tilan hallinta — erottaa tapahtumaoperaatiot SeasonCalendar.jsx:stä.
 *
 * Käyttö:
 *   const {
 *     events, loading,
 *     addEvent, addEvents, updateEvent, deleteEvent, deleteFutureRecurring, reload,
 *   } = useSeasonEvents(teamId, userId)
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getEvents,
  addEvent     as apiAddEvent,
  addEvents    as apiAddEvents,
  updateEvent  as apiUpdateEvent,
  deleteEvent  as apiDeleteEvent,
  deleteFutureRecurring as apiDeleteFutureRecurring,
} from '../services/seasonService'

/**
 * @param {string|null} teamId  - Aktiivisen joukkueen UUID
 * @param {string|null} userId  - Kirjautuneen käyttäjän UUID (tarvitaan uusiin tapahtumiin)
 */
export function useSeasonEvents(teamId, userId) {
  const [events,  setEvents]  = useState([])
  const [loading, setLoading] = useState(false)

  // Lataa tapahtumat kun joukkue vaihtuu
  useEffect(() => {
    if (!teamId) { setEvents([]); return }
    setLoading(true)
    getEvents(teamId).then(({ data }) => {
      setEvents(data ?? [])
      setLoading(false)
    })
  }, [teamId])

  /** Lataa tapahtumat uudelleen tietokannasta (kutsutaan muutosten jälkeen) */
  const reload = useCallback(() => {
    if (!teamId) return
    getEvents(teamId).then(({ data }) => setEvents(data ?? []))
  }, [teamId])

  /**
   * Lisää yksi tapahtuma.
   * @param {object} eventData  - camelCase-tapahtumaobjekti
   * @returns {Promise<{ data, error }>}
   */
  const addEvent = useCallback(async (eventData) => {
    const result = await apiAddEvent({ ...eventData, userId, teamId })
    if (!result.error) reload()
    return result
  }, [userId, teamId, reload])

  /**
   * Lisää useita tapahtumia kerralla (pohjagenerointi, toistuvat).
   * @param {Array<object>} events
   * @returns {Promise<{ data, error }>}
   */
  const addEvents = useCallback(async (eventsData) => {
    const rows = eventsData.map((e) => ({ ...e, userId, teamId }))
    const result = await apiAddEvents(rows)
    if (!result.error) reload()
    return result
  }, [userId, teamId, reload])

  /**
   * Päivitä tapahtuman tiedot.
   * @param {string} id
   * @param {object} updates  - snake_case-kentät suoraan tietokantaan
   * @returns {Promise<{ error }>}
   */
  const updateEvent = useCallback(async (id, updates) => {
    const result = await apiUpdateEvent(id, updates)
    if (!result.error) reload()
    return result
  }, [reload])

  /**
   * Poista yksittäinen tapahtuma.
   * @param {string} id
   * @returns {Promise<{ error }>}
   */
  const deleteEvent = useCallback(async (id) => {
    const result = await apiDeleteEvent(id)
    if (!result.error) reload()
    return result
  }, [reload])

  /**
   * Poista kaikki saman toistuvan ryhmän tulevat tapahtumat.
   * @param {string} recurringGroupId
   * @param {string} fromDate  - 'YYYY-MM-DD'
   * @returns {Promise<{ error }>}
   */
  const deleteFutureRecurring = useCallback(async (recurringGroupId, fromDate) => {
    const result = await apiDeleteFutureRecurring(recurringGroupId, fromDate)
    if (!result.error) reload()
    return result
  }, [reload])

  return {
    events,
    loading,
    reload,
    addEvent,
    addEvents,
    updateEvent,
    deleteEvent,
    deleteFutureRecurring,
  }
}
