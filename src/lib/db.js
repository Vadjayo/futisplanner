/**
 * db.js
 * Tietokantafunktiot — kaikki Supabase-kyselyt on koottu tähän tiedostoon
 * jotta komponentin koodi pysyy siistinä eikä tietokantalogiikka hajaudu.
 */

import { supabase } from './supabase'

/**
 * Lataa käyttäjän viimeisin sessio harjoitteineen.
 * Palauttaa session + siihen liittyvät drills järjestettynä position-kentän mukaan.
 * @param {string} userId - Supabase-käyttäjän UUID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function loadRecentSession(userId) {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      id, name, description, theme, focus_technical, focus_tactical, focus_physical, focus_mental,
      drills ( id, title, duration, field_type, elements, position )
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle() // palauttaa null eikä virhettä jos sessioita ei ole

  return { data, error }
}

/**
 * Tallenna sessio + kaikki harjoitteet atomisesti.
 * Strategia: upsert sessio → poista vanhat harjoitteet → lisää uudet
 * (yksinkertaisempi kuin diff-pohjainen päivitys, riittää tähän käyttötarkoitukseen)
 * @param {object} params
 * @param {string} params.id - Session UUID
 * @param {string} params.name - Session nimi
 * @param {string} params.userId - Supabase-käyttäjän UUID
 * @param {Array}  params.drills - Harjoite-olioiden lista
 * @param {object} [params.meta={}] - Metatiedot (description, theme, focus-kentät)
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function saveSession({ id, name, userId, drills, meta = {} }) {
  // Upsert sessio — luo uusi tai päivitä olemassa oleva id:n perusteella
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .upsert({
      id, user_id: userId, name, updated_at: new Date().toISOString(),
      description: meta.description ?? null,
      theme: meta.theme ?? null,
      focus_technical: meta.focusTechnical ?? 0,
      focus_tactical:  meta.focusTactical  ?? 0,
      focus_physical:  meta.focusPhysical  ?? 0,
      focus_mental:    meta.focusMental    ?? 0,
    })
    .select('id')
    .single()

  if (sessionError) return { error: sessionError }

  // Poista kaikki vanhat harjoitteet ennen uusien lisäämistä
  const { error: deleteError } = await supabase
    .from('drills')
    .delete()
    .eq('session_id', session.id)

  if (deleteError) return { error: deleteError }

  // Lisää uudet harjoitteet — position-kenttä säilyttää järjestyksen
  if (drills.length > 0) {
    const { error: insertError } = await supabase
      .from('drills')
      .insert(
        drills.map((d, i) => ({
          id: d.id,
          session_id: session.id,
          user_id: userId,
          title: d.title,
          duration: d.duration,
          field_type: d.fieldType,
          elements: d.elements,
          position: i, // tallenna järjestysindeksi jotta lataus toimii oikein
        }))
      )
    if (insertError) return { error: insertError }
  }

  return { data: session }
}

/**
 * Lataa kaikki käyttäjän sessiot dashboard-näkymää varten.
 * Sisältää drill-määrän ja kokonaiskeston laskemista varten.
 * @param {string} userId - Supabase-käyttäjän UUID
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function loadAllSessions(userId) {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      id, name, updated_at,
      drills ( id, duration )
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  return { data, error }
}

/**
 * Lataa yksittäinen sessio id:n perusteella (dashboardilta avatessa).
 * @param {string} userId - Supabase-käyttäjän UUID
 * @param {string} sessionId - Haettavan session UUID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function loadSessionById(userId, sessionId) {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      id, name, description, theme, focus_technical, focus_tactical, focus_physical, focus_mental,
      drills ( id, title, duration, field_type, elements, position )
    `)
    .eq('user_id', userId)
    .eq('id', sessionId)
    .maybeSingle()

  return { data, error }
}

/**
 * Poista sessio ja kaikki sen harjoitteet (RLS varmistaa omistajuuden).
 * @param {string} sessionId - Poistettavan session UUID
 * @returns {Promise<{error: object|null}>}
 */
export async function deleteSession(sessionId) {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId)

  return { error }
}

/**
 * Tallenna harjoite omaan kirjastoon.
 */
export async function saveToLibrary({ userId, title, duration, fieldType, elements, category, ageGroup, description }) {
  const { data, error } = await supabase
    .from('library')
    .insert({
      user_id: userId,
      title,
      duration,
      field_type: fieldType,
      elements,
      category,
      age_group: ageGroup,
      description: description || null,
    })
    .select('id')
    .single()
  return { data, error }
}

/**
 * Lataa käyttäjän omat kirjastoon tallennetut harjoitteet.
 */
export async function loadUserLibrary(userId) {
  const { data, error } = await supabase
    .from('library')
    .select('id, title, description, category, age_group, duration, field_type, elements')
    .eq('user_id', userId)
    .order('title')
  return { data, error }
}

/**
 * Poista kirjastoharjoite (vain omat).
 */
export async function deleteFromLibrary(id) {
  const { error } = await supabase.from('library').delete().eq('id', id)
  return { error }
}

/**
 * Lataa harjoituskirjasto suodattimilla.
 * Kaikki suodattimet ovat valinnaisia — ilman suodattimia palautetaan kaikki.
 * @param {object} [params={}]
 * @param {string} [params.category] - Kategoria-suodatin (esim. 'hyökkäys')
 * @param {string} [params.ageGroup] - Ikäluokkasuodatin (esim. 'U12')
 * @param {string} [params.search] - Hakusana otsikkohaun (case-insensitive)
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function loadLibrary({ category, ageGroup, search } = {}) {
  let query = supabase
    .from('library')
    .select('id, title, description, category, age_group, duration, field_type, elements')
    .order('category')
    .order('title')

  // Sovella suodattimet vain jos ne on annettu ja eivät ole "kaikki"
  if (category && category !== 'kaikki') {
    query = query.eq('category', category)
  }
  if (ageGroup && ageGroup !== 'kaikki') {
    // Sisällytä myös ikäluokkaan "kaikki" merkityt harjoitteet
    query = query.in('age_group', [ageGroup, 'kaikki'])
  }
  if (search) {
    query = query.ilike('title', `%${search}%`) // kirjainkoosta riippumaton haku
  }

  const { data, error } = await query
  return { data, error }
}
