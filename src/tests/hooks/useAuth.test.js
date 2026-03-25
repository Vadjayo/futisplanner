/**
 * useAuth.test.js
 * Yksikkötestit useAuth-hookille.
 * Supabase mockataan — ei oikeaa verkkoa tarvita.
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mockataan supabase ennen hookien importtia
vi.mock('../../services/supabase', () => ({
  supabase: {
    auth: {
      getSession:          vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange:   vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword:  vi.fn(),
      signUp:              vi.fn(),
      signOut:             vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser:          vi.fn(),
    },
  },
}))

import { useAuth } from '../../hooks/useAuth'

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Käyttäjä on null ennen kuin session on tarkistettu
  it('palauttaa null käyttäjän alussa', async () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.user).toBeNull()
  })

  // Hookki palauttaa loading=true ennen session-tarkistusta
  it('asettaa loading=true alussa', () => {
    const { result } = renderHook(() => useAuth())
    // loading on true juuri mounttauksen jälkeen, ennen getSession-resolvausta
    expect(result.current.loading).toBe(true)
  })

  // signIn kutsuu supabasen metodia oikeilla parametreilla
  it('signIn kutsuu supabasea oikeilla tunnuksilla', async () => {
    const { supabase } = await import('../../services/supabase')
    supabase.auth.signInWithPassword.mockResolvedValue({ data: {}, error: null })

    const { result } = renderHook(() => useAuth())
    await act(async () => {
      await result.current.signIn('testi@email.com', 'salasana123')
    })

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'testi@email.com',
      password: 'salasana123',
    })
  })

  // signIn välittää Supabasen virheen kutsujalle
  it('signIn palauttaa virheen epäonnistuessa', async () => {
    const { supabase } = await import('../../services/supabase')
    const mockError = { message: 'Invalid login credentials' }
    supabase.auth.signInWithPassword.mockResolvedValue({ data: null, error: mockError })

    const { result } = renderHook(() => useAuth())
    let response
    await act(async () => {
      response = await result.current.signIn('testi@email.com', 'vaara')
    })

    expect(response.error).toEqual(mockError)
  })

  // signUp lähettää nimen metadatana Supabaselle
  it('signUp lähettää full_name-metadatan', async () => {
    const { supabase } = await import('../../services/supabase')
    supabase.auth.signUp.mockResolvedValue({ data: {}, error: null })

    const { result } = renderHook(() => useAuth())
    await act(async () => {
      await result.current.signUp('uusi@email.com', 'salasana123', 'Matti Meikäläinen')
    })

    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'uusi@email.com',
      password: 'salasana123',
      options: { data: { full_name: 'Matti Meikäläinen' } },
    })
  })
})
