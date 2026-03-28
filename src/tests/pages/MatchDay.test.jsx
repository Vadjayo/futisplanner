/**
 * MatchDay.test.jsx
 * Testit Pelipäivä-sivulle (MatchDayPage).
 * Hookit ja lapsikomponentit mockataan — testataan sivu-tason logiikkaa.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// CSS-moduulit
vi.mock('../../components/matchday/MatchDay.module.css', () => ({ default: {} }))

// Mockataan lapsikomponentit
vi.mock('../../components/matchday/MatchHeader',        () => ({ default: (p) => <div data-testid="match-header">{p.opponent}</div> }))
vi.mock('../../components/matchday/FormationSelector',  () => ({ default: ({ formation, onChange }) => <select data-testid="formation-selector" value={formation} onChange={(e) => onChange(e.target.value)}><option value="4-3-3">4-3-3</option></select> }))
vi.mock('../../components/matchday/FormationTemplates', () => ({ default: () => <div data-testid="formation-templates" /> }))
vi.mock('../../components/matchday/MatchFieldCanvas',   () => ({ default: () => <div data-testid="match-field" /> }))
vi.mock('../../components/matchday/PlayerLists',        () => ({ default: () => <div data-testid="player-lists" /> }))
vi.mock('../../components/matchday/TacticsPanel',       () => ({ default: () => <div data-testid="tactics-panel" /> }))
vi.mock('../../components/matchday/NotesPanel',         () => ({ default: () => <div data-testid="notes-panel" /> }))
vi.mock('../../components/matchday/MatchReport',        () => ({ default: () => <div data-testid="match-report" /> }))
vi.mock('../../components/ui/Modal',                    () => ({ default: ({ isOpen, children }) => isOpen ? <div data-testid="modal">{children}</div> : null }))
vi.mock('../../components/ui/Button',                   () => ({ default: ({ children, onClick }) => <button onClick={onClick}>{children}</button> }))
vi.mock('../../components/ui/Toast',                    () => ({ default: () => null }))

// Mockataan hookit
vi.mock('../../hooks/useMatchPlan',         () => ({ useMatchPlan: vi.fn() }))
vi.mock('../../hooks/useFormationTemplates',() => ({ useFormationTemplates: vi.fn() }))
vi.mock('../../hooks/useMatchDayPlayers',   () => ({ useMatchDayPlayers: vi.fn() }))
vi.mock('../../hooks/useToast',             () => ({ useToast: vi.fn() }))
vi.mock('../../store/teamStore',            () => ({ useCurrentTeam: vi.fn() }))

import MatchDayPage          from '../../components/matchday/MatchDayPage'
import { useMatchPlan }        from '../../hooks/useMatchPlan'
import { useFormationTemplates } from '../../hooks/useFormationTemplates'
import { useMatchDayPlayers }  from '../../hooks/useMatchDayPlayers'
import { useToast }            from '../../hooks/useToast'
import { useCurrentTeam }      from '../../store/teamStore'

const MOCK_PLAN = {
  id:         'plan-1',
  opponent:   'OLS U12',
  match_date: '2026-04-05',
  match_time: '13:00',
  formation:  '4-3-3',
  lineup:     [],
  substitutes: [],
  absent:     [],
  goals:      [],
  substitutions: [],
  player_ratings: [],
  tactics_attack:  '',
  tactics_defense: '',
  notes:       '',
}

const MOCK_TEAM = { id: 't1', name: 'HIFK U12' }

const MOCK_PLAYERS = [
  { id: 'p1', name: 'Mikko Mäkinen',  number: 7,  position: 'MF' },
  { id: 'p2', name: 'Janne Korhonen', number: 11, position: 'FW' },
]

function renderPage(path = '/pelipäivä') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/pelipäivä"     element={<MatchDayPage />} />
        <Route path="/pelipäivä/:id" element={<MatchDayPage />} />
        <Route path="/dashboard"     element={<div>Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('MatchDay (MatchDayPage)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useMatchPlan.mockReturnValue({
      plan: MOCK_PLAN, loading: false, dirty: false,
      updateField: vi.fn(), updateLineup: vi.fn(),
      applyFormation: vi.fn(), savePlan: vi.fn().mockResolvedValue({ error: null }),
    })
    useFormationTemplates.mockReturnValue({ templates: [], saveTemplate: vi.fn() })
    useMatchDayPlayers.mockReturnValue({ players: MOCK_PLAYERS })
    useToast.mockReturnValue({ toasts: [], showToast: vi.fn() })
    useCurrentTeam.mockReturnValue({ currentTeam: MOCK_TEAM })
  })

  // Sivu renderöityy
  it('sivu renderöityy', () => {
    const { container } = renderPage()
    expect(container.firstChild).toBeTruthy()
  })

  // "← Takaisin" -nappi näkyy
  it('"← Takaisin" -nappi näkyy', () => {
    renderPage()
    expect(screen.getByText('← Takaisin')).toBeInTheDocument()
  })

  // "Pelipäivä" -otsikko näkyy
  it('"Pelipäivä" -otsikko näkyy', () => {
    renderPage()
    expect(screen.getByText('Pelipäivä')).toBeInTheDocument()
  })

  // Välilehdet näkyvät
  it('välilehdet (Pelaajat, Taktiikat jne.) näkyvät', () => {
    renderPage()
    expect(screen.getByText('Pelaajat')).toBeInTheDocument()
    expect(screen.getByText('Taktiikat')).toBeInTheDocument()
    expect(screen.getByText('Muistiinpanot')).toBeInTheDocument()
    expect(screen.getByText('Otteluraportti')).toBeInTheDocument()
  })

  // Ladataan-teksti näkyy loading-tilassa
  it('ladataan-teksti näkyy latauksen aikana', () => {
    useMatchPlan.mockReturnValue({
      plan: null, loading: true, dirty: false,
      updateField: vi.fn(), updateLineup: vi.fn(),
      applyFormation: vi.fn(), savePlan: vi.fn(),
    })
    renderPage()
    expect(screen.getByText('Ladataan...')).toBeInTheDocument()
  })

  // Tallenna-nappi näkyy
  it('Tallenna-nappi näkyy', () => {
    renderPage()
    expect(screen.getByText('Tallenna')).toBeInTheDocument()
  })

  // Välilehden vaihto toimii — Taktiikat
  it('välilehden vaihto Taktiikat näyttää taktiikat-paneelin', () => {
    renderPage()
    fireEvent.click(screen.getByText('Taktiikat'))
    expect(screen.getByTestId('tactics-panel')).toBeInTheDocument()
  })

  // Välilehden vaihto — Muistiinpanot
  it('välilehden vaihto Muistiinpanot näyttää notes-paneelin', () => {
    renderPage()
    fireEvent.click(screen.getByText('Muistiinpanot'))
    expect(screen.getByTestId('notes-panel')).toBeInTheDocument()
  })

  // Pelaajat haetaan joukkueesta automaattisesti
  it('pelaajat haetaan joukkueen id:llä', () => {
    renderPage()
    expect(useMatchDayPlayers).toHaveBeenCalledWith(MOCK_TEAM.id)
  })

  // Plan=null palauttaa null (ei renderöi)
  it('plan=null ei renderöi sivusisältöä', () => {
    useMatchPlan.mockReturnValue({
      plan: null, loading: false, dirty: false,
      updateField: vi.fn(), updateLineup: vi.fn(),
      applyFormation: vi.fn(), savePlan: vi.fn(),
    })
    const { container } = renderPage()
    // Sivu renderöityy mutta null case näyttää tyhjän
    expect(screen.queryByText('← Takaisin')).not.toBeInTheDocument()
  })
})
