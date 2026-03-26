/**
 * useMatchPlan.js
 * Pelipäiväsuunnitelman tilan hallinta.
 * Lataa olemassa olevan suunnitelman tai luo uuden.
 *
 * Käyttö:
 *   const {
 *     plan, loading, error, dirty,
 *     updateField, updateLineup, applyFormation,
 *     savePlan, deletePlan,
 *   } = useMatchPlan(matchId)
 */

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams }                  from 'react-router-dom'
import { useAuth }  from './useAuth'
import { useTeam }  from './useTeam'
import { getMatchPlan, getMatchPlanByEventId, saveMatchPlan, deleteMatchPlan } from '../services/matchService'

/** Tänään YYYY-MM-DD */
function todayStr() {
  return new Date().toLocaleDateString('sv-SE')
}

/**
 * Muodostelmien pelaajapaikat 1000×650 kentällä.
 * Kotijoukkue pelaa vasemmalta oikealle — oma kenttäpuolisko x: 0–490.
 * Sisältää 11v11-, 8v8- ja 5v5-muodostelmat.
 */
export const FORMATIONS = {
  // ── 11v11 ──
  '4-3-3': [
    { position: 'MV', x: 75,  y: 325 },
    { position: 'PO', x: 220, y: 140 },
    { position: 'KP', x: 220, y: 260 },
    { position: 'KP', x: 220, y: 390 },
    { position: 'PO', x: 220, y: 510 },
    { position: 'KK', x: 400, y: 195 },
    { position: 'KK', x: 400, y: 325 },
    { position: 'KK', x: 400, y: 455 },
    { position: 'HY', x: 580, y: 140 },
    { position: 'HY', x: 580, y: 325 },
    { position: 'HY', x: 580, y: 510 },
  ],
  '4-4-2': [
    { position: 'MV', x: 75,  y: 325 },
    { position: 'PO', x: 220, y: 120 },
    { position: 'KP', x: 220, y: 255 },
    { position: 'KP', x: 220, y: 395 },
    { position: 'PO', x: 220, y: 530 },
    { position: 'LK', x: 400, y: 120 },
    { position: 'KK', x: 400, y: 255 },
    { position: 'KK', x: 400, y: 395 },
    { position: 'LK', x: 400, y: 530 },
    { position: 'HY', x: 575, y: 240 },
    { position: 'HY', x: 575, y: 410 },
  ],
  '3-5-2': [
    { position: 'MV', x: 75,  y: 325 },
    { position: 'KP', x: 200, y: 195 },
    { position: 'KP', x: 200, y: 325 },
    { position: 'KP', x: 200, y: 455 },
    { position: 'LK', x: 370, y: 100 },
    { position: 'KK', x: 370, y: 230 },
    { position: 'KK', x: 370, y: 325 },
    { position: 'KK', x: 370, y: 420 },
    { position: 'LK', x: 370, y: 550 },
    { position: 'HY', x: 575, y: 245 },
    { position: 'HY', x: 575, y: 405 },
  ],
  '4-2-3-1': [
    { position: 'MV', x: 75,  y: 325 },
    { position: 'PO', x: 210, y: 130 },
    { position: 'KP', x: 210, y: 270 },
    { position: 'KP', x: 210, y: 380 },
    { position: 'PO', x: 210, y: 520 },
    { position: 'KK', x: 355, y: 260 },
    { position: 'KK', x: 355, y: 390 },
    { position: 'KK', x: 475, y: 170 },
    { position: 'KK', x: 475, y: 325 },
    { position: 'KK', x: 475, y: 480 },
    { position: 'HY', x: 600, y: 325 },
  ],
  '5-3-2': [
    { position: 'MV', x: 75,  y: 325 },
    { position: 'PO', x: 205, y: 100 },
    { position: 'KP', x: 205, y: 230 },
    { position: 'KP', x: 205, y: 325 },
    { position: 'KP', x: 205, y: 420 },
    { position: 'PO', x: 205, y: 550 },
    { position: 'KK', x: 395, y: 210 },
    { position: 'KK', x: 395, y: 325 },
    { position: 'KK', x: 395, y: 440 },
    { position: 'HY', x: 575, y: 245 },
    { position: 'HY', x: 575, y: 405 },
  ],

  // ── 8v8 ──
  '3-3-1': [
    { position: 'MV', x: 75,  y: 325 },
    { position: 'KP', x: 210, y: 195 },
    { position: 'KP', x: 210, y: 325 },
    { position: 'KP', x: 210, y: 455 },
    { position: 'KK', x: 360, y: 195 },
    { position: 'KK', x: 360, y: 325 },
    { position: 'KK', x: 360, y: 455 },
    { position: 'HY', x: 470, y: 325 },
  ],
  '3-2-2': [
    { position: 'MV', x: 75,  y: 325 },
    { position: 'KP', x: 210, y: 195 },
    { position: 'KP', x: 210, y: 325 },
    { position: 'KP', x: 210, y: 455 },
    { position: 'KK', x: 360, y: 260 },
    { position: 'KK', x: 360, y: 390 },
    { position: 'HY', x: 470, y: 225 },
    { position: 'HY', x: 470, y: 425 },
  ],
  '2-4-1': [
    { position: 'MV', x: 75,  y: 325 },
    { position: 'KP', x: 200, y: 260 },
    { position: 'KP', x: 200, y: 390 },
    { position: 'KK', x: 325, y: 160 },
    { position: 'KK', x: 325, y: 280 },
    { position: 'KK', x: 325, y: 370 },
    { position: 'KK', x: 325, y: 490 },
    { position: 'HY', x: 460, y: 325 },
  ],

  // ── 5v5 ──
  '2-2': [
    { position: 'MV', x: 75,  y: 325 },
    { position: 'KP', x: 255, y: 230 },
    { position: 'KP', x: 255, y: 420 },
    { position: 'HY', x: 440, y: 230 },
    { position: 'HY', x: 440, y: 420 },
  ],
  '1-2-1': [
    { position: 'MV', x: 75,  y: 325 },
    { position: 'KP', x: 240, y: 325 },
    { position: 'KK', x: 370, y: 230 },
    { position: 'KK', x: 370, y: 420 },
    { position: 'HY', x: 460, y: 325 },
  ],
}

