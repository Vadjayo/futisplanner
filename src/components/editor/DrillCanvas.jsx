/**
 * DrillCanvas.jsx
 * Konva-pohjainen kenttäpiirtotyökalu. Hallitsee kaikki piirto-, valinta- ja animaatiotoiminnot.
 */

import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import {
  Stage, Layer, Group,
  Circle, Rect, RegularPolygon, Arrow, Line, Ellipse, Arc, Ring,
  Text as KonvaText, Transformer,
} from 'react-konva'
import FieldBackground from './FieldBackground'
import { useAnimationEngine, getAnimatedPos } from '../../hooks/useAnimationEngine'
import { CONE_HEX, DRAW_HEX } from '../../constants/colors'
import styles from './DrillCanvas.module.css'

// Kentän looginen koko pikseleinä – skaalaus lasketaan tästä suhteessa kontainerin leveyteen
const FIELD_W = 1000
const FIELD_H = 650

// Piirtotyökalut — elementin drag/valinta ohitetaan näiden aikana
const DRAWING_TOOLS = ['arrow', 'line', 'circle', 'freehand', 'freearrow', 'zone', 'triangle']

// Pelaajan värit joukkueroolin mukaan — vakio komponentin ulkopuolella (ei luoda per render)
const ROLE_COLORS = {
  gk: '#EF9F27', blue: '#2563eb', red: '#dc2626', green: '#16a34a', dark: '#374151',
  home: '#2563eb', away: '#dc2626',
}

// Select Diamond -tyylisen pallon ovaalikuvioiden kulmat (astetta, 5 kpl)
const BALL_PANEL_DEGS = [0, 72, 144, 216, 288]

// Palauttaa nuolityyliin liittyvät visuaaliset parametrit tyypin ja skaalauskertoimen mukaan
function getArrowStyle(arrowType, s) {
  switch (arrowType) {
    case 'syotto':
      return { stroke: 'white',    fill: 'white',    strokeWidth: 2.5*s, dash: null,           pLen: 10*s, pWidth: 8*s }
    case 'liike':
      return { stroke: 'white',    fill: 'white',    strokeWidth: 2*s,   dash: [8*s, 5*s],     pLen: 9*s,  pWidth: 7*s }
    case 'laukaus':
      return { stroke: '#f97316',  fill: '#f97316',  strokeWidth: 3.5*s, dash: null,           pLen: 14*s, pWidth: 10*s }
    case 'kuljetus':
      return { stroke: '#E24B4A',  fill: '#E24B4A',  strokeWidth: 2.5*s, dash: [3*s, 4*s],     pLen: 10*s, pWidth: 8*s }
    case 'kaareva':
      return { stroke: '#EF9F27', fill: '#EF9F27', strokeWidth: 2*s, dash: null, pLen: 10*s, pWidth: 8*s }
    case 'bidir':
      return { stroke: '#378ADD',  fill: '#378ADD',  strokeWidth: 2.5*s, dash: null,       pLen: 10*s, pWidth: 8*s }
    case 'offball':
      return { stroke: '#a78bfa',  fill: '#a78bfa',  strokeWidth: 2*s,   dash: [5*s,4*s],  pLen: 9*s,  pWidth: 7*s }
    default:
      return { stroke: 'white',    fill: 'white',    strokeWidth: 2.5*s, dash: null,           pLen: 10*s, pWidth: 8*s }
  }
}

// Laskee aaltoviivan pisteet kuljetusnuolelle – simuloi pallon pompottelua
// Palaa suoraan viivaan viimeisten 12 yksikön matkalla nuolenpäätä varten
function getKuljetusPoints(x1, y1, x2, y2, scale) {
  const dx = x2 - x1
  const dy = y2 - y1
  const length = Math.sqrt(dx * dx + dy * dy)
  // Liian lyhyt viiva – ei aalloiteta
  if (length < 5) return [x1 * scale, y1 * scale, x2 * scale, y2 * scale]
  const ux = dx / length, uy = dy / length
  const px = -uy, py = ux // kohtisuora vektori aallon sivusuunnalle
  const amplitude = 7
  const wavelength = 30
  const lineEnd = Math.max(0, length - 12) // viimeinen 12 yksikköä suora (nuolenpää)
  const numPoints = Math.max(8, Math.ceil(lineEnd / 4))
  const pts = []
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints
    const along = t * lineEnd
    // Siniaalto kohtisuoraan liikesuuntaan nähden
    const wave = amplitude * Math.sin((along / wavelength) * 2 * Math.PI)
    pts.push((x1 + along * ux + wave * px) * scale, (y1 + along * uy + wave * py) * scale)
  }
  // Lisätään loppupiste suoraan nuolenpäähän
  pts.push(x2 * scale, y2 * scale)
  return pts
}

// Laskee kaareva-nuolen pisteet quadratic bezier -käyrällä
// Kontrollipiste on 40 loogista yksikköä linjan keskilinjasta kohtisuoraan
function getKaarvaPoints(x1, y1, x2, y2, scale) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.sqrt(dx*dx + dy*dy) || 1
  // Kohtisuora vektori
  const px = -dy / len * 40
  const py =  dx / len * 40
  // Konva Arrow ei tue bezier-käyrää suoraan, joten approksimoidaan monisegmenttiviivalla
  const N = 20
  const pts = []
  for (let i = 0; i <= N; i++) {
    const t = i / N
    // Quadratic bezier: P = (1-t)^2*P0 + 2*(1-t)*t*PC + t^2*P1
    const bx = (1-t)*(1-t)*x1 + 2*(1-t)*t*(mx+px) + t*t*x2
    const by = (1-t)*(1-t)*y1 + 2*(1-t)*t*(my+py) + t*t*y2
    pts.push(bx * scale, by * scale)
  }
  return pts
}

// Laskee nuolenpään pisteet vapaan nuolen lopulle – käyttää viimeisiä pisteitä suunnan arvaamiseen
function getFreeArrowHead(points, scale) {
  const n = points.length
  if (n < 4) return null
  const lastX = points[n - 2], lastY = points[n - 1]
  // Katsotaan taaksepäin enintään 9 pisteparia pehmeämmän suunnan saamiseksi
  const backIdx = Math.max(0, n - 20)
  const angle = Math.atan2(lastY - points[backIdx + 1], lastX - points[backIdx])
  const len = 12, spread = Math.PI / 6
  return [
    (lastX - len * Math.cos(angle - spread)) * scale,
    (lastY - len * Math.sin(angle - spread)) * scale,
    lastX * scale,
    lastY * scale,
    (lastX - len * Math.cos(angle + spread)) * scale,
    (lastY - len * Math.sin(angle + spread)) * scale,
  ]
}

