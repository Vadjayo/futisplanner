/**
 * seasonDb.js
 * Tietokantafunktiot kausisuunnittelulle — joukkueet ja kalenteritapahtumat.
 * Kaikki funktiot palauttavat Supabasen promise-olion suoraan ({data, error}).
 */

import { supabase } from './supabase'

// ── JOUKKUEET ──

/**
 * Lataa kaikki käyttäjän joukkueet luomisjärjestyksessä.
 * @param {string} userId - Supabase-käyttäjän UUID
 * @returns {Promise<{data: Array|null, error: object|null}>}
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
 * @returns {Promise<{data: object|null, error: object|null}>}
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
 * @param {object} updates - Päivitettävät kentät (esim. { name: 'FC Esimerkki' })
 * @returns {Promise<{data: object|null, error: object|null}>}
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
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export function deleteTeam(teamId) {
  return supabase.from('teams').delete().eq('id', teamId)
}

// ── KALENTERITAPAHTUMAT ──

/**
 * Lataa joukkueen kalenteritapahtumat päivämäärän mukaan nousevassa järjestyksessä.
 * @param {string} teamId - Joukkueen UUID
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export function loadEvents(teamId) {
  return supabase
    .from('calendar_events')
    .select('*')
    .eq('team_id', teamId)
    .order('date', { ascending: true })
}

/**
 * Lisää uusi kalenteritapahtuma joukkueelle.
 * @param {string} teamId - Joukkueen UUID
 * @param {object} event - Tapahtuman tiedot (date, type, title jne.)
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export function addEvent(teamId, event) {
  return supabase
    .from('calendar_events')
    .insert({ team_id: teamId, ...event })
    .select()
    .single()
}

/**
 * Poista yksittäinen kalenteritapahtuma.
 * @param {string} eventId - Poistettavan tapahtuman UUID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export function deleteEvent(eventId) {
  return supabase.from('calendar_events').delete().eq('id', eventId)
}