/**
 * Luo uuden tyhjän suunnitelman oletusarvoilla.
 * @param {string|null} id
 * @param {string|null} teamId
 * @param {string|null} seasonEventId
 * @returns {object}
 */
function createEmptyPlan(id, teamId, seasonEventId) {
  return {
    id:             id ?? crypto.randomUUID(),
    teamId:         teamId ?? null,
    seasonEventId:  seasonEventId ?? null,
    opponent:       '',
    matchDate:      todayStr(),
    matchTime:      '',
    location:       '',
    formation:      '4-3-3',
    lineup:         [],
    substitutes:    [],
    absent:         [],
    tacticsAttack:  '',
    tacticsDefense: '',
    notes:          '',
    resultHome:     null,
    resultAway:     null,
    goals:          [],
    substitutions:  [],
    playerRatings:  [],
    postMatchNotes:  '',
  }
}

/**
 * Muuntaa tietokannan snake_case-rivin camelCase-suunnitelmaksi.
 * @param {object} row
 * @returns {object}
 */
function rowToPlan(row) {
  return {
    id:             row.id,
    teamId:         row.team_id,
    opponent:       row.opponent         ?? '',
    matchDate:      row.match_date       ?? todayStr(),
    matchTime:      row.match_time       ?? '',
    location:       row.location         ?? '',
    formation:      row.formation        ?? '4-3-3',
    lineup:         row.lineup           ?? [],
    substitutes:    row.substitutes      ?? [],
    absent:         row.absent           ?? [],
    tacticsAttack:  row.tactics_attack   ?? '',
    tacticsDefense: row.tactics_defense  ?? '',
    notes:          row.notes            ?? '',
    resultHome:     row.result_home      ?? null,
    resultAway:     row.result_away      ?? null,
    goals:          row.goals            ?? [],
    substitutions:  row.substitutions    ?? [],
    playerRatings:  row.player_ratings   ?? [],
    postMatchNotes:  row.post_match_notes  ?? '',
    seasonEventId:   row.season_event_id   ?? null,
  }
}

