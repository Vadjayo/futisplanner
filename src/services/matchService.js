/**
 * matchService.js
 * Pelipäiväsuunnitelmien ja kokoonpanopohjien CRUD-operaatiot.
 * Kaikki funktiot palauttavat { data, error } — error on null onnistuessa.
 */

import { supabase } from './supabase'

// ── PELIPÄIVÄSUUNNITELMAT ──

/**
 * Hakee kaikki käyttäjän pelipäiväsuunnitelmat joukkueittain, uusimmasta vanhimpaan.
 * @param {string} userId
 * @param {string} teamId
 * @returns {Promise<{ data: Array|null, error: object|null }>}
 */
export async function getMatchPlans(userId, teamId) {
  try {
    const { data, error } = await supabase
      .from('match_plans')
      .select('id, opponent, match_date, match_time, location, formation, result_home, result_away')
      .eq('user_id', userId)
      .eq('team_id', teamId)
      .order('match_date', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Pelipäiväsuunnitelmien haku epäonnistui:', error)
    return { data: null, error }
  }
}

/**
 * Hakee kausisuunnittelun tapahtuman (ottelu) tiedot esiläytölle.
 * @param {string} userId
 * @param {string} eventId  - season_events.id
 * @returns {Promise<{ data: object|null, error: object|null }>}
 */
export async function getSeasonEvent(userId, eventId) {
  try {
    const { data, error } = await supabase
      .from('season_events')
      .select('id, title, date, time')
      .eq('user_id', userId)
      .eq('id', eventId)
      .maybeSingle()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Kausisuunnittelun tapahtuman haku epäonnistui:', error)
    return { data: null, error }
  }
}

/**
 * Hakee pelipäiväsuunnitelman kausisuunnittelun tapahtuman id:n perusteella.
 * Palauttaa null jos suunnitelmaa ei ole vielä luotu kyseiselle ottelulle.
 * @param {string} userId
 * @param {string} eventId  - season_events.id
 * @returns {Promise<{ data: object|null, error: object|null }>}
 */
export async function getMatchPlanByEventId(userId, eventId) {
  try {
    const { data, error } = await supabase
      .from('match_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('season_event_id', eventId)
      .maybeSingle()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Pelipäiväsuunnitelman haku tapahtuma-id:llä epäonnistui:', error)
    return { data: null, error }
  }
}

/**
 * Hakee yksittäisen pelipäiväsuunnitelman kaikkine tietoineen.
 * @param {string} userId
 * @param {string} matchId
 * @returns {Promise<{ data: object|null, error: object|null }>}
 */
export async function getMatchPlan(userId, matchId) {
  try {
    const { data, error } = await supabase
      .from('match_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('id', matchId)
      .maybeSingle()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Pelipäiväsuunnitelman haku epäonnistui:', error)
    return { data: null, error }
  }
}

/**
 * Tallentaa pelipäiväsuunnitelman (upsert).
 * @param {object} planData
 * @returns {Promise<{ data: object|null, error: object|null }>}
 */
export async function saveMatchPlan(planData) {
  try {
    const row = {
      id:               planData.id,
      user_id:          planData.userId,
      team_id:          planData.teamId,
      opponent:         planData.opponent         || 'Vastustaja',
      match_date:       planData.matchDate,
      match_time:       planData.matchTime        || null,
      location:         planData.location         || null,
      formation:        planData.formation        || '4-3-3',
      lineup:           planData.lineup           ?? [],
      substitutes:      planData.substitutes      ?? [],
      absent:           planData.absent           ?? [],
      tactics_attack:   planData.tacticsAttack    || null,
      tactics_defense:  planData.tacticsDefense   || null,
      notes:            planData.notes            || null,
      result_home:      planData.resultHome       ?? null,
      result_away:      planData.resultAway       ?? null,
      goals:            planData.goals            ?? [],
      substitutions:    planData.substitutions    ?? [],
      player_ratings:   planData.playerRatings    ?? [],
      post_match_notes: planData.postMatchNotes   || null,
      season_event_id:  planData.seasonEventId   || null,
      updated_at:       new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('match_plans')
      .upsert(row)
      .select('id')
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Pelipäiväsuunnitelman tallennus epäonnistui:', error)
    return { data: null, error }
  }
}

/**
 * Poistaa pelipäiväsuunnitelman. Vaatii vahvistusmodalin UI:ssa ennen kutsumista.
 * @param {string} userId
 * @param {string} matchId
 * @returns {Promise<{ error: object|null }>}
 */
export async function deleteMatchPlan(userId, matchId) {
  try {
    const { error } = await supabase
      .from('match_plans')
      .delete()
      .eq('id', matchId)
      .eq('user_id', userId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Pelipäiväsuunnitelman poisto epäonnistui:', error)
    return { error }
  }
}

// ── KOKOONPANOPOHJAT ──

/**
 * Hakee kaikki käyttäjän kokoonpanopohjat.
 * @param {string} userId
 * @returns {Promise<{ data: Array|null, error: object|null }>}
 */
export async function getFormationTemplates(userId) {
  try {
    const { data, error } = await supabase
      .from('formation_templates')
      .select('id, name, formation, lineup')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Kokoonpanopohjien haku epäonnistui:', error)
    return { data: null, error }
  }
}

/**
 * Tallentaa uuden kokoonpanopohjan.
 * @param {object} template
 * @param {string} template.userId
 * @param {string} template.name
 * @param {string} template.formation
 * @param {Array}  template.lineup
 * @returns {Promise<{ data: object|null, error: object|null }>}
 */
export async function saveFormationTemplate({ userId, name, formation, lineup }) {
  try {
    const { data, error } = await supabase
      .from('formation_templates')
      .insert({ user_id: userId, name, formation, lineup })
      .select('id, name, formation, lineup')
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Kokoonpanopohjan tallennus epäonnistui:', error)
    return { data: null, error }
  }
}

/**
 * Poistaa kokoonpanopohjan.
 * @param {string} templateId
 * @returns {Promise<{ error: object|null }>}
 */
export async function deleteFormationTemplate(templateId, userId) {
  try {
    const { error } = await supabase
      .from('formation_templates')
      .delete()
      .eq('id', templateId)
      .eq('user_id', userId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Kokoonpanopohjan poisto epäonnistui:', error)
    return { error }
  }
}
