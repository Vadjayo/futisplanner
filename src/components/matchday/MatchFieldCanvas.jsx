/**
 * MatchFieldCanvas.jsx
 * Konva.js-pohjainen kenttänäkymä pelipäiväsuunnitteluun.
 * Tyhjä paikka → klikkaa → valitse pelaaja.
 * Miehitetty paikka → klikkaa → kontekstivalikko (vaihda / vaihtoon / poista).
 * Raahaa pelaaja toisen päälle → paikat vaihtuvat.
 */

import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import { Stage, Layer, Group, Circle, Rect, Line, Text as KonvaText } from 'react-konva'
import { COLORS } from '../../constants/colors'
import styles from './MatchFieldCanvas.module.css'

// Kentän loogiset mitat
const FIELD_W = 1000
const FIELD_H = 650

// Nurmikenttä ja kenttäviivat
const GRASS = '#1a3a1f'
const LINE  = 'rgba(255,255,255,0.12)'

// Pelaajan ympyrän säde (loogiset yksiköt)
const PLAYER_R = 26

/** Palauttaa true jos kenttäpaikalla on pelaaja */
function isFilled(slot) {
  return !!(slot.name || slot.number)
}

/**
 * Jalkapallokenttätausta Konva-elementteinä.
 * @param {number} s - Skaalauskerroin
 */
function FieldLines({ s }) {
  const W  = FIELD_W
  const H  = FIELD_H
  const lw = 1.5 * s
  return (
    <>
      <Rect x={0} y={0} width={W * s} height={H * s} fill={GRASS} />
      <Rect x={0} y={0} width={W * s} height={H * s} stroke={LINE} strokeWidth={lw} fill="transparent" />
      <Line points={[(W / 2) * s, 0, (W / 2) * s, H * s]} stroke={LINE} strokeWidth={lw} />
      <Circle x={(W / 2) * s} y={(H / 2) * s} radius={87 * s} stroke={LINE} strokeWidth={lw} fill="transparent" />
      <Circle x={(W / 2) * s} y={(H / 2) * s} radius={4 * s} fill={LINE} />
      <Rect x={0} y={((H - 386) / 2) * s} width={157 * s} height={386 * s} stroke={LINE} strokeWidth={lw} fill="transparent" />
      <Line points={[lw / 2, ((H - 70) / 2) * s, lw / 2, ((H + 70) / 2) * s]} stroke="#fbbf24" strokeWidth={5 * s} lineCap="round" />
      <Rect x={(W - 157) * s} y={((H - 386) / 2) * s} width={157 * s} height={386 * s} stroke={LINE} strokeWidth={lw} fill="transparent" />
      <Line points={[W * s - lw / 2, ((H - 70) / 2) * s, W * s - lw / 2, ((H + 70) / 2) * s]} stroke="#fbbf24" strokeWidth={5 * s} lineCap="round" />
    </>
  )
}

/**
 * Yksittäinen kenttäpaikka.
 * Vihreä ympyrä + numero + nimi jos miehitetty.
 * Tumma katkoviiva + pelipaikkakirjain jos tyhjä.
 * @param {object}   slot
 * @param {number}   s
 * @param {function} onClick   - Saa natiivitapahtuman (e.evt)
 * @param {function} onDragEnd - (newX, newY)
 */
function SlotToken({ slot, s, onClick, onDragEnd }) {
  const filled   = isFilled(slot)
  const r        = PLAYER_R * s
  const numSize  = Math.max(10, 14 * s)
  const nameSize = Math.max(8, 11 * s)
  const posSize  = Math.max(8, 11 * s)

  return (
    <Group
      x={slot.x * s}
      y={slot.y * s}
      draggable
      onClick={onClick}
      onTap={onClick}
      onDragEnd={(e) => onDragEnd(e.target.x() / s, e.target.y() / s)}
    >
      {filled ? (
        <>
          {/* Miehitetty paikka — vihreä */}
          <Circle radius={r} fill={COLORS.brand.primary} opacity={0.92} />
          <KonvaText
            text={String(slot.number || '')}
            fontSize={numSize}
            fontStyle="bold"
            fill="#fff"
            align="center"
            verticalAlign="middle"
            width={r * 2}
            height={r * 2}
            x={-r}
            y={-r}
            listening={false}
          />
          {slot.name && (
            <KonvaText
              text={slot.name.split(' ').slice(-1)[0]}
              fontSize={nameSize}
              fill="rgba(255,255,255,0.85)"
              align="center"
              width={90 * s}
              x={-45 * s}
              y={r + 4 * s}
              listening={false}
            />
          )}
        </>
      ) : (
        <>
          {/* Tyhjä paikka — tumma katkoviiva */}
          <Circle
            radius={r}
            fill="#0f1319"
            stroke="#2a2d3a"
            strokeWidth={1.5 * s}
            dash={[5 * s, 4 * s]}
          />
          <KonvaText
            text={slot.position}
            fontSize={posSize}
            fill="#2e3245"
            align="center"
            verticalAlign="middle"
            width={r * 2}
            height={r * 2}
            x={-r}
            y={-r}
            listening={false}
          />
        </>
      )}
    </Group>
  )
}

