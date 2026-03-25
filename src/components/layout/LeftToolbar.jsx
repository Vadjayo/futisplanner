/**
 * LeftToolbar.jsx
 * Vasemman reunan työkalupalkki. Flyout-valikko kaikille kenttäelementeille.
 */

import { useState, useEffect, useRef } from 'react'
import { CONE_COLORS } from '../../constants/colors'
import styles from './LeftToolbar.module.css'


// Nuolityypit liike-osion painikkeisiin
const ARROW_TYPES = [
  { id: 'syotto',   label: 'Syöttö' },
  { id: 'liike',    label: 'Liike' },
  { id: 'laukaus',  label: 'Laukaus' },
  { id: 'kuljetus', label: 'Kuljetus' },
  { id: 'kaareva',  label: 'Kaareva' },
  { id: 'bidir',    label: 'Edestakaisin' },
  { id: 'offball',  label: 'Ilman palloa' },
]

// Kaikki välinetyökalut – käytetään tarkistamaan, onko jokin väline aktiivisena
const EQUIPMENT_TOOLS = ['player', 'coach', 'ball', 'cone', 'pole', 'smallgoal', 'goal', 'ladder', 'hurdle', 'mannequin', 'hoop', 'minifield', 'arrow', 'freearrow', 'text', 'line', 'circle', 'freehand', 'zone', 'triangle']

// Piirtää pienen SVG-esikatselun nuolityypille flyout-valikkoon
function ArrowPreview({ type }) {
  const W = 52, H = 18, y = H / 2
  const lineEnd = W - 11
  // Nuolenpään kolmion kärjet
  const head = `${lineEnd},${y - 5} ${W},${y} ${lineEnd},${y + 5}`
  switch (type) {
    case 'syotto':
      // Yhtenäinen valkoinen viiva nuolenpäällä
      return <svg width={W} height={H} style={{ display: 'block', flexShrink: 0 }}>
        <line x1={3} y1={y} x2={lineEnd} y2={y} stroke="white" strokeWidth={2.5} />
        <polygon points={head} fill="white" />
      </svg>
    case 'liike':
      // Katkoviiva nuolenpäällä
      return <svg width={W} height={H} style={{ display: 'block', flexShrink: 0 }}>
        <line x1={3} y1={y} x2={lineEnd} y2={y} stroke="white" strokeWidth={2} strokeDasharray="6,4" />
        <polygon points={head} fill="white" />
      </svg>
    case 'laukaus': {
      // Leveämpi oranssi nuoli laukaukselle
      const hL = `${lineEnd - 2},${y - 6} ${W},${y} ${lineEnd - 2},${y + 6}`
      return <svg width={W} height={H} style={{ display: 'block', flexShrink: 0 }}>
        <line x1={3} y1={y} x2={lineEnd - 2} y2={y} stroke="#f97316" strokeWidth={4} />
        <polygon points={hL} fill="#f97316" />
      </svg>
    }
    case 'kuljetus': {
      // Sileä sine-aalto kubisilla bezier-käyrillä (2.5 sykliä)
      const cy = H / 2
      const a = 3.8 // amplitudi
      const waveD = [
        `M 3 ${cy}`,
        `C ${5.5} ${cy-a}, ${7.5} ${cy-a}, ${10} ${cy}`,
        `C ${12.5} ${cy+a}, ${14.5} ${cy+a}, ${17} ${cy}`,
        `C ${19.5} ${cy-a}, ${21.5} ${cy-a}, ${24} ${cy}`,
        `C ${26.5} ${cy+a}, ${28.5} ${cy+a}, ${31} ${cy}`,
        `C ${33.5} ${cy-a}, ${35.5} ${cy-a}, ${38} ${cy}`,
        `L 40 ${cy}`,
      ].join(' ')
      return <svg width={W} height={H} style={{ display: 'block', flexShrink: 0 }}>
        <path d={waveD} stroke="#fbbf24" strokeWidth={2} fill="none" strokeDasharray="4,2.5" />
        <polygon points={`40,${cy-5} ${W},${cy} 40,${cy+5}`} fill="#fbbf24" />
      </svg>
    }
    case 'kaareva': {
      // Kaareva oranssi quadratic bezier nuoli
      const cy = H / 2
      return <svg width={W} height={H} style={{ display: 'block', flexShrink: 0 }}>
        <path d={`M 4 ${cy+4} Q ${W/2} ${cy-8} ${lineEnd} ${cy}`} stroke="#EF9F27" strokeWidth={2} fill="none" />
        <polygon points={`${lineEnd},${cy-5} ${W},${cy} ${lineEnd},${cy+5}`} fill="#EF9F27" />
      </svg>
    }
    case 'bidir': {
      // Kaksisuuntainen nuoli molemmissa päissä
      return <svg width={W} height={H} style={{ display: 'block', flexShrink: 0 }}>
        <line x1={8} y1={y} x2={lineEnd} y2={y} stroke="white" strokeWidth={2.5} />
        <polygon points={head} fill="white" />
        <polygon points={`${8},${y-5} ${0},${y} ${8},${y+5}`} fill="white" />
      </svg>
    }
    case 'offball': {
      // Violetti katkoviiva nuolenpäällä – ilman palloa -liike
      return <svg width={W} height={H} style={{ display: 'block', flexShrink: 0 }}>
        <line x1={3} y1={y} x2={lineEnd} y2={y} stroke="#a78bfa" strokeWidth={2} strokeDasharray="5,4" />
        <polygon points={head} fill="#a78bfa" />
      </svg>
    }
    default: return null
  }
}

