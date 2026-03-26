/**
 * teamStore.test.js
 * Testit TeamProvider-kontekstille ja useCurrentTeam-hookille.
 * Varmistaa että globaali joukkuetila toimii oikein: lataus, valinta, localStorage-persistointi.
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'

// Mockataan riippuvuudet ennen importtia
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ user: { id: 'user-1' } })),
}))

vi.mock('../../services/teamService', () => ({
  getTeams: vi.fn(),
}))

import { TeamProvider, useCurrentTeam } from '../../store/teamStore.jsx'
import { getTeams } from '../../services/teamService'

const MOCK_TEAMS = [
  { id: 'team-1', name: 'FC Testi', age_group: 'U13' },
  { id: 'team-2', name: 'HJK Kasvatus', age_group: 'U15' },
]

/** Wrapper-komponentti renderHookille */
const wrapper = ({ children }) => React.createElement(TeamProvider, null, children)

describe('teamStore — TeamProvider & useCurrentTeam', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    getTeams.mockResolvedValue({ data: MOCK_TEAMS, error: null })
  })

  // Perustapaus: provider renderöityy ja hookki palauttaa kontekstin
  it('lataa joukkueet ja asettaa ensimmäisen oletukseksi', async () => {
    const { result } = renderHook(() => useCurrentTeam(), { wrapper })
    await act(async () => {})
    expect(result.current.currentTeam).toEqual(MOCK_TEAMS[0])
    expect(result.current.teams).toHaveLength(2)
  })

  // localStorage-persistointi: palauttaa tallennetun joukkueen
  it('palauttaa localStorageen tallennetun joukkueen latauksen jälkeen', async () => {
    localStorage.setItem('activeTeamId', 'team-2')
    const { result } = renderHook(() => useCurrentTeam(), { wrapper })
    await act(async () => {})
    expect(result.current.currentTeam).toEqual(MOCK_TEAMS[1])
  })

  // switchTeam päivittää tilan ja tallentaa localStorageen
  it('switchTeam päivittää currentTeamin ja tallentaa localStorageen', async () => {
    const { result } = renderHook(() => useCurrentTeam(), { wrapper })
    await act(async () => {})

    act(() => {
      result.current.switchTeam(MOCK_TEAMS[1])
    })

    expect(result.current.currentTeam).toEqual(MOCK_TEAMS[1])
    expect(localStorage.getItem('activeTeamId')).toBe('team-2')
  })

  // Poistettu localStorage-id — palaa ensimmäiseen joukkueeseen
  it('asettaa ensimmäisen joukkueen jos localStorage-id ei löydy listasta', async () => {
    localStorage.setItem('activeTeamId', 'team-999-ei-ole')
    const { result } = renderHook(() => useCurrentTeam(), { wrapper })
    await act(async () => {})
    expect(result.current.currentTeam).toEqual(MOCK_TEAMS[0])
  })

  // Virhekäsittely: hookki heittää virheen ilman provideria
  it('heittää virheen kun käytetään TeamProvider-kontekstin ulkopuolella', () => {
    expect(() => renderHook(() => useCurrentTeam())).toThrow(
      'useCurrentTeam vaatii TeamProvider-komponentin'
    )
  })
})
