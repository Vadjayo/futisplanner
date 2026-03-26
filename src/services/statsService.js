/**
 * statsService.js
 * Joukkueen kausitilaston Supabase-kyselyt.
 * Palauttaa menneiden treenien ja ottelujen lukumäärän sekä viimeisimmät ottelut.
 */

import { supabase } from './supabase'

/**
 * Hakee joukkueen kauden tilastot.
 * @param {string} userId  - Kirjautuneen käyttäjän UUID
 * @param {string} teamId  - Joukkueen UUID
 * @param {string} today   - Tänään 'YYYY-MM-DD' — tätä päivää vanhemmat lasketaan mukaan
 * @returns {Promise<{ data: { drillCount: number, gameCount: number, recentMatches: Array }|null, error: object|null }>}
 */
export async function getSeasonStats(userId, teamId, today) {
  try {
    const [drillRes, gameRes, matchesRes] = await Promise.all([
      // Menneiden treenien määrä
      supabase
        .from('season_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('team_id', teamId)
        .eq('type', 'drill')
        .lt('date', today),

      // Menneiden ottelujen määrä
      supabase
        .from('season_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('team_id', teamId)
        .eq('type', 'game')
        .lt('date', today),

      // Viimeksi pelatut ottelut (pelipäiväsuunnitelmista)
      supabase
        .from('match_plans')
        .select('id, opponent, match_date, result_home, result_away')
        .eq('user_id', userId)
        .eq('team_id', teamId)
        .order('match_date', { ascending: false })
        .limit(5),
    ])

    return {
      data: {
        drillCount:    drillRes.count  ?? 0,
        gameCount:     gameRes.count   ?? 0,
        recentMatches: matchesRes.data ?? [],
      },
      error: null,
    }
  } catch (error) {
    console.error('Tilastojen haku epäonnistui:', error)
    return { data: null, error }
  }
}
