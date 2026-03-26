/**
 * statsService.test.js
 * Testit getSeasonStats-funktiolle.
 * Supabase mockataan — ei oikeaa verkkoa tarvita.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mockataan Supabase chainable-kyselyrakenne
const mockQuery = {
  select: vi.fn().mockReturnThis(),
  eq:     vi.fn().mockReturnThis(),
  lt:     vi.fn(),                  // viimeinen kutsu count-kyselyissä
  order:  vi.fn().mockReturnThis(),
  limit:  vi.fn(),                  // viimeinen kutsu match_plans-kyselyssä
}

vi.mock('../../services/supabase', () => ({
  supabase: {
    from: vi.fn(() => mockQuery),
  },
}))

import { getSeasonStats } from '../../services/statsService'

const TODAY = '2026-03-26'

describe('getSeasonStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Palauta mockReturnThis kaikille chain-metodeille uudelleen
    mockQuery.select.mockReturnThis()
    mockQuery.eq.mockReturnThis()
    mockQuery.order.mockReturnThis()
  })

  // Perustapaus: palauttaa drillCount ja gameCount oikein
  it('palauttaa drillCount ja gameCount', async () => {
    mockQuery.lt
      .mockResolvedValueOnce({ count: 12, error: null })  // treenit
      .mockResolvedValueOnce({ count: 4,  error: null })  // ottelut
    mockQuery.limit.mockResolvedValueOnce({ data: [], error: null })

    const { data, error } = await getSeasonStats('user-1', 'team-1', TODAY)

    expect(error).toBeNull()
    expect(data.drillCount).toBe(12)
    expect(data.gameCount).toBe(4)
  })

  // recentMatches palautuu suoraan datasta
  it('palauttaa recentMatches-taulukon', async () => {
    const mockMatches = [
      { id: 'm1', opponent: 'FC Vastus', match_date: '2026-03-20', result_home: 3, result_away: 1 },
    ]
    mockQuery.lt
      .mockResolvedValueOnce({ count: 5, error: null })
      .mockResolvedValueOnce({ count: 2, error: null })
    mockQuery.limit.mockResolvedValueOnce({ data: mockMatches, error: null })

    const { data } = await getSeasonStats('user-1', 'team-1', TODAY)

    expect(data.recentMatches).toHaveLength(1)
    expect(data.recentMatches[0].opponent).toBe('FC Vastus')
  })

  // Ei dataa — palautetaan nollat eikä null
  it('palauttaa nollat kun dataa ei löydy', async () => {
    mockQuery.lt
      .mockResolvedValueOnce({ count: null, error: null })
      .mockResolvedValueOnce({ count: null, error: null })
    mockQuery.limit.mockResolvedValueOnce({ data: null, error: null })

    const { data, error } = await getSeasonStats('user-1', 'team-1', TODAY)

    expect(error).toBeNull()
    expect(data.drillCount).toBe(0)
    expect(data.gameCount).toBe(0)
    expect(data.recentMatches).toEqual([])
  })

  // Virhe Supabasesta — palautetaan { data: null, error }
  it('palauttaa error-objektin kun kysely epäonnistuu', async () => {
    const dbError = new Error('connection refused')
    mockQuery.lt.mockRejectedValueOnce(dbError)

    const { data, error } = await getSeasonStats('user-1', 'team-1', TODAY)

    expect(data).toBeNull()
    expect(error).toBe(dbError)
  })
})