/**
 * Pelipäiväsuunnitelman tilan hallinta.
 * @param {string|null} matchId  - URL-parametri; null → uusi suunnitelma
 * @returns {object}
 */
export function useMatchPlan(matchId) {
  const { user }                    = useAuth()
  const { selectedTeam: team }      = useTeam(user?.id)
  const [searchParams]              = useSearchParams()

  // ?event=UUID → linkitetty kausisuunnittelun ottelutapahtuma
  const eventId = searchParams.get('event')

  const [plan,    setPlan]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [dirty,   setDirty]   = useState(false)   // tallentamattomia muutoksia

  // Lataa tai luo suunnitelma
  useEffect(() => {
    if (!user?.id) return

    // Tapaus 1: avattu kausisuunnittelun ottelulinkistä (?event=UUID)
    if (eventId && !matchId) {
      setLoading(true)
      getMatchPlanByEventId(user.id, eventId).then(({ data, error: err }) => {
        if (err) setError(err)
        else     setPlan(data ? rowToPlan(data) : createEmptyPlan(null, team?.id, eventId))
        setLoading(false)
      })
      return
    }

    // Tapaus 2: ei ID:tä → täysin uusi suunnitelma
    if (!matchId) {
      setPlan(createEmptyPlan(null, team?.id ?? null, null))
      setLoading(false)
      return
    }

    // Tapaus 3: avattu olemassa olevalla match_plan ID:llä
    setLoading(true)
    getMatchPlan(user.id, matchId).then(({ data, error: err }) => {
      if (err)  setError(err)
      else      setPlan(data ? rowToPlan(data) : createEmptyPlan(matchId, team?.id, null))
      setLoading(false)
    })
  }, [user?.id, matchId, eventId, team?.id])

  /**
   * Päivitä yksittäinen kenttä suunnitelmassa.
   * @param {string} field  - camelCase-kentän nimi
   * @param {*}      value
   */
  const updateField = useCallback((field, value) => {
    setPlan((prev) => ({ ...prev, [field]: value }))
    setDirty(true)
  }, [])

  /**
   * Korvaa koko lineup-taulukko (käytetään muodostelman vaihdossa).
   * @param {Array} newLineup
   */
  const updateLineup = useCallback((newLineup) => {
    setPlan((prev) => ({ ...prev, lineup: newLineup }))
    setDirty(true)
  }, [])

  /**
   * Soveltaa muodostelman oletuspaikat; säilyttää pelaajanimet jos löytyvät.
   * @param {string} formation  - esim. '4-3-3'
   */
  const applyFormation = useCallback((formation) => {
    const slots  = FORMATIONS[formation] ?? FORMATIONS['4-3-3']
    setPlan((prev) => {
      // Säilytä nykyiset pelaajat järjestyksessä uusiin sijainteihin
      const oldLineup = prev.lineup ?? []
      const newLineup = slots.map((slot, i) => ({
        id:       oldLineup[i]?.id       ?? crypto.randomUUID(),
        name:     oldLineup[i]?.name     ?? '',
        number:   oldLineup[i]?.number   ?? '',
        position: slot.position,
        x:        slot.x,
        y:        slot.y,
      }))
      return { ...prev, formation, lineup: newLineup }
    })
    setDirty(true)
  }, [])

  /**
   * Tallentaa suunnitelman Supabaseen.
   * @returns {Promise<{ error: object|null }>}
   */
  const savePlan = useCallback(async () => {
    if (!user?.id || !plan) return { error: new Error('Ei kirjautunutta käyttäjää') }
    const { error: err } = await saveMatchPlan({ ...plan, userId: user.id })
    if (!err) setDirty(false)
    return { error: err }
  }, [user?.id, plan])

  /**
   * Poistaa suunnitelman. Kutsutaan vasta vahvistuksen jälkeen.
   * @returns {Promise<{ error: object|null }>}
   */
  const deletePlan = useCallback(async () => {
    if (!user?.id || !plan?.id) return { error: new Error('Ei suunnitelmaa poistettavaksi') }
    return deleteMatchPlan(user.id, plan.id)
  }, [user?.id, plan?.id])

  return { plan, loading, error, dirty, updateField, updateLineup, applyFormation, savePlan, deletePlan }
}
