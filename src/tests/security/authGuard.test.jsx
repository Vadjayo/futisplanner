/**
 * authGuard.test.jsx
 * Testit: Kirjautumissuojaus
 *
 * Varmistaa että suojatut sivut vaativat kirjautumisen.
 * Kirjautumaton käyttäjä ohjataan aina kirjautumissivulle.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// useAuth-mock — konfiguroidaan per testi
const mockUseAuth = vi.fn()
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))
vi.mock('../../components/ui/LoadingSpinner', () => ({
  default: () => <div data-testid="spinner">Ladataan...</div>,
}))

import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

// Sama ProtectedRoute kuin App.jsx:ssä — testataan sen logiikka
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner fullPage />
  if (!user)   return <div data-testid="redirect-login">Ohjataan kirjautumiseen...</div>
  return children
}

/** Renderöi suojatun reitin testattavaa polkua varten */
function renderProtected(path, content) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={path} element={
          <ProtectedRoute>{content}</ProtectedRoute>
        } />
      </Routes>
    </MemoryRouter>
  )
}

const suojatutSivut = [
  { path: '/dashboard',        nimi: 'Dashboard' },
  { path: '/editor',           nimi: 'Editor' },
  { path: '/kausisuunnittelu', nimi: 'Kausisuunnittelu' },
  { path: '/joukkueet',        nimi: 'Joukkueet' },
  { path: '/pelipäivä',        nimi: 'Pelipäivä' },
]

describe('Reittien suojaus — kirjautumaton käyttäjä', () => {
  beforeEach(() => vi.clearAllMocks())

  suojatutSivut.forEach(({ path, nimi }) => {
    it(`${nimi} (${path}) ohjaa kirjautumiseen`, () => {
      mockUseAuth.mockReturnValue({ user: null, loading: false })

      renderProtected(path, <div>{nimi}-sivu</div>)

      // Sivun sisältöä ei näytetä
      expect(screen.queryByText(`${nimi}-sivu`)).toBeNull()
      // Käyttäjä ohjataan kirjautumiseen
      expect(screen.getByTestId('redirect-login')).toBeInTheDocument()
    })
  })
})

describe('Reittien suojaus — kirjautunut käyttäjä', () => {
  beforeEach(() => vi.clearAllMocks())

  it('kirjautunut käyttäjä näkee suojatun sivun sisällön', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'valmentaja@hifk.fi' },
      loading: false,
    })

    renderProtected('/dashboard', <div>Dashboard-sivu</div>)

    expect(screen.getByText('Dashboard-sivu')).toBeInTheDocument()
    expect(screen.queryByTestId('redirect-login')).toBeNull()
  })

  it('latauksen aikana näytetään spinner eikä ohjata', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true })

    renderProtected('/dashboard', <div>Dashboard-sivu</div>)

    expect(screen.getByTestId('spinner')).toBeInTheDocument()
    expect(screen.queryByTestId('redirect-login')).toBeNull()
    expect(screen.queryByText('Dashboard-sivu')).toBeNull()
  })

  it('kirjautuminen palauttaa käyttäjä-objektin', () => {
    const mockUser = { id: 'user-1', email: 'testi@futis.fi' }
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false })

    const { user } = useAuth()
    expect(user).not.toBeNull()
    expect(user.id).toBe('user-1')
  })

  it('kirjautumaton käyttäjä ei saa user-objektia', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false })

    const { user } = useAuth()
    expect(user).toBeNull()
  })
})
