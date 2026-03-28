/**
 * sessionService.js
 * Harjoitussessioiden ja drillien CRUD-operaatiot.
 * Kaikki Supabase-kutsut on koottu tähän — komponentit eivät kutsu Supabasea suoraan.
 *
 * Kaikki funktiot palauttavat { data, error } — error on null onnistuessa.
 */

import { supabase } from './supabase'

// ── SESSIOT ──

/**
 * Lataa kaikki käyttäjän sessiot dashboard-näkymää varten.
 * Sisältää drill-määrän ja kokonaiskeston laskemista varten.
 * @param {string} userId
 * @returns {Promise<{ data: Array|null, error: object|null }>}
 */
export async function getSessions(userId) {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('id, name, updated_at, drills ( id, duration )')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Sessioiden haku epäonnistui:', error)
    return { data: null, error }
  }
}

/**
 * Lataa käyttäjän viimeisin sessio harjoitteineen.
 * @param {string} userId
 * @returns {Promise<{ data: object|null, error: object|null }>}
 */
export async function getRecentSession(userId) {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        id, name, description, theme,
        focus_technical, focus_tactical, focus_physical, focus_mental,
        drills ( id, title, duration, field_type, elements, position )
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Viimeisimmän session haku epäonnistui:', error)
    return { data: null, error }
  }
}

/**
 * Lataa yksittäinen sessio id:n perusteella.
 * @param {string} userId
 * @param {string} sessionId
 * @returns {Promise<{ data: object|null, error: object|null }>}
 */
export async function getSessionById(userId, sessionId) {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        id, name, description, theme,
        focus_technical, focus_tactical, focus_physical, focus_mental,
        drills ( id, title, duration, field_type, elements, position )
      `)
      .eq('user_id', userId)
      .eq('id', sessionId)
      .maybeSingle()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Session haku epäonnistui:', error)
    return { data: null, error }
  }
}

/**
 * Tallenna sessio ja kaikki sen harjoitteet atomisesti.
 * Strategia: upsert sessio → poista vanhat drills → lisää uudet.
 *
 * @param {object} params
 * @param {string} params.id           - Session UUID
 * @param {string} params.name         - Session nimi
 * @param {string} params.userId       - Käyttäjän UUID
 * @param {Array}  params.drills       - Harjoite-olioiden lista
 * @param {object} [params.meta={}]    - Metatiedot (description, theme, focus-kentät)
 * @returns {Promise<{ data: object|null, error: object|null }>}
 */
export async function saveSession({ id, name, userId, drills, meta = {} }) {
  try {
    // 1. Upsert sessio
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .upsert({
        id, user_id: userId, name,
        updated_at:      new Date().toISOString(),
        description:     meta.description     ?? null,
        theme:           meta.theme           ?? null,
        focus_technical: meta.focusTechnical  ?? 0,
        focus_tactical:  meta.focusTactical   ?? 0,
        focus_physical:  meta.focusPhysical   ?? 0,
        focus_mental:    meta.focusMental     ?? 0,
      })
      .select('id')
      .single()

    if (sessionError) throw sessionError

    // 2. Upsert drills — päivittää olemassa olevat, lisää uudet.
    //    Ei poisteta ensin, joten insertin epäonnistuminen ei hävitä dataa.
    if (drills.length > 0) {
      const rows = drills.map((d, i) => ({
        id:         d.id,
        session_id: session.id,
        user_id:    userId,
        title:      d.title,
        duration:   d.duration,
        field_type: d.fieldType,
        elements:   d.elements,
        position:   i,
      }))
      const { error: upsertError } = await supabase.from('drills').upsert(rows)
      if (upsertError) throw upsertError
    }

    // 3. Poista vain ne drills jotka on poistettu sovelluksessa
    const currentIds = drills.map((d) => d.id)
    const deleteQuery = supabase.from('drills').delete().eq('session_id', session.id)
    const { error: deleteError } = currentIds.length > 0
      ? await deleteQuery.not('id', 'in', `(${currentIds.join(',')})`)
      : await deleteQuery
    if (deleteError) throw deleteError

    return { data: session, error: null }
  } catch (error) {
    console.error('Session tallennus epäonnistui:', error)
    return { data: null, error }
  }
}

/**
 * Poista sessio ja kaikki sen harjoitteet.
 * RLS varmistaa tietokantatasolla että vain omia sessioita voi poistaa.
 * @param {string} sessionId
 * @returns {Promise<{ error: object|null }>}
 */
export async function deleteSession(sessionId) {
  try {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Session poisto epäonnistui:', error)
    return { error }
  }
}

// ── KIRJASTO ──

/**
 * Tallenna harjoite omaan kirjastoon.
 * @param {object} drill
 * @returns {Promise<{ data: object|null, error: object|null }>}
 */
export async function saveToLibrary({ userId, title, duration, fieldType, elements, category, ageGroup, description }) {
  try {
    const { data, error } = await supabase
      .from('library')
      .insert({
        user_id:    userId,
        title,
        duration,
        field_type: fieldType,
        elements,
        category,
        age_group:  ageGroup,
        description: description || null,
      })
      .select('id')
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Kirjastoon tallennus epäonnistui:', error)
    return { data: null, error }
  }
}

/**
 * Lataa kirjasto suodattimilla. Kaikki suodattimet ovat valinnaisia.
 * @param {object} [params={}]
 * @param {string} [params.category]  - Kategoria ('kaikki' ohitetaan)
 * @param {string} [params.ageGroup]  - Ikäluokka ('kaikki' ohitetaan)
 * @param {string} [params.search]    - Hakusana otsikkohakuun (case-insensitive)
 * @returns {Promise<{ data: Array|null, error: object|null }>}
 */
export async function getLibrary({ category, ageGroup, search } = {}) {
  try {
    let query = supabase
      .from('library')
      .select('id, title, description, category, age_group, duration, field_type, elements')
      .order('category')
      .order('title')

    if (category && category !== 'kaikki') query = query.eq('category', category)
    if (ageGroup  && ageGroup  !== 'kaikki') query = query.in('age_group', [ageGroup, 'kaikki'])
    if (search)                              query = query.ilike('title', `%${search}%`)

    const { data, error } = await query
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Kirjaston haku epäonnistui:', error)
    return { data: null, error }
  }
}

/**
 * Lataa käyttäjän omat kirjastoharjoitteet.
 * @param {string} userId
 * @returns {Promise<{ data: Array|null, error: object|null }>}
 */
export async function getUserLibrary(userId) {
  try {
    const { data, error } = await supabase
      .from('library')
      .select('id, title, description, category, age_group, duration, field_type, elements')
      .eq('user_id', userId)
      .order('title')

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Oman kirjaston haku epäonnistui:', error)
    return { data: null, error }
  }
}

/**
 * Poista kirjastoharjoite (vain omat).
 * @param {string} id
 * @returns {Promise<{ error: object|null }>}
 */
export async function deleteFromLibrary(id, userId) {
  try {
    const { error } = await supabase.from('library').delete().eq('id', id).eq('user_id', userId)
    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Kirjaston poisto epäonnistui:', error)
    return { error }
  }
}
