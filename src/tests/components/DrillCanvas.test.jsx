/**
 * DrillCanvas.test.jsx
 * Testit DrillCanvas-komponentille.
 * react-konva ei tue jsdom-ympäristöä — Konva-komponentit mockataan.
 * Testataan DrillCanvas:in logiikka ja renderöinti.
 */

import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ResizeObserver ei ole jsdom-ympäristössä — lisätään polyfill
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mockataan react-konva kokonaan (ei toimi jsdom-ympäristössä)
vi.mock('react-konva', () => ({
  Stage:          ({ children, onClick, onMouseDown, onMouseMove, onMouseUp, onWheel }) =>
    <div data-testid="konva-stage" onClick={onClick} onMouseDown={onMouseDown} onWheel={onWheel}>{children}</div>,
  Layer:          ({ children }) => <div data-testid="konva-layer">{children}</div>,
  Group:          ({ children, draggable, onClick }) =>
    <div data-testid="konva-group" data-draggable={draggable} onClick={onClick}>{children}</div>,
  Circle:         (props) => <div data-testid="konva-circle" data-fill={props.fill} />,
  Rect:           (props) => <div data-testid="konva-rect" />,
  RegularPolygon: (props) => <div data-testid="konva-polygon" />,
  Arrow:          (props) => <div data-testid="konva-arrow" />,
  Line:           (props) => <div data-testid="konva-line" />,
  Ellipse:        (props) => <div data-testid="konva-ellipse" />,
  Arc:            (props) => <div data-testid="konva-arc" />,
  Ring:           (props) => <div data-testid="konva-ring" />,
  Text:           (props) => <div data-testid="konva-text">{props.text}</div>,
  Transformer:    () => null,
}))

// Mockataan FieldBackground
vi.mock('../../components/editor/FieldBackground', () => ({
  default: () => <div data-testid="field-background" />,
}))

// Mockataan useAnimationEngine
vi.mock('../../hooks/useAnimationEngine', () => ({
  useAnimationEngine: () => ({
    isPlaying: false, frame: 0,
    playAnim: vi.fn(), pauseAnim: vi.fn(), resetAnim: vi.fn(), resetAll: vi.fn(),
  }),
  getAnimatedPos: (el) => ({ x: el.x, y: el.y }),
}))

// Mockataan CSS
vi.mock('../../components/editor/DrillCanvas.module.css', () => ({ default: {} }))

import DrillCanvas from '../../components/editor/DrillCanvas'

const BASE_PROPS = {
  elements:       [],
  activeTool:     'select',
  toolOptions:    {},
  onChange:       vi.fn(),
  selectedIds:    [],
  onSelectChange: vi.fn(),
  animSelectedId: null,
  onAnimSelect:   vi.fn(),
}

function renderCanvas(props = {}) {
  return render(<DrillCanvas {...BASE_PROPS} {...props} />)
}

describe('DrillCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Kenttä renderöityy
  it('kenttä renderöityy ilman elementtejä', () => {
    const { container } = renderCanvas()
    expect(container.firstChild).toBeTruthy()
  })

  // Konva Stage renderöityy
  it('Konva Stage renderöityy', () => {
    renderCanvas()
    expect(screen.getByTestId('konva-stage')).toBeInTheDocument()
  })

  // Kenttätausta renderöityy
  it('kenttätausta renderöityy', () => {
    renderCanvas()
    expect(screen.getByTestId('field-background')).toBeInTheDocument()
  })

  // Player-elementti renderöityy
  it('player-elementti renderöityy oikein', () => {
    const elements = [{
      id: 'p1', type: 'player', x: 400, y: 200,
      number: 7, team: 'home', rotation: 0,
    }]
    renderCanvas({ elements })
    // Pelaajat renderöityvät Group-elementteinä
    const groups = screen.getAllByTestId('konva-group')
    expect(groups.length).toBeGreaterThan(0)
  })

  // Cone-elementti renderöityy (Ring-elementtinä, ei Group)
  it('cone-elementti renderöityy oikein', () => {
    const elements = [{ id: 'c1', type: 'cone', x: 300, y: 300, color: 'orange' }]
    renderCanvas({ elements })
    // Tötsä renderöityy Ring-elementtinä
    const rings = screen.getAllByTestId('konva-ring')
    expect(rings.length).toBeGreaterThan(0)
  })

  // Arrow-elementti renderöityy
  it('arrow-elementti renderöityy oikein', () => {
    const elements = [{
      id: 'a1', type: 'arrow', x1: 100, y1: 100, x2: 200, y2: 200,
      arrowType: 'syotto',
    }]
    renderCanvas({ elements })
    const arrows = screen.getAllByTestId('konva-arrow')
    expect(arrows.length).toBeGreaterThan(0)
  })

  // onChange kutsutaan kun elementti muuttuu
  it('onChange-callback vastaanotetaan propsina', () => {
    const onChange = vi.fn()
    renderCanvas({ onChange })
    expect(onChange).not.toHaveBeenCalled() // ei kutsuta pelkästä renderöinnistä
  })

  // Useita elementtejä renderöityy
  it('useita elementtejä renderöityy yhtä aikaa', () => {
    const elements = [
      { id: 'p1', type: 'player', x: 100, y: 100, number: 1, team: 'home', rotation: 0 },
      { id: 'p2', type: 'player', x: 200, y: 200, number: 2, team: 'away', rotation: 0 },
      { id: 'c1', type: 'cone',   x: 300, y: 300, color: 'red' },
    ]
    renderCanvas({ elements })
    // Kaksi pelaajaa renderöityy Group-elementteinä, tötsä Ring-elementtinä
    const groups = screen.getAllByTestId('konva-group')
    expect(groups.length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByTestId('konva-ring').length).toBeGreaterThan(0)
  })

  // activeTool-propsi vastaanotetaan
  it('activeTool-propsi vastaanotetaan ilman virhettä', () => {
    expect(() => renderCanvas({ activeTool: 'player' })).not.toThrow()
    expect(() => renderCanvas({ activeTool: 'arrow' })).not.toThrow()
    expect(() => renderCanvas({ activeTool: 'cone' })).not.toThrow()
  })

  // Goalkeeper renderöityy (eri väri kuin pelaaja)
  it('goalkeeper-elementti renderöityy', () => {
    const elements = [{
      id: 'gk1', type: 'player', x: 500, y: 600,
      number: 1, team: 'gk', rotation: 0,
    }]
    expect(() => renderCanvas({ elements })).not.toThrow()
  })
})
