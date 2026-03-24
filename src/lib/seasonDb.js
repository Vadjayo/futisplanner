// Tietokantafunktiot kausisuunnittelulle — joukkueet ja kalenteritapahtumat

import { supabase } from './supabase'

// ── JOUKKUEET ──

export function loadTeams(userId) {
  return supabase
    .from('teams')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
}

export function createTeam(userId) {
  return supabase
    .from('teams')
    .insert({ user_id: userId, name: 'Uusi joukkue' })
    .select()
    .single()
}

export function updateTeam(teamId, updates) {
  return supabase
    .from('teams')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', teamId)
}

export function deleteTeam(teamId) {
  return supabase.from('teams').delete().eq('id', teamId)
}

// ── KALENTERITAPAHTUMAT ──

export function loadEvents(teamId) {
  return supabase
    .from('calendar_events')
    .select('*')
    .eq('team_id', teamId)
    .order('date', { ascending: true })
}

export function addEvent(teamId, event) {
  return supabase
    .from('calendar_events')
    .insert({ team_id: teamId, ...event })
    .select()
    .single()
}

export function deleteEvent(eventId) {
  return supabase.from('calendar_events').delete().eq('id', eventId)
}