/**
 * Pelaajan valintadropdown.
 * Jo kentällä olevat pelaajat näkyvät haalennettuina mutta ovat silti valittavissa (vaihto).
 * @param {Array}    players    - Kaikki joukkueen pelaajat
 * @param {Set}      lineupIds  - PlayerId:t jo aloittavassa kokoonpanossa
 * @param {function} onSelect   - (player) => void
 * @param {function} onClose
 * @param {number}   clientX
 * @param {number}   clientY
 */
function PlayerPickerDropdown({ players, lineupIds, onSelect, onClose, clientX, clientY }) {
  // Estä dropdown menemästä näytön reunan yli
  const x = Math.min(clientX + 8, window.innerWidth  - 210)
  const y = Math.min(clientY + 8, window.innerHeight - 320)

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={onClose} />
      <div className={styles.pickerOverlay} style={{ left: x, top: y }}>
        <div className={styles.pickerTitle}>Valitse pelaaja</div>
        <div className={styles.pickerDivider} />
        {players.length === 0 ? (
          <div className={styles.pickerEmpty}>Ei pelaajia joukkueessa</div>
        ) : (
          players.map((p) => {
            const inLineup = lineupIds.has(p.id)
            return (
              <button
                key={p.id}
                className={`${styles.pickerItem} ${inLineup ? styles.pickerItemInLineup : ''}`}
                onClick={() => onSelect(p)}
              >
                <span className={styles.pickerNum}>{p.number ?? '–'}</span>
                <span className={styles.pickerName}>{p.name}</span>
                {inLineup && <span className={styles.pickerTag}>kentällä</span>}
              </button>
            )
          })
        )}
      </div>
    </>
  )
}

/**
 * Kontekstivalikko miehitetylle kentälle.
 * @param {object}   slot
 * @param {function} onSwap    - Vaihda pelaaja
 * @param {function} onSub     - Siirrä vaihtoon
 * @param {function} onRemove  - Poista paikalta
 * @param {function} onClose
 * @param {number}   clientX
 * @param {number}   clientY
 */
function SlotContextMenu({ slot, onSwap, onSub, onRemove, onClose, clientX, clientY }) {
  const x = Math.min(clientX + 8, window.innerWidth  - 210)
  const y = Math.min(clientY + 8, window.innerHeight - 180)

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={onClose} />
      <div className={styles.ctxMenu} style={{ left: x, top: y }}>
        <div className={styles.ctxTitle}>
          {slot.number ? `#${slot.number} ` : ''}{slot.name || slot.position}
        </div>
        <div className={styles.pickerDivider} />
        <button className={styles.ctxItem} onClick={onSwap}>🔄 Vaihda pelaaja</button>
        <button className={styles.ctxItem} onClick={onSub}>↕ Siirrä vaihtoon</button>
        <button className={`${styles.ctxItem} ${styles.ctxItemDanger}`} onClick={onRemove}>
          ✕ Poista kokoonpanosta
        </button>
      </div>
    </>
  )
}

/**
 * @param {Array}    lineup         - Aloittava kokoonpano (kaikki paikat, myös tyhjät)
 * @param {Array}    teamPlayers    - Kaikki joukkueen pelaajat
 * @param {function} onLineupChange - Kutsutaan kun lineup muuttuu
 * @param {function} onMoveToSub   - Kutsutaan kun pelaaja siirretään vaihtoon
 */
