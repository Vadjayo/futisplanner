/**
 * LeftToolbar.jsx
 * Vasemman reunan työkalupalkki. Flyout-valikko kaikille kenttäelementeille.
 */

import { useState, useEffect } from 'react'
import { CONE_COLORS } from '../../constants/colors'
import styles from './LeftToolbar.module.css'


// Nuolityypit liike-osion painikkeisiin
const ARROW_TYPES = [
  { id: 'syotto',   label: 'Syöttö' },
  { id: 'liike',    label: 'Liike' },
  { id: 'laukaus',  label: 'Laukaus' },
  { id: 'kuljetus', label: 'Kuljetus' },
]

// Kaikki välinetyökalut – käytetään tarkistamaan, onko jokin väline aktiivisena
const EQUIPMENT_TOOLS = ['player', 'coach', 'ball', 'cone', 'pole', 'smallgoal', 'goal', 'ladder', 'hurdle', 'arrow', 'freearrow', 'text', 'line', 'circle', 'freehand']

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

// Pääkomponentti: vasemman reunan työkalupalkki
// Props: activeTool – valittu työkalu, onToolChange – työkalu vaihtuu,
//        toolOptions – lisäasetukset (väri, joukkue jne.), onToolOptionChange – asetus vaihtuu
export default function LeftToolbar({ activeTool, onToolChange, toolOptions, onToolOptionChange }) {
  // Flyout-valikon avaus/sulkeminen
  const [toolsOpen, setToolsOpen] = useState(false)

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
        {/* Valinta-työkalu – siirrä ja valitse elementtejä */}
        <button
          className={`${styles.toolBtn} ${activeTool === 'select' ? styles.active : ''}`}
          onClick={handleSelect}
          title="Valitse"
        >
          <span className={styles.icon}>▣</span>
          <span className={styles.label}>Valitse</span>
        </button>

        {/* Välineet-painike – avaa/sulkee flyout-valikon */}
        <button
          className={`${styles.toolBtn} ${isEquip || toolsOpen ? styles.active : ''}`}
          onClick={() => setToolsOpen((o) => !o)}
          title="Välineet"
        >
          <span className={styles.icon}>⚙</span>
          <span className={styles.label}>Välineet</span>
        </button>

        {/* Animaatiotila – piirtää pelaajien polut ja toistaa ne */}
        <button
          className={`${styles.toolBtn} ${activeTool === 'animate' ? styles.active : ''}`}
          title="Animoi"
          onClick={() => onToolChange(activeTool === 'animate' ? 'select' : 'animate')}
        >
          <span className={styles.icon}>▶</span>
          <span className={styles.label}>Animoi</span>
        </button>
      </aside>

      {/* Flyout-valikko – näytetään vain kun toolsOpen on true */}
      {toolsOpen && (
        <div className={styles.flyout}>

          {/* PELAAJAT */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Pelaajat</div>

            {/* Maalivahti */}
            <div className={styles.playerTypeLabel}>Maalivahti</div>
            <div className={styles.playerRow}>
              <button
                className={`${styles.playerBtn} ${activeTool === 'player' && toolOptions.playerTeam === 'gk' ? styles.itemActive : ''}`}
                style={{ '--c': '#f59e0b' }}
                onClick={() => pick('player', { playerTeam: 'gk' })}
                title="Maalivahti"
              />
            </div>

            {/* Hyökkääjät – ympyrät */}
            <div className={styles.playerTypeLabel}>Hyökkääjät</div>
            <div className={styles.playerRow}>
              {[
                { role: 'blue',  color: '#2563eb' },
                { role: 'red',   color: '#dc2626' },
                { role: 'green', color: '#16a34a' },
                { role: 'dark',  color: '#374151' },
              ].map(({ role, color }) => (
                <button
                  key={role}
                  className={`${styles.playerBtn} ${activeTool === 'player' && toolOptions.playerTeam === role ? styles.itemActive : ''}`}
                  style={{ '--c': color }}
                  onClick={() => pick('player', { playerTeam: role })}
                />
              ))}
            </div>

            {/* Puolustajat – kolmiot */}
            <div className={styles.playerTypeLabel}>Puolustajat</div>
            <div className={styles.playerRow}>
              {[
                { role: 'def_blue',  color: '#2563eb' },
                { role: 'def_red',   color: '#dc2626' },
                { role: 'def_green', color: '#16a34a' },
                { role: 'def_dark',  color: '#374151' },
              ].map(({ role, color }) => (
                <button
                  key={role}
                  className={`${styles.defBtn} ${activeTool === 'player' && toolOptions.playerTeam === role ? styles.itemActive : ''}`}
                  onClick={() => pick('player', { playerTeam: role })}
                >
                  <svg width="28" height="26" viewBox="0 0 28 26" style={{ display: 'block' }}>
                    <polygon points="14,1 27,25 1,25" fill={color} stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* MUUT */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Muut</div>
            <div className={styles.iconRow}>
              <button
                className={`${styles.iconBtn} ${activeTool === 'coach' ? styles.itemActive : ''}`}
                onClick={() => pick('coach')}
              >
                <span className={styles.bigIcon}>📋</span>
                <span className={styles.iconLabel}>Valmentaja</span>
              </button>
              <button
                className={`${styles.iconBtn} ${activeTool === 'ball' ? styles.itemActive : ''}`}
                onClick={() => pick('ball')}
              >
                <span className={styles.bigIcon}>⚽</span>
                <span className={styles.iconLabel}>Pallo</span>
              </button>
            </div>
          </div>

          {/* TÖTSÄT – värit CONE_COLORS-listasta */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Tötsät</div>
            <div className={styles.colorGrid}>
              {CONE_COLORS.map((c) => (
                <button
                  key={c.id}
                  className={`${styles.swatch} ${activeTool === 'cone' && toolOptions.coneColor === c.id ? styles.swatchActive : ''}`}
                  // Valkoisen tötsän reunus harmaa, muiden oma väri
                  style={{ background: c.hex, borderColor: c.id === 'white' ? '#94a3b8' : c.hex }}
                  onClick={() => pick('cone', { coneColor: c.id })}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* KEPIT – samat värit kuin tötsillä */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Kepit</div>
            <div className={styles.colorGrid}>
              {CONE_COLORS.map((c) => (
                <button
                  key={c.id}
                  className={`${styles.swatch} ${activeTool === 'pole' && toolOptions.poleColor === c.id ? styles.swatchActive : ''}`}
                  style={{ background: c.hex, borderColor: c.id === 'white' ? '#94a3b8' : c.hex }}
                  onClick={() => pick('pole', { poleColor: c.id })}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* MAALIT */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Maalit</div>
            <div className={styles.iconRow}>
              <button
                className={`${styles.iconBtn} ${activeTool === 'smallgoal' ? styles.itemActive : ''}`}
                onClick={() => pick('smallgoal')}
                title="Pieni maali"
              >
                <SmallGoalIcon />
                <span className={styles.iconLabel}>Pieni</span>
              </button>
              <button
                className={`${styles.iconBtn} ${activeTool === 'goal' ? styles.itemActive : ''}`}
                onClick={() => pick('goal')}
                title="Maali"
              >
                <GoalIcon />
                <span className={styles.iconLabel}>Maali</span>
              </button>
            </div>
          </div>

          {/* VÄLINEET – tikkaat ja aita */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Välineet</div>
            <div className={styles.iconRow}>
              <button
                className={`${styles.iconBtn} ${activeTool === 'ladder' ? styles.itemActive : ''}`}
                onClick={() => pick('ladder')}
                title="Tikkaat"
              >
                <LadderIcon />
                <span className={styles.iconLabel}>Tikkaat</span>
              </button>
              <button
                className={`${styles.iconBtn} ${activeTool === 'hurdle' ? styles.itemActive : ''}`}
                onClick={() => pick('hurdle')}
                title="Aita"
              >
                <HurdleIcon />
                <span className={styles.iconLabel}>Aita</span>
              </button>
            </div>
          </div>

          {/* LIIKE – nuolityypit, jokainen omalla visuaalisella esikatselulla */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Liike</div>
            {ARROW_TYPES.map((at) => (
              <button
                key={at.id}
                className={`${styles.arrowBtn} ${activeTool === 'arrow' && toolOptions.arrowType === at.id ? styles.itemActive : ''}`}
                onClick={() => pick('arrow', { arrowType: at.id })}
              >
                <ArrowPreview type={at.id} />
                <span className={styles.arrowLabel}>{at.label}</span>
              </button>
            ))}
            {/* Vapaa nuoli – piirretään vapaasti, nuolenpää tulee loppuun */}
            <button
              className={`${styles.arrowBtn} ${activeTool === 'freearrow' ? styles.itemActive : ''}`}
              onClick={() => pick('freearrow')}
            >
              <FreeArrowPreview />
              <span className={styles.arrowLabel}>Vapaa nuoli</span>
            </button>
          </div>

          {/* TEKSTI */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Teksti</div>
            <button
              className={`${styles.textBtn} ${activeTool === 'text' ? styles.itemActive : ''}`}
              onClick={() => pick('text')}
            >
              <span className={styles.textIcon}>T</span>
              <span className={styles.iconLabel}>Lisää teksti</span>
            </button>
          </div>

          {/* PIIRUSTUS – viiva, ympyrä ja vapaapiirto */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Piirustus</div>
            <div className={styles.iconRow}>
              <button
                className={`${styles.iconBtn} ${activeTool === 'line' ? styles.itemActive : ''}`}
                onClick={() => pick('line')}
                title="Viiva"
              >
                <LineIcon />
                <span className={styles.iconLabel}>Viiva</span>
              </button>
              <button
                className={`${styles.iconBtn} ${activeTool === 'circle' ? styles.itemActive : ''}`}
                onClick={() => pick('circle')}
                title="Ympyrä"
              >
                <CircleIcon />
                <span className={styles.iconLabel}>Ympyrä</span>
              </button>
              <button
                className={`${styles.iconBtn} ${activeTool === 'freehand' ? styles.itemActive : ''}`}
                onClick={() => pick('freehand')}
                title="Piirto"
              >
                <FreehandIcon />
                <span className={styles.iconLabel}>Piirto</span>
              </button>
            </div>
            {/* Väripaletti näytetään vain, kun jokin piirtotyökalu on aktiivinen */}
            {['line', 'circle', 'freehand'].includes(activeTool) && (
              <div className={styles.colorGrid} style={{ marginTop: 8 }}>
                {CONE_COLORS.map((c) => (
                  <button
                    key={c.id}
                    className={`${styles.swatch} ${toolOptions.drawColor === c.id ? styles.swatchActive : ''}`}
                    style={{ background: c.hex, borderColor: c.id === 'white' ? '#94a3b8' : c.hex }}
                    onClick={() => onToolOptionChange('drawColor', c.id)}
                    title={c.label}
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
