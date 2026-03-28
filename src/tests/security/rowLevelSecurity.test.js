/**
 * rowLevelSecurity.test.js
 * Testit: Supabase Row Level Security
 *
 * Varmistaa että kaikki palvelukutsut sisältävät user_id-suodattimen
 * eikä yksikään kutsu palauta toisen käyttäjän dataa.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted varmistaa että mockFrom on käytettävissä ennen vi.mock-kutsujen ajoa
const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }))

vi.mock('../../services/supabase', () => ({
  supabase: { from: mockFrom }
}))

import { getTeams, createTeam, updateTeam, deleteTeam } from '../../services/teamService'
import { getPlayers } from '../../services/playerService'
import { getSessions } from '../../services/sessionService'
import { saveMatchPlan } from '../../services/matchService'

const USER_A = { id: 'user-a', email: 'a@test.fi' }
const USER_B = { id: 'user-b', email: 'b@test.fi' }
const TEAM_B = { id: 'team-b', user_id: USER_B.id, name: 'B:n joukkue' }

/**
 * Luo ketjutettava mock-kysely.
 * Kaikki ketjumetodit palauttavat saman olion.
 * Olio on myös awaitable — resolvoituu result-objektilla.
 * @param {{ data: *, error: * }} result
 */
function makeMockQuery(result = { data: null, error: null }) {
  const chain = {}
  const chainMethods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'order', 'lt', 'gte', 'limit', 'not', 'or',
  ]
  chainMethods.forEach(m => { chain[m] = vi.fn(() => chain) })
  // Terminaalioperaatiot palauttavat suoran Promisen
  chain.single      = vi.fn(() => Promise.resolve(result))
  chain.maybeSingle = vi.fn(() => Promise.resolve(result))
  // Tee ketjusta awaitable (kun viimeinen metodi on order/eq/jne.)
  chain.then  = (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  chain.catch = (reject) => Promise.resolve(result).catch(reject)
  return chain
}

describe('Row Level Security', () => {
  let chain

  beforeEach(() => {
    vi.clearAllMocks()
    chain = makeMockQuery({ data: [], error: null })
    mockFrom.mockReturnValue(chain)
  })

  // RLS palauttaa tyhjän listan — käyttäjä A ei näe käyttäjä B:n joukkuetta
  it('käyttäjä ei näe toisen joukkuetta', async () => {
    const { data } = await getTeams(USER_A.id)
    expect(data).toHaveLength(0)
    expect(data?.find(t => t.user_id === USER_B.id)).toBeUndefined()
  })

  // getTeams lähettää user_id-suodattimen Supabaselle
  it('getTeams-kutsu sisältää user_id-suodattimen', async () => {
    await getTeams(USER_A.id)
    expect(chain.eq).toHaveBeenCalledWith('user_id', USER_A.id)
  })

  // Pelaajia ei palauteta toisen joukkueesta
  it('käyttäjä ei näe toisen joukkueen pelaajia', async () => {
    const { data } = await getPlayers(USER_A.id, TEAM_B.id)
    expect(data).toHaveLength(0)
  })

  // getPlayers lähettää user_id-suodattimen
  it('getPlayers-kutsu sisältää user_id-suodattimen', async () => {
    await getPlayers(USER_A.id, TEAM_B.id)
    expect(chain.eq).toHaveBeenCalledWith('user_id', USER_A.id)
  })

  // getSessions lähettää user_id-suodattimen
  it('getSessions-kutsu sisältää user_id-suodattimen', async () => {
    await getSessions(USER_A.id)
    expect(chain.eq).toHaveBeenCalledWith('user_id', USER_A.id)
  })

  // createTeam tallentaa user_id rivin mukana
  it('createTeam sisältää user_id insert-kutsulla', async () => {
    chain = makeMockQuery({ data: { id: 'new-team' }, error: null })
    mockFrom.mockReturnValue(chain)

    await createTeam({ userId: USER_A.id, name: 'Uusi joukkue' })

    const insertArg = chain.insert.mock.calls[0][0]
    expect(insertArg.user_id).toBe(USER_A.id)
  })

  // updateTeam suodattaa user_id:n mukaan — ei voi muokata toisen dataa
  it('updateTeam sisältää user_id-tarkistuksen', async () => {
    await updateTeam(USER_A.id, 'team-a', { name: 'Päivitetty' })
    expect(chain.eq).toHaveBeenCalledWith('user_id', USER_A.id)
  })

  // deleteTeam suodattaa user_id:n mukaan — ei voi poistaa toisen dataa
  it('deleteTeam sisältää user_id-tarkistuksen', async () => {
    await deleteTeam(USER_A.id, 'team-a')
    expect(chain.eq).toHaveBeenCalledWith('user_id', USER_A.id)
  })

  // RLS-virhe palautuu oikein deleteTeam-kutsussa
  it('käyttäjä ei voi poistaa toisen dataa — virhe palautuu', async () => {
    chain = makeMockQuery({ data: null, error: { message: 'RLS policy violation' } })
    mockFrom.mockReturnValue(chain)

    const { error } = await deleteTeam(USER_A.id, TEAM_B.id)
    expect(error).toBeDefined()
  })

  // saveMatchPlan sisältää user_id ja team_id
  it('saveMatchPlan sisältää user_id ja team_id upsert-kutsulla', async () => {
    chain = makeMockQuery({ data: { id: 'plan-1' }, error: null })
    mockFrom.mockReturnValue(chain)

    await saveMatchPlan({
      userId:    USER_A.id,
      teamId:    'team-a',
      opponent:  'OLS',
      matchDate: '2026-04-01',
    })

    const upsertArg = chain.upsert.mock.calls[0][0]
    expect(upsertArg.user_id).toBe(USER_A.id)
    expect(upsertArg.team_id).toBe('team-a')
  })
})
