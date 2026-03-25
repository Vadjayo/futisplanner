/**
 * seasonService.js
 * Kausisuunnittelun tapahtumien CRUD-operaatiot Supabasessa.
 * Kaikki funktiot palauttavat { data, error } — error on null onnistuessa.
 */

import { supabase } from './supabase'

// ── APUFUNKTIO ──

/**
 * Muuntaa camelCase-tapahtumaobjektin tietokannan snake_case-muotoon.
 * @param {object} event
 * @returns {object}
 */
function toRow(event) {
  return {
    user_id:            event.userId,
    team_id:            event.teamId,
    title:              event.title,
    type:               event.type,
    date:               event.date,
    time:               event.time               || null,
    duration:           event.duration           || null,
    theme:              event.theme              || null,
    is_recurring:       event.isRecurring        || false,
    recurring_until:    event.recurringUntil     || null,
    recurring_group_id: event.recurringGroupId   || null,
  }
}

// ── TAPAHTUMAT ──

/**
 * Lataa joukkueen kaikki tapahtumat päivämäärän mukaan nousevassa järjestyksessä.
 * @param {string} teamId
 * @returns {Promise<{ data: Array|null, error: object|null }>}
 */
export async function getEvents(teamId) {
  try {
    const { data, error } = await supabase
      .from('season_events')
      .select('*')
      .eq('team_id', teamId)
      .order('date', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Tapahtumien haku epäonnistui:', error)
    return { data: null, error }
  }
}

/**
 * Lisää yksi tapahtuma tietokantaan.
 * @param {object} event
 * @returns {Promise<{ data: object|null, error: object|null }>}
 */
export async function addEvent(event) {
  try {
    const { data, error } = await supabase
      .from('season_events')
      .insert(toRow(event))
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Tapahtuman lisäys epäonnistui:', error)
    return { data: null, error }
  }
}

/**
 * Lisää useita tapahtumia kerralla (toistuvat tapahtumat tai pohjagenerointi).
 * @param {Array<object>} events
 * @returns {Promise<{ data: Array|null, error: object|null }>}
 */
export async function addEvents(events) {
  try {
    const { data, error } = await supabase
      .from('season_events')
      .insert(events.map(toRow))
      .select()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Tapahtumien lisäys epäonnistui:', error)
    return { data: null, error }
  }
}

/**
 * Päivitä tapahtuman tiedot.
 * @param {string} id
 * @param {object} updates  - Suoraan tietokannan kentät (snake_case)
 * @returns {Promise<{ error: object|null }>}
 */
export async function updateEvent(id, updates) {
  try {
    const { error } = await supabase
      .from('season_events')
      .update(updates)
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Tapahtuman päivitys epäonnistui:', error)
    return { error }
  }
}

/**
 * Poista yksittäinen tapahtuma.
 * @param {string} id
 * @returns {Promise<{ error: object|null }>}
 */
export async function deleteEvent(id) {
  try {
    const { error } = await supabase.from('season_events').delete().eq('id', id)
    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Tapahtuman poisto epäonnistui:', error)
    return { error }
  }
}

/**
 * Poista kaikki saman toistuvan ryhmän tulevat tapahtumat (alkaen fromDate).
 * @param {string} recurringGroupId
 * @param {string} fromDate  - 'YYYY-MM-DD'
 * @returns {Promise<{ error: object|null }>}
 */
export async function deleteFutureRecurring(recurringGroupId, fromDate) {
  try {
    const { error } = await supabase
      .from('season_events')
      .delete()
      .eq('recurring_group_id', recurringGroupId)
      .gte('date', fromDate)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Toistuvien tapahtumien poisto epäonnistui:', error)
    return { error }
  }
}
