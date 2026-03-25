/**
 * teamService.js
 * Joukkueiden CRUD-operaatiot Supabasessa.
 * Kaikki funktiot palauttavat { data, error } — error on null onnistuessa.
 */

import { supabase } from './supabase'

/**
 * Lataa kaikki käyttäjän joukkueet luomisjärjestyksessä.
 * @param {string} userId
 * @returns {Promise<{ data: Array|null, error: object|null }>}
 */
export async function getTeams(userId) {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Joukkueiden haku epäonnistui:', error)
    return { data: null, error }
  }
}

/**
 * Luo uusi joukkue käyttäjälle oletusnimelllä "Uusi joukkue".
 * @param {string} userId
 * @returns {Promise<{ data: object|null, error: object|null }>}
 */
export async function createTeam(userId) {
  try {
    const { data, error } = await supabase
      .from('teams')
      .insert({ user_id: userId, name: 'Uusi joukkue' })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Joukkueen luonti epäonnistui:', error)
    return { data: null, error }
  }
}

/**
 * Päivitä joukkueen tiedot.
 * @param {string} teamId
 * @param {object} updates  - Päivitettävät kentät
 * @returns {Promise<{ error: object|null }>}
 */
export async function updateTeam(teamId, updates) {
  try {
    const { error } = await supabase
      .from('teams')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', teamId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Joukkueen päivitys epäonnistui:', error)
    return { error }
  }
}

/**
 * Poista joukkue pysyvästi.
 * RLS varmistaa tietokantatasolla että vain omia joukkueita voi poistaa.
 * @param {string} teamId
 * @returns {Promise<{ error: object|null }>}
 */
export async function deleteTeam(teamId) {
  try {
    const { error } = await supabase.from('teams').delete().eq('id', teamId)
    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Joukkueen poisto epäonnistui:', error)
    return { error }
  }
}
