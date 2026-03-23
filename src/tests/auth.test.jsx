// Autentikaatiotestit — kriittisin osa sovellusta
// Testataan kirjautuminen, rekisteröinti ja uloskirjautuminen

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AuthPage from '../components/auth/AuthPage'
import { useAuth } from '../hooks/useAuth'

// Mockataan useAuth hook — emme tarvitse oikeaa Supabase-yhteyttä yksikkötesteissä
vi.mock('../hooks/useAuth')

// Mockataan react-i18next jotta lokalisaatio ei hankaloita testejä
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key, // palautetaan avain sellaisenaan
  }),
}))

// Apufunktio: renderöi AuthPage React Routerin muistissa (ei URL-muutoksia)
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

  // Testataan että kirjautumislomake renderöityy oikein
  it('näyttää kirjautumislomakkeen', () => {
    useAuth.mockReturnValue({
      signIn: vi.fn(),
      signUp: vi.fn(),
      user: null,
    })

    renderAuthPage()

    // Lomakkeen kentät löytyvät DOM:sta
    expect(screen.getByPlaceholderText('valmentaja@seura.fi')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
  })

  // Testataan että kirjautuminen kutsuu signIn:iä oikeilla arvoilla
  it('kutsuu signIn:iä oikeilla tunnuksilla', async () => {
    const mockSignIn = vi.fn().mockResolvedValue({ error: null })
    useAuth.mockReturnValue({
      signIn: mockSignIn,
      signUp: vi.fn(),
      user: null,
    })

    renderAuthPage()

    // Täytä lomake
    fireEvent.change(screen.getByPlaceholderText('valmentaja@seura.fi'), {
      target: { value: 'testi@email.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'salasana123' },
    })

    // Lähetä lomake
    fireEvent.click(screen.getByRole('button', { name: 'auth.login' }))

    // signIn kutsuttiin oikeilla arvoilla
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('testi@email.com', 'salasana123')
    })
  })

  // Testataan että virheviesti näytetään väärillä tunnuksilla
  it('näyttää virheviestin epäonnistuneen kirjautumisen jälkeen', async () => {
    const mockSignIn = vi.fn().mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    })
    useAuth.mockReturnValue({
      signIn: mockSignIn,
      signUp: vi.fn(),
      user: null,
    })

    renderAuthPage()

    fireEvent.change(screen.getByPlaceholderText('valmentaja@seura.fi'), {
      target: { value: 'testi@email.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'vaara' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'auth.login' }))

    // Virheviesti ilmestyy
    await waitFor(() => {
      expect(screen.getByText('Invalid login credentials')).toBeInTheDocument()
    })
  })

  // Testataan lomakkeen vaihto rekisteröintitilaan
  it('vaihtaa rekisteröintitilaan linkkiä klikatessa', () => {
    useAuth.mockReturnValue({
      signIn: vi.fn(),
      signUp: vi.fn(),
      user: null,
    })

    renderAuthPage()

    // Klikataan "vaihda tilaan rekisteröinti" -linkkiä
    fireEvent.click(screen.getByText('auth.switchToRegister'))

    // Rekisteröintitilan nappi näkyy
    expect(screen.getByRole('button', { name: 'auth.register' })).toBeInTheDocument()
  })

  // Testataan rekisteröinti — onnistunut rekisteröinti näyttää viestin
  it('näyttää varmistusviestin onnistuneen rekisteröinnin jälkeen', async () => {
    const mockSignUp = vi.fn().mockResolvedValue({ error: null })
    useAuth.mockReturnValue({
      signIn: vi.fn(),
      signUp: mockSignUp,
      user: null,
    })

    renderAuthPage()

    // Vaihda rekisteröintitilaan
    fireEvent.click(screen.getByText('auth.switchToRegister'))

    // Täytä ja lähetä
    fireEvent.change(screen.getByPlaceholderText('valmentaja@seura.fi'), {
      target: { value: 'uusi@email.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'uusiSalasana123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'auth.register' }))

    // Vahvistusviesti näytetään
    await waitFor(() => {
      expect(screen.getByText('auth.checkEmail')).toBeInTheDocument()
    })
  })
})