// Pääkomponentti: Konva-pohjainen harjoituskenttä
// Props: elements – kenttäelementtien lista, fieldType – kentän tyyppi,
//        activeTool – valittu työkalu, toolOptions – lisäasetukset, onChange – elementit päivitetty
// Ref: exposoi getImageDataUrl() PDF-vientiä varten
const DrillCanvas = forwardRef(function DrillCanvas({ elements, fieldType, activeTool, toolOptions, onChange }, ref) {
  const containerRef = useRef(null)
  const stageRef = useRef(null)
  const trRef = useRef(null) // Konva Transformer -viite valitun elementin muokkaamiseen

  // Exposoi metodit ref:n kautta: PDF-vienti ja toolbar-raahauksen pudotus
  useImperativeHandle(ref, () => ({
    getImageDataUrl: () => stageRef.current?.toDataURL({ pixelRatio: 2 }),
    // Lisää elementti clientX/clientY-koordinaateista (käytetään toolbar-drag & dropissa)
    dropElement: (tool, options, clientX, clientY) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      addElement({ x: clientX - rect.left, y: clientY - rect.top }, tool, options)
    },
  }))

  const [stageWidth, setStageWidth] = useState(800)
  const [zoom, setZoom] = useState(1)
  const [selectedIds, setSelectedIds] = useState([])     // valitut elementit (yksi tai useita)
  const [deleteBtnPos, setDeleteBtnPos] = useState(null) // Poista-napin sijainti pikseleissä
  const [drawingArrow, setDrawingArrow] = useState(null) // Kesken oleva nuolenpiirto
  const [drawingShape, setDrawingShape] = useState(null) // Kesken oleva muodonpiirto
  const [editingText, setEditingText] = useState(null)   // Tekstielementti, jota muokataan
  const [selectionRect, setSelectionRect] = useState(null) // Kumilankahaku-suorakulmio {x,y,w,h}
  const [editingPlayerLabel, setEditingPlayerLabel] = useState(null) // Pelaajan positiotunnisteen muokkaus
  const selectionStartRef = useRef(null)    // Kumilankahaku aloituspiste pikseleinä
  const rubberBandApplied = useRef(false)   // Estetään handleStageClick kumilankahaulta
  const historyRef = useRef([])             // Undo-historia (max 50 tilaa)
  const redoRef = useRef([])               // Redo-pino (tyhjenee uuden muutoksen myötä)
  const clipboardRef = useRef([])          // Kopioitu elementtijoukko (Ctrl+C)
  const groupDragStartRef = useRef(null)    // Ryhmäsiirron ankkurielementtien lähtötilanne

  // Skaalauskerroin: looginen kenttäleveys sovitetaan kontainerin pikselileveyteen
  const scale = stageWidth / FIELD_W
  const stageHeight = FIELD_H * scale

  // ── ANIMAATIO ──
  const {
    animSelectedId, setAnimSelectedId,
    isPlaying, animProgress, animProgressRef,
    playAnim, pauseAnim, resetAnim, resetAll,
  } = useAnimationEngine({ stageRef, elements, scale })

  // Seurataan kontainerin leveyttä ResizeObserverilla – päivitetään skaalaus automaattisesti
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width
      if (w > 0) setStageWidth(w)
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // Poistetaan valinta kun siirrytään piirto- tai animaatiotilaan
  useEffect(() => {
    if ([...DRAWING_TOOLS, 'animate'].includes(activeTool)) setSelectedIds([])
  }, [activeTool])

  // Pysäytetään animaatio ja nollataan tila kun poistutaan animaatiotilasta
  useEffect(() => {
    if (activeTool !== 'animate') resetAll()
  }, [activeTool]) // eslint-disable-line react-hooks/exhaustive-deps

  // commitChange – tallentaa nykyisen tilan historiaan ennen muutosta (Ctrl+Z käyttää tätä)
  const commitChange = useCallback((newElements) => {
    historyRef.current = [...historyRef.current.slice(-49), elements]
    redoRef.current = []  // uusi muutos tyhjentää redo-pinon
    onChange(newElements)
  }, [elements, onChange])

  // Siirtää elementin annetulla dx/dy-deltalla – tukee kaikkia elementtityyppejä
  function moveElementByDelta(el, dx, dy) {
    if (el.x1 !== undefined) return { ...el, x1: el.x1 + dx, y1: el.y1 + dy, x2: el.x2 + dx, y2: el.y2 + dy }
    if (el.points) return { ...el, points: el.points.map((v, i) => i % 2 === 0 ? v + dx : v + dy) }
    return { ...el, x: el.x + dx, y: el.y + dy }
  }

  // Päivitetään Transformer-solmu ja poista-napin sijainti aina kun valinta muuttuu
  useEffect(() => {
    if (!trRef.current || !stageRef.current) return
    if (selectedIds.length > 0) {
      const nodes = selectedIds.flatMap((id) => {
        const node = stageRef.current.findOne(`#el_${id}`)
        return node ? [node] : []
      })
      trRef.current.nodes(nodes)
      trRef.current.getLayer()?.batchDraw()
      if (nodes.length > 0) {
        const box = trRef.current.getClientRect()
        setDeleteBtnPos({ x: box.x + box.width, y: box.y })
      }
    } else {
      trRef.current.nodes([])
      trRef.current.getLayer()?.batchDraw()
      setDeleteBtnPos(null)
    }
  }, [selectedIds])

  // Poistaa valitut elementit elementtilistasta
  function deleteSelected() {
    commitChange(elements.filter((el) => !selectedIds.includes(el.id)))
    setSelectedIds([])
    setDeleteBtnPos(null)
  }

  // Apufunktio: siirtää elementtiä +20 loogista yksikköä (liitä/monista)
  function offsetElement(el) {
    const out = { ...el, id: crypto.randomUUID() }
    if (out.x !== undefined) { out.x += 20; out.y += 20 }
    if (out.x1 !== undefined) { out.x1 += 20; out.y1 += 20; out.x2 += 20; out.y2 += 20 }
    if (out.points) out.points = out.points.map((v) => v + 20)
    return out
  }

  // Delete/Backspace poistaa, Ctrl+Z undo, Ctrl+Y redo, Ctrl+C kopioi, Ctrl+V liitä, Ctrl+D monista
  useEffect(() => {
    function handleKey(e) {
      if (editingText) return
      // Älä reagoi kun fokus on syötekentässä (sivupalkin kentät)
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      const mod = e.ctrlKey || e.metaKey

      // Undo
      if (mod && !e.shiftKey && e.key === 'z') {
        e.preventDefault()
        if (historyRef.current.length > 0) {
          const prev = historyRef.current[historyRef.current.length - 1]
          redoRef.current = [...redoRef.current.slice(-49), elements]
          historyRef.current = historyRef.current.slice(0, -1)
          onChange(prev)
        }
        return
      }
      // Redo
      if (mod && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault()
        if (redoRef.current.length > 0) {
          const next = redoRef.current[redoRef.current.length - 1]
          historyRef.current = [...historyRef.current.slice(-49), elements]
          redoRef.current = redoRef.current.slice(0, -1)
          onChange(next)
        }
        return
      }
      // Kopioi
      if (mod && e.key === 'c' && selectedIds.length > 0) {
        e.preventDefault()
        clipboardRef.current = elements.filter((el) => selectedIds.includes(el.id))
        return
      }
      // Liitä
      if (mod && e.key === 'v' && clipboardRef.current.length > 0) {
        e.preventDefault()
        const pasted = clipboardRef.current.map(offsetElement)
        commitChange([...elements, ...pasted])
        setSelectedIds(pasted.map((el) => el.id))
        return
      }
      // Monista (Ctrl+D)
      if (mod && e.key === 'd' && selectedIds.length > 0) {
        e.preventDefault()
        const duped = elements.filter((el) => selectedIds.includes(el.id)).map(offsetElement)
        commitChange([...elements, ...duped])
        setSelectedIds(duped.map((el) => el.id))
        return
      }
      // Poista
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        commitChange(elements.filter((el) => !selectedIds.includes(el.id)))
        setSelectedIds([])
        setDeleteBtnPos(null)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [selectedIds, elements, onChange, commitChange, editingText])

  // Muuntaa Stage-koordinaatit loogisiksi kenttäkoordinaateiksi
  function toLogical(stageX, stageY) {
    return { x: stageX / scale, y: stageY / scale }
  }

  // Hakee hiiren tai sormen sijainnin loogisina koordinaatteina
  function getPointerLogical() {
    const pos = stageRef.current.getPointerPosition()
    return toLogical(pos.x, pos.y)
  }

  // Etsii seuraavan vapaan pelaajanuomeron annetulle joukkueelle (1–22)
  function nextPlayerNumber(team) {
    const nums = elements
      .filter((el) => el.type === 'player' && el.team === team)
      .map((el) => el.number)
    for (let i = 1; i <= 22; i++) {
      if (!nums.includes(i)) return i
    }
    // Yli 22 pelaajaa – käytetään listan pituutta varanuomerana
    return nums.length + 1
  }

  // Luo uuden elementin annettuun Stage-koordinaattiin — hyväksyy optionaaliset tool/options-overridet
  // (käytetään sekä klikkauksesta että toolbar-raahauksen pudotuksesta)
  function addElement(stagePos, toolOverride, optionsOverride) {
    const { x, y } = toLogical(stagePos.x, stagePos.y)
    const id = crypto.randomUUID()
    const tool = toolOverride ?? activeTool
    const opts = optionsOverride ? { ...toolOptions, ...optionsOverride } : toolOptions
    const team = opts?.playerTeam ?? 'home'
    const coneColor = opts?.coneColor ?? 'orange'

    let newEl
    switch (tool) {
      case 'player':
        newEl = { id, type: 'player', x, y, number: nextPlayerNumber(team), team, shape: opts?.playerShape ?? 'att', rotation: 0 }
        break
      case 'coach':
        newEl = { id, type: 'coach', x, y }
        break
      case 'ball':
        newEl = { id, type: 'ball', x, y }
        break
      case 'cone':
        newEl = { id, type: 'cone', x, y, color: coneColor }
        break
      case 'pole':
        newEl = { id, type: 'pole', x, y, color: opts?.poleColor ?? 'yellow' }
        break
      case 'smallgoal':
        newEl = { id, type: 'smallgoal', x, y, rotation: 0 }
        break
      case 'goal':
        newEl = { id, type: 'goal', x, y, rotation: 0 }
        break
      case 'ladder':
        newEl = { id, type: 'ladder', x, y, rotation: 0 }
        break
      case 'hurdle':
        newEl = { id, type: 'hurdle', x, y, rotation: 0 }
        break
      case 'mannequin':
        newEl = { id, type: 'mannequin', x, y, rotation: 0 }
        break
      case 'hoop':
        newEl = { id, type: 'hoop', x, y, rotation: 0 }
        break
      case 'minifield':
        newEl = { id, type: 'minifield', x, y, rotation: 0 }
        break
      case 'text':
        newEl = { id, type: 'text', x, y, text: 'Teksti' }
        break
      default:
        return
    }

    commitChange([...elements, newEl])
    // Avataan tekstieditori heti kun tekstielementti lisätään
    if (activeTool === 'text') {
      setEditingText({ id, x: stagePos.x, y: stagePos.y, text: 'Teksti' })
    }
  }

  // Käsittelee klikkaukset Stagella – nuoli/viiva/ympyrä/vapaapiirto ohitetaan (ne käyttävät mousedown/up)
  function handleStageClick(e) {
    if (['arrow', 'line', 'circle', 'freehand', 'freearrow', 'zone', 'triangle'].includes(activeTool)) return
    const isBackground = e.target === e.target.getStage() ||
      (e.target.getClassName?.() === 'Rect' && !e.target.id())

    // Animaatiotila: klikkaus taustaan lisää reittipisteen valitulle elementille
    if (activeTool === 'animate') {
      if (isBackground && animSelectedId) {
        const { x, y } = getPointerLogical()
        onChange(elements.map((el) =>
          el.id === animSelectedId
            ? { ...el, animPath: [...(el.animPath ?? []), { x, y }] }
            : el
        ))
      }
      return
    }

    if (activeTool === 'select') {
      if (rubberBandApplied.current) { rubberBandApplied.current = false; return }
      if (isBackground) setSelectedIds([])
      return
    }
    // Tyhjään kohtaan klikkaus poistaa valinnan kaikissa muissa tiloissa
    if (isBackground) setSelectedIds([])
    // Teksti lisätään klikkaamalla — kaikki muut elementit vain drag & dropilla toolbarista
    if (activeTool === 'text') {
      addElement(stageRef.current.getPointerPosition())
    }
  }

  // Aloittaa nuolen/muodon piirtämisen tai kumilankahauun valinta-tilassa
  function handleMouseDown(e) {
    const { x, y } = getPointerLogical()
    if (activeTool === 'arrow') {
      setDrawingArrow({ x1: x, y1: y, x2: x, y2: y })
    } else if (activeTool === 'line' || activeTool === 'circle' || activeTool === 'zone' || activeTool === 'triangle') {
      setDrawingShape({ type: activeTool, x1: x, y1: y, x2: x, y2: y })
    } else if (activeTool === 'freehand') {
      setDrawingShape({ type: 'freehand', points: [x, y] })
    } else if (activeTool === 'freearrow') {
      setDrawingShape({ type: 'freearrow', points: [x, y] })
    } else if (activeTool === 'select') {
      // Kumilankahaku alkaa vain taustalta (ei elementtien päältä)
      const isBackground = e.target === e.target.getStage() ||
        (e.target.getClassName?.() === 'Rect' && !e.target.id())
      if (isBackground) {
        const pos = stageRef.current.getPointerPosition()
        selectionStartRef.current = pos
        setSelectionRect(null)
      }
    }
  }

  // Päivittää kesken olevan piirron tai kumilankahaku-suorakulmion
  function handleMouseMove() {
    if (activeTool === 'select' && selectionStartRef.current) {
      const pos = stageRef.current.getPointerPosition()
      const sx = selectionStartRef.current.x
      const sy = selectionStartRef.current.y
      setSelectionRect({
        x: Math.min(sx, pos.x), y: Math.min(sy, pos.y),
        w: Math.abs(pos.x - sx), h: Math.abs(pos.y - sy),
      })
      return
    }
    if (!drawingArrow && !drawingShape) return
    const { x, y } = getPointerLogical()
    if (drawingArrow) {
      setDrawingArrow((prev) => ({ ...prev, x2: x, y2: y }))
    } else if (drawingShape?.type === 'freehand' || drawingShape?.type === 'freearrow') {
      setDrawingShape((prev) => ({ ...prev, points: [...prev.points, x, y] }))
    } else {
      setDrawingShape((prev) => ({ ...prev, x2: x, y2: y }))
    }
  }

  // Tallentaa valmiin nuolen/muodon tai päättää kumilankahauun
  function handleMouseUp() {
    // Kumilankahaku päättyy – valitaan suorakulmion sisällä olevat elementit
    if (activeTool === 'select' && selectionStartRef.current) {
      if (selectionRect && selectionRect.w > 5 && selectionRect.h > 5) {
        const minX = selectionRect.x / scale
        const maxX = (selectionRect.x + selectionRect.w) / scale
        const minY = selectionRect.y / scale
        const maxY = (selectionRect.y + selectionRect.h) / scale
        const inRect = elements
          .filter((el) => {
            const cx = el.x ?? el.x1 ?? (el.points ? el.points[0] : null)
            const cy = el.y ?? el.y1 ?? (el.points ? el.points[1] : null)
            return cx != null && cx >= minX && cx <= maxX && cy != null && cy >= minY && cy <= maxY
          })
          .map((el) => el.id)
        if (inRect.length > 0) {
          setSelectedIds(inRect)
          rubberBandApplied.current = true
        }
      }
      selectionStartRef.current = null
      setSelectionRect(null)
      return
    }

    if (drawingArrow) {
      const dx = drawingArrow.x2 - drawingArrow.x1
      const dy = drawingArrow.y2 - drawingArrow.y1
      if (Math.sqrt(dx * dx + dy * dy) > 15) {
        commitChange([...elements, {
          id: crypto.randomUUID(), type: 'arrow',
          x1: drawingArrow.x1, y1: drawingArrow.y1,
          x2: drawingArrow.x2, y2: drawingArrow.y2,
          arrowType: toolOptions?.arrowType ?? 'syotto',
        }])
      }
      setDrawingArrow(null)
      return
    }
    if (!drawingShape) return
    const color = toolOptions?.drawColor ?? 'white'
    const id = crypto.randomUUID()
    if (drawingShape.type === 'line') {
      const dx = drawingShape.x2 - drawingShape.x1
      const dy = drawingShape.y2 - drawingShape.y1
      if (Math.sqrt(dx * dx + dy * dy) > 5)
        commitChange([...elements, { id, type: 'line', x1: drawingShape.x1, y1: drawingShape.y1, x2: drawingShape.x2, y2: drawingShape.y2, color }])
    } else if (drawingShape.type === 'circle') {
      const dx = drawingShape.x2 - drawingShape.x1
      const dy = drawingShape.y2 - drawingShape.y1
      const radius = Math.sqrt(dx * dx + dy * dy)
      if (radius > 5)
        commitChange([...elements, { id, type: 'circle', x: drawingShape.x1, y: drawingShape.y1, radius, color }])
    } else if (drawingShape.type === 'zone') {
      const w = drawingShape.x2 - drawingShape.x1
      const h = drawingShape.y2 - drawingShape.y1
      if (Math.abs(w) > 10 && Math.abs(h) > 10)
        commitChange([...elements, {
          id, type: 'zone',
          x: Math.min(drawingShape.x1, drawingShape.x2),
          y: Math.min(drawingShape.y1, drawingShape.y2),
          width: Math.abs(w), height: Math.abs(h), color,
        }])
    } else if (drawingShape.type === 'triangle') {
      const dx = drawingShape.x2 - drawingShape.x1
      const dy = drawingShape.y2 - drawingShape.y1
      const radius = Math.sqrt(dx * dx + dy * dy)
      if (radius > 5)
        commitChange([...elements, { id, type: 'triangle', x: drawingShape.x1, y: drawingShape.y1, radius, color }])
    } else if (drawingShape.type === 'freehand') {
      if (drawingShape.points.length >= 6)
        commitChange([...elements, { id, type: 'freehand', points: drawingShape.points, color }])
    } else if (drawingShape.type === 'freearrow') {
      if (drawingShape.points.length >= 6)
        commitChange([...elements, { id, type: 'freearrow', points: drawingShape.points }])
    }
    setDrawingShape(null)
  }

  // Päivittää elementin x/y-koordinaatit vetämisen jälkeen – tukee ryhmäsiirtoa
  const handleDragEnd = useCallback((e, id) => {
    const node = e.target
    const el = elements.find((el) => el.id === id)
    if (el && selectedIds.includes(id) && selectedIds.length > 1) {
      // Ryhmäsiirto: delta lasketaan elementin tallennetusta sijainnista
      const dx = node.x() / scale - el.x
      const dy = node.y() / scale - el.y
      commitChange(elements.map((elem) =>
        selectedIds.includes(elem.id) ? moveElementByDelta(elem, dx, dy) : elem
      ))
      groupDragStartRef.current = null
      return
    }
    commitChange(elements.map((elem) =>
      elem.id === id ? { ...elem, x: node.x() / scale, y: node.y() / scale } : elem
    ))
  }, [elements, commitChange, scale, selectedIds])

  // Tallentaa rotaation ja skaalauksen Transformer-muokkauksen jälkeen
  const handleTransformEnd = useCallback((e, id) => {
    const node = e.target
    commitChange(elements.map((el) =>
      el.id === id
        ? { ...el, rotation: node.rotation(), scaleX: node.scaleX(), scaleY: node.scaleY() }
        : el
    ))
  }, [elements, commitChange])

  // Pyörittää elementtiä hiiren rullalla — vain jos elementti on valittuna (estää vahingossa pyörittämisen)
  const handleWheel = useCallback((e, id) => {
    e.evt.preventDefault()
    const delta = e.evt.deltaY > 0 ? 45 : -45
    commitChange(elements.map((el) =>
      el.id === id ? { ...el, rotation: ((el.rotation ?? 0) + delta + 360) % 360 } : el
    ))
  }, [elements, commitChange])

  // Siirtää nuolen/viivan molempia päätepisteitä yhtä paljon – tukee ryhmäsiirtoa
  const handleArrowDragEnd = useCallback((e, id) => {
    const dx = e.target.x() / scale
    const dy = e.target.y() / scale
    if (selectedIds.includes(id) && selectedIds.length > 1) {
      commitChange(elements.map((el) =>
        selectedIds.includes(el.id) ? moveElementByDelta(el, dx, dy) : el
      ))
      groupDragStartRef.current = null
      e.target.position({ x: 0, y: 0 })
      return
    }
    commitChange(elements.map((el) =>
      el.id === id
        ? { ...el, x1: el.x1 + dx, y1: el.y1 + dy, x2: el.x2 + dx, y2: el.y2 + dy }
        : el
    ))
    e.target.position({ x: 0, y: 0 })
  }, [elements, commitChange, scale, selectedIds])

  // Asettaa elementin valituksi tai polunmuokkaukseen animaatiotilassa
  // Piirtotyökalujen aikana klikkaus ohitetaan — piirto menee edelle
  function selectEl(e, id) {
    e.cancelBubble = true  // Estetään klikkauksen kupliminen stagelle
    if (activeTool === 'animate') {
      // Vain pelaaja, valmentaja ja pallo voivat saada animaatiopolun
      const el = elements.find((el) => el.id === id)
      if (el && ['player', 'coach', 'ball'].includes(el.type)) {
        setAnimSelectedId(id)
      }
      return
    }
    // Piirtotyökalujen aikana elementtien klikkaus ohitetaan
    if (DRAWING_TOOLS.includes(activeTool)) return
    if (e.evt?.shiftKey) {
      // Shift+klikkaus lisää tai poistaa valinnan
      setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])
    } else {
      setSelectedIds([id])
    }
  }

  // Tallentaa muokatun tekstin elementtilistaan – tyhjä teksti korvataan oletusarvolla
  function commitTextEdit(newText) {
    if (!editingText) return
    commitChange(elements.map((el) =>
      el.id === editingText.id ? { ...el, text: newText || 'Teksti' } : el
    ))
    setEditingText(null)
  }

  // Valinta-tilassa normaalikursori, piirtotyökaluissa tähtäinkursori, välineillä plus-kursori
  // Animaatiotilassa: tähtäin kun pelaaja valittu (lisätään reittipisteitä), muuten osoitin
  // Elementit ovat aina raahattavia paitsi piirtotyökalujen aikana
  // Elementit aina raahattavia paitsi animaatiotilan aikana
  const draggable = activeTool !== 'animate'
  const cursor = activeTool === 'select' ? 'default'
    : activeTool === 'animate' ? (animSelectedId ? 'crosshair' : 'pointer')
    : DRAWING_TOOLS.includes(activeTool) ? 'crosshair'
    : 'cell'

  // Aloittaa ryhmäsiirron – tallentaa kaikkien valittujen elementtien lähtötilan
  function startGroupDrag(id) {
    if (selectedIds.length <= 1 || !selectedIds.includes(id)) return
    groupDragStartRef.current = {
      anchorId: id,
      ids: [...selectedIds],
      snapshot: elements.filter((el) => selectedIds.includes(el.id)),
    }
  }

  // Siirtää muita valittuja Konva-solmuja visuaalisesti vedon aikana (ennen tilan päivitystä)
  function syncGroupDragMove(e, id) {
    if (!groupDragStartRef.current || groupDragStartRef.current.anchorId !== id) return
    const anchorSnap = groupDragStartRef.current.snapshot.find((el) => el.id === id)
    if (!anchorSnap) return
    const dx = anchorSnap.x !== undefined && anchorSnap.x1 === undefined && !anchorSnap.points
      ? e.target.x() / scale - anchorSnap.x
      : e.target.x() / scale
    const dy = anchorSnap.x !== undefined && anchorSnap.x1 === undefined && !anchorSnap.points
      ? e.target.y() / scale - anchorSnap.y
      : e.target.y() / scale
    groupDragStartRef.current.ids.forEach((otherId) => {
      if (otherId === id) return
      const otherNode = stageRef.current.findOne(`#el_${otherId}`)
      const otherSnap = groupDragStartRef.current.snapshot.find((el) => el.id === otherId)
      if (!otherNode || !otherSnap) return
      const baseX = otherSnap.x ?? otherSnap.x1 ?? 0
      const baseY = otherSnap.y ?? otherSnap.y1 ?? 0
      otherNode.position({ x: (baseX + dx) * scale, y: (baseY + dy) * scale })
    })
  }

  // animActive vain animaatiotilassa — estää elementtien siirtymisen normaalissa muokkauksessa
  const animActive = activeTool === 'animate' && (isPlaying || animProgress > 0)

  return (
    <div
      ref={containerRef}
      className={styles.wrapper}
      onWheel={(e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          setZoom((z) => Math.max(0.5, Math.min(2, z - e.deltaY * 0.001)))
        }
      }}
    >
      <Stage
        ref={stageRef}
        width={stageWidth}
        height={stageHeight}
        scaleX={zoom}
        scaleY={zoom}
        style={{ cursor, display: 'block' }}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onMouseDown={(e) => handleMouseDown(e)}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={(e) => { e.evt.preventDefault(); handleMouseDown(e) }}
        onTouchMove={(e) => { e.evt.preventDefault(); handleMouseMove(e) }}
        onTouchEnd={(e) => { e.evt.preventDefault(); handleMouseUp(e) }}
      >
        <Layer>
          {/* Kenttätausta (nurmikuvio, viivat) */}
          <FieldBackground fieldType={fieldType} scale={scale} />

          {/* Animaatiopolkujen visualisointi – näytetään animaatiotilassa tai toiston aikana */}
          {(activeTool === 'animate' || animActive) &&
            elements.filter((el) => el.animPath?.length > 0).map((el) => {
              const isSelected = el.id === animSelectedId
              const fullPath = [{ x: el.x, y: el.y }, ...el.animPath]
              return (
                <Group key={`anim_path_${el.id}`} listening={false}>
                  {/* Katkoviiva polun varrella */}
                  <Line
                    points={fullPath.flatMap((p) => [p.x * scale, p.y * scale])}
                    stroke={isSelected ? '#1D9E75' : 'rgba(255,255,255,0.3)'}
                    strokeWidth={2 * scale}
                    dash={[6 * scale, 4 * scale]}
                  />
                  {/* Reittipistepisteet (hypätään yli aloituspisteestä) */}
                  {el.animPath.map((wp, i) => (
                    <Circle
                      key={i}
                      x={wp.x * scale} y={wp.y * scale}
                      radius={5 * scale}
                      fill={isSelected ? '#1D9E75' : 'rgba(255,255,255,0.45)'}
                      stroke="white" strokeWidth={scale}
                    />
                  ))}
                </Group>
              )
            })
          }

          {/* Vyöhykkeet ensin — ne kuuluvat kaikkien muiden elementtien taakse */}
          {elements.filter((el) => el.type === 'zone').map((el) => {
            const hex = DRAW_HEX[el.color] ?? el.color ?? '#3b82f6'
            return (
              <Rect
                key={el.id} id={`el_${el.id}`}
                x={el.x * scale} y={el.y * scale}
                width={el.width * scale} height={el.height * scale}
                fill={hex} opacity={0.28}
                stroke={hex} strokeWidth={1.5 * scale}
                draggable={draggable}
                onClick={(e) => selectEl(e, el.id)}
                onDragEnd={(e) => {
                  const nx = e.target.x() / scale
                  const ny = e.target.y() / scale
                  commitChange(elements.map((z) => z.id === el.id ? { ...z, x: nx, y: ny } : z))
                }}
              />
            )
          })}

          {/* Piirretään jokainen elementti sen tyypin mukaan */}
          {elements.filter((el) => el.type !== 'zone').map((el) => {
            // --- PELAAJA ---
            if (el.type === 'player') {
              const aPos = animActive ? getAnimatedPos(el, animProgressRef.current) : null
              // def_* = puolustaja (kolmio), muut = hyökkääjä/mv (ympyrä)
              const isDefender = el.team?.startsWith('def_')
              const colorKey = isDefender ? el.team.slice(4) : el.team
              const color = ROLE_COLORS[colorKey] ?? '#2563eb'
              const isGk = el.team === 'gk'
              const strokeW = isGk ? 2.5 * scale : 1.5 * scale
              // Pelaajan näyttötapa: 'number' | 'name' | 'jersey'
              const displayMode = toolOptions?.playerDisplayMode ?? 'number'
              // Pelaajan kokosuhde — muuta tätä skaalaamiseen
              const ps = 1.3
              // Kääntymispiste: täytetyn muodon (ympyrä/kolmio) keskikohta
              const pivotX = isDefender ? 10 * ps * scale : 8 * ps * scale
              return (
                <Group
                  key={el.id} id={`el_${el.id}`}
                  x={aPos ? aPos.x * scale : el.x * scale}
                  y={aPos ? aPos.y * scale : el.y * scale}
                  offsetX={pivotX}
                  draggable={draggable}
                  onClick={(e) => selectEl(e, el.id)}
                  onDblClick={() => { if (activeTool === 'select') setEditingPlayerLabel({ id: el.id, x: (aPos ? aPos.x : el.x) * scale, y: (aPos ? aPos.y : el.y) * scale, text: el.posLabel ?? '' }) }}
                  onDblTap={() => { if (activeTool === 'select') setEditingPlayerLabel({ id: el.id, x: (aPos ? aPos.x : el.x) * scale, y: (aPos ? aPos.y : el.y) * scale, text: el.posLabel ?? '' }) }}
                  onDragStart={() => startGroupDrag(el.id)}
                  onDragMove={(e) => syncGroupDragMove(e, el.id)}
                  onDragEnd={(e) => handleDragEnd(e, el.id)}
                  onWheel={(e) => handleWheel(e, el.id)}
                  rotation={el.rotation ?? 0}
                >
                  {displayMode === 'jersey' ? (
                    // Pelipaita – sama kaikille (hyökkääjä, puolustaja, mv)
                    <>
                      {/* Paidan vartalo */}
                      <Rect
                        x={-11 * scale} y={-14 * scale}
                        width={22 * scale} height={28 * scale}
                        fill={color} stroke="white" strokeWidth={strokeW}
                        cornerRadius={2 * scale}
                      />
                      {/* Vasen hiha */}
                      <Rect
                        x={-18 * scale} y={-14 * scale}
                        width={8 * scale} height={10 * scale}
                        fill={color} stroke="white" strokeWidth={strokeW}
                        cornerRadius={2 * scale}
                      />
                      {/* Oikea hiha */}
                      <Rect
                        x={10 * scale} y={-14 * scale}
                        width={8 * scale} height={10 * scale}
                        fill={color} stroke="white" strokeWidth={strokeW}
                        cornerRadius={2 * scale}
                      />
                      {/* Kaulus-viiva */}
                      <Line
                        points={[-6*scale, -14*scale, 6*scale, -14*scale]}
                        stroke="white" strokeWidth={2*scale} lineCap="round"
                      />
                    </>
                  ) : isDefender ? (
                    // Puolustaja – täytetty kolmio + avoin kaari
                    <>
                      <RegularPolygon
                        x={10 * ps * scale} y={0}
                        sides={3} radius={10 * ps * scale}
                        fill={color}
                        rotation={30}
                        stroke="white"
                        strokeWidth={2.5 * scale}
                      />
                      <Arc
                        innerRadius={14 * ps * scale}
                        outerRadius={16 * ps * scale}
                        angle={160}
                        rotation={-80}
                        fill="transparent"
                        stroke="white"
                        strokeWidth={2 * scale}
                      />
                    </>
                  ) : (
                    // Hyökkääjä – täytetty ympyrä + avoin kaari
                    <>
                      <Circle x={8 * ps * scale} y={0} radius={8 * ps * scale} fill={color} stroke="white" strokeWidth={isGk ? 3.5 * scale : 2.5 * scale} />
                      <Arc
                        innerRadius={14 * ps * scale}
                        outerRadius={16 * ps * scale}
                        angle={160}
                        rotation={-80}
                        fill="transparent"
                        stroke="white"
                        strokeWidth={2 * scale}
                      />
                    </>
                  )}
                  {/* Numero – näytetään vain jersey-tilassa */}
                  {displayMode === 'jersey' && (
                    <KonvaText
                      x={-9 * scale} y={-4 * scale}
                      text={String(el.number)}
                      fontSize={11 * scale} fill="white" fontStyle="bold"
                      width={18 * scale} height={14 * scale}
                      align="center" verticalAlign="middle"
                      listening={false}
                    />
                  )}
                  {/* Nimitagi – näytetään 'name' tilassa */}
                  {displayMode === 'name' && el.name && (
                    <Group y={16 * scale} listening={false}>
                      <Rect
                        x={-20 * scale} y={-6 * scale}
                        width={40 * scale} height={12 * scale}
                        fill="rgba(0,0,0,0.65)"
                        cornerRadius={3 * scale}
                      />
                      <KonvaText
                        x={-20 * scale} y={-6 * scale}
                        text={el.name.slice(0, 8)}
                        fontSize={8 * scale} fill="white"
                        width={40 * scale} height={12 * scale}
                        align="center" verticalAlign="middle"
                        listening={false}
                      />
                    </Group>
                  )}
                  {/* Positiotunniste pelaajan alla */}
                  {el.posLabel && (
                    <KonvaText
                      x={-16 * scale} y={14 * scale}
                      text={el.posLabel}
                      fontSize={9 * scale} fill="rgba(255,255,255,0.85)" fontStyle="bold"
                      width={32 * scale} align="center"
                      listening={false}
                    />
                  )}
                </Group>
              )
            }

            // --- VALMENTAJA ---
            if (el.type === 'coach') {
              const aPos = animActive ? getAnimatedPos(el, animProgressRef.current) : null
              return (
                <Group
                  key={el.id} id={`el_${el.id}`}
                  x={aPos ? aPos.x * scale : el.x * scale}
                  y={aPos ? aPos.y * scale : el.y * scale}
                  draggable={draggable}
                  onClick={(e) => selectEl(e, el.id)}
                  onDragStart={() => startGroupDrag(el.id)}
                  onDragMove={(e) => syncGroupDragMove(e, el.id)}
                  onDragEnd={(e) => handleDragEnd(e, el.id)}
                  onWheel={(e) => handleWheel(e, el.id)}
                  rotation={el.rotation ?? 0}
                >
                  {/* Harmaa neliö valmentajaa kuvaamaan */}
                  <Rect
                    x={-16 * scale} y={-16 * scale}
                    width={32 * scale} height={32 * scale}
                    fill="#475569" stroke="white" strokeWidth={1.5 * scale}
                    cornerRadius={4 * scale}
                  />
                  <KonvaText
                    text="V"
                    fontSize={14 * scale} fill="white" fontStyle="bold"
                    align="center" verticalAlign="middle"
                    width={32 * scale} height={32 * scale}
                    offsetX={16 * scale} offsetY={16 * scale}
                    listening={false}
                  />
                </Group>
              )
            }

            // --- PALLO (Select Diamond -tyyli) ---
            if (el.type === 'ball') {
              const s = scale
              const r = 9 * s
              const aPos = animActive ? getAnimatedPos(el, animProgressRef.current) : null
              return (
                <Group
                  key={el.id} id={`el_${el.id}`}
                  x={aPos ? aPos.x * s : el.x * s}
                  y={aPos ? aPos.y * s : el.y * s}
                  draggable={draggable}
                  onClick={(e) => selectEl(e, el.id)}
                  onDragStart={() => startGroupDrag(el.id)}
                  onDragMove={(e) => syncGroupDragMove(e, el.id)}
                  onDragEnd={(e) => handleDragEnd(e, el.id)}
                  onWheel={(e) => handleWheel(e, el.id)}
                >
                  {/* Läpinäkymätön hit-alue raahauksen ja klikkauksien vastaanottamiseen */}
                  <Circle radius={r} fill="transparent" />
                  {/* Varjo */}
                  <Circle radius={r} x={1.5 * s} y={2 * s} fill="rgba(0,0,0,0.22)" listening={false} />
                  {/* Pallon pinta leikattu ympyrälle */}
                  <Group clipFunc={(ctx) => { ctx.arc(0, 0, r, 0, Math.PI * 2) }} listening={false}>
                    {/* Valkoinen pohja 3D-gradientilla */}
                    <Circle
                      radius={r}
                      fillRadialGradientStartPoint={{ x: -r * 0.35, y: -r * 0.38 }}
                      fillRadialGradientEndPoint={{ x: r * 0.05, y: r * 0.05 }}
                      fillRadialGradientStartRadius={0}
                      fillRadialGradientEndRadius={r * 1.15}
                      fillRadialGradientColorStops={[0, '#ffffff', 0.45, '#f0f0f0', 1, '#c4c4c4']}
                    />
                    {/* 5 tummaa ovaalia — Select Diamond -kuviointi */}
                    {BALL_PANEL_DEGS.map((deg, i) => {
                      const rad = (deg - 90) * (Math.PI / 180)
                      return (
                        <Ellipse
                          key={i}
                          x={Math.cos(rad) * 3.6 * s}
                          y={Math.sin(rad) * 3.6 * s}
                          radiusX={2.4 * s}
                          radiusY={6.8 * s}
                          fill="#0f1a3a"
                          rotation={deg + 18}
                        />
                      )
                    })}
                  </Group>
                  {/* Reunaviiva */}
                  <Circle radius={r} stroke="#44556a" strokeWidth={0.8 * s} listening={false} />
                  {/* Spekulaarinen highlight */}
                  <Circle
                    radius={r * 0.22} x={-r * 0.32} y={-r * 0.32}
                    fill="rgba(255,255,255,0.7)" listening={false}
                  />
                </Group>
              )
            }

            // --- TÖTSÄ — oranssi rengas ---
            if (el.type === 'cone') {
              const colors = CONE_HEX[el.color ?? 'orange'] ?? CONE_HEX.orange
              return (
                <Ring
                  key={el.id} id={`el_${el.id}`}
                  x={el.x * scale} y={el.y * scale}
                  innerRadius={5 * scale} outerRadius={9 * scale}
                  fill={colors.fill}
                  draggable={draggable}
                  onClick={(e) => selectEl(e, el.id)}
                  onDragEnd={(e) => handleDragEnd(e, el.id)}
                  onWheel={(e) => handleWheel(e, el.id)}
                />
              )
            }

            // --- KEPPI ---
            if (el.type === 'pole') {
              const poleColors = CONE_HEX[el.color ?? 'yellow'] ?? CONE_HEX.yellow
              return (
                <Rect
                  key={el.id} id={`el_${el.id}`}
                  x={el.x * scale} y={el.y * scale}
                  width={5 * scale} height={36 * scale}
                  offsetX={2.5 * scale} offsetY={18 * scale}
                  fill={poleColors.fill} stroke={poleColors.stroke} strokeWidth={0.5 * scale}
                  cornerRadius={2 * scale}
                  rotation={el.rotation ?? 0}
                  draggable={draggable}
                  onClick={(e) => selectEl(e, el.id)}
                  onDragEnd={(e) => handleDragEnd(e, el.id)}
                  onWheel={(e) => handleWheel(e, el.id)}
                />
              )
            }

            // --- PIENI MAALI ---
            if (el.type === 'smallgoal') {
              const w = 60, d = 24, bar = 4
              const iw = w - 2 * bar  // sisäleveys
              const id = d - bar      // sisäsyvyys
              const netStep = 10
              return (
                <Group
                  key={el.id} id={`el_${el.id}`}
                  x={el.x * scale} y={el.y * scale}
                  rotation={el.rotation ?? 0}
                  scaleX={el.scaleX ?? 1} scaleY={el.scaleY ?? 1}
                  draggable={draggable}
                  onClick={(e) => selectEl(e, el.id)}
                  onDragEnd={(e) => handleDragEnd(e, el.id)}
                  onTransformEnd={(e) => handleTransformEnd(e, el.id)}
                  onWheel={(e) => handleWheel(e, el.id)}
                >
                  {/* Verkon täyttö */}
                  <Rect x={(-w/2+bar)*scale} y={(-d/2+bar)*scale} width={iw*scale} height={id*scale} fill="rgba(255,255,255,0.10)" />
                  {/* Verkon pystyviivat */}
                  {Array.from({ length: Math.floor(iw / netStep) - 1 }, (_, i) => (
                    <Line key={`v${i}`}
                      points={[(-w/2+bar+netStep*(i+1))*scale, (-d/2+bar)*scale, (-w/2+bar+netStep*(i+1))*scale, (d/2)*scale]}
                      stroke="rgba(255,255,255,0.3)" strokeWidth={0.6*scale} />
                  ))}
                  {/* Verkon vaakaviivat */}
                  {Array.from({ length: Math.floor(id / netStep) }, (_, i) => (
                    <Line key={`h${i}`}
                      points={[(-w/2+bar)*scale, (-d/2+bar+netStep*(i+1))*scale, (w/2-bar)*scale, (-d/2+bar+netStep*(i+1))*scale]}
                      stroke="rgba(255,255,255,0.3)" strokeWidth={0.6*scale} />
                  ))}
                  {/* Tolpat ja poikkitanko */}
                  <Rect x={(-w/2)*scale} y={(-d/2)*scale} width={w*scale} height={bar*scale} fill="white" cornerRadius={scale} />
                  <Rect x={(-w/2)*scale} y={(-d/2)*scale} width={bar*scale} height={d*scale} fill="white" cornerRadius={scale} />
                  <Rect x={(w/2-bar)*scale} y={(-d/2)*scale} width={bar*scale} height={d*scale} fill="white" cornerRadius={scale} />
                </Group>
              )
            }

            // --- MAALI ---
            if (el.type === 'goal') {
              const w = 110, d = 36, bar = 5
              const iw = w - 2 * bar
              const id = d - bar
              const netStepX = 14, netStepY = 12
              return (
                <Group
                  key={el.id} id={`el_${el.id}`}
                  x={el.x * scale} y={el.y * scale}
                  rotation={el.rotation ?? 0}
                  scaleX={el.scaleX ?? 1} scaleY={el.scaleY ?? 1}
                  draggable={draggable}
                  onClick={(e) => selectEl(e, el.id)}
                  onDragEnd={(e) => handleDragEnd(e, el.id)}
                  onTransformEnd={(e) => handleTransformEnd(e, el.id)}
                  onWheel={(e) => handleWheel(e, el.id)}
                >
                  {/* Verkon täyttö */}
                  <Rect x={(-w/2+bar)*scale} y={(-d/2+bar)*scale} width={iw*scale} height={id*scale} fill="rgba(255,255,255,0.10)" />
                  {/* Verkon pystyviivat */}
                  {Array.from({ length: Math.floor(iw / netStepX) - 1 }, (_, i) => (
                    <Line key={`v${i}`}
                      points={[(-w/2+bar+netStepX*(i+1))*scale, (-d/2+bar)*scale, (-w/2+bar+netStepX*(i+1))*scale, (d/2)*scale]}
                      stroke="rgba(255,255,255,0.3)" strokeWidth={0.7*scale} />
                  ))}
                  {/* Verkon vaakaviivat */}
                  {Array.from({ length: Math.floor(id / netStepY) }, (_, i) => (
                    <Line key={`h${i}`}
                      points={[(-w/2+bar)*scale, (-d/2+bar+netStepY*(i+1))*scale, (w/2-bar)*scale, (-d/2+bar+netStepY*(i+1))*scale]}
                      stroke="rgba(255,255,255,0.3)" strokeWidth={0.7*scale} />
                  ))}
                  {/* Tolpat ja poikkitanko */}
                  <Rect x={(-w/2)*scale} y={(-d/2)*scale} width={w*scale} height={bar*scale} fill="white" cornerRadius={scale} />
                  <Rect x={(-w/2)*scale} y={(-d/2)*scale} width={bar*scale} height={d*scale} fill="white" cornerRadius={scale} />
                  <Rect x={(w/2-bar)*scale} y={(-d/2)*scale} width={bar*scale} height={d*scale} fill="white" cornerRadius={scale} />
                </Group>
              )
            }

            // --- TIKKAAT ---
            if (el.type === 'ladder') {
              const w = 32, h = 110, rail = 4, rung = 3
              const rungs = [-40, -20, 0, 20, 40] // poikkitankojen y-offsetit
              return (
                <Group
                  key={el.id} id={`el_${el.id}`}
                  x={el.x * scale} y={el.y * scale}
                  rotation={el.rotation ?? 0}
                  scaleX={el.scaleX ?? 1} scaleY={el.scaleY ?? 1}
                  draggable={draggable}
                  onClick={(e) => selectEl(e, el.id)}
                  onDragEnd={(e) => handleDragEnd(e, el.id)}
                  onTransformEnd={(e) => handleTransformEnd(e, el.id)}
                  onWheel={(e) => handleWheel(e, el.id)}
                >
                  {/* Vasemman ja oikean kaiteen pitkät palkit */}
                  <Rect x={(-w/2)*scale} y={(-h/2)*scale} width={rail*scale} height={h*scale} fill="#fbbf24" cornerRadius={scale} />
                  <Rect x={(w/2-rail)*scale} y={(-h/2)*scale} width={rail*scale} height={h*scale} fill="#fbbf24" cornerRadius={scale} />
                  {/* Vaakasuorat poikkitangot */}
                  {rungs.map((ry, i) => (
                    <Rect key={i} x={(-w/2+rail)*scale} y={(ry-rung/2)*scale} width={(w-rail*2)*scale} height={rung*scale} fill="#fbbf24" />
                  ))}
                </Group>
              )
            }

            // --- AITA ---
            if (el.type === 'hurdle') {
              const w = 70, barY = -8, legH = 20, footW = 14
              return (
                <Group
                  key={el.id} id={`el_${el.id}`}
                  x={el.x * scale} y={el.y * scale}
                  rotation={el.rotation ?? 0}
                  scaleX={el.scaleX ?? 1} scaleY={el.scaleY ?? 1}
                  draggable={draggable}
                  onClick={(e) => selectEl(e, el.id)}
                  onDragEnd={(e) => handleDragEnd(e, el.id)}
                  onTransformEnd={(e) => handleTransformEnd(e, el.id)}
                  onWheel={(e) => handleWheel(e, el.id)}
                >
                  {/* Yläpalkki, vasen jalka, oikea jalka, vasemman jalan jalusta, oikean jalan jalusta */}
                  <Rect x={(-w/2)*scale} y={barY*scale} width={w*scale} height={4*scale} fill="white" cornerRadius={scale} />
                  <Rect x={(-w/2)*scale} y={barY*scale} width={4*scale} height={legH*scale} fill="white" cornerRadius={scale} />
                  <Rect x={(w/2-4)*scale} y={barY*scale} width={4*scale} height={legH*scale} fill="white" cornerRadius={scale} />
                  <Rect x={(-w/2-4)*scale} y={(barY+legH-3)*scale} width={footW*scale} height={4*scale} fill="white" cornerRadius={scale} />
                  <Rect x={(w/2-footW+4)*scale} y={(barY+legH-3)*scale} width={footW*scale} height={4*scale} fill="white" cornerRadius={scale} />
                </Group>
              )
            }

            // --- MANNEKIINI ---
            if (el.type === 'mannequin') {
              return (
                <Group
                  key={el.id} id={`el_${el.id}`}
                  x={el.x * scale} y={el.y * scale}
                  rotation={el.rotation ?? 0}
                  scaleX={el.scaleX ?? 1} scaleY={el.scaleY ?? 1}
                  draggable={draggable}
                  onClick={(e) => selectEl(e, el.id)}
                  onDragEnd={(e) => handleDragEnd(e, el.id)}
                  onTransformEnd={(e) => handleTransformEnd(e, el.id)}
                  onWheel={(e) => handleWheel(e, el.id)}
                >
                  {/* Pää */}
                  <Circle radius={7 * scale} y={-26 * scale} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={1.5 * scale} />
                  {/* Vartalo */}
                  <Rect x={-3 * scale} y={-18 * scale} width={6 * scale} height={20 * scale} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={1 * scale} cornerRadius={2 * scale} />
                  {/* Kädet (vaaka) */}
                  <Rect x={-18 * scale} y={-16 * scale} width={36 * scale} height={5 * scale} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={1 * scale} cornerRadius={2 * scale} />
                  {/* Vasen jalka */}
                  <Rect x={-8 * scale} y={2 * scale} width={5 * scale} height={18 * scale} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={1 * scale} cornerRadius={2 * scale} />
                  {/* Oikea jalka */}
                  <Rect x={3 * scale} y={2 * scale} width={5 * scale} height={18 * scale} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={1 * scale} cornerRadius={2 * scale} />
                </Group>
              )
            }

            // --- KOORDINAATIORENGAS ---
            if (el.type === 'hoop') {
              return (
                <Group
                  key={el.id} id={`el_${el.id}`}
                  x={el.x * scale} y={el.y * scale}
                  rotation={el.rotation ?? 0}
                  scaleX={el.scaleX ?? 1} scaleY={el.scaleY ?? 1}
                  draggable={draggable}
                  onClick={(e) => selectEl(e, el.id)}
                  onDragEnd={(e) => handleDragEnd(e, el.id)}
                  onTransformEnd={(e) => handleTransformEnd(e, el.id)}
                  onWheel={(e) => handleWheel(e, el.id)}
                >
                  <Circle radius={20 * scale} stroke="#fbbf24" strokeWidth={5 * scale} fill="rgba(251,191,36,0.12)" />
                </Group>
              )
            }

            // --- PIENKENTTÄ ---
            if (el.type === 'minifield') {
              const fw = 160, fh = 100, bar = 3
              return (
                <Group
                  key={el.id} id={`el_${el.id}`}
                  x={el.x * scale} y={el.y * scale}
                  rotation={el.rotation ?? 0}
                  scaleX={el.scaleX ?? 1} scaleY={el.scaleY ?? 1}
                  draggable={draggable}
                  onClick={(e) => selectEl(e, el.id)}
                  onDragEnd={(e) => handleDragEnd(e, el.id)}
                  onTransformEnd={(e) => handleTransformEnd(e, el.id)}
                  onWheel={(e) => handleWheel(e, el.id)}
                >
                  {/* Nurmi */}
                  <Rect x={(-fw/2)*scale} y={(-fh/2)*scale} width={fw*scale} height={fh*scale} fill="#2d5a27" cornerRadius={2*scale} />
                  {/* Reunaviiva */}
                  <Rect x={(-fw/2)*scale} y={(-fh/2)*scale} width={fw*scale} height={fh*scale} stroke="rgba(255,255,255,0.75)" strokeWidth={bar*scale} fill="transparent" cornerRadius={2*scale} />
                  {/* Keskiviiva */}
                  <Line points={[0, (-fh/2)*scale, 0, (fh/2)*scale]} stroke="rgba(255,255,255,0.75)" strokeWidth={bar*scale} />
                  {/* Vasen maali */}
                  <Line points={[(-fw/2)*scale, (-fh/6)*scale, (-fw/2)*scale, (fh/6)*scale]} stroke="#fbbf24" strokeWidth={4*scale} lineCap="round" />
                  {/* Oikea maali */}
                  <Line points={[(fw/2)*scale, (-fh/6)*scale, (fw/2)*scale, (fh/6)*scale]} stroke="#fbbf24" strokeWidth={4*scale} lineCap="round" />
                </Group>
              )
            }

            // --- KOLMIO ---
            if (el.type === 'triangle') {
              const väri = DRAW_HEX[el.color ?? 'white'] ?? '#f1f5f9'
              return (
                <RegularPolygon
                  key={el.id} id={`el_${el.id}`}
                  x={el.x * scale} y={el.y * scale}
                  sides={3} radius={el.radius * scale}
                  stroke={väri} strokeWidth={2.5 * scale} fill="transparent"
                  rotation={el.rotation ?? 0}
                  draggable={draggable}
                  onClick={(e) => selectEl(e, el.id)}
                  onDragEnd={(e) => handleDragEnd(e, el.id)}
                  onWheel={(e) => handleWheel(e, el.id)}
                />
              )
            }

            // --- VIIVA ---
            if (el.type === 'line') {
              const väri = DRAW_HEX[el.color ?? 'white'] ?? '#f1f5f9'
              return (
                <Group key={el.id} id={`el_${el.id}`} draggable={draggable}
                  onClick={(e) => selectEl(e, el.id)}
                  onDragEnd={(e) => handleArrowDragEnd(e, el.id)}
                >
                  {/* Näkyvä viiva */}
                  <Line points={[el.x1*scale, el.y1*scale, el.x2*scale, el.y2*scale]}
                    stroke={väri} strokeWidth={2.5*scale} lineCap="round" listening={false} />
                  {/* Näkymätön leveämpi viiva – helpottaa viivan valitsemista */}
                  <Line points={[el.x1*scale, el.y1*scale, el.x2*scale, el.y2*scale]}
                    stroke="transparent" strokeWidth={20*scale} hitStrokeWidth={20*scale} />
                </Group>
              )
            }

            // --- YMPYRÄ ---
            if (el.type === 'circle') {
              const väri = DRAW_HEX[el.color ?? 'white'] ?? '#f1f5f9'
              return (
                <Circle key={el.id} id={`el_${el.id}`}
                  x={el.x*scale} y={el.y*scale} radius={el.radius*scale}
                  stroke={väri} strokeWidth={2.5*scale} fill="transparent"
                  draggable={draggable}
                  onClick={(e) => selectEl(e, el.id)}
                  onDragEnd={(e) => handleDragEnd(e, el.id)}
                />
              )
            }

            // --- VAPAAPIIRTO ---
            if (el.type === 'freehand') {
              const väri = DRAW_HEX[el.color ?? 'white'] ?? '#f1f5f9'
              // Skaalataan kaikki pisteet kerralla ennen renderöintiä
              const skaalatuPisteet = el.points.map((v) => v * scale)
              return (
                <Group key={el.id} id={`el_${el.id}`} draggable={draggable}
                  onClick={(e) => selectEl(e, el.id)}
                  onDragStart={() => startGroupDrag(el.id)}
                  onDragMove={(e) => syncGroupDragMove(e, el.id)}
                  onDragEnd={(e) => {
                    const dx = e.target.x() / scale
                    const dy = e.target.y() / scale
                    if (selectedIds.includes(el.id) && selectedIds.length > 1) {
                      commitChange(elements.map((elem) =>
                        selectedIds.includes(elem.id) ? moveElementByDelta(elem, dx, dy) : elem
                      ))
                      groupDragStartRef.current = null
                      e.target.position({ x: 0, y: 0 })
                      return
                    }
                    commitChange(elements.map((elem) =>
                      elem.id === el.id
                        ? { ...elem, points: elem.points.map((v, i) => i % 2 === 0 ? v + dx : v + dy) }
                        : elem
                    ))
                    e.target.position({ x: 0, y: 0 })
                  }}
                >
                  {/* Näkyvä vapaapiirtokäyrä */}
                  <Line points={skaalatuPisteet} stroke={väri} strokeWidth={2.5*scale}
                    lineCap="round" lineJoin="round" tension={0.4} listening={false} />
                  {/* Leveämpi näkymätön alue – helpottaa valitsemista */}
                  <Line points={skaalatuPisteet} stroke="transparent"
                    strokeWidth={20*scale} hitStrokeWidth={20*scale} tension={0.4} />
                </Group>
              )
            }

            // --- VAPAA NUOLI ---
            if (el.type === 'freearrow') {
              const skaalatuPisteet = el.points.map((v) => v * scale)
              const head = getFreeArrowHead(el.points, scale)
              return (
                <Group key={el.id} id={`el_${el.id}`} draggable={draggable}
                  onClick={(e) => selectEl(e, el.id)}
                  onDragStart={() => startGroupDrag(el.id)}
                  onDragMove={(e) => syncGroupDragMove(e, el.id)}
                  onDragEnd={(e) => {
                    const dx = e.target.x() / scale
                    const dy = e.target.y() / scale
                    if (selectedIds.includes(el.id) && selectedIds.length > 1) {
                      commitChange(elements.map((elem) =>
                        selectedIds.includes(elem.id) ? moveElementByDelta(elem, dx, dy) : elem
                      ))
                      groupDragStartRef.current = null
                      e.target.position({ x: 0, y: 0 })
                      return
                    }
                    commitChange(elements.map((elem) =>
                      elem.id === el.id
                        ? { ...elem, points: elem.points.map((v, i) => i % 2 === 0 ? v + dx : v + dy) }
                        : elem
                    ))
                    e.target.position({ x: 0, y: 0 })
                  }}
                >
                  <Line points={skaalatuPisteet} stroke="white" strokeWidth={2.5*scale}
                    lineCap="round" lineJoin="round" tension={0.4} listening={false} />
                  {head && <Line points={head} stroke="white" strokeWidth={2.5*scale}
                    lineCap="round" lineJoin="round" listening={false} />}
                  {/* Leveämpi näkymätön alue valitsemisen helpottamiseksi */}
                  <Line points={skaalatuPisteet} stroke="transparent"
                    strokeWidth={20*scale} hitStrokeWidth={20*scale} tension={0.4} />
                </Group>
              )
            }

            // --- NUOLI ---
            if (el.type === 'arrow') {
              const arrowType = el.arrowType ?? 'syotto'
              const st = getArrowStyle(arrowType, scale)
              // Kuljetusnuoli käyttää aaltoviivapisteitä, kaareva bezier-käyrää, muut suoraa viivaa
              const pts = arrowType === 'kuljetus'
                ? getKuljetusPoints(el.x1, el.y1, el.x2, el.y2, scale)
                : arrowType === 'kaareva'
                ? getKaarvaPoints(el.x1, el.y1, el.x2, el.y2, scale)
                : [el.x1 * scale, el.y1 * scale, el.x2 * scale, el.y2 * scale]
              return (
                <Group
                  key={el.id} id={`el_${el.id}`}
                  draggable={draggable}
                  onClick={(e) => selectEl(e, el.id)}
                  onDragEnd={(e) => handleArrowDragEnd(e, el.id)}
                >
                  <Arrow
                    points={pts}
                    stroke={st.stroke} fill={st.fill}
                    strokeWidth={st.strokeWidth}
                    dash={arrowType === 'kuljetus' ? [6 * scale, 4 * scale] : (st.dash ?? undefined)}
                    pointerLength={st.pLen} pointerWidth={st.pWidth}
                    pointerAtBeginning={arrowType === 'bidir'}
                    listening={false}
                  />
                  {/* Leveämpi näkymätön viiva nuolen valitsemisen helpottamiseksi */}
                  <Line
                    points={[el.x1 * scale, el.y1 * scale, el.x2 * scale, el.y2 * scale]}
                    stroke="transparent" strokeWidth={20 * scale} hitStrokeWidth={20 * scale}
                  />
                </Group>
              )
            }

            // --- TEKSTI ---
            if (el.type === 'text') {
              return (
                <KonvaText
                  key={el.id} id={`el_${el.id}`}
                  x={el.x * scale} y={el.y * scale}
                  text={el.text} fontSize={15 * scale}
                  fill="white" fontStyle="bold"
                  shadowColor="black" shadowBlur={4} shadowOpacity={0.8}
                  draggable={draggable}
                  onClick={(e) => selectEl(e, el.id)}
                  // Kaksoisklikkaus tai -napautus avaa tekstieditorin
                  onDblClick={() => setEditingText({ id: el.id, x: el.x * scale, y: el.y * scale, text: el.text })}
                  onDblTap={() => setEditingText({ id: el.id, x: el.x * scale, y: el.y * scale, text: el.text })}
                  onDragEnd={(e) => handleDragEnd(e, el.id)}
                />
              )
            }

            return null
          })}

          {/* Piirtoesikatselut – näytetään piirtämisen aikana ennen tallennusta */}
          {drawingArrow && (
            <Arrow
              points={[drawingArrow.x1*scale, drawingArrow.y1*scale, drawingArrow.x2*scale, drawingArrow.y2*scale]}
              stroke="rgba(255,255,255,0.55)" strokeWidth={2.5*scale} fill="rgba(255,255,255,0.55)"
              pointerLength={10*scale} pointerWidth={8*scale}
              dash={[6*scale, 4*scale]} listening={false}
            />
          )}
          {drawingShape?.type === 'line' && (
            <Line
              points={[drawingShape.x1*scale, drawingShape.y1*scale, drawingShape.x2*scale, drawingShape.y2*scale]}
              stroke="rgba(255,255,255,0.55)" strokeWidth={2.5*scale} lineCap="round" listening={false}
            />
          )}
          {drawingShape?.type === 'circle' && (() => {
            const dx = drawingShape.x2 - drawingShape.x1
            const dy = drawingShape.y2 - drawingShape.y1
            return (
              <Circle
                x={drawingShape.x1*scale} y={drawingShape.y1*scale}
                radius={Math.sqrt(dx*dx + dy*dy) * scale}
                stroke="rgba(255,255,255,0.55)" strokeWidth={2.5*scale} fill="transparent" listening={false}
              />
            )
          })()}
          {drawingShape?.type === 'freehand' && drawingShape.points.length >= 4 && (
            <Line
              points={drawingShape.points.map((v) => v * scale)}
              stroke="rgba(255,255,255,0.55)" strokeWidth={2.5*scale}
              lineCap="round" lineJoin="round" tension={0.4} listening={false}
            />
          )}
          {drawingShape?.type === 'freearrow' && drawingShape.points.length >= 4 && (() => {
            const head = getFreeArrowHead(drawingShape.points, scale)
            return (
              <>
                <Line
                  points={drawingShape.points.map((v) => v * scale)}
                  stroke="rgba(255,255,255,0.55)" strokeWidth={2.5*scale}
                  lineCap="round" lineJoin="round" tension={0.4} listening={false}
                />
                {head && <Line points={head} stroke="rgba(255,255,255,0.55)" strokeWidth={2.5*scale}
                  lineCap="round" lineJoin="round" listening={false} />}
              </>
            )
          })()}

          {/* Vyöhykkeen esikatselu piirtäessä */}
          {drawingShape?.type === 'zone' && (() => {
            const zx = Math.min(drawingShape.x1, drawingShape.x2) * scale
            const zy = Math.min(drawingShape.y1, drawingShape.y2) * scale
            const zw = Math.abs(drawingShape.x2 - drawingShape.x1) * scale
            const zh = Math.abs(drawingShape.y2 - drawingShape.y1) * scale
            const hex = DRAW_HEX[toolOptions?.drawColor ?? 'blue'] ?? '#3b82f6'
            return (
              <Rect
                x={zx} y={zy} width={zw} height={zh}
                fill={hex} opacity={0.28}
                stroke={hex} strokeWidth={1.5 * scale} listening={false}
              />
            )
          })()}

          {/* Kolmion esikatselu piirtäessä */}
          {drawingShape?.type === 'triangle' && (() => {
            const dx = drawingShape.x2 - drawingShape.x1
            const dy = drawingShape.y2 - drawingShape.y1
            const radius = Math.sqrt(dx * dx + dy * dy)
            return (
              <RegularPolygon
                x={drawingShape.x1 * scale} y={drawingShape.y1 * scale}
                sides={3} radius={radius * scale}
                stroke="rgba(255,255,255,0.55)" strokeWidth={2.5 * scale} fill="transparent" listening={false}
              />
            )
          })()}

          {/* Kumilankahaku-suorakulmio */}
          {selectionRect && (
            <Rect
              x={selectionRect.x} y={selectionRect.y}
              width={selectionRect.w} height={selectionRect.h}
              fill="rgba(59,130,246,0.08)"
              stroke="#3b82f6" strokeWidth={1}
              dash={[4, 3]} listening={false}
            />
          )}

          {/* Transformer – näyttää kahvat ja sallii kierron ja skaalauksen valitulle elementille */}
          <Transformer
            ref={trRef} rotateEnabled={true}
            borderStroke="#3b82f6" borderStrokeWidth={1.5}
            anchorFill="#3b82f6" anchorStroke="#1d4ed8" anchorSize={8}
            boundBoxFunc={(oldBox, newBox) => newBox.width < 10 || newBox.height < 10 ? oldBox : newBox}
          />
        </Layer>
      </Stage>

      {/* Tyhjän kentän ohjeteksti – häviää kun elementtejä lisätään */}
      {elements.length === 0 && activeTool !== 'animate' && (
        <div className={styles.emptyHint}>
          <div className={styles.emptyHintText}>
            Vedä elementtejä vasemmalta<br />tai klikkaa kenttää
          </div>
        </div>
      )}

      {/* Zoom-kontrollit */}
      <div className={styles.zoomControls}>
        <button className={styles.zoomBtn} onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}>−</button>
        <span className={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
        <button className={styles.zoomBtn} onClick={() => setZoom((z) => Math.min(2, z + 0.1))}>+</button>
      </div>

      {/* ── ANIMAATIOKONTROLLIT – näytetään animaatiotilassa ── */}
      {activeTool === 'animate' && (
        <div className={styles.animControls}>
          {/* Toistopainikkeet */}
          <div className={styles.animBtns}>
            <button className={styles.animBtn} onClick={resetAnim} title="Alusta">⏮</button>
            <button
              className={`${styles.animBtn} ${styles.animBtnPlay}`}
              onClick={isPlaying ? pauseAnim : playAnim}
              title={isPlaying ? 'Tauko' : 'Toista'}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
          </div>

          {/* Aikajanaliukuri */}
          <div className={styles.animScrubberWrap}>
            <div className={styles.animProgressFill} style={{ width: `${animProgress * 100}%` }} />
            <input
              type="range" min={0} max={1} step={0.001}
              value={animProgress}
              onChange={(e) => {
                const p = parseFloat(e.target.value)
                pauseAnim()
                animProgressRef.current = p
                // Päivitä nodet heti skrubbauksen yhteydessä
                if (stageRef.current) {
                  elements.forEach((el) => {
                    if (!['player', 'coach', 'ball'].includes(el.type)) return
                    const aPos = getAnimatedPos(el, p)
                    if (!aPos) return
                    const node = stageRef.current.findOne(`#el_${el.id}`)
                    if (node) { node.x(aPos.x * scale); node.y(aPos.y * scale) }
                  })
                  stageRef.current.getLayers()[0]?.batchDraw()
                }
              }}
              className={styles.animScrubber}
            />
          </div>

          {/* Ohjeteksti polun muokkaukseen */}
          <div className={styles.animHint}>
            {animSelectedId
              ? <>
                  Klikkaa kentällä lisätäksesi reittipiste &nbsp;·&nbsp;
                  <button
                    className={styles.animClearBtn}
                    onClick={() => onChange(elements.map((el) =>
                      el.id === animSelectedId ? { ...el, animPath: [] } : el
                    ))}
                  >
                    Tyhjennä polku
                  </button>
                </>
              : 'Klikkaa pelaajaa, valmentajaa tai palloa muokataksesi polkua'
            }
          </div>
        </div>
      )}

      {/* Poista-nappi – näytetään valitun elementin Transformerin oikeassa yläkulmassa */}
      {deleteBtnPos && selectedIds.length > 0 && activeTool === 'select' && (
        <button
          className={styles.deleteBtn}
          style={{ left: deleteBtnPos.x, top: deleteBtnPos.y }}
          onMouseDown={(e) => { e.stopPropagation(); deleteSelected() }}
          title="Poista"
        >×</button>
      )}

      {/* Tekstieditori – HTML textarea Konva-elementin päällä, sijoitettu absoluuttisesti */}
      {editingText && (
        <textarea
          className={styles.textEditor}
          style={{ left: editingText.x, top: editingText.y }}
          defaultValue={editingText.text}
          autoFocus
          onFocus={(e) => e.target.select()} // Valitaan koko teksti heti kun editori aukeaa
          onBlur={(e) => commitTextEdit(e.target.value.trim())}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) e.target.blur() // Enter tallentaa (ilman Shift)
            if (e.key === 'Escape') setEditingText(null)           // Escape peruuttaa muokkauksen
          }}
        />
      )}

      {/* Positiotunnisteeditori – pelaajan päälle avautuva pieni syöttökenttä */}
      {editingPlayerLabel && (
        <input
          className={styles.textEditor}
          style={{ left: editingPlayerLabel.x - 16 * scale, top: editingPlayerLabel.y + 14 * scale, width: 40, fontSize: 11, padding: '2px 4px' }}
          defaultValue={editingPlayerLabel.text}
          maxLength={4}
          autoFocus
          onFocus={(e) => e.target.select()}
          onBlur={(e) => {
            const label = e.target.value.trim().toUpperCase()
            commitChange(elements.map((el) => el.id === editingPlayerLabel.id ? { ...el, posLabel: label || undefined } : el))
            setEditingPlayerLabel(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.target.blur()
            if (e.key === 'Escape') setEditingPlayerLabel(null)
          }}
        />
      )}
    </div>
  )
})

export default DrillCanvas
