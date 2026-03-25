/**
 * auth.test.jsx
 * Yksikkötestit AuthPage-kirjautumissivulle.
 * AuthPage on pelkkä kirjautumissivu — rekisteröinti on erillinen sivu (RegisterPage).
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AuthPage from '../components/auth/AuthPage'
import { useAuth } from '../hooks/useAuth'

// Mockataan useAuth — ei oikeaa Supabase-yhteyttä yksikkötesteissä
vi.mock('../hooks/useAuth')

// Apufunktio: renderöi AuthPage React Routerin muistissa
function renderAuthPage() {
  return render(
    <MemoryRouter>
      <AuthPage />
    </MemoryRouter>
  )
}

describe('AuthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Kirjautumislomake renderöityy oikein
  it('näyttää kirjautumislomakkeen', () => {
    useAuth.mockReturnValue({ signIn: vi.fn(), user: null })
    renderAuthPage()

    expect(screen.getByPlaceholderText('valmentaja@seura.fi')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Kirjaudu sisään' })).toBeInTheDocument()
  })

  // Kirjautuminen kutsuu signIn:iä oikeilla arvoilla
  it('kutsuu signIn:iä oikeilla tunnuksilla', async () => {
    const mockSignIn = vi.fn().mockResolvedValue({ error: null })
    useAuth.mockReturnValue({ signIn: mockSignIn, user: null })

    renderAuthPage()

    fireEvent.change(screen.getByPlaceholderText('valmentaja@seura.fi'), {
      target: { value: 'testi@email.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'salasana123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Kirjaudu sisään' }))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('testi@email.com', 'salasana123')
    })
  })

  // Virheviesti näytetään väärillä tunnuksilla
  it('näyttää virheviestin epäonnistuneen kirjautumisen jälkeen', async () => {
    const mockSignIn = vi.fn().mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    })
    useAuth.mockReturnValue({ signIn: mockSignIn, user: null })

    renderAuthPage()

    fireEvent.change(screen.getByPlaceholderText('valmentaja@seura.fi'), {
      target: { value: 'testi@email.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'vaara' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Kirjaudu sisään' }))

    // Virheviesti on käännetty suomeksi mapError-funktiolla
    await waitFor(() => {
      expect(screen.getByText('Sähköposti tai salasana on väärin.')).toBeInTheDocument()
    })
  })

  // Linkki rekisteröintisivulle löytyy
  it('näyttää linkin rekisteröintisivulle', () => {
    useAuth.mockReturnValue({ signIn: vi.fn(), user: null })
    renderAuthPage()

    expect(screen.getByText('Ei vielä tiliä? Luo tili →')).toBeInTheDocument()
  })

  // Linkki unohtunut salasana -sivulle löytyy
  it('näyttää linkin unohtunut salasana -sivulle', () => {
    useAuth.mockReturnValue({ signIn: vi.fn(), user: null })
    renderAuthPage()

    expect(screen.getByText('Unohditko salasanan?')).toBeInTheDocument()
  })
})
