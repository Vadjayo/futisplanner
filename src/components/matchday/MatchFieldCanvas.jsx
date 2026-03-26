/**
 * MatchFieldCanvas.jsx
 * Konva.js-pohjainen kenttänäkymä pelipäiväsuunnitteluun.
 * Pelaajat raahattavissa kentällä; klikkaus avaa muokkauslomakkeen.
 */

import { useRef, useState, useCallback, useEffect } from 'react'
import { Stage, Layer, Group, Circle, Rect, Line, Text as KonvaText } from 'react-konva'
import Button  from '../ui/Button'
import Modal   from '../ui/Modal'
import { COLORS } from '../../constants/colors'
import styles  from './MatchFieldCanvas.module.css'

// Kentän loogiset mitat — samat kuin FieldBackground.jsx:ssä
const FIELD_W = 1000
const FIELD_H = 650

// Nurmikenttä ja kenttäviivat
const GRASS = '#1a3a1f'
const LINE  = 'rgba(255,255,255,0.12)'

// Pelaajan ympyrän säde (loogiset yksiköt)
const PLAYER_R = 28

/** Palauttaa pelaajan taustavärin pelipaikasta riippuen */
function playerColor(position) {
  if (position === 'MV') return COLORS.status.warning      // maalivahti: oranssi
  return COLORS.event.drill                                 // muut: vihreä
}

/**
 * Yksinkertaistettu jalkapallokenttätausta Konva-elementteinä.
 * Piirtää 11v11 kentän horisontaalisesti.
 * @param {number} s  - Skaalauskerroin (pikselit / loogiset yksiköt)
 */
function FieldLines({ s }) {
  const W = FIELD_W
  const H = FIELD_H
  const lw = 1.5 * s

  return (
    <>
      {/* Nurmi */}
      <Rect x={0} y={0} width={W * s} height={H * s} fill={GRASS} />
      {/* Kenttäraja */}
      <Rect x={0} y={0} width={W * s} height={H * s} stroke={LINE} strokeWidth={lw} fill="transparent" />
      {/* Keskiviiva */}
      <Line points={[(W / 2) * s, 0, (W / 2) * s, H * s]} stroke={LINE} strokeWidth={lw} />
      {/* Keskiympyrä */}
      <Circle x={(W / 2) * s} y={(H / 2) * s} radius={87 * s} stroke={LINE} strokeWidth={lw} fill="transparent" />
      <Circle x={(W / 2) * s} y={(H / 2) * s} radius={4 * s} fill={LINE} />
      {/* Vasen rangaistusalue */}
      <Rect x={0} y={((H - 386) / 2) * s} width={157 * s} height={386 * s} stroke={LINE} strokeWidth={lw} fill="transparent" />
      {/* Vasen maali */}
      <Line points={[lw / 2, ((H - 70) / 2) * s, lw / 2, ((H + 70) / 2) * s]} stroke="#fbbf24" strokeWidth={5 * s} lineCap="round" />
      {/* Oikea rangaistusalue */}
      <Rect x={(W - 157) * s} y={((H - 386) / 2) * s} width={157 * s} height={386 * s} stroke={LINE} strokeWidth={lw} fill="transparent" />
      {/* Oikea maali */}
      <Line points={[W * s - lw / 2, ((H - 70) / 2) * s, W * s - lw / 2, ((H + 70) / 2) * s]} stroke="#fbbf24" strokeWidth={5 * s} lineCap="round" />
    </>
  )
}

/**
 * Yksittäinen pelaajaikoni kentällä.
 * @param {object}   player    - { id, name, number, position, x, y }
 * @param {number}   s         - Skaalauskerroin
 * @param {boolean}  selected  - Onko valittu
 * @param {function} onClick
 * @param {function} onDragEnd - Kutsutaan raahauksen päättyessä
 */
