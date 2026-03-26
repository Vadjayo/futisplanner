/**
 * TodayBanner.test.jsx
 * Testit dashboard/TodayBanner-komponentille.
 * Varmistaa tilastojen laskennan ja UI:n oikeellisuuden — erityisesti drillsPerWeek-korjaus.
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import TodayBanner from '../../components/dashboard/TodayBanner'

// CSS-moduulit eivät toimi testissä — mockataan ne
vi.mock('../../components/dashboard/TodayBanner.module.css', () => ({ default: {} }))

/** Renderöi TodayBanner MemoryRouterissa */
function renderBanner(props = {}) {
  const defaults = {
    loading:     false,
    nextDrill:   null,
    nextGame:    null,
    drillCount:  0,
    gameCount:   0,
    team:        null,
    onOpenEditor: vi.fn(),
    onNewDrill:   vi.fn(),
    onMatchDay:   vi.fn(),
  }
  return render(
    <MemoryRouter>
      <TodayBanner {...defaults} {...props} />
    </MemoryRouter>
  )
}

describe('TodayBanner', () => {
  // loading=true näyttää skeleton-kortit
  it('näyttää skeleton-kortit kun loading=true', () => {
    const { container } = renderBanner({ loading: true })
    // Skeleton-kortit eivät sisällä oikeaa tekstiä
    expect(screen.queryByText('Seuraava treeni')).not.toBeInTheDocument()
    expect(container.firstChild).toBeTruthy()
  })

  // drillCount=0 → '0×' eikä '–'
  it('näyttää "0×" kun drillCount on 0 (ei enää "–")', () => {
    renderBanner({ drillCount: 0 })
    expect(screen.getByText('0×')).toBeInTheDocument()
  })

  // drillCount>0 ilman faaseja → numero (ei '–')
  it('näyttää numeerisen arvon eikä "–" kun drillCount > 0 ja faaseja ei ole', () => {
    // 10 treeniä, ei faaseja → lasketaan tämän vuoden alusta
    renderBanner({ drillCount: 10, team: { phases: [] } })
    // Arvon tulee olla numeerinen (päättyy ×), ei '–'
    const stat = screen.getByText(/\d+[.,]?\d*×/)
    expect(stat).toBeInTheDocument()
    expect(screen.queryByText('–')).not.toBeInTheDocument()
  })

  // Seuraava treeni näkyy kun nextDrill annetaan
  it('näyttää seuraavan treenin tiedot kun nextDrill on asetettu', () => {
    renderBanner({
      nextDrill: { date: '2026-04-01', time: '17:00:00', theme: 'Passausharjoitus' },
    })
    expect(screen.getByText('Passausharjoitus')).toBeInTheDocument()
    expect(screen.getByText('Suunnittele →')).toBeInTheDocument()
  })

  // Seuraava ottelu näkyy kun nextGame annetaan
  it('näyttää seuraavan ottelun tiedot kun nextGame on asetettu', () => {
    renderBanner({
      nextGame: { date: '2026-04-05', time: '14:00:00', title: 'FC Testi vs HJK' },
    })
    expect(screen.getByText('FC Testi vs HJK')).toBeInTheDocument()
    expect(screen.getByText('Pelipäivä →')).toBeInTheDocument()
  })
})
