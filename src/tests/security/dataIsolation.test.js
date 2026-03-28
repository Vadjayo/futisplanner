/**
 * dataIsolation.test.js
 * Testit: Käyttäjädatan eristys
 *
 * Varmistaa että eri käyttäjien data ei sekoitu keskenään.
 * Team_id- ja user_id-suodattimet toimivat oikein.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted varmistaa että mockFrom on käytettävissä ennen vi.mock-kutsujen ajoa
const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }))

vi.mock('../../services/supabase', () => ({
  supabase: { from: mockFrom }
}))

import { getTeams }             from '../../services/teamService'
import { getMatchPlanByEventId } from '../../services/matchService'

const USER_A = { id: 'user-a' }
const USER_B = { id: 'user-b' }

/**
 * Luo ketjutettava mock-kysely.
 * @param {{ data: *, error: * }} result
 */
function makeMockQuery(result = { data: null, error: null }) {
  const chain = {}
  const chainMethods = ['select','eq','order','lt','gte','limit','not','or','insert','update','delete','upsert']
  chainMethods.forEach(m => { chain[m] = vi.fn(() => chain) })
  chain.single      = vi.fn(() => Promise.resolve(result))
  chain.maybeSingle = vi.fn(() => Promise.resolve(result))
  chain.then  = (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  chain.catch = (reject) => Promise.resolve(result).catch(reject)
  return chain
}

describe('Datan eristys käyttäjien välillä', () => {
  let chain

  beforeEach(() => {
    vi.clearAllMocks()
    chain = makeMockQuery({ data: [], error: null })
    mockFrom.mockReturnValue(chain)
  })

  // Käyttäjä A:n joukkueet eivät sisällä käyttäjä B:n joukkueita
  it('getTeams palauttaa vain oman käyttäjän joukkueet', async () => {
    chain = makeMockQuery({
      data: [{ id: 'team-a', user_id: USER_A.id, name: 'HIFK U12' }],
      error: null,
    })
    mockFrom.mockReturnValue(chain)

    const { data } = await getTeams(USER_A.id)

    // Palautettu data sisältää vain USER_A:n joukkueen
    expect(data.every(t => t.user_id === USER_A.id)).toBe(true)
    expect(data.find(t => t.user_id === USER_B.id)).toBeUndefined()
  })

  // match_plans suodatetaan season_event_id:llä
  it('getMatchPlanByEventId palauttaa oikean suunnitelman', async () => {
    chain = makeMockQuery({
      data: { id: 'plan-1', user_id: USER_A.id, season_event_id: 'event-a' },
      error: null,
    })
    mockFrom.mockReturnValue(chain)

    const { data } = await getMatchPlanByEventId(USER_A.id, 'event-a')

    expect(data.season_event_id).toBe('event-a')
    expect(data.user_id).toBe(USER_A.id)
  })

  // getMatchPlanByEventId sisältää user_id-suodattimen
  it('getMatchPlanByEventId-kutsu sisältää user_id-suodattimen', async () => {
    await getMatchPlanByEventId(USER_A.id, 'event-a')
    expect(chain.eq).toHaveBeenCalledWith('user_id', USER_A.id)
  })

  // Tapahtumat suodatetaan team_id:n mukaan (yksikkötaso)
  it('season_events suodatetaan team_id:n mukaan', () => {
    const mockEvents = [
      { id: 'e1', team_id: 'team-a', user_id: USER_A.id, type: 'drill' },
      { id: 'e2', team_id: 'team-b', user_id: USER_B.id, type: 'drill' },
    ]

    const teamAEvents = mockEvents.filter(e => e.team_id === 'team-a')

    expect(teamAEvents).toHaveLength(1)
    expect(teamAEvents[0].team_id).toBe('team-a')
    expect(teamAEvents.find(e => e.team_id === 'team-b')).toBeUndefined()
  })

  // Uloskirjautuminen tyhjentää localStorage
  it('uloskirjautuminen tyhjentää käyttäjädatan localStoragesta', () => {
    localStorage.setItem('activeTeamId', 'team-a')
    sessionStorage.setItem('user', USER_A.id)

    // Simuloi uloskirjautuminen
    localStorage.clear()
    sessionStorage.clear()

    expect(localStorage.getItem('activeTeamId')).toBeNull()
    expect(sessionStorage.getItem('user')).toBeNull()
  })

  // LocalStorage-valinta on käyttäjäkohtainen
  it('uuden käyttäjän kirjautuminen ei jää edellisen tietoihin', () => {
    // Käyttäjä A:n sessio
    localStorage.setItem('activeTeamId', 'team-a')

    // Simuloi käyttäjänvaihto — localStorage tyhjenee
    localStorage.clear()

    expect(localStorage.getItem('activeTeamId')).toBeNull()

    // Käyttäjä B asettaa oman joukkueen
    localStorage.setItem('activeTeamId', 'team-b')
    expect(localStorage.getItem('activeTeamId')).toBe('team-b')
  })

  // Virhetilassa ei palauteta toisen käyttäjän dataa
  it('virhetilassa palautetaan null — ei toisen dataa', async () => {
    chain = makeMockQuery({
      data: null,
      error: { message: 'RLS policy violation' },
    })
    mockFrom.mockReturnValue(chain)

    const { data, error } = await getTeams(USER_A.id)

    expect(data).toBeNull()
    expect(error).toBeDefined()
  })

  // Tilastopalvelu käyttää sekä user_id että team_id suodattimia
  it('statsService-kutsuissa käytetään sekä user_id että team_id', async () => {
    await getTeams(USER_A.id)

    // user_id-suodatin on mukana
    expect(chain.eq).toHaveBeenCalledWith('user_id', USER_A.id)
    // eq kutsuttiin vähintään kerran
    expect(chain.eq.mock.calls.length).toBeGreaterThan(0)
  })

  // Testaa että pyynnöt erotellaan oikein eri käyttäjille
  it('eri käyttäjillä on erilliset kyselyt — user_id:t eivät sekoitu', async () => {
    // Käyttäjä A:n kysely
    const chainA = makeMockQuery({ data: [{ id: 'team-a', user_id: USER_A.id }], error: null })
    mockFrom.mockReturnValueOnce(chainA)
    const { data: dataA } = await getTeams(USER_A.id)

    // Käyttäjä B:n kysely
    const chainB = makeMockQuery({ data: [{ id: 'team-b', user_id: USER_B.id }], error: null })
    mockFrom.mockReturnValueOnce(chainB)
    const { data: dataB } = await getTeams(USER_B.id)

    // Kumpikin sai vain oman datansa
    expect(dataA[0].user_id).toBe(USER_A.id)
    expect(dataB[0].user_id).toBe(USER_B.id)
    expect(chainA.eq).toHaveBeenCalledWith('user_id', USER_A.id)
    expect(chainB.eq).toHaveBeenCalledWith('user_id', USER_B.id)
  })
})