export default function MatchFieldCanvas({
  lineup       = [],
  teamPlayers  = [],
  onLineupChange,
  onMoveToSub,
}) {
  const containerRef = useRef(null)
  const [scale,   setScale]   = useState(0.6)
  const [picker,  setPicker]  = useState(null)   // { slotIndex, clientX, clientY }
  const [ctxMenu, setCtxMenu] = useState(null)   // { slotIndex, slot, clientX, clientY }

  // Laske skaalauskerroin kontainerin leveyden mukaan
  useEffect(() => {
    if (!containerRef.current) return
    const update = () => {
      const w = containerRef.current?.offsetWidth ?? 600
      setScale(w / FIELD_W)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  /** PlayerId:t jotka ovat jo aloittavassa kokoonpanossa */
  const lineupPlayerIds = useMemo(
    () => new Set(lineup.map((s) => s.playerId).filter(Boolean)),
    [lineup]
  )

  /**
   * Käsittelee kenttäpaikan klikkauksen.
   * Tyhjä → avaa pelaajan valitsin. Miehitetty → avaa kontekstivalikko.
   */
  const handleSlotClick = useCallback((index, evt) => {
    const { clientX, clientY } = evt
    const slot = lineup[index]
    if (!isFilled(slot)) {
      setPicker({ slotIndex: index, clientX, clientY })
      setCtxMenu(null)
    } else {
      setCtxMenu({ slotIndex: index, slot, clientX, clientY })
      setPicker(null)
    }
  }, [lineup])

  /**
   * Raahauksen päätyttyä: jos lähellä toista paikkaa → vaihda sijainnit.
   * Muuten → vapaa sijoittelu.
   */
  const handleDragEnd = useCallback((slotIndex, newX, newY) => {
    const clampedX = Math.max(PLAYER_R, Math.min(FIELD_W - PLAYER_R, newX))
    const clampedY = Math.max(PLAYER_R, Math.min(FIELD_H - PLAYER_R, newY))

    // Etsi lähin muu paikka
    const swapIdx = lineup.findIndex((slot, i) => {
      if (i === slotIndex) return false
      const dx = slot.x - clampedX
      const dy = slot.y - clampedY
      return Math.sqrt(dx * dx + dy * dy) < PLAYER_R * 3
    })

    if (swapIdx !== -1) {
      // Vaihda sijainnit — pelaajadata pysyy omissa paikoissaan
      const oldX = lineup[slotIndex].x
      const oldY = lineup[slotIndex].y
      onLineupChange(lineup.map((slot, i) => {
        if (i === slotIndex) return { ...slot, x: lineup[swapIdx].x, y: lineup[swapIdx].y }
        if (i === swapIdx)   return { ...slot, x: oldX,              y: oldY }
        return slot
      }))
    } else {
      // Vapaa sijoittelu
      onLineupChange(lineup.map((slot, i) =>
        i === slotIndex ? { ...slot, x: clampedX, y: clampedY } : slot
      ))
    }
  }, [lineup, onLineupChange])

  /**
   * Asettaa joukkuepelaajan valitulle paikalle.
   * Jos pelaaja on jo toisella paikalla → vaihdetaan keskenään.
   * @param {object} teamPlayer
   */
  function handlePickPlayer(teamPlayer) {
    const { slotIndex } = picker
    const existingIdx = lineup.findIndex((s) => s.playerId === teamPlayer.id)

    onLineupChange(lineup.map((slot, i) => {
      if (i === slotIndex) {
        return { ...slot, playerId: teamPlayer.id, name: teamPlayer.name, number: String(teamPlayer.number ?? '') }
      }
      if (i === existingIdx) {
        // Siirrä syrjäytetty pelaaja vapautuneelle paikalle
        const displaced = lineup[slotIndex]
        return { ...slot, playerId: displaced.playerId ?? null, name: displaced.name ?? '', number: displaced.number ?? '' }
      }
      return slot
    }))
    setPicker(null)
  }

  /** Poistaa pelaajan paikalta (tekee tyhjäksi) */
  function handleRemoveFromSlot() {
    const { slotIndex } = ctxMenu
    onLineupChange(lineup.map((slot, i) =>
      i === slotIndex ? { ...slot, playerId: null, name: '', number: '' } : slot
    ))
    setCtxMenu(null)
  }

  /** Avaa pelaajan valitsimen kontekstivalikon positiossa */
  function handleSwapPlayer() {
    const { slotIndex, clientX, clientY } = ctxMenu
    setCtxMenu(null)
    setPicker({ slotIndex, clientX, clientY })
  }

  /** Siirtää pelaajan vaihtomieslistalle */
  function handleMoveToSub() {
    const { slotIndex, slot } = ctxMenu
    const sub = {
      id:       slot.playerId ?? crypto.randomUUID(),
      playerId: slot.playerId ?? null,
      name:     slot.name,
      number:   slot.number,
      position: slot.position,
    }
    onLineupChange(lineup.map((s, i) =>
      i === slotIndex ? { ...s, playerId: null, name: '', number: '' } : s
    ))
    if (onMoveToSub) onMoveToSub(sub)
    setCtxMenu(null)
  }

  const canvasH = Math.round(FIELD_H * scale)
  const canvasW = containerRef.current?.offsetWidth ?? 600

  return (
    <div className={styles.wrap}>
      <div ref={containerRef} className={styles.canvasContainer}>
        <Stage width={canvasW} height={canvasH}>
          <Layer>
            <FieldLines s={scale} />
            {lineup.map((slot, index) => (
              <SlotToken
                key={slot.id}
                slot={slot}
                s={scale}
                onClick={(e) => handleSlotClick(index, e.evt)}
                onDragEnd={(x, y) => handleDragEnd(index, x, y)}
              />
            ))}
          </Layer>
        </Stage>
      </div>

      {/* Pelaajan valitsin */}
      {picker && (
        <PlayerPickerDropdown
          players={teamPlayers}
          lineupIds={lineupPlayerIds}
          onSelect={handlePickPlayer}
          onClose={() => setPicker(null)}
          clientX={picker.clientX}
          clientY={picker.clientY}
        />
      )}

      {/* Kontekstivalikko */}
      {ctxMenu && (
        <SlotContextMenu
          slot={ctxMenu.slot}
          onSwap={handleSwapPlayer}
          onSub={handleMoveToSub}
          onRemove={handleRemoveFromSlot}
          onClose={() => setCtxMenu(null)}
          clientX={ctxMenu.clientX}
          clientY={ctxMenu.clientY}
        />
      )}
    </div>
  )
}
