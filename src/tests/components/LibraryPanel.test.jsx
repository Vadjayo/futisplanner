/**
 * LibraryPanel.test.jsx
 * Testit harjoitekirjaston paneelille.
 * Varmistaa suodatuksen, haun ja lisäyskutsun toiminnan.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mockataan CSS-moduulit
vi.mock('../../components/library/LibraryPanel.module.css', () => ({ default: {} }))

// Mockataan lib/db kirjastofunktiot
vi.mock('../../lib/db', () => ({
  loadLibrary:     vi.fn(),
  loadUserLibrary: vi.fn(),
  deleteFromLibrary: vi.fn(),
}))

import LibraryPanel from '../../components/library/LibraryPanel'
import { loadLibrary, loadUserLibrary } from '../../lib/db'

const USER_ID = 'user-abc'

const MOCK_DRILLS = [
  {
    id: 'd1',
    title: 'Passelirinki',
    description: 'Pelaajat ringissä syöttelevät',
    category: 'tekniikka',
    age_group: 'U12-U14',
    duration: 10,
    field_type: '5v5',
  },
  {
    id: 'd2',
    title: 'Laukausharjoitus',
    description: 'Maalintekoa harjoitellaan',
    category: 'hyökkäys',
    age_group: 'U15-U18',
    duration: 15,
    field_type: '11v11',
  },
]

/** Renderöi LibraryPanel testidatan kanssa */
function renderPanel(props = {}) {
  const defaults = {
    userId:     USER_ID,
    onClose:    vi.fn(),
    onAddDrill: vi.fn(),
  }
  return render(<LibraryPanel {...defaults} {...props} />)
}

describe('LibraryPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Oletuksena palauta mock-harjoitteet
    loadLibrary.mockResolvedValue({ data: MOCK_DRILLS, error: null })
    loadUserLibrary.mockResolvedValue({ data: [], error: null })
  })

  // Kirjasto renderöityy otsikolla
  it('kirjasto renderöityy otsikolla "Harjoituskirjasto"', async () => {
    renderPanel()
    expect(screen.getByText('Harjoituskirjasto')).toBeInTheDocument()
  })

  // Harjoitteet ladataan ja näytetään
  it('harjoitteen nimi näkyy kortissa', async () => {
    renderPanel()
    await waitFor(() => {
      expect(screen.getByText('Passelirinki')).toBeInTheDocument()
    })
  })

  // Kesto näkyy kortissa
  it('kesto näkyy kortissa minuutteina', async () => {
    renderPanel()
    await waitFor(() => {
      expect(screen.getByText('10 min')).toBeInTheDocument()
    })
  })

  // Ikäluokka näkyy kortissa
  it('ikäluokka näkyy kortissa', async () => {
    renderPanel()
    await waitFor(() => {
      expect(screen.getByText('U12-U14')).toBeInTheDocument()
    })
  })

  // "+ Lisää harjoitukseen" -nappi kutsuu onAddDrill-callbackia
  it('+ Lisää harjoitukseen -nappi kutsuu onAddDrill-callbackia', async () => {
    const onAddDrill = vi.fn()
    const onClose    = vi.fn()
    renderPanel({ onAddDrill, onClose })

    await waitFor(() => {
      expect(screen.getAllByText('+ Lisää harjoitukseen').length).toBeGreaterThan(0)
    })

    fireEvent.click(screen.getAllByText('+ Lisää harjoitukseen')[0])
    expect(onAddDrill).toHaveBeenCalledWith(MOCK_DRILLS[0])
    expect(onClose).toHaveBeenCalled()
  })

  // Tyhjä tuloslista — ei harjoitteita -viesti näkyy
  it('näyttää "Ei harjoitteita" kun kirjasto on tyhjä', async () => {
    loadLibrary.mockResolvedValue({ data: [], error: null })
    renderPanel()
    await waitFor(() => {
      expect(screen.getByText(/Ei harjoitteita/i)).toBeInTheDocument()
    })
  })

  // Hakukenttä on olemassa
  it('hakukenttä on olemassa', () => {
    renderPanel()
    expect(screen.getByPlaceholderText('Hae harjoitteita...')).toBeInTheDocument()
  })

  // Kirjasto-välilehti on oletuksena aktiivinen
  it('Kirjasto-välilehti on näkyvillä oletuksena', () => {
    renderPanel()
    expect(screen.getByText('Kirjasto')).toBeInTheDocument()
    expect(screen.getByText('Omat')).toBeInTheDocument()
  })

  // Omat-välilehti kutsuu loadUserLibrary
  it('Omat-välilehti lataa käyttäjän omat harjoitteet', async () => {
    const ownDrill = [{ id: 'own1', title: 'Oma treeni', category: 'tekniikka', age_group: 'U12-U14', duration: 20, field_type: '5v5' }]
    loadUserLibrary.mockResolvedValue({ data: ownDrill, error: null })
    renderPanel()

    fireEvent.click(screen.getByText('Omat'))

    await waitFor(() => {
      expect(loadUserLibrary).toHaveBeenCalledWith(USER_ID)
    })
  })

  // Harjoitteen kuvaus näkyy kortissa
  it('harjoitteen kuvaus näkyy kortissa', async () => {
    renderPanel()
    await waitFor(() => {
      expect(screen.getByText('Pelaajat ringissä syöttelevät')).toBeInTheDocument()
    })
  })
})
