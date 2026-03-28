/**
 * SeasonPlanner.test.jsx
 * Testit kausisuunnittelu-sivulle (SeasonPage).
 * Lapsikomponentit ja lib-funktiot mockataan.
 */

import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

// CSS-moduulit
vi.mock('../../components/season/SeasonPage.module.css', () => ({ default: {} }))

// Mockataan lapsikomponentit
vi.mock('../../components/season/TeamInfo',       () => ({ default: (p) => <div data-testid="team-info">{p.team?.name}</div> }))
vi.mock('../../components/season/PhaseTimeline',  () => ({ default: () => <div data-testid="phase-timeline" /> }))
vi.mock('../../components/season/GoalTags',       () => ({ default: () => <div data-testid="goal-tags" /> }))
vi.mock('../../components/season/SeasonCalendar', () => ({ default: () => <div data-testid="season-calendar">Kalenteri</div> }))
vi.mock('../../components/season/TodayBanner',    () => ({ default: () => <div data-testid="today-banner">TodayBanner</div> }))
vi.mock('../../components/ui/Modal',              () => ({ default: ({ isOpen, children }) => isOpen ? <div data-testid="modal">{children}</div> : null }))
vi.mock('../../components/ui/Button',             () => ({ default: ({ children, onClick }) => <button onClick={onClick}>{children}</button> }))

// Mockataan lib/seasonDb
vi.mock('../../lib/seasonDb', () => ({
  loadTeams:   vi.fn(),
  createTeam:  vi.fn(),
  updateTeam:  vi.fn(),
  deleteTeam:  vi.fn(),
  loadEvents:  vi.fn(),
  addEvents:   vi.fn(),
}))

// Mockataan useAuth
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

import SeasonPage from '../../components/season/SeasonPage'
import { useAuth }   from '../../hooks/useAuth'
import { loadTeams, loadEvents } from '../../lib/seasonDb'

const MOCK_USER = { id: 'user-1', email: 'valmentaja@hifk.fi' }

const MOCK_TEAMS = [
  { id: 't1', name: 'HIFK U12', phases: [], goals: [] },
  { id: 't2', name: 'HIFK U14', phases: [], goals: [] },
]

const MOCK_EVENTS = [
  { id: 'e1', team_id: 't1', type: 'drill', date: '2026-04-01', title: 'Viikkoharjoitus' },
  { id: 'e2', team_id: 't1', type: 'game',  date: '2026-04-05', title: 'OLS U12' },
]

function renderPage() {
  return render(
    <MemoryRouter>
      <SeasonPage />
    </MemoryRouter>
  )
}

describe('SeasonPlanner (SeasonPage)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({ user: MOCK_USER, loading: false, signOut: vi.fn() })
    loadTeams.mockResolvedValue({ data: MOCK_TEAMS, error: null })
    loadEvents.mockResolvedValue({ data: MOCK_EVENTS, error: null })
  })

  // Sivu renderöityy
  it('sivu renderöityy', async () => {
    const { container } = renderPage()
    expect(container.firstChild).toBeTruthy()
  })

  // Navigaatio-otsikko näkyy
  it('"Kausisuunnittelu" otsikko näkyy', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Kausisuunnittelu')).toBeInTheDocument()
    })
  })

  // Takaisin-nappi näkyy
  it('"← Suunnitelmat" takaisin-nappi näkyy', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('← Suunnitelmat')).toBeInTheDocument()
    })
  })

  // Kalenteri renderöityy
  it('kalenteri renderöityy', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByTestId('season-calendar')).toBeInTheDocument()
    })
  })

  // TodayBanner renderöityy
  it('TodayBanner renderöityy', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByTestId('today-banner')).toBeInTheDocument()
    })
  })

  // Joukkueet ladataan tietokannasta
  it('joukkueet ladataan tietokannasta', async () => {
    renderPage()
    await waitFor(() => {
      expect(loadTeams).toHaveBeenCalledWith(MOCK_USER.id)
    })
  })

  // Joukkuelista näkyy sivupalkissa
  it('joukkueiden nimet näkyvät listassa', async () => {
    renderPage()
    await waitFor(() => {
      // getAllByText käytetään koska nimi voi esiintyä myös TeamInfo-mockissa
      expect(screen.getAllByText('HIFK U12').length).toBeGreaterThan(0)
    })
  })

  // "Joukkueet" -otsikko näkyy sivupalkissa
  it('"Joukkueet" otsikko näkyy sivupalkissa', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Joukkueet')).toBeInTheDocument()
    })
  })

  // Tapahtumat ladataan kun joukkue on valittu
  it('tapahtumat ladataan valitulle joukkueelle', async () => {
    renderPage()
    await waitFor(() => {
      expect(loadEvents).toHaveBeenCalledWith('t1')
    })
  })

  // Tyhjä joukkuelista näyttää "Ei joukkueita" viestin
  it('tyhjä joukkuelista näyttää "Ei joukkueita" viestin', async () => {
    loadTeams.mockResolvedValue({ data: [], error: null })
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/Ei joukkueita/i)).toBeInTheDocument()
    })
  })
})
