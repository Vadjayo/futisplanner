/**
 * Teams.test.jsx
 * Testit joukkueiden hallintasivulle (TeamsPage).
 * Hookit ja lapsikomponentit mockataan.
 */

import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

// CSS-moduulit
vi.mock('../../pages/Teams.module.css', () => ({ default: {} }))

// Mockataan lapsikomponentit
vi.mock('../../components/teams/TeamSidebar', () => ({ default: ({ teams, onSelect }) => (
  <div data-testid="team-sidebar">
    {teams.map((t) => <div key={t.id}>{t.name}</div>)}
  </div>
)}))
vi.mock('../../components/teams/TeamHeader',      () => ({ default: (p) => <div data-testid="team-header">{p.team?.name}</div> }))
vi.mock('../../components/teams/PlayerTable',     () => ({ default: ({ players }) => (
  <div data-testid="player-table">{players.map((p) => <div key={p.id}>{p.name}</div>)}</div>
)}))
vi.mock('../../components/teams/PlayerFieldView', () => ({ default: () => <div data-testid="field-view" /> }))
vi.mock('../../components/teams/PlayerModal',     () => ({ default: () => null }))
vi.mock('../../components/teams/TeamModal',       () => ({ default: () => null }))
vi.mock('../../components/teams/CSVImport',       () => ({ default: () => null }))
vi.mock('../../components/ui/Modal',              () => ({ default: ({ isOpen, children }) => isOpen ? <div data-testid="modal">{children}</div> : null }))
vi.mock('../../components/ui/Toast',              () => ({ default: () => null }))
vi.mock('../../components/ui/LoadingSpinner',     () => ({ default: () => <div>Ladataan...</div> }))
vi.mock('../../components/ui/Button',             () => ({ default: ({ children, onClick }) => <button onClick={onClick}>{children}</button> }))

// Mockataan hookit
vi.mock('../../hooks/useTeams',    () => ({ useTeams: vi.fn() }))
vi.mock('../../hooks/usePlayers',  () => ({ usePlayers: vi.fn() }))
vi.mock('../../hooks/useToast',    () => ({ useToast: vi.fn() }))
vi.mock('../../store/teamStore',   () => ({ useCurrentTeam: vi.fn() }))

import TeamsPage        from '../../pages/Teams'
import { useTeams }     from '../../hooks/useTeams'
import { usePlayers }   from '../../hooks/usePlayers'
import { useToast }     from '../../hooks/useToast'
import { useCurrentTeam } from '../../store/teamStore'

const MOCK_TEAMS = [
  { id: 't1', name: 'HIFK U12', phases: [], goals: [] },
  { id: 't2', name: 'HIFK U14', phases: [], goals: [] },
]

const MOCK_PLAYERS = [
  { id: 'p1', name: 'Mikko Mäkinen',  number: 7,  position: 'MF' },
  { id: 'p2', name: 'Janne Korhonen', number: 11, position: 'FW' },
]

function renderPage() {
  return render(
    <MemoryRouter>
      <TeamsPage />
    </MemoryRouter>
  )
}

describe('Teams (TeamsPage)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useTeams.mockReturnValue({
      teams: MOCK_TEAMS,
      selectedTeam: MOCK_TEAMS[0],
      selectedId: 't1',
      loading: false,
      selectTeam: vi.fn(),
      createTeam: vi.fn().mockResolvedValue({ data: {}, error: null }),
      updateTeam: vi.fn().mockResolvedValue({ error: null }),
      deleteTeam: vi.fn().mockResolvedValue({ error: null }),
    })
    usePlayers.mockReturnValue({
      players: MOCK_PLAYERS,
      loading: false,
      createPlayer: vi.fn().mockResolvedValue({ data: {}, error: null }),
      updatePlayer: vi.fn().mockResolvedValue({ error: null }),
      deletePlayer: vi.fn().mockResolvedValue({ error: null }),
    })
    useToast.mockReturnValue({ toasts: [], showToast: vi.fn() })
    useCurrentTeam.mockReturnValue({ switchTeam: vi.fn() })
  })

  // Sivu renderöityy
  it('sivu renderöityy', () => {
    const { container } = renderPage()
    expect(container.firstChild).toBeTruthy()
  })

  // "Joukkueet" -otsikko navigaatiossa
  it('"Joukkueet" otsikko näkyy', () => {
    renderPage()
    expect(screen.getByText('Joukkueet')).toBeInTheDocument()
  })

  // "← Takaisin" -nappi näkyy
  it('"← Takaisin" -nappi näkyy', () => {
    renderPage()
    expect(screen.getByText('← Takaisin')).toBeInTheDocument()
  })

  // Joukkuelista renderöityy
  it('joukkuelista näkyy sivupalkissa', () => {
    renderPage()
    expect(screen.getByTestId('team-sidebar')).toBeInTheDocument()
  })

  // Joukkueiden nimet näkyvät listassa
  it('joukkueiden nimet näkyvät listassa', () => {
    renderPage()
    // getAllByText käytetään koska nimi voi esiintyä myös TeamHeader-mockissa
    expect(screen.getAllByText('HIFK U12').length).toBeGreaterThan(0)
    expect(screen.getAllByText('HIFK U14').length).toBeGreaterThan(0)
  })

  // "+ Luo joukkue" -nappi näkyy kun joukkuetta ei ole valittuna
  it('"+ Luo joukkue" -nappi näkyy tyhjätilassa', () => {
    useTeams.mockReturnValue({
      teams: MOCK_TEAMS,
      selectedTeam: null,
      selectedId: null,
      loading: false,
      selectTeam: vi.fn(),
      createTeam: vi.fn().mockResolvedValue({ data: {}, error: null }),
      updateTeam: vi.fn().mockResolvedValue({ error: null }),
      deleteTeam: vi.fn().mockResolvedValue({ error: null }),
    })
    renderPage()
    expect(screen.getByText('+ Luo joukkue')).toBeInTheDocument()
  })

  // Pelaajat haetaan valitulle joukkueelle
  it('pelaajat haetaan valitulle joukkueelle', () => {
    renderPage()
    expect(usePlayers).toHaveBeenCalledWith('t1')
  })

  // Pelaajataulukko renderöityy
  it('pelaajataulukko renderöityy', () => {
    renderPage()
    expect(screen.getByTestId('player-table')).toBeInTheDocument()
  })

  // Pelaajien nimet näkyvät taulukossa
  it('pelaajien nimet näkyvät taulukossa', () => {
    renderPage()
    expect(screen.getByText('Mikko Mäkinen')).toBeInTheDocument()
    expect(screen.getByText('Janne Korhonen')).toBeInTheDocument()
  })

  // Lataustila näyttää spinnerin
  it('lataustila näyttää latausindikaattorin', () => {
    useTeams.mockReturnValue({
      teams: [], selectedTeam: null, selectedId: null,
      loading: true, selectTeam: vi.fn(), createTeam: vi.fn(),
      updateTeam: vi.fn(), deleteTeam: vi.fn(),
    })
    renderPage()
    expect(screen.getByText('Ladataan...')).toBeInTheDocument()
  })
})
