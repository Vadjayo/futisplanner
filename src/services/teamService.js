/**
 * teamService.js
 * Joukkueiden CRUD-operaatiot Supabasessa.
 */

import { supabase } from './supabase'

/**
 * Hakee kaikki käyttäjän joukkueet luomisjärjestyksessä.
 * @param {string} userId
 * @returns {Promise<{ data: Array|null, error: object|null }>}
 */
export async function getTeams(userId) {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('id, name, age_group, season, level, coaches, player_count, phases, goals, created_at')
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
 * Hakee yksittäisen joukkueen kaikki tiedot.
 * @param {string} userId
 * @param {string} teamId
 * @returns {Promise<{ data: object|null, error: object|null }>}
 */
export async function getTeam(userId, teamId) {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('id, name, age_group, season, level, coaches, player_count, phases, goals')
      .eq('user_id', userId)
      .eq('id', teamId)
      .maybeSingle()
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Joukkueen haku epäonnistui:', error)
    return { data: null, error }
  }
}

/**
 * Luo uuden joukkueen.
 * @param {object} teamData
 * @param {string} teamData.userId
 * @param {string} teamData.name
 * @param {string} [teamData.ageGroup]
 * @param {string} [teamData.season]
 * @param {string} [teamData.level]
 * @param {string} [teamData.coaches]
 * @returns {Promise<{ data: object|null, error: object|null }>}
 */
export async function createTeam(teamData) {
  try {
    const row = {
      user_id:   teamData.userId,
      name:      teamData.name,
      age_group: teamData.ageGroup  ?? null,
      season:    teamData.season    ?? null,
      level:     teamData.level     ?? 'harraste',
      coaches:   teamData.coaches   ?? null,
    }
    const { data, error } = await supabase
      .from('teams')
      .insert(row)
      .select('id, name, age_group, season, level, coaches, player_count, phases, goals, created_at')
      .single()
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Joukkueen luonti epäonnistui:', error)
    return { data: null, error }
  }
}

/**
 * Päivittää joukkueen tiedot. user_id-tarkistus estää muiden tietojen muokkaamisen.
 * @param {string} userId
 * @param {string} teamId
 * @param {object} updates
 * @returns {Promise<{ error: object|null }>}
 */
export async function updateTeam(userId, teamId, updates) {
  try {
    const { error } = await supabase
      .from('teams')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', teamId)
      .eq('user_id', userId)
    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Joukkueen päivitys epäonnistui:', error)
    return { error }
  }
}

/**
 * Poistaa joukkueen pysyvästi (CASCADE poistaa myös pelaajat).
 * @param {string} userId
 * @param {string} teamId
 * @returns {Promise<{ error: object|null }>}
 */
export async function deleteTeam(userId, teamId) {
  try {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId)
      .eq('user_id', userId)
    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Joukkueen poisto epäonnistui:', error)
    return { error }
  }
}