// SVG-esikatselu vapaalle nuolelle – käyrä viiva nuolenpäällä
function FreeArrowPreview() {
  const W = 52, H = 28
  // Kaarevan polun suunta lopussa: ohjauspiste (32,26) → päätepiste (46,10)
  const angle = Math.atan2(10 - 26, 46 - 32)
  const len = 8, spread = Math.PI / 6
  const p1x = 46 - len * Math.cos(angle - spread)
  const p1y = 10 - len * Math.sin(angle - spread)
  const p2x = 46 - len * Math.cos(angle + spread)
  const p2y = 10 - len * Math.sin(angle + spread)
  return (
    <svg width={W} height={H} style={{ display: 'block', flexShrink: 0 }}>
      <path d="M 3 22 C 12 4, 32 26, 46 10"
        stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <polyline
        points={`${p1x.toFixed(1)},${p1y.toFixed(1)} 46,10 ${p2x.toFixed(1)},${p2y.toFixed(1)}`}
        stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Pieni SVG-ikoni viiva-työkalulle
function LineIcon() {
  return (
    <svg width="36" height="20" viewBox="0 0 36 20" style={{ display: 'block' }}>
      <line x1="3" y1="17" x2="33" y2="3" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

// Pieni SVG-ikoni ympyrä-työkalulle
function CircleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" style={{ display: 'block' }}>
      <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2.5" fill="none" />
    </svg>
  )
}

// Pieni SVG-ikoni vapaapiirto-työkalulle – epäsäännöllinen käyrä
function FreehandIcon() {
  return (
    <svg width="36" height="24" viewBox="0 0 36 24" style={{ display: 'block' }}>
      <path d="M 3 18 C 8 5, 13 22, 19 12 C 25 2, 30 18, 33 10" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function ZoneIcon() {
  return (
    <svg width="36" height="24" viewBox="0 0 36 24" style={{ display: 'block' }}>
      <rect x="3" y="4" width="30" height="16" rx="2" fill="rgba(59,130,246,0.35)" stroke="#3b82f6" strokeWidth="2" />
    </svg>
  )
}

function TriangleIcon() {
  return (
    <svg width="28" height="26" viewBox="0 0 28 26" style={{ display: 'block' }}>
      <polygon points="14,2 26,24 2,24" stroke="white" strokeWidth="2.5" fill="transparent" strokeLinejoin="round" />
    </svg>
  )
}

// Pieni SVG-ikoni pienelle maalille (harjoitusmaalityyppi)
function SmallGoalIcon() {
  return (
    <svg width="30" height="20" viewBox="0 0 30 20" style={{ display: 'block' }}>
      <rect x="1" y="1" width="28" height="3.5" fill="white" rx="1" />
      <rect x="1" y="1" width="3.5" height="18" fill="white" rx="1" />
      <rect x="25.5" y="1" width="3.5" height="18" fill="white" rx="1" />
    </svg>
  )
}

// Pieni SVG-ikoni täysikokoiselle maalille
function GoalIcon() {
  return (
    <svg width="46" height="20" viewBox="0 0 46 20" style={{ display: 'block' }}>
      <rect x="1" y="1" width="44" height="3.5" fill="white" rx="1" />
      <rect x="1" y="1" width="3.5" height="18" fill="white" rx="1" />
      <rect x="41.5" y="1" width="3.5" height="18" fill="white" rx="1" />
    </svg>
  )
}

// Pieni SVG-ikoni tikkaalle – keltainen väri vastaa kenttää
function LadderIcon() {
  return (
    <svg width="22" height="38" viewBox="0 0 22 38" style={{ display: 'block' }}>
      <rect x="1" y="0" width="3" height="38" fill="#fbbf24" rx="1" />
      <rect x="18" y="0" width="3" height="38" fill="#fbbf24" rx="1" />
      <rect x="1" y="5"  width="20" height="2.5" fill="#fbbf24" />
      <rect x="1" y="13" width="20" height="2.5" fill="#fbbf24" />
      <rect x="1" y="21" width="20" height="2.5" fill="#fbbf24" />
      <rect x="1" y="29" width="20" height="2.5" fill="#fbbf24" />
    </svg>
  )
}

// Pieni SVG-ikoni aidalle – poikkitanko ja jalat
function HurdleIcon() {
  return (
    <svg width="34" height="26" viewBox="0 0 34 26" style={{ display: 'block' }}>
      <rect x="3" y="8"  width="28" height="3.5" fill="white" rx="1" />
      <rect x="3" y="8"  width="3.5" height="14" fill="white" rx="1" />
      <rect x="27.5" y="8" width="3.5" height="14" fill="white" rx="1" />
      <rect x="0"  y="20" width="10" height="3" fill="white" rx="1" />
      <rect x="24" y="20" width="10" height="3" fill="white" rx="1" />
    </svg>
  )
}

// Pieni SVG-ikoni mannekiinille – ihmissilhuetti
function DummyIcon() {
  return (
    <svg width="24" height="36" viewBox="0 0 24 36" style={{ display: 'block' }}>
      <circle cx="12" cy="5" r="4" fill="white" opacity="0.8" />
      <rect x="9" y="10" width="6" height="12" rx="2" fill="white" opacity="0.8" />
      <rect x="2" y="11" width="20" height="4" rx="2" fill="white" opacity="0.8" />
      <rect x="7" y="22" width="4" height="12" rx="2" fill="white" opacity="0.8" />
      <rect x="13" y="22" width="4" height="12" rx="2" fill="white" opacity="0.8" />
    </svg>
  )
}

// Pieni SVG-ikoni koordinaatiorenkaille
function HoopIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" style={{ display: 'block' }}>
      <circle cx="18" cy="18" r="14" stroke="#fbbf24" strokeWidth="5" fill="rgba(251,191,36,0.15)" />
    </svg>
  )
}

// Pieni SVG-ikoni pienelle kentälle
function MinifieldIcon() {
  return (
    <svg width="46" height="30" viewBox="0 0 46 30" style={{ display: 'block' }}>
      <rect x="1" y="1" width="44" height="28" fill="#2d5a27" rx="2" />
      <rect x="1" y="1" width="44" height="28" stroke="rgba(255,255,255,0.8)" strokeWidth="2" fill="transparent" rx="2" />
      <line x1="23" y1="1" x2="23" y2="29" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" />
      <line x1="1" y1="10" x2="1" y2="20" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
      <line x1="45" y1="10" x2="45" y2="20" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

// Muodostelmamallipohjat — pelaajien aloitussijainnit loogisissa koordinaateissa (kenttä 1000×650)
const TEMPLATES = {
  '4v4': [
    // Maalit
    { type: 'smallgoal', x:  12, y: 325, rotation:  90 },
    { type: 'smallgoal', x: 988, y: 325, rotation: 270 },
    // Maalivahdit
    { type: 'player', x:  55, y: 325, team: 'gk',  number: 1, shape: 'att', rotation: 0 },
    { type: 'player', x: 945, y: 325, team: 'gk',  number: 1, shape: 'att', rotation: 0 },
    // Sininen joukkue
    { type: 'player', x: 200, y: 215, team: 'blue', number: 2, shape: 'att', rotation: 0 },
    { type: 'player', x: 200, y: 435, team: 'blue', number: 3, shape: 'att', rotation: 0 },
    { type: 'player', x: 340, y: 155, team: 'blue', number: 4, shape: 'att', rotation: 0 },
    { type: 'player', x: 340, y: 495, team: 'blue', number: 5, shape: 'att', rotation: 0 },
    // Punainen joukkue
    { type: 'player', x: 800, y: 215, team: 'red',  number: 2, shape: 'att', rotation: 0 },
    { type: 'player', x: 800, y: 435, team: 'red',  number: 3, shape: 'att', rotation: 0 },
    { type: 'player', x: 660, y: 155, team: 'red',  number: 4, shape: 'att', rotation: 0 },
    { type: 'player', x: 660, y: 495, team: 'red',  number: 5, shape: 'att', rotation: 0 },
  ],
  '5v5': [
    // Maalit
    { type: 'smallgoal', x:  12, y: 325, rotation:  90 },
    { type: 'smallgoal', x: 988, y: 325, rotation: 270 },
    // Sininen joukkue (MV + 2-2)
    { type: 'player', x:  55, y: 325, team: 'gk',   number: 1, shape: 'att', rotation: 0 },
    { type: 'player', x: 190, y: 210, team: 'blue',  number: 2, shape: 'att', rotation: 0 },
    { type: 'player', x: 190, y: 440, team: 'blue',  number: 3, shape: 'att', rotation: 0 },
    { type: 'player', x: 350, y: 210, team: 'blue',  number: 4, shape: 'att', rotation: 0 },
    { type: 'player', x: 350, y: 440, team: 'blue',  number: 5, shape: 'att', rotation: 0 },
    // Punainen joukkue (MV + 2-2)
    { type: 'player', x: 945, y: 325, team: 'gk',   number: 1, shape: 'att', rotation: 0 },
    { type: 'player', x: 810, y: 210, team: 'red',   number: 2, shape: 'att', rotation: 0 },
    { type: 'player', x: 810, y: 440, team: 'red',   number: 3, shape: 'att', rotation: 0 },
    { type: 'player', x: 650, y: 210, team: 'red',   number: 4, shape: 'att', rotation: 0 },
    { type: 'player', x: 650, y: 440, team: 'red',   number: 5, shape: 'att', rotation: 0 },
  ],
  '7v7': [
    // Maalit
    { type: 'smallgoal', x:  12, y: 325, rotation:  90 },
    { type: 'smallgoal', x: 988, y: 325, rotation: 270 },
    // Sininen joukkue (MV + 2-3-1)
    { type: 'player', x:  55, y: 325, team: 'gk',   number: 1, shape: 'att', rotation: 0 },
    { type: 'player', x: 165, y: 220, team: 'blue',  number: 2, shape: 'att', rotation: 0 },
    { type: 'player', x: 165, y: 430, team: 'blue',  number: 3, shape: 'att', rotation: 0 },
    { type: 'player', x: 280, y: 140, team: 'blue',  number: 4, shape: 'att', rotation: 0 },
    { type: 'player', x: 280, y: 325, team: 'blue',  number: 5, shape: 'att', rotation: 0 },
    { type: 'player', x: 280, y: 510, team: 'blue',  number: 6, shape: 'att', rotation: 0 },
    { type: 'player', x: 400, y: 325, team: 'blue',  number: 7, shape: 'att', rotation: 0 },
    // Punainen joukkue (MV + 1-3-2)
    { type: 'player', x: 945, y: 325, team: 'gk',   number: 1, shape: 'att', rotation: 0 },
    { type: 'player', x: 835, y: 220, team: 'red',   number: 2, shape: 'att', rotation: 0 },
    { type: 'player', x: 835, y: 430, team: 'red',   number: 3, shape: 'att', rotation: 0 },
    { type: 'player', x: 720, y: 140, team: 'red',   number: 4, shape: 'att', rotation: 0 },
    { type: 'player', x: 720, y: 325, team: 'red',   number: 5, shape: 'att', rotation: 0 },
    { type: 'player', x: 720, y: 510, team: 'red',   number: 6, shape: 'att', rotation: 0 },
    { type: 'player', x: 600, y: 325, team: 'red',   number: 7, shape: 'att', rotation: 0 },
  ],
  '11v11': [
    // Maalit
    { type: 'goal', x:  12, y: 325, rotation:  90 },
    { type: 'goal', x: 988, y: 325, rotation: 270 },
    // Sininen joukkue (MV + 4-4-2)
    { type: 'player', x:  55, y: 325, team: 'gk',   number:  1, shape: 'att', rotation: 0 },
    { type: 'player', x: 175, y: 130, team: 'blue',  number:  2, shape: 'att', rotation: 0 },
    { type: 'player', x: 175, y: 248, team: 'blue',  number:  3, shape: 'att', rotation: 0 },
    { type: 'player', x: 175, y: 402, team: 'blue',  number:  4, shape: 'att', rotation: 0 },
    { type: 'player', x: 175, y: 520, team: 'blue',  number:  5, shape: 'att', rotation: 0 },
    { type: 'player', x: 330, y: 130, team: 'blue',  number:  6, shape: 'att', rotation: 0 },
    { type: 'player', x: 330, y: 248, team: 'blue',  number:  7, shape: 'att', rotation: 0 },
    { type: 'player', x: 330, y: 402, team: 'blue',  number:  8, shape: 'att', rotation: 0 },
    { type: 'player', x: 330, y: 520, team: 'blue',  number:  9, shape: 'att', rotation: 0 },
    { type: 'player', x: 450, y: 235, team: 'blue',  number: 10, shape: 'att', rotation: 0 },
    { type: 'player', x: 450, y: 415, team: 'blue',  number: 11, shape: 'att', rotation: 0 },
    // Punainen joukkue (MV + 2-4-4)
    { type: 'player', x: 945, y: 325, team: 'gk',   number:  1, shape: 'att', rotation: 0 },
    { type: 'player', x: 825, y: 130, team: 'red',   number:  2, shape: 'att', rotation: 0 },
    { type: 'player', x: 825, y: 248, team: 'red',   number:  3, shape: 'att', rotation: 0 },
    { type: 'player', x: 825, y: 402, team: 'red',   number:  4, shape: 'att', rotation: 0 },
    { type: 'player', x: 825, y: 520, team: 'red',   number:  5, shape: 'att', rotation: 0 },
    { type: 'player', x: 670, y: 130, team: 'red',   number:  6, shape: 'att', rotation: 0 },
    { type: 'player', x: 670, y: 248, team: 'red',   number:  7, shape: 'att', rotation: 0 },
    { type: 'player', x: 670, y: 402, team: 'red',   number:  8, shape: 'att', rotation: 0 },
    { type: 'player', x: 670, y: 520, team: 'red',   number:  9, shape: 'att', rotation: 0 },
    { type: 'player', x: 550, y: 235, team: 'red',   number: 10, shape: 'att', rotation: 0 },
    { type: 'player', x: 550, y: 415, team: 'red',   number: 11, shape: 'att', rotation: 0 },
  ],
}

// Pääkomponentti: vasemman reunan työkalupalkki
// Props: activeTool – valittu työkalu, onToolChange – työkalu vaihtuu,
//        toolOptions – lisäasetukset (väri, joukkue jne.), onToolOptionChange – asetus vaihtuu,
//        onAddTemplate – lisää mallipohjapelaajat aktiiviseen harjoitteeseen
export default function LeftToolbar({ activeTool, onToolChange, toolOptions, onToolOptionChange, onAddTemplate }) {
  // Flyout-valikon avaus/sulkeminen
  const [toolsOpen, setToolsOpen] = useState(false)

  // ── TOUCH DRAG ──
  // Mobiilissa HTML5 drag-tapahtumat eivät toimi – toteutetaan touch-versio
  const touchDragRef = useRef(null)
  const [ghostPos, setGhostPos] = useState(null)

  // Aloittaa touch-raahauksen: tallentaa työkalun ja avaa ghost-elementin
  function startTouchDrag(e, tool, options = {}, label = '') {
    e.preventDefault()
    const touch = e.touches[0]
    touchDragRef.current = { tool, options }
    setGhostPos({ x: touch.clientX, y: touch.clientY, label })
  }

  // Siirtää ghost-elementtiä sormen mukana
  function moveTouchDrag(e) {
    if (!touchDragRef.current) return
    e.preventDefault()
    const touch = e.touches[0]
    setGhostPos((prev) => prev ? { ...prev, x: touch.clientX, y: touch.clientY } : null)
  }

  // Pudottaa elementin kentälle: etsii pudotuskohdan ja lähettää custom-tapahtuman
  function endTouchDrag(e) {
    if (!touchDragRef.current) return
    const touch = e.changedTouches[0]
    const target = document.elementFromPoint(touch.clientX, touch.clientY)
    if (target) {
      target.dispatchEvent(new CustomEvent('toolbar-touch-drop', {
        detail: { ...touchDragRef.current, clientX: touch.clientX, clientY: touch.clientY },
        bubbles: true,
      }))
    }
    touchDragRef.current = null
    setGhostPos(null)
  }

  // Apufunktio: palauttaa touch-käsittelijät elementille
  function td(tool, options = {}, label = '') {
    return {
      onTouchStart: (e) => startTouchDrag(e, tool, options, label),
      onTouchMove:  moveTouchDrag,
      onTouchEnd:   endTouchDrag,
    }
  }

  // Sulje flyout kun valinta-työkalu aktivoituu (esim. spacebar)
  useEffect(() => {
    if (activeTool === 'select') setToolsOpen(false)
  }, [activeTool])

  // Valitsee työkalun ja asettaa siihen liittyvät lisäasetukset kerralla
  function pick(tool, options = {}) {
    onToolChange(tool)
    Object.entries(options).forEach(([k, v]) => onToolOptionChange(k, v))
  }

  // Vaihtaa valinta-työkaluun ja sulkee flyout-valikon
  function handleSelect() {
    onToolChange('select')
    setToolsOpen(false)
  }

  // Tarkistetaan, onko jokin välinetyökalu parhaillaan aktiivinen
  const isEquip = EQUIPMENT_TOOLS.includes(activeTool)

  return (
    <>
      <aside className={styles.toolbar}>
        <button
          className={`${styles.toolBtn} ${activeTool === 'select' && !toolsOpen ? styles.active : ''}`}
          onClick={handleSelect} title="Valitse (välilyönti)"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 3l12 7-6 1.5L7 18 4 3z" fill="currentColor" />
          </svg>
          <span className={styles.label}>Valitse</span>
        </button>

        <button
          className={styles.toolBtn}
          onClick={() => {
            // Lähettää Ctrl+Z-näppäinkomennon ikkunalle
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }))
          }}
          title="Kumoa (Ctrl+Z)"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 8 C4 4 8 2 12 4 C16 6 16 10 14 13" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <polyline points="2,6 4,10 8,8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className={styles.label}>Kumoa</span>
        </button>

        <button
          className={`${styles.toolBtn} ${isEquip || toolsOpen ? styles.active : ''}`}
          onClick={() => setToolsOpen((o) => !o)} title="Välineet"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity=".85"/>
            <rect x="11" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity=".85"/>
            <rect x="2" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity=".85"/>
            <rect x="11" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity=".85"/>
          </svg>
          <span className={styles.label}>Välineet</span>
        </button>

        <button
          className={`${styles.toolBtn} ${activeTool === 'animate' && !toolsOpen ? styles.active : ''}`}
          onClick={() => { setToolsOpen(false); onToolChange(activeTool === 'animate' ? 'select' : 'animate') }} title="Animoi"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 3.5l12 6.5-12 6.5V3.5z" fill="currentColor" />
          </svg>
          <span className={styles.label}>Animoi</span>
        </button>
      </aside>

      {/* Touch-raahauksen ghost-elementti – seuraa sormea */}
      {ghostPos && (
        <div
          className={styles.dragGhost}
          style={{ left: ghostPos.x, top: ghostPos.y }}
        >
          {ghostPos.label}
        </div>
      )}

      {/* Flyout-valikko – näytetään vain kun toolsOpen on true */}
      {toolsOpen && (
        <div className={styles.flyout}>

          {/* MUODOSTELMAT – lisää valmiit pelaajapaikat kentälle */}
          {/* 1 — MUODOSTELMAT */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Muodostelmat</div>
            <div className={styles.templateRow}>
              {Object.entries(TEMPLATES).map(([key, players]) => (
                <button key={key} className={styles.templateBtn}
                  onClick={() => onAddTemplate?.(players)} title={`${key} muodostelma`}>
                  {key}
                </button>
              ))}
            </div>
          </div>

          {/* 2 — PELAAJAT */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Pelaajat</div>

            {/* Näyttötapa */}
            <div className={styles.displayModeRow}>
              {[
                { id: 'number', label: '#',  title: 'Numero' },
                { id: 'name',   label: '#A', title: 'Numero + nimi' },
                { id: 'jersey', label: '👕', title: 'Pelipaita' },
              ].map(({ id, label, title }) => (
                <button key={id}
                  className={`${styles.displayModeBtn} ${toolOptions.playerDisplayMode === id ? styles.displayModeBtnActive : ''}`}
                  title={title}
                  onClick={() => onToolOptionChange('playerDisplayMode', id)}
                >{label}</button>
              ))}
            </div>

            {/* Maalivahti */}
            <div className={styles.playerTypeLabel}>Maalivahti</div>
            <div className={styles.playerGrid}>
              <button
                className={`${styles.playerCard} ${activeTool === 'player' && toolOptions.playerTeam === 'gk' ? styles.itemActive : ''}`}
                title="Maalivahti – raahaa kentälle"
                draggable
                onDragStart={(e) => { e.dataTransfer.setData('futisplanner/tool', 'player'); e.dataTransfer.setData('futisplanner/options', JSON.stringify({ playerTeam: 'gk' })); e.dataTransfer.effectAllowed = 'copy' }}
                {...td('player', { playerTeam: 'gk' }, 'MV')}
              >
                <svg width="26" height="26" viewBox="0 0 26 26">
                  <circle cx="13" cy="13" r="11" fill="#f59e0b" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/>
                  <text x="13" y="17.5" textAnchor="middle" fill="white" fontSize="8" fontWeight="800">MV</text>
                </svg>
                <span className={styles.playerCardLabel}>MV</span>
              </button>
            </div>

            {/* Hyökkääjät */}
            <div className={styles.playerTypeLabel}>Hyökkääjät</div>
            <div className={styles.playerGrid}>
              {[
                ['blue',  '#2563eb', 'Sin'],
                ['red',   '#dc2626', 'Pun'],
                ['green', '#16a34a', 'Vih'],
                ['dark',  '#4b5563', 'Har'],
              ].map(([role, color, label]) => (
                <button key={role}
                  className={`${styles.playerCard} ${activeTool === 'player' && toolOptions.playerTeam === role ? styles.itemActive : ''}`}
                  title="Hyökkääjä – raahaa kentälle"
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData('futisplanner/tool', 'player'); e.dataTransfer.setData('futisplanner/options', JSON.stringify({ playerTeam: role })); e.dataTransfer.effectAllowed = 'copy' }}
                  {...td('player', { playerTeam: role }, label)}
                >
                  <svg width="26" height="26" viewBox="0 0 26 26">
                    <circle cx="13" cy="13" r="11" fill={color} stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/>
                  </svg>
                  <span className={styles.playerCardLabel}>{label}</span>
                </button>
              ))}
            </div>

            {/* Puolustajat */}
            <div className={styles.playerTypeLabel}>Puolustajat</div>
            <div className={styles.playerGrid}>
              {[
                ['def_blue',  '#2563eb', 'Sin'],
                ['def_red',   '#dc2626', 'Pun'],
                ['def_green', '#16a34a', 'Vih'],
                ['def_dark',  '#4b5563', 'Har'],
              ].map(([role, color, label]) => (
                <button key={role}
                  className={`${styles.playerCard} ${activeTool === 'player' && toolOptions.playerTeam === role ? styles.itemActive : ''}`}
                  title="Puolustaja – raahaa kentälle"
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData('futisplanner/tool', 'player'); e.dataTransfer.setData('futisplanner/options', JSON.stringify({ playerTeam: role })); e.dataTransfer.effectAllowed = 'copy' }}
                  {...td('player', { playerTeam: role }, label)}
                >
                  <svg width="26" height="24" viewBox="0 0 26 24">
                    <polygon points="13,1 25,23 1,23" fill={color} stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinejoin="round"/>
                  </svg>
                  <span className={styles.playerCardLabel}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3 — KENTTÄVÄLINEET: pallo, valmentaja, maalit, tikkaat, aita */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Kenttävälineet</div>
            <div className={styles.equipGrid}>
              {[
                { tool: 'ball',      label: 'Pallo',      icon: <span className={styles.bigIcon}>⚽</span> },
                { tool: 'coach',     label: 'Valmentaja', icon: <span className={styles.bigIcon}>📋</span> },
                { tool: 'smallgoal', label: 'Pieni maali',icon: <SmallGoalIcon /> },
                { tool: 'goal',      label: 'Maali',      icon: <GoalIcon /> },
                { tool: 'ladder',    label: 'Tikkaat',    icon: <LadderIcon /> },
                { tool: 'hurdle',    label: 'Aita',       icon: <HurdleIcon /> },
                { tool: 'mannequin', label: 'Mannekiini', icon: <DummyIcon /> },
                { tool: 'hoop',      label: 'Rengas',     icon: <HoopIcon /> },
                { tool: 'minifield', label: 'Pienkenttä', icon: <MinifieldIcon /> },
              ].map(({ tool, label, icon }) => (
                <button key={tool}
                  className={`${styles.equipBtn} ${activeTool === tool ? styles.itemActive : ''}`}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData('futisplanner/tool', tool); e.dataTransfer.effectAllowed = 'copy' }}
                  {...td(tool, {}, label)}
                  title={`${label} – raahaa kentälle`}
                >
                  {icon}
                  <span className={styles.equipLabel}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4 — MERKKAAJAT: tötsät + kepit samassa sektiossa */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Merkkaajat</div>
            <div className={styles.playerTypeLabel}>Tötsät</div>
            <div className={styles.colorGrid}>
              {CONE_COLORS.map((c) => (
                <button key={c.id}
                  className={`${styles.swatch} ${activeTool === 'cone' && toolOptions.coneColor === c.id ? styles.swatchActive : ''}`}
                  style={{ background: c.hex, borderColor: c.id === 'white' ? '#94a3b8' : c.hex }}
                  title={`${c.label} tötsä – raahaa kentälle`}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData('futisplanner/tool', 'cone'); e.dataTransfer.setData('futisplanner/options', JSON.stringify({ coneColor: c.id })); e.dataTransfer.effectAllowed = 'copy' }}
                  {...td('cone', { coneColor: c.id }, c.label)}
                />
              ))}
            </div>
            <div className={styles.playerTypeLabel} style={{ marginTop: 8 }}>Kepit</div>
            <div className={styles.colorGrid}>
              {CONE_COLORS.map((c) => (
                <button key={c.id}
                  className={`${styles.swatch} ${activeTool === 'pole' && toolOptions.poleColor === c.id ? styles.swatchActive : ''}`}
                  style={{ background: c.hex, borderColor: c.id === 'white' ? '#94a3b8' : c.hex }}
                  title={`${c.label} keppi – raahaa kentälle`}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData('futisplanner/tool', 'pole'); e.dataTransfer.setData('futisplanner/options', JSON.stringify({ poleColor: c.id })); e.dataTransfer.effectAllowed = 'copy' }}
                  {...td('pole', { poleColor: c.id }, c.label)}
                />
              ))}
            </div>
          </div>

          {/* 5 — LIIKE */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Liike</div>
            {ARROW_TYPES.map((at) => (
              <button key={at.id}
                className={`${styles.arrowBtn} ${activeTool === 'arrow' && toolOptions.arrowType === at.id ? styles.itemActive : ''}`}
                onClick={() => pick('arrow', { arrowType: at.id })}>
                <ArrowPreview type={at.id} />
                <span className={styles.arrowLabel}>{at.label}</span>
              </button>
            ))}
            <button
              className={`${styles.arrowBtn} ${activeTool === 'freearrow' ? styles.itemActive : ''}`}
              onClick={() => pick('freearrow')}>
              <FreeArrowPreview />
              <span className={styles.arrowLabel}>Vapaa nuoli</span>
            </button>
          </div>

          {/* 6 — PIIRUSTUS + TEKSTI */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Piirustus</div>
            <div className={styles.iconRow} style={{ flexWrap: 'wrap', gap: 4 }}>
              {[
                { tool: 'line',     label: 'Viiva',    icon: <LineIcon /> },
                { tool: 'circle',   label: 'Ympyrä',   icon: <CircleIcon /> },
                { tool: 'triangle', label: 'Kolmio',   icon: <TriangleIcon /> },
                { tool: 'freehand', label: 'Piirto',   icon: <FreehandIcon /> },
                { tool: 'zone',     label: 'Vyöhyke',  icon: <ZoneIcon /> },
                { tool: 'text',     label: 'Teksti',   icon: <span style={{ fontSize: 20, fontWeight: 700, color: 'white', lineHeight: 1 }}>T</span> },
              ].map(({ tool, label, icon }) => (
                <button key={tool}
                  className={`${styles.iconBtn} ${activeTool === tool ? styles.itemActive : ''}`}
                  onClick={() => pick(tool)} title={label}>
                  {icon}
                  <span className={styles.iconLabel}>{label}</span>
                </button>
              ))}
            </div>
            {['line', 'circle', 'triangle', 'freehand', 'zone'].includes(activeTool) && (
              <div className={styles.colorGrid} style={{ marginTop: 8 }}>
                {CONE_COLORS.map((c) => (
                  <button key={c.id}
                    className={`${styles.swatch} ${toolOptions.drawColor === c.id ? styles.swatchActive : ''}`}
                    style={{ background: c.hex, borderColor: c.id === 'white' ? '#94a3b8' : c.hex }}
                    onClick={() => onToolOptionChange('drawColor', c.id)} title={c.label}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </>
  )
}
