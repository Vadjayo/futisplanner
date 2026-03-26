/**
 * useMatchDayPlayers.test.js
 * Testit useMatchDayPlayers-hookille.
 * Varmistaa että pelaajat haetaan oikein ja tyhjennetään kun teamId puuttuu.
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mockataan riippuvuudet ennen hookki-importtia
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ user: { id: 'user-1' } })),
}))

vi.mock('../../services/playerService', () => ({
  getPlayers: vi.fn(),
}))

import { useMatchDayPlayers } from '../../hooks/useMatchDayPlayers'
import { getPlayers }         from '../../services/playerService'

const MOCK_PLAYERS = [
  { id: 'p1', name: 'Mikko Mäkinen', number: 7,  position: 'MF' },
  { id: 'p2', name: 'Janne Korhonen', number: 11, position: 'FW' },
]

describe('useMatchDayPlayers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Perustapaus: pelaajat haetaan ja palautetaan
  it('hakee pelaajat teamId:n perusteella', async () => {
    getPlayers.mockResolvedValue({ data: MOCK_PLAYERS, error: null })

    const { result } = renderHook(() => useMatchDayPlayers('team-1'))
    await act(async () => {})

    expect(getPlayers).toHaveBeenCalledWith('user-1', 'team-1')
    expect(result.current.players).toHaveLength(2)
    expect(result.current.loading).toBe(false)
  })

  // Tyhjä tila: ei teamId:tä — pelaajat tyhjennetään välittömästi
  it('palauttaa tyhjän taulukon kun teamId on null', async () => {
    const { result } = renderHook(() => useMatchDayPlayers(null))
    await act(async () => {})

    expect(getPlayers).not.toHaveBeenCalled()
    expect(result.current.players).toEqual([])
    expect(result.current.loading).toBe(false)
  })

  // Virhe Supabasesta — pelaajat jäävät tyhjäksi (ei kaadu)
  it('palauttaa tyhjän taulukon kun haku epäonnistuu', async () => {
    getPlayers.mockResolvedValue({ data: null, error: new Error('DB error') })

    const { result } = renderHook(() => useMatchDayPlayers('team-1'))
    await act(async () => {})

    expect(result.current.players).toEqual([])
    expect(result.current.loading).toBe(false)
  })

  // Loading-tila: true mounttauksen hetkellä, false haun jälkeen
  it('asettaa loading=true alussa ja false haun jälkeen', async () => {
    let resolve
    getPlayers.mockReturnValue(new Promise((r) => { resolve = r }))

    const { result } = renderHook(() => useMatchDayPlayers('team-1'))
    expect(result.current.loading).toBe(true)

    await act(async () => {
      resolve({ data: MOCK_PLAYERS, error: null })
    })
    expect(result.current.loading).toBe(false)
  })
})
