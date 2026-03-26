/**
 * colors.js
 * Sovelluksen väripaletti. Kaikki värit haetaan täältä — ei kovakoodattuja
 * hex-arvoja muualla koodissa.
 *
 * Käyttö: import { COLORS } from '@/constants'
 */

export const COLORS = {
  bg: {
    primary:   '#0a0d12',
    secondary: '#161820',
    surface:   '#1a1d27',
    border:    '#1e2230',
  },
  brand: {
    primary:      '#1D9E75',
    primaryHover: '#0F6E56',
    primaryLight: '#0F6E5620',
  },
  team: {
    blue:   '#2563EB',
    red:    '#DC2626',
    green:  '#16A34A',
    orange: '#EF9F27',
    gray:   '#374151',
  },
  event: {
    drill:      '#1D9E75',
    game:       '#378ADD',
    tournament: '#7F77DD',
    rest:       '#EF9F27',
  },
  status: {
    success: '#1D9E75',
    warning: '#EF9F27',
    danger:  '#E24B4A',
    info:    '#378ADD',
  },
  text: {
    primary:   '#ffffff',
    secondary: '#8b8d97',
    light:     '#d0dce8',
    muted:     '#2a2d35',
  },
}

// ── Tötsien ja keppien värivaihtoehdot ──
// Käytössä LeftToolbar.jsx:ssä ja DrillCanvas.jsx:ssä — säilytetään yhteensopivana

export const CONE_COLORS = [
  { id: 'orange', hex: '#f97316', label: 'Oranssi' },
  { id: 'red',    hex: '#ef4444', label: 'Punainen' },
  { id: 'blue',   hex: '#3b82f6', label: 'Sininen' },
  { id: 'yellow', hex: '#fbbf24', label: 'Keltainen' },
  { id: 'green',  hex: '#22c55e', label: 'Vihreä' },
  { id: 'white',  hex: '#f1f5f9', label: 'Valkoinen' },
]

// Tötsien/keppien täyttö- ja reunusvärit värityypeittäin
export const CONE_HEX = {
  orange: { fill: '#f97316', stroke: '#c2410c' },
  red:    { fill: '#ef4444', stroke: '#b91c1c' },
  blue:   { fill: '#3b82f6', stroke: '#1d4ed8' },
  yellow: { fill: '#fbbf24', stroke: '#d97706' },
  green:  { fill: '#22c55e', stroke: '#15803d' },
  white:  { fill: '#f1f5f9', stroke: '#94a3b8' },
}

// Piirtotyökalujen värit
export const DRAW_HEX = {
  white:  '#f1f5f9',
  yellow: '#fbbf24',
  orange: '#f97316',
  red:    '#ef4444',
  blue:   '#3b82f6',
  green:  '#22c55e',
}
