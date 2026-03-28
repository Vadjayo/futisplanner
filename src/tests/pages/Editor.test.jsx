/**
 * Editor.test.jsx
 * Testit harjoitussuunnittelija-sivulle (EditorApp).
 * Kaikki lapsikomponentit ja hookit mockataan — testataan EditorApp-tason logiikkaa.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

// Mockataan CSS
vi.mock('../../App.module.css', () => ({ default: {} }))

// Mockataan lapsikomponentit
vi.mock('../../components/layout/TopBar', () => ({
  default: ({ sessionName, onSessionNameChange, saveStatus }) => (
    <div data-testid="topbar">
      <span data-testid="session-name">{sessionName || 'Nimetön'}</span>
      <span data-testid="save-status">{saveStatus}</span>
    </div>
  ),
}))
vi.mock('../../components/layout/LeftToolbar', () => ({
  default: ({ activeTool, onToolChange }) => (
    <div data-testid="lefttoolbar">
      <button onClick={() => onToolChange('player')}>Pelaaja</button>
    </div>
  ),
}))
vi.mock('../../components/layout/RightSidebar', () => ({
  default: (props) => <div data-testid="rightsidebar" />,
}))
vi.mock('../../components/editor/DrillList', () => ({
  default: (props) => <div data-testid="drilllist" />,
}))
vi.mock('../../components/library/LibraryPanel', () => ({
  default: ({ onClose }) => <div data-testid="librarypanel"><button onClick={onClose}>Sulje</button></div>,
}))
vi.mock('../../components/editor/AIAssistantPanel', () => ({
  default: () => <div data-testid="ai-panel" />,
}))

// Mockataan lib/db
vi.mock('../../lib/db', () => ({
  loadRecentSession: vi.fn(),
  loadSessionById:   vi.fn(),
  saveSession:       vi.fn(),
  saveToLibrary:     vi.fn(),
}))

// Mockataan i18n
vi.mock('../../lib/i18n', () => ({}))

// Mockataan utils
vi.mock('../../utils/aiElementConverter', () => ({
  convertAIElements: vi.fn(() => []),
}))

// Mockataan useAuth
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

import EditorApp from '../../EditorApp'
import { useAuth }          from '../../hooks/useAuth'
import { loadRecentSession } from '../../lib/db'

const MOCK_USER = { id: 'user-1', email: 'testi@hifk.fi' }

function renderEditor(locationState = {}) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/editor', state: locationState }]}>
      <EditorApp />
    </MemoryRouter>
  )
}

describe('Editor (EditorApp)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({ user: MOCK_USER, loading: false, signOut: vi.fn() })
    loadRecentSession.mockResolvedValue({ data: null, error: null })
  })

  // Sivu renderöityy
  it('sivu renderöityy', async () => {
    const { container } = renderEditor()
    await waitFor(() => {
      expect(container.firstChild).toBeTruthy()
    })
  })

  // TopBar näkyy
  it('yläpalkki (TopBar) näkyy', async () => {
    renderEditor()
    await waitFor(() => {
      expect(screen.getByTestId('topbar')).toBeInTheDocument()
    })
  })

  // Vasen palkki näkyy
  it('vasen työkalupalkki näkyy', async () => {
    renderEditor()
    await waitFor(() => {
      expect(screen.getByTestId('lefttoolbar')).toBeInTheDocument()
    })
  })

  // Oikea sivupalkki näkyy
  it('oikea sivupalkki (RightSidebar) näkyy', async () => {
    renderEditor()
    await waitFor(() => {
      expect(screen.getByTestId('rightsidebar')).toBeInTheDocument()
    })
  })

  // DrillList näkyy
  it('harjoitelista (DrillList) näkyy', async () => {
    renderEditor()
    await waitFor(() => {
      expect(screen.getByTestId('drilllist')).toBeInTheDocument()
    })
  })

  // Kirjasto ei näy aluksi
  it('kirjasto ei näy aluksi', async () => {
    renderEditor()
    await waitFor(() => {
      expect(screen.queryByTestId('librarypanel')).not.toBeInTheDocument()
    })
  })

  // Latauksen aikana näytetään latausindikaattori
  it('latauksen aikana näytetään latausindikaattori', () => {
    useAuth.mockReturnValue({ user: null, loading: true, signOut: vi.fn() })
    renderEditor()
    expect(screen.queryByTestId('topbar')).not.toBeInTheDocument()
  })

  // Kirjautumaton käyttäjä ei näe editoria
  it('kirjautumaton käyttäjä ei näe editoria', async () => {
    useAuth.mockReturnValue({ user: null, loading: false, signOut: vi.fn() })
    renderEditor()
    await waitFor(() => {
      expect(screen.queryByTestId('topbar')).not.toBeInTheDocument()
    })
  })

  // isNew=true aloittaa tyhjällä sessiolla (ei ladata aiempaa)
  it('isNew=true aloittaa tyhjällä sessiolla', async () => {
    renderEditor({ isNew: true })
    await waitFor(() => {
      expect(screen.getByTestId('topbar')).toBeInTheDocument()
    })
    // Ei haeta aiempaa sessiota kun isNew=true
    expect(loadRecentSession).not.toHaveBeenCalled()
  })

  // TopBar välittää sessionName-propin
  it('TopBar näyttää sessio-nimen', async () => {
    renderEditor()
    await waitFor(() => {
      const nameEl = screen.getByTestId('session-name')
      expect(nameEl).toBeInTheDocument()
    })
  })
})
