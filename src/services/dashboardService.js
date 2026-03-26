/**
 * dashboardService.js
 * Dashboard-näkymän Supabase-kyselyt.
 * Hakee kaiken datan rinnakkain Promise.all:lla.
 * Palauttaa { data, error } — error on null onnistuessa.
 */

import { supabase } from './supabase'

/**
 * Hakee kaiken dashboard-datan rinnakkain.
 *
 * @param {string} userId  - Kirjautuneen käyttäjän UUID
 * @param {string} today   - Tänään 'YYYY-MM-DD'
 * @param {{ start: string, end: string }} week - Viikon alku ja loppu
 * @returns {Promise<{ data: object|null, error: object|null }>}
 */
export async function getDashboardData(userId, today, week) {
  try {
    const [
      teamRes,
      sessionsRes,
      nextDrillRes,
      nextGameRes,
      drillCountRes,
      gameCountRes,
      weekRes,
      recentMatchesRes,
    ] = await Promise.all([
      // Aktiivinen joukkue — viimeksi luotu
      supabase.from('teams')
        .select('id, name, phases, goals')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),

      // Viimeiset 5 harjoitussuunnitelmaa
      supabase.from('sessions')
        .select('id, name, updated_at, drills(id, duration)')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(5),

      // Seuraava tuleva treeni
      supabase.from('season_events')
        .select('id, date, time, theme, type')
        .eq('user_id', userId)
        .eq('type', 'drill')
        .gte('date', today)
        .order('date')
        .limit(1)
        .maybeSingle(),

      // Seuraava tuleva ottelu
      supabase.from('season_events')
        .select('id, date, time, title, type')
        .eq('user_id', userId)
        .eq('type', 'game')
        .gte('date', today)
        .order('date')
        .limit(1)
        .maybeSingle(),

      // Menneiden treenien lukumäärä
      supabase.from('season_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', 'drill')
        .lt('date', today),

      // Menneiden ottelujen lukumäärä
      supabase.from('season_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', 'game')
        .lt('date', today),

      // Kuluvan viikon tapahtumat kalenteria varten
      supabase.from('season_events')
        .select('date, type')
        .eq('user_id', userId)
        .gte('date', week.start)
        .lte('date', week.end),

      // Viimeksi pelatut ottelut
      supabase.from('match_plans')
        .select('id, opponent, match_date, result_home, result_away, season_event_id')
        .eq('user_id', userId)
        .order('match_date', { ascending: false })
        .limit(5),
    ])

    if (sessionsRes.error) throw sessionsRes.error

    return {
      data: {
        team:       teamRes.data     ?? null,
        sessions:   sessionsRes.data ?? [],
        nextDrill:  nextDrillRes.data  ?? null,
        nextGame:   nextGameRes.data   ?? null,
        drillCount: drillCountRes.count ?? 0,
        gameCount:  gameCountRes.count  ?? 0,
        weekEvents:     weekRes.data           ?? [],
        recentMatches:  recentMatchesRes.data  ?? [],
      },
      error: null,
    }
  } catch (error) {
    console.error('Dashboard-datan haku epäonnistui:', error)
    return { data: null, error }
  }
}
