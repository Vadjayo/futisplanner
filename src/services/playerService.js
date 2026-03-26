/**
 * playerService.js
 * Pelaajien CRUD-operaatiot Supabasessa.
 */
import { supabase } from './supabase'

/**
 * Hakee joukkueen aktiiviset pelaajat. Järjestys: pelipaikka → numero.
 * @param {string} userId
 * @param {string} teamId
 * @returns {Promise<{ data: Array|null, error: object|null }>}
 */
export async function getPlayers(userId, teamId) {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('id, name, number, position, position_secondary, birth_year, notes, is_active')
      .eq('user_id', userId)
      .eq('team_id', teamId)
      .eq('is_active', true)
      .order('position')
      .order('number', { nullsFirst: false })
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Pelaajien haku epäonnistui:', error)
    return { data: null, error }
  }
}

/**
 * Luo uuden pelaajan.
 * @param {object} playerData
 * @param {string} playerData.userId
 * @param {string} playerData.teamId
 * @param {string} playerData.name
 * @param {number} [playerData.number]
 * @param {string} [playerData.position]
 * @param {string} [playerData.positionSecondary]
 * @param {number} [playerData.birthYear]
 * @param {string} [playerData.notes]
 * @returns {Promise<{ data: object|null, error: object|null }>}
 */
export async function createPlayer(playerData) {
  try {
    const row = {
      user_id:            playerData.userId,
      team_id:            playerData.teamId,
      name:               playerData.name,
      number:             playerData.number             ?? null,
      position:           playerData.position           ?? null,
      position_secondary: playerData.positionSecondary  ?? null,
      birth_year:         playerData.birthYear          ?? null,
      notes:              playerData.notes              ?? null,
    }
    const { data, error } = await supabase
      .from('players')
      .insert(row)
      .select('id, name, number, position, position_secondary, birth_year, notes, is_active')
      .single()
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Pelaajan luonti epäonnistui:', error)
    return { data: null, error }
  }
}

/**
 * Päivittää pelaajan tiedot.
 * @param {string} userId
 * @param {string} playerId
 * @param {object} updates
 * @returns {Promise<{ error: object|null }>}
 */
export async function updatePlayer(userId, playerId, updates) {
  try {
    const { error } = await supabase
      .from('players')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', playerId)
      .eq('user_id', userId)
    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Pelaajan päivitys epäonnistui:', error)
    return { error }
  }
}

/**
 * Pehmeä poisto: merkitsee pelaajan ei-aktiiviseksi.
 * @param {string} userId
 * @param {string} playerId
 * @returns {Promise<{ error: object|null }>}
 */
export async function deletePlayer(userId, playerId) {
  try {
    const { error } = await supabase
      .from('players')
      .update({ is_active: false })
      .eq('id', playerId)
      .eq('user_id', userId)
    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Pelaajan poisto epäonnistui:', error)
    return { error }
  }
}