function PlayerToken({ player, s, selected, onClick, onDragEnd }) {
  const color   = playerColor(player.position)
  const r       = PLAYER_R * s
  const fontSize = Math.max(9, 12 * s)
  const numSize  = Math.max(10, 14 * s)

  return (
    <Group
      x={player.x * s}
      y={player.y * s}
      draggable
      onClick={onClick}
      onTap={onClick}
      onDragEnd={(e) => onDragEnd(e.target.x() / s, e.target.y() / s)}
    >
      {/* Valintarengas */}
      {selected && (
        <Circle
          radius={r + 4 * s}
          fill="transparent"
          stroke="#fff"
          strokeWidth={2 * s}
          opacity={0.7}
        />
      )}
      {/* Taustaympyrä */}
      <Circle radius={r} fill={color} opacity={0.92} />
      {/* Numero */}
      <KonvaText
        text={String(player.number || '')}
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
      {/* Pelipaikka pienellä */}
      {!player.number && (
        <KonvaText
          text={player.position}
          fontSize={Math.max(8, 10 * s)}
          fill="rgba(255,255,255,0.7)"
          align="center"
          width={r * 2}
          x={-r}
          y={-4 * s}
          listening={false}
        />
      )}
      {/* Nimi ympyrän alla */}
      <KonvaText
        text={player.name ? player.name.split(' ').slice(-1)[0] : player.position}
        fontSize={fontSize}
        fill="#fff"
        align="center"
        width={80 * s}
        x={-40 * s}
        y={r + 4 * s}
        listening={false}
      />
    </Group>
  )
}

/**
 * @param {Array}    lineup          - Aloittava kokoonpano
 * @param {function} onLineupChange  - Kutsutaan kun lineup muuttuu
 */
export default function MatchFieldCanvas({ lineup = [], onLineupChange }) {
  const containerRef = useRef(null)
  const [scale,    setScale]    = useState(0.6)
  const [selected, setSelected] = useState(null)   // valitun pelaajan id
  const [editingPlayer, setEditingPlayer] = useState(null)  // muokkauslomake
  const [editName,   setEditName]   = useState('')
  const [editNumber, setEditNumber] = useState('')

  // Laske skaalauskerroin kontainerin leveyden mukaan
  useEffect(() => {
    if (!containerRef.current) return
    const updateScale = () => {
      const w = containerRef.current?.offsetWidth ?? 600
      setScale(w / FIELD_W)
    }
    updateScale()
    const ro = new ResizeObserver(updateScale)
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  /** Pelaajan raahauksen jälkeen päivitä koordinaatit */
  const handleDragEnd = useCallback((playerId, newX, newY) => {
    // Rajaa pelaaja kenttäviivalle
    const clampedX = Math.max(10, Math.min(FIELD_W - 10, newX))
    const clampedY = Math.max(10, Math.min(FIELD_H - 10, newY))
    onLineupChange(
      lineup.map((p) =>
        p.id === playerId ? { ...p, x: clampedX, y: clampedY } : p
      )
    )
  }, [lineup, onLineupChange])

  /** Avaa pelaajan muokkauslomake */
  const handlePlayerClick = useCallback((player) => {
    setSelected(player.id)
    setEditingPlayer(player)
    setEditName(player.name ?? '')
    setEditNumber(String(player.number ?? ''))
  }, [])

  /** Tallenna muokkaukset */
  function handleSaveEdit() {
    if (!editingPlayer) return
    onLineupChange(
      lineup.map((p) =>
        p.id === editingPlayer.id
          ? { ...p, name: editName, number: editNumber }
          : p
      )
    )
    setEditingPlayer(null)
    setSelected(null)
  }

  const canvasH = Math.round(FIELD_H * scale)

  return (
    <div className={styles.wrap}>
      <div ref={containerRef} className={styles.canvasContainer}>
        <Stage width={containerRef.current?.offsetWidth ?? 600} height={canvasH}>
          <Layer>
            <FieldLines s={scale} />
            {lineup.map((player) => (
              <PlayerToken
                key={player.id}
                player={player}
                s={scale}
                selected={selected === player.id}
                onClick={() => handlePlayerClick(player)}
                onDragEnd={(x, y) => handleDragEnd(player.id, x, y)}
              />
            ))}
          </Layer>
        </Stage>
      </div>

      {/* Pelaajan muokkausmodaali */}
      <Modal
        isOpen={!!editingPlayer}
        onClose={() => { setEditingPlayer(null); setSelected(null) }}
        title={`Muokkaa — ${editingPlayer?.position ?? ''}`}
        size="sm"
        footer={
          <>
            <Button variant="primary" onClick={handleSaveEdit}>Tallenna</Button>
            <Button variant="ghost" onClick={() => { setEditingPlayer(null); setSelected(null) }}>Peruuta</Button>
          </>
        }
      >
        <div className={styles.editForm}>
          <label className={styles.editLabel}>
            Numero
            <input
              className={styles.editInput}
              type="number"
              min="1"
              max="99"
              value={editNumber}
              onChange={(e) => setEditNumber(e.target.value)}
              placeholder="esim. 9"
            />
          </label>
          <label className={styles.editLabel}>
            Nimi
            <input
              className={styles.editInput}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Sukunimi"
              maxLength={30}
            />
          </label>
        </div>
      </Modal>
    </div>
  )
}
