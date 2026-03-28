/**
 * Dashboard.test.jsx
 * Testit Dashboard-sivulle.
 * Hookit ja lapsikomponentit mockataan — testataan vain Dashboard-tason logiikkaa.
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

// CSS-moduulit
vi.mock('../../components/dashboard/Dashboard.module.css', () => ({ default: {} }))

// Mockataan kaikki lapsikomponentit jotta ei tarvita niiden riippuvuuksia
vi.mock('../../components/dashboard/TodayBanner',    () => ({ default: () => <div data-testid="today-banner">TodayBanner</div> }))
vi.mock('../../components/dashboard/RecentSessions', () => ({ default: () => <div data-testid="recent-sessions">RecentSessions</div> }))
vi.mock('../../components/dashboard/WeekCalendar',   () => ({ default: () => <div data-testid="week-calendar">WeekCalendar</div> }))
vi.mock('../../components/dashboard/QuickActions',   () => ({ default: () => <div data-testid="quick-actions">QuickActions</div> }))
vi.mock('../../components/dashboard/SeasonGoalTags', () => ({ default: () => <div data-testid="season-goals">SeasonGoalTags</div> }))
vi.mock('../../components/dashboard/RecentMatches',  () => ({ default: () => <div data-testid="recent-matches">RecentMatches</div> }))

// Mockataan hookit
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))
vi.mock('../../hooks/useDashboard', () => ({
  useDashboard: vi.fn(),
}))
vi.mock('../../store/teamStore', () => ({
  useCurrentTeam: vi.fn(),
}))

import Dashboard from '../../components/dashboard/Dashboard'
import { useAuth }        from '../../hooks/useAuth'
import { useDashboard }   from '../../hooks/useDashboard'
import { useCurrentTeam } from '../../store/teamStore'

const MOCK_USER = {
  id: 'user-1',
  email: 'valmentaja@hifk.fi',
  user_metadata: { full_name: 'Mikko Valmentaja' },
}

const MOCK_DATA = {
  sessions:    [],
  recentMatches: [],
  nextDrill:   null,
  nextGame:    null,
  drillCount:  7,
  gameCount:   2,
  weekEvents:  [],
  goals:       [],
}

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  )
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({ user: MOCK_USER, loading: false, signOut: vi.fn() })
    useDashboard.mockReturnValue({ data: MOCK_DATA, loading: false, error: null, reload: vi.fn() })
    useCurrentTeam.mockReturnValue({ currentTeam: null })
  })

  // Dashboard renderöityy
  it('sivu renderöityy', () => {
    const { container } = renderDashboard()
    expect(container.firstChild).toBeTruthy()
  })

  // Tervehdys näyttää käyttäjän nimen
  it('"Hei, [nimi]" tervehdys näkyy', () => {
    renderDashboard()
    expect(screen.getByText(/Hei, Mikko Valmentaja/)).toBeInTheDocument()
  })

  // Käyttäjän sähköposti näkyy navigaatiossa
  it('käyttäjän sähköposti näkyy navigaatiossa', () => {
    renderDashboard()
    expect(screen.getByText('valmentaja@hifk.fi')).toBeInTheDocument()
  })

  // TodayBanner-komponentti renderöityy
  it('Seuraava treeni -banneri (TodayBanner) näkyy', () => {
    renderDashboard()
    expect(screen.getByTestId('today-banner')).toBeInTheDocument()
  })

  // RecentSessions-komponentti renderöityy
  it('Viimeisimmät harjoitukset -komponentti näkyy', () => {
    renderDashboard()
    expect(screen.getByTestId('recent-sessions')).toBeInTheDocument()
  })

  // WeekCalendar-komponentti renderöityy
  it('viikkokalenteri näkyy', () => {
    renderDashboard()
    expect(screen.getByTestId('week-calendar')).toBeInTheDocument()
  })

  // Joukkueen nimi näkyy navigaatiossa kun joukkue valittu
  it('joukkueen nimi näkyy kun joukkue on valittuna', () => {
    useCurrentTeam.mockReturnValue({ currentTeam: { id: 't1', name: 'HIFK U12' } })
    renderDashboard()
    expect(screen.getByText('HIFK U12')).toBeInTheDocument()
  })

  // Kirjaudu ulos -nappi näkyy
  it('kirjaudu ulos -nappi näkyy', () => {
    renderDashboard()
    expect(screen.getByText('Kirjaudu ulos')).toBeInTheDocument()
  })

  // Virhetila näyttää virheilmoituksen
  it('virhetila näyttää viestin "Tietojen haku epäonnistui"', () => {
    useDashboard.mockReturnValue({
      data: null, loading: false, error: new Error('virhe'), reload: vi.fn(),
    })
    renderDashboard()
    expect(screen.getByText(/Tietojen haku epäonnistui/)).toBeInTheDocument()
  })

  // FutisPlanner-logo näkyy
  it('FutisPlanner-logo näkyy navigaatiossa', () => {
    renderDashboard()
    // getAllByText käytetään koska "FutisPlanner" esiintyy sekä logossa että onboarding-otsikossa
    expect(screen.getAllByText(/FutisPlanner/).length).toBeGreaterThan(0)
  })
})
