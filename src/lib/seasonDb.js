/**
 * seasonDb.js
 * Tietokantafunktiot kausisuunnittelulle — joukkueet ja kalenteri-tapahtumat.
 * Kaikki funktiot palauttavat Supabasen promise-olion suoraan ({data, error}).
 */

import { supabase } from './supabase'

// ── JOUKKUEET ──

/**
 * Lataa kaikki käyttäjän joukkueet luomisjärjestyksessä.
 * @param {string} userId - Supabase-käyttäjän UUID
 */
export function loadTeams(userId) {
  return supabase
    .from('teams')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
}

/**
 * Luo uusi joukkue käyttäjälle oletusnimelllä "Uusi joukkue".
 * @param {string} userId - Supabase-käyttäjän UUID
 */
export function createTeam(userId) {
  return supabase
    .from('teams')
    .insert({ user_id: userId, name: 'Uusi joukkue' })
    .select()
    .single()
}

/**
 * Päivitä joukkueen tiedot.
 * @param {string} teamId - Päivitettävän joukkueen UUID
 * @param {object} updates - Päivitettävät kentät
 */
export function updateTeam(teamId, updates) {
  return supabase
    .from('teams')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', teamId)
}

/**
 * Poista joukkue pysyvästi (RLS varmistaa omistajuuden).
 * @param {string} teamId - Poistettavan joukkueen UUID
 */
export function deleteTeam(teamId) {
  return supabase.from('teams').delete().eq('id', teamId)
}

// ── KAUSI-TAPAHTUMAT ──

/**
 * Lataa joukkueen kaikki tapahtumat päivämäärän mukaan nousevassa järjestyksessä.
 * @param {string} teamId - Joukkueen UUID
 */
export function loadEvents(teamId) {
  return supabase
    .from('season_events')
    .select('*')
    .eq('team_id', teamId)
    .order('date', { ascending: true })
}

/**
 * Lisää yksi tapahtuma tietokantaan.
 * @param {object} event - Tapahtuman tiedot (user_id, team_id, title, type, date jne.)
 */
export function addEvent(event) {
  return supabase
    .from('season_events')
    .insert({
      user_id:             event.userId,
      team_id:             event.teamId,
      title:               event.title,
      type:                event.type,
      date:                event.date,
      time:                event.time || null,
      duration:            event.duration || null,
      theme:               event.theme || null,
      is_recurring:        event.isRecurring || false,
      recurring_until:     event.recurringUntil || null,
      recurring_group_id:  event.recurringGroupId || null,
    })
    .select()
    .single()
}

/**
 * Päivitä tapahtuman tiedot.
 * @param {string} id - Tapahtuman UUID
 * @param {object} updates - Päivitettävät kentät
 */
export function updateEvent(id, updates) {
  return supabase
    .from('season_events')
    .update(updates)
    .eq('id', id)
}

/**
 * Poista yksittäinen tapahtuma.
 * @param {string} id - Poistettavan tapahtuman UUID
 * @param {string} userId - Käyttäjän UUID (turvasuodatin)
 */
export function deleteEvent(id, userId) {
  return supabase.from('season_events').delete().eq('id', id).eq('user_id', userId)
}

/**
 * Poista kaikki saman toistuvan ryhmän tulevat tapahtumat (mukaan lukien tämä päivä).
 * @param {string} recurringGroupId - Toistuvan ryhmän UUID
 * @param {string} fromDate - Alkupäivämäärä 'YYYY-MM-DD', poistetaan tästä eteenpäin
 * @param {string} userId - Käyttäjän UUID (turvasuodatin)
 */
export function deleteFutureRecurring(recurringGroupId, fromDate, userId) {
  return supabase
    .from('season_events')
    .delete()
    .eq('recurring_group_id', recurringGroupId)
    .gte('date', fromDate)
    .eq('user_id', userId)
}

/**
 * Lisää useita tapahtumia kerralla (toistuvat tapahtumat).
 * @param {Array<object>} events - Taulukko tapahtumaobjekteja
 */
export function addEvents(events) {
  const rows = events.map((event) => ({
    user_id:             event.userId,
    team_id:             event.teamId,
    title:               event.title,
    type:                event.type,
    date:                event.date,
    time:                event.time || null,
    duration:            event.duration || null,
    theme:               event.theme || null,
    is_recurring:        event.isRecurring || false,
    recurring_until:     event.recurringUntil || null,
    recurring_group_id:  event.recurringGroupId || null,
  }))
  return supabase.from('season_events').insert(rows).select()
}
