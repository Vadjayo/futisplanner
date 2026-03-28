/**
 * LeftToolbar.jsx
 * Vasemman reunan työkalupalkki. Flyout-valikko kaikille kenttäelementeille.
 */

import { useState, useRef } from 'react'
import { CONE_COLORS, COLORS } from '../../constants/colors'
import styles from './LeftToolbar.module.css'


// Nuolityypit kompakteille painikkeille
const ARROW_TYPES = [
  { id: 'syotto',   label: 'Syöttö',      icon: '→',   color: COLORS.text.primary },
  { id: 'liike',    label: 'Liike',        icon: '- →', color: COLORS.text.primary },
  { id: 'laukaus',  label: 'Laukaus',      icon: '⚡',  color: '#f97316' },
  { id: 'kuljetus', label: 'Kuljetus',     icon: '〜',  color: COLORS.status.danger },
  { id: 'kaareva',  label: 'Kaareva',      icon: '↗',  color: COLORS.status.warning },
  { id: 'bidir',    label: 'Molemmat',     icon: '↔',  color: COLORS.event.game },
  { id: 'offball',  label: 'Ilman palloa', icon: '···', color: '#a78bfa' },
]

// Piirtotyökalut kompakteille painikkeille
const DRAW_TOOLS = [
  { tool: 'line',      label: 'Viiva',       icon: '╱' },
  { tool: 'circle',    label: 'Ympyrä',      icon: '○' },
  { tool: 'zone',      label: 'Vyöhyke',     icon: '▭' },
  { tool: 'triangle',  label: 'Kolmio',      icon: '△' },
  { tool: 'freehand',  label: 'Vapaa',       icon: '✏' },
  { tool: 'freearrow', label: 'Vapaa nuoli', icon: '↝' },
  { tool: 'text',      label: 'Teksti',      icon: 'T' },
]

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

  // Erottaja osioiden väliin
  const Divider = () => (
    <div style={{ height: '0.5px', background: COLORS.bg.border, margin: '2px 0' }} />
  )

  // Osion otsikko
  const SectionLabel = ({ children }) => (
    <div style={{
      fontSize: 10, fontWeight: 600, color: COLORS.text.secondary,
      letterSpacing: '0.08em', textTransform: 'uppercase',
      padding: '8px 12px 4px',
    }}>
      {children}
    </div>
  )

  // Valitsee työkalun ja asettaa siihen liittyvät lisäasetukset kerralla
  function pick(tool, options = {}) {
    onToolChange(tool)
    Object.entries(options).forEach(([k, v]) => onToolOptionChange(k, v))
  }

  // Vaihtaa valinta-työkaluun
  function handleSelect() {
    onToolChange('select')
  }

  return (
    <>
      {/* Touch-raahauksen ghost-elementti – seuraa sormea */}
      {ghostPos && (
        <div
          className={styles.dragGhost}
          style={{ left: ghostPos.x, top: ghostPos.y }}
        >
          {ghostPos.label}
        </div>
      )}

      <aside className={styles.panel}>

        {/* Toiminto-napit */}
        <div className={styles.actionRow}>
          <button
            className={`${styles.actionBtn} ${activeTool === 'select' ? styles.actionBtnActive : ''}`}
            onClick={handleSelect}
            title="Valitse (välilyönti)"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M4 3l12 7-6 1.5L7 18 4 3z" fill="currentColor" />
            </svg>
            Valitse
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }))}
            title="Kumoa (Ctrl+Z)"
          >
            ↩ Kumoa
          </button>
          <button
            className={`${styles.actionBtn} ${activeTool === 'animate' ? styles.actionBtnActive : ''}`}
            onClick={() => onToolChange(activeTool === 'animate' ? 'select' : 'animate')}
            title="Animoi"
          >
            ▶ Animoi
          </button>
        </div>

          {/* 1 — MUODOSTELMAT */}
          <SectionLabel>Muodostelmat</SectionLabel>
          <div className={styles.templateRow} style={{ padding: '0 8px 8px' }}>
            {Object.entries(TEMPLATES).map(([key, players]) => (
              <button key={key} className={styles.templateBtn}
                onClick={() => onAddTemplate?.(players)} title={`${key} muodostelma`}>
                {key}
              </button>
            ))}
          </div>

          <Divider />

          {/* 2 — PELAAJAT */}
          <div className={styles.section}>
            <SectionLabel>Pelaajat</SectionLabel>

            {/* Näyttötapa */}
            <div className={styles.displayModeRow}>
              {[
                { id: 'number', label: '#',  title: 'Numero' },
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
                ['blue',  '#2563eb', ],
                ['red',   '#dc2626', ],
                ['green', '#16a34a', ],
                ['dark',  '#4b5563', ],
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
                ['def_blue',  '#2563eb', ],
                ['def_red',   '#dc2626', ],
                ['def_green', '#16a34a', ],
                ['def_dark',  '#4b5563', ],
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

          <Divider />

          {/* 3 — KENTTÄVÄLINEET: pallo, valmentaja, maalit, tikkaat, aita */}
          <div className={styles.section}>
            <SectionLabel>Kenttävälineet</SectionLabel>
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

          <Divider />

          {/* 4 — MERKKAAJAT: tötsät + kepit samassa sektiossa */}
          <div className={styles.section}>
            <SectionLabel>Merkkaajat</SectionLabel>
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

          <Divider />

          {/* 5 — NUOLET */}
          <div>
            <SectionLabel>Nuolet</SectionLabel>
            <div style={{ padding: '0 8px 8px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {ARROW_TYPES.map((at) => {
                const isActive = activeTool === 'arrow' && toolOptions.arrowType === at.id
                return (
                  <button
                    key={at.id}
                    onClick={() => pick('arrow', { arrowType: at.id })}
                    style={{
                      background: isActive ? COLORS.brand.primaryLight : COLORS.bg.primary,
                      border: `0.5px solid ${isActive ? COLORS.brand.primary : COLORS.bg.border}`,
                      borderRadius: 6,
                      color: at.color,
                      fontSize: 11,
                      padding: '4px 8px',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span>{at.icon}</span>
                    <span style={{ color: COLORS.text.secondary, fontSize: 10 }}>{at.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <Divider />

          {/* 6 — PIIRTOTYÖKALUT */}
          <div>
            <SectionLabel>Piirtotyökalut</SectionLabel>
            <div style={{ padding: '0 8px 8px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {DRAW_TOOLS.map(({ tool, label, icon }) => {
                const isActive = activeTool === tool
                return (
                  <button
                    key={tool}
                    onClick={() => pick(tool)}
                    title={label}
                    style={{
                      background: isActive ? COLORS.brand.primaryLight : COLORS.bg.primary,
                      border: `0.5px solid ${isActive ? COLORS.brand.primary : COLORS.bg.border}`,
                      borderRadius: 6,
                      color: isActive ? COLORS.brand.primary : COLORS.text.secondary,
                      fontSize: 11,
                      padding: '4px 8px',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span style={{ fontSize: 13 }}>{icon}</span>
                    <span style={{ fontSize: 10 }}>{label}</span>
                  </button>
                )
              })}
            </div>
            {/* Väripaletti piirtotyökaluille */}
            {['line', 'circle', 'triangle', 'freehand', 'zone'].includes(activeTool) && (
              <div className={styles.colorGrid} style={{ padding: '0 8px 8px' }}>
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

      </aside>
    </>
  )
}
