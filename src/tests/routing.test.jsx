/**
 * routing.test.jsx
 * Testit reitityksen ja suojattujen reittien toiminnalle.
 * Varmistaa kirjautumaton ohjaus /login -sivulle.
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'

// Mockataan useAuth
const mockUseAuth = vi.fn()
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

// Mockataan LoadingSpinner
vi.mock('../../components/ui/LoadingSpinner', () => ({
  default: () => <div>Ladataan...</div>,
}))

// Mockataan TeamProvider jotta App voidaan renderöidä ilman Supabase-kyselyjä
vi.mock('../../store/teamStore', () => ({
  TeamProvider:  ({ children }) => <>{children}</>,
  useCurrentTeam: vi.fn(() => ({ currentTeam: null, switchTeam: vi.fn() })),
}))

// Reittivartijat — kopioidaan App.jsx:stä testiin jotta ei tarvita koko sovellusta
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner fullPage />
  if (!user)   return <Navigate to={ROUTES.LOGIN} replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner fullPage />
  if (user)    return <Navigate to={ROUTES.DASHBOARD} replace />
  return children
}

/** Renderöi reitin MemoryRouterissa annetulla alkupolulla */
function renderRoute(initialPath, element) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path={ROUTES.LOGIN}     element={<div>Kirjautumissivu</div>} />
        <Route path={ROUTES.DASHBOARD} element={<div>Dashboard</div>} />
        <Route path={initialPath}      element={element} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Reititys ja suojatut reitit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Kirjautumaton käyttäjä ohjataan /login -sivulle
  it('kirjautumaton käyttäjä ohjataan /login', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false })

    renderRoute('/dashboard', <ProtectedRoute><div>Suojattu sisältö</div></ProtectedRoute>)

    expect(screen.getByText('Kirjautumissivu')).toBeInTheDocument()
    expect(screen.queryByText('Suojattu sisältö')).not.toBeInTheDocument()
  })

  // Kirjautunut käyttäjä pääsee suojattuun reittiin
  it('kirjautunut käyttäjä pääsee suojattuun reittiin', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' }, loading: false })

    renderRoute('/dashboard', <ProtectedRoute><div>Suojattu sisältö</div></ProtectedRoute>)

    expect(screen.getByText('Suojattu sisältö')).toBeInTheDocument()
  })

  // Latauksen aikana näytetään spinner
  it('latauksen aikana näytetään latausindikaattori', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true })

    renderRoute('/dashboard', <ProtectedRoute><div>Sisältö</div></ProtectedRoute>)

    expect(screen.getByText('Ladataan...')).toBeInTheDocument()
  })

  // Kirjautunut käyttäjä ohjataan pois auth-sivuilta dashboardille
  it('kirjautunut käyttäjä ohjataan auth-sivulta dashboardille', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' }, loading: false })

    renderRoute('/login', <PublicRoute><div>Kirjautumissivu</div></PublicRoute>)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Kirjautumissivu')).not.toBeInTheDocument()
  })

  // Kirjautumaton käyttäjä näkee auth-sivun normaalisti
  it('kirjautumaton käyttäjä voi katsoa kirjautumissivua', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false })

    renderRoute('/login', <PublicRoute><div>Login-lomake</div></PublicRoute>)

    expect(screen.getByText('Login-lomake')).toBeInTheDocument()
  })

  // ROUTES.LOGIN -vakio on '/login'
  it('ROUTES.LOGIN on /login', () => {
    expect(ROUTES.LOGIN).toBe('/login')
  })

  // ROUTES.DASHBOARD -vakio on '/dashboard'
  it('ROUTES.DASHBOARD on /dashboard', () => {
    expect(ROUTES.DASHBOARD).toBe('/dashboard')
  })

  // ROUTES.EDITOR -vakio on '/editor'
  it('ROUTES.EDITOR on /editor', () => {
    expect(ROUTES.EDITOR).toBe('/editor')
  })

  // ROUTES.SEASON -vakio on '/kausisuunnittelu'
  it('ROUTES.SEASON on /kausisuunnittelu', () => {
    expect(ROUTES.SEASON).toBe('/kausisuunnittelu')
  })

  // ROUTES.MATCH_DAY -vakio on '/pelipäivä'
  it('ROUTES.MATCH_DAY on /pelipäivä', () => {
    expect(ROUTES.MATCH_DAY).toBe('/pelipäivä')
  })
})
