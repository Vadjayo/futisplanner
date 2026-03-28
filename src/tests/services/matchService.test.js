/**
 * matchService.test.js
 * Testit pelipäiväsuunnitelmien ja kokoonpanopohjien CRUD-operaatioille.
 * Supabase mockataan — ei oikeaa verkkoa tarvita.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mockataan Supabase chainable-kyselyrakenne
const mockQuery = {
  select:      vi.fn().mockReturnThis(),
  eq:          vi.fn().mockReturnThis(),
  order:       vi.fn().mockReturnThis(),
  insert:      vi.fn().mockReturnThis(),
  upsert:      vi.fn().mockReturnThis(),
  delete:      vi.fn().mockReturnThis(),
  maybeSingle: vi.fn(),
  single:      vi.fn(),
}

vi.mock('../../services/supabase', () => ({
  supabase: { from: vi.fn(() => mockQuery) },
}))

import {
  getMatchPlans,
  getMatchPlanByEventId,
  saveMatchPlan,
  deleteMatchPlan,
  getFormationTemplates,
  saveFormationTemplate,
  deleteFormationTemplate,
} from '../../services/matchService'

const USER_ID = 'user-abc'
const TEAM_ID = 'team-xyz'

describe('matchService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Palauta mockReturnThis uudelleen jokaisen testin alussa
    mockQuery.select.mockReturnThis()
    mockQuery.eq.mockReturnThis()
    mockQuery.order.mockReturnThis()
    mockQuery.insert.mockReturnThis()
    mockQuery.upsert.mockReturnThis()
    mockQuery.delete.mockReturnThis()
  })

  // ── PELIPÄIVÄSUUNNITELMAT ──

  // getMatchPlans palauttaa suunnitelmat oikealle käyttäjälle
  it('getMatchPlans hakee oikean käyttäjän suunnitelmat', async () => {
    const mockPlans = [
      { id: 'm1', opponent: 'FC Testi', match_date: '2026-03-27' },
    ]
    mockQuery.order.mockResolvedValueOnce({ data: mockPlans, error: null })

    const { data, error } = await getMatchPlans(USER_ID, TEAM_ID)

    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data[0].opponent).toBe('FC Testi')
  })

  // getMatchPlanByEventId hakee suunnitelman season_event_id:llä
  it('getMatchPlanByEventId hakee suunnitelman season_event_id:llä', async () => {
    const mockPlan = { id: 'm1', season_event_id: 'event-123', formation: '4-3-3' }
    mockQuery.maybeSingle.mockResolvedValueOnce({ data: mockPlan, error: null })

    const { data, error } = await getMatchPlanByEventId(USER_ID, 'event-123')

    expect(error).toBeNull()
    expect(data.season_event_id).toBe('event-123')
    expect(data.formation).toBe('4-3-3')
  })

  // getMatchPlanByEventId palauttaa null jos suunnitelmaa ei ole
  it('getMatchPlanByEventId palauttaa null jos suunnitelmaa ei löydy', async () => {
    mockQuery.maybeSingle.mockResolvedValueOnce({ data: null, error: null })

    const { data, error } = await getMatchPlanByEventId(USER_ID, 'puuttuva-event')

    expect(error).toBeNull()
    expect(data).toBeNull()
  })

  // saveMatchPlan tallentaa season_event_id:n riville
  it('saveMatchPlan tallentaa season_event_id:n', async () => {
    const mockResult = { id: 'new-plan' }
    mockQuery.single.mockResolvedValueOnce({ data: mockResult, error: null })

    const { data, error } = await saveMatchPlan({
      userId: USER_ID,
      teamId: TEAM_ID,
      seasonEventId: 'event-abc',
      formation: '4-4-2',
    })

    expect(error).toBeNull()
    expect(data.id).toBe('new-plan')
    // Varmista että upsert kutsuttiin (ei insert)
    expect(mockQuery.upsert).toHaveBeenCalled()
  })

  // saveMatchPlan käyttää upsert-operaatiota
  it('saveMatchPlan tekee upsert eikä insert', async () => {
    mockQuery.single.mockResolvedValueOnce({ data: { id: 'm1' }, error: null })

    await saveMatchPlan({ userId: USER_ID, teamId: TEAM_ID })

    expect(mockQuery.upsert).toHaveBeenCalledTimes(1)
    expect(mockQuery.insert).not.toHaveBeenCalled()
  })

  // deleteMatchPlan poistaa oikean suunnitelman user_id-suodattimella
  it('deleteMatchPlan poistaa oikean suunnitelman', async () => {
    mockQuery.eq.mockReturnThis()
    // Viimeinen .eq palauttaa tuloksen
    mockQuery.eq
      .mockReturnValueOnce(mockQuery)   // .eq('id', matchId)
      .mockResolvedValueOnce({ error: null })  // .eq('user_id', userId)

    const { error } = await deleteMatchPlan(USER_ID, 'match-to-delete')

    expect(error).toBeNull()
  })

  // ── KOKOONPANOPOHJAT ──

  // getFormationTemplates hakee käyttäjän pohjat
  it('getFormationTemplates hakee käyttäjän pohjat', async () => {
    const mockTemplates = [
      { id: 't1', name: 'Hyökkäys 4-3-3', formation: '4-3-3' },
    ]
    mockQuery.order.mockResolvedValueOnce({ data: mockTemplates, error: null })

    const { data, error } = await getFormationTemplates(USER_ID)

    expect(error).toBeNull()
    expect(data[0].name).toBe('Hyökkäys 4-3-3')
  })

  // saveFormationTemplate tallentaa uuden pohjan
  it('saveFormationTemplate tallentaa uuden pohjan', async () => {
    const newTemplate = { id: 't2', name: 'Puolustus 5-4-1', formation: '5-4-1', lineup: [] }
    mockQuery.single.mockResolvedValueOnce({ data: newTemplate, error: null })

    const { data, error } = await saveFormationTemplate({
      userId: USER_ID,
      name: 'Puolustus 5-4-1',
      formation: '5-4-1',
      lineup: [],
    })

    expect(error).toBeNull()
    expect(data.formation).toBe('5-4-1')
    expect(mockQuery.insert).toHaveBeenCalled()
  })

  // deleteFormationTemplate poistaa pohjan user_id-suodattimella
  it('deleteFormationTemplate poistaa pohjan', async () => {
    mockQuery.eq
      .mockReturnValueOnce(mockQuery)
      .mockResolvedValueOnce({ error: null })

    const { error } = await deleteFormationTemplate('template-1', USER_ID)

    expect(error).toBeNull()
    expect(mockQuery.delete).toHaveBeenCalled()
  })

  // Virheenkäsittely — supabase-virhe palautuu { data: null, error }
  it('getMatchPlans palauttaa virheen kun kysely epäonnistuu', async () => {
    const dbError = new Error('yhteysongelma')
    mockQuery.order.mockRejectedValueOnce(dbError)

    const { data, error } = await getMatchPlans(USER_ID, TEAM_ID)

    expect(data).toBeNull()
    expect(error).toBe(dbError)
  })
})
