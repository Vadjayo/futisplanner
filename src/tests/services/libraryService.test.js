/**
 * libraryService.test.js
 * Testit harjoitekirjaston haku- ja poisto-operaatioille (lib/db.js).
 * Supabase mockataan — ei oikeaa verkkoa tarvita.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Tarvitaan fresh mock joka testille — käytetään factory-funktiota
function makeMockQuery(resolvedValue) {
  const q = {
    select:  vi.fn(),
    eq:      vi.fn(),
    order:   vi.fn(),
    in:      vi.fn(),
    ilike:   vi.fn(),
    delete:  vi.fn(),
  }
  // Oletuksena kaikki palauttavat itsensä (chaining)
  q.select.mockReturnValue(q)
  q.eq.mockReturnValue(q)
  q.order.mockReturnValue(q)
  q.in.mockReturnValue(q)
  q.ilike.mockReturnValue(q)
  q.delete.mockReturnValue(q)
  // Aseta lopullinen resolvaus haluttuun kohtaan
  if (resolvedValue !== undefined) {
    Object.defineProperty(q, Symbol.toStringTag, { value: 'Promise' })
  }
  return q
}

// Dynaaminen mock — vaihdetaan per testi
let currentMockQuery = makeMockQuery()

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => currentMockQuery),
  },
}))

import { loadLibrary, loadUserLibrary, deleteFromLibrary } from '../../lib/db'
import { supabase } from '../../lib/supabase'

const USER_ID = 'user-123'

const MOCK_DRILLS = [
  { id: 'd1', title: 'Passelirinki', category: 'tekniikka', age_group: 'U12-U14', duration: 10 },
  { id: 'd2', title: 'Maalinteko',   category: 'hyökkäys',  age_group: 'U15-U18', duration: 15 },
]

describe('libraryService (lib/db.js)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // loadLibrary ilman suodattimia hakee kaikki harjoitteet
  it('loadLibrary hakee kaikki harjoitteet ilman suodattimia', async () => {
    currentMockQuery = makeMockQuery()
    // Viimeinen .order() palauttaa Promisen
    currentMockQuery.order
      .mockReturnValueOnce(currentMockQuery)
      .mockResolvedValueOnce({ data: MOCK_DRILLS, error: null })

    const { data, error } = await loadLibrary()

    expect(error).toBeNull()
    expect(data).toHaveLength(2)
  })

  // loadLibrary suodattaa kategorian mukaan (viimeinen kutsu on .eq())
  it('loadLibrary suodattaa kategorian mukaan', async () => {
    currentMockQuery = makeMockQuery()
    currentMockQuery.order
      .mockReturnValueOnce(currentMockQuery)
      .mockReturnValueOnce(currentMockQuery)
    currentMockQuery.eq.mockResolvedValueOnce({ data: [MOCK_DRILLS[0]], error: null })

    const { data, error } = await loadLibrary({ category: 'tekniikka' })

    expect(mockCalledWith(currentMockQuery.eq, 'category', 'tekniikka')).toBe(true)
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
  })

  // loadLibrary suodattaa hakusanan mukaan (ilike)
  it('loadLibrary hakee ilike-suodattimella hakusanalla', async () => {
    currentMockQuery = makeMockQuery()
    currentMockQuery.order
      .mockReturnValueOnce(currentMockQuery)
      .mockReturnValueOnce(currentMockQuery)
    currentMockQuery.ilike.mockResolvedValueOnce({ data: [MOCK_DRILLS[0]], error: null })

    const { data } = await loadLibrary({ search: 'passeli' })

    expect(mockCalledWith(currentMockQuery.ilike, 'title', '%passeli%')).toBe(true)
    expect(data).toHaveLength(1)
  })

  // loadLibrary palauttaa tyhjän arrayn kun ei tuloksia
  it('loadLibrary palauttaa tyhjän arrayn jos ei tuloksia', async () => {
    currentMockQuery = makeMockQuery()
    currentMockQuery.order
      .mockReturnValueOnce(currentMockQuery)
      .mockResolvedValueOnce({ data: [], error: null })

    const { data, error } = await loadLibrary()

    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  // loadLibrary käsittelee Supabase-virheen
  it('loadLibrary palauttaa virheen kun Supabase epäonnistuu', async () => {
    const dbError = { message: 'connection error' }
    currentMockQuery = makeMockQuery()
    currentMockQuery.order
      .mockReturnValueOnce(currentMockQuery)
      .mockResolvedValueOnce({ data: null, error: dbError })

    const { data, error } = await loadLibrary()

    expect(data).toBeNull()
    expect(error).toBe(dbError)
  })

  // loadUserLibrary hakee käyttäjän omat harjoitteet user_id:llä
  it('loadUserLibrary hakee vain käyttäjän omat harjoitteet', async () => {
    currentMockQuery = makeMockQuery()
    // chain: select → eq → order (viimeinen resolvaa)
    currentMockQuery.order.mockResolvedValueOnce({ data: MOCK_DRILLS, error: null })

    const { data, error } = await loadUserLibrary(USER_ID)

    expect(error).toBeNull()
    expect(mockCalledWith(currentMockQuery.eq, 'user_id', USER_ID)).toBe(true)
    expect(data).toHaveLength(2)
  })

  // loadUserLibrary palauttaa tyhjän kun ei omia harjoitteita
  it('loadUserLibrary palauttaa tyhjän arrayn kun ei omia harjoitteita', async () => {
    currentMockQuery = makeMockQuery()
    currentMockQuery.order.mockResolvedValueOnce({ data: [], error: null })

    const { data } = await loadUserLibrary(USER_ID)

    expect(data).toEqual([])
  })

  // deleteFromLibrary poistaa harjoitteen user_id-suodattimella
  it('deleteFromLibrary poistaa harjoitteen user_id-suodattimella', async () => {
    currentMockQuery = makeMockQuery()
    // chain: delete → eq(id) → eq(user_id) → resolve
    currentMockQuery.eq
      .mockReturnValueOnce(currentMockQuery)
      .mockResolvedValueOnce({ error: null })

    const { error } = await deleteFromLibrary('drill-1', USER_ID)

    expect(error).toBeNull()
    expect(currentMockQuery.delete).toHaveBeenCalled()
  })

  // deleteFromLibrary välittää molemmat suodattimet
  it('deleteFromLibrary välittää user_id-suodattimen kyselyyn', async () => {
    currentMockQuery = makeMockQuery()
    currentMockQuery.eq
      .mockReturnValueOnce(currentMockQuery)
      .mockResolvedValueOnce({ error: null })

    await deleteFromLibrary('drill-1', USER_ID)

    const eqCalls = currentMockQuery.eq.mock.calls
    expect(eqCalls.some(([f, v]) => f === 'id' && v === 'drill-1')).toBe(true)
    expect(eqCalls.some(([f, v]) => f === 'user_id' && v === USER_ID)).toBe(true)
  })

  // loadLibrary ikäluokkasuodatin käyttää in()-operaattoria
  it('loadLibrary ikäluokkasuodatin sisältää valitun ikäluokan ja "kaikki"', async () => {
    currentMockQuery = makeMockQuery()
    currentMockQuery.order
      .mockReturnValueOnce(currentMockQuery)
      .mockReturnValueOnce(currentMockQuery)
    currentMockQuery.in.mockResolvedValueOnce({ data: MOCK_DRILLS, error: null })

    const { data } = await loadLibrary({ ageGroup: 'U12-U14' })

    expect(mockCalledWith(currentMockQuery.in, 'age_group', ['U12-U14', 'kaikki'])).toBe(true)
    expect(data).toHaveLength(2)
  })
})

/** Tarkistaa onko mock-funktiota kutsuttu tietyillä argumenteilla */
function mockCalledWith(mockFn, ...args) {
  return mockFn.mock.calls.some((call) =>
    args.every((arg, i) => JSON.stringify(call[i]) === JSON.stringify(arg))
  )
}
