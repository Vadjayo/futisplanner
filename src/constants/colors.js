// Värikonstantit tötsille, kepeille ja piirtotyökaluille
// Käytetään sekä DrillCanvasissa että LeftToolbarissa

// Värivaihtoehdot tötsille ja kepeille – id vastaa CONE_HEX-avaimia
export const CONE_COLORS = [
  { id: 'orange', hex: '#f97316', label: 'Oranssi' },
  { id: 'red',    hex: '#ef4444', label: 'Punainen' },
  { id: 'blue',   hex: '#3b82f6', label: 'Sininen' },
  { id: 'yellow', hex: '#fbbf24', label: 'Keltainen' },
  { id: 'green',  hex: '#22c55e', label: 'Vihreä' },
  { id: 'white',  hex: '#f1f5f9', label: 'Valkoinen' },
]

// Tötsien ja keppien täyttö- ja reunusvärit värityypeittäin
export const CONE_HEX = {
  orange: { fill: '#f97316', stroke: '#c2410c' },
  red:    { fill: '#ef4444', stroke: '#b91c1c' },
  blue:   { fill: '#3b82f6', stroke: '#1d4ed8' },
  yellow: { fill: '#fbbf24', stroke: '#d97706' },
  green:  { fill: '#22c55e', stroke: '#15803d' },
  white:  { fill: '#f1f5f9', stroke: '#94a3b8' },
}

// Piirtotyökalujen värit – avain vastaa CONE_COLORS id-arvoja
export const DRAW_HEX = {
  white:  '#f1f5f9',
  yellow: '#fbbf24',
  orange: '#f97316',
  red:    '#ef4444',
  blue:   '#3b82f6',
  green:  '#22c55e',
}
